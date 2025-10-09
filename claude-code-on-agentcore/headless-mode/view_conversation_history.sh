#!/bin/bash

# View conversation history (short-term memory)
# Usage: ./view_conversation_history.sh <actor_id> <session_id>

set -e

ACTOR_ID="${1:-}"
SESSION_ID="${2:-}"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         Claude Code Agent - Conversation History              ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

if [ -z "$ACTOR_ID" ] || [ -z "$SESSION_ID" ]; then
    echo "❌ Error: Both actor_id and session_id are required"
    echo ""
    echo "Usage: ./view_conversation_history.sh <actor_id> <session_id>"
    echo ""
    echo "Examples:"
    echo "  ./view_conversation_history.sh default_user 1760010931_session"
    echo "  ./view_conversation_history.sh user123 abc123_session"
    echo ""
    echo "💡 Tip: The session_id is displayed when you run the agent"
    echo "   Look for '🔗 Session ID:' in the output"
    exit 1
fi

echo "👤 Actor ID: $ACTOR_ID"
echo "🔗 Session ID: $SESSION_ID"
echo ""

python3 << PYTHON_SCRIPT
import os
import sys
import boto3
from bedrock_agentcore.memory import MemoryClient
from datetime import datetime

def view_conversation_history(actor_id, session_id):
    """View conversation history (short-term memory) for a specific session"""
    try:
        # Get memory ID from SSM
        region = os.environ.get("AWS_REGION", "us-east-1")
        ssm_client = boto3.client('ssm', region_name=region)
        
        try:
            response = ssm_client.get_parameter(Name='/claude-code-agent/memory-id')
            memory_id = response['Parameter']['Value']
            print(f"🧠 Memory ID: {memory_id}")
            print("")
        except Exception as e:
            print(f"❌ Could not retrieve memory ID from SSM: {e}")
            return False
        
        # Initialize memory client
        memory_client = MemoryClient(region_name=region)
        
        print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        print("💬 CONVERSATION HISTORY (Short-Term Memory)")
        print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        print("")
        
        # Get conversation history using get_last_k_turns
        try:
            turns = memory_client.get_last_k_turns(
                memory_id=memory_id,
                actor_id=actor_id,
                session_id=session_id,
                k=20  # Get last 20 turns
            )
            
            if turns:
                print(f"   Found {len(turns)} conversation turns")
                print("")
                
                for turn_num, turn in enumerate(turns, 1):
                    print(f"   Turn {turn_num}:")
                    for message in turn:
                        role = message.get('role', 'UNKNOWN')
                        content = message.get('content', {}).get('text', '')
                        
                        # Display full content for better readability
                        print(f"      {role}:")
                        # Split long content into multiple lines
                        if len(content) > 100:
                            lines = [content[i:i+100] for i in range(0, len(content), 100)]
                            for line in lines:
                                print(f"         {line}")
                        else:
                            print(f"         {content}")
                    print("")
                
            else:
                print(f"   ℹ️  No conversation history found for this session")
                print(f"   💡 Make sure the session has saved conversations")
                print(f"      Session ID: {session_id}")
                print(f"      Actor ID: {actor_id}")
            
        except Exception as e:
            print(f"   ⚠️  Error retrieving conversation history: {e}")
            import traceback
            traceback.print_exc()
        
        print("")
        print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        print("")
        print("💡 About Memory Types:")
        print("   • SHORT-TERM: Conversation history (get_last_k_turns)")
        print("   • LONG-TERM: Extracted facts/preferences (retrieve_memories)")
        print("")
        print("   To view long-term memories:")
        print("   ./view_memories.sh <actor_id>")
        print("")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

# Get arguments from environment
actor_id = "$ACTOR_ID"
session_id = "$SESSION_ID"
view_conversation_history(actor_id, session_id)
PYTHON_SCRIPT
