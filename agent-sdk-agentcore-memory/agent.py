"""
AgentCore Memory + Claude Agent SDK Experiment

Demonstrates how to integrate Amazon Bedrock AgentCore Memory (STM + LTM)
with the Claude Agent SDK for persistent, memory-aware conversations.

Memory integration approach:
  - STM and LTM context is fetched via a UserPromptSubmit hook and injected
    as additionalContext before each model call.

Run:
    export AGENTCORE_MEMORY_ID=<id>   # from setup_memory.py
    python agent.py
"""

import asyncio
import os
import uuid

from bedrock_agentcore.memory.constants import ConversationalMessage, MessageRole
from bedrock_agentcore.memory.session import MemorySessionManager
from claude_agent_sdk import (
    AssistantMessage,
    ClaudeAgentOptions,
    ProcessError,
    TextBlock,
    query,
)
from claude_agent_sdk.types import HookMatcher

# Use Amazon Bedrock for model inference (no Anthropic API key needed)
os.environ.setdefault("CLAUDE_CODE_USE_BEDROCK", "1")

REGION = os.environ.get("AWS_REGION", "us-east-1")
ACTOR_ID = "demo-user"
MODEL = "global.anthropic.claude-sonnet-4-5-20250929-v1:0"

# Search prefix is actor-scoped (/summaries/{actorId}/) — intentionally broader than
# the strategy namespace (/summaries/{actorId}/{sessionId}/). Using a prefix search
# returns summaries from all past sessions for this actor, not just the current one.
LTM_NAMESPACE_PREFIX = "/summaries/{actorId}/"


class MemoryAwareAgent:
    """
    Wraps Claude Agent SDK with AgentCore Memory for persistent conversations.

    A UserPromptSubmit hook fetches STM + LTM before each call and injects
    them as additionalContext so the model can use prior conversation history.
    """

    def __init__(self, memory_id: str, actor_id: str = ACTOR_ID):
        self.memory_id = memory_id
        self.actor_id = actor_id
        self.session = None
        self.session_id: str | None = None
        self._session_manager = MemorySessionManager(memory_id=memory_id, region_name=REGION)
        self._options = ClaudeAgentOptions(
            model=MODEL,
            allowed_tools=[],
            hooks={"UserPromptSubmit": [HookMatcher(hooks=[self._memory_hook])]},
        )

    # ── Session management ─────────────────────────────────────────────────────

    def start_session(self, session_id: str | None = None) -> str:
        """Begin a new conversation session. STM resets; LTM persists."""
        self.session_id = session_id or f"session-{uuid.uuid4().hex[:8]}"
        self.session = self._session_manager.create_memory_session(
            actor_id=self.actor_id,
            session_id=self.session_id,
        )
        print(f"\n[Memory] New session: {self.session_id}")
        return self.session_id

    # ── STM ────────────────────────────────────────────────────────────────────

    def _fetch_stm(self) -> str:
        if not self.session:
            return ""
        turns = self.session.get_last_k_turns(k=5)
        if not turns:
            return ""
        lines = []
        for turn in turns:
            for msg in turn:
                role = msg.get("role", "UNKNOWN")
                content = msg.get("content", {})
                text = content.get("text", "") if isinstance(content, dict) else str(content)
                lines.append(f"{role}: {text}")
        return "Recent conversation:\n" + "\n".join(lines)

    def _save_to_stm(self, user_msg: str, agent_reply: str) -> None:
        if not self.session:
            return
        self.session.add_turns(
            messages=[
                ConversationalMessage(user_msg, MessageRole.USER),
                ConversationalMessage(agent_reply, MessageRole.ASSISTANT),
            ]
        )

    # ── LTM ────────────────────────────────────────────────────────────────────

    def _fetch_ltm(self, query_text: str) -> str:
        namespace = LTM_NAMESPACE_PREFIX.format(actorId=self.actor_id)
        records = self._session_manager.search_long_term_memories(
            query=query_text,
            namespace_prefix=namespace,
            top_k=3,
        )
        snippets = [
            r.get("content", {}).get("text", "") or str(r.get("content", ""))
            for r in records
            if r.get("content")
        ]
        if not snippets:
            return ""
        return "Long-term memory (past sessions):\n" + "\n---\n".join(snippets)

    # ── Hook ───────────────────────────────────────────────────────────────────

    async def _memory_hook(self, input_data, tool_use_id, context) -> dict:
        """UserPromptSubmit hook: fetch STM + LTM and inject as additionalContext."""
        try:
            stm, ltm = await asyncio.gather(
                asyncio.to_thread(self._fetch_stm),
                asyncio.to_thread(self._fetch_ltm, input_data["prompt"]),
            )
        except Exception as e:
            print(f"  [Memory] Warning: could not fetch memory ({e})")
            return {}
        parts = [p for p in [stm, ltm] if p]
        if stm:
            print(f"  [STM] {stm[:120].replace(chr(10), ' | ')}...")
        if ltm:
            print(f"  [LTM] {ltm[:120].replace(chr(10), ' | ')}...")
        if not parts:
            return {}
        return {
            "hookSpecificOutput": {
                "hookEventName": "UserPromptSubmit",
                "additionalContext": "\n\n".join(parts),
            }
        }

    # ── Chat ───────────────────────────────────────────────────────────────────

    async def chat(self, user_msg: str) -> str:
        """Send a memory-aware message and return the response."""
        if not self.session:
            self.start_session()

        response_parts: list[str] = []
        try:
            async for message in query(prompt=user_msg, options=self._options):
                if isinstance(message, AssistantMessage):
                    for block in message.content:
                        if isinstance(block, TextBlock):
                            response_parts.append(block.text)
        except ProcessError as e:
            return f"[Error] Agent SDK process failed: {e.stderr or str(e)}"

        reply = "".join(response_parts)
        if reply:
            self._save_to_stm(user_msg, reply)
        return reply


# ── Demo ──────────────────────────────────────────────────────────────────────

async def main():
    memory_id = os.environ.get("AGENTCORE_MEMORY_ID")
    if not memory_id:
        print("Error: AGENTCORE_MEMORY_ID is not set.")
        print("  python setup_memory.py")
        print("  export AGENTCORE_MEMORY_ID=<id>")
        return

    agent = MemoryAwareAgent(memory_id=memory_id)

    # ── Session 1: establish facts ─────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("SESSION 1 — Establishing user preferences")
    print("=" * 60)
    agent.start_session()

    for msg in [
        "Hi! My name is Alex and I work as a software engineer.",
        "I mainly use Python and AWS. My go-to web framework is FastAPI.",
        "What do you know about me so far?",
    ]:
        print(f"\nUser: {msg}")
        reply = await agent.chat(msg)
        print(f"Agent: {reply}")

    # ── STM check: within the same session ────────────────────────────────────
    print("\n" + "─" * 60)
    print("STM CHECK — recall within session (should pass immediately)")
    print("─" * 60)
    stm_questions = {
        "What's my name?": ["alex"],
        "What cloud platform do I use?": ["aws"],
    }
    for question, expected_keywords in stm_questions.items():
        print(f"\nUser: {question}")
        reply = await agent.chat(question)
        print(f"Agent: {reply}")
        passed = all(kw in reply.lower() for kw in expected_keywords)
        print(f"  {'✅ PASS' if passed else '❌ FAIL'} (expected: {expected_keywords})")

    # ── Wait for LTM extraction ────────────────────────────────────────────────
    wait_seconds = 90
    print(f"\n{'=' * 60}")
    print("SESSION 2 — Cross-session recall via LTM")
    print(f"Waiting {wait_seconds}s for AgentCore to extract session summaries...")
    print("=" * 60)
    print(f"  Waiting {wait_seconds}s...", flush=True)
    await asyncio.sleep(wait_seconds)
    print("  Done. Starting Session 2.\n")

    agent.start_session()  # new session_id — STM resets, LTM persists

    # ── LTM check: across sessions ─────────────────────────────────────────────
    ltm_questions = {
        "What's my name?": ["alex"],
        "What's my job?": ["engineer"],
        "What web framework do I use?": ["fastapi"],
    }
    for question, expected_keywords in ltm_questions.items():
        print(f"\nUser: {question}")
        reply = await agent.chat(question)
        print(f"Agent: {reply}")
        passed = all(kw in reply.lower() for kw in expected_keywords)
        print(f"  {'✅ PASS' if passed else '❌ FAIL'} (expected: {expected_keywords})")


if __name__ == "__main__":
    asyncio.run(main())
