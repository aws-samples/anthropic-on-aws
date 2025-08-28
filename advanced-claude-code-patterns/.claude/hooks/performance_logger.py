#!/usr/bin/env python3
"""
Performance monitoring hook for Claude Code operations.
Logs timing and usage information for analysis.
"""

import json
import sys
import time
from pathlib import Path

def main():
    try:
        # Read Claude Code hook input from stdin
        input_data = json.load(sys.stdin)
        
        hook_event = input_data.get('hook_event_name', '')
        tool_name = input_data.get('tool_name', 'unknown')
        session_id = input_data.get('session_id', 'unknown')
        tool_input = input_data.get('tool_input', {})
        
        # Create performance log entry
        log_entry = {
            'timestamp': time.time(),
            'session_id': session_id,
            'hook_event': hook_event,
            'tool_name': tool_name,
        }
        
        # Add tool-specific metrics
        if tool_name == 'Read':
            file_path = tool_input.get('file_path', '')
            log_entry['file_path'] = file_path
            if Path(file_path).exists():
                log_entry['file_size'] = Path(file_path).stat().st_size
        elif tool_name == 'Bash':
            command = tool_input.get('command', '')
            log_entry['command_length'] = len(command)
        elif tool_name in ['Edit', 'Write', 'MultiEdit']:
            file_path = tool_input.get('file_path', '')
            content = tool_input.get('content', '')
            log_entry['file_path'] = file_path
            log_entry['content_length'] = len(content)
            
        # Ensure .claude directory exists
        claude_dir = Path('.claude')
        claude_dir.mkdir(exist_ok=True)
        
        # Log file path
        log_file = claude_dir / 'performance.json'
        
        # Load existing logs
        if log_file.exists():
            with open(log_file, 'r') as f:
                logs = json.load(f)
        else:
            logs = []
            
        # Append new entry
        logs.append(log_entry)
        
        # Keep only last 1000 entries
        logs = logs[-1000:]
        
        # Save updated logs
        with open(log_file, 'w') as f:
            json.dump(logs, f, indent=2)
            
        # Success
        sys.exit(0)
        
    except Exception as e:
        # Don't fail the hook for performance logging issues
        sys.exit(0)

if __name__ == "__main__":
    main()