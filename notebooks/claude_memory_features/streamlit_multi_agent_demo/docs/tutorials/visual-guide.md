# Visual Guide: How Memory and Context Management Work Together

A visual, step-by-step explanation of what happens during the multi-user workflow demo.

## The Big Picture

```
┌─────────────────────────────────────────────────────────────┐
│                    Multi-User Workflow                      │
│                                                             │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐        │
│  │  Alice   │      │  John    │      │   Sam    │        │
│  │Discovery │─────▶│Architect │─────▶│Proposal  │        │
│  └──────────┘      └──────────┘      └──────────┘        │
│       │                 │                  │               │
│       ▼                 ▼                  ▼               │
│  ┌─────────────────────────────────────────────┐          │
│  │         Shared Memory Files                 │          │
│  │  📄 memory_alice.md                         │          │
│  │  📄 memory_architecture.md                  │          │
│  │  📄 memory_proposal.md                      │          │
│  └─────────────────────────────────────────────┘          │
│                                                             │
│  ┌─────────────────────────────────────────────┐          │
│  │      Context Management Layer               │          │
│  │  ✂️ Automatically clears old tool results    │          │
│  │  💾 Preserves memory files                  │          │
│  │  📊 Tracks token savings                    │          │
│  └─────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

## Step-by-Step Flow

### Step 1: Alice Provides Requirements (Chat 1)

```
┌────────────────────────────────────────────────┐
│ Alice: "I'm Alice from TechCorp..."           │
└────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────────┐
│ Claude (Chat 1):                              │
│ 1. Receives message                           │
│ 2. Decides: "This is important!"              │
│ 3. Calls: memory tool → create                │
└────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────────┐
│ Memory System:                                 │
│ ✓ Creates memory_alice.md                     │
│ ✓ Stores structured information               │
│ ✓ Returns success response                    │
└────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────────┐
│ Conversation Context (2,948 tokens):          │
│ • System prompt                                │
│ • User message: "I'm Alice..."                │
│ • Tool use: create memory                     │
│ • Tool result: {"success": true, ...}         │
│ • Claude's response: "I've stored..."         │
└────────────────────────────────────────────────┘
```

**Key Point**: The memory file exists in `/memories/` directory, separate from the conversation context.

---

### Step 2: John Requests Solution Design (Chat 2)

```
┌────────────────────────────────────────────────┐
│ John: "Design a solution for the customer     │
│        in memory"                              │
└────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────────┐
│ Claude (Chat 2):                              │
│ 1. Receives message in different chat         │
│ 2. Decides: "I need customer info"            │
│ 3. Calls: memory tool → view /memories        │
└────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────────┐
│ Memory System:                                 │
│ ✓ Reads memory_alice.md                       │
│ ✓ Returns full file contents                  │
│ ✓ Claude now knows everything from Alice      │
└────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────────┐
│ Claude Designs Solution for John:             │
│ • References Alice's budget                    │
│ • Addresses her compliance needs               │
│ • Matches her timeline                         │
│ • Stores architecture in new memory file      │
└────────────────────────────────────────────────┘
```

**Key Point**: John (Chat 2) never saw Alice's conversation, but Claude has all the knowledge through memory files.

---

### Step 3: Context Grows

```
┌────────────────────────────────────────────────┐
│ Combined Context (now ~5,500 tokens):         │
│                                                │
│ Chat 1:                                        │
│ • User: "I'm Alice..."             (50 tok)   │
│ • Tool: create memory              (150 tok)  │
│ • Result: {...json...}             (300 tok)  │
│ • Response: "I've stored..."       (100 tok)  │
│                                                │
│ Chat 2:                                        │
│ • User: "Design solution..."       (40 tok)   │
│ • Tool: view memory                (150 tok)  │
│ • Result: {...full file...}        (500 tok)  │
│ • Tool: create architecture        (200 tok)  │
│ • Result: {...json...}             (450 tok)  │
│ • Response: "Here's design..."     (200 tok)  │
│                                                │
│ ⚠️ TRIGGER THRESHOLD: 2,000 tokens            │
│ ✂️ TIME TO CLEAR OLD TOOLS!                    │
└────────────────────────────────────────────────┘
```

**Key Point**: Without context management, this context would keep growing until it hits the 200K limit.

---

### Step 4: Context Management Triggers

```
┌────────────────────────────────────────────────┐
│ Before Next Request:                          │
│ 1. System checks: 5,500 tokens > 2,000       │
│ 2. Decision: "Need to clear!"                 │
│ 3. Identifies clearable tools:                │
│    • Chat 1's create memory (old)             │
│    • Chat 1's tool result (old)               │
│    • Chat 2's view memory (old)               │
│    • Chat 2's tool result (old)               │
└────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────────┐
│ Clearing Operation:                            │
│ ✂️ Removes 4 tool use/result pairs             │
│ ✂️ Replaces with placeholders                  │
│ 💾 Preserves all memory files                 │
│ 💾 Keeps semantic content                     │
│ 📊 Saves 2,300 tokens                         │
└────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────────┐
│ Reduced Context (now ~3,200 tokens):          │
│                                                │
│ Chat 1:                                        │
│ • User: "I'm Alice..."             (50 tok)   │
│ • [Cleared]                        (0 tok)    │
│ • Response: "I've stored..."       (100 tok)  │
│                                                │
│ Chat 2:                                        │
│ • User: "Design solution..."       (40 tok)   │
│ • [Cleared]                        (0 tok)    │
│ • Tool: create architecture        (200 tok)  │
│ • Result: {...json...}             (450 tok)  │
│ • Response: "Here's design..."     (200 tok)  │
│                                                │
│ ✅ Under threshold, conversation continues     │
└────────────────────────────────────────────────┘
```

**Key Point**: Old tool scaffolding removed, but conversation flow and meaning preserved.

---

### Step 5: Sam Still Has Everything (Chat 3)

```
┌────────────────────────────────────────────────┐
│ Sam in Chat 3: "Create proposal from memory"  │
└────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────────┐
│ Claude (Chat 3):                              │
│ 1. Calls: memory tool → view /memories        │
│ 2. Reads:                                      │
│    ✓ memory_alice.md (customer info)          │
│    ✓ memory_architecture.md (solution)        │
│ 3. Has complete picture despite clearing!     │
└────────────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────────────┐
│ Result: Perfect Proposal for Sam              │
│ • References Alice's specific needs            │
│ • Details the architectural solution           │
│ • Nothing was lost from context clearing       │
└────────────────────────────────────────────────┘
```

**Key Point**: Memory files are read on-demand and always contain the full information.

---

## The Two-Tier Memory System

```
┌─────────────────────────────────────────────────────────┐
│                      Your Computer                      │
│                                                         │
│  ┌────────────────────────────────────────────┐       │
│  │  TIER 1: Context (Working Memory)          │       │
│  │  • Limited capacity (~200K tokens)         │       │
│  │  • Fast access (in every request)          │       │
│  │  • Automatically managed                   │       │
│  │  • Clears old tool results                 │       │
│  │                                             │       │
│  │  Current: 3,200 tokens                     │       │
│  │  Limit: 200,000 tokens                     │       │
│  │  Status: ✅ Healthy                         │       │
│  └────────────────────────────────────────────┘       │
│                       ↕️                                 │
│                 Reads on demand                        │
│                       ↕️                                 │
│  ┌────────────────────────────────────────────┐       │
│  │  TIER 2: Memory Files (Long-term Storage)  │       │
│  │  • Unlimited capacity                      │       │
│  │  • Selective access (only when needed)     │       │
│  │  • Manually managed                        │       │
│  │  • Never automatically cleared             │       │
│  │                                             │       │
│  │  📄 memory_alice.md          (2.1 KB)      │       │
│  │  📄 memory_architecture.md   (3.8 KB)      │       │
│  │  📄 memory_proposal.md       (4.2 KB)      │       │
│  │                                             │       │
│  │  Total: 10.1 KB in 3 files                 │       │
│  │  Status: ✅ Persistent                      │       │
│  └────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

**The Analogy**:
- **Context** = Your RAM (fast, limited, volatile)
- **Memory Files** = Your hard drive (slower access, unlimited, persistent)

---

## Token Flow Comparison

### Without Context Management

```
Message 1:  System + M1 = 600 tokens
Message 2:  System + M1 + M2 = 1,200 tokens
Message 3:  System + M1 + M2 + M3 = 2,000 tokens
Message 4:  System + M1 + M2 + M3 + M4 = 3,000 tokens
Message 5:  System + M1 + M2 + M3 + M4 + M5 = 4,200 tokens
...
Message 50: System + M1...M50 = 50,000 tokens ❌ Expensive!
Message 100: System + M1...M100 = 120,000 tokens ❌ Near limit!
Message 200: System + M1...M200 = 💥 EXCEEDED LIMIT!

Total tokens consumed: ~5,000,000 tokens
Cost: ~$15.00 per conversation
Problem: Conversation fails after ~180 messages
```

### With Context Management

```
Message 1:  System + M1 = 600 tokens
Message 2:  System + M1 + M2 = 1,200 tokens
Message 3:  System + M1 + M2 + M3 = 2,000 tokens
Message 4:  System + [cleared] + M3 + M4 = 1,800 tokens ✂️
Message 5:  System + [cleared] + M4 + M5 = 1,900 tokens
...
Message 50: System + [cleared] + M49 + M50 = 2,100 tokens ✅
Message 100: System + [cleared] + M99 + M100 = 2,000 tokens ✅
Message 200: System + [cleared] + M199 + M200 = 2,100 tokens ✅

Total tokens consumed: ~400,000 tokens
Cost: ~$1.20 per conversation
Problem: None - scales indefinitely!

💰 Savings: $13.80 per conversation (92% reduction)
♾️ Scale: No practical limit on conversation length
```

---

## What Gets Cleared vs. Preserved

### Cleared (Temporary Scaffolding)

```json
// This gets replaced with a placeholder:
{
  "role": "assistant",
  "content": [
    {
      "type": "tool_use",
      "id": "tool_123",
      "name": "memory",
      "input": {
        "command": "create",
        "path": "/memories/memory_alice.md",
        "file_text": "# Alice\n## Company: TechCorp..."
      }
    }
  ]
},
{
  "role": "user",
  "content": [
    {
      "type": "tool_result",
      "tool_use_id": "tool_123",
      "content": "{\"success\": true, \"created\": \"memory_alice.md\", ...}"
    }
  ]
}

// Becomes:
"[This tool call was removed to manage context size]"
```

**Why clearable**: The important information is in the memory file, not in this JSON metadata.

### Preserved (Permanent Knowledge)

```markdown
# File: /memories/memory_alice.md

# Alice - TechCorp Customer Profile

## Contact Information
- Name: Alice
- Company: TechCorp
- Role: Technical Account Manager

## Project: ACME Corp Cloud Migration
- Budget: $500K
- Timeline: 9 months
- Applications to migrate: 50
- Compliance: SOC 2 required
- Challenge: Team has limited cloud expertise

## Requirements Priority
1. Cost optimization (30-40% reduction)
2. Scalability (3x peak capacity)
3. Business continuity (99.9% uptime)
4. Modernization
5. Security improvements
```

**Why preserved**: This is the actual knowledge that Claude needs. It's stored outside the context and read on-demand.

---

## Real-World Scaling

### Scenario: Enterprise Sales Pipeline (5 agents, 40 messages each)

```
┌──────────────────────────────────────────────────────────┐
│ Agent Pipeline (5 specialists × 40 messages = 200 total)│
│                                                          │
│ Lead Qualification → Discovery → Solution Design →      │
│ Proposal → Negotiation → Close                          │
│                                                          │
│ Each agent reads 5-10 memory files                      │
│ Each agent creates 2-3 memory files                     │
│ Total memory operations: ~300                           │
└──────────────────────────────────────────────────────────┘

WITHOUT CONTEXT MANAGEMENT:
• Context after 200 messages: ~150,000 tokens
• Each message pays for full context
• Total tokens: 200 × 150,000 = 30,000,000 tokens
• Cost per conversation: $90
• Limit: Will fail after ~250 messages
• Annual cost (10K conversations): $900,000

WITH CONTEXT MANAGEMENT:
• Context maintained at: ~5,000 tokens
• Old tools cleared continuously
• Total tokens: 200 × 5,000 = 1,000,000 tokens
• Cost per conversation: $3
• Limit: No practical limit
• Annual cost (10K conversations): $30,000

💰 SAVINGS: $870,000/year (97% reduction)
♾️ SCALE: Conversations can continue indefinitely
📊 QUALITY: Same outputs, same accuracy
```

---

## The Key Insight

```
┌─────────────────────────────────────────────┐
│          The Breakthrough                   │
│                                             │
│  Separate "how it was done" from           │
│  "what was accomplished"                    │
│                                             │
│  Clear the scaffolding (tool internals)    │
│  Preserve the knowledge (memory files)      │
│                                             │
│  Result: Infinite conversations with        │
│          finite costs                       │
└─────────────────────────────────────────────┘
```

This is how you build production multi-agent systems that actually scale.

---

## Visual Summary

```
┌──────────────────────────────────────────────────────────┐
│                  BEFORE: Traditional                     │
│                                                          │
│   Context grows →  Costs explode →  Hits limit          │
│        ↓               ↓                ↓                │
│   Unbounded      Unpredictable    Conversation          │
│   growth         scaling           fails                │
└──────────────────────────────────────────────────────────┘

                          ↓
                   Solution Applied
                          ↓

┌──────────────────────────────────────────────────────────┐
│           AFTER: Memory + Context Management            │
│                                                          │
│   Memory files  +  Automatic  →  Infinite               │
│   (persistent)     clearing      conversations          │
│        ↓               ↓              ↓                  │
│   Knowledge       Context         Controlled            │
│   preserved       bounded          costs                │
└──────────────────────────────────────────────────────────┘
```

---

**This visual guide complements the hands-on tutorial. For step-by-step instructions, see the [full tutorial](/docs/tutorials/memory-and-context-management.md).**
