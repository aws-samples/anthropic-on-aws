# Claude Code Agent on Amazon Bedrock AgentCore - Headless Mode

This implementation provides a headless deployment of Claude Code (Cline) as an autonomous coding agent using Amazon Bedrock AgentCore Runtime with integrated Amazon Bedrock AgentCore memory capabilities.

## Features

- **Autonomous Coding Agent**: Claude Code running in headless mode via AgentCore Runtime
- **Memory Integration**: Short-term (conversation history) and long-term (extracted facts/preferences) memory
- **Session Persistence**: Files created in sessions are stored in S3 for continuity
- **Streamlit UI**: Interactive interface with 3 tabs (Conversation, Short-Term Memory, Long-Term Memory)
- **Automated Deployment**: Single script deployment with CloudFormation, Docker, and AgentCore

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Streamlit UI / CLI                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Conversation │  │ Short-Term   │  │ Long-Term    │      │
│  │     Tab      │  │  Memory Tab  │  │  Memory Tab  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Amazon Bedrock AgentCore Runtime                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Claude Code Agent (FastAPI)              │   │
│  │  ┌────────────────┐         ┌──────────────────┐    │   │
│  │  │ Memory Manager │◄────────┤  Agent Logic     │    │   │
│  │  └────────────────┘         └──────────────────┘    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────────┐  ┌──────────────┐
│ AgentCore    │  │   S3 Bucket      │  │ SSM Param    │
│   Memory     │  │ (Session Files)  │  │   Store      │
└──────────────┘  └──────────────────┘  └──────────────┘
```

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** configured with credentials
3. **Docker** installed and running
4. **Python 3.11+** installed
5. **Bedrock Model Access**: Enable Anthropic Claude 4.0 Sonnet in your region

## Quick Start

### 1. Deploy the Agent

```bash
cd headless-mode
./deploy.sh
```

The deployment script will:
1. Deploy CloudFormation stack (IAM role, S3 bucket, ECR repository)
2. **Setup AgentCore Memory** (creates or reuses existing memory)
3. Build and push Docker image to ECR
4. Deploy AgentCore runtime
5. Save deployment information

### 2. Invoke the Agent

```bash
# Via CLI
./invoke_claude_code.sh "Create a simple calculator app"

# Via Streamlit UI
./run_streamlit.sh
```

### 3. View Results

```bash
# View deployment info
./show_agent_info.sh

# Download generated files
./download_outputs.sh

# View memories
./view_memories.sh

# View conversation history
./view_conversation_history.sh
```

## Memory Setup

The memory setup is **fully integrated into deploy.sh** and follows this idempotent flow:

1. **Check SSM Parameter Store** for existing memory ID
2. **Verify memory exists** in AgentCore (if found in SSM)
3. **Search by name** if not in SSM (`ClaudeCodeAgentMemory`)
4. **Create new memory** only if none exists
5. **Store memory ID** in SSM Parameter Store

This ensures **only ONE memory resource** is created per environment, preventing duplicate memory issues.

### Memory Architecture

- **SSM Parameter**: `/claude-code-agent/memory-id` (source of truth)
- **Memory Name**: `ClaudeCodeAgentMemory`
- **Strategies**:
  - `SEMANTIC`: Extracts factual information and technical knowledge (namespace: `coding/user/{actorId}/facts`)
  - `USER_PREFERENCE`: Stores user preferences and coding styles (namespace: `coding/user/{actorId}/preferences`)
  - `SUMMARIZATION`: Captures conversation summaries (namespace: `coding/user/{actorId}/{sessionId}`)

### Viewing Memories

```bash
# View all long-term memories (facts, preferences, summaries)
./view_memories.sh [actor_id]

# View conversation history for a specific session
./view_conversation_history.sh <actor_id> <session_id>
```

**Note**: Long-term memories are extracted automatically in the background 5-10 minutes after conversations.

## Session Management

### Session-Based File Storage

Files created during agent sessions are stored in S3 with this structure:

```
s3://bucket-name/
├── sessions/
│   └── {actor_id}/
│       └── {session_id}/
│           ├── file1.py
│           └── file2.py
└── outputs/
    └── {timestamp}/
        ├── file1.py
        └── file2.py
```

- **sessions/**: Active session files (for continuity)
- **outputs/**: Timestamped backups (for history)

### Session Continuity

When you continue a session:
1. Agent downloads previous files from `sessions/{actor_id}/{session_id}/`
2. Agent can modify existing files or create new ones
3. All files are uploaded back to both session and backup locations

## Streamlit UI

The Streamlit interface provides three tabs:

### Tab 1: Conversation
- Send prompts to the agent
- View responses in real-time
- Manage sessions (New Session button)
- Session ID displayed for tracking

### Tab 2: Short-Term Memory
- View recent conversation history
- Shows last N turns (configurable, default 10)
- Displays user and assistant messages
- Resets when starting a new session

### Tab 3: Long-Term Memory
- View extracted facts and preferences
- Persists across sessions
- Shows semantic memories, summaries, and preferences
- Organized by namespace

## Configuration

### Environment Variables

Set in `infrastructure.yaml` or override at runtime:

- `AWS_REGION`: AWS region (default: us-east-1)
- `OUTPUT_BUCKET_NAME`: S3 bucket for file storage
- `MEMORY_MAX_TURNS`: Number of conversation turns to load (default: 10)

### Memory Settings

Configured in `deploy.sh`:

- `SSM_MEMORY_PARAM`: `/claude-code-agent/memory-id`
- `MEMORY_NAME`: `ClaudeCodeAgentMemory`
- `EVENT_EXPIRY_DAYS`: 30 days


## Files Overview

### Core Files
- `deploy.sh`: Unified deployment script with integrated memory setup
- `agent.py`: FastAPI agent with memory integration
- `memory_manager.py`: Memory operations (load/save context, session summaries)
- `infrastructure.yaml`: CloudFormation template (IAM, S3, ECR)
- `Dockerfile`: Container image for AgentCore runtime
- `pyproject.toml`: Python dependencies

### UI & Scripts
- `streamlit_app.py`: Streamlit UI with 3 tabs (Conversation, Short-Term Memory, Long-Term Memory)
- `run_streamlit.sh`: Launch Streamlit UI
- `invoke_claude_code.sh`: CLI invocation script
- `view_memories.sh`: View long-term memories (facts, preferences, summaries)
- `view_conversation_history.sh`: View short-term conversation history
- `download_outputs.sh`: Download generated files from S3
- `show_agent_info.sh`: Display deployment information

## Cleanup

To remove all resources:

```bash
# 1. Get runtime ID from deployment.json
RUNTIME_ID=$(jq -r '.runtime_id' deployment.json)

# 2. Delete AgentCore runtime
aws bedrock-agentcore-control delete-agent-runtime \
  --agent-runtime-id $RUNTIME_ID

# 3. Delete memory (optional - can be reused)
MEMORY_ID=$(aws ssm get-parameter --name /claude-code-agent/memory-id --query 'Parameter.Value' --output text)
aws bedrock-agentcore-control delete-memory --memory-id $MEMORY_ID

# 4. Delete SSM parameter
aws ssm delete-parameter --name /claude-code-agent/memory-id

# 5. Delete CloudFormation stack
aws cloudformation delete-stack \
  --stack-name claude-code-agent-memory-stack

# 6. Delete ECR images (optional)
REPO_NAME=$(aws cloudformation describe-stacks \
  --stack-name claude-code-agent-memory-stack \
  --query 'Stacks[0].Outputs[?OutputKey==`ECRRepositoryName`].OutputValue' \
  --output text)
aws ecr batch-delete-image \
  --repository-name $REPO_NAME \
  --image-ids imageTag=latest
```

**Note**: The S3 bucket must be emptied before the CloudFormation stack can be deleted.
