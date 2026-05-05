"""
Deletes the AgentCore Memory resource created by setup_memory.py.

    python delete_memory.py
"""

import os

from bedrock_agentcore.memory.client import MemoryClient

REGION = os.environ.get("AWS_REGION", "us-east-1")
MEMORY_NAME = "ClaudeAgentSDKMemory"


def main():
    client = MemoryClient(region_name=REGION)
    memories = client.list_memories()
    memory = next(
        (m for m in memories
         if (m.get("memoryId") or m.get("id", "")).startswith(MEMORY_NAME)
         and m.get("status") != "DELETING"),
        None,
    )
    if not memory:
        print(f"No memory named '{MEMORY_NAME}' found.")
        return
    memory_id = memory.get("memoryId") or memory.get("id")
    if memory.get("status") not in ("ACTIVE", "FAILED"):
        print(f"Memory is in '{memory.get('status')}' state. Wait for it to become ACTIVE and retry.")
        return
    print(f"Deleting memory {memory_id}...")
    client.delete_memory(memory_id)
    print("Deleted.")


if __name__ == "__main__":
    main()
