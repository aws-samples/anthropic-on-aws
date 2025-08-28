#!/usr/bin/env python3
"""
Intercept pip/pip3 commands and suggest UV equivalents.
Similar to how Bun is preferred over npm in JavaScript ecosystems.
"""

import json
import sys
import os
from datetime import datetime
from pathlib import Path

# Mapping of pip commands to UV equivalents
PIP_TO_UV_MAP = {
    'pip install': 'uv pip install',
    'pip3 install': 'uv pip install',
    'pip uninstall': 'uv pip uninstall',
    'pip3 uninstall': 'uv pip uninstall',
    'pip freeze': 'uv pip freeze',
    'pip3 freeze': 'uv pip freeze',
    'pip list': 'uv pip list',
    'pip3 list': 'uv pip list',
    'pip show': 'uv pip show',
    'pip3 show': 'uv pip show',
    'python -m pip': 'uv pip',
    'python3 -m pip': 'uv pip',
    'python -m venv': 'uv venv',
    'python3 -m venv': 'uv venv',
}

def should_use_uv(command):
    """Check if command should be replaced with UV."""
    if not command:
        return False, None
    
    command_lower = command.lower()
    
    for pip_cmd, uv_cmd in PIP_TO_UV_MAP.items():
        if pip_cmd in command_lower:
            # Replace the pip command with UV equivalent
            suggested = command_lower.replace(pip_cmd, uv_cmd)
            return True, suggested
    
    return False, None

def log_replacement(original_cmd, suggested_cmd, session_id):
    """Log the command replacement for tracking."""
    try:
        claude_dir = Path('.claude')
        claude_dir.mkdir(exist_ok=True)
        
        log_file = claude_dir / 'uv_enforcement.json'
        
        # Load existing logs or create new list
        if log_file.exists():
            with open(log_file, 'r') as f:
                logs = json.load(f)
        else:
            logs = []
        
        # Add new log entry
        logs.append({
            'timestamp': datetime.now().isoformat(),
            'session_id': session_id,
            'hook_event': 'PreToolUse',
            'tool_name': 'Bash',
            'original_command': original_cmd,
            'suggested_command': suggested_cmd,
            'action': 'blocked_and_corrected'
        })
        
        # Save updated logs
        with open(log_file, 'w') as f:
            json.dump(logs, f, indent=2)
    except Exception as e:
        # Don't fail the hook if logging fails
        pass

def main():
    try:
        # Read input from stdin using official Claude Code hook input schema
        input_data = json.load(sys.stdin)
        
        tool_name = input_data.get('tool_name', '')
        session_id = input_data.get('session_id', 'unknown')
        tool_input = input_data.get('tool_input', {})
        
        # Only process Bash commands
        if tool_name != 'Bash':
            sys.exit(0)
        
        command = tool_input.get('command', '')
        
        # Check if we should suggest UV
        should_replace, suggested_cmd = should_use_uv(command)
        
        if should_replace:
            # Log the replacement
            log_replacement(command, suggested_cmd, session_id)
            
            # Print error message to stderr for Claude to see
            error_msg = f"""
⚠️  Please use UV instead of pip for better performance and reliability.

Original command: {command}
Suggested command: {suggested_cmd}

UV is faster and more reliable than pip. To install UV:
  curl -LsSf https://astral.sh/uv/install.sh | sh

Run the suggested command instead.
"""
            print(error_msg, file=sys.stderr)

            # Exit with code 2 to signal Claude should correct the command
            sys.exit(2)

        # Command is OK, exit successfully
        sys.exit(0)

    except json.JSONDecodeError as e:
        # If we can't parse JSON, just allow the command
        sys.exit(0)
    except Exception as e:
        # On any other error, allow the command to proceed
        sys.exit(0)

if __name__ == "__main__":
    main()