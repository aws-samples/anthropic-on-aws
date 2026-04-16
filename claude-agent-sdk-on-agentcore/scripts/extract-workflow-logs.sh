#!/bin/bash
# Extract logs for a specific workflow ID
# Usage: ./extract-workflow-logs.sh <workflow_id> [environment]

set -e

WORKFLOW_ID="$1"
ENVIRONMENT="${2:-dev}"

if [ -z "$WORKFLOW_ID" ]; then
    echo "Usage: $0 <workflow_id> [environment]"
    echo "Example: $0 0c13c4d8-3a17-4724-b554-29aff087a415 dev"
    exit 1
fi

echo "==================================================================="
echo "Extracting logs for workflow: $WORKFLOW_ID"
echo "Environment: $ENVIRONMENT"
echo "==================================================================="
echo ""

# Get workflow details from DynamoDB
TABLE_NAME="github-agent-automation-${ENVIRONMENT}-WorkflowStateTable194BB4D1-GNGY8DGTCEJJ"
echo "📋 Workflow Details:"
echo "-------------------------------------------------------------------"
aws dynamodb get-item \
    --table-name "$TABLE_NAME" \
    --key "{\"workflow_id\":{\"S\":\"$WORKFLOW_ID\"}}" \
    | jq -r '.Item | {
        workflow_id: .workflow_id.S,
        status: .status.S,
        pr_number: .github_event.M.pull_request.M.number.N,
        pr_title: .github_event.M.pull_request.M.title.S,
        created_at: .created_at.S,
        updated_at: .updated_at.S,
        retry_count: .retry_count.N,
        error_message: .error_message.S
    } | to_entries | map("\(.key): \(.value)") | .[]'
echo ""

# Extract timestamp for log filtering
CREATED_AT=$(aws dynamodb get-item \
    --table-name "$TABLE_NAME" \
    --key "{\"workflow_id\":{\"S\":\"$WORKFLOW_ID\"}}" \
    | jq -r '.Item.created_at.S')

if [ "$CREATED_AT" = "null" ] || [ -z "$CREATED_AT" ]; then
    echo "❌ Workflow not found in DynamoDB"
    exit 1
fi

# Convert ISO timestamp to epoch milliseconds for AWS logs
START_TIME=$(date -j -f "%Y-%m-%dT%H:%M:%S" "${CREATED_AT:0:19}" +%s)000
START_TIME=$((START_TIME - 60000))  # Start 1 minute before

echo "🔍 Searching logs from: $CREATED_AT"
echo ""

# AgentCore logs
LOG_GROUP="github-agent-automation-${ENVIRONMENT}-ObservabilityAgentcoreLogs6B693794-JGRhgoefFflY"
echo "📝 AgentCore Logs:"
echo "-------------------------------------------------------------------"
aws logs filter-log-events \
    --log-group-name "$LOG_GROUP" \
    --start-time "$START_TIME" \
    --filter-pattern "\"$WORKFLOW_ID\"" \
    | jq -r '.events[] | "\(.timestamp | tonumber / 1000 | strftime("%Y-%m-%d %H:%M:%S")) | \(.message)"' \
    || echo "No AgentCore logs found for this workflow"
echo ""

# Webhook logs
WEBHOOK_LOG_GROUP="github-agent-automation-${ENVIRONMENT}-ObservabilityWebhookLogs56F144D1-3kEpzwAQcx9M"
echo "🌐 Webhook Logs:"
echo "-------------------------------------------------------------------"
aws logs filter-log-events \
    --log-group-name "$WEBHOOK_LOG_GROUP" \
    --start-time "$START_TIME" \
    --filter-pattern "\"$WORKFLOW_ID\"" \
    | jq -r '.events[] | "\(.timestamp | tonumber / 1000 | strftime("%Y-%m-%d %H:%M:%S")) | \(.message)"' \
    || echo "No webhook logs found for this workflow"
echo ""

# Invoker Lambda logs
INVOKER_LAMBDA=$(aws lambda list-functions | jq -r '.Functions[] | select(.FunctionName | contains("InvokerLambda")) | .FunctionName')
if [ -n "$INVOKER_LAMBDA" ]; then
    echo "⚡ Invoker Lambda Logs:"
    echo "-------------------------------------------------------------------"
    aws logs filter-log-events \
        --log-group-name "/aws/lambda/$INVOKER_LAMBDA" \
        --start-time "$START_TIME" \
        --filter-pattern "\"$WORKFLOW_ID\"" \
        | jq -r '.events[] | "\(.timestamp | tonumber / 1000 | strftime("%Y-%m-%d %H:%M:%S")) | \(.message)"' \
        || echo "No invoker logs found for this workflow"
    echo ""
fi

echo "==================================================================="
echo "✅ Log extraction complete"
echo "==================================================================="
