"""
FastAPI route handlers for GitHub PR Review Agent.

Provides /invocations and /ping endpoints for AgentCore Runtime.
"""

import json
import logging
import boto3
from fastapi import HTTPException, BackgroundTasks

from api.models import InvocationRequest, InvocationResponse
from core.config import get_aws_region, get_github_secret_arn
from core.logging_setup import get_logger
from utils import update_workflow_status

logger = get_logger(__name__)


def extract_pr_context(request: InvocationRequest) -> dict:
    """
    Extract PR context from invocation request.

    Supports both nested (input.field) and flat (field) payload formats.

    Args:
        request: InvocationRequest with PR data

    Returns:
        Dictionary with extracted PR context fields
    """
    payload = request.input if request.input else request.model_dump()

    return {
        'pr_number': payload.get('pr_number') or request.pr_number,
        'repo_full_name': payload.get('repo_full_name') or request.repo_full_name,
        'pr_url': payload.get('pr_url', '') or request.pr_url or '',
        'pr_title': payload.get('pr_title', 'Untitled') or request.pr_title or 'Untitled',
        'pr_body': payload.get('pr_body', '') or request.pr_body or '',
        'head_sha': payload.get('head_sha', '') or request.head_sha or '',
        'diff_url': payload.get('diff_url', '') or request.diff_url or '',
        'workflow_id': payload.get('workflow_id')
    }


def retrieve_github_token() -> str:
    """
    Retrieve GitHub token from AWS Secrets Manager.

    Returns:
        GitHub token string

    Raises:
        HTTPException: If token retrieval fails or token not found
    """
    github_secret_arn = get_github_secret_arn()

    logger.info("[AUTH] Retrieving GitHub token from Secrets Manager...")

    if not github_secret_arn:
        error_msg = "GITHUB_SECRET_ARN not set in environment"
        logger.error(f"[AUTH] ✗ {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)

    try:
        aws_region = get_aws_region()
        secrets_client = boto3.client('secretsmanager', region_name=aws_region)
        secret_response = secrets_client.get_secret_value(SecretId=github_secret_arn)
        secret_data = json.loads(secret_response['SecretString'])
        github_token = secret_data.get('github_token', '')

        if not github_token:
            error_msg = "GitHub token not found in Secrets Manager"
            logger.error(f"[AUTH] ✗ {error_msg}")
            raise HTTPException(status_code=500, detail=error_msg)

        logger.info("[AUTH] ✓ Successfully retrieved GitHub token")
        return github_token

    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"Failed to retrieve GitHub token: {str(e)}"
        logger.error(f"[AUTH] ✗ {error_msg}", exc_info=True)
        raise HTTPException(status_code=500, detail=error_msg)


async def invoke(request: InvocationRequest, background_tasks: BackgroundTasks,
                 workflow_func) -> InvocationResponse:
    """
    AgentCore Runtime invocation entrypoint.

    Starts PR review in background and returns immediately.
    The review continues via FastAPI BackgroundTasks.

    Args:
        request: InvocationRequest with PR data
        background_tasks: FastAPI BackgroundTasks
        workflow_func: The workflow orchestrator function to run in background

    Returns:
        InvocationResponse with workflow status
    """
    logger.info("=" * 80)
    logger.info("[START] AgentCore Runtime invocation received")
    logger.info(f"Request: {request.model_dump()}")
    logger.info("=" * 80)

    try:
        # Extract PR context from payload (FAST - keep this)
        pr_context = extract_pr_context(request)

        pr_number = pr_context['pr_number']
        repo_full_name = pr_context['repo_full_name']
        pr_url = pr_context['pr_url']
        pr_title = pr_context['pr_title']
        head_sha = pr_context['head_sha']
        workflow_id = pr_context['workflow_id']

        logger.info(f"[CONTEXT] PR: {repo_full_name}#{pr_number}")
        logger.info(f"[CONTEXT] Title: {pr_title}")
        logger.info(f"[CONTEXT] URL: {pr_url}")
        logger.info(f"[CONTEXT] Workflow ID: {workflow_id}")

        # Validate required fields
        if not pr_number or not repo_full_name:
            error_msg = "Missing required fields: pr_number and repo_full_name are required"
            logger.error(error_msg)
            raise HTTPException(status_code=400, detail=error_msg)

        # Get GitHub token from Secrets Manager (FAST - <1 second)
        github_token = retrieve_github_token()
        aws_region = get_aws_region()

        logger.info("=" * 80)
        logger.info(f"[BACKGROUND] Starting async PR review for {repo_full_name}#{pr_number}")
        logger.info(f"[BACKGROUND] Using Strands planner-executor pattern with FastAPI BackgroundTasks")
        logger.info("=" * 80)

        # Add PR review to background tasks using Strands planner-executor orchestrator
        background_tasks.add_task(
            workflow_func,
            workflow_id=workflow_id,
            pr_number=pr_number,
            repo_full_name=repo_full_name,
            pr_url=pr_url,
            pr_title=pr_title,
            head_sha=head_sha,
            github_token=github_token,
            aws_region=aws_region
        )

        # Return immediately (FAST - total <2 seconds)
        logger.info("=" * 80)
        logger.info(f"[RESPONSE] Returning HTTP 200 - review started in background")
        logger.info(f"[RESPONSE] Workflow ID: {workflow_id}")
        logger.info("=" * 80)

        return InvocationResponse(
            output={
                'status': 'background_task_started',
                'workflow_id': workflow_id,
                'pr_number': pr_number,
                'repo_full_name': repo_full_name,
                'pr_url': pr_url,
                'message': f'PR review started in background for {repo_full_name}#{pr_number}'
            }
        )

    except HTTPException:
        # Re-raise HTTPExceptions as-is
        raise
    except Exception as e:
        error_msg = f"Agent execution failed: {str(e)}"
        logger.error("=" * 80)
        logger.error(f"[ERROR] {error_msg}")
        logger.error(f"[ERROR] Exception type: {type(e).__name__}")
        logger.error("=" * 80)
        logger.error("[ERROR] Full traceback:", exc_info=True)

        # Update workflow status to FAILED
        try:
            pr_context = extract_pr_context(request)
            workflow_id = pr_context['workflow_id']
            if workflow_id:
                update_workflow_status(workflow_id, 'FAILED', error_message=error_msg)
        except Exception as status_error:
            logger.error(f"Failed to update workflow status on error: {status_error}")

        raise HTTPException(status_code=500, detail=error_msg)


async def ping():
    """Health check endpoint"""
    return {"status": "healthy", "service": "github-pr-review-agent"}


def register_routes(app, workflow_func):
    """
    Register API routes with FastAPI app.

    Args:
        app: FastAPI application instance
        workflow_func: The workflow orchestrator function to use for PR reviews
    """
    @app.post("/invocations", response_model=InvocationResponse)
    async def invocations_endpoint(request: InvocationRequest, background_tasks: BackgroundTasks):
        return await invoke(request, background_tasks, workflow_func)

    @app.get("/ping")
    async def ping_endpoint():
        return await ping()
