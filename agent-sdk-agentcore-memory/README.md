# AgentCore Memory + Claude Agent SDK

> Proof-of-concept demonstrating how to bridge Amazon Bedrock AgentCore Memory (STM + LTM) with the Claude Agent SDK for persistent, memory-aware conversations.

## The problem

**Claude Agent SDK** runs Claude as an autonomous agent — it handles the turn loop, tool execution, and streaming. But it is stateless: every call to `query()` starts with no memory of previous turns or sessions.

**Amazon Bedrock AgentCore Memory** is a managed memory service that stores conversation history (STM) and extracts long-term summaries across sessions (LTM). But it has no built-in integration with the Claude Agent SDK.

**There is no native bridge between them.** This module builds one manually by wrapping every `query()` call: fetch memory before, save memory after.

## Components

| Component | What it does | Why we need it |
|---|---|---|
| `claude_agent_sdk.query()` | Runs Claude on Amazon Bedrock, handles the agentic loop | The agent itself — processes prompts, uses tools, streams responses |
| `bedrock_agentcore` (AgentCore SDK) | Reads and writes memory in AWS | Provides STM (per-session turn history) and LTM (cross-session summaries) |
| `MemorySessionManager` | Data-plane interface for AgentCore Memory | Reads STM with `get_last_k_turns`, searches LTM with `search_long_term_memories`, saves turns with `add_turns` |
| `MemoryClient` | Control-plane interface for AgentCore Memory | Creates and configures memory resources — **setup only** |

## How the integration works

Because the Claude Agent SDK has no memory API, context must be injected as text. The `MemoryAwareAgent` wrapper does three things around every `query()` call:

```
User message
    │
    ▼
claude_agent_sdk.query(user_msg)
    │
    ├─► UserPromptSubmit hook fires
    │       ├─► STM: session.get_last_k_turns(k=5)          ← last 5 turns, current session only
    │       ├─► LTM: session_manager.search_long_term_memories(query, "/summaries/{actorId}/")
    │       │                                                 ← semantic search, all past sessions
    │       └─► returns additionalContext (STM + LTM text)   ← injected into model context
    │
    ▼
Response
    │
    └─► session.add_turns([user_msg, reply])         ← saved to STM immediately
        AgentCore extracts LTM summaries async (~90s)
```

## Prerequisites

- AWS account with the following IAM managed policies: `BedrockAgentCoreFullAccess`, `AmazonBedrockFullAccess`
- AWS CLI configured (`aws configure`)
- Python 3.11+
- Claude Sonnet available in your AWS region via Amazon Bedrock

## Setup

```bash
pip install -r requirements.txt
```

### 1. Create a memory resource (once)

```bash
python setup_memory.py
```

Creates an AgentCore Memory store with a summary LTM strategy using an actor-scoped namespace. Prints the memory ID when done.

```bash
export AGENTCORE_MEMORY_ID=<id printed above>
```

### 2. Run the demo

```bash
python agent.py
```

The demo runs two sessions:

- **Session 1** — establishes facts (name, tech stack). STM stores each turn in real time.
- **Session 2** — starts fresh (new session ID, STM resets). Queries LTM for summaries from Session 1.

> **Note:** AgentCore extracts LTM summaries ~90 seconds after session events are written. If Session 2 shows no LTM recall, wait a moment and re-run it with the same `AGENTCORE_MEMORY_ID`.

## Sample output

```
SESSION 1 — Establishing user preferences
[Memory] New session: session-a1b2c3d4

User: Hi! My name is Alex and I work as a software engineer.
Agent: Nice to meet you, Alex! ...

User: What do you know about me so far?
  [STM] Recent conversation: | USER: I mainly use Python and AWS... | ASSISTANT: Thanks for sharing...
Agent: You're Alex, a software engineer who works with Python and AWS ...

SESSION 2 — Cross-session recall via LTM
[Memory] New session: session-e5f6a7b8

User: What's my name?
  [LTM] Long-term memory (past sessions): | Alex introduced himself as a software engineer ...
Agent: Your name is Alex.
```

## Clean up

```bash
python delete_memory.py
```
