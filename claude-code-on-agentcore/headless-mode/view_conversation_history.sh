#!/bin/bash

# View conversation history (short-term memory)
# Usage: ./view_conversation_history.sh [actor_id] [session_id]

set -e

ACTOR_ID="${1:-default_user}"
SESSION_ID="${2:-}"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         Claude Code Agent - Conversation History              ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "👤 Actor ID: $ACTOR_ID"
if [ -n "$SESSION_ID" ]; then
    echo "🔗 Session ID: $SESSION_ID"
fi
echo ""

python3 << PYTHON_SCRIPT
import os
import sys
import boto3
from bedrock_agentcore.memory import MemoryClient
from datetime import datetime

def view_conversation_history(actor_id, session_id=None):
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
        
        if session_id:
            # Get conversation history for specific session
            try:
                turns = memory_client.get_last_k_turns(
                    memory_id=memory_id,
                    actor_id=actor_id,
                    session_id=session_id,
                    k=10  # Get last 10 turns
                )
                
                if turns:
                    print(f"📝 Session: {session_id}")
                    print(f"   Found {len(turns)} conversation turns")
                    print("")
                    
                    for turn_num, turn in enumerate(turns, 1):
                        print(f"   Turn {turn_num}:")
                        for message in turn:
                            role = message.get('role', 'UNKNOWN')
                            content = message.get('content', {}).get('text', '')
                            
                            # Truncate long messages
                            display_content = content if len(content) <= 150 else content[:150] + "..."
                            
                            print(f"      {role}: {display_content}")
                        print("")
                    
                else:
                    print(f"   No conversation history found for session: {session_id}")
                    print("   💡 Make sure you're using the correct session_id")
                
            except Exception as e:
                print(f"   ⚠️  Error retrieving conversation history: {e}")
        else:
            print("   ℹ️  No session ID provided")
            print("   Usage: ./view_conversation_history.sh <actor_id> <session_id>")
            print("")
            print("   Example:")
            print("   ./view_conversation_history.sh user123 session1")
        
        print("")
        print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        print("")
        print("💡 About Memory Types:")
        print("   • SHORT-TERM (Conversation History): Available immediately")
        print("   • LONG-TERM (Extracted Memories): Takes 5-10 minutes to extract")
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
session_id = "$SESSION_ID" if "$SESSION_ID" else None
view_conversation_history(actor_id, session_id)
PYTHON_SCRIPT
