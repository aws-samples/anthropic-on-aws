#!/bin/bash
# Monitor AgentCore logs in real-time
# Usage: ./monitor-logs-realtime.sh [environment] [duration_seconds]

set -e

ENVIRONMENT="${1:-dev}"
DURATION="${2:-60}"

echo "==================================================================="
echo "Monitoring AgentCore logs in real-time"
echo "Environment: $ENVIRONMENT"
echo "Duration: ${DURATION}s"
echo "==================================================================="
echo ""
echo "Press Ctrl+C to stop monitoring"
echo ""

LOG_GROUP="github-agent-automation-${ENVIRONMENT}-ObservabilityAgentcoreLogs6B693794-JGRhgoefFflY"

# Monitor logs with color highlighting
aws logs tail "$LOG_GROUP" \
    --since "${DURATION}s" \
    --follow \
    --format short \
    | while read -r line; do
        # Highlight important log patterns
        if echo "$line" | grep -q "ERROR"; then
            echo -e "\033[0;31m$line\033[0m"  # Red
        elif echo "$line" | grep -q "ORCHESTRATOR"; then
            echo -e "\033[0;34m$line\033[0m"  # Blue
        elif echo "$line" | grep -q "EXECUTOR"; then
            echo -e "\033[0;32m$line\033[0m"  # Green
        elif echo "$line" | grep -q "PLANNER"; then
            echo -e "\033[0;33m$line\033[0m"  # Yellow
        elif echo "$line" | grep -q "STARTUP"; then
            echo -e "\033[0;36m$line\033[0m"  # Cyan
        else
            echo "$line"
        fi
    done
