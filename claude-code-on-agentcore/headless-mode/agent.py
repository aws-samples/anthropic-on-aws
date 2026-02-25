"""
Claude Code Agent for Amazon Bedrock AgentCore

This agent runs Claude Code (Cline) in headless mode to autonomously handle coding tasks.
It accepts natural language prompts and executes them using Claude Code's CLI.
Configured to use Amazon Bedrock for model inference with AgentCore Memory integration.
"""

import os
import json
import logging
import uuid
from pathlib import Path
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
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
from memory_manager import ClaudeCodeMemoryManager

# Configure Claude Code to use Amazon Bedrock
os.environ["CLAUDE_CODE_USE_BEDROCK"] = "1"
os.environ["AWS_REGION"] = os.environ.get("AWS_REGION", "us-east-1")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Claude Code Agent Server", version="1.0.0")

# Initialize memory manager ONCE at startup (not per request)
memory_manager = None

@app.on_event("startup")
async def startup_event():
    """Initialize memory manager once at application startup"""
    global memory_manager
    try:
        memory_manager = ClaudeCodeMemoryManager()
        logger.info(f"✅ Memory manager initialized with ID: {memory_manager.get_memory_id()}")
    except Exception as e:
        logger.error(f"❌ Failed to initialize memory manager: {e}")
        logger.error("Make sure to run 'python setup_memory.py create' before starting the agent")
        memory_manager = None


class InvocationRequest(BaseModel):
    input: Dict[str, Any]


class InvocationResponse(BaseModel):
    output: Dict[str, Any]


def upload_workspace_files_to_s3(
    actor_id: str,
    session_id: str,
    workspace_dir: str = "/app/workspace",
) -> List[Dict[str, str]]:
    """Upload all files created in the workspace to S3 using session-based storage"""
    output_bucket = os.environ.get("OUTPUT_BUCKET_NAME")
    logger.info(f"Output bucket: {output_bucket}")
    if not output_bucket:
        logger.warning("OUTPUT_BUCKET_NAME not set, skipping S3 upload")
        return []

    if not os.path.exists(workspace_dir):
        logger.warning(f"Workspace directory does not exist: {workspace_dir}")
        return []

    region = os.environ.get("AWS_REGION", "us-east-1")
    s3_client = boto3.client("s3", region_name=region)
    logger.info(f"Created S3 client for region: {region}")
    uploaded_files = []

    workspace_path = Path(workspace_dir)
    files = [f for f in workspace_path.rglob("*") if f.is_file()]

    if not files:
        logger.info("No files found in workspace to upload")
        return []

    logger.info(f"Found {len(files)} files to upload to S3")

    # Use session-based prefix for file organization
    session_prefix = f"sessions/{actor_id}/{session_id}"
    
    # Also create a timestamped backup in outputs
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    backup_prefix = f"outputs/{timestamp}"

    for file_path in files:
        try:
            relative_path = file_path.relative_to(workspace_path)
            
            # Upload to session-specific location (for continuity)
            session_s3_key = f"{session_prefix}/{relative_path}"
            s3_client.upload_file(str(file_path), output_bucket, session_s3_key)
            
            # Also upload to timestamped backup (for history)
            backup_s3_key = f"{backup_prefix}/{relative_path}"
            s3_client.upload_file(str(file_path), output_bucket, backup_s3_key)

            region = os.environ.get("AWS_REGION", "us-east-1")
            s3_url = f"s3://{output_bucket}/{backup_s3_key}"
            console_url = f"https://s3.console.aws.amazon.com/s3/object/{output_bucket}?region={region}&prefix={backup_s3_key}"

            uploaded_files.append(
                {
                    "file_name": str(relative_path),
                    "s3_url": s3_url,
                    "console_url": console_url,
                    "session_s3_key": session_s3_key,
                }
            )

            logger.info(f"Uploaded: {relative_path} -> {session_s3_key} (session) and {backup_s3_key} (backup)")

        except Exception as e:
            logger.error(f"Failed to upload {file_path}: {e}")

    return uploaded_files


def download_session_files_from_s3(actor_id: str, session_id: str, workspace_dir: str = "/app/workspace") -> List[str]:
    """Download previously created files for this session from S3"""
    output_bucket = os.environ.get("OUTPUT_BUCKET_NAME")
    if not output_bucket:
        return []
    
    region = os.environ.get("AWS_REGION", "us-east-1")
    s3_client = boto3.client("s3", region_name=region)
    downloaded_files = []
    
    try:
        # Use session-specific prefix to download files
        session_prefix = f"sessions/{actor_id}/{session_id}/"
        
        # List all objects in this session's directory
        response = s3_client.list_objects_v2(
            Bucket=output_bucket,
            Prefix=session_prefix
        )
        
        if 'Contents' not in response:
            logger.info(f"No existing files found for session {session_id}")
            return []
        
        logger.info(f"Found {len(response['Contents'])} files in session storage")
        
        for obj in response['Contents']:
            s3_key = obj['Key']
            
            # Skip directory markers
            if s3_key.endswith('/'):
                continue
            
            # Extract relative path from S3 key
            # e.g., sessions/user123/session456/calculator.py -> calculator.py
            # e.g., sessions/user123/session456/tests/test_calc.py -> tests/test_calc.py
            relative_path = s3_key[len(session_prefix):]
            local_path = os.path.join(workspace_dir, relative_path)
            
            # Create directories if needed
            os.makedirs(os.path.dirname(local_path), exist_ok=True)
            
            # Download the file
            s3_client.download_file(output_bucket, s3_key, local_path)
            downloaded_files.append(relative_path)
            logger.info(f"Downloaded {relative_path} from session storage")
                
    except Exception as e:
        logger.warning(f"Could not download session files from S3: {e}")
    
    return downloaded_files


async def run_claude_code(
    prompt: str,
    actor_id: str,
    session_id: str,
    allowed_tools: Optional[str] = None,
    permission_mode: str = "acceptEdits",
) -> Dict[str, Any]:
    """Execute Claude Code using the Agent SDK with memory integration"""

    logger.info(f"Executing Claude Code with prompt: {prompt[:100]}...")

    # Load memory context
    memory_context = ""
    if memory_manager:
        try:
            memory_context = memory_manager.load_session_context(actor_id, session_id)
            if memory_context:
                logger.info("✅ Loaded memory context")
        except Exception as e:
            logger.warning(f"Failed to load memory context: {e}")
    
    # Download previously created files from S3 for session continuity
    downloaded_files = download_session_files_from_s3(actor_id, session_id)
    if downloaded_files:
        logger.info(f"✅ Downloaded {len(downloaded_files)} files from previous session: {', '.join(downloaded_files)}")

    try:
        tools_list = allowed_tools.split(",") if allowed_tools else None
        logger.info(f"Tools: {tools_list}")
        logger.info(f"Permission mode: {permission_mode}")
        logger.info(f"Working directory: /app/workspace")

        # Add memory context and file context before the prompt
        enhanced_prompt = prompt
        if memory_context:
            enhanced_prompt = f"{memory_context}\n\n{prompt}"
        
        # Add information about downloaded files
        if downloaded_files:
            files_context = f"\n\nNote: The following files from previous work in this session are available in the workspace:\n"
            files_context += "\n".join([f"- {f}" for f in downloaded_files])
            enhanced_prompt = f"{enhanced_prompt}{files_context}"

        options = ClaudeAgentOptions(
            allowed_tools=tools_list,
            permission_mode=permission_mode,
            system_prompt={"type": "preset", "preset": "claude_code"},
            model="global.anthropic.claude-sonnet-4-5-20250929-v1:0",
            cwd="/app/workspace",
            env={
                "CLAUDE_CODE_USE_BEDROCK": "1",
                "AWS_REGION": os.environ.get("AWS_REGION", "us-east-1"),
            },
        )
        logger.info("Created ClaudeAgentOptions with Bedrock configuration")

        result_text = []
        session_id_result = None
        duration_ms = 0
        num_turns = 0
        message_count = 0

        logger.info("Starting query execution...")
        async for message in query(prompt=enhanced_prompt, options=options):
            message_count += 1
            logger.info(f"Received message #{message_count}: {type(message).__name__}")

            if isinstance(message, SystemMessage):
                logger.info(f"SystemMessage - subtype: {message.subtype}")
            elif isinstance(message, AssistantMessage):
                logger.info(f"AssistantMessage with {len(message.content)} blocks")
                for block in message.content:
                    if isinstance(block, TextBlock):
                        logger.info(f"TextBlock: {block.text[:100]}...")
                        result_text.append(block.text)
            elif isinstance(message, ResultMessage):
                logger.info(f"ResultMessage - is_error: {message.is_error}")
                session_id_result = message.session_id
                duration_ms = message.duration_ms
                num_turns = message.num_turns
                logger.info(
                    f"Session: {session_id_result}, Duration: {duration_ms}ms, Turns: {num_turns}"
                )
                if message.result:
                    logger.info(f"Result summary: {message.result[:100]}...")
            else:
                logger.warning(f"Unhandled message type: {type(message).__name__}")

        logger.info(f"Query completed. Received {message_count} total messages")
        logger.info(f"Collected {len(result_text)} text blocks")

        # Save to memory
        result_summary = "\n".join(result_text) if result_text else "Task completed"
        if memory_manager:
            try:
                memory_manager.save_session_event(actor_id, session_id, prompt, result_summary)
                logger.info("✅ Saved session to memory")
            except Exception as e:
                logger.warning(f"Failed to save to memory: {e}")

        return {
            "success": True,
            "result": result_summary,
            "session_id": session_id_result,
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
    """Main invocation endpoint for Claude Code agent with memory integration"""
    try:
        user_prompt = request.input.get("prompt", "")
        if not user_prompt:
            raise HTTPException(
                status_code=400,
                detail="No prompt found in input. Please provide a 'prompt' key in the input.",
            )

        # Get actor_id and session_id for memory management
        actor_id = request.input.get("actor_id", "default_user")
        session_id = request.input.get("session_id", str(uuid.uuid4()))

        permission_mode = request.input.get("permission_mode", "acceptEdits")
        default_tools = "Bash,Read,Write,Replace,Search,List,WebFetch,AskFollowup"
        allowed_tools = request.input.get("allowed_tools", default_tools)

        logger.info(f"Processing prompt: {user_prompt[:100]}...")
        logger.info(f"Actor: {actor_id}, Session: {session_id}")
        logger.info(
            f"Input parameters: permission_mode={permission_mode}, tools={allowed_tools}"
        )

        # Execute Claude Code with memory integration
        result = await run_claude_code(
            prompt=user_prompt,
            actor_id=actor_id,
            session_id=session_id,
            allowed_tools=allowed_tools,
            permission_mode=permission_mode,
        )

        # Upload workspace files to S3
        uploaded_files = []
        if result.get("success"):
            try:
                uploaded_files = upload_workspace_files_to_s3(actor_id, session_id)
                if uploaded_files:
                    logger.info(f"Uploaded {len(uploaded_files)} files to S3")
            except Exception as e:
                logger.error(f"Failed to upload files to S3: {e}")

        # Build response
        response_data = {
            "success": result.get("success", False),
            "result": result.get("result", ""),
            "session_id": result.get("session_id") or session_id,
            "actor_id": actor_id,
            "timestamp": datetime.utcnow().isoformat(),
            "model": result.get("model", "sonnet"),
            "metadata": {
                "duration_ms": result.get("duration_ms"),
                "num_turns": result.get("num_turns"),
                "uploaded_files": uploaded_files if uploaded_files else None,
                "memory_enabled": memory_manager is not None,
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
