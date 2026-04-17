"""
Setup script for AgentCore Memory resource.

Creates a memory store with:
  - STM: built-in via MemorySessionManager (no extra config needed)
  - LTM: summary extraction strategy that condenses sessions into queryable records

Run once, then export the memory ID:
    python setup_memory.py
    export AGENTCORE_MEMORY_ID=<id printed above>
    python agent.py

To delete the memory resource:
    python delete_memory.py
"""

import os

from bedrock_agentcore.memory.client import MemoryClient

REGION = os.environ.get("AWS_REGION", "us-east-1")
MEMORY_NAME = "ClaudeAgentSDKMemory"


def _find_existing(client: MemoryClient) -> dict | None:
    memories = client.list_memories()
    return next(
        (m for m in memories
         if (m.get("memoryId") or m.get("id", "")).startswith(MEMORY_NAME)
         and m.get("status") != "DELETING"),
        None,
    )


def main():
    client = MemoryClient(region_name=REGION)
    existing = _find_existing(client)
    if existing:
        memory_id = existing.get("memoryId") or existing.get("id")
        print(f"Memory '{MEMORY_NAME}' already exists: {memory_id}")
        print(f"  export AGENTCORE_MEMORY_ID={memory_id}")
        print("Run delete_memory.py first to create a new one.")
        return

    print(f"Creating AgentCore Memory in {REGION}...")
    try:
        memory = client.create_memory_and_wait(
            name=MEMORY_NAME,
            strategies=[],
            description="Memory store for Claude Agent SDK STM + LTM experiment",
        )
    except Exception as e:
        if "already exists" in str(e):
            print("Previous memory is still being deleted. Wait a moment and retry.")
            return
        raise

    memory_id = memory.get("memoryId") or memory.get("id")
    print(f"Memory created: {memory_id}")

    # Add a summary LTM strategy and wait for the memory to return to ACTIVE state.
    # AgentCore will use this strategy to automatically extract session summaries
    # into a queryable namespace after each session.
    print("Adding summary LTM strategy...")
    try:
        client.add_summary_strategy_and_wait(
            memory_id=memory_id,
            name="ConversationSummary",
            description="Summarizes conversation sessions for long-term recall",
            namespaces=["/summaries/{actorId}/{sessionId}/"],
        )
        print("Summary strategy added.")
    except Exception as e:
        print(f"Warning: could not add summary strategy ({e}). Memory will work as STM only.")

    print("\nNext steps:")
    print(f"  export AGENTCORE_MEMORY_ID={memory_id}")
    print("  python agent.py")


if __name__ == "__main__":
    main()
