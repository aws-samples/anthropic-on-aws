#!/bin/bash

# View long-term memories extracted by AgentCore Memory
# Usage: ./view_memories.sh [actor_id]

set -e

ACTOR_ID="${1:-default_user}"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         Claude Code Agent - Long-Term Memories                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "👤 Actor ID: $ACTOR_ID"
echo ""

python3 << PYTHON_SCRIPT
import os
import sys
import boto3
from bedrock_agentcore.memory import MemoryClient
from datetime import datetime

def view_memories(actor_id):
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
        
        # Get memory details
        try:
            memory_info = memory_client.get_memory(memoryId=memory_id)
            print("📊 Memory Status:")
            print(f"   Name: {memory_info.get('name', 'N/A')}")
            print(f"   Status: {memory_info.get('status', 'N/A')}")
            print(f"   Created: {memory_info.get('createdAt', 'N/A')}")
            print("")
        except Exception as e:
            print(f"⚠️  Could not get memory details: {e}")
            print("")
        
        # Get namespaces from memory strategies
        try:
            strategies = memory_client.get_memory_strategies(memory_id)
            namespaces = {s["type"]: s["namespaces"][0] for s in strategies}
        except Exception as e:
            print(f"❌ Could not get memory strategies: {e}")
            return False
        
        print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        print("📚 LONG-TERM MEMORIES")
        print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        print("")
        
        # Retrieve memories from each namespace
        for context_type, namespace_template in namespaces.items():
            # Replace placeholders in namespace
            namespace = namespace_template.replace("{actorId}", actor_id)
            
            # Skip namespaces with unresolved placeholders (like {sessionId})
            if "{" in namespace or "}" in namespace:
                print(f"📁 {context_type.upper()} Memories")
                print(f"   Namespace: {namespace_template}")
                print(f"   ⚠️  Skipped: Contains session-specific placeholder")
                print("")
                print("─" * 70)
                print("")
                continue
            
            print(f"📁 {context_type.upper()} Memories")
            print(f"   Namespace: {namespace}")
            print("")
            
            try:
                memories = memory_client.retrieve_memories(
                    memory_id=memory_id,
                    namespace=namespace,
                    query="coding patterns, technical knowledge, preferences, facts",
                    top_k=10
                )
                
                if memories:
                    for i, memory in enumerate(memories, 1):
                        if isinstance(memory, dict):
                            content = memory.get('content', {})
                            if isinstance(content, dict):
                                text = content.get('text', '').strip()
                                if text:
                                    # Truncate long memories for display
                                    display_text = text if len(text) <= 200 else text[:200] + "..."
                                    print(f"   {i}. {display_text}")
                                    print("")
                    print(f"   Total: {len(memories)} memories found")
                else:
                    print("   No memories found yet.")
                    print("   💡 Memories are extracted automatically after conversations.")
                
            except Exception as e:
                print(f"   ⚠️  Error retrieving memories: {e}")
            
            print("")
            print("─" * 70)
            print("")
        
        print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        print("")
        print("💡 Tips:")
        print("   • Memories are extracted automatically after each conversation")
        print("   • Semantic memories capture facts and technical knowledge")
        print("   • User preference memories capture coding styles and preferences")
        print("   • Summary memories capture conversation summaries")
        print("   • Memory extraction happens in the background (~1 minute)")
        print("")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

# Get actor_id from environment
actor_id = "$ACTOR_ID"
view_memories(actor_id)
PYTHON_SCRIPT
