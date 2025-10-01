#!/bin/bash

# Display Claude Code agent deployment information
# Usage: ./show_agent_info.sh

set -e

INFO_FILE="deployment.json"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         Claude Code Agent - Deployment Information            ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check if deployment info exists
if [ ! -f "$INFO_FILE" ]; then
    echo "❌ No deployment found"
    echo ""
    echo "To deploy the agent, run:"
    echo "  ./deploy.sh"
    exit 1
fi

# Read deployment info
STACK_NAME=$(jq -r '.stack_name' "$INFO_FILE")
RUNTIME_ARN=$(jq -r '.runtime_arn' "$INFO_FILE")
IMAGE_URI=$(jq -r '.image_uri' "$INFO_FILE")
OUTPUT_BUCKET=$(jq -r '.output_bucket' "$INFO_FILE")
REGION=$(jq -r '.region' "$INFO_FILE")
ACCOUNT_ID=$(jq -r '.account_id' "$INFO_FILE")

echo "📦 Stack Name:    $STACK_NAME"
echo "📍 Region:        $REGION"
echo "🆔 Account ID:    $ACCOUNT_ID"
echo ""
echo "🎯 Runtime ARN:"
echo "   $RUNTIME_ARN"
echo ""
echo "🐳 Container Image:"
echo "   $IMAGE_URI"
echo ""
echo "📂 Output Bucket:"
echo "   $OUTPUT_BUCKET"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Quick Commands:"
echo ""
echo "  # Invoke agent:"
echo "  ./invoke_claude_code.sh \"Your prompt here\""
echo ""
echo "  # Download generated files:"
echo "  ./download_outputs.sh"
echo ""
echo "  # View CloudWatch logs:"
echo "  aws logs tail /aws/bedrock-agentcore/runtimes/claude_code_agent_runtime --follow"
echo ""
echo "  # Delete deployment:"
echo "  aws cloudformation delete-stack --stack-name $STACK_NAME --region $REGION"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
