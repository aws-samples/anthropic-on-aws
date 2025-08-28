#!/usr/bin/env python3
"""
Log tool usage for audit and debugging purposes.
"""

import fcntl
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

def load_logs_safely(log_file):
    """Load logs with corruption recovery."""
    if not log_file.exists():
        return []
    
    try:
        with log_file.open() as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        # Try to recover from corruption
        print(f"Warning: Log file corrupted, attempting recovery: {e}", file=sys.stderr)
        try:
            with log_file.open() as f:
                content = f.read()
            
            # Try to find the last complete JSON array
            if content.strip().startswith('['):
                # Find last complete entry by looking for '}' followed by optional whitespace and ']'
                matches = list(re.finditer(r'}\s*(?:,\s*)?\]\s*$', content, re.MULTILINE))
                if matches:
                    # Take content up to and including the last match
                    end_pos = matches[-1].end()
                    fixed_content = content[:end_pos]
                    return json.loads(fixed_content)
            
            # If that fails, start fresh
            print("Warning: Could not recover log file, starting fresh", file=sys.stderr)
            return []
            
        except Exception:
            print("Warning: Log recovery failed, starting fresh", file=sys.stderr)
            return []

def save_logs_safely(log_file, logs):
    """Save logs with atomic write to prevent corruption."""
    temp_file = log_file.with_suffix('.tmp')
    
    try:
        # Write to temporary file first
        with temp_file.open('w') as f:
            # Add file locking to prevent concurrent access
            fcntl.flock(f.fileno(), fcntl.LOCK_EX)
            json.dump(logs, f, indent=2)
            f.flush()  # Ensure data is written
            
        # Atomic rename (only on Unix-like systems)
        temp_file.replace(log_file)
        
    except Exception as e:
        # Clean up temp file if it exists
        if temp_file.exists():
            temp_file.unlink()
        raise e

def main():
    try:
        # Read input from stdin - handle potential multiple JSON objects
        stdin_content = sys.stdin.read().strip()
        
        # Split by newlines and try to parse each as JSON
        lines = stdin_content.split('\n')
        input_data = None
        
        for line in lines:
            line = line.strip()
            if line:
                try:
                    input_data = json.loads(line)
                    break  # Use the first valid JSON object
                except json.JSONDecodeError:
                    continue
        
        if input_data is None:
            # Try parsing the entire content as one JSON object
            input_data = json.loads(stdin_content)
        
        # Extract relevant information using official Claude Code hook input schema
        tool_name = input_data.get('tool_name', 'unknown')
        session_id = input_data.get('session_id', 'unknown')
        tool_input = input_data.get('tool_input', {})
        hook_event_name = input_data.get('hook_event_name', 'unknown')
        
        # Create log entry
        log_entry = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'session_id': session_id,
            'hook_event': hook_event_name,
            'tool': tool_name,
            'data': {}
        }
        
        # Add tool-specific data from tool_input
        if tool_name == 'Bash':
            log_entry['data']['command'] = tool_input.get('command', '')
            log_entry['data']['description'] = tool_input.get('description', '')
        elif tool_name in ['Edit', 'Write', 'MultiEdit']:
            log_entry['data']['file_path'] = tool_input.get('file_path', '')
            if 'content' in tool_input:
                log_entry['data']['content_length'] = len(str(tool_input.get('content', '')))
        elif tool_name in ['Read', 'Grep', 'Glob']:
            if tool_name == 'Read':
                log_entry['data']['file_path'] = tool_input.get('file_path', '')
            elif tool_name in ['Grep', 'Glob']:
                log_entry['data']['pattern'] = tool_input.get('pattern', '')
                log_entry['data']['path'] = tool_input.get('path', '')
        
        # Ensure .claude directory exists
        claude_dir = Path('.claude')
        claude_dir.mkdir(exist_ok=True)
        
        # Log file path - use session-specific naming for better organization
        log_file = claude_dir / f'tool_usage_{session_id[:8]}.json'
        
        # Load existing logs with corruption recovery
        logs = load_logs_safely(log_file)
        
        # Append new log entry
        logs.append(log_entry)
        
        # Save updated logs atomically
        save_logs_safely(log_file, logs)
        
        # Exit successfully (non-blocking for logging)
        sys.exit(0)
        
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON input: {e}", file=sys.stderr)
        print(f"Input received: {stdin_content[:200]}...", file=sys.stderr)
        sys.exit(1)  # Non-blocking error for logging
    except Exception as e:
        print(f"Unexpected error in log_tool_use.py: {e}", file=sys.stderr)
        sys.exit(1)  # Non-blocking error for logging


if __name__ == "__main__":
    main()
