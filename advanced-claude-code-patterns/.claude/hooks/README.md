# Hooks Directory

This directory contains both **hook configuration templates** (JSON) and **executable hook scripts** (Python). Understanding the distinction is crucial for effective usage.

## 📁 Directory Contents

### Configuration Templates (JSON) - Define WHAT and WHEN
These files are **templates** that must be copied to `.claude/settings.json` to be active:

| File | Purpose | Key Features |
|------|---------|--------------|
| `quality_gates.json` | Code quality enforcement | Pre-commit checks, testing, linting |
| `auto_recovery.json` | Error recovery automation | Auto-formatting, error handling, cleanup |
| `notifications.json` | Team communication | Slack, email, PagerDuty integration |
| `compliance.json` | Regulatory compliance | GDPR, HIPAA, SOC2 checks |
| `security_gates.json` | Security validation | Vulnerability scanning, secret detection |
| `performance_monitor.json` | Performance tracking | Resource usage, timing, profiling |
| `example_settings.json` | **Complete example** | Full configuration with all sections |

### Executable Scripts (Python) - Implement HOW
These files contain actual hook logic that runs when triggered:

| File | Purpose | Trigger |
|------|---------|---------|
| `black_formatter.py` | Format Python code | PostEdit, PreCommit |
| `python_lint.py` | Lint Python files | PostEdit, PreCommit |
| `log_tool_use.py` | Log all tool usage | PreToolUse |
| `use_uv.py` | Suggest UV over pip | PreBash (pip commands) |

### Supporting Files

| File | Purpose |
|------|---------|
| `EXIT_CODES_GUIDE.md` | Hook exit code documentation |
| `ruff.toml` | Ruff linter configuration |
| `utils/create_audio_files.py` | Generate audio notifications |

## 🚀 Quick Start

### Using a JSON Configuration Template

1. **Choose a template** based on your needs:
```bash
# For code quality checks
cp hooks/quality_gates.json .claude/settings.json

# For complete example with all features
cp hooks/example_settings.json .claude/settings.json
```

2. **Customize the configuration**:
```bash
# Edit to match your project
nano .claude/settings.json
```

3. **Test the hooks**:
```bash
# Hooks will now run automatically
claude "Make a test commit"
```

### Using Python Hook Scripts

Python scripts can be called in two ways:

#### Method 1: Direct execution from JSON config
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit",
        "hooks": [
          {
            "type": "command",
            "command": "python hooks/black_formatter.py ${file_path}",
            "description": "Auto-format Python files"
          }
        ]
      }
    ]
  }
}
```

#### Method 2: As standalone executable hooks
Place in `.claude/hooks/` and make executable:
```bash
chmod +x hooks/black_formatter.py
```

## 📋 JSON vs Python: When to Use Which

### Use JSON Configurations When:
- ✅ Running simple commands (`black`, `pytest`, `git`)
- ✅ Calling existing tools or agents
- ✅ Setting up standard workflows
- ✅ Configuring notifications
- ✅ You want declarative, easy-to-read configuration

### Use Python Scripts When:
- ✅ Complex logic with conditionals
- ✅ Data transformation or analysis
- ✅ Custom error handling
- ✅ Integration with APIs
- ✅ Dynamic behavior based on context

## 📖 Configuration Template Details

### quality_gates.json
**Purpose**: Enforce code quality standards

**Key Hooks**:
- `PreCommit`: Black, isort, flake8, mypy, pytest
- `PreDeploy`: Security scanning, coverage checks
- `PreToolUse`: Command logging

**Usage**:
```bash
cp hooks/quality_gates.json .claude/settings.json
```

### auto_recovery.json
**Purpose**: Automatic error recovery and fixes

**Key Hooks**:
- `PostToolUse`: Auto-format, auto-stage
- `OnError`: Error logging, auto-stash, fix suggestions
- `Stop`: Session cleanup

**Usage**:
```bash
# Merge with existing settings
python merge_configs.py .claude/settings.json hooks/auto_recovery.json
```

### notifications.json
**Purpose**: Team notifications and alerts

**Key Hooks**:
- `PreDeploy`: Deployment start notifications
- `PostDeploy`: Success notifications, release creation
- `OnError`: PagerDuty alerts, Slack notifications

**Required Environment Variables**:
```bash
export SLACK_WEBHOOK="https://hooks.slack.com/services/..."
export PAGERDUTY_WEBHOOK="https://events.pagerduty.com/..."
```

### example_settings.json
**Purpose**: Complete configuration example

**Includes**:
- File permissions (deny access to secrets)
- Command allowlists
- Hook configurations
- Model preferences
- Tool preferences
- Logging settings

**Best Starting Point**:
```bash
# Start with this for new projects
cp hooks/example_settings.json .claude/settings.json
```

## 🔧 Python Hook Scripts

### black_formatter.py
Automatically formats Python code using Black.

**Features**:
- Checks if file is Python
- Runs Black with project settings
- Returns appropriate exit codes

**Usage in settings.json**:
```json
{
  "type": "command",
  "command": "python hooks/black_formatter.py ${file_path}"
}
```

### python_lint.py
Comprehensive Python linting with multiple tools.

**Tools Used**:
- Ruff (fast linting)
- Black (formatting check)
- Mypy (type checking)

**Configuration**: Edit `ruff.toml` for Ruff settings

### log_tool_use.py
Logs all Claude tool usage for audit trails.

**Logs**:
- Tool name
- Arguments
- Timestamp
- User/session info

**Output**: `.claude/tool_usage.log`

### use_uv.py
Suggests using UV package manager instead of pip.

**Triggers On**:
- `pip install` commands
- `pip uninstall` commands

**Suggests**: Equivalent UV commands

## 🎯 Common Patterns

### Pattern 1: Combine Multiple Templates
```bash
# Start with example
cp hooks/example_settings.json .claude/settings.json

# Add quality gates
# Manually copy the "PreCommit" section from quality_gates.json

# Add notifications
# Manually copy the "OnError" section from notifications.json
```

### Pattern 2: Progressive Enhancement
Start simple, add complexity:

1. **Day 1**: Basic formatting
```json
{
  "hooks": {
    "PostEdit": [
      {"command": "black ${file_path}"}
    ]
  }
}
```

2. **Week 1**: Add quality checks
```json
{
  "hooks": {
    "PreCommit": [
      {"command": "black --check ."},
      {"command": "pytest"}
    ]
  }
}
```

3. **Month 1**: Full automation
- Add all templates
- Custom Python hooks
- Team notifications

### Pattern 3: Project-Specific Configuration
```bash
# Python project
cp hooks/example_settings.json .claude/settings.json
# Focus on Python tools

# Node.js project
# Modify commands for npm/eslint/jest

# Mixed project
# Include both Python and Node.js checks
```

## ⚙️ Customization Guide

### Modifying JSON Templates

1. **Change blocking behavior**:
```json
"blocking": false  // Convert errors to warnings
```

2. **Adjust commands**:
```json
"command": "pytest tests/ -v"  // Add verbosity
```

3. **Add conditions**:
```json
"condition": "${file_path} matches *.py"
```

### Creating New Python Hooks

Template for new hook:
```python
#!/usr/bin/env python3
"""
Hook: my_custom_hook.py
Purpose: [Description]
Trigger: [When this runs]
"""

import sys
import os

def main():
    # Get arguments from Claude
    file_path = sys.argv[1] if len(sys.argv) > 1 else None
    
    # Your logic here
    
    # Return exit code
    # 0 = success
    # 1-99 = warning (non-blocking)
    # 100+ = error (blocking)
    return 0

if __name__ == "__main__":
    sys.exit(main())
```

## 📚 Resources

### Documentation
- [Hook Configuration Guide](../docs/hook-configuration-guide.md) - Detailed configuration guide
- [Hooks Implementation Guide](../docs/hooks-guide.md) - Creating custom hooks
- [EXIT_CODES_GUIDE.md](./EXIT_CODES_GUIDE.md) - Understanding exit codes

### Quick Commands
```bash
# List all templates
ls -la hooks/*.json

# Check current settings
cat .claude/settings.json | python -m json.tool

# Test a hook command
black --check . && echo "✅ Pass" || echo "❌ Fail"

# Make script executable
chmod +x hooks/*.py
```

## 🐛 Troubleshooting

### JSON Template Not Working
1. Ensure copied to `.claude/settings.json`
2. Validate JSON syntax: `python -m json.tool .claude/settings.json`
3. Check hook event names (case-sensitive)

### Python Script Not Running
1. Check executable: `chmod +x hooks/script.py`
2. Test manually: `python hooks/script.py test_file.py`
3. Check Python path: `which python`

### Hooks Not Triggering
1. Verify settings location: `.claude/settings.json` (not `hooks/`)
2. Check Claude version: `claude --version`
3. Enable debug mode: `export CLAUDE_DEBUG=true`

## 📝 Contributing

To add new hook templates or scripts:

1. Create the file in `hooks/`
2. Document in this README
3. Add usage examples
4. Include in relevant guides

---

*Remember: JSON files here are TEMPLATES. Copy them to `.claude/settings.json` to activate.*