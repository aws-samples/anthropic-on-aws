"""
Planner agent for GitHub PR review orchestration.

Creates step-by-step review plans using Claude Agent SDK.
"""

import asyncio
import logging
from strands import tool
from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions, AssistantMessage, TextBlock

from core.logging_setup import get_logger

logger = get_logger(__name__)


@tool
def planner_agent_tool(
    pr_number: int,
    repo_full_name: str,
    pr_title: str,
    github_token: str,
    aws_region: str
) -> str:
    """
    Create a step-by-step plan for PR review using Claude Agent SDK.

    This is a FOCUSED Claude Agent SDK task - it ONLY creates a plan.

    Args:
        pr_number: GitHub PR number
        repo_full_name: Repository full name (owner/repo)
        pr_title: PR title
        github_token: GitHub API token
        aws_region: AWS region

    Returns:
        JSON string with plan steps, e.g.:
        [
            {"step": 1, "description": "Fetch PR diff using gh CLI", "tools": ["Bash"]},
            {"step": 2, "description": "Analyze for security vulnerabilities", "tools": ["Read"]},
            {"step": 3, "description": "Analyze code quality", "tools": ["Read"]},
            {"step": 4, "description": "Format review and post to GitHub", "tools": ["Bash"]}
        ]
    """
    logger.info("=" * 80)
    logger.info(f"[PLANNER] Creating review plan for {repo_full_name}#{pr_number}")
    logger.info("=" * 80)

    prompt = f"""
You are a code review planner. Your ONLY task is to create a detailed step-by-step plan.

## PR Context
- Repository: {repo_full_name}
- PR Number: #{pr_number}
- PR Title: {pr_title}

## Your Task
Create a JSON array of steps for reviewing this PR. Each step should be:
- Discrete and focused on ONE thing
- Executable by a separate agent
- Include which tools are needed

## Output Format
Output ONLY valid JSON (no markdown, no explanation):
[
    {{"step": 1, "description": "Fetch PR diff using gh CLI", "tools": ["Bash"]}},
    {{"step": 2, "description": "Analyze for security vulnerabilities", "tools": ["Read"]}},
    {{"step": 3, "description": "Analyze code quality and best practices", "tools": ["Read"]}},
    {{"step": 4, "description": "Format review and post to GitHub", "tools": ["Bash"]}}
]

## Available Tools
- Bash: For gh CLI commands
- Read: For reading files and diffs
- Grep: For searching code
- Write/Edit: For creating files (if needed)

Read the skill file at .claude/skills/code-review/SKILL.md to understand the review process,
then create a plan that follows that process.
"""

    options = ClaudeAgentOptions(
        model='global.anthropic.claude-sonnet-4-5-20250929-v1:0',
        system_prompt={'type': 'preset', 'preset': 'claude_code'},
        allowed_tools=["Read"],  # Planner only needs to read skill files
        max_turns=10,
        cwd='/app',
        env={
            'CLAUDE_CODE_USE_BEDROCK': '1',
            'AWS_REGION': aws_region,
        }
    )

    # Execute planning task
    async def run_planner():
        async with ClaudeSDKClient(options=options) as client:
            await client.query(prompt)

            plan_output = []
            async for message in client.receive_response():
                if isinstance(message, AssistantMessage):
                    for block in message.content:
                        if isinstance(block, TextBlock):
                            plan_output.append(block.text)

            return "\n".join(plan_output)

    plan = asyncio.run(run_planner())
    logger.info(f"[PLANNER] Plan created with {len(plan)} characters")
    logger.info(f"[PLANNER] Plan preview: {plan[:200]}...")
    logger.info("=" * 80)
    return plan
