"""
Ingestion Lambda Handler

Receives GitHub webhook events from API Gateway and initiates workflow orchestration.

Responsibilities:
1. Validate incoming payload
2. Create workflow record in DynamoDB
3. Queue work message to SQS
4. Create EventBridge watchdog schedule
5. Return workflow_id to caller
"""

import json
import uuid
import os
from datetime import datetime, timedelta, timezone
import boto3
from typing import Dict, Any

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
sqs = boto3.client('sqs')
scheduler = boto3.client('scheduler')

# Environment variables
WORKFLOW_TABLE_NAME = os.environ['WORKFLOW_TABLE_NAME']
WORK_QUEUE_URL = os.environ['WORK_QUEUE_URL']
WATCHDOG_LAMBDA_ARN = os.environ['WATCHDOG_LAMBDA_ARN']
SCHEDULER_ROLE_ARN = os.environ['SCHEDULER_ROLE_ARN']
SCHEDULE_GROUP_NAME = os.environ['SCHEDULE_GROUP_NAME']
WATCHDOG_DELAY_MINUTES = int(os.environ.get('WATCHDOG_DELAY_MINUTES', 65))


def validate_payload(body: Dict[str, Any]) -> tuple[bool, str]:
    """
    Validate required fields in the payload.

    Args:
        body: Parsed JSON payload

    Returns:
        (is_valid, error_message)
    """
    required_fields = ['event_type', 'repo', 'event']
    missing = [f for f in required_fields if f not in body]

    if missing:
        return False, f'Missing required fields: {missing}'

    return True, ''


def create_workflow_record(workflow_id: str, body: Dict[str, Any]) -> None:
    """
    Create workflow record in DynamoDB with PENDING status.

    Args:
        workflow_id: Generated workflow UUID
        body: Validated payload containing event data
    """
    table = dynamodb.Table(WORKFLOW_TABLE_NAME)
    timestamp = datetime.now(timezone.utc).isoformat()

    workflow_record = {
        'workflow_id': workflow_id,
        'status': 'PENDING',
        'event_type': body['event_type'],
        'action': body.get('action', ''),
        'repo': body['repo'],
        'sender': body.get('sender', 'unknown'),
        'created_at': timestamp,
        'updated_at': timestamp,
        'github_event': body['event'],
        'retry_count': 0
    }

    # Add diff if present (for PRs)
    if 'diff' in body and body['diff']:
        workflow_record['diff'] = body['diff']

    table.put_item(Item=workflow_record)
    print(f"Created workflow record: {workflow_id}")


def queue_work_message(workflow_id: str, repo: str) -> None:
    """
    Send START message to SQS Work Queue.

    Args:
        workflow_id: The workflow identifier
        repo: Repository in owner/repo format (used for FIFO grouping)
    """
    message_body = json.dumps({
        'workflow_id': workflow_id,
        'action': 'START'
    })

    # FIFO grouping by repo ensures same-repo workflows processed sequentially
    message_group_id = repo.replace('/', '-')

    sqs.send_message(
        QueueUrl=WORK_QUEUE_URL,
        MessageBody=message_body,
        MessageGroupId=message_group_id,
        MessageDeduplicationId=workflow_id  # Prevents duplicates
    )
    print(f"Queued work message: {workflow_id} (group: {message_group_id})")


def create_watchdog_schedule(workflow_id: str, repo: str) -> str:
    """
    Create one-time EventBridge schedule to invoke Watchdog Lambda.

    Args:
        workflow_id: The workflow identifier
        repo: Repository in owner/repo format

    Returns:
        Schedule name for later deletion if needed
    """
    # Calculate watchdog time (65 minutes from now by default)
    watchdog_time = datetime.now(timezone.utc) + timedelta(minutes=WATCHDOG_DELAY_MINUTES)
    schedule_name = f"watchdog-{workflow_id}"

    # Create one-time schedule with precise timing
    scheduler.create_schedule(
        Name=schedule_name,
        GroupName=SCHEDULE_GROUP_NAME,
        ScheduleExpression=f"at({watchdog_time.strftime('%Y-%m-%dT%H:%M:%S')})",
        ScheduleExpressionTimezone='UTC',
        FlexibleTimeWindow={'Mode': 'OFF'},  # Precise timing required
        Target={
            'Arn': WATCHDOG_LAMBDA_ARN,
            'RoleArn': SCHEDULER_ROLE_ARN,
            'Input': json.dumps({
                'workflow_id': workflow_id,
                'action': 'CHECK_COMPLETION',
                'schedule_name': schedule_name
            })
        },
        ActionAfterCompletion='DELETE',  # Auto-cleanup after execution
        State='ENABLED'
    )

    print(f"Created watchdog schedule: {schedule_name} at {watchdog_time.isoformat()}")
    return schedule_name


def update_workflow_with_schedule(workflow_id: str, schedule_name: str) -> None:
    """
    Store schedule name in DynamoDB for early deletion if workflow completes.

    Args:
        workflow_id: The workflow identifier
        schedule_name: Name of the created EventBridge schedule
    """
    table = dynamodb.Table(WORKFLOW_TABLE_NAME)
    table.update_item(
        Key={'workflow_id': workflow_id},
        UpdateExpression='SET watchdog_schedule_name = :name',
        ExpressionAttributeValues={':name': schedule_name}
    )
    print(f"Updated workflow {workflow_id} with schedule name: {schedule_name}")


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for ingesting GitHub webhook events.

    Args:
        event: API Gateway event containing webhook payload
        context: Lambda context

    Returns:
        API Gateway response with status code and body
    """
    print(f"Received event: {json.dumps(event)}")

    try:
        # Parse request body
        try:
            body = json.loads(event.get('body', '{}'))
        except json.JSONDecodeError:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Invalid JSON'})
            }

        # Validate payload
        is_valid, error_message = validate_payload(body)
        if not is_valid:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': error_message})
            }

        # Generate workflow ID
        workflow_id = str(uuid.uuid4())
        repo = body['repo']

        print(f"Processing workflow {workflow_id} for repo {repo}")

        # Step 1: Create workflow record
        create_workflow_record(workflow_id, body)

        # Step 2: Queue work message
        queue_work_message(workflow_id, repo)

        # Step 3: Create watchdog schedule
        schedule_name = create_watchdog_schedule(workflow_id, repo)

        # Step 4: Update workflow with schedule name
        update_workflow_with_schedule(workflow_id, schedule_name)

        # Success response (202 Accepted - async processing)
        return {
            'statusCode': 202,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'workflow_id': workflow_id,
                'status': 'PENDING',
                'message': 'Workflow queued for processing'
            })
        }

    except Exception as e:
        print(f"Error processing webhook: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()

        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'error': 'Internal server error',
                'details': str(e)
            })
        }
