# Hook Configuration Reference

Technical specification for hook configuration in Claude Code.

## Configuration File Structure

```json
{
  "hooks": {
    "EventName": [
      {
        "matcher": "ToolPattern",
        "hooks": [
          {
            "type": "command",
            "command": "shell-command",
            "timeout": 60000
          }
        ]
      }
    ]
  }
}
```

## Field Specifications

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `matcher` | string | No | "*" | Tool pattern to match (regex) |
| `command` | string | Yes | - | Command to execute |
| `type` | string | Yes | "command" | Hook type (currently only "command") |
| `timeout` | number | No | 60000 | Timeout in milliseconds |

## Matcher Patterns

### Exact Tool Match
```json
{
  "matcher": "Edit"
}
```

### Multiple Tools (Regex)
```json
{
  "matcher": "Edit|Write|MultiEdit"
}
```

## Exit Codes

Hooks can control Claude Code's behavior using exit codes. See [Hook Exit Codes Reference](./exit-codes.md) for complete specifications.

### Match All Tools
```json
{
  "matcher": "*"
}
```

### Complex Patterns
```json
{
  "matcher": "Bash"
}
```

## File Hierarchy

| Location | Priority | Scope | Version Control |
|----------|----------|-------|-----------------|
| `~/.claude/settings.json` | 1 (lowest) | Global | No |
| `.claude/settings.json` | 2 (middle) | Project | Yes |
| `.claude/settings.local.json` | 3 (highest) | Local | No |

## Merge Behavior

Settings files are merged in priority order:

1. Global settings loaded first
2. Project settings override global
3. Local settings override all

Arrays are concatenated, objects are deep-merged.

### Merge Example

Global:
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "hooks": [
          {"type": "command", "command": "echo global"}
        ]
      }
    ]
  }
}
```

Project:
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "hooks": [
          {"type": "command", "command": "echo project"}
        ]
      }
    ]
  }
}
```

Result: Both hooks execute in order.

## Environment Variable Expansion

### Syntax
```json
{
  "command": "echo ${ENV_VAR}",
  "env": {
    "CUSTOM": "${HOME}/path"
  }
}
```

### Available Variables

| Variable | Description |
|----------|-------------|
| `$CLAUDE_PROJECT_DIR` | Project root directory |
| `$HOME` | User home directory |

## Command Execution

### Command Types

| Type | Example | Shell Required |
|------|---------|----------------|
| Simple | `"echo test"` | No |
| Pipeline | `"cat file | grep pattern"` | Yes |
| Script | `"./script.sh"` | No |
| Inline | `"python -c 'print()'"` | No |

### Shell Selection

| Platform | Default Shell | Override |
|----------|--------------|----------|
| Linux | `/bin/sh` | `"shell": "/bin/bash"` |
| macOS | `/bin/sh` | `"shell": "/bin/zsh"` |
| Windows | `cmd.exe` | `"shell": "powershell"` |

## Validation Rules

### Event Validation
- Must be valid event type
- Case-sensitive
- No wildcards

### Command Validation
- Non-empty string
- Executable must exist (for non-shell commands)
- Proper escaping for shell commands

### Tool Matcher Validation
- Tool name must be valid
- Path patterns use glob syntax
- Parameter paths use dot notation

### Timeout Validation
- Minimum: 100ms
- Maximum: 60000ms
- Must be positive integer

## Configuration Examples

### Minimal Configuration
```json
{
  "hooks": [
    {
      "event": "preToolUse",
      "command": "echo 'Tool use starting'"
    }
  ]
}
```

### Complete Configuration
```json
{
  "hooks": [
    {
      "event": "preToolUse",
      "command": "./validate.sh ${TOOL_NAME}",
      "blocking": true,
      "toolMatcher": {
        "tools": ["Edit", "Write"],
        "pathPattern": "*.py"
      },
      "env": {
        "VALIDATION_LEVEL": "strict",
        "LOG_FILE": "${HOME}/hooks.log"
      },
      "timeout": 10000,
      "workingDirectory": "${PROJECT_ROOT}",
      "shell": "/bin/bash",
      "continueOnError": false
    }
  ]
}
```

## Hook Arrays

Hooks are processed in array order:

```json
{
  "hooks": [
    {"event": "preToolUse", "command": "first"},
    {"event": "preToolUse", "command": "second"},
    {"event": "preToolUse", "command": "third"}
  ]
}
```

Execution: first → second → third

## Conditional Configuration

### By Environment
```json
{
  "command": "[ \"$NODE_ENV\" = \"production\" ] && npm test"
}
```

### By Tool
```json
{
  "toolMatcher": {
    "tool": "Bash",
    "parameterMatch": {
      "command": "rm*"
    }
  }
}
```

### By File Type
```json
{
  "toolMatcher": {
    "tool": "Edit",
    "pathPattern": "*.{js,ts,jsx,tsx}"
  }
}
```

## See Also

- [Hook Events](events.md)
- [Settings Reference](../configuration/settings.md)
- [Environment Variables](../configuration/environment.md)