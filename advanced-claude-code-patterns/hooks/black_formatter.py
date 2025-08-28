#!/usr/bin/env python3
"""
Auto-format Python files with Black after edits.
Non-blocking - continues even if formatting fails.
"""

import json
import sys
import subprocess
import shutil
from pathlib import Path

def is_python_file(file_path):
    """Check if the file is a Python file."""
    if not file_path:
        return False
    
    path = Path(file_path)
    return path.suffix in ['.py', '.pyi', '.pyx']

def check_black_available():
    """Check if Black is available and provide installation guidance if not."""
    # Check if black is available via different methods
    black_commands = ['black', 'uvx black', 'python -m black', 'python3 -m black']
    
    for cmd in black_commands:
        try:
            result = subprocess.run(
                cmd.split() + ['--version'],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                return True, cmd.split()[0] if cmd.startswith('black') else cmd
        except (FileNotFoundError, subprocess.TimeoutExpired):
            continue
    
    return False, None

def print_black_installation_guide():
    """Print helpful installation instructions for Black."""
    print("""
⚠️  Black not found - Python code formatting disabled

To enable automatic Python formatting, install Black:

  # Option 1: Using UV (recommended)
  uv tool install black
  # or for one-time use: uvx black .

  # Option 2: Using pip
  pip install black

  # Option 3: System package manager
  # Ubuntu/Debian: sudo apt install python3-black
  # macOS: brew install black

After installation, Python files will be automatically formatted on save.
""", file=sys.stderr)

def format_with_black(file_path):
    """Format the file with Black."""
    try:
        available, black_cmd = check_black_available()
        if not available:
            # Only show installation guide once per session
            if not hasattr(format_with_black, '_guide_shown'):
                print_black_installation_guide()
                format_with_black._guide_shown = True
            return
        
        # Use the available black command
        cmd = black_cmd.split() if ' ' in black_cmd else [black_cmd]
        result = subprocess.run(
            cmd + [file_path, '--quiet'],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0:
            print(f"✅ Formatted {file_path} with {black_cmd}", file=sys.stderr)
        elif result.stderr:
            print(f"⚠️  Black formatting issue: {result.stderr}", file=sys.stderr)
            
    except subprocess.TimeoutExpired:
        print(f"⚠️  Black formatting timed out for {file_path}", file=sys.stderr)
    except Exception as e:
        print(f"⚠️  Black formatting error: {e}", file=sys.stderr)

def main():
    try:
        # Read Claude Code hook input from stdin
        input_data = json.load(sys.stdin)
        
        tool_name = input_data.get('tool_name', '')
        tool_input = input_data.get('tool_input', {})
        
        # Only process file editing operations
        if tool_name not in ['Edit', 'Write', 'MultiEdit']:
            sys.exit(0)
        
        file_path = tool_input.get('file_path', '')
        
        # Only format Python files
        if not is_python_file(file_path):
            sys.exit(0)
        
        # Format the file (non-blocking)
        format_with_black(file_path)
        
        # Always exit successfully (non-blocking)
        sys.exit(0)
        
    except Exception:
        # Don't block on any errors
        sys.exit(0)

if __name__ == "__main__":
    main()