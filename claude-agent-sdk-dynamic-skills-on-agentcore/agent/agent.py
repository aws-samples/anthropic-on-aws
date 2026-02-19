#!/usr/bin/env python3
"""
Claude Agent with Dynamic Skills - Advanced Implementation

This demonstrates the advanced approach using Claude Agent SDK with native skill discovery.
Skills are loaded from S3 into the .claude/skills/ directory for automatic discovery.

Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: MIT-0
"""

import os
import asyncio
from typing import Dict, Any
from bedrock_agentcore.runtime import BedrockAgentCoreApp
from claude_agent_sdk import query, ClaudeAgentOptions

# Configuration from environment variables
AWS_REGION = os.getenv('AWS_REGION', 'us-east-1')
MODEL_ID = os.getenv('ANTHROPIC_MODEL', 'us.anthropic.claude-sonnet-4-20250514-v1:0')
SKILLS_S3_BUCKET = os.getenv('SKILLS_S3_BUCKET')

# Initialize AgentCore app
app = BedrockAgentCoreApp()

@app.entrypoint
def handler(event, context):
    """
    AgentCore entrypoint with native Claude Agent SDK integration.

    Skills are loaded from S3 into .claude/skills/ directory during container startup,
    then automatically discovered by Claude Agent SDK.

    Args:
        event: Request event from AgentCore
        context: Lambda-style context (not used)

    Returns:
        dict: Response with agent output and metadata
    """
    prompt = event.get('prompt', 'Hello') if event else 'Hello'

    # Run Claude Agent SDK with S3-loaded skills
    result = asyncio.run(run_claude_with_dynamic_skills(prompt))

    return {
        "response": result.get("response", ""),
        "status": result.get("status", "unknown"),
        "implementation": "advanced_native_sdk",
        "s3_skills_loaded": True,
        "skills_source": "s3_to_filesystem_to_claude_discovery",
        "s3_bucket": SKILLS_S3_BUCKET
    }

async def run_claude_with_dynamic_skills(prompt: str) -> Dict[str, Any]:
    """
    Run Claude Agent SDK with skills loaded from S3.

    The startup.sh script has already loaded skills from S3 into .claude/skills/
    directory. Claude Agent SDK will automatically discover and use these skills.

    Args:
        prompt: User input prompt

    Returns:
        dict: Response data with status and content
    """
    try:
        # Configure Claude Agent SDK for skill discovery
        options = ClaudeAgentOptions(
            cwd=os.getcwd(),  # Current directory contains .claude/skills/
            setting_sources=["project"],  # Enable .claude/skills/ directory discovery
            allowed_tools=[
                "Skill",      # Enable Claude's native skill system
                "Read",       # File reading capabilities
                "Write",      # File writing capabilities
                "Bash",       # Shell command execution
                "Grep",       # Text search
                "Glob"        # File pattern matching
            ],
            model=MODEL_ID
        )

        # Collect response parts from streaming API
        response_parts = []

        print(f"🤖 Querying Claude with prompt: {prompt[:50]}...")

        # Stream response from Claude Agent SDK
        async for message in query(prompt=prompt, options=options):
            # Extract text content from various message types
            if hasattr(message, 'content') and message.content:
                if isinstance(message.content, list):
                    # Handle list of content blocks
                    for block in message.content:
                        if hasattr(block, 'text') and block.text.strip():
                            response_parts.append(block.text.strip())
                elif hasattr(message.content, 'text') and message.content.text.strip():
                    # Handle single text content
                    response_parts.append(message.content.text.strip())
            elif hasattr(message, 'result') and str(message.result).strip():
                # Handle result objects
                response_parts.append(str(message.result).strip())

        # Remove duplicates while preserving order
        seen = set()
        unique_parts = []
        for part in response_parts:
            if part not in seen:
                seen.add(part)
                unique_parts.append(part)

        # Join response parts
        response_text = "\n\n".join(unique_parts) if unique_parts else "No response generated"

        print(f"✅ Generated response: {response_text[:100]}...")

        return {
            "response": response_text,
            "status": "success",
            "parts_processed": len(response_parts),
            "unique_parts": len(unique_parts)
        }

    except Exception as e:
        error_message = f"Claude Agent SDK error: {str(e)}"
        print(f"❌ {error_message}")

        return {
            "response": error_message,
            "status": "error",
            "parts_processed": 0
        }

if __name__ == "__main__":
    # For local testing
    app.run()