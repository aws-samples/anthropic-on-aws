#!/bin/bash

# Launch Streamlit UI for Claude Code Agent
# Usage: ./run_streamlit.sh

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         Claude Code Agent - Streamlit UI                      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check if deployment.json exists
if [ ! -f "deployment.json" ]; then
    echo "❌ deployment.json not found!"
    echo "   Please run ./deploy.sh first to deploy the agent."
    exit 1
fi

# Check if streamlit is installed
if ! command -v streamlit &> /dev/null; then
    echo "📦 Installing dependencies..."
    pip install streamlit boto3 bedrock-agentcore
fi

echo "🚀 Starting Streamlit UI..."
echo ""
echo "💡 The UI will open in your browser automatically"
echo "   If not, navigate to: http://localhost:8501"
echo ""
echo "📝 Features:"
echo "   • Tab 1: Chat with the agent"
echo "   • Tab 2: View short-term memory (conversation history)"
echo "   • Tab 3: View long-term memory (extracted knowledge)"
echo ""
echo "🔄 Click 'New Session' in the sidebar to start a fresh conversation"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Launch Streamlit
streamlit run streamlit_app.py
