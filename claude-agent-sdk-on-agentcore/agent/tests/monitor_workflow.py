#!/usr/bin/env python3
"""
Real-time Workflow Monitor

Monitors a running workflow and displays:
- Current status and retry count
- Recent CloudWatch logs from Invoker Lambda
- AgentCore execution progress
- SQS queue status
- EventBridge schedules

Run: python3 tests/monitor_workflow.py <workflow_id>
"""

import boto3
import time
import sys
from datetime import datetime, timezone

def monitor_workflow(workflow_id: str):
    """Monitor workflow execution in real-time"""
    print("\n" + "=" * 80)
    print(f"MONITORING WORKFLOW: {workflow_id}")
    print("=" * 80)
    print("Press Ctrl+C to stop monitoring\n")

    # Configuration
    workflow_table_name = "github-agent-automation-dev-WorkflowStateTable194BB4D1-GNGY8DGTCEJJ"
    work_queue_url = "https://sqs.us-east-1.amazonaws.com/046264621987/github-agent-automation-dev-WorkQueue94013F35-pxsQbrFb7nap.fifo"
    invoker_log_group = "/aws/lambda/github-agent-automation-dev-InvokerLambda8E4E552F-taaF87L2vq12"
    schedule_group_name = "github-agent-watchdog-dev"

    # Initialize clients
    dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
    sqs = boto3.client('sqs', region_name='us-east-1')
    logs = boto3.client('logs', region_name='us-east-1')
    scheduler = boto3.client('scheduler', region_name='us-east-1')

    table = dynamodb.Table(workflow_table_name)

    last_status = None
    last_retry_count = None
    last_log_time = 0
    iteration = 0

    try:
        while True:
            iteration += 1
            print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Check #{iteration}")
            print("-" * 80)

            # Get workflow status
            try:
                response = table.get_item(Key={'workflow_id': workflow_id})
                workflow = response.get('Item')

                if not workflow:
                    print("❌ Workflow not found in DynamoDB")
                    break

                status = workflow.get('status')
                retry_count = workflow.get('retry_count', 0)
                updated_at = workflow.get('updated_at', 'unknown')
                error_message = workflow.get('error_message', '')

                # Show status change
                if status != last_status or retry_count != last_retry_count:
                    print(f"📊 Status Change: {last_status or 'N/A'} → {status}")
                    print(f"   Retry Count: {retry_count}")
                    print(f"   Updated: {updated_at}")
                    if error_message:
                        print(f"   Error: {error_message}")
                    last_status = status
                    last_retry_count = retry_count
                else:
                    print(f"📊 Status: {status} (retry: {retry_count})")

                # Check for terminal states
                if status == 'COMPLETED':
                    print("\n✅ WORKFLOW COMPLETED!")
                    print(f"   Final updated: {updated_at}")
                    break

                if status == 'FAILED':
                    print("\n❌ WORKFLOW FAILED!")
                    print(f"   Error: {error_message}")
                    print(f"   Retry count: {retry_count}")
                    break

            except Exception as e:
                print(f"❌ Error getting workflow: {e}")

            # Check SQS queue
            try:
                attrs = sqs.get_queue_attributes(
                    QueueUrl=work_queue_url,
                    AttributeNames=['ApproximateNumberOfMessages', 'ApproximateNumberOfMessagesNotVisible']
                )
                visible = attrs['Attributes'].get('ApproximateNumberOfMessages', '0')
                in_flight = attrs['Attributes'].get('ApproximateNumberOfMessagesNotVisible', '0')
                print(f"📬 SQS Queue: {visible} visible, {in_flight} in-flight")
            except Exception as e:
                print(f"⚠️  Could not check SQS: {e}")

            # Check EventBridge schedule
            if workflow and workflow.get('watchdog_schedule_name'):
                schedule_name = workflow.get('watchdog_schedule_name')
                try:
                    schedule = scheduler.get_schedule(
                        Name=schedule_name,
                        GroupName=schedule_group_name
                    )
                    schedule_time = schedule.get('ScheduleExpression', 'unknown')
                    print(f"⏰ Watchdog Schedule: {schedule_name}")
                    print(f"   Expression: {schedule_time}")
                except scheduler.exceptions.ResourceNotFoundException:
                    print(f"⏰ Watchdog Schedule: Deleted (workflow may have completed)")
                except Exception as e:
                    print(f"⚠️  Could not check schedule: {e}")

            # Get recent logs from Invoker Lambda
            try:
                current_time = int(time.time() * 1000)
                events = logs.filter_log_events(
                    logGroupName=invoker_log_group,
                    filterPattern=workflow_id,
                    startTime=last_log_time,
                    endTime=current_time,
                    limit=20
                )

                log_entries = events.get('events', [])
                if log_entries:
                    print(f"\n📝 Recent Logs ({len(log_entries)} new entries):")
                    for event in log_entries[-5:]:  # Show last 5
                        timestamp = datetime.fromtimestamp(event['timestamp'] / 1000)
                        message = event['message'].strip()
                        # Truncate long messages
                        if len(message) > 100:
                            message = message[:97] + "..."
                        print(f"   [{timestamp.strftime('%H:%M:%S')}] {message}")

                    # Update last log time
                    if log_entries:
                        last_log_time = log_entries[-1]['timestamp']
                else:
                    print("📝 No new logs")

            except logs.exceptions.ResourceNotFoundException:
                print("📝 Log group not found")
            except Exception as e:
                print(f"⚠️  Could not fetch logs: {e}")

            # Wait before next check
            if status == 'RUNNING':
                wait_time = 5  # Check every 5 seconds when running
            else:
                wait_time = 2  # Check every 2 seconds otherwise

            time.sleep(wait_time)

    except KeyboardInterrupt:
        print("\n\n⏸️  Monitoring stopped by user")
        return

    print("\n" + "=" * 80)
    print("MONITORING COMPLETE")
    print("=" * 80)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 monitor_workflow.py <workflow_id>")
        print("\nOr run a new test and monitor it:")
        print("  python3 monitor_workflow.py --new-test")
        sys.exit(1)

    if sys.argv[1] == '--new-test':
        print("Running new E2E test...")
        import subprocess
        result = subprocess.run(
            ['python3', 'tests/test_end_to_end_workflow.py'],
            capture_output=True,
            text=True
        )

        # Extract workflow ID from output
        for line in result.stdout.split('\n'):
            if 'Workflow ID:' in line:
                workflow_id = line.split('Workflow ID:')[1].strip()
                print(f"\nStarting monitor for workflow: {workflow_id}\n")
                monitor_workflow(workflow_id)
                break
        else:
            print("Could not extract workflow ID from test output")
            print(result.stdout)
            sys.exit(1)
    else:
        workflow_id = sys.argv[1]
        monitor_workflow(workflow_id)
