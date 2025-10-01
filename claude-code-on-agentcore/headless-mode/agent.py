"""
Claude Code Agent for Amazon Bedrock AgentCore

This agent runs Claude Code (Cline) in headless mode to autonomously handle coding tasks.
It accepts natural language prompts and executes them using Claude Code's CLI.
Configured to use Amazon Bedrock for model inference.
"""

import os
import json
import logging
from pathlib import Path
from typing import Dict, Any, Optional, List
from datetime import datetime
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import boto3
from claude_agent_sdk import (
    query,
    ClaudeAgentOptions,
    ProcessError,
    AssistantMessage,
    SystemMessage,
    ResultMessage,
    TextBlock,
)

# Configure Claude Code to use Amazon Bedrock
os.environ["CLAUDE_CODE_USE_BEDROCK"] = "1"
os.environ["AWS_REGION"] = os.environ.get("AWS_REGION", "us-east-1")
os.environ["CLAUDE_CODE_MAX_OUTPUT_TOKENS"] = "4096"
os.environ["MAX_THINKING_TOKENS"] = "1024"

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Claude Code Agent Server", version="1.0.0")


class InvocationRequest(BaseModel):
    input: Dict[str, Any]


class InvocationResponse(BaseModel):
    output: Dict[str, Any]


def upload_workspace_files_to_s3(
    workspace_dir: str = "/app/workspace",
) -> List[Dict[str, str]]:
    """
    Upload all files created in the workspace to S3

    Returns:
        List of dicts with file_name and s3_url
    """
    # Get bucket name from environment (set via Docker build arg)
    output_bucket = os.environ.get("OUTPUT_BUCKET_NAME")
    logger.info(f"Output bucket: {output_bucket}")
    if not output_bucket:
        logger.warning("OUTPUT_BUCKET_NAME not set, skipping S3 upload")
        return []

    if not os.path.exists(workspace_dir):
        logger.warning(f"Workspace directory does not exist: {workspace_dir}")
        return []

    # Create S3 client with explicit region
    region = os.environ.get("AWS_REGION", "us-east-1")
    s3_client = boto3.client("s3", region_name=region)
    logger.info(f"Created S3 client for region: {region}")
    uploaded_files = []

    # Get all files in workspace (recursively)
    workspace_path = Path(workspace_dir)
    files = [f for f in workspace_path.rglob("*") if f.is_file()]

    if not files:
        logger.info("No files found in workspace to upload")
        return []

    logger.info(f"Found {len(files)} files to upload to S3")

    # Generate a unique prefix for this session
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    session_prefix = f"outputs/{timestamp}"

    for file_path in files:
        try:
            # Get relative path from workspace
            relative_path = file_path.relative_to(workspace_path)
            s3_key = f"{session_prefix}/{relative_path}"

            # Upload file
            s3_client.upload_file(str(file_path), output_bucket, s3_key)

            # Generate S3 URL
            region = os.environ.get("AWS_REGION", "us-east-1")
            s3_url = f"s3://{output_bucket}/{s3_key}"
            console_url = f"https://s3.console.aws.amazon.com/s3/object/{output_bucket}?region={region}&prefix={s3_key}"

            uploaded_files.append(
                {
                    "file_name": str(relative_path),
                    "s3_url": s3_url,
                    "console_url": console_url,
                }
            )

            logger.info(f"Uploaded: {relative_path} -> {s3_url}")

        except Exception as e:
            logger.error(f"Failed to upload {file_path}: {e}")

    return uploaded_files


async def run_claude_code(
    prompt: str,
    allowed_tools: Optional[str] = None,
    permission_mode: str = "acceptEdits",
) -> Dict[str, Any]:
    """
    Execute Claude Code using the Agent SDK

    Args:
        prompt: The task prompt for Claude Code
        allowed_tools: Comma-separated list of allowed tools
        permission_mode: Permission handling mode

    Returns:
        Dictionary containing the execution result
    """

    logger.info(f"Executing Claude Code with prompt: {prompt[:100]}...")

    try:
        # Convert allowed_tools string to list
        tools_list = allowed_tools.split(",") if allowed_tools else None
        logger.info(f"Tools: {tools_list}")
        logger.info(f"Permission mode: {permission_mode}")
        logger.info(f"Working directory: /app/workspace")

        # Create options with Claude Code preset
        # Use full Bedrock model ID for Claude Sonnet 4.5
        options = ClaudeAgentOptions(
            allowed_tools=tools_list,
            permission_mode=permission_mode,
            system_prompt={"type": "preset", "preset": "claude_code"},
            model="global.anthropic.claude-sonnet-4-5-20250929-v1:0",
            cwd="/app/workspace",
            env={
                "CLAUDE_CODE_USE_BEDROCK": "1",
                "AWS_REGION": os.environ.get("AWS_REGION", "us-east-1"),
                "CLAUDE_CODE_MAX_OUTPUT_TOKENS": "4096",
                "MAX_THINKING_TOKENS": "1024"
            }
        )
        logger.info("Created ClaudeAgentOptions with Bedrock configuration")

        # Collect all messages
        result_text = []
        session_id = None
        total_cost = 0
        duration_ms = 0
        num_turns = 0
        message_count = 0

        logger.info("Starting query execution...")
        # Execute query and collect responses
        async for message in query(prompt=prompt, options=options):
            message_count += 1
            logger.info(f"Received message #{message_count}: {type(message).__name__}")

            # Handle different message types
            if isinstance(message, SystemMessage):
                logger.info(f"SystemMessage - subtype: {message.subtype}")
                # System messages are informational, just log them
            elif isinstance(message, AssistantMessage):
                logger.info(f"AssistantMessage with {len(message.content)} blocks")
                for block in message.content:
                    if isinstance(block, TextBlock):
                        logger.info(f"TextBlock: {block.text[:100]}...")
                        result_text.append(block.text)
            elif isinstance(message, ResultMessage):
                logger.info(f"ResultMessage - is_error: {message.is_error}")
                session_id = message.session_id
                total_cost = message.total_cost_usd
                duration_ms = message.duration_ms
                num_turns = message.num_turns
                logger.info(
                    f"Session: {session_id}, Cost: ${total_cost}, Duration: {duration_ms}ms, Turns: {num_turns}"
                )
                if message.result:
                    logger.info(f"Result summary: {message.result[:100]}...")
            else:
                logger.warning(f"Unhandled message type: {type(message).__name__}")

        logger.info(f"Query completed. Received {message_count} total messages")
        logger.info(f"Collected {len(result_text)} text blocks")

        return {
            "success": True,
            "result": "\n".join(result_text) if result_text else "Task completed",
            "session_id": session_id,
            "total_cost_usd": total_cost,
            "duration_ms": duration_ms,
            "num_turns": num_turns,
            "model": "claude-sonnet-4.5",
        }

    except ProcessError as e:
        logger.error(f"Claude Code process failed with exit code {e.exit_code}")
        logger.error(f"Stderr: {e.stderr}")
        return {
            "success": False,
            "error": f"Process failed: {e.stderr or str(e)}",
            "model": "sonnet",
        }
    except Exception as e:
        logger.error(f"Error executing Claude Code: {e}")
        return {"success": False, "error": str(e), "model": "sonnet"}


@app.post("/invocations", response_model=InvocationResponse)
async def invoke_agent(request: InvocationRequest):
    """
    Main invocation endpoint for Claude Code agent
    """
    try:
        # Extract prompt from input
        user_prompt = request.input.get("prompt", "")
        if not user_prompt:
            raise HTTPException(
                status_code=400,
                detail="No prompt found in input. Please provide a 'prompt' key in the input.",
            )

        # Get optional parameters with defaults
        permission_mode = request.input.get("permission_mode", "acceptEdits")

        # Default allowed tools for autonomous operation
        default_tools = "Bash,Read,Write,Replace,Search,List,WebFetch,AskFollowup"
        allowed_tools = request.input.get("allowed_tools", default_tools)

        logger.info(f"Processing prompt: {user_prompt[:100]}...")
        logger.info(
            f"Input parameters: permission_mode={permission_mode}, tools={allowed_tools}"
        )

        # Execute Claude Code (async)
        result = await run_claude_code(
            prompt=user_prompt,
            allowed_tools=allowed_tools,
            permission_mode=permission_mode,
        )

        # Upload workspace files to S3
        uploaded_files = []
        if result.get("success"):
            try:
                uploaded_files = upload_workspace_files_to_s3()
                if uploaded_files:
                    logger.info(f"Uploaded {len(uploaded_files)} files to S3")
            except Exception as e:
                logger.error(f"Failed to upload files to S3: {e}")

        # Build response
        response_data = {
            "success": result.get("success", False),
            "result": result.get("result", ""),
            "session_id": result.get("session_id"),
            "timestamp": datetime.utcnow().isoformat(),
            "model": result.get("model", "sonnet"),
            "metadata": {
                "cost_usd": result.get("total_cost_usd"),
                "duration_ms": result.get("duration_ms"),
                "num_turns": result.get("num_turns"),
                "uploaded_files": uploaded_files if uploaded_files else None,
            },
        }

        if not result.get("success"):
            response_data["error"] = result.get("error", "Unknown error")
            logger.error(f"Claude Code execution failed: {response_data['error']}")
        else:
            logger.info("Claude Code execution completed successfully")

        return InvocationResponse(output=response_data)

    except Exception as e:
        logger.error(f"Agent processing failed: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Agent processing failed: {str(e)}"
        )


@app.get("/ping")
async def ping():
    """Health check endpoint"""
    return {"status": "healthy", "service": "claude-code-agent"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8080)
