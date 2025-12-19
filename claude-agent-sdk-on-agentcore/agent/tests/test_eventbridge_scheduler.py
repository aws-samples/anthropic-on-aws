#!/usr/bin/env python3
"""
Test EventBridge Scheduler functionality

Tests:
- Create one-time schedule (watchdog pattern)
- List schedules in group
- Get schedule details
- Delete schedule

Run: python3 tests/test_eventbridge_scheduler.py
"""

import boto3
import json
from datetime import datetime, timedelta

def test_eventbridge_scheduler():
    """Test EventBridge Scheduler operations"""
    print("\n" + "=" * 80)
    print("EVENTBRIDGE SCHEDULER TEST")
    print("=" * 80)

    # Configuration from CDK outputs
    schedule_group_name = "github-agent-watchdog-dev"
    scheduler_role_arn = "arn:aws:iam::046264621987:role/github-agent-automation-dev-SchedulerRole59E73443-KJ4JL7bfOcfV"

    # Test schedule name
    test_schedule_name = f"test-schedule-{int(datetime.now().timestamp())}"

    print(f"Schedule Group: {schedule_group_name}")
    print(f"Test Schedule: {test_schedule_name}")
    print(f"Timestamp: {datetime.now().isoformat()}")

    try:
        client = boto3.client('scheduler', region_name='us-east-1')

        # Step 1: Verify schedule group exists
        print("\n📋 Step 1: Verify schedule group exists...")
        try:
            response = client.get_schedule_group(Name=schedule_group_name)
            print(f"✅ Schedule group found: {response['Name']}")
            print(f"   State: {response['State']}")
            print(f"   ARN: {response['Arn']}")
        except client.exceptions.ResourceNotFoundException:
            print(f"❌ Schedule group not found: {schedule_group_name}")
            return False

        # Step 2: Create test schedule (one-time, 2 minutes from now)
        print("\n📋 Step 2: Create test schedule...")
        schedule_time = datetime.now() + timedelta(minutes=2)
        schedule_expression = f"at({schedule_time.strftime('%Y-%m-%dT%H:%M:%S')})"

        # Dummy target (Lambda ARN that doesn't exist yet - will fail to invoke but schedule will work)
        # Using a placeholder ARN format
        dummy_lambda_arn = "arn:aws:lambda:us-east-1:046264621987:function:watchdog-lambda-placeholder"

        try:
            client.create_schedule(
                Name=test_schedule_name,
                GroupName=schedule_group_name,
                ScheduleExpression=schedule_expression,
                FlexibleTimeWindow={'Mode': 'OFF'},
                Target={
                    'Arn': dummy_lambda_arn,
                    'RoleArn': scheduler_role_arn,
                    'Input': json.dumps({
                        'workflow_id': 'test-workflow-123',
                        'action': 'CHECK_COMPLETION'
                    })
                },
                State='ENABLED',
                Description='Test schedule for watchdog pattern validation'
            )
            print(f"✅ Created schedule: {test_schedule_name}")
            print(f"   Scheduled for: {schedule_time.isoformat()}")
            print(f"   Expression: {schedule_expression}")
        except Exception as e:
            print(f"❌ Failed to create schedule: {e}")
            return False

        # Step 3: List schedules in group
        print("\n📋 Step 3: List schedules in group...")
        response = client.list_schedules(GroupName=schedule_group_name)
        schedules = response.get('Schedules', [])
        print(f"✅ Found {len(schedules)} schedule(s) in group:")
        for schedule in schedules:
            print(f"   - {schedule['Name']} ({schedule['State']})")

        # Step 4: Get schedule details
        print("\n📋 Step 4: Get schedule details...")
        response = client.get_schedule(
            Name=test_schedule_name,
            GroupName=schedule_group_name
        )
        print(f"✅ Retrieved schedule details:")
        print(f"   Name: {response['Name']}")
        print(f"   State: {response['State']}")
        print(f"   Expression: {response['ScheduleExpression']}")
        print(f"   Target ARN: {response['Target']['Arn']}")

        # Step 5: Delete test schedule
        print("\n📋 Step 5: Delete test schedule...")
        client.delete_schedule(
            Name=test_schedule_name,
            GroupName=schedule_group_name
        )
        print(f"✅ Deleted schedule: {test_schedule_name}")

        # Step 6: Verify deletion
        print("\n📋 Step 6: Verify schedule deleted...")
        try:
            client.get_schedule(
                Name=test_schedule_name,
                GroupName=schedule_group_name
            )
            print(f"❌ Schedule still exists (should be deleted)")
            return False
        except client.exceptions.ResourceNotFoundException:
            print(f"✅ Schedule successfully deleted (not found)")

        # Success
        print("\n" + "=" * 80)
        print("✅ ALL TESTS PASSED - EventBridge Scheduler is operational!")
        print("=" * 80)
        return True

    except Exception as e:
        print(f"\n❌ Test failed: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    import sys
    success = test_eventbridge_scheduler()
    sys.exit(0 if success else 1)
