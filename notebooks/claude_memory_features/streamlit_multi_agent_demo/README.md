# Multi-User Memory Demo with Streamlit

A multi-chat Streamlit interface demonstrating Claude Sonnet 4.5's memory capabilities with real-time streaming and shared memory across multiple user contexts (simulating team collaboration).

## 📚 New! Comprehensive Tutorial Available

**Brand new beginner-friendly tutorial!** Learn Claude's Memory and Context Management features through hands-on practice:

- **[20-Minute Tutorial](./docs/tutorials/memory-and-context-management.md)** - Complete hands-on guide
- **[10-Minute Quick Start](./docs/tutorials/quick-start.md)** - Get running fast
- **[Visual Guide](./docs/tutorials/visual-guide.md)** - See the architecture
- **[Ready-to-Use Prompts](./prompts/)** - Organized prompt collection
- **[Documentation Index](./docs/README.md)** - Full documentation hub

**Perfect for**: Beginners, learners, presenters, and anyone new to Claude's memory features!

## Features

- 🧠 **Persistent Memory** - Claude autonomously stores and retrieves information across conversations
- 🔄 **Real-time Streaming** - Fine-grained tool streaming shows memory operations as they happen
- 👥 **Multi-User Workflow** - Simulate different users (Alice, John, Sam) sharing one memory store
- 📁 **File-based Storage** - Simple markdown files in `./memories/` directory
- ✏️ **Memory Management** - Built-in file browser to view, edit, and delete memories
- 🎨 **Anthropic Branding** - Clean UI with Anthropic color scheme

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Streamlit Interface                    │
├─────────────────────────────────────────────────────────┤
│  Chat 1        │  Chat 2        │  Chat 3               │
│  (Alice -      │  (John -       │  (Sam -               │
│   Discovery)   │   Architect)   │   Proposal)           │
│                │                │                       │
│  Each user context has independent conversation history │
│  but shares memory through file-based storage           │
└─────────────────────────────────────────────────────────┘
                         │
                         ↓
           ┌─────────────────────────────┐
           │   Memory Tool Handler       │
           │   (handle_memory_tool)      │
           ├─────────────────────────────┤
           │  - view: List/read memories │
           │  - create: Store new info   │
           │  - str_replace: Update      │
           │  - delete: Remove memories  │
           └─────────────────────────────┘
                         │
                         ↓
              ┌──────────────────┐
              │  ./memories/     │
              │  *.md files      │
              └──────────────────┘
```

## Prerequisites

- Python 3.8+
- AWS account with Bedrock access
- Claude Sonnet 4.5 model access (`global.anthropic.claude-sonnet-4-5-20250929-v1:0`)
- AWS credentials configured (`aws configure`)

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Ensure AWS credentials are configured:
```bash
aws configure
```

3. Verify Bedrock model access:
```bash
aws bedrock list-foundation-models --region us-east-1 | grep -i "claude-sonnet-4-5"
```

## Running the Demo

Start the Streamlit app:
```bash
streamlit run dual_chat_streamlit.py
```

The interface will open in your browser at `http://localhost:8501`

## Usage

### Basic Workflow

1. **Start a Conversation** - Type a message in any chat
2. **Watch Memory Operations** - Tool uses stream in real-time showing when Claude stores/retrieves information
3. **Switch Contexts** - Move to another chat and see how memory persists
4. **Manage Memory** - Scroll down to view, edit, or delete memory files

### Example Multi-User Workflow

This demo simulates different team members (users) working with Claude through shared memory.

**Chat 1 - Alice (Discovery Role):**
```
I'm Alice from TechCorp. We're working with ACME Corp on a cloud migration project.
Budget is $500K, timeline is 9 months, they need to migrate 50 applications...
```
→ Claude stores customer information in memory

**Chat 2 - John (Solution Architect Role):**
```
Hi, I'm John from TechCorp. Based on the customer information in memory about ACME Corp,
please design a cloud migration architecture.
```
→ Claude retrieves customer info from memory and designs architecture

**Chat 3 - Sam (Proposal Writer Role):**
```
Hi, I'm Sam from TechCorp. Create a proposal based on the customer requirements and
solution architecture you have in memory.
```
→ Claude accesses both customer context and solution design from memory

### System Prompt Configuration

All three chats use the **same shared system prompt** (this is the default in the app):

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

**How it works:**
- **Same Claude instance** helps all users (Alice, John, Sam)
- **User messages** define what role they're playing (discovery, architecture, proposal)
- **Shared memory** allows continuity across different users/contexts
- No need to configure different system prompts per chat

## Memory File Structure

Memory files are stored as markdown in `./memories/`:

```markdown
# Customer Profile: GlobalMart

## Company Details
- Industry: Retail
- Size: 2,000 stores across North America
- Team: 50 engineers

## Pain Points
- Inventory forecasting issues causing $50M/year waste
- Legacy on-premises systems

## Technical Environment
- Oracle databases
- Java backends
- Some Python
- Snowflake for analytics

## Project Requirements
- Timeline: Q4 2024
- Budget: $5M
- Need: Proof-of-concept for ML-based forecasting
```

## Key Concepts

### Memory vs. RAG

- **RAG** (Retrieval-Augmented Generation): Retrieving external knowledge (docs, databases)
- **Memory**: Maintaining conversation state and context
- They're complementary - use both for production systems

### Client-Side Memory

Claude doesn't directly access your file system. Instead:
1. Claude decides what to remember (the "brain")
2. Your code handles storage (the "hands")
3. This separation allows any storage backend (files, S3, DynamoDB, PostgreSQL, etc.)

### Tool Use Loop

```
User message → Claude processes → Tool request → Handler executes → Result back to Claude → Final response
```

The app automatically handles this loop, including multiple tool calls.

## Customization

### Change Storage Backend

Modify `handle_memory_tool()` to use:
- S3: `s3_client.put_object(...)`
- DynamoDB: `table.put_item(...)`
- PostgreSQL: `cursor.execute("INSERT INTO memories...")`

### Add More User Contexts

Click "➕ Add New Chat" to create additional user contexts (e.g., Carol - Risk Assessor, David - Cost Estimator) that share the same memory.

### Styling

Modify `ANTHROPIC_STYLE` in the code to customize colors and layout.

## Troubleshooting

**Memory not persisting:**
- Check that `./memories/` directory exists
- Verify file permissions
- Look for `handle_memory_tool()` errors in console

**AWS Bedrock errors:**
- Verify credentials: `aws sts get-caller-identity`
- Check model access in Bedrock console
- Ensure `us-east-1` region (or update `region_name` in code)

**Streaming not working:**
- Check beta flags are enabled: `context-management-2025-06-27`, `fine-grained-tool-streaming-2025-05-14`
- Verify model ID is correct

**UI issues:**
- Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)
- Clear Streamlit cache: `streamlit cache clear`
- Restart app

## Technical Details

- **Model**: Claude Sonnet 4.5 (`global.anthropic.claude-sonnet-4-5-20250929-v1:0`)
- **Beta Features**:
  - `context-management-2025-06-27` - Memory tool
  - `fine-grained-tool-streaming-2025-05-14` - Streaming tool inputs
- **Tool Type**: `memory_20250818`
- **Commands**: `view`, `create`, `str_replace`, `delete`

## Related Resources

### New Tutorials and Guides
- **[Complete Tutorial](./docs/tutorials/memory-and-context-management.md)** - 60-minute hands-on guide (START HERE!)
- **[Quick Start](./docs/tutorials/quick-start.md)** - 10-minute fast path
- **[Visual Guide](./docs/tutorials/visual-guide.md)** - Architecture diagrams and flow
- **[Live Demo Script](live-demo-script.md)** - 5-minute presentation guide
- **[Trigger Guide](trigger-context-clearing-guide.md)** - Context management strategies
- **[Prompts Collection](./prompts/)** - Ready-to-use prompts for all scenarios
- **[Documentation Hub](./docs/README.md)** - Central documentation index

### External Resources
- [Anthropic Memory and Context Editing Cookbook](https://github.com/anthropics/claude-cookbooks/blob/main/tool_use/memory_cookbook.ipynb) 
- **A Special thanks to [**Alex Notov**](https://github.com/zealoushacker) from **Anthropic** for contributing to this repo**
- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [Anthropic API Documentation](https://docs.anthropic.com/)
- [Memory Tool API](https://docs.anthropic.com/en/docs/build-with-claude/tool-use/memory-tool)
- [Context Management Guide](https://docs.anthropic.com/en/docs/build-with-claude/context-editing)

## License

MIT-0
