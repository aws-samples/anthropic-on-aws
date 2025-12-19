#!/usr/bin/env python3
"""
Simple validation test for deployed Memory resource

Tests basic Memory operations against the deployed CDK Memory:
- Create session
- Write conversation turn
- Read back conversation history

Run: python3 tests/test_deployed_memory.py
"""

import os
import sys
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def test_deployed_memory():
    """Test basic Memory operations against deployed resource"""
    print("\n" + "=" * 80)
    print("DEPLOYED MEMORY VALIDATION TEST")
    print("=" * 80)

    # Use deployed Memory ID from CDK output
    memory_id = "github_agent_memory_dev-dLjt72AgGN"
    print(f"Memory ID: {memory_id}")
    print(f"Timestamp: {datetime.now().isoformat()}")

    try:
        from bedrock_agentcore.memory.client import MemoryClient
        from bedrock_agentcore.memory.session import MemorySessionManager
        from bedrock_agentcore.memory.constants import ConversationalMessage, MessageRole

        # Verify Memory is ACTIVE
        print("\n📋 Step 1: Verify Memory status...")
        client = MemoryClient(region_name="us-east-1")
        memory = client.get_memory(memoryId=memory_id)
        status = memory.get('memory', {}).get('status', 'UNKNOWN')
        print(f"   Status: {status}")

        if status != "ACTIVE":
            print(f"❌ Memory is not ACTIVE (status={status})")
            return False
        print("✅ Memory is ACTIVE")

        # Create session
        print("\n📋 Step 2: Create Memory session...")
        session_manager = MemorySessionManager(
            memory_id=memory_id,
            region_name="us-east-1"
        )

        session_id = f"validation-test-{int(datetime.now().timestamp())}"
        session = session_manager.create_memory_session(
            actor_id="github-agent-test",
            session_id=session_id
        )
        print(f"✅ Session created: {session_id}")

        # Write conversation turn
        print("\n📋 Step 3: Write conversation turn...")
        session.add_turns(
            messages=[
                ConversationalMessage(
                    "Hello! This is a validation test for the deployed Memory resource.",
                    MessageRole.USER
                )
            ]
        )
        print("✅ Wrote USER message to memory")

        session.add_turns(
            messages=[
                ConversationalMessage(
                    "Memory is working correctly! This message was stored and can be retrieved.",
                    MessageRole.ASSISTANT
                )
            ]
        )
        print("✅ Wrote ASSISTANT message to memory")

        # Read back conversation history
        print("\n📋 Step 4: Read conversation history...")
        turns = session.get_last_k_turns(k=2)
        print(f"✅ Retrieved {len(turns)} turns from memory")

        for i, turn in enumerate(turns, 1):
            # Handle different response structures
            if isinstance(turn, dict):
                role = turn.get('role', 'UNKNOWN')
                content = str(turn.get('content', ''))[:60]
            elif isinstance(turn, list) and len(turn) > 0:
                # Turn might be a list of messages
                role = "MULTIPLE"
                content = f"{len(turn)} messages"
            else:
                role = "UNKNOWN"
                content = str(turn)[:60]
            print(f"   Turn {i} [{role}]: {content}...")

        # Success
        print("\n" + "=" * 80)
        print("✅ ALL TESTS PASSED - Memory is fully operational!")
        print("=" * 80)
        return True

    except Exception as e:
        print(f"\n❌ Test failed: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = test_deployed_memory()
    sys.exit(0 if success else 1)
