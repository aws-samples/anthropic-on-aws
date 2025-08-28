# Hooks Implementation Guide

Complete guide to implementing lifecycle hooks for automated actions and quality control in Claude Code.

## ⚠️ Security Warning

**CRITICAL**: Claude Code hooks execute arbitrary shell commands on your system automatically. 
- Hooks can modify, delete, or access any files your user account can access
- Malicious or poorly written hooks can cause data loss or system damage
- Always validate hook commands before enabling them
- Never run hooks from untrusted sources without reviewing them first

## Table of Contents
1. [Understanding Hooks](#understanding-hooks)
2. [Hook Events](#hook-events)
3. [Hook Configuration](#hook-configuration)
4. [Exit Codes and Behavior](#exit-codes-and-behavior)
5. [Common Hook Patterns](#common-hook-patterns)
6. [Settings File Organization](#settings-file-organization)
7. [Testing Hooks](#testing-hooks)
8. [Best Practices](#best-practices)

## Understanding Hooks

### What Are Hooks?

Hooks are user-defined shell commands that execute at specific points in Claude Code's lifecycle. They provide deterministic control over Claude Code's behavior, ensuring certain actions always happen rather than relying on the LLM to choose to run them.

### Why Use Hooks?

- **Automation**: Automatically format code, run linters, or update documentation
- **Quality Control**: Enforce code standards before modifications
- **Safety**: Prevent modifications to sensitive files or production configs
- **Consistency**: Ensure uniform practices across all Claude Code sessions
- **Logging**: Track all tool usage for compliance or debugging

## Hook Events

Claude Code supports the following hook events:

### PreToolUse
Executes before any tool is run. Can block tool execution with exit code 2.

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "python hooks/log_tool_use.py"
          }
        ]
      }
    ]
  }
}
```

### PostToolUse
Runs after a tool completes successfully.

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit",
        "hooks": [
          {
            "type": "command",
            "command": "black ${file_path} && git add ${file_path}"
          }
        ]
      }
    ]
  }
}
```

### UserPromptSubmit
Triggered when the user submits a prompt to Claude Code.

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo 'User prompt: ${prompt}' >> .claude/prompts.log"
          }
        ]
      }
    ]
  }
}
```

### Notification
Responds to system notifications.

```json
{
  "hooks": {
    "Notification": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Tool use completed successfully' >&2"
          }
        ]
      }
    ]
  }
}
```

### Stop
Executes when the main Claude agent finishes its response.

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo '✅ Task completed' >&2"
          }
        ]
      }
    ]
  }
}
```

### SubagentStop
Runs when a subagent completes its task.

```json
{
  "hooks": {
    "SubagentStop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Subagent ${agent_name} completed' >> .claude/agent.log"
          }
        ]
      }
    ]
  }
}
```

### PreCompact
Triggered before context compaction occurs.

```json
{
  "hooks": {
    "PreCompact": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Session ending, saving context' >&2"
          }
        ]
      }
    ]
  }
}
```

### SessionStart
Runs when a new Claude Code session begins.

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Session started' >&2"
          }
        ]
      }
    ]
  }
}
```

## Hook Configuration

### Basic Structure

Hooks are configured in settings files using this structure:

```json
{
  "hooks": {
    "EventName": [
      {
        "matcher": "ToolPattern",  // Optional: regex pattern for tool matching
        "hooks": [
          {
            "type": "command",
            "command": "your-command-here"
          }
        ]
      }
    ]
  }
}
```

### Tool Matchers

Use regex patterns to match specific tools:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",  // Matches file modification tools
        "hooks": [
          {
            "type": "command",
            "command": "python hooks/check_permissions.py ${file_path}"
          }
        ]
      },
      {
        "matcher": "Bash",  // Matches Bash commands
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Running: ${command}' >> commands.log"
          }
        ]
      }
    ]
  }
}
```

### Hook Input Format

Hooks receive JSON data via stdin containing session information and event-specific data:

```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/transcript.jsonl",
  "cwd": "/current/working/directory", 
  "hook_event_name": "PreToolUse",
  "tool_name": "Edit",
  "tool_input": {
    "file_path": "/path/to/file.txt",
    "content": "file content"
  }
}
```

### Environment Variables

Hooks have access to the `$CLAUDE_PROJECT_DIR` environment variable pointing to the project root directory.

## Exit Codes and Behavior

### Exit Code Meanings

| Exit Code | Behavior | Use Case |
|-----------|----------|----------|
| **0** | Success - Continue normally | Everything is OK |
| **1** | Non-blocking error - Show message, continue | Warnings or non-critical issues |
| **2** | Blocking error - Show message, Claude corrects | Issues Claude should fix |
| Other | Non-blocking error - Show message, continue | General failures |

For complete technical specifications, see [Hook Exit Codes Reference](./reference/hooks/exit-codes.md).

### Using Exit Code 2 for Corrections

Exit code 2 is special - it blocks the action and provides feedback to Claude to take corrective action:

```python
#!/usr/bin/env python3
import sys
import json

# Check for linting errors
if linting_errors:
    error_msg = f"""
❌ Linting errors found in {file_path}

Issues:
{format_errors(linting_errors)}

To fix, run:
  ruff check --fix {file_path}
"""
    print(error_msg, file=sys.stderr)
    sys.exit(2)  # Claude will see this and can run the fix

# Success
sys.exit(0)
```

## Common Hook Patterns

### Pattern 1: Auto-Formatting

Automatically format code after modifications:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "if [[ ${file_path} == *.py ]]; then black ${file_path}; fi"
          }
        ]
      }
    ]
  }
}
```

### Pattern 2: Enforce Tool Usage

Block certain tools and suggest alternatives:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "python hooks/use_uv.py"
          }
        ]
      }
    ]
  }
}
```

Python hook example (`hooks/use_uv.py`):
```python
#!/usr/bin/env python3
import sys
import os
import json

# Get the command from environment
command = os.environ.get('command', '')

# Check for pip/pip3 usage
if command.startswith(('pip ', 'pip3 ')):
    uv_command = command.replace('pip3', 'uv pip').replace('pip', 'uv pip')
    print(f"❌ Use UV instead of pip: {uv_command}", file=sys.stderr)
    sys.exit(2)  # Block and suggest correction

sys.exit(0)
```

### Pattern 3: Security Gates

Prevent modifications to sensitive files and validate Bash commands:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/hooks/security_check.py"
          }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/hooks/command_security_check.sh"
          }
        ]
      }
    ]
  }
}
```

The security hooks provide comprehensive protection:

**File Security (`security_check.py`):**
- Blocks writes to sensitive files (.env, .key, .pem, etc.)
- Scans content for potential secrets and API keys
- Validates file paths for directory traversal attempts
- Checks file permissions for security compliance
- Logs all security events for auditing

**Command Security (`command_security_check.sh`):**
- Blocks destructive commands (rm -rf /, chmod 777, etc.)
- Prevents suspicious download-and-execute patterns
- Warns about potentially dangerous operations
- Blocks sudo usage in hooks for security
- Validates network operations for safety

### Pattern 4: Logging and Auditing

Track all tool usage:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python hooks/log_tool_use.py"
          }
        ]
      }
    ]
  }
}
```

### Pattern 5: Test-Driven Development

Enforce writing tests before code:

```json
{
  "hooks": {
    "PreToolUse": [
    ]
  }
}
```

## Settings File Organization

### File Hierarchy and Precedence

Claude Code uses multiple settings files with clear precedence (highest to lowest):

1. **Enterprise Managed Settings** (if applicable)
   - Location varies by OS
   - Enforced by organization

2. **Command Line Arguments**
   - Overrides for specific sessions

3. **`.claude/settings.local.json`** (Project-specific personal settings)
   - Not committed to git
   - Personal preferences and API keys
   - Experimental configurations

4. **`.claude/settings.json`** (Project-specific team settings)
   - Committed to git
   - Shared team configurations
   - Project-wide hooks and permissions

5. **`~/.claude/settings.json`** (User global settings)
   - Applies to all projects
   - Personal defaults

### What Goes Where?

#### `.claude/settings.json` (Team Settings - Committed)
```json
{
  "version": "1.0.0",
  "project": {
    "name": "Project Name",
    "description": "Project description"
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit",
        "hooks": [
          {
            "type": "command",
            "command": "python hooks/python_lint.py"
          }
        ]
      }
    ]
  },
  "permissions": {
    "allow": ["Read", "Write", "Edit", "Bash"],
    "deny": ["Bash(rm -rf:*)"]
  },
  "environment": {
    "PROJECT_ENV": "production"
  }
}
```

#### `.claude/settings.local.json` (Personal Settings - Not Committed)
```json
{
  "environment": {
    "API_KEY": "your-personal-api-key"
  },
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Personal logging'"
          }
        ]
      }
    ]
  }
}
```

## Testing Hooks

### Manual Testing

Test hooks before deployment:

```bash
# Test a hook manually by simulating tool input
echo '{"tool": "Edit", "file_path": "test.py"}' | python hooks/python_lint.py
echo $?  # Check exit code (0=success, 2=blocking error)

# Test with environment variables
export file_path="test.py"
export command="pip install requests"
python hooks/use_uv.py
echo $?
```

### Unit Testing Hooks

```python
# tests/test_hooks.py
import subprocess
import json

def test_lint_hook_blocks_bad_code():
    """Test that lint hook blocks poorly formatted code."""
    # Create a test file with bad formatting
    with open('test_bad.py', 'w') as f:
        f.write('x=1+2')  # No spaces around operators
    
    # Run the hook
    result = subprocess.run(
        ['python', 'hooks/python_lint.py'],
        env={'file_path': 'test_bad.py'},
        capture_output=True
    )
    
    # Should exit with code 2 (blocking error)
    assert result.returncode == 2
    assert 'Linting errors' in result.stderr.decode()
```

### Integration Testing

```bash
#!/bin/bash
# Test hook in actual Claude Code environment

# Create test project
mkdir test-project
cd test-project
mkdir .claude

# Add hook configuration
cat > .claude/settings.json << 'EOF'
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Hook triggered' >> hook.log"
          }
        ]
      }
    ]
  }
}
EOF

# Use Claude Code to edit a file
# The hook should create hook.log with "Hook triggered"
```

## Best Practices

### 1. Keep Hooks Fast

Hooks run synchronously and can slow down Claude Code:

```python
# Good: Quick validation
import sys
if not file_path.endswith('.py'):
    sys.exit(0)  # Skip non-Python files quickly

# Bad: Slow operations
subprocess.run(['pytest', '--cov'])  # Could take minutes
```

### 2. Provide Clear, Actionable Feedback

When using exit code 2, tell Claude exactly what to do:

```python
# Good: Specific instructions
print(f"""
❌ Import sorting needed in {file_path}

Run this command to fix:
  isort {file_path}
""", file=sys.stderr)
sys.exit(2)

# Bad: Vague error
print("Error in file", file=sys.stderr)
sys.exit(2)
```

### 3. Handle Errors Gracefully

Don't let hook failures crash Claude Code:

```python
try:
    # Hook logic
    result = check_file(file_path)
except Exception as e:
    # Log error but don't block
    print(f"Hook warning: {e}", file=sys.stderr)
    sys.exit(0)  # Continue despite hook error
```

### 4. Use Appropriate Exit Codes

```python
# Exit code 0: Success or non-critical
if warning_only:
    print(f"Warning: {message}", file=sys.stderr)
    sys.exit(0)  # Continue

# Exit code 2: Claude should fix this
if fixable_error:
    print(f"Error: {message}\nFix: {fix_command}", file=sys.stderr)
    sys.exit(2)  # Block and correct

# Exit code 1: Error but continue
if non_critical_error:
    print(f"Error: {message}", file=sys.stderr)
    sys.exit(1)  # Show error, continue
```

### 5. Security Considerations

- **Never** store secrets in hook configurations
- **Always** validate inputs in hooks
- **Use** absolute paths to prevent directory traversal
- **Limit** hook permissions using system controls
- **Audit** hook executions with logging
- **Review** hooks from external sources before using

### 6. Performance Optimization

- Run expensive checks asynchronously when possible
- Cache results to avoid repeated work
- Use incremental checks (only check changed files)
- Set appropriate timeouts for long-running commands

### 7. Documentation

Document your hooks clearly:

```python
#!/usr/bin/env python3
"""
Hook: python_lint.py
Purpose: Enforce Python code quality standards
Trigger: PreToolUse for Edit/Write on Python files
Exit codes:
  0 - File passes all checks
  2 - Linting errors found (Claude will fix)
Author: Your Team
Version: 1.0.0
"""
```

## Important Notes

1. **Hook Changes**: Direct edits to hooks in settings files don't take effect immediately. This prevents malicious hook modifications from affecting your current session.

2. **Debugging**: Use the `/hooks` command in Claude Code to interactively configure hooks.

3. **Order Matters**: Hooks execute in the order they're defined in the configuration.

4. **Inheritance**: Settings are merged across files, with more specific settings overriding broader ones.

## Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| Hook not triggering | Check event name and matcher pattern |
| Hook timing out | Add timeout handling or optimize the command |
| Hook failing silently | Add error logging to stderr |
| Settings not applied | Restart Claude Code session |
| Hook blocking everything | Check exit codes - use 0 for non-blocking |

## Example: Complete Hook Setup

Here's a complete example of a project with multiple hooks:

### `.claude/settings.json`
```json
{
  "version": "1.0.0",
  "project": {
    "name": "My Python Project",
    "description": "Production Python application"
  },
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Session started' >&2"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "python hooks/use_uv.py"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "python hooks/black_formatter.py ${file_path}"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo '✅ Task completed' >&2"
          }
        ]
      }
    ]
  },
  "permissions": {
    "allow": [
      "Read", "Write", "Edit", "MultiEdit",
      "Bash", "Grep", "Glob", "WebSearch"
    ],
    "deny": [
      "Bash(rm -rf:*)"
    ]
  }
}
```

## Next Steps

- Review [Hook Exit Codes Reference](./reference/hooks/exit-codes.md) for exit code best practices
- Explore example hooks in the [hooks directory](../hooks/)
- Learn about [Agents](./agents-guide.md) for intelligent automation
- Read [Best Practices](./best-practices.md) for production use

---

*For the latest information, see the [official Claude Code documentation](https://docs.anthropic.com/en/docs/claude-code/hooks).*