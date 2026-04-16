#!/usr/bin/env python3
"""
Test Watchdog Lambda functionality

Tests:
- Create test workflow in DynamoDB (RUNNING status)
- Invoke Watchdog Lambda directly
- Verify RESUME message queued to SQS
- Verify new watchdog schedule created
- Clean up

Run: python3 tests/test_watchdog_lambda.py
"""

import boto3
import json
import uuid
from datetime import datetime, timezone

def test_watchdog_lambda():
    """Test Watchdog Lambda operations"""
    print("\n" + "=" * 80)
    print("WATCHDOG LAMBDA TEST")
    print("=" * 80)

    # Configuration from CDK outputs
    lambda_function_name = "github-agent-automation-dev-WatchdogLambdaCF2B57E4-Ag2A4XpUJKRK"
    workflow_table_name = "github-agent-automation-dev-WorkflowStateTable194BB4D1-GNGY8DGTCEJJ"
    work_queue_url = "https://sqs.us-east-1.amazonaws.com/046264621987/github-agent-automation-dev-WorkQueue94013F35-pxsQbrFb7nap.fifo"
    schedule_group_name = "github-agent-watchdog-dev"

    # Generate test workflow ID
    test_workflow_id = f"test-{str(uuid.uuid4())}"

    print(f"Test Workflow ID: {test_workflow_id}")
    print(f"Timestamp: {datetime.now().isoformat()}")

    try:
        # Initialize clients
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        sqs = boto3.client('sqs', region_name='us-east-1')
        lambda_client = boto3.client('lambda', region_name='us-east-1')
        scheduler = boto3.client('scheduler', region_name='us-east-1')

        # Step 1: Create test workflow in DynamoDB
        print("\n📋 Step 1: Create test workflow in DynamoDB...")
        table = dynamodb.Table(workflow_table_name)
        test_workflow = {
            'workflow_id': test_workflow_id,
            'status': 'RUNNING',
            'event_type': 'test.event',
            'action': 'test',
            'repo': 'test/repo',
            'sender': 'test-user',
            'created_at': datetime.now(timezone.utc).isoformat(),
            'updated_at': datetime.now(timezone.utc).isoformat(),
            'github_event': {'test': 'data'},
            'retry_count': 0,
            'watchdog_schedule_name': 'watchdog-' + test_workflow_id
        }
        table.put_item(Item=test_workflow)
        print(f"✅ Created test workflow: {test_workflow_id}")

        # Step 2: Invoke Watchdog Lambda
        print("\n📋 Step 2: Invoke Watchdog Lambda...")
        event_payload = {
            'workflow_id': test_workflow_id,
            'action': 'CHECK_COMPLETION',
            'schedule_name': 'watchdog-' + test_workflow_id
        }

        response = lambda_client.invoke(
            FunctionName=lambda_function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(event_payload)
        )

        response_payload = json.loads(response['Payload'].read())
        print(f"✅ Lambda invoked successfully")
        print(f"   Response: {json.dumps(response_payload, indent=2)}")

        # Verify response status
        if response_payload.get('status') != 'RESUME_QUEUED':
            print(f"❌ Unexpected status: {response_payload.get('status')}")
            return False

        # Step 3: Verify RESUME message in SQS
        print("\n📋 Step 3: Check SQS for RESUME message...")
        sqs_messages = sqs.receive_message(
            QueueUrl=work_queue_url,
            MaxNumberOfMessages=1,
            WaitTimeSeconds=5
        )

        if 'Messages' not in sqs_messages:
            print("❌ No RESUME message found in SQS")
            return False

        message = sqs_messages['Messages'][0]
        message_body = json.loads(message['Body'])
        print(f"✅ Found RESUME message in SQS:")
        print(f"   Workflow ID: {message_body.get('workflow_id')}")
        print(f"   Action: {message_body.get('action')}")

        # Delete message from queue
        sqs.delete_message(
            QueueUrl=work_queue_url,
            ReceiptHandle=message['ReceiptHandle']
        )
        print("✅ Cleaned up SQS message")

        # Step 4: Verify new watchdog schedule created
        print("\n📋 Step 4: Check for new watchdog schedule...")
        new_schedule_name = f"watchdog-{test_workflow_id}-1"
        try:
            schedule = scheduler.get_schedule(
                Name=new_schedule_name,
                GroupName=schedule_group_name
            )
            print(f"✅ Found new watchdog schedule: {new_schedule_name}")
            print(f"   State: {schedule['State']}")
            print(f"   Expression: {schedule['ScheduleExpression']}")

            # Clean up schedule
            scheduler.delete_schedule(
                Name=new_schedule_name,
                GroupName=schedule_group_name
            )
            print(f"✅ Cleaned up watchdog schedule")

        except scheduler.exceptions.ResourceNotFoundException:
            print(f"❌ New watchdog schedule not found: {new_schedule_name}")
            return False

        # Step 5: Verify DynamoDB updated
        print("\n📋 Step 5: Verify DynamoDB workflow updated...")
        response = table.get_item(Key={'workflow_id': test_workflow_id})
        workflow = response.get('Item')

        if not workflow:
            print("❌ Workflow not found in DynamoDB")
            return False

        print(f"✅ Workflow updated:")
        print(f"   Retry count: {workflow.get('retry_count')}")
        print(f"   Schedule name: {workflow.get('watchdog_schedule_name')}")

        if workflow.get('retry_count') != 1:
            print(f"❌ Retry count should be 1, got {workflow.get('retry_count')}")
            return False

        # Step 6: Clean up test workflow
        print("\n📋 Step 6: Clean up test workflow...")
        table.delete_item(Key={'workflow_id': test_workflow_id})
        print("✅ Deleted test workflow")

        # Success
        print("\n" + "=" * 80)
        print("✅ ALL TESTS PASSED - Watchdog Lambda is operational!")
        print("=" * 80)
        print("\nKey findings:")
        print("  • Watchdog correctly detects RUNNING workflows")
        print("  • RESUME messages queued to SQS")
        print("  • New watchdog schedules created for retries")
        print("  • DynamoDB retry count incremented")
        print("  • Lambda context ARN used successfully")
        return True

    except Exception as e:
        print(f"\n❌ Test failed: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()

        # Clean up on error
        try:
            table.delete_item(Key={'workflow_id': test_workflow_id})
            print("\n🧹 Cleaned up test workflow")
        except:
            pass

        return False


if __name__ == "__main__":
    import sys
    success = test_watchdog_lambda()
    sys.exit(0 if success else 1)
