"""
Watchdog Lambda Handler

Invoked by EventBridge Scheduler to check workflow completion and trigger resume if needed.

Responsibilities:
1. Check workflow status in DynamoDB
2. If not completed: queue RESUME message to SQS
3. Create next watchdog schedule for subsequent check
4. Enforce MAX_RETRIES limit
"""

import json
import os
from datetime import datetime, timedelta, timezone
from typing import Dict, Any
import boto3

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
sqs = boto3.client('sqs')
scheduler = boto3.client('scheduler')

# Environment variables
WORKFLOW_TABLE_NAME = os.environ['WORKFLOW_TABLE_NAME']
WORK_QUEUE_URL = os.environ['WORK_QUEUE_URL']
# Note: WATCHDOG_LAMBDA_ARN obtained from Lambda context at runtime (context.invoked_function_arn)
SCHEDULER_ROLE_ARN = os.environ['SCHEDULER_ROLE_ARN']
SCHEDULE_GROUP_NAME = os.environ['SCHEDULE_GROUP_NAME']
MAX_RETRIES = int(os.environ.get('MAX_RETRIES', 3))
WATCHDOG_DELAY_MINUTES = int(os.environ.get('WATCHDOG_DELAY_MINUTES', 65))


def get_workflow(workflow_id: str) -> Dict[str, Any] | None:
    """
    Retrieve workflow record from DynamoDB.

    Args:
        workflow_id: The workflow identifier

    Returns:
        Workflow item dict or None if not found
    """
    table = dynamodb.Table(WORKFLOW_TABLE_NAME)

    try:
        response = table.get_item(Key={'workflow_id': workflow_id})
        return response.get('Item')
    except Exception as e:
        print(f"Error getting workflow {workflow_id}: {e}")
        raise


def mark_workflow_failed(workflow_id: str, error_message: str) -> None:
    """
    Mark workflow as FAILED in DynamoDB.

    Args:
        workflow_id: The workflow identifier
        error_message: Reason for failure
    """
    table = dynamodb.Table(WORKFLOW_TABLE_NAME)
    timestamp = datetime.now(timezone.utc).isoformat()

    table.update_item(
        Key={'workflow_id': workflow_id},
        UpdateExpression='SET #status = :status, updated_at = :ts, error_message = :err',
        ExpressionAttributeNames={'#status': 'status'},
        ExpressionAttributeValues={
            ':status': 'FAILED',
            ':ts': timestamp,
            ':err': error_message
        }
    )
    print(f"Marked workflow {workflow_id} as FAILED: {error_message}")


def queue_resume_message(workflow_id: str, repo: str, retry_count: int) -> None:
    """
    Send RESUME message to SQS Work Queue.

    Args:
        workflow_id: The workflow identifier
        repo: Repository in owner/repo format (for FIFO grouping)
        retry_count: Current retry count
    """
    message_body = json.dumps({
        'workflow_id': workflow_id,
        'action': 'RESUME'
    })

    # Use repo-based grouping (same as original START message)
    message_group_id = repo.replace('/', '-')

    # Use unique deduplication ID including retry count
    message_deduplication_id = f"{workflow_id}-resume-{retry_count}"

    sqs.send_message(
        QueueUrl=WORK_QUEUE_URL,
        MessageBody=message_body,
        MessageGroupId=message_group_id,
        MessageDeduplicationId=message_deduplication_id
    )
    print(f"Queued RESUME message for workflow {workflow_id} (retry {retry_count})")


def create_next_watchdog_schedule(workflow_id: str, retry_count: int, watchdog_lambda_arn: str) -> str:
    """
    Create next watchdog schedule for subsequent completion check.

    Args:
        workflow_id: The workflow identifier
        retry_count: Current retry count (used in schedule name)
        watchdog_lambda_arn: ARN of the Watchdog Lambda function to invoke

    Returns:
        New schedule name
    """
    # Calculate next watchdog time
    next_watchdog_time = datetime.now(timezone.utc) + timedelta(minutes=WATCHDOG_DELAY_MINUTES)
    new_schedule_name = f"watchdog-{workflow_id}-{retry_count}"

    scheduler.create_schedule(
        Name=new_schedule_name,
        GroupName=SCHEDULE_GROUP_NAME,
        ScheduleExpression=f"at({next_watchdog_time.strftime('%Y-%m-%dT%H:%M:%S')})",
        ScheduleExpressionTimezone='UTC',
        FlexibleTimeWindow={'Mode': 'OFF'},
        Target={
            'Arn': watchdog_lambda_arn,
            'RoleArn': SCHEDULER_ROLE_ARN,
            'Input': json.dumps({
                'workflow_id': workflow_id,
                'action': 'CHECK_COMPLETION',
                'schedule_name': new_schedule_name
            })
        },
        ActionAfterCompletion='DELETE',
        State='ENABLED'
    )

    print(f"Created next watchdog schedule: {new_schedule_name} at {next_watchdog_time.isoformat()}")
    return new_schedule_name


def update_workflow_retry(workflow_id: str, new_schedule_name: str) -> None:
    """
    Increment retry count and update schedule name in DynamoDB.

    Args:
        workflow_id: The workflow identifier
        new_schedule_name: Name of newly created schedule
    """
    table = dynamodb.Table(WORKFLOW_TABLE_NAME)
    timestamp = datetime.now(timezone.utc).isoformat()

    table.update_item(
        Key={'workflow_id': workflow_id},
        UpdateExpression='SET retry_count = retry_count + :inc, updated_at = :ts, watchdog_schedule_name = :sn',
        ExpressionAttributeValues={
            ':inc': 1,
            ':ts': timestamp,
            ':sn': new_schedule_name
        }
    )
    print(f"Updated workflow {workflow_id} with new schedule: {new_schedule_name}")


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for watchdog completion checks.

    Args:
        event: EventBridge Scheduler event containing workflow_id
        context: Lambda context (provides invoked_function_arn)

    Returns:
        Status response
    """
    print(f"Watchdog triggered: {json.dumps(event)}")

    # Get own Lambda ARN from context (for creating subsequent watchdog schedules)
    watchdog_lambda_arn = context.invoked_function_arn
    print(f"Watchdog Lambda ARN: {watchdog_lambda_arn}")

    workflow_id = event.get('workflow_id')
    schedule_name = event.get('schedule_name', 'unknown')

    if not workflow_id:
        print("ERROR: No workflow_id in event")
        return {'status': 'ERROR', 'message': 'Missing workflow_id'}

    try:
        # Get current workflow state
        workflow = get_workflow(workflow_id)

        if not workflow:
            print(f"Workflow {workflow_id} not found")
            return {'status': 'NOT_FOUND', 'workflow_id': workflow_id}

        status = workflow['status']
        retry_count = workflow.get('retry_count', 0)
        repo = workflow.get('repo', 'unknown')

        print(f"Workflow {workflow_id} status: {status}, retry_count: {retry_count}")

        # Check if workflow already completed
        if status == 'COMPLETED':
            print(f"Workflow {workflow_id} already COMPLETED")
            # Schedule will auto-delete (ActionAfterCompletion: DELETE)
            return {
                'status': 'ALREADY_COMPLETED',
                'workflow_id': workflow_id
            }

        # Check if workflow already failed
        if status == 'FAILED':
            print(f"Workflow {workflow_id} already FAILED")
            return {
                'status': 'ALREADY_FAILED',
                'workflow_id': workflow_id
            }

        # Workflow is still PENDING or RUNNING - may have timed out
        print(f"Workflow {workflow_id} not complete (status: {status}), checking retry limit")

        # Check if max retries exceeded
        if retry_count >= MAX_RETRIES:
            error_message = f'Max retries ({MAX_RETRIES}) exceeded'
            mark_workflow_failed(workflow_id, error_message)
            print(f"Workflow {workflow_id} FAILED: {error_message}")

            # TODO: Post failure notification to GitHub

            return {
                'status': 'MAX_RETRIES_EXCEEDED',
                'workflow_id': workflow_id,
                'retry_count': retry_count
            }

        # Queue RESUME message
        queue_resume_message(workflow_id, repo, retry_count + 1)

        # Create next watchdog schedule (using own ARN from context)
        new_schedule_name = create_next_watchdog_schedule(workflow_id, retry_count + 1, watchdog_lambda_arn)

        # Update workflow with new retry count and schedule name
        update_workflow_retry(workflow_id, new_schedule_name)

        print(f"Workflow {workflow_id} resume queued (retry {retry_count + 1}/{MAX_RETRIES})")

        return {
            'status': 'RESUME_QUEUED',
            'workflow_id': workflow_id,
            'retry_count': retry_count + 1,
            'next_schedule': new_schedule_name
        }

    except Exception as e:
        print(f"ERROR processing watchdog for {workflow_id}: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()

        return {
            'status': 'ERROR',
            'workflow_id': workflow_id,
            'error': str(e)
        }
