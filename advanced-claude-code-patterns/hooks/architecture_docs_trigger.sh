#!/bin/bash

# Architecture Documentation Trigger Hook
# Detects documentation requests and provides guidance

# Read input from stdin (Claude Code hook input format)
INPUT_JSON=$(cat)

# Extract prompt from Claude Code hook input
USER_PROMPT=$(echo "$INPUT_JSON" | jq -r '.prompt // empty')

if [ -z "$USER_PROMPT" ]; then
    # No prompt found, allow normal processing
    exit 0
fi

# Check if this is a documentation request
TRIGGERED=false
TRIGGER_PATTERNS=(
    "document architecture"
    "create diagrams"
    "architecture documentation"
    "create ADR"
    "document system"
    "architecture overview"
    "create C4"
    "system diagram"
)

for pattern in "${TRIGGER_PATTERNS[@]}"; do
    if echo "$USER_PROMPT" | grep -i "$pattern" > /dev/null 2>&1; then
        TRIGGERED=true
        break
    fi
done

if [ "$TRIGGERED" = false ]; then
    # Not a documentation request, allow normal processing
    exit 0
fi

# Documentation request detected - provide guidance
echo "📋 Architecture documentation request detected!" >&2
echo "" >&2
echo "Consider using the @architecture-documenter agent for comprehensive documentation:" >&2
echo "  @architecture-documenter create C4 diagrams and ADRs for this system" >&2
echo "" >&2
echo "Or use documentation workflow commands:" >&2
echo "  /architecture-docs for systematic documentation process" >&2
echo "" >&2

# Allow the prompt to proceed normally
exit 0