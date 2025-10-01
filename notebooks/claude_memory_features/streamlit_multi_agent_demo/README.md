# Multi-Agent Memory Demo with Streamlit

A multi-chat Streamlit interface demonstrating Claude Sonnet 4.5's memory capabilities with real-time streaming and shared memory across multiple AI agents.

## Features

- 🧠 **Persistent Memory** - Claude autonomously stores and retrieves information across conversations
- 🔄 **Real-time Streaming** - Fine-grained tool streaming shows memory operations as they happen
- 👥 **Multi-Agent Architecture** - Multiple specialized agents sharing one memory store
- 📁 **File-based Storage** - Simple markdown files in `./memories/` directory
- ✏️ **Memory Management** - Built-in file browser to view, edit, and delete memories
- 🎨 **Anthropic Branding** - Clean UI with Anthropic color scheme

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Streamlit Interface                    │
├─────────────────────────────────────────────────────────┤
│  Chat 1        │  Chat 2        │  Chat 3              │
│  (Discovery)   │  (Architect)   │  (Proposal Writer)   │
│                │                │                       │
│  Each has independent conversation history              │
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

### Example Multi-Agent Workflow

**Chat 1 (Discovery Agent):**
```
Tell me about a customer you're working with. I'll remember the details.
```
→ Claude stores customer information in memory

**Chat 2 (Solution Architect):**
```
What do you know about my customer? Design a solution for their needs.
```
→ Claude retrieves customer info and designs architecture

**Chat 3 (Proposal Writer):**
```
Draft a proposal based on the customer and solution.
```
→ Claude accesses both customer context and solution design from memory

### System Prompts for Multi-Agent Demo

Configure each chat with specialized prompts:

**Discovery Agent:**
```
You are helping an AWS seller understand their customer's needs. Ask clarifying questions and remember important details about the customer, including their company size, pain points, technical environment, budget, timeline, and key stakeholders. Store this information in your memory for other agents to use.
```

**Solution Architect:**
```
You are an AWS solutions architect. Design solutions based on customer requirements you retrieve from your memory. Reference specific customer details like pain points, technical stack, budget constraints, and timeline when architecting solutions. Always check your memory first before designing.
```

**Proposal Writer:**
```
You are helping draft customer proposals for AWS solutions. Reference customer details and solution architecture from your memory to create personalized, compelling proposals. Use specific details about the customer's situation, pain points, and the proposed solution to make the proposal relevant and targeted.
```

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

### Add More Agents

Click "➕ Add New Chat" to create additional specialized agents that share the same memory.

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

- [Claude Memory Tutorial](../claude_memory_tutorial.ipynb) - Jupyter notebook walkthrough
- [Claude Memory Demo](../claude_memory_demo.ipynb) - Interactive demo
- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [Anthropic API Documentation](https://docs.anthropic.com/)

## License

See the main repository LICENSE file.
