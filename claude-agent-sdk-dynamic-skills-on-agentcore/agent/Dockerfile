# Claude Agent SDK with Dynamic Skills on AgentCore Runtime
# Multi-stage Docker build for production deployment
#
# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

FROM python:3.12-slim

# Install system dependencies and Node.js for Claude Code CLI
RUN apt-get update && apt-get install -y \
    curl \
    git \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Claude Code CLI globally
RUN npm install -g @anthropic-ai/claude-code

# Set working directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Set environment variables (can be overridden by AgentCore)
ENV CLAUDE_CODE_USE_BEDROCK=1
ENV AWS_REGION=us-east-1
ENV ANTHROPIC_MODEL=us.anthropic.claude-sonnet-4-20250514-v1:0
# SKILLS_S3_BUCKET will be set by AgentCore environment configuration

# Copy application files
COPY s3_skill_loader.py .
COPY startup.sh .
COPY agent.py .

# Create .claude/skills directory for skill discovery
RUN mkdir -p .claude/skills

# Make startup script executable
RUN chmod +x /app/startup.sh

# Install AWS CLI for container debugging (optional)
RUN pip install awscli --no-cache-dir

# Create non-root user for security
RUN useradd -m -u 1000 claude && \
    chown -R claude:claude /app
USER claude

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD python -c "import sys; sys.exit(0)"

# Expose port for AgentCore Runtime
EXPOSE 8080

# Use startup script as entrypoint
# This will load skills from S3 then start the agent
ENTRYPOINT ["/app/startup.sh", "agent.py"]