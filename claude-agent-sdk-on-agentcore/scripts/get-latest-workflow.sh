#!/bin/bash
# Get the latest workflow and extract its logs
# Usage: ./get-latest-workflow.sh [environment]

set -e

ENVIRONMENT="${1:-dev}"
TABLE_NAME="github-agent-automation-${ENVIRONMENT}-WorkflowStateTable194BB4D1-GNGY8DGTCEJJ"

echo "==================================================================="
echo "Finding latest workflow in environment: $ENVIRONMENT"
echo "==================================================================="
echo ""

# Get the most recent workflow
LATEST_WORKFLOW=$(aws dynamodb scan \
    --table-name "$TABLE_NAME" \
    --max-items 10 \
    | jq -r '.Items | sort_by(.created_at.S) | reverse | .[0]')

if [ "$LATEST_WORKFLOW" = "null" ] || [ -z "$LATEST_WORKFLOW" ]; then
    echo "❌ No workflows found"
    exit 1
fi

WORKFLOW_ID=$(echo "$LATEST_WORKFLOW" | jq -r '.workflow_id.S')
STATUS=$(echo "$LATEST_WORKFLOW" | jq -r '.status.S')
PR_NUMBER=$(echo "$LATEST_WORKFLOW" | jq -r '.github_event.M.pull_request.M.number.N')
PR_TITLE=$(echo "$LATEST_WORKFLOW" | jq -r '.github_event.M.pull_request.M.title.S')
CREATED_AT=$(echo "$LATEST_WORKFLOW" | jq -r '.created_at.S')

echo "📋 Latest Workflow:"
echo "-------------------------------------------------------------------"
echo "Workflow ID: $WORKFLOW_ID"
echo "Status: $STATUS"
echo "PR #$PR_NUMBER: $PR_TITLE"
echo "Created: $CREATED_AT"
echo ""

# Ask user if they want to extract logs
read -p "Extract logs for this workflow? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    exec ./scripts/extract-workflow-logs.sh "$WORKFLOW_ID" "$ENVIRONMENT"
else
    echo "Workflow ID: $WORKFLOW_ID"
    echo "To extract logs later, run:"
    echo "  ./scripts/extract-workflow-logs.sh $WORKFLOW_ID $ENVIRONMENT"
fi
