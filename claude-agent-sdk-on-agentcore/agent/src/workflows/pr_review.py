"""
PR review workflow orchestration.

Coordinates the entire PR review process using Strands planner-executor pattern.
"""

import logging
from strands import tool

from core.logging_setup import get_logger
from utils import update_workflow_status, delete_watchdog_schedule
from orchestration.orchestrator import get_pr_review_orchestrator

logger = get_logger(__name__)


@tool
def strands_pr_review_orchestrator(
    workflow_id: str,
    pr_number: int,
    repo_full_name: str,
    pr_url: str,
    pr_title: str,
    head_sha: str,
    github_token: str,
    aws_region: str
) -> str:
    """
    Orchestrate PR review using Strands planner-executor pattern.

    This replaces the monolithic claude_pr_review_tool.

    Args:
        workflow_id: Workflow ID for tracking
        pr_number: GitHub PR number
        repo_full_name: Repository full name (owner/repo)
        pr_url: GitHub PR URL
        pr_title: PR title
        head_sha: PR head commit SHA
        github_token: GitHub API token
        aws_region: AWS region

    Returns:
        Status message indicating review completion
    """
    logger.info("=" * 80)
    logger.info(f"[ORCHESTRATOR] Starting planner-executor review for {repo_full_name}#{pr_number}")
    logger.info(f"[ORCHESTRATOR] Workflow ID: {workflow_id}")
    logger.info("=" * 80)

    # Get the orchestrator instance
    pr_review_orchestrator = get_pr_review_orchestrator()

    try:
        # Call Strands orchestrator
        logger.info(f"[ORCHESTRATOR] Calling pr_review_orchestrator...")
        logger.info(f"[ORCHESTRATOR] Using SlidingWindowConversationManager (window_size=10)")
        result = pr_review_orchestrator(
            f"""Review PR {repo_full_name}#{pr_number} using planner-executor pattern.

PR Context:
- Title: {pr_title}
- URL: {pr_url}
- Head SHA: {head_sha}
- PR Number: {pr_number}
- Repository: {repo_full_name}

Use the tools provided to:
1. Create a plan using planner_agent_tool
2. Execute each step using executor_agent_tool
3. Return final result

IMPORTANT: Pass the github_token and aws_region to the tools:
- github_token: {github_token}
- aws_region: {aws_region}
"""
        )
        logger.info(f"[ORCHESTRATOR] pr_review_orchestrator returned successfully")
        logger.info(f"[ORCHESTRATOR] Result: {str(result)[:200]}...")

        logger.info("=" * 80)
        logger.info(f"[ORCHESTRATOR] Review complete for {repo_full_name}#{pr_number}")
        logger.info("=" * 80)

        # Update workflow status
        update_workflow_status(workflow_id, 'COMPLETED')
        delete_watchdog_schedule(workflow_id)

        return f"PR review completed successfully using planner-executor pattern for {repo_full_name}#{pr_number}"

    except Exception as e:
        error_msg = f"PR review failed: {str(e)}"
        logger.error("=" * 80)
        logger.error(f"[ORCHESTRATOR ERROR] {error_msg}", exc_info=True)
        logger.error("=" * 80)
        update_workflow_status(workflow_id, 'FAILED', error_message=error_msg)
        return error_msg
