"""
Workflow management utilities for GitHub PR Review Agent.

Provides functions for updating workflow status in DynamoDB and managing
EventBridge Scheduler watchdog schedules.
"""

import logging
from datetime import datetime, timezone
import boto3

from core.config import get_aws_region, get_workflow_table_name, get_schedule_group_name
from utils.tracing import get_current_trace_id

logger = logging.getLogger(__name__)


def update_workflow_status(workflow_id: str, status: str, error_message: str = None):
    """
    Update workflow status in DynamoDB.

    Args:
        workflow_id: Workflow ID
        status: New status (COMPLETED or FAILED)
        error_message: Optional error message for FAILED status
    """
    try:
        table_name = get_workflow_table_name()
        if not table_name:
            logger.warning("WORKFLOW_TABLE_NAME not set, cannot update status")
            return

        dynamodb = boto3.resource('dynamodb', region_name=get_aws_region())
        table = dynamodb.Table(table_name)

        # Capture OpenTelemetry trace_id for log correlation
        trace_id = get_current_trace_id()

        update_expr = "SET #status = :status, updated_at = :updated_at"
        expr_attr_names = {'#status': 'status'}
        expr_attr_values = {
            ':status': status,
            ':updated_at': datetime.now(timezone.utc).isoformat()
        }

        # Add trace_id if available (for efficient log correlation)
        if trace_id:
            update_expr += ", trace_id = :trace_id"
            expr_attr_values[':trace_id'] = trace_id

        if error_message:
            update_expr += ", error_message = :error_message"
            expr_attr_values[':error_message'] = error_message

        table.update_item(
            Key={'workflow_id': workflow_id},
            UpdateExpression=update_expr,
            ExpressionAttributeNames=expr_attr_names,
            ExpressionAttributeValues=expr_attr_values
        )

        log_msg = f"✅ Updated workflow {workflow_id} status to {status}"
        if trace_id:
            log_msg += f" (trace_id: {trace_id})"
        logger.info(log_msg)

    except Exception as e:
        logger.error(f"❌ Failed to update workflow status: {e}", exc_info=True)


def delete_watchdog_schedule(workflow_id: str):
    """
    Delete watchdog schedule for completed workflow.

    Args:
        workflow_id: Workflow ID
    """
    try:
        # Get workflow to retrieve schedule name
        table_name = get_workflow_table_name()
        schedule_group = get_schedule_group_name()

        if not table_name or not schedule_group:
            logger.warning("WORKFLOW_TABLE_NAME or SCHEDULE_GROUP_NAME not set, cannot delete schedule")
            return

        dynamodb = boto3.resource('dynamodb', region_name=get_aws_region())
        table = dynamodb.Table(table_name)

        # Get workflow record to read schedule name
        response = table.get_item(Key={'workflow_id': workflow_id})
        workflow = response.get('Item')

        if not workflow:
            logger.warning(f"Workflow {workflow_id} not found in DynamoDB")
            return

        schedule_name = workflow.get('watchdog_schedule_name')
        if not schedule_name:
            logger.info("No watchdog schedule name found in workflow (may not have been set)")
            return

        # Delete the schedule
        scheduler = boto3.client('scheduler', region_name=get_aws_region())
        scheduler.delete_schedule(
            GroupName=schedule_group,
            Name=schedule_name
        )

        logger.info(f"✅ Deleted watchdog schedule: {schedule_name}")

    except Exception as e:
        # Check if it's a ResourceNotFoundException
        error_name = type(e).__name__
        if 'ResourceNotFoundException' in error_name:
            logger.info(f"Watchdog schedule not found (may have already fired or been deleted)")
        else:
            logger.error(f"❌ Failed to delete watchdog schedule: {e}", exc_info=True)
        # Don't raise - schedule deletion is cleanup, not critical
