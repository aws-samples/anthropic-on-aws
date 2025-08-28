# Hook Configuration Guide

🟡 **Difficulty**: Intermediate | **Time**: 20 minutes | **Prerequisites**: Understanding of hooks concept

## Understanding Hook Configurations in Claude Code

This guide explains how to configure hooks using JSON templates, the difference between configuration files and executable hooks, and how to implement both types effectively.

## Table of Contents
1. [Hook System Overview](#hook-system-overview)
2. [JSON Configurations vs Python Hooks](#json-configurations-vs-python-hooks)
3. [Hook Event Types](#hook-event-types)
4. [Using JSON Configuration Templates](#using-json-configuration-templates)
5. [Merging Configurations](#merging-configurations)
6. [Creating Custom Configurations](#creating-custom-configurations)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

## Hook System Overview

Claude Code's hook system provides two complementary approaches:

### 1. **JSON Configuration Files** (Declarative)
Define WHAT should happen and WHEN using configuration

### 2. **Python/Script Hooks** (Programmatic)
Implement HOW things happen with executable code

```
┌─────────────────────────────────────────┐
│         Claude Code Event               │
│    (PreCommit, PostEdit, OnError...)    │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│    Check .claude/settings.json          │
│     (JSON Configuration)                │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│   Execute Defined Actions:              │
│   • Run commands                        │
│   • Call Python scripts                 │
│   • Invoke agents                       │
└─────────────────────────────────────────┘
```

## JSON Configurations vs Python Hooks

### Understanding the Difference

| Aspect | JSON Configuration | Python Hook Script |
|--------|-------------------|-------------------|
| **Purpose** | Define hook triggers and actions | Implement complex logic |
| **Location** | `.claude/settings.json` | `.claude/hooks/*.py` |
| **Execution** | Claude reads and executes | Called by Claude or JSON config |
| **Flexibility** | Fixed commands/agents | Full programming logic |
| **Use When** | Simple commands, standard checks | Complex logic, conditionals |
| **Example** | Run `black --check .` on PreCommit | Analyze code and auto-fix issues |

### File Structure Example

```
.claude/
├── settings.json          # Active configuration (from JSON templates)
├── hooks/
│   ├── black_formatter.py # Executable hook script
│   ├── quality_gates.json # Configuration template (not active)
│   └── auto_recovery.json # Configuration template (not active)
```

**Important**: JSON files in `hooks/` directory are TEMPLATES. They must be copied/merged into `.claude/settings.json` to be active.

## Hook Event Types

### Complete Event Reference

| Event | Trigger | Common Use Cases |
|-------|---------|-----------------|
| **PreToolUse** | Before any tool execution | Validation, logging, permission checks |
| **PostToolUse** | After tool execution | Formatting, staging, notifications |
| **PreCommit** | Before git commit | Quality checks, tests, linting |
| **PostCommit** | After git commit | Notifications, documentation update |
| **PreDeploy** | Before deployment | Security scans, build validation |
| **PostDeploy** | After deployment | Status updates, release notes |
| **OnError** | When errors occur | Recovery, alerting, logging |
| **Start** | Session start | Setup, context loading |
| **Stop** | Session end | Cleanup, analytics |
| **UserPromptSubmit** | User sends message | Command interception, logging |
| **SubagentStart** | Subagent starts | Context preparation |
| **SubagentStop** | Subagent completes | Result processing |

### Event-Specific Variables

Each event provides context variables:

```json
{
  "PreToolUse": ["tool_name", "tool_args"],
  "PostToolUse": ["tool_name", "result", "exit_code"],
  "OnError": ["error", "file", "line"],
  "PreCommit": ["files", "message"],
  "Deploy": ["version", "environment", "branch"]
}
```

## Using JSON Configuration Templates

### Step 1: Choose a Template

Review available templates in `hooks/` directory:

```bash
ls hooks/*.json
```

- `quality_gates.json` - Code quality enforcement
- `auto_recovery.json` - Error recovery automation
- `notifications.json` - Team notifications
- `compliance.json` - Regulatory checks
- `security_gates.json` - Security validation
- `performance_monitor.json` - Performance tracking
- `example_settings.json` - Complete example

### Step 2: Copy to Settings

#### Option A: Use Entire Template
```bash
# Replace entire settings with template
cp hooks/quality_gates.json .claude/settings.json
```

#### Option B: Start Fresh with Example
```bash
# Use complete example as starting point
cp hooks/example_settings.json .claude/settings.json
```

### Step 3: Customize Values

Edit `.claude/settings.json` to customize:

```json
{
  "hooks": {
    "PreCommit": [
      {
        "type": "command",
        "command": "pytest tests/ --quiet",  // Customize test command
        "blocking": true,                     // Change to false for warning only
        "description": "Run test suite"
      }
    ]
  }
}
```

## Merging Configurations

### Manual Merge Process

When you want to combine multiple templates:

1. **Start with base configuration**:
```bash
cp hooks/example_settings.json .claude/settings.json
```

2. **Extract hooks from additional templates**:
```json
// From quality_gates.json, copy the PreCommit section
"PreCommit": [
  {
    "type": "command",
    "command": "black --check .",
    "blocking": true,
    "description": "Check Python formatting"
  }
]
```

3. **Merge into settings.json**:
```json
{
  "hooks": {
    "PreCommit": [
      // Existing hooks...
      // Add new hooks from quality_gates.json
      {
        "type": "command",
        "command": "black --check .",
        "blocking": true,
        "description": "Check Python formatting"
      }
    ]
  }
}
```

### Automated Merge Script

Create a helper script to merge configurations:

```python
#!/usr/bin/env python3
# merge_hooks.py
import json
import sys

def merge_hooks(base_file, template_file, output_file):
    with open(base_file) as f:
        base = json.load(f)
    
    with open(template_file) as f:
        template = json.load(f)
    
    # Merge hooks section
    if 'hooks' not in base:
        base['hooks'] = {}
    
    for event, hooks in template.get('hooks', {}).items():
        if event not in base['hooks']:
            base['hooks'][event] = []
        base['hooks'][event].extend(hooks)
    
    with open(output_file, 'w') as f:
        json.dump(base, f, indent=2)

if __name__ == "__main__":
    merge_hooks(sys.argv[1], sys.argv[2], sys.argv[3])
```

Usage:
```bash
python merge_hooks.py .claude/settings.json hooks/quality_gates.json .claude/settings.json
```

## Creating Custom Configurations

### Basic Hook Structure

```json
{
  "hooks": {
    "EventName": [
      {
        "type": "command|agent|script",
        "command": "command to run",      // For type: command
        "agent": "agent-name",            // For type: agent
        "script": "path/to/script.py",    // For type: script
        "args": "arguments",               // Optional arguments
        "blocking": true|false,            // Should this block operations?
        "description": "What this does",   // Documentation
        "condition": "expression",         // Optional condition
        "matcher": "pattern"              // Optional pattern matching
      }
    ]
  }
}
```

### Example: Custom Python Project Hooks

```json
{
  "name": "Python Project Hooks",
  "hooks": {
    "PreCommit": [
      {
        "type": "command",
        "command": "uv run black --check .",
        "blocking": true,
        "description": "Verify code formatting"
      },
      {
        "type": "command",
        "command": "uv run mypy .",
        "blocking": false,
        "description": "Type checking (warning only)"
      },
      {
        "type": "script",
        "script": ".claude/hooks/check_docstrings.py",
        "blocking": true,
        "description": "Ensure all functions have docstrings"
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "uv run black ${file_path}",
            "blocking": false,
            "description": "Auto-format edited files"
          }
        ]
      }
    ],
    "OnError": [
      {
        "type": "agent",
        "agent": "code-archaeologist",
        "args": "--analyze-error --suggest-fix",
        "blocking": false,
        "description": "AI-powered error analysis"
      }
    ]
  }
}
```

### Conditional Hooks

Use conditions to run hooks selectively:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Creating Python file'",
            "condition": "${file_path} matches *.py",
            "description": "Log Python file creation"
          },
          {
            "type": "command",
            "command": "echo 'Creating JavaScript file'",
            "condition": "${file_path} matches *.js",
            "description": "Log JavaScript file creation"
          }
        ]
      }
    ]
  }
}
```

## Best Practices

### 1. Start Simple
Begin with one template and add complexity gradually:
```bash
# Start with quality gates
cp hooks/quality_gates.json .claude/settings.json
# Test it works
# Then add more hooks
```

### 2. Use Non-Blocking for Warnings
```json
{
  "blocking": false,  // Won't stop operations
  "description": "Type checking (warning only)"
}
```

### 3. Group Related Hooks
```json
{
  "hooks": {
    "PreCommit": [
      // All quality checks together
      {"type": "command", "command": "black --check ."},
      {"type": "command", "command": "ruff check ."},
      {"type": "command", "command": "pytest"}
    ]
  }
}
```

### 4. Document Your Hooks
Always include descriptions:
```json
{
  "description": "Check test coverage meets 80% threshold"
}
```

### 5. Test Hooks Individually
```bash
# Test a specific command before adding to hooks
black --check .
echo $?  # Check exit code
```

### 6. Use Environment Variables
```json
{
  "command": "curl -X POST ${SLACK_WEBHOOK}",
  "description": "Requires SLACK_WEBHOOK env var"
}
```

## Troubleshooting

### Hook Not Triggering

1. **Check settings location**:
```bash
ls -la .claude/settings.json
```

2. **Validate JSON syntax**:
```bash
python -m json.tool .claude/settings.json
```

3. **Check hook event name**:
- Must match exactly (case-sensitive)
- Use correct event: `PreCommit` not `pre-commit`

### Hook Failing

1. **Test command manually**:
```bash
# Run the exact command from hook
black --check .
echo "Exit code: $?"
```

2. **Check working directory**:
```json
{
  "command": "cd ${project_root} && black --check ."
}
```

3. **Make scripts executable**:
```bash
chmod +x .claude/hooks/*.py
```

### Performance Issues

1. **Use non-blocking for slow operations**:
```json
{
  "blocking": false,
  "command": "npm run build"
}
```

2. **Limit hook frequency**:
```json
{
  "matcher": "*.py",  // Only Python files
  "command": "black ${file_path}"  // Format single file
}
```

## Common Patterns

### Pattern 1: Progressive Strictness
```json
{
  "hooks": {
    "PreCommit": [
      {"command": "black --check .", "blocking": true},   // Must pass
      {"command": "mypy .", "blocking": false},           // Warning only
      {"command": "coverage report", "blocking": false}    // Informational
    ]
  }
}
```

### Pattern 2: Tool-Specific Hooks
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {"command": "echo 'Bash command: ${command}'"}
        ]
      },
      {
        "matcher": "Write",
        "hooks": [
          {"command": "echo 'Writing file: ${file_path}'"}
        ]
      }
    ]
  }
}
```

### Pattern 3: Error Recovery Chain
```json
{
  "hooks": {
    "OnError": [
      {"command": "git stash", "blocking": false},
      {"command": "pip install -r requirements.txt", "blocking": false},
      {"agent": "code-archaeologist", "args": "--fix"}
    ]
  }
}
```

## Next Steps

Now that you understand hook configurations:

1. **Try It**: Copy `example_settings.json` and customize
2. **Combine**: Merge multiple templates for your workflow
3. **Create**: Build custom hooks for your specific needs
4. **Share**: Document your hook setup in CLAUDE.md

### Related Guides
- [Hooks Implementation Guide](./hooks-guide.md) - Creating Python hooks
- [Intermediate Patterns](./intermediate-patterns.md) - Hook chaining patterns
- [Best Practices](./best-practices.md) - Production hook strategies

---

*Last Updated: 2025-08-13*