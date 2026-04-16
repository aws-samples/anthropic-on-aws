"""
GitHub Webhook Handler Lambda Function

Receives GitHub webhook events and initiates workflow orchestration:
1. Verify HMAC-SHA256 signature (security)
2. Parse pull_request event payload
3. Create workflow in DynamoDB
4. Send message to SQS for processing
5. Create EventBridge watchdog schedule

Following patterns from sample-validator and EPCC research:
- HMAC signature verification with constant-time comparison
- Workflow orchestration via DynamoDB + SQS + EventBridge
"""

import os
import json
import hmac
import hashlib
import logging
import uuid
from datetime import datetime, timedelta, timezone
import boto3
from typing import Dict, Any

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# AWS clients (initialized outside handler for connection reuse)
secrets_client = boto3.client('secretsmanager')
dynamodb = boto3.resource('dynamodb')
sqs = boto3.client('sqs')
scheduler = boto3.client('scheduler')

# Environment variables
ENVIRONMENT = os.environ['ENVIRONMENT']
GITHUB_SECRET_ARN = os.environ['GITHUB_SECRET_ARN']
WORKFLOW_TABLE_NAME = os.environ['WORKFLOW_TABLE_NAME']
WORK_QUEUE_URL = os.environ['WORK_QUEUE_URL']
WATCHDOG_LAMBDA_ARN = os.environ['WATCHDOG_LAMBDA_ARN']
SCHEDULER_ROLE_ARN = os.environ['SCHEDULER_ROLE_ARN']
SCHEDULE_GROUP_NAME = os.environ['SCHEDULE_GROUP_NAME']
WATCHDOG_DELAY_MINUTES = int(os.environ.get('WATCHDOG_DELAY_MINUTES', 65))


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for GitHub webhook events

    Args:
        event: API Gateway proxy event
        context: Lambda context

    Returns:
        API Gateway proxy response
    """
    try:
        logger.info(f"Received webhook event: {json.dumps(event)}")

        # Extract request details
        headers = event.get('headers', {})
        body = event.get('body', '')

        # Verify GitHub signature (security critical)
        signature = headers.get('x-hub-signature-256') or headers.get('X-Hub-Signature-256')
        if not signature:
            logger.error("Missing x-hub-signature-256 header")
            return error_response(401, "Missing signature header")

        if not verify_github_signature(body, signature):
            logger.error("Invalid GitHub signature")
            return error_response(401, "Invalid signature")

        logger.info("GitHub signature verified successfully")

        # Parse webhook payload
        try:
            payload = json.loads(body)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON payload: {e}")
            return error_response(400, "Invalid JSON payload")

        # Extract event details
        event_type = headers.get('x-github-event') or headers.get('X-GitHub-Event')
        action = payload.get('action')

        logger.info(f"GitHub event: {event_type}, action: {action}")

        # Only process pull_request events
        if event_type != 'pull_request':
            logger.info(f"Ignoring non-PR event: {event_type}")
            return success_response(f"Event {event_type} ignored")

        # Only process relevant actions (opened, synchronize, reopened)
        if action not in ['opened', 'synchronize', 'reopened']:
            logger.info(f"Ignoring PR action: {action}")
            return success_response(f"Action {action} ignored")

        # Extract PR details
        pull_request = payload.get('pull_request', {})
        pr_number = pull_request.get('number')
        repository = payload.get('repository', {})
        repo_full_name = repository.get('full_name')

        if not pr_number or not repo_full_name:
            logger.error("Missing PR number or repository name")
            return error_response(400, "Invalid pull_request payload")

        logger.info(f"Processing PR #{pr_number} in {repo_full_name}")

        # Create workflow orchestration
        workflow_id = create_workflow(
            pr_number=pr_number,
            repo_full_name=repo_full_name,
            pr_data=pull_request,
            event_type=event_type,
            action=action,
            sender=payload.get('sender', {}).get('login', 'unknown')
        )

        return success_response(f"Workflow {workflow_id} created for PR #{pr_number}")

    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        return error_response(500, f"Internal error: {str(e)}")


def verify_github_signature(payload_body: str, signature_header: str) -> bool:
    """
    Verify GitHub webhook signature using HMAC-SHA256

    Args:
        payload_body: Raw request body (string)
        signature_header: Value of x-hub-signature-256 header

    Returns:
        True if signature is valid, False otherwise
    """
    try:
        # Get GitHub webhook secret from Secrets Manager
        secret_response = secrets_client.get_secret_value(SecretId=GITHUB_SECRET_ARN)
        secret_data = json.loads(secret_response['SecretString'])
        webhook_secret = secret_data.get('webhook_secret', '')

        if not webhook_secret:
            logger.error("GitHub webhook secret not configured in Secrets Manager")
            return False

        # Generate expected signature
        hash_object = hmac.new(
            webhook_secret.encode('utf-8'),
            msg=payload_body.encode('utf-8'),
            digestmod=hashlib.sha256
        )
        expected_signature = "sha256=" + hash_object.hexdigest()

        # Use constant-time comparison (security critical)
        return hmac.compare_digest(expected_signature, signature_header)

    except Exception as e:
        logger.error(f"Failed to verify signature: {e}", exc_info=True)
        return False


def update_workflow_with_schedule(workflow_id: str, schedule_name: str) -> None:
    """
    Store schedule name in DynamoDB for early deletion if workflow completes.

    Args:
        workflow_id: The workflow identifier
        schedule_name: Name of the created EventBridge schedule
    """
    try:
        table = dynamodb.Table(WORKFLOW_TABLE_NAME)
        table.update_item(
            Key={'workflow_id': workflow_id},
            UpdateExpression='SET watchdog_schedule_name = :name',
            ExpressionAttributeValues={':name': schedule_name}
        )
        logger.info(f"✅ Updated workflow {workflow_id} with schedule name: {schedule_name}")
    except Exception as e:
        logger.error(f"Failed to update workflow with schedule name: {e}", exc_info=True)
        # Don't raise - schedule name update is for cleanup optimization, not critical
        # Worst case: schedule fires and finds workflow already COMPLETED


def create_workflow(
    pr_number: int,
    repo_full_name: str,
    pr_data: Dict[str, Any],
    event_type: str,
    action: str,
    sender: str
) -> str:
    """
    Create workflow orchestration (DynamoDB + SQS + EventBridge)

    Args:
        pr_number: Pull request number
        repo_full_name: Repository full name (owner/repo)
        pr_data: Pull request data from webhook
        event_type: GitHub event type
        action: GitHub action
        sender: GitHub user who triggered the event

    Returns:
        workflow_id: UUID of created workflow
    """
    try:
        # Generate unique workflow ID
        workflow_id = str(uuid.uuid4())
        timestamp = datetime.now(timezone.utc).isoformat()

        logger.info(f"Creating workflow {workflow_id} for PR #{pr_number}")

        # 1. Create workflow record in DynamoDB
        table = dynamodb.Table(WORKFLOW_TABLE_NAME)

        # Prepare GitHub event data
        # Format must match what Invoker Lambda's extract_pr_data() expects
        github_event = {
            "pull_request": {
                "number": pr_number,
                "html_url": pr_data.get('html_url'),
                "title": pr_data.get('title'),
                "body": pr_data.get('body', ''),
                "head": {
                    "sha": pr_data.get('head', {}).get('sha'),
                    "ref": pr_data.get('head', {}).get('ref'),
                },
                "base": {
                    "sha": pr_data.get('base', {}).get('sha'),
                    "ref": pr_data.get('base', {}).get('ref'),
                },
                "diff_url": pr_data.get('diff_url'),
            },
            "repository": {
                "full_name": repo_full_name,
            }
        }

        workflow_record = {
            'workflow_id': workflow_id,
            'status': 'PENDING',
            'event_type': event_type,
            'action': action,
            'repo': repo_full_name,
            'sender': sender,
            'created_at': timestamp,
            'updated_at': timestamp,
            'github_event': github_event,
            'retry_count': 0
        }

        table.put_item(Item=workflow_record)
        logger.info(f"✅ Created workflow record in DynamoDB")

        # 2. Send message to SQS work queue
        message_body = {
            'workflow_id': workflow_id,
            'action': 'START',
            'github_event': github_event
        }

        sqs.send_message(
            QueueUrl=WORK_QUEUE_URL,
            MessageBody=json.dumps(message_body),
            MessageGroupId=workflow_id,  # FIFO: Ensures ordered processing per workflow
            MessageDeduplicationId=f"{workflow_id}-start-{timestamp}"
        )
        logger.info(f"✅ Sent message to SQS queue")

        # 3. Create EventBridge watchdog schedule
        schedule_time = datetime.now(timezone.utc) + timedelta(minutes=WATCHDOG_DELAY_MINUTES)
        schedule_name = f"watchdog-{workflow_id}"

        scheduler.create_schedule(
            Name=schedule_name,
            GroupName=SCHEDULE_GROUP_NAME,
            ScheduleExpression=f"at({schedule_time.strftime('%Y-%m-%dT%H:%M:%S')})",
            ScheduleExpressionTimezone='UTC',
            FlexibleTimeWindow={'Mode': 'OFF'},
            Target={
                'Arn': WATCHDOG_LAMBDA_ARN,
                'RoleArn': SCHEDULER_ROLE_ARN,
                'Input': json.dumps({
                    'workflow_id': workflow_id,
                    'action': 'CHECK'
                })
            },
            ActionAfterCompletion='DELETE',  # Auto-cleanup after execution
            State='ENABLED',
            Description=f"Watchdog for workflow {workflow_id}"
        )
        logger.info(f"✅ Created watchdog schedule for {schedule_time}")

        # 4. Update workflow record with schedule name (for early deletion if workflow completes)
        update_workflow_with_schedule(workflow_id, schedule_name)

        logger.info(f"🎉 Workflow orchestration complete for {workflow_id}")
        return workflow_id

    except Exception as e:
        logger.error(f"Failed to create workflow: {e}", exc_info=True)
        raise


def success_response(message: str) -> Dict[str, Any]:
    """Return successful API Gateway response"""
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
        },
        'body': json.dumps({
            'status': 'success',
            'message': message,
        }),
    }


def error_response(status_code: int, message: str) -> Dict[str, Any]:
    """Return error API Gateway response"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
        },
        'body': json.dumps({
            'status': 'error',
            'message': message,
        }),
    }
