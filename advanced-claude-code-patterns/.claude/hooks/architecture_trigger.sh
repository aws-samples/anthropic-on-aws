#!/bin/bash

# Architecture Design Trigger Hook
# Detects architecture design requests and provides guidance

# Read input from stdin (Claude Code hook input format)
INPUT_JSON=$(cat)

# Extract prompt from Claude Code hook input
USER_PROMPT=$(echo "$INPUT_JSON" | jq -r '.prompt // empty')

if [ -z "$USER_PROMPT" ]; then
    # No prompt found, allow normal processing
    exit 0
fi

# Check if this is an architecture design request
TRIGGERED=false
TRIGGER_PATTERNS=(
    "design architecture"
    "architecture for"
    "system design"
    "design system"
    "architecture pattern"
    "choose architecture"
    "system architecture"
    "application architecture"
)

for pattern in "${TRIGGER_PATTERNS[@]}"; do
    if echo "$USER_PROMPT" | grep -i "$pattern" > /dev/null 2>&1; then
        TRIGGERED=true
        break
    fi
done

if [ "$TRIGGERED" = false ]; then
    # Not an architecture request, allow normal processing
    exit 0
fi

# Architecture request detected - provide guidance
echo "🏗️ Architecture design request detected!" >&2
echo "" >&2
echo "Consider using the @architect agent for comprehensive system design:" >&2
echo "  @architect analyze this project and recommend architecture" >&2
echo "" >&2
echo "Or use architecture workflow commands:" >&2
echo "  /architecture-design for systematic design process" >&2
echo "" >&2

# Allow the prompt to proceed normally (Claude can then use the suggestions)
exit 0