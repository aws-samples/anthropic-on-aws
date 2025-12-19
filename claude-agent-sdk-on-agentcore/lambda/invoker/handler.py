"""
Invoker Lambda Handler

Triggered by SQS messages to invoke AgentCore Runtime for workflow execution.

Responsibilities:
1. Process SQS messages (START/RESUME actions)
2. Retrieve workflow from DynamoDB
3. Update status to RUNNING
4. Invoke AgentCore Runtime
5. Handle errors and retries
"""

import json
import os
from datetime import datetime, timezone
from typing import Dict, Any
from decimal import Decimal
import boto3

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
bedrock_agentcore = boto3.client('bedrock-agentcore')
scheduler = boto3.client('scheduler')


# Helper to convert DynamoDB Decimal to int/float for JSON serialization
def decimal_to_num(obj):
    """
    Recursively convert Decimal objects to int or float for JSON serialization.

    Handles:
    - Decimal → int or float
    - dict → recursively convert all values
    - list → recursively convert all items
    - other → passthrough
    """
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    elif isinstance(obj, dict):
        return {k: decimal_to_num(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [decimal_to_num(item) for item in obj]
    else:
        return obj

# Environment variables
WORKFLOW_TABLE_NAME = os.environ['WORKFLOW_TABLE_NAME']
RUNTIME_ARN = os.environ['RUNTIME_ARN']
SCHEDULE_GROUP_NAME = os.environ['SCHEDULE_GROUP_NAME']


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


def update_workflow_status(workflow_id: str, status: str, error_message: str = None) -> None:
    """
    Update workflow status in DynamoDB.

    Args:
        workflow_id: The workflow identifier
        status: New status (RUNNING, COMPLETED, FAILED)
        error_message: Optional error message for failures
    """
    table = dynamodb.Table(WORKFLOW_TABLE_NAME)
    timestamp = datetime.now(timezone.utc).isoformat()

    update_expression = 'SET #status = :status, updated_at = :ts'
    expression_values = {
        ':status': status,
        ':ts': timestamp
    }
    expression_names = {'#status': 'status'}

    if error_message:
        update_expression += ', error_message = :err'
        expression_values[':err'] = error_message

    table.update_item(
        Key={'workflow_id': workflow_id},
        UpdateExpression=update_expression,
        ExpressionAttributeNames=expression_names,
        ExpressionAttributeValues=expression_values
    )
    print(f"Updated workflow {workflow_id} to status: {status}")


def increment_retry_count(workflow_id: str) -> None:
    """
    Increment workflow retry count in DynamoDB.

    Args:
        workflow_id: The workflow identifier
    """
    table = dynamodb.Table(WORKFLOW_TABLE_NAME)
    timestamp = datetime.now(timezone.utc).isoformat()

    table.update_item(
        Key={'workflow_id': workflow_id},
        UpdateExpression='SET retry_count = retry_count + :inc, updated_at = :ts',
        ExpressionAttributeValues={
            ':inc': 1,
            ':ts': timestamp
        }
    )
    print(f"Incremented retry count for workflow {workflow_id}")


def delete_watchdog_schedule(workflow: Dict[str, Any]) -> None:
    """
    Delete watchdog schedule for completed workflow.

    Args:
        workflow: Workflow record from DynamoDB
    """
    schedule_name = workflow.get('watchdog_schedule_name')
    if not schedule_name:
        print("No watchdog schedule name found in workflow")
        return

    try:
        scheduler.delete_schedule(
            GroupName=SCHEDULE_GROUP_NAME,
            Name=schedule_name
        )
        print(f"✓ Deleted watchdog schedule: {schedule_name}")
    except scheduler.exceptions.ResourceNotFoundException:
        print(f"Watchdog schedule not found (may have already fired): {schedule_name}")
    except Exception as e:
        print(f"Error deleting watchdog schedule {schedule_name}: {e}")
        # Don't raise - schedule deletion is cleanup, not critical


def extract_pr_data(github_event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract PR-specific fields from GitHub webhook event.

    Args:
        github_event: Full GitHub webhook payload

    Returns:
        Dict with pr_number, repo_full_name, and other PR fields

    Raises:
        ValueError: If required fields are missing
    """
    pull_request = github_event.get('pull_request', {})
    repository = github_event.get('repository', {})

    pr_number = pull_request.get('number')
    repo_full_name = repository.get('full_name')

    if not pr_number or not repo_full_name:
        raise ValueError(f"Invalid PR event: missing pr_number or repo_full_name")

    return {
        'pr_number': pr_number,
        'repo_full_name': repo_full_name,
        'pr_url': pull_request.get('html_url', ''),
        'pr_title': pull_request.get('title', ''),
        'pr_body': pull_request.get('body', ''),
        'head_sha': pull_request.get('head', {}).get('sha', ''),
        'base_sha': pull_request.get('base', {}).get('sha', ''),
        'diff_url': pull_request.get('diff_url', ''),
    }


def invoke_agentcore(workflow: Dict[str, Any]) -> Dict[str, Any]:
    """
    Invoke AgentCore Runtime to process workflow.

    Args:
        workflow: Workflow record from DynamoDB

    Returns:
        AgentCore response
    """
    workflow_id = workflow['workflow_id']
    github_event = decimal_to_num(workflow.get('github_event', {}))

    print(f"Invoking AgentCore for workflow {workflow_id}")
    print(f"  Runtime ARN: {RUNTIME_ARN}")
    print(f"  Event Type: {workflow.get('event_type')}")

    try:
        # Extract PR-specific fields from GitHub event
        pr_data = extract_pr_data(github_event)
        print(f"  PR: {pr_data['repo_full_name']}#{pr_data['pr_number']}")

        # Build payload matching agent's expected format
        # IMPORTANT: Wrap in "input" key to match agent's InvocationRequest model
        payload_data = {
            "input": {
                "workflow_id": workflow_id,  # For agent to update workflow status
                "pr_number": pr_data['pr_number'],
                "repo_full_name": pr_data['repo_full_name'],
                "pr_url": pr_data['pr_url'],
                "pr_title": pr_data['pr_title'],
                "pr_body": pr_data['pr_body'],
                "head_sha": pr_data['head_sha'],
                "base_sha": pr_data['base_sha'],
                "diff_url": pr_data['diff_url'],
            }
        }

        # Encode payload as binary data (required by AgentCore API)
        payload = json.dumps(payload_data).encode('utf-8')

        # Use workflow_id as session ID for continuity across retries
        session_id = workflow_id

        # Invoke AgentCore Runtime (fire-and-forget with explicit stream close)
        response = bedrock_agentcore.invoke_agent_runtime(
            agentRuntimeArn=RUNTIME_ARN,
            runtimeSessionId=session_id,
            payload=payload
        )

        # Close streaming body immediately to release connection and return fast
        if 'response' in response and hasattr(response['response'], 'close'):
            response['response'].close()
            print(f"Closed streaming response for workflow {workflow_id}")

        # Return immediately - Agent will update workflow status asynchronously
        print(f"AgentCore invocation initiated for workflow {workflow_id} (session: {session_id})")

        return {
            'status': 'INVOKED',
            'message': 'AgentCore invocation initiated'
        }

    except ValueError as e:
        # Invalid PR data - likely not a PR event
        print(f"Invalid PR event for workflow {workflow_id}: {e}")
        raise

    except Exception as e:
        print(f"Error invoking AgentCore for workflow {workflow_id}: {type(e).__name__}: {e}")
        raise


def process_message(message_body: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process a single workflow message from SQS.

    Args:
        message_body: Parsed SQS message body

    Returns:
        Processing result
    """
    workflow_id = message_body.get('workflow_id')
    action = message_body.get('action', 'unknown')

    if not workflow_id:
        print("ERROR: No workflow_id in message")
        return {'status': 'ERROR', 'message': 'Missing workflow_id'}

    print(f"\n{'=' * 80}")
    print(f"Processing workflow: {workflow_id}")
    print(f"Action: {action}")
    print(f"{'=' * 80}")

    try:
        # Step 1: Get workflow from DynamoDB
        workflow = get_workflow(workflow_id)

        if not workflow:
            print(f"Workflow {workflow_id} not found in DynamoDB")
            return {'status': 'NOT_FOUND', 'workflow_id': workflow_id}

        status = workflow['status']
        print(f"Current workflow status: {status}")

        # Step 2: Check if workflow already completed or failed
        if status == 'COMPLETED':
            print(f"Workflow {workflow_id} already COMPLETED, skipping")
            return {'status': 'ALREADY_COMPLETED', 'workflow_id': workflow_id}

        if status == 'FAILED':
            print(f"Workflow {workflow_id} already FAILED, skipping")
            return {'status': 'ALREADY_FAILED', 'workflow_id': workflow_id}

        # Step 3: Update status to RUNNING
        update_workflow_status(workflow_id, 'RUNNING')

        # Step 4: Invoke AgentCore (returns immediately, Agent handles completion)
        result = invoke_agentcore(workflow)

        # Agent's background task will:
        # - Complete the PR review
        # - Update workflow status to COMPLETED
        # - Delete the watchdog schedule

        print(f"Workflow {workflow_id} invocation initiated (Agent will update status)")
        return {
            'status': 'INVOKED',
            'workflow_id': workflow_id,
            'result': result
        }

    except ValueError as e:
        # Invalid event type (not a PR event)
        error_msg = f"Invalid event type: {str(e)}"
        print(f"Workflow {workflow_id} failed validation: {error_msg}")

        # Mark workflow as FAILED (not retriable)
        update_workflow_status(workflow_id, 'FAILED', error_msg)
        return {
            'status': 'VALIDATION_ERROR',
            'workflow_id': workflow_id,
            'error': error_msg
        }

    except Exception as e:
        error_msg = f"{type(e).__name__}: {str(e)}"
        print(f"ERROR processing workflow {workflow_id}: {error_msg}")

        # Increment retry count
        try:
            increment_retry_count(workflow_id)
        except Exception as retry_error:
            print(f"Failed to increment retry count: {retry_error}")

        # Re-raise to trigger SQS retry
        raise


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for processing workflow messages from SQS.

    Args:
        event: SQS event containing workflow messages
        context: Lambda context

    Returns:
        Processing results
    """
    print(f"Received SQS event with {len(event.get('Records', []))} record(s)")

    results = []

    for record in event.get('Records', []):
        try:
            # Parse message body
            message_body = json.loads(record['body'])
            print(f"\nProcessing message: {message_body}")

            # Process the workflow
            result = process_message(message_body)
            results.append(result)

        except Exception as e:
            print(f"Error processing SQS record: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()

            # Re-raise to prevent message deletion (SQS will retry)
            raise

    return {
        'statusCode': 200,
        'body': json.dumps({
            'processed': len(results),
            'results': decimal_to_num(results)  # Convert any Decimals in results
        })
    }
