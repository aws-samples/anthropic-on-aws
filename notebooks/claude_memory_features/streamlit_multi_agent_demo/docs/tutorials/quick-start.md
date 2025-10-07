# Quick Start Guide: 10 Minutes to Multi-User Workflow with Shared Memory

Get up and running with Claude's Memory and Context Management features in just 10 minutes.

## Prerequisites

- Python 3.8+ installed
- AWS account with Bedrock access
- 10 minutes of your time

## 5-Step Setup

### Step 1: Install (2 minutes)

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install streamlit boto3
```

### Step 2: Configure AWS (2 minutes)

```bash
aws configure
# Enter your credentials when prompted
# Region: us-east-1
```

### Step 3: Launch App (1 minute)

```bash
streamlit run dual_chat_streamlit.py
# Opens automatically at http://localhost:8501
```

### Step 4: Configure for Quick Demo (2 minutes)

1. Expand "⚙️ Context Management Settings"
2. Set **Trigger Threshold** to **2,000 tokens**
3. Set **Keep Last N Tool Uses** to **0**
4. Expand "📁 Memory Files" and click "Clear All"
5. Click "➕ Add New Chat" twice (total 3 chats)

### Step 5: Run the Demo (3 minutes)

**Chat 1 - Alice (provides requirements):**
```
I'm Alice from TechCorp with a $500K budget for cloud migration of 50 applications.
```

**Chat 2 - John (requests solution):**
```
Hi, I'm John from TechCorp. Based on the customer in memory, design a cloud migration architecture.
```

**Chat 3 - Sam (requests proposal):**
```
Hi, I'm Sam from TechCorp. Create a proposal based on the customer requirements and solution in memory.
```

**Watch for**: 🎉 Context Management Active! Cleared X tool(s), saved X tokens.

## What Just Happened?

You simulated a 3-user workflow where:
- Alice (user 1) provided customer requirements that Claude stored in memory
- John (user 2) asked Claude to design a solution based on stored requirements
- Sam (user 3) asked Claude to create a proposal using all stored information
- Context management automatically cleared old tool results
- All memory files survived the clearing

## Next Steps

**For learning**: Follow the full tutorial at `/docs/tutorials/memory-and-context-management.md`

**For presenting**: Use the demo script at `/live-demo-script.md`

**For experimenting**: Check the prompts directory at `/prompts/`

## Troubleshooting

**Context not clearing?**
- Try repeating: "Show me all memories" in each chat 2-3 times

**Memory files not appearing?**
- Try explicit prompts: "Please save this to memory"

**AWS errors?**
- Verify credentials: `aws sts get-caller-identity`
- Check Bedrock access: `aws bedrock list-foundation-models --region us-east-1`

## Success Criteria

✓ You see "🔧 Memory Tool" boxes when Claude responds
✓ You see "🎉 Context Management Active!" message
✓ Statistics show non-zero "Tokens Saved"
✓ Memory files persist in the "📁 Memory Files" section

**Congratulations! You're now ready to build production multi-user AI workflows with shared memory.**
