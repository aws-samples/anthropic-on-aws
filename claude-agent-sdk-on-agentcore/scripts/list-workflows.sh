#!/bin/bash
# List recent workflows with status
# Usage: ./list-workflows.sh [environment] [limit]

set -e

ENVIRONMENT="${1:-dev}"
LIMIT="${2:-10}"
TABLE_NAME="github-agent-automation-${ENVIRONMENT}-WorkflowStateTable194BB4D1-GNGY8DGTCEJJ"

echo "==================================================================="
echo "Recent Workflows (${ENVIRONMENT})"
echo "==================================================================="
echo ""

aws dynamodb scan \
    --table-name "$TABLE_NAME" \
    --max-items "$LIMIT" \
    | jq -r '.Items | sort_by(.created_at.S) | reverse | .[] |
        "[\(.status.S | if . == "COMPLETED" then "✅" elif . == "RUNNING" then "🔄" elif . == "FAILED" then "❌" else "⏸️" end)] " +
        "PR #\(.github_event.M.pull_request.M.number.N) | " +
        "\(.github_event.M.pull_request.M.title.S[0:50])... | " +
        "\(.created_at.S) | " +
        "ID: \(.workflow_id.S[0:8])..."'

echo ""
echo "==================================================================="
echo "To extract logs for a workflow:"
echo "  ./scripts/extract-workflow-logs.sh <workflow_id> $ENVIRONMENT"
echo "==================================================================="
