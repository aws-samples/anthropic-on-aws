#!/usr/bin/env python3
"""
GitHub PR Review Agent for Amazon Bedrock AgentCore Runtime

HTTP server that processes PR review requests using Claude Agent SDK with Bedrock.

Architecture:
- FastAPI + Uvicorn HTTP server on port 8080
- Strands multi-agent orchestration (planner-executor pattern)
- Claude Agent SDK for LLM interactions via Bedrock
- Background task execution via FastAPI BackgroundTasks
"""

import os

from fastapi import FastAPI

# Core infrastructure
from core.config import setup_environment, get_aws_region, get_github_secret_arn
from core.logging_setup import setup_logging, get_logger

# Configure Claude Agent SDK to use Bedrock
setup_environment()

# API layer
from api.routes import register_routes

# Workflows
from workflows.pr_review import strands_pr_review_orchestrator

# Configure logging with immediate flush to stdout
# CRITICAL: AgentCore captures stdout and sends to CloudWatch
setup_logging()
logger = get_logger(__name__)

# Initialize FastAPI app
# This creates an HTTP server with /invocations and /ping endpoints
app = FastAPI(title="GitHub PR Review Agent", version="1.0.0")


# Register API routes with FastAPI app
# Routes: POST /invocations, GET /ping
register_routes(app, strands_pr_review_orchestrator)


if __name__ == "__main__":
    """
    Start the FastAPI HTTP server via Uvicorn

    This creates an HTTP server on port 8080 with:
    - POST /invocations - Main entrypoint (calls invoke() function)
    - GET /ping - Health check endpoint

    The server stays alive and processes requests until terminated.
    """
    import uvicorn

    logger.info("=" * 80)
    logger.info("[STARTUP] GitHub PR Review Agent for AgentCore Runtime")
    logger.info("[STARTUP] HTTP Server starting on port 8080...")
    logger.info("[STARTUP] Endpoints:")
    logger.info("[STARTUP]   POST /invocations - PR review invocation")
    logger.info("[STARTUP]   GET /ping - Health check")
    logger.info("[STARTUP] Mode: FastAPI + Uvicorn (HTTP server pattern)")
    logger.info("[STARTUP] Logging: stdout → CloudWatch (configured)")
    logger.info("[STARTUP] Environment:")
    logger.info(f"[STARTUP]   CLAUDE_CODE_USE_BEDROCK={os.environ.get('CLAUDE_CODE_USE_BEDROCK')}")
    logger.info(f"[STARTUP]   AWS_REGION={get_aws_region()}")
    logger.info(f"[STARTUP]   GITHUB_SECRET_ARN={'*' * 20 if get_github_secret_arn() else 'NOT SET'}")
    logger.info("=" * 80)

    # Start the HTTP server (blocks forever)
    logger.info("[STARTUP] Starting HTTP server (this will block)...")
    uvicorn.run(app, host="0.0.0.0", port=8080)
