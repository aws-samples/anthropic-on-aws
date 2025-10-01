#!/bin/bash

# Helper script to invoke Claude Code agent on AgentCore
# Usage: ./invoke_claude_code.sh "Your prompt here"

set -e

# Check if prompt is provided
if [ -z "$1" ]; then
    echo "❌ Error: No prompt provided"
    echo "Usage: ./invoke_claude_code.sh \"Your prompt here\""
    exit 1
fi

PROMPT="$1"
INFO_FILE="deployment.json"

# Check if deployment info exists
if [ ! -f "$INFO_FILE" ]; then
    echo "❌ Error: Deployment info file not found: $INFO_FILE"
    echo "Please run './deploy.sh' first to deploy the agent."
    exit 1
fi

# Read runtime ARN and region
RUNTIME_ARN=$(jq -r '.runtime_arn' "$INFO_FILE")
REGION=$(jq -r '.region' "$INFO_FILE")

# Generate output filename with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_FILE="response_${TIMESTAMP}.json"

echo "🚀 Invoking Claude Code Agent..."
echo "📝 Prompt: $PROMPT"
echo "⏳ This may take 30-60 seconds..."
echo ""

# Encode payload as base64
PAYLOAD=$(echo -n '{"input":{"prompt":"'"$PROMPT"'"}}' | base64)

# Invoke the agent
aws bedrock-agentcore invoke-agent-runtime \
    --agent-runtime-arn "$RUNTIME_ARN" \
    --region "$REGION" \
    --payload "$PAYLOAD" \
    "$OUTPUT_FILE"

# Check if invocation succeeded
if [ $? -eq 0 ]; then
    echo "✅ Invocation completed!"
    echo ""
    echo "📄 Response saved to: $OUTPUT_FILE"
    echo ""

    # Pretty print the response
    if command -v jq &> /dev/null; then
        echo "📊 Response:"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        jq -r '.output.result' "$OUTPUT_FILE" 2>/dev/null || cat "$OUTPUT_FILE"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "⏱️  Duration: $(jq -r '.output.metadata.duration_ms' "$OUTPUT_FILE" 2>/dev/null || echo 'N/A') ms"
        echo "🔄 Turns: $(jq -r '.output.metadata.num_turns' "$OUTPUT_FILE" 2>/dev/null || echo 'N/A')"

        # Check for uploaded files
        UPLOADED_FILES=$(jq -r '.output.metadata.uploaded_files' "$OUTPUT_FILE" 2>/dev/null)
        if [ "$UPLOADED_FILES" != "null" ] && [ "$UPLOADED_FILES" != "" ]; then
            FILE_COUNT=$(jq -r '.output.metadata.uploaded_files | length' "$OUTPUT_FILE" 2>/dev/null)
            if [ "$FILE_COUNT" -gt 0 ]; then
                echo ""
                echo "📁 Generated Files ($FILE_COUNT):"
                jq -r '.output.metadata.uploaded_files[] | "   • \(.file_name) → \(.s3_url)"' "$OUTPUT_FILE" 2>/dev/null
                echo ""
                echo "💡 Download files: ./download_outputs.sh"
            fi
        fi
    else
        echo "💡 Install 'jq' for prettier output: brew install jq (macOS) or apt-get install jq (Linux)"
        cat "$OUTPUT_FILE"
    fi
else
    echo "❌ Invocation failed"
    exit 1
fi
