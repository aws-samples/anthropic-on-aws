#!/usr/bin/env python3
"""
Test Ingestion Lambda functionality

Tests:
- Invoke Ingestion Lambda with test webhook payload
- Verify workflow record created in DynamoDB
- Verify START message queued to SQS
- Verify initial watchdog schedule created
- Clean up

Run: python3 tests/test_ingestion_lambda.py
"""

import boto3
import json
from datetime import datetime, timezone

def test_ingestion_lambda():
    """Test Ingestion Lambda operations"""
    print("\n" + "=" * 80)
    print("INGESTION LAMBDA TEST")
    print("=" * 80)

    # Configuration from CDK outputs
    lambda_function_name = "github-agent-automation-de-IngestionLambdaEF25F265-KejuB72TvX9s"
    workflow_table_name = "github-agent-automation-dev-WorkflowStateTable194BB4D1-GNGY8DGTCEJJ"
    work_queue_url = "https://sqs.us-east-1.amazonaws.com/046264621987/github-agent-automation-dev-WorkQueue94013F35-pxsQbrFb7nap.fifo"
    schedule_group_name = "github-agent-watchdog-dev"

    print(f"Lambda Function: {lambda_function_name}")
    print(f"Timestamp: {datetime.now().isoformat()}")

    workflow_id = None

    try:
        # Initialize clients
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        sqs = boto3.client('sqs', region_name='us-east-1')
        lambda_client = boto3.client('lambda', region_name='us-east-1')
        scheduler = boto3.client('scheduler', region_name='us-east-1')

        # Step 1: Invoke Ingestion Lambda with test payload
        print("\n📋 Step 1: Invoke Ingestion Lambda...")
        test_payload = {
            'event_type': 'issues.opened',
            'action': 'opened',
            'repo': 'test-owner/test-repo',
            'sender': 'test-user',
            'event': {
                'issue': {
                    'number': 123,
                    'title': 'Test Issue',
                    'body': 'This is a test issue'
                }
            }
        }

        # Simulate API Gateway event
        api_gateway_event = {
            'body': json.dumps(test_payload),
            'headers': {'Content-Type': 'application/json'}
        }

        response = lambda_client.invoke(
            FunctionName=lambda_function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(api_gateway_event)
        )

        response_payload = json.loads(response['Payload'].read())
        print(f"✅ Lambda invoked successfully")
        print(f"   Status Code: {response_payload.get('statusCode')}")

        # Parse response body
        response_body = json.loads(response_payload.get('body', '{}'))
        workflow_id = response_body.get('workflow_id')
        print(f"   Workflow ID: {workflow_id}")
        print(f"   Status: {response_body.get('status')}")

        if response_payload.get('statusCode') != 202:
            print(f"❌ Expected status 202, got {response_payload.get('statusCode')}")
            print(f"   Body: {response_body}")
            return False

        if not workflow_id:
            print("❌ No workflow_id in response")
            return False

        # Step 2: Verify workflow record in DynamoDB
        print("\n📋 Step 2: Verify workflow in DynamoDB...")
        table = dynamodb.Table(workflow_table_name)
        response = table.get_item(Key={'workflow_id': workflow_id})
        workflow = response.get('Item')

        if not workflow:
            print(f"❌ Workflow not found in DynamoDB: {workflow_id}")
            return False

        print(f"✅ Found workflow in DynamoDB:")
        print(f"   Status: {workflow.get('status')}")
        print(f"   Event Type: {workflow.get('event_type')}")
        print(f"   Repo: {workflow.get('repo')}")
        print(f"   Schedule Name: {workflow.get('watchdog_schedule_name')}")

        if workflow.get('status') != 'PENDING':
            print(f"❌ Expected status PENDING, got {workflow.get('status')}")
            return False

        # Step 3: Verify START message in SQS
        print("\n📋 Step 3: Check SQS for START message...")
        sqs_messages = sqs.receive_message(
            QueueUrl=work_queue_url,
            MaxNumberOfMessages=1,
            WaitTimeSeconds=5
        )

        if 'Messages' not in sqs_messages:
            print("❌ No START message found in SQS")
            return False

        message = sqs_messages['Messages'][0]
        message_body = json.loads(message['Body'])
        print(f"✅ Found START message in SQS:")
        print(f"   Workflow ID: {message_body.get('workflow_id')}")
        print(f"   Action: {message_body.get('action')}")

        if message_body.get('workflow_id') != workflow_id:
            print(f"❌ Workflow ID mismatch in SQS message")
            return False

        if message_body.get('action') != 'START':
            print(f"❌ Expected action START, got {message_body.get('action')}")
            return False

        # Delete message from queue
        sqs.delete_message(
            QueueUrl=work_queue_url,
            ReceiptHandle=message['ReceiptHandle']
        )
        print("✅ Cleaned up SQS message")

        # Step 4: Verify initial watchdog schedule
        print("\n📋 Step 4: Verify watchdog schedule created...")
        schedule_name = workflow.get('watchdog_schedule_name')
        if not schedule_name:
            print("❌ No watchdog_schedule_name in workflow")
            return False

        try:
            schedule = scheduler.get_schedule(
                Name=schedule_name,
                GroupName=schedule_group_name
            )
            print(f"✅ Found watchdog schedule: {schedule_name}")
            print(f"   State: {schedule['State']}")
            print(f"   Expression: {schedule['ScheduleExpression']}")
            print(f"   Target ARN: {schedule['Target']['Arn']}")

            # Clean up schedule
            scheduler.delete_schedule(
                Name=schedule_name,
                GroupName=schedule_group_name
            )
            print(f"✅ Cleaned up watchdog schedule")

        except scheduler.exceptions.ResourceNotFoundException:
            print(f"❌ Watchdog schedule not found: {schedule_name}")
            return False

        # Step 5: Clean up workflow
        print("\n📋 Step 5: Clean up test workflow...")
        table.delete_item(Key={'workflow_id': workflow_id})
        print("✅ Deleted test workflow")

        # Success
        print("\n" + "=" * 80)
        print("✅ ALL TESTS PASSED - Ingestion Lambda is operational!")
        print("=" * 80)
        print("\nKey findings:")
        print("  • Webhook payload processed correctly")
        print("  • Workflow record created in DynamoDB")
        print("  • START message queued to SQS")
        print("  • Initial watchdog schedule created")
        print("  • All components integrated successfully")
        return True

    except Exception as e:
        print(f"\n❌ Test failed: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()

        # Clean up on error
        if workflow_id:
            try:
                table = dynamodb.Table(workflow_table_name)
                table.delete_item(Key={'workflow_id': workflow_id})
                print("\n🧹 Cleaned up test workflow")
            except:
                pass

        return False


if __name__ == "__main__":
    import sys
    success = test_ingestion_lambda()
    sys.exit(0 if success else 1)
