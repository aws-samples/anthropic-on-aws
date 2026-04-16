"""
Security hooks for Claude Agent SDK.

Provides PreToolUse hooks for validating tool execution with allowlist approach.
"""

import logging

logger = logging.getLogger(__name__)


async def bash_security_hook(input_data: dict, tool_use_id: str = None, context: dict = None) -> dict:
    """
    PreToolUse hook for Claude Agent SDK - validates bash commands.
    Based on Anthropic's official riv2025-long-horizon-coding-agent-demo pattern.

    Returns empty dict to allow, or hookSpecificOutput dict to deny.

    Args:
        input_data: Contains 'tool_name' and 'tool_input' with command details
        tool_use_id: Optional tool execution ID
        context: Optional context data

    Returns:
        dict: Empty to allow, or {hookSpecificOutput: {permissionDecision: "deny"}} to block
    """
    tool_name = input_data.get('tool_name', '')
    tool_input = input_data.get('tool_input', {})

    # Only validate Bash commands
    if tool_name != 'Bash':
        return {}  # Allow all non-Bash tools

    command = tool_input.get('command', '')

    # Allow gh CLI commands
    if command.strip().startswith('gh '):
        logger.info(f"[PERMISSION] ✅ Allowing gh command: {command[:80]}...")
        return {}  # Empty dict = allow

    # Deny all other bash commands
    logger.warning(f"[PERMISSION] ❌ Denying non-gh bash command: {command[:80]}...")
    return {
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": f"Only gh CLI commands are allowed. Command '{command}' denied for security."
        }
    }
