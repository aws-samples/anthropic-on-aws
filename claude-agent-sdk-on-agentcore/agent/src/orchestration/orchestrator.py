"""
Strands orchestrator for GitHub PR review coordination.

Creates and manages the planner-executor orchestrator Agent.
"""

from strands import Agent
from strands.agent.conversation_manager.sliding_window_conversation_manager import SlidingWindowConversationManager

from orchestration.planner import planner_agent_tool
from orchestration.executor import executor_agent_tool


# Singleton instance
_pr_review_orchestrator = None


def create_pr_review_orchestrator() -> Agent:
    """
    Create the PR review orchestrator Agent.

    Returns:
        Configured Strands Agent that coordinates planner and executor
    """
    # Create conversation manager to limit orchestrator's context window
    # This prevents MaxTokensReachedException by automatically removing oldest messages
    pr_review_conversation_manager = SlidingWindowConversationManager(
        window_size=10,  # Keep only 10 most recent messages (5 tool call/result pairs)
        should_truncate_results=True  # Truncate large tool results
    )

    # Create Strands planner-executor orchestrator
    # This agent coordinates the planner and executor agents
    orchestrator = Agent(
        system_prompt="""
You coordinate PR code reviews using the planner-executor pattern.

## Your Process:
1. Call planner_agent_tool to create a step-by-step plan
2. Parse the plan JSON to extract steps
3. For each step in the plan (in order):
   - Call executor_agent_tool with the step description
   - Collect the result summary (not full output)
   - Pass step number to next step
4. After all steps complete, return "Review complete"

## Context Management:
- You have limited conversation history (10 messages)
- Do NOT pass full tool results between steps
- Pass only step numbers and summaries
- Each executor tool has full context access via previous_results parameter

## Important:
- Each Claude Agent SDK call is focused on ONE thing
- Execute steps sequentially (each depends on previous)
- The planner returns JSON, parse it carefully
- After executing all plan steps, return immediately
""",
        tools=[planner_agent_tool, executor_agent_tool],
        conversation_manager=pr_review_conversation_manager
    )

    return orchestrator


def get_pr_review_orchestrator() -> Agent:
    """
    Get the singleton PR review orchestrator instance.

    Returns:
        Configured Strands Agent that coordinates planner and executor
    """
    global _pr_review_orchestrator

    if _pr_review_orchestrator is None:
        _pr_review_orchestrator = create_pr_review_orchestrator()

    return _pr_review_orchestrator
