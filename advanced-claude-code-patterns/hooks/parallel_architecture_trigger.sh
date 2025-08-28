#!/bin/bash

# Parallel Architecture Workflow Trigger Hook
# Detects requests for comprehensive architecture workflows

# Read input from stdin (Claude Code hook input format)
INPUT_JSON=$(cat)

# Extract prompt from Claude Code hook input
USER_PROMPT=$(echo "$INPUT_JSON" | jq -r '.prompt // empty')

if [ -z "$USER_PROMPT" ]; then
    # No prompt found, allow normal processing
    exit 0
fi

# Check if this is a comprehensive architecture workflow request
TRIGGERED=false
TRIGGER_PATTERNS=(
    "complete architecture"
    "full architecture" 
    "design and document"
    "architecture workflow"
    "end-to-end architecture"
    "architecture project"
    "comprehensive architecture"
    "full system design"
)

for pattern in "${TRIGGER_PATTERNS[@]}"; do
    if echo "$USER_PROMPT" | grep -i "$pattern" > /dev/null 2>&1; then
        TRIGGERED=true
        break
    fi
done

if [ "$TRIGGERED" = false ]; then
    # Not a comprehensive architecture request, allow normal processing
    exit 0
fi

# Comprehensive architecture request detected - provide guidance
echo "🎯 Comprehensive architecture workflow request detected!" >&2
echo "" >&2
echo "Consider using multiple agents for complete architecture:" >&2
echo "  @architect analyze requirements and design system architecture" >&2
echo "  @architecture-documenter create comprehensive documentation" >&2
echo "" >&2
echo "Or use workflow commands for coordinated execution:" >&2
echo "  /epcc 'complete architecture design and documentation'" >&2
echo "" >&2

# Allow the prompt to proceed normally (user can then deploy agents)
exit 0