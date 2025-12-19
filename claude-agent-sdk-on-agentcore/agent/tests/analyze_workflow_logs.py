#!/usr/bin/env python3
"""
Workflow Log Analysis Tool

Analyzes CloudWatch logs for a specific GitHub PR review agent workflow.
Extracts and validates workflow execution, including planner/executor steps,
timing information, and error detection.

Usage:
    python3 analyze_workflow_logs.py <workflow_id>
    python3 analyze_workflow_logs.py --list-recent

Examples:
    # Analyze specific workflow
    python3 analyze_workflow_logs.py 52bf72d6-461d-4775-a366-1bf930901d52

    # List recent workflows
    python3 analyze_workflow_logs.py --list-recent
"""

import argparse
import json
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import boto3
from botocore.exceptions import ClientError


# AWS Configuration
REGION = "us-east-1"
LOG_STREAM = "otel-rt-logs"
DYNAMODB_TABLE = "github-agent-automation-dev-WorkflowStateTable194BB4D1-GNGY8DGTCEJJ"
CLOUDFORMATION_STACK = "github-agent-automation-dev"

# Log analysis patterns
WORKFLOW_START_PATTERNS = ["[START]", "AgentCore Runtime invocation received"]
WORKFLOW_END_PATTERNS = ["[END]", "workflow status to COMPLETED"]
PLANNER_PATTERNS = ["[PLANNER]", "Step 1:", "Step 2:", "Step 3:"]
EXECUTOR_PATTERNS = ["[EXECUTOR]", "Executing step"]
ERROR_PATTERNS = ["ERROR", "Exception", "Failed", "[ERROR]"]
PERMISSION_PATTERNS = ["[PERMISSION]"]
TOOL_CALL_PATTERNS = ["Allowing gh command", "Denying"]


class WorkflowAnalyzer:
    """Analyzes workflow execution logs from CloudWatch."""

    def __init__(self, workflow_id: str):
        self.workflow_id = workflow_id
        self.logs_client = boto3.client('logs', region_name=REGION)
        self.dynamodb = boto3.resource('dynamodb', region_name=REGION)
        self.cloudformation = boto3.client('cloudformation', region_name=REGION)
        self.table = self.dynamodb.Table(DYNAMODB_TABLE)

        self.events = []
        self.workflow_metadata = {}
        self.log_group = None  # Will be discovered from CloudFormation stack
        self.analysis = {
            'workflow_id': workflow_id,
            'start_time': None,
            'end_time': None,
            'duration_seconds': None,
            'status': None,
            'planner_steps': [],
            'executor_steps': [],
            'errors': [],
            'tool_calls': [],
            'permission_checks': [],
            'state_transitions': []
        }

    def discover_log_group(self) -> Optional[str]:
        """Discover the AgentCore runtime log group from CloudFormation stack.

        DESIGN PHILOSOPHY: We don't guess or search for resources. We designed the
        infrastructure, so we query CloudFormation (our source of truth) for the
        exact resource IDs we need.

        The log group name follows the pattern:
        /aws/bedrock-agentcore/runtimes/<runtime-name>-DEFAULT

        Where <runtime-name> is the PhysicalResourceId of the AgentCore Runtime
        resource in the CloudFormation stack.
        """
        try:
            # Query CloudFormation stack for AgentCore Runtime resource
            response = self.cloudformation.describe_stack_resources(
                StackName=CLOUDFORMATION_STACK
            )

            # Find the AgentCore Runtime resource
            runtime_resource = None
            for resource in response['StackResources']:
                if resource['ResourceType'] == 'AWS::BedrockAgentCore::Runtime':
                    runtime_resource = resource
                    break

            if not runtime_resource:
                print(f"⚠️  No AgentCore Runtime found in CloudFormation stack: {CLOUDFORMATION_STACK}")
                print("   This usually means the runtime hasn't been deployed yet")
                return None

            # Extract the runtime name from PhysicalResourceId
            runtime_name = runtime_resource['PhysicalResourceId']

            # Construct log group name
            # Pattern: /aws/bedrock-agentcore/runtimes/<runtime-name>-DEFAULT
            self.log_group = f"/aws/bedrock-agentcore/runtimes/{runtime_name}-DEFAULT"

            return self.log_group

        except ClientError as e:
            if e.response['Error']['Code'] == 'ValidationError':
                print(f"⚠️  CloudFormation stack not found: {CLOUDFORMATION_STACK}")
                print("   Please update CLOUDFORMATION_STACK constant in the script")
            else:
                print(f"❌ Error querying CloudFormation: {e}")
            return None

    def fetch_workflow_metadata(self) -> Dict:
        """Fetch workflow metadata from DynamoDB."""
        try:
            response = self.table.get_item(
                Key={'workflow_id': self.workflow_id}
            )

            if 'Item' in response:
                item = response['Item']
                self.workflow_metadata = {
                    'workflow_id': item.get('workflow_id'),
                    'trace_id': item.get('trace_id'),  # OpenTelemetry trace ID
                    'status': item.get('status'),
                    'retry_count': int(item.get('retry_count', 0)),
                    'repo': item.get('repo'),
                    'pr_number': item.get('pr_number'),
                    'created_at': item.get('created_at'),
                    'updated_at': item.get('updated_at'),
                    'error_message': item.get('error_message')
                }
                return self.workflow_metadata
            else:
                print(f"⚠️  Warning: No DynamoDB record found for workflow {self.workflow_id}")
                return {}

        except ClientError as e:
            print(f"❌ Error fetching DynamoDB metadata: {e}")
            return {}

    def fetch_logs(self, hours_back: int = 2) -> List[Dict]:
        """Fetch logs from CloudWatch for the workflow.

        Strategy: Use trace_id from DynamoDB for direct filtering.
        We designed the system to store trace_id, so we know it's there.
        """
        # Use workflow timestamps if available, otherwise use hours_back
        # Note: There can be a delay between created_at and when agent logs start appearing
        if self.workflow_metadata and self.workflow_metadata.get('updated_at'):
            try:
                # Parse timestamps as UTC (they come from DynamoDB with +00:00)
                # IMPORTANT: Don't strip timezone info, or Python treats them as local time
                updated_time = datetime.fromisoformat(self.workflow_metadata['updated_at'])
                created_time = datetime.fromisoformat(self.workflow_metadata['created_at'])

                # Search from created_at to 5 minutes after updated_at
                # (agent logs may appear anytime between these)
                start_time = int(created_time.timestamp() * 1000)
                end_time = int((updated_time + timedelta(minutes=5)).timestamp() * 1000)
            except (ValueError, TypeError):
                start_time = int((datetime.now() - timedelta(hours=hours_back)).timestamp() * 1000)
                end_time = None
        else:
            start_time = int((datetime.now() - timedelta(hours=hours_back)).timestamp() * 1000)
            end_time = None

        # Ensure log group is discovered
        if not self.log_group:
            print("⚠️  Log group not discovered yet, attempting discovery...")
            if not self.discover_log_group():
                return []

        # Get trace_id from DynamoDB
        workflow_trace_id = self.workflow_metadata.get('trace_id')
        if not workflow_trace_id:
            print(f"❌ No trace_id found in DynamoDB for workflow {self.workflow_id}")
            print("   This workflow may be from before the trace_id enhancement was deployed")
            return []

        try:
            request_params = {
                'logGroupName': self.log_group,
                'logStreamName': LOG_STREAM,
                'startTime': start_time,
                'limit': 10000
            }
            if end_time:
                request_params['endTime'] = end_time

            response = self.logs_client.get_log_events(**request_params)

            # Filter by trace_id directly (efficient!)
            for event in response['events']:
                try:
                    otel_json = json.loads(event['message'])
                    if 'body' in otel_json:
                        trace_id = otel_json.get('traceId')

                        if trace_id == workflow_trace_id:
                            message_body = otel_json['body']
                            self.events.append({
                                'timestamp': event['timestamp'],
                                'datetime': datetime.fromtimestamp(event['timestamp'] / 1000),
                                'message': message_body,
                                'severity': otel_json.get('severityText', 'INFO'),
                                'trace_id': trace_id,
                                'span_id': otel_json.get('spanId'),
                                'attributes': otel_json.get('attributes', {})
                            })
                except json.JSONDecodeError:
                    continue

            print(f"✅ Found {len(self.events)} log events for workflow {self.workflow_id}")
            print(f"   Using trace ID from DynamoDB: {workflow_trace_id}")
            if self.events:
                print(f"   Time range: {self.events[0]['datetime']} to {self.events[-1]['datetime']}")

            return self.events

        except ClientError as e:
            print(f"❌ Error fetching logs: {e}")
            return []

    def analyze_logs(self):
        """Analyze fetched logs and extract key information."""
        if not self.events:
            print("⚠️  No log events to analyze")
            return

        # Sort events by timestamp
        self.events.sort(key=lambda x: x['timestamp'])

        # Find start and end times
        if self.events:
            self.analysis['start_time'] = self.events[0]['datetime']
            self.analysis['end_time'] = self.events[-1]['datetime']
            self.analysis['duration_seconds'] = (
                self.events[-1]['timestamp'] - self.events[0]['timestamp']
            ) / 1000

        # Extract information from each log entry
        current_step = None

        for event in self.events:
            msg = event['message']

            # Skip if message is not a string
            if not isinstance(msg, str):
                continue

            # Check for errors
            if any(pattern in msg for pattern in ERROR_PATTERNS):
                self.analysis['errors'].append({
                    'timestamp': event['datetime'],
                    'message': msg,
                    'severity': event['severity']
                })

            # Check for planner steps
            if '[PLANNER]' in msg or any(f"Step {i}:" in msg for i in range(1, 20)):
                self.analysis['planner_steps'].append({
                    'timestamp': event['datetime'],
                    'message': msg
                })

            # Check for executor steps
            if '[EXECUTOR]' in msg or 'Executing step' in msg:
                self.analysis['executor_steps'].append({
                    'timestamp': event['datetime'],
                    'message': msg
                })

            # Check for permission decisions
            if '[PERMISSION]' in msg:
                self.analysis['permission_checks'].append({
                    'timestamp': event['datetime'],
                    'message': msg,
                    'allowed': '✅' in msg or 'Allowing' in msg
                })

            # Check for tool calls
            if 'gh ' in msg and ('[PERMISSION]' in msg or 'command' in msg.lower()):
                self.analysis['tool_calls'].append({
                    'timestamp': event['datetime'],
                    'message': msg
                })

            # Check for state transitions
            if 'workflow status to' in msg or 'status:' in msg.lower():
                self.analysis['state_transitions'].append({
                    'timestamp': event['datetime'],
                    'message': msg
                })

        # Set final status
        if self.workflow_metadata:
            self.analysis['status'] = self.workflow_metadata.get('status')
        elif any('COMPLETED' in e['message'] for e in self.events):
            self.analysis['status'] = 'COMPLETED'
        elif any('FAILED' in e['message'] for e in self.events):
            self.analysis['status'] = 'FAILED'
        else:
            self.analysis['status'] = 'UNKNOWN'

    def generate_report(self) -> str:
        """Generate a human-readable analysis report."""
        lines = []
        lines.append("=" * 80)
        lines.append("WORKFLOW LOG ANALYSIS REPORT")
        lines.append("=" * 80)
        lines.append("")

        # Workflow Overview
        lines.append("## Workflow Overview")
        lines.append(f"Workflow ID: {self.workflow_id}")

        if self.workflow_metadata:
            lines.append(f"Repository: {self.workflow_metadata.get('repo', 'N/A')}")
            lines.append(f"PR Number: {self.workflow_metadata.get('pr_number', 'N/A')}")
            lines.append(f"Status: {self.workflow_metadata.get('status', 'N/A')}")
            lines.append(f"Retry Count: {self.workflow_metadata.get('retry_count', 0)}")
            lines.append(f"Created: {self.workflow_metadata.get('created_at', 'N/A')}")
            lines.append(f"Updated: {self.workflow_metadata.get('updated_at', 'N/A')}")
            if self.workflow_metadata.get('error_message'):
                lines.append(f"Error Message: {self.workflow_metadata['error_message']}")

        lines.append("")

        # Execution Timeline
        lines.append("## Execution Timeline")
        if self.analysis['start_time'] and self.analysis['end_time']:
            lines.append(f"Start Time: {self.analysis['start_time']}")
            lines.append(f"End Time: {self.analysis['end_time']}")
            lines.append(f"Duration: {self.analysis['duration_seconds']:.1f} seconds")
        else:
            lines.append("⚠️  Timeline information not available")
        lines.append("")

        # Planner Steps
        lines.append("## Planner Steps")
        if self.analysis['planner_steps']:
            for i, step in enumerate(self.analysis['planner_steps'], 1):
                lines.append(f"{i}. [{step['timestamp'].strftime('%H:%M:%S')}] {step['message']}")
        else:
            lines.append("⚠️  No planner steps found in logs")
        lines.append("")

        # Executor Steps
        lines.append("## Executor Steps")
        if self.analysis['executor_steps']:
            for i, step in enumerate(self.analysis['executor_steps'], 1):
                lines.append(f"{i}. [{step['timestamp'].strftime('%H:%M:%S')}] {step['message']}")
        else:
            lines.append("⚠️  No executor steps found in logs")
        lines.append("")

        # Permission Checks
        lines.append("## Security Permission Checks")
        if self.analysis['permission_checks']:
            allowed = sum(1 for p in self.analysis['permission_checks'] if p['allowed'])
            denied = len(self.analysis['permission_checks']) - allowed
            lines.append(f"Total Checks: {len(self.analysis['permission_checks'])} (✅ {allowed} allowed, ❌ {denied} denied)")
            lines.append("")
            for check in self.analysis['permission_checks'][:10]:  # Show first 10
                icon = "✅" if check['allowed'] else "❌"
                lines.append(f"{icon} [{check['timestamp'].strftime('%H:%M:%S')}] {check['message'][:100]}")
            if len(self.analysis['permission_checks']) > 10:
                lines.append(f"... and {len(self.analysis['permission_checks']) - 10} more")
        else:
            lines.append("⚠️  No permission checks found")
        lines.append("")

        # Tool Calls
        lines.append("## Tool Calls (gh CLI)")
        if self.analysis['tool_calls']:
            lines.append(f"Total gh commands: {len(self.analysis['tool_calls'])}")
            for call in self.analysis['tool_calls'][:10]:  # Show first 10
                lines.append(f"  [{call['timestamp'].strftime('%H:%M:%S')}] {call['message'][:100]}")
            if len(self.analysis['tool_calls']) > 10:
                lines.append(f"... and {len(self.analysis['tool_calls']) - 10} more")
        else:
            lines.append("⚠️  No tool calls found")
        lines.append("")

        # State Transitions
        lines.append("## Workflow State Transitions")
        if self.analysis['state_transitions']:
            for transition in self.analysis['state_transitions']:
                lines.append(f"  [{transition['timestamp'].strftime('%H:%M:%S')}] {transition['message']}")
        else:
            lines.append("⚠️  No state transitions found in logs")
        lines.append("")

        # Errors
        lines.append("## Errors and Warnings")
        if self.analysis['errors']:
            lines.append(f"❌ Found {len(self.analysis['errors'])} errors:")
            for error in self.analysis['errors']:
                lines.append(f"  [{error['timestamp'].strftime('%H:%M:%S')}] {error['severity']}: {error['message'][:150]}")
        else:
            lines.append("✅ No errors detected")
        lines.append("")

        # Validation Summary
        lines.append("## Validation Summary")
        validations = []

        if self.workflow_metadata:
            if self.workflow_metadata.get('status') == 'COMPLETED':
                validations.append("✅ Workflow completed successfully")
            else:
                validations.append(f"❌ Workflow status: {self.workflow_metadata.get('status')}")

            if self.workflow_metadata.get('retry_count', 0) == 0:
                validations.append("✅ No retries (retry_count = 0)")
            else:
                validations.append(f"⚠️  Workflow retried {self.workflow_metadata['retry_count']} times")

        if self.analysis['errors']:
            validations.append(f"⚠️  {len(self.analysis['errors'])} errors found in logs")
        else:
            validations.append("✅ No errors in execution logs")

        if self.analysis['planner_steps']:
            validations.append(f"✅ Planner generated {len(self.analysis['planner_steps'])} steps")
        else:
            validations.append("⚠️  No planner steps detected")

        if self.analysis['executor_steps']:
            validations.append(f"✅ Executor ran {len(self.analysis['executor_steps'])} steps")
        else:
            validations.append("⚠️  No executor steps detected")

        for validation in validations:
            lines.append(validation)

        lines.append("")
        lines.append("=" * 80)

        return "\n".join(lines)

    def run_analysis(self) -> Dict:
        """Run complete analysis workflow."""
        print(f"🔍 Analyzing workflow: {self.workflow_id}")
        print()

        # Discover log group
        print("🔎 Discovering AgentCore runtime log group...")
        if not self.discover_log_group():
            print("❌ Cannot proceed without log group")
            return {}
        print(f"✅ Using log group: {self.log_group}")
        print()

        # Fetch metadata
        print("📊 Fetching workflow metadata from DynamoDB...")
        self.fetch_workflow_metadata()

        # Fetch logs
        print("📥 Fetching logs from CloudWatch...")
        self.fetch_logs()

        if not self.events:
            print("❌ No logs found for this workflow. Possible reasons:")
            print("   - Workflow ID is incorrect")
            print("   - Logs are older than 2 hours (increase hours_back)")
            print("   - Workflow hasn't executed yet")
            return {}

        # Analyze
        print("🔬 Analyzing logs...")
        self.analyze_logs()

        # Generate report
        print()
        print(self.generate_report())

        return self.analysis


def list_recent_workflows(hours_back: int = 24) -> List[Dict]:
    """List recent workflows from DynamoDB."""
    dynamodb = boto3.resource('dynamodb', region_name=REGION)
    table = dynamodb.Table(DYNAMODB_TABLE)

    try:
        # Scan for recent workflows
        response = table.scan(
            Limit=50
        )

        workflows = []
        for item in response.get('Items', []):
            workflows.append({
                'workflow_id': item.get('workflow_id'),
                'status': item.get('status'),
                'repo': item.get('repo'),
                'pr_number': item.get('pr_number'),
                'created_at': item.get('created_at'),
                'retry_count': int(item.get('retry_count', 0))
            })

        # Sort by created_at descending
        workflows.sort(key=lambda x: x.get('created_at', ''), reverse=True)

        return workflows[:20]  # Return top 20

    except ClientError as e:
        print(f"❌ Error listing workflows: {e}")
        return []


def main():
    parser = argparse.ArgumentParser(
        description='Analyze GitHub PR review agent workflow logs',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Analyze specific workflow
  python3 analyze_workflow_logs.py 52bf72d6-461d-4775-a366-1bf930901d52

  # List recent workflows
  python3 analyze_workflow_logs.py --list-recent

  # Analyze with extended time window
  python3 analyze_workflow_logs.py <workflow_id> --hours-back 6
        """
    )

    parser.add_argument(
        'workflow_id',
        nargs='?',
        help='Workflow ID to analyze'
    )

    parser.add_argument(
        '--list-recent',
        action='store_true',
        help='List recent workflows from DynamoDB'
    )

    parser.add_argument(
        '--hours-back',
        type=int,
        default=2,
        help='How many hours back to search logs (default: 2)'
    )

    parser.add_argument(
        '--output',
        type=str,
        help='Save report to file'
    )

    args = parser.parse_args()

    # List recent workflows
    if args.list_recent:
        print("Recent Workflows:")
        print("=" * 80)
        workflows = list_recent_workflows()

        if not workflows:
            print("No workflows found")
            return

        for wf in workflows:
            status_icon = "✅" if wf['status'] == 'COMPLETED' else "❌" if wf['status'] == 'FAILED' else "🔄"
            print(f"{status_icon} {wf['workflow_id']}")
            print(f"   Status: {wf['status']} | Repo: {wf.get('repo', 'N/A')} | PR: {wf.get('pr_number', 'N/A')}")
            print(f"   Created: {wf.get('created_at', 'N/A')} | Retries: {wf.get('retry_count', 0)}")
            print()

        return

    # Analyze specific workflow
    if not args.workflow_id:
        parser.print_help()
        sys.exit(1)

    analyzer = WorkflowAnalyzer(args.workflow_id)
    analysis = analyzer.run_analysis()

    # Save to file if requested
    if args.output:
        report = analyzer.generate_report()
        with open(args.output, 'w') as f:
            f.write(report)
        print(f"\n💾 Report saved to: {args.output}")


if __name__ == '__main__':
    main()
