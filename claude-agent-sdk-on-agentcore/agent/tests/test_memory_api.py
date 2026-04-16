#!/usr/bin/env python3
"""
Test script to validate AWS Bedrock AgentCore Memory API integration

This script tests:
1. Creating a Memory resource
2. Writing events (short-term memory)
3. Retrieving memory records
4. Strands Agent integration with Memory

Run: python3 tests/test_memory_api.py
"""

import os
import sys
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def test_memory_creation():
    """Test creating a Memory resource"""
    print("\n" + "=" * 80)
    print("TEST 1: Create Memory Resource")
    print("=" * 80)

    try:
        from bedrock_agentcore.memory.client import MemoryClient

        client = MemoryClient(region_name="us-east-1")

        # Create a basic memory for testing
        memory = client.create_memory(
            name=f"GitHubAgentTest_{int(datetime.now().timestamp())}",
            description="Test memory for GitHub agent workflow validation"
        )

        memory_id = memory.get("id")
        print(f"✅ Memory created successfully: {memory_id}")
        print(f"   Name: {memory.get('name')}")
        print(f"   Description: {memory.get('description')}")

        return memory_id

    except Exception as e:
        print(f"❌ Memory creation failed: {type(e).__name__}: {e}")
        return None


def test_memory_session(memory_id):
    """Test writing and reading from Memory session"""
    print("\n" + "=" * 80)
    print("TEST 2: Memory Session (Short-term Memory)")
    print("=" * 80)

    if not memory_id:
        print("⏭️  Skipping - no memory_id available")
        return False

    try:
        from bedrock_agentcore.memory.session import MemorySessionManager
        from bedrock_agentcore.memory.constants import ConversationalMessage, MessageRole

        # Create session manager
        session_manager = MemorySessionManager(
            memory_id=memory_id,
            region_name="us-east-1"
        )

        # Create a session
        session = session_manager.create_memory_session(
            actor_id="test-user-1",
            session_id=f"test-session-{int(datetime.now().timestamp())}"
        )

        print(f"✅ Session created")
        print(f"   Actor ID: test-user-1")
        print(f"   Session ID: {session.session_id}")

        # Write some conversation turns
        session.add_turns(
            messages=[
                ConversationalMessage(
                    "Hello! I'm testing the Memory API.",
                    MessageRole.USER
                )
            ]
        )
        print("✅ Wrote USER message to memory")

        session.add_turns(
            messages=[
                ConversationalMessage(
                    "Great! The Memory API is working correctly.",
                    MessageRole.ASSISTANT
                )
            ]
        )
        print("✅ Wrote ASSISTANT message to memory")

        # Retrieve recent turns
        turns = session.get_last_k_turns(k=2)
        print(f"✅ Retrieved {len(turns)} turns from memory")

        for i, turn in enumerate(turns, 1):
            role = turn.get('role', 'UNKNOWN')
            content = turn.get('content', '')[:50]
            print(f"   Turn {i} [{role}]: {content}...")

        return True

    except Exception as e:
        print(f"❌ Memory session test failed: {type(e).__name__}: {e}")
        return False


def test_strands_integration(memory_id):
    """Test Strands Agent integration with Memory"""
    print("\n" + "=" * 80)
    print("TEST 3: Strands Agent + Memory Integration")
    print("=" * 80)

    if not memory_id:
        print("⏭️  Skipping - no memory_id available")
        return False

    try:
        from strands import Agent
        from bedrock_agentcore.memory.integrations.strands.config import AgentCoreMemoryConfig
        from bedrock_agentcore.memory.integrations.strands.session_manager import AgentCoreMemorySessionManager

        # Configure memory for Strands
        config = AgentCoreMemoryConfig(
            memory_id=memory_id,
            session_id=f"strands-test-{int(datetime.now().timestamp())}",
            actor_id="test-user-2"
        )

        session_manager = AgentCoreMemorySessionManager(
            agentcore_memory_config=config,
            region_name="us-east-1"
        )

        # Create Strands agent with memory
        agent = Agent(
            system_prompt="You are a helpful assistant that remembers user preferences.",
            session_manager=session_manager
        )

        print("✅ Strands Agent created with Memory integration")
        print(f"   Memory ID: {memory_id}")
        print(f"   Session ID: {config.session_id}")
        print(f"   Actor ID: {config.actor_id}")

        # Test conversation with memory
        print("\n📝 Testing conversation with memory persistence...")
        response1 = agent("My favorite color is blue.")
        print(f"   User: My favorite color is blue.")
        print(f"   Agent: {str(response1)[:100]}...")

        response2 = agent("What's my favorite color?")
        print(f"   User: What's my favorite color?")
        print(f"   Agent: {str(response2)[:100]}...")

        # Check if agent remembered
        if "blue" in str(response2).lower():
            print("✅ Agent successfully remembered user preference!")
        else:
            print("⚠️  Agent may not have remembered preference (check response)")

        return True

    except Exception as e:
        print(f"❌ Strands integration test failed: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return False


def cleanup_test_memory(memory_id):
    """Clean up test memory resource"""
    print("\n" + "=" * 80)
    print("CLEANUP: Delete Test Memory")
    print("=" * 80)

    if not memory_id:
        print("⏭️  No memory to clean up")
        return

    try:
        from bedrock_agentcore.memory.client import MemoryClient

        client = MemoryClient(region_name="us-east-1")
        client.delete_memory(memory_id=memory_id)

        print(f"✅ Test memory deleted: {memory_id}")

    except Exception as e:
        print(f"⚠️  Cleanup warning: {type(e).__name__}: {e}")
        print(f"   You may need to manually delete memory: {memory_id}")


def main():
    """Run all Memory API tests"""
    print("\n" + "=" * 80)
    print("AWS BEDROCK AGENTCORE MEMORY API VALIDATION")
    print("=" * 80)
    print(f"Region: us-east-1")
    print(f"Timestamp: {datetime.now().isoformat()}")

    memory_id = None

    try:
        # Test 1: Create Memory
        memory_id = test_memory_creation()

        # Test 2: Memory Session
        test_memory_session(memory_id)

        # Test 3: Strands Integration
        test_strands_integration(memory_id)

    finally:
        # Always attempt cleanup
        if memory_id:
            cleanup_test_memory(memory_id)

    print("\n" + "=" * 80)
    print("TESTS COMPLETE")
    print("=" * 80)


if __name__ == "__main__":
    main()
