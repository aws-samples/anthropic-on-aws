# Claude Sonnet 4.5 Memory Features Demo

This directory contains a comprehensive tutorial and reference guide demonstrating Claude Sonnet 4.5's native memory capabilities on Amazon Bedrock.

## Overview

Claude Sonnet 4.5 includes built-in memory functionality that allows the model to:
- Store persistent memories across conversations as `.md` files
- Recall information from previous interactions
- Provide personalized responses based on stored context
- Manage memory storage and retrieval autonomously
- Use markdown formatting for human-readable memory files

### Implementation Approach

This demo uses a **file-based persistence model** where:
- Memories are stored as `.md` files in the `./memories/` directory
- A system prompt ensures Claude uses `.md` extensions consistently
- Memory files persist across kernel restarts and system reboots
- Files can be viewed, edited, and version-controlled

## Files

- **`claude_memory_tutorial.ipynb`** - Interactive tutorial notebook with step-by-step learning (45 min)
- **`claude_memory_agentcore_tutorial.ipynb`** - Interactive tutorial notebook with step-by-step learning (45 min)
- **`docs/tutorials/claude-memory-quickstart.md`** - Comprehensive setup and reference guide
- **`streamlit_multi_agent_demo/`** - Interactive Streamlit demo/tutorial showcasing multi-agent memory 

## Key Features Demonstrated

1. **File-Based Persistence** - Memories stored as `.md` files on disk
2. **System Prompt Configuration** - Ensuring consistent `.md` file extensions
3. **Memory Recall** - Retrieving stored information in new conversations
4. **Personalized Responses** - Using memories to provide tailored assistance
5. **Memory Updates** - Dynamically updating stored information
6. **Minimal Client Implementation** - Simple tool use/result exchange pattern
7. **Cross-Session Persistence** - Memories survive kernel restarts

## Prerequisites

- AWS account with Bedrock access
- Claude Sonnet 4.5 model access: `global.anthropic.claude-sonnet-4-5-20250929-v1:0`
- Python 3.8+ with `boto3` installed
- Configured AWS credentials with Bedrock permissions (`bedrock:InvokeModel`)
- Jupyter Lab or Jupyter Notebook (for interactive tutorial)

## Getting Started

### Option 1: Interactive Tutorial (Recommended for Learning)

1. Open `claude_memory_tutorial.ipynb` in Jupyter
2. Follow the step-by-step cells (~30 minutes)
3. Run each session to see memory features in action
4. Memory files are created in `./memories/` directory

### Option 2: Quick Reference Guide

1. Read `docs/tutorials/claude-memory-quickstart.md`
2. Copy code blocks into your own Python file
3. Configure AWS credentials and model ID
4. Run the complete implementation

**Both paths teach the same implementation and are fully aligned.**

## Architecture

The implementation demonstrates a minimal client-side pattern:

```
┌──────────────────────────────────────────────────────────────┐
│                     Your Application                         │
│                                                              │
│  ┌──────────────────┐    ┌──────────────────┐                │
│  │  chat_with_      │───▶│  handle_memory_  │                │
│  │  claude()        │◀───│  tool()          │                │
│  │                  │    │                  │                │
│  │ - Sends messages │    │ - view memories  │                │
│  │ - Handles tool   │    │ - create files   │    ┌─────────┐ │
│  │   use loop       │    │ - update files   │───▶│memories/│ │
│  │ - System prompt  │    │                  │    │ *.md    │ │
│  └──────────────────┘    └──────────────────┘    └─────────┘ │
│           │                                                  │
│           ▼                                                  │
│  ┌──────────────────┐                                        │
│  │  AWS Bedrock     │                                        │
│  │  Claude Sonnet   │                                        │
│  │  4.5             │                                        │
│  └──────────────────┘                                        │
└──────────────────────────────────────────────────────────────┘
```

### Key Components

1. **System Prompt**: Instructs Claude to use `.md` extensions
   ```python
   SYSTEM_PROMPT = "When using the memory tool, always use .md file extensions for markdown-formatted memories."
   ```

2. **Memory Handler**: Processes Claude's memory tool requests
   - Uses file paths exactly as Claude provides them (no conversion)
   - Stores memories in `./memories/` directory
   - Supports view, create, and str_replace commands

3. **Chat Function**: Manages tool use loop with system prompt included in API call

### Client vs. Claude Roles

- **Client Role**:
  - Provides file storage for `.md` memory files
  - Handles basic tool use/result exchange
  - Includes system prompt in API calls

- **Claude Role**:
  - Manages all memory operations (storage, retrieval, organization)
  - Decides what to remember and when to recall
  - Uses `.md` extensions via system prompt
  - Creates meaningful, organized file structures

## Usage Examples

### Storing Information
```python
conversation = chat_with_claude(
    "Remember that I'm a Python developer who loves machine learning"
)
# Claude creates: ./memories/user_profile.md
```

### Recalling Information (New Session)
```python
conversation = chat_with_claude(
    "What do you remember about me?"
)
# Claude reads from: ./memories/user_profile.md
```

### Viewing Memory Files
```bash
ls memories/
cat memories/user_profile.md
```

## Learning Resources

### Tutorial Notebook
- **Path**: `claude_memory_tutorial.ipynb`
- **Format**: Interactive Jupyter notebook
- **Time**: 45 minutes
- **Best For**: Hands-on learning with step-by-step guidance

### Quickstart Guide
- **Path**: `docs/tutorials/claude-memory-quickstart.md`
- **Format**: Markdown reference guide
- **Time**: 30-45 minutes
- **Best For**: Copy-paste implementation and comprehensive reference

### What You'll Learn
- How Claude's memory system works autonomously
- File-based persistence with `.md` files
- System prompt configuration for file extensions
- Tool use loop pattern
- Memory commands (view, create, str_replace)
- Building personalized AI interactions

## Production Considerations

This demo is designed for learning and experimentation. For production use, consider:

- **Storage Scaling**: Replace file-based storage with database (PostgreSQL, DynamoDB)
- **Multi-User Support**: Add user-specific memory directories or database partitions
- **Memory Limits**: Implement size limits and cleanup policies
- **Error Handling**: Add comprehensive error handling and retry logic
- **Security**: Implement authentication, authorization, and data encryption
- **Monitoring**: Add observability and performance tracking

## Technical Details

- **Model**: `global.anthropic.claude-sonnet-4-5-20250929-v1:0`
- **API Version**: `bedrock-2023-05-31`
- **Beta Feature**: `context-management-2025-06-27`
- **Tool Type**: `memory_20250818`
- **Memory Format**: Markdown (`.md`) files
- **Storage Location**: `./memories/` directory (relative to working directory)

## Troubleshooting

**Memory files not persisting?**
- Check that `./memories/` directory exists
- Verify file permissions
- Ensure kernel/process hasn't been terminated

**Claude not using `.md` extensions?**
- Verify system prompt is included in API call
- Check `SYSTEM_PROMPT` variable is defined
- Ensure using correct model ID

**AWS errors?**
- Verify credentials with `aws configure`
- Check model access in Bedrock console
- Ensure correct region configuration

**For detailed troubleshooting**, see the quickstart guide's troubleshooting section.

## Additional Documentation

### External Resources
- [Anthropic Memory and Context Editing Cookbook](https://github.com/anthropics/claude-cookbooks/blob/main/tool_use/memory_cookbook.ipynb)
- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [Anthropic API Documentation](https://docs.anthropic.com/)
- [Memory Tool API](https://docs.anthropic.com/en/docs/build-with-claude/tool-use/memory-tool)
- [Context Management Guide](https://docs.anthropic.com/en/docs/build-with-claude/context-editing)

## License

MIT-0

---

**Note**: This implementation demonstrates Claude Sonnet 4.5's sophisticated memory management with minimal client-side infrastructure. The system prompt ensures consistent `.md` file usage throughout, eliminating the need for path conversion logic.