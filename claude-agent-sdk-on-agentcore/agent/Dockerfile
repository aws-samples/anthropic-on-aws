# GitHub PR Review Agent
# Platform: linux/arm64 (AgentCore requires ARM64)
# Base: Python 3.12 slim for minimal image size

FROM --platform=linux/arm64 python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies
# - curl: For making HTTP requests (used by agent skill)
# - git: For potential git operations
# - ca-certificates: For HTTPS requests
# - wget: For downloading gh CLI GPG key
# - gnupg: For verifying gh CLI package signatures
# - Node.js 20: Required for Claude Code CLI (ARM64-compatible)
RUN apt-get update && apt-get install -y \
    curl \
    git \
    ca-certificates \
    wget \
    gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install GitHub CLI (gh) - ARM64 compatible
# Uses official GitHub CLI APT repository
# Automatically authenticates using GITHUB_TOKEN environment variable
RUN mkdir -p -m 755 /etc/apt/keyrings \
    && wget -qO- https://cli.github.com/packages/githubcli-archive-keyring.gpg | tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null \
    && chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
    && apt-get update \
    && apt-get install gh -y \
    && rm -rf /var/lib/apt/lists/*

# Verify gh CLI installation
RUN which gh && gh --version && echo "✓ GitHub CLI installed successfully"

# Install Claude Code CLI globally (provides ARM64-compatible binary)
# The Claude Agent SDK will automatically use this instead of the bundled x86_64 CLI
RUN npm install -g @anthropic-ai/claude-code

# Verify Claude Code CLI is installed, in PATH, and executable
RUN which claude && claude --version && echo "✓ Claude CLI installed successfully"

# Copy requirements first (better layer caching)
COPY requirements.txt .

# Install Python dependencies
# - claude-agent-sdk: Core agent framework (includes bundled Claude CLI for x86_64)
# - aws-opentelemetry-distro: OpenTelemetry auto-instrumentation
# - boto3: AWS SDK
# - httpx: HTTP client
RUN pip install --no-cache-dir -r requirements.txt

# Remove bundled x86_64 CLI so SDK uses ARM64 version from PATH
# The SDK checks for bundled CLI first, so we must remove it to force PATH lookup
RUN rm -f /usr/local/lib/python3.12/site-packages/claude_agent_sdk/_bundled/claude && \
    echo "✓ Removed bundled x86_64 CLI, SDK will use ARM64 CLI from PATH"

# Copy Claude skills (critical - contains code review logic)
COPY .claude/ ./.claude/

# Force rebuild of this layer and all subsequent layers
ARG CACHE_BUST=unknown

# Copy agent source code (all modules to support refactored structure)
# This includes: agent.py, api/, core/, orchestration/, workflows/, utils/
COPY src/ ./

# Create non-root user (required for Claude CLI bypassPermissions mode)
# Claude CLI refuses to run with --dangerously-skip-permissions as root
RUN useradd -u 1000 -m -s /bin/bash agent

# Create workspace directory for Claude CLI (required for temporary files and session data)
RUN mkdir -p /app/workspace && \
    chown -R agent:agent /app

USER agent

# Set environment variables
# Ensure /usr/local/bin is in PATH for global npm packages (claude CLI)
# CRITICAL: Set CLAUDE_CODE_USE_BEDROCK in Dockerfile so it's inherited by subprocess
# CRITICAL: Set both AWS_REGION and AWS_DEFAULT_REGION (required for subprocess credential access)
ENV PATH="/usr/local/bin:${PATH}" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    CLAUDE_CODE_USE_BEDROCK=1 \
    AWS_REGION=us-east-1 \
    AWS_DEFAULT_REGION=us-east-1

# Health check - checks the /ping endpoint provided by BedrockAgentCoreApp
# This is critical for AgentCore Runtime to verify the container is healthy
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/ping || exit 1

# Entry point - run Uvicorn with OpenTelemetry auto-instrumentation
# The opentelemetry-instrument wrapper automatically captures traces and logs
CMD ["opentelemetry-instrument", "uvicorn", "agent:app", "--host", "0.0.0.0", "--port", "8080"]

# Labels for container metadata
LABEL maintainer="github-agent-automation" \
      description="Automated GitHub PR review agent using Claude SDK" \
      version="1.0.0"
