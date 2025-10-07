# Live Demo Script: Context Management in Action

**Duration:** 5 minutes (10 minutes with Q&A)
**Objective:** Show how memory + context management enable infinite-length agentic conversations at controlled cost

---

## 🎯 Demo At-A-Glance

```
0:00 - 0:30   Intro: 3-user workflow with shared memory
0:30 - 1:20   Chat 1 (Alice): Provides requirements → Claude stores in memory
1:20 - 2:10   Chat 2 (John): Requests solution → Claude reads memory, designs solution
              ↓ (Clearing may trigger here - if so, skip to 3:00)
2:10 - 3:00   Chat 3 (Sam): Requests proposal → Claude reads memory, writes proposal ✂️ (Clearing triggers!)
3:00 - 4:20   Show: Statistics (savings) + Memory Files (all preserved)
4:20 - 4:50   Close: Multi-user coordination solved
4:50 - 10:00  Q&A (if time allows)
```

**Multi-User Flow Visualization:**
```
Chat 1: Alice               Chat 2: John               Chat 3: Sam
     ↓                           ↓                          ↓
[Provides info]            [Requests solution]        [Requests proposal]
     ↓                           ↓                          ↓
Claude stores              Claude reads memory        Claude reads memory
     ↓                           ↓                          ↓
memory_alice.md      →     [Adds to memory]     →     [Uses all memory]
                                                             ↓
                                              ✂️ Context clearing triggers
                                              Old tools removed, memory safe
```

**Key Moments to Nail:**
1. 0:30 - "Three team members sharing knowledge with Claude"
2. 1:20 - "John reads what Alice stored"
3. 2:10-3:00 - The reveal: "✂️ Pipeline cleanup!" ← THE MAGIC MOMENT
4. 4:20 - "This is production-ready multi-user architecture"

**Flexibility Note:** Clearing typically triggers on Chat 2 or 3. Either way, the story is strong:
- **Chat 2 (John):** "Two users coordinated, cleanup already happening"
- **Chat 3 (Sam):** "Full 3-user workflow, automatic optimization at the end"

**Presenter Confidence Tip:** The multi-user workflow narrative makes 3 messages feel natural and intentional!

---

## ⚡ 5-Minute Speed Run Script

**Use this streamlined version when time is tight:**

### 1. Introduction (20s)
> **"Claude Sonnet 4.5: memory tool stores persistent knowledge, context management clears old tool results. Result: infinite conversations at controlled cost. Watch a 3-user sales workflow."**

### 2. Alice (Chat 1) - Provides Requirements (50s)
**Type:** `I'm Alice from TechCorp. We need help with a cloud migration project.`

> "Alice providing requirements, Claude storing in memory for other team members..."

### 3. John (Chat 2) - Requests Solution Design (50s)
**Type:** `Based on the customer in memory, design a cloud migration architecture.`

> "John asking Claude to design solution using Alice's info from memory..."

**IF CLEARING HAPPENS:** ✂️
> "There! Alice's old tools cleared, memory preserved. John still accessed everything. Move to step 5."

**IF NO CLEARING:**
> "Building context - let's get the proposal..."

### 4. Sam (Chat 3) - IF NEEDED (50s)
**Type:** `Create a proposal based on the customer requirements and solution in memory.`

> "Sam asking Claude for proposal using all stored info... and there! ✂️ Clearing triggered across the workflow."

### 5. Show Results (1.5m)
**[Scroll to Statistics]**
> "60%+ reduction. Multi-user workflow at controlled cost. Production: $200K+ savings."

**[Show Memory Files]**
> "All memory files intact. Three users coordinated through persistent storage."

### 6. Close (20s)
> **"Three team members shared knowledge with Claude through memory. Old tool overhead cleared automatically. This is how you build scalable agentic systems."**

**Total: 4:40-5:30** ⏱️ (depending on when clearing triggers)

---

## 🧠 How It Works: The Technical Foundation

### The Memory Tool
Claude Sonnet 4.5 has a built-in `memory` tool that operates like a file system:
- **Commands:** `view`, `create`, `str_replace`, `delete`
- **Storage:** Files persist in a dedicated `/memories` directory
- **Scope:** Shared across all conversations (not ephemeral like context)
- **When it's used:** Automatically when Claude needs to remember something long-term

**When Memories Are Stored:**
1. **User introduces themselves** → Claude creates `memory_{username}.md`
2. **Important information emerges** → Claude updates existing memory files
3. **Multi-turn context builds** → Claude consolidates learnings into memory
4. **Cross-user coordination** → Alice stores info, John reads it later

**Example Flow:**
```
User: "I'm Alice from TechCorp..."
Claude: [Internally] "This is important, I should remember this"
       → Calls memory tool: create /memories/memory_alice.md
       → Stores structured customer information
       → Returns to conversation
```

---

### Context Management (Context Editing)
A separate feature that manages the conversation history:
- **Monitors:** Total input tokens in conversation
- **Triggers:** When tokens exceed configured threshold (e.g., 2,000)
- **Clears:** Old tool use/result pairs that are no longer needed
- **Preserves:** Recent tools, semantic flow, and ALL memory files

**When Context Clearing Happens:**
1. **Before each API request** - System checks token count
2. **If over threshold** - Identifies clearable tool calls
3. **Applies edits** - Replaces old tool results with placeholders
4. **Sends reduced context** - API receives cleaned conversation
5. **Reports back** - Returns statistics on what was cleared

**Example Timeline:**
```
Message 1: Create Alice memory     → Input: 2,948 tokens (over threshold)
           ↓ Context check: "Not yet, this is the first message"

Message 2: Create Bob memory       → Input would be ~5,500 tokens
           ↓ Context check: "We're over 2,000! Time to clear."
           ↓ Action: Clear 2 old tool calls from Message 1
           ↓ Result: Input reduced to 2,118 tokens
           ↓ Savings: 1,009 tokens cleared ✂️
```

---

### Why This Combination is Powerful

**Problem Without These Features:**
```
Agent workflow: Discovery → Analysis → Proposal → Negotiation → Close
Tool calls:     ~20        ~30        ~25          ~15           ~10  = 100 total

Token usage per tool call: ~400 tokens (input + output)
Total tokens: 100 × 400 = 40,000 tokens in context
Risk: Hit context limit, lose conversation coherence, high costs
```

**Solution With Memory + Context Management:**
```
Agent workflow: Discovery → Analysis → Proposal → Negotiation → Close
Tool calls:     ~20        ~30        ~25          ~15           ~10  = 100 total

Memory files created: 3-5 (customer, requirements, solution)
Memory tokens: ~2,000 (only the essential knowledge)

Context clearing: Removes ~60-70 old tool results
Context retained: Last 10-15 tool calls + all memory files
Active tokens: ~6,000 (vs 40,000 without clearing)

Result: 85% token reduction, infinite conversation length, costs under control
```

**The Magic:**
- **Separation of Concerns:** Ephemeral (tool results) vs. Persistent (memory files)
- **Intelligent Retention:** Claude knows what to keep and what to drop
- **Automatic Scaling:** System manages complexity as conversations grow
- **Cost Efficiency:** Pay only for what you need in active context

---

## ✅ Pre-Demo Checklist (3 minutes before)

**Do these steps before presenting:**

- [ ] Open http://localhost:8501 and verify app loads
- [ ] Expand "⚙️ Context Management Settings"
  - [ ] Set Trigger Threshold: **2,000 tokens**
  - [ ] Keep Last N Tool Uses: **0**
  - [ ] Clear At Least: **1,000 tokens**
  - [ ] Verify "Enable Context Management" is **CHECKED**
- [ ] Expand "📁 Memory Files" → Click "Clear All" (start fresh)
- [ ] Click "➕ Add New Chat" **twice** (3 total chats)
- [ ] **Configure System Prompts** for each chat:
  - [ ] **Chat 1:** Discovery Agent prompt (see below)
  - [ ] **Chat 2:** Solution Architect prompt (see below)
  - [ ] **Chat 3:** Proposal Writer prompt (see below)
- [ ] Expand "📊 Context Management Statistics" (leave open)
- [ ] Have customer messages ready to copy-paste (see Quick Reference below)
- [ ] Take a deep breath - you've got this! 🎤

---

## 🎤 Demo Script

### Introduction (30 seconds)

**[Show the Streamlit interface with 3 chats]**

> **"Claude Sonnet 4.5 introduces two features that work together: a memory tool that stores knowledge in persistent files, and context management that automatically clears old tool results. The result: AI agents with infinite-length conversations while controlling costs."**

**[Point to each chat window]**

> **"Today we're running a 3-user sales workflow: Alice gathers requirements, John architects a solution, Sam writes the proposal. All three use the same Claude assistant, sharing knowledge through memory files. Watch what happens."**

---

### Act 1: Alice Provides Requirements (1 minute)

**[Point to Chat 1]**
> "Alice provides customer requirements that Claude will store in memory."

**Type into Chat Context 1:**
```
I'm Alice from TechCorp. We need help with a cloud migration project.
```

**[Hit Enter, point as response streams]**

> "Claude asking questions... gathering details... now storing Alice's requirements in a memory file."

**💡 BENEFIT: Persistent Knowledge**
> "This memory file lives OUTSIDE any single conversation. John will ask Claude to design using this info. Sam will ask Claude for a proposal using all stored knowledge. That's true collaboration - each user focuses on their task, shares through memory."

**[Point to token counter]**

> "Tokens accumulating with each tool call... let's bring in the architect."

---

### Act 2: John Requests Solution Design (1.5 minutes)

**[Point to Chat 2]**

> "John is our Solution Architect - he asks Claude to design solutions using customer requirements from memory. Watch Claude access Alice's information."

**Type into Chat Context 2:**
```
Based on the customer in memory, design a cloud migration architecture.
```

**[Hit Enter, watch the token counter at bottom of Chat 2]**

> "See - Claude is reading Alice's memory file first, then designing a solution tailored to her needs. This is true multi-user coordination."

---

**⚠️ WATCH FOR THE CLEARING TRIGGER:**

**SCENARIO A - Clearing happens on John's request (Chat 2):**

**[Point to: ✂️ Cleared X tool(s), saved X tokens]**

> "**There it is!** Context management activated. Alice's old tool results? Cleared. Alice's memory file? Safe. Claude still accessed all her requirements for John."

**💡 BENEFIT: Multi-User Efficiency**
> "This is the power: Alice stored the knowledge, John accessed it through Claude, but the intermediate JSON scaffolding is gone. Memory persists, overhead cleared."

**→ Skip to Act 3**

---

**SCENARIO B - No clearing yet:**

> "Tokens building across the workflow - let's bring in the Proposal Writer..."

**[Point to Chat 3]**

> "Sam writes proposals based on customer details AND solution architecture from memory."

**Type into Chat Context 3:**
```
Create a proposal based on the customer requirements and solution in memory.
```

**[Hit Enter, watch Chat 3's token counter]**

> "Sam asking Claude for proposal using memories from Alice and John... and..."

**[Point to: ✂️ Cleared X tool(s), saved X tokens]**

> "**There!** Context management activated across a 3-user workflow."

**💡 BENEFIT: Workflow Scalability**
> "Three team members, each sharing knowledge with Claude through memory. Old tool results cleared automatically. This is how you build production multi-user systems that don't collapse under token weight."

**→ Continue to Act 3**

---

### Act 3: The Proof - Show the Results (1.5 minutes)

**[Scroll to Statistics panel]**

> "Let's see what just happened..."

**[Point to metrics]**

> "Times cleared, tokens saved, timestamp. This is real, measurable optimization."

**💡 BENEFIT: Measurable Savings**
> "60-80% reduction in multi-user workflows. Scale this: 10,000 daily conversations = $200K+ annual savings."

---

**[Expand Memory Files]**

> "Now the critical verification - checking memory files..."

**[Point to each file]**

> "Every memory file intact. Alice's requirements, John's solution architecture, [Sam's proposal if used]. The entire knowledge graph is preserved."

**💡 BENEFIT: Multi-User Knowledge Sharing**
> "This is the architecture: multiple users, shared memory, automatic cleanup. Alice's old JSON? Cleared. Alice's requirements? Safe in memory. Sam can still read everything he needs."

**[Click eye icon on Alice's file]**

> "Full customer profile, accessible to any team member, anytime. The workflow scales indefinitely."

---

### Closing (20 seconds)

> **"What you just saw: A 3-user workflow - Discovery, Architecture, Proposal - coordinating through shared memory while automatically managing token overhead."**
>
> **"Three takeaways: First, each user shares knowledge with Claude through memory files. Second, old tool results clear automatically - 60-80% token savings. Third, the workflow scales infinitely because context stays manageable."**
>
> **"This is how you build production multi-user systems that actually work."**

---

## 🔄 The Complete Workflow Explained

**Let me walk through exactly what happened in this demo from a technical perspective:**

### Timeline Breakdown:

**Message 1 (Chat 1 - Alice):**
```
User Input: "I'm Alice from TechCorp..." (50 tokens)
↓
Claude's Internal Process:
  1. Reads system prompt + user message
  2. Calls memory tool: view /memories (check existing)
  3. Calls memory tool: create memory_alice.md (store new info)
  4. Generates proposal response
↓
Result:
  - Memory file created ✓
  - 2 tool calls in conversation history
  - Input tokens: 2,948 (includes tool results)
  - Context management check: PASSED (first message exempt)
```

**Message 2 (Chat 2 - Bob):**
```
User Input: "I'm Bob from Finance Inc..." (40 tokens)
↓
Claude's Internal Process:
  0. CONTEXT CHECK FIRST ← This is when clearing happens!
     - Current input tokens: Would be ~5,500
     - Threshold: 2,000
     - Decision: Clear old tools from Message 1
     - Action: Remove 2 tool calls, save 1,009 tokens
     - New input tokens: 2,118

  1. Reads reduced context + user message
  2. Calls memory tool: view /memories (sees Alice + Bob files)
  3. Calls memory tool: create memory_bob.md
  4. Generates analytics response
↓
Result:
  - Memory file created ✓
  - Old tool calls cleared ✓
  - Statistics updated ✓
  - Total tokens: 2,118 (vs 5,500 without clearing)
  - Savings: 1,009 tokens
```

---

### What Gets Cleared vs. What Persists

**Cleared (Temporary Scaffolding):**
```json
// Tool use that got cleared:
{
  "type": "tool_use",
  "name": "memory",
  "input": {"command": "view", "path": "/memories"}
}

// Tool result that got cleared:
{
  "type": "tool_result",
  "content": "{\"memories\": [{...692 chars of JSON...}]}"
}
```
↓ Replaced with:
```
"[This tool call was removed to manage context size]"
```

**Preserved (Permanent Knowledge):**
```markdown
# File: /memories/memory_alice_techcorp.md
# Alice - TechCorp Cloud Migration Project
## Client Information
- Contact Name: Alice
- Company: TechCorp
...
```
↓ Stays forever, can be read anytime

---

### Why This Architecture is Beneficial

**🎯 Benefit 1: Unbounded Conversations**
- Traditional: Hit 200K token limit → conversation fails
- With CM: Clear old tools → conversation continues indefinitely
- **Use case:** Long customer service interactions, complex debugging sessions

**💰 Benefit 2: Cost Optimization**
- Traditional: Pay for every tool result in every subsequent message
- With CM: Pay only for recent tools + memory files
- **Use case:** High-volume agentic applications, chatbots with many users

**🔄 Benefit 3: Multi-Agent Coordination**
- Traditional: User A's context not accessible to User B
- With CM: Shared memory files + independent context clearing
- **Use case:** Sales pipeline (discovery → solution → proposal → close)

**🧠 Benefit 4: Semantic Coherence**
- Traditional: Must choose between "keep everything" or "lose context"
- With CM: Keep semantic knowledge, drop implementation details
- **Use case:** Research agents, data analysis workflows

**⚡ Benefit 5: Performance**
- Traditional: Larger context → slower inference → higher latency
- With CM: Smaller active context → faster responses
- **Use case:** Real-time applications, interactive experiences

---

### When to Use This Pattern

**Perfect For:**
- ✅ Multi-agent systems with handoffs
- ✅ Long-running customer service conversations
- ✅ Research/analysis workflows with many tool calls
- ✅ Applications with recurring users (memory persists)
- ✅ Cost-sensitive high-volume applications

**Not Needed For:**
- ❌ Short, single-turn interactions
- ❌ Stateless API calls
- ❌ Workflows with few (<10) tool calls
- ❌ Applications where full history is legally required

---

## 🎯 Key Points to Emphasize

### The Problem
Long conversations with many tool calls consume tokens rapidly. In multi-agent workflows, this means:
- 💸 Exponentially growing costs
- 🚫 Hitting context limits and conversation failures
- 🐌 Slower inference due to large context
- 🔄 Redundant information repeated in every request

### The Solution
**Memory Tool + Context Management** work together:
- 📝 Memory: Stores permanent knowledge in files
- ✂️ Context Management: Clears temporary tool results
- 🎯 Smart retention: Keeps what matters, drops scaffolding
- 🤖 Fully automatic: No manual context pruning needed

### The Benefits (Recap)
1. **Persistent Knowledge** - Information survives forever in memory files
2. **Automatic Token Management** - System handles it intelligently
3. **Measurable Cost Savings** - 50-80% reduction in token usage
4. **Smart Separation** - Semantic vs. scaffolding distinction
5. **Infinite Conversations** - No practical limit on workflow length

### The Trade-off
Some recent tool calls stay (configurable), older ones are cleared with placeholders. But since important information is in memory files, nothing critical is lost.

---

## 📊 Visual: What Happens Under the Hood

### Before Context Management (Traditional Approach)

```
Conversation Context Window (200K token limit):
┌─────────────────────────────────────────────────┐
│ System Prompt                        500 tokens │
│ Message 1: User                       50 tokens │
│ Message 1: Tool Call (view)         150 tokens │ ← Intermediate data
│ Message 1: Tool Result (JSON)       300 tokens │ ← Intermediate data
│ Message 1: Tool Call (create)       200 tokens │ ← Intermediate data
│ Message 1: Tool Result (JSON)       400 tokens │ ← Intermediate data
│ Message 1: Response                 800 tokens │
│ Message 2: User                       40 tokens │
│ Message 2: Tool Call (view)         150 tokens │ ← Intermediate data
│ Message 2: Tool Result (JSON)       500 tokens │ ← Intermediate data
│ Message 2: Tool Call (create)       200 tokens │ ← Intermediate data
│ Message 2: Tool Result (JSON)       450 tokens │ ← Intermediate data
│ Message 2: Response                 700 tokens │
│                                               │
│ TOTAL: ~4,440 tokens                          │
│ Problem: Keeps growing with each interaction! │
└─────────────────────────────────────────────────┘

After 50 messages: ~100K+ tokens (near limit!)
After 100 messages: Conversation FAILS (exceeded limit)
```

### After Context Management (Smart Approach)

```
Conversation Context Window (200K token limit):
┌─────────────────────────────────────────────────┐
│ System Prompt                        500 tokens │
│                                                 │
│ [CLEARED] Message 1 Tool Calls       0 tokens  │ ← Replaced with placeholder
│ [CLEARED] Message 1 Tool Results     0 tokens  │ ← Replaced with placeholder
│                                                 │
│ Message 1: Response                 800 tokens │ ← Kept (semantic content)
│ Message 2: User                      40 tokens │
│ Message 2: Tool Call (view)        150 tokens │ ← Recent, kept
│ Message 2: Tool Result (JSON)      500 tokens │ ← Recent, kept
│ Message 2: Tool Call (create)      200 tokens │ ← Recent, kept
│ Message 2: Tool Result (JSON)      450 tokens │ ← Recent, kept
│ Message 2: Response                700 tokens │
│                                                 │
│ TOTAL: ~3,340 tokens (saved 1,100!)            │
│ Benefit: Stays manageable indefinitely!        │
└─────────────────────────────────────────────────┘

Memory Files (Separate, Persistent Storage):
┌─────────────────────────────────────────────────┐
│ /memories/memory_alice_techcorp.md   712 bytes │ ← NEVER cleared
│ /memories/memory_bob_finance_inc.md 1104 bytes │ ← NEVER cleared
│                                                 │
│ These are read on-demand, not in every request │
└─────────────────────────────────────────────────┘

After 50 messages: ~15K tokens (cleared 35K!)
After 100 messages: ~30K tokens (cleared 70K!) → Still going strong!
```

---

### The Key Insight: Two-Tier Memory Architecture

**Tier 1: Active Context (Short-term, Fast Access)**
- Recent conversation turns
- Latest tool calls and results
- Immediate reasoning context
- **Cleared automatically** to manage size

**Tier 2: Memory Files (Long-term, Persistent Storage)**
- Customer profiles
- Project requirements
- Learned knowledge
- Historical facts
- **Never cleared**, read on-demand

This mirrors human memory: working memory (limited capacity) + long-term memory (vast storage)!

---

## 💡 Handling Q&A

### "What happens if Claude needs the old tool results?"

> "Great question! That's why memory files are the right pattern - the important information is stored in persistent files that never get cleared. The tool RESULTS - like JSON responses showing 'success: true' - are what get cleared because they're not needed for future reasoning."

### "Can you control which tools get cleared?"

> "Yes! In the API, you can configure which tools to exclude from clearing, how many recent tools to keep, and the minimum tokens to clear. For this demo, we're clearing everything old to show the maximum effect."

### "What does it look like in the conversation history?"

> "Cleared tool calls are replaced with placeholder text like '[This tool call was removed to manage context size]'. Claude can still see the conversation flow, just not the detailed results."

### "Why didn't it clear after the first message?"

> "Context management evaluates BEFORE sending each request. The first message built up tokens, the second message triggered the check, and that's when clearing happened. It's preventative - stops you from exceeding limits."

### "Does this work with the Anthropic API directly?"

> "Yes! This feature is available via the Anthropic API with the beta header 'context-management-2025-06-27'. We're running it through AWS Bedrock here, but it works the same way."

---

## 🚨 Troubleshooting During Demo

### If clearing doesn't happen after Bob:
✅ **This is normal!** Just continue to Carol (Message 3)
- Token accumulation varies slightly based on Claude's responses
- Carol message guarantees clearing will trigger
- **What to say:** "Not quite there yet - let's send one more message to push it over..."

### If clearing doesn't happen after Carol:
❌ **Check configuration:**
- "Enable Context Management" must be CHECKED
- Trigger must be 2,000 tokens (not 10,000)
- If needed, add message to Chat 1: "Show me all memories in the system"

### If statistics don't update:
✅ **This would mean the bug fix didn't apply**
- Refresh the browser page to reload the code
- Verify you're running the latest version

### If memory files don't appear:
- Expand "📁 Memory Files" section
- Claude might respond conversationally instead of using tools
- **Recovery:** Say "Please explicitly save this information to a memory file"

---

## 📋 Quick Reference: System Prompts + Messages

### System Prompts (Set Before Demo)

**All Chats - Shared System Prompt:**
```
IMPORTANT: ALWAYS VIEW YOUR MEMORY DIRECTORY BEFORE DOING ANYTHING ELSE.
MEMORY PROTOCOL:
1. Store all memories in .md format at /home/claude/memories/
2. Use the `view` command of your `memory` tool to check for earlier progress.
3. Use memory_{topic}.md format to store general memories based on their topic
4. As you make progress, record status / progress / thoughts in your memory.
ASSUME INTERRUPTION: Your context window might be reset at any moment,
so you risk losing any progress that is not recorded in your memory directory.
```

**Note**: All chats use the same system prompt. User role-playing (Alice, John, Sam) defines the workflow.

---

### User Messages (Send During Demo)

**Message 1 - Chat Context 1 (Alice provides requirements):**
```
I'm Alice from TechCorp. We need help with a cloud migration project.
```

**Message 2 - Chat Context 2 (John requests solution design):**
```
Hi, I'm John from TechCorp. Based on the customer in memory, design a cloud migration architecture.
```
**→ Check for ✂️ clearing. If it happened, STOP here and show results.**

**Message 3 - Chat Context 3 (Sam requests proposal) - USE IF NEEDED:**
```
Hi, I'm Sam from TechCorp. Create a proposal based on the customer requirements and solution in memory.
```
**→ Clearing will definitely trigger here. Show results.**

---

### Alternative: Direct Customer Input (More Context-Heavy)

**Message 1 - Chat 1 (Alice - detailed requirements):**
```
I'm Alice from TechCorp with $500K budget for cloud migration of 50 apps using Java and Python with PostgreSQL databases, need HIPAA and SOC2 compliance, 15 developers, prefer AWS, deadline Q2 2025.
```

**Message 2 - Chat 2 (John - solution request):**
```
Hi, I'm John from TechCorp. Design a solution for the customer in memory.
```

**Message 3 - Chat 3 (Sam - proposal request):**
```
Hi, I'm Sam from TechCorp. Write a proposal based on memory.
```

**Required Settings:**
- ✓ Enable Context Management: **CHECKED**
- Trigger: **2,000 tokens**
- Keep: **0 tools**
- Clear ≥: **1,000 tokens**

---

## 👀 Visual Cues: What to Watch For

**During each message, look at the BOTTOM of the chat window for this line:**

### Before Clearing:
```
📊 Input: 2,948 tokens | Output: 3,107 tokens | ⏳ No clearing yet
```
↑ This means tokens are accumulating but threshold not crossed yet

### When Clearing Triggers (THE MONEY SHOT):
```
📊 Input: 2,118 tokens | Output: 549 tokens | ✂️ Cleared 2 tool(s), saved 1,009 tokens
```
↑ **This is what you're waiting for!** Point it out immediately!

### Decision Tree:
```
Message 1 (Alice) → ⏳ No clearing yet → Continue
Message 2 (Bob)   → IF ✂️ appears → Skip to results
                  → IF ⏳ appears → Continue to Carol
Message 3 (Carol) → ✂️ WILL appear → Show results
```

**Pro Tip:** Keep your eye on the chat where you JUST sent a message. The token counter appears at the bottom of that chat's section.

---

## 🗣️ What to Say (Ultra-Condensed)

**Intro:**
"3-user workflow: Discovery → Architect → Proposal. Shared memory, automatic cleanup."

**Chat 1 - Alice (Discovery):**
"Alice providing requirements, Claude storing in memory for team..."

**Chat 2 - John (Architect):**
"John asking Claude to design using customer info from memory..."
- **IF ✂️ appears:** "There! Alice's tools cleared, memory preserved. Skip to results."
- **IF ⏳ appears:** "Workflow building - bringing in proposal writer..."

**Chat 3 - Sam (Proposal) - IF NEEDED:**
"Sam asking Claude for proposal using all stored info... ✂️ Workflow cleanup triggered!"

**At Statistics:**
"60-80% reduction. Multi-user coordination at controlled cost."

**At Memory Files:**
"All knowledge preserved in memory. Multi-user workflow, shared knowledge."

**Close:**
"Three users + shared memory + automatic cleanup = scalable multi-user systems."

---

## 🎓 Deeper Dive (If Time Allows)

### Show the Raw Context Management Data

**During Chat 2's response:**
> "Notice this expandable section: '🔍 CM Data' - let me show you what the API actually returned..."

**[Expand the CM Data section]**

> "Here's the actual response from Claude's API showing exactly what was cleared - you can see the edit type, number of tools cleared, and tokens saved."

### Demonstrate Persistence

**Type into Chat 1:**
```
What do you remember about Alice?
```

**[Wait for response]**

> "See - Claude reads the memory file and has all of Alice's information, even though we cleared those old tool results. The semantic knowledge persists."

---

## 🎴 Quick Reference Card (Keep This Visible)

**Print this or keep on second screen:**

| **Moment** | **Say This** | **Impact** |
|------------|-------------|------------|
| **Intro** | "3-user workflow: Discovery → Architect → Proposal. Shared memory, automatic cleanup." | Sets up multi-user demo |
| **Chat 1 (Alice)** | "Alice providing customer requirements, Claude storing for team" | Shows memory creation |
| **Chat 2 (John)** | "John asking Claude to design using memory" | Shows cross-user access |
| **✂️ Cleared!** | "Alice's tools cleared. Memory preserved. John still accessed everything." | THE KEY MOMENT |
| **Chat 3 (Sam)** | "Sam asking Claude for proposal using all stored info" | Shows workflow depth |
| **Statistics** | "60-80% reduction. Multi-user collaboration at controlled cost." | Quantifies value |
| **Memory files** | "All knowledge preserved. Workflow coordination through memory." | Shows architecture |
| **Close** | "Three users + shared memory = scalable systems" | Production readiness |

---

## 💬 Messaging Framework

**Choose your angle based on audience:**

### For Technical Leaders:
> "Enables production-ready multi-agent systems. Discovery → Architecture → Proposal pipeline with automatic token management. No manual orchestration needed."

### For Product Teams:
> "Build specialized agent workflows that were previously impossible: research pipelines, customer service handoffs, complex multi-step automation. Each agent focuses on its expertise, shares through memory."

### For Finance/Executives:
> "60-80% token cost reduction in multi-agent systems. $200K+ annual savings for high-volume applications. Enables complex workflows without proportional cost increases."

### For Engineers:
> "Configure once, runs forever. Agents write to shared memory, context management cleans up automatically. Drop-in beta feature, works with existing tool patterns."

### For Architects:
> "Agent specialization through system prompts, coordination through persistent memory, overhead management through automatic context clearing. Scales horizontally - add agents without multiplying token costs."

---

**End of Demo Script** 🎬

**Total Time:** 5-7 minutes with natural pacing
**Audience:** Technical stakeholders, product teams, engineers
**Follow-up:** Share the `trigger-context-clearing-guide.md` for hands-on exploration

**Pro Tip:** Practice the "5 Key Benefits" section - it's your closing argument and should be delivered confidently with clear examples!
