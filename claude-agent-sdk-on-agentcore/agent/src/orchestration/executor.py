"""
Executor agent for GitHub PR review orchestration.

Executes individual review steps using Claude Agent SDK.
"""

import asyncio
import logging
from strands import tool
from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions, AssistantMessage, TextBlock
from claude_agent_sdk.types import HookMatcher

from core.logging_setup import get_logger
from utils import bash_security_hook

logger = get_logger(__name__)


@tool
def executor_agent_tool(
    step_number: int,
    step_description: str,
    previous_results: str,
    pr_number: int,
    repo_full_name: str,
    github_token: str,
    aws_region: str
) -> str:
    """
    Execute ONE step of the review plan using Claude Agent SDK.

    This is a FOCUSED Claude Agent SDK task - it executes only the specified step.

    Args:
        step_number: Which step this is (for logging)
        step_description: What to do in this step
        previous_results: Results from all previous steps (accumulated context)
        pr_number: GitHub PR number
        repo_full_name: Repository full name
        github_token: GitHub API token
        aws_region: AWS region

    Returns:
        Result of executing this step (string)
    """
    logger.info("=" * 80)
    logger.info(f"[EXECUTOR] Step {step_number}: {step_description[:80]}")
    logger.info("=" * 80)

    prompt = f"""
You are executing a single step in a PR review process.

## Your Task
Execute ONLY this step: {step_description}

## Context from Previous Steps
{previous_results if previous_results else "This is the first step."}

## PR Context
- Repository: {repo_full_name}
- PR Number: #{pr_number}

## Instructions
- Focus ONLY on this specific step
- Do NOT do anything beyond what this step describes
- Output the result of this step clearly
- If this step involves fetching data, return the data
- If this step involves analysis, return your findings
- If this step involves posting to GitHub, confirm completion

## IMPORTANT: Permissions
You have FULL AUTOMATED PERMISSION to run ALL gh CLI commands. You are running in an automated environment:
- ALL gh commands (gh pr diff, gh pr review, gh pr comment, gh api) are PRE-APPROVED
- NO user approval is needed - commands execute immediately
- You MUST proceed directly without asking for permission
- Security is handled by the infrastructure, not by prompts

Read the skill file at .claude/skills/code-review/SKILL.md for detailed instructions
on HOW to execute this step.
"""

    options = ClaudeAgentOptions(
        model='global.anthropic.claude-sonnet-4-5-20250929-v1:0',
        system_prompt={'type': 'preset', 'preset': 'claude_code'},
        allowed_tools=["Read", "Glob", "Grep", "Bash", "Write", "Edit"],  # Full toolset
        hooks={
            "PreToolUse": [
                HookMatcher(matcher="Bash", hooks=[bash_security_hook])
            ]
        },
        max_turns=20,
        cwd='/app',
        env={
            'CLAUDE_CODE_USE_BEDROCK': '1',
            'AWS_REGION': aws_region,
            'PR_NUMBER': str(pr_number),
            'REPO_FULL_NAME': repo_full_name,
            'GITHUB_TOKEN': github_token,
            'GH_TOKEN': github_token,
        }
    )

    # Execute step
    async def run_executor():
        async with ClaudeSDKClient(options=options) as client:
            await client.query(prompt)

            step_output = []
            async for message in client.receive_response():
                if isinstance(message, AssistantMessage):
                    for block in message.content:
                        if isinstance(block, TextBlock):
                            step_output.append(block.text)

            return "\n".join(step_output)

    result = asyncio.run(run_executor())
    logger.info(f"[EXECUTOR] Step {step_number} completed with {len(result)} characters")
    logger.info(f"[EXECUTOR] Result preview: {result[:200]}...")
    logger.info("=" * 80)
    return result
