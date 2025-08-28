# Command Index

Complete index of all Claude Code commands.

## Built-in Commands

### Core Commands

| Command | Purpose | Documentation |
|---------|---------|---------------|
| `help` | Show help information | [Built-in Commands](built-in.md#help) |
| `init` | Initialize project | [Built-in Commands](built-in.md#init) |
| `config` | Manage configuration | [Built-in Commands](built-in.md#config) |
| `agent` | Manage agents | [Built-in Commands](built-in.md#agent) |
| `version` | Show version info | [Built-in Commands](built-in.md#version) |

### Development Commands

| Command | Purpose | Documentation |
|---------|---------|---------------|
| `run` | Execute agent workflow | [Built-in Commands](built-in.md#run) |
| `test` | Run project tests | [Built-in Commands](built-in.md#test) |
| `build` | Build project | [Built-in Commands](built-in.md#build) |
| `deploy` | Deploy project | [Built-in Commands](built-in.md#deploy) |

### Utility Commands

| Command | Purpose | Documentation |
|---------|---------|---------------|
| `status` | Show project status | [Built-in Commands](built-in.md#status) |
| `logs` | View logs | [Built-in Commands](built-in.md#logs) |
| `clean` | Clean cache/temp files | [Built-in Commands](built-in.md#clean) |
| `doctor` | Diagnose issues | [Built-in Commands](built-in.md#doctor) |

## Slash Commands

### Interactive Session Commands

| Command | Purpose | Documentation |
|---------|---------|---------------|
| `/help` | Show available commands | [Syntax Reference](syntax.md#slash-commands) |
| `/clear` | Clear conversation | [Syntax Reference](syntax.md#clear) |
| `/compact` | Compact conversation | [Syntax Reference](syntax.md#compact) |
| `/cost` | Show token usage | [Syntax Reference](syntax.md#cost) |
| `/model` | Change model | [Syntax Reference](syntax.md#model) |

### Agent Commands

| Command | Purpose | Documentation |
|---------|---------|---------------|
| `/agent` | Switch active agent | [Syntax Reference](syntax.md#agent) |
| `/agents` | List available agents | [Syntax Reference](syntax.md#agents) |
| `/reload` | Reload agent configuration | [Syntax Reference](syntax.md#reload) |

## EPCC Commands

| Command | Purpose | Output | Documentation |
|---------|---------|--------|---------------|
| `/epcc/epcc-explore` | Explore codebase | `EPCC_EXPLORE.md` | [EPCC Commands](epcc-commands.md#epcc-explore) |
| `/epcc/epcc-plan` | Create implementation plan | `EPCC_PLAN.md` | [EPCC Commands](epcc-commands.md#epcc-plan) |
| `/epcc/epcc-code` | Implement solution | `EPCC_CODE.md` | [EPCC Commands](epcc-commands.md#epcc-code) |
| `/epcc/epcc-commit` | Finalize and commit | `EPCC_COMMIT.md` | [EPCC Commands](epcc-commands.md#epcc-commit) |

## Custom Commands

### Project-Specific Commands

| Command Pattern | Purpose | Location |
|-----------------|---------|----------|
| `/project/*` | Project-specific commands | `.claude/commands/` |
| `/custom/*` | Custom workflow commands | `.claude/commands/` |
| `/team/*` | Team-specific commands | `.claude/commands/` |

### User Commands

| Command Pattern | Purpose | Location |
|-----------------|---------|----------|
| `/personal/*` | Personal commands | `~/.claude/commands/` |
| `/global/*` | Global custom commands | `~/.claude/commands/` |

## Command Categories

### By Functionality

#### File Operations
- `/read` - Read file contents
- `/write` - Create/overwrite files
- `/edit` - Modify existing files
- `/grep` - Search file contents
- `/find` - Find files by pattern

#### Project Management
- `/init` - Initialize new project
- `/status` - Show project status
- `/config` - Manage configuration
- `/clean` - Clean project artifacts

#### Development Workflow
- `/test` - Run tests
- `/build` - Build project
- `/deploy` - Deploy application
- `/review` - Code review workflow

#### Quality Assurance
- `/lint` - Run linting tools
- `/format` - Format code
- `/security` - Security analysis
- `/coverage` - Test coverage analysis

### By Access Level

#### Public Commands
- Available to all users
- Standard Claude Code installation
- Documented in main documentation

#### Project Commands
- Available in specific projects
- Defined in `.claude/commands/`
- Team-specific functionality

#### Personal Commands
- User-specific commands
- Defined in `~/.claude/commands/`
- Private customizations

## Command Syntax Patterns

### Basic Command Structure
```
/category/command-name [arguments] [--options]
```

### Examples
```bash
# Built-in commands
claude init python-web-app
claude config show

# Slash commands
/epcc/epcc-explore "authentication system"
/agent code-reviewer
/help commands

# Custom commands
/project/deploy staging
/personal/backup-work
```

### Argument Types

#### Positional Arguments
```bash
/epcc/epcc-plan "implement user authentication"
/agent python-developer
```

#### Named Arguments
```bash
/test --coverage --verbose
/deploy --env production --branch main
```

#### Option Flags
```bash
/epcc/epcc-explore --quick
/epcc/epcc-code --tdd
/build --clean --verbose
```

## Command Discovery

### List Available Commands
```bash
# Show all built-in commands
claude help

# Show slash commands in session
/help

# List custom commands
/help custom

# Show command details
/help epcc-explore
claude help config
```

### Command Completion
- Tab completion for command names
- Argument suggestions based on context
- Option flag completion
- File path completion

## Command Configuration

### Global Command Settings
```json
{
  "commands": {
    "aliases": {
      "e": "epcc/epcc-explore",
      "p": "epcc/epcc-plan",
      "c": "epcc/epcc-code"
    },
    "defaults": {
      "timeout": 300,
      "confirmDestructive": true
    }
  }
}
```

### Project Command Settings
```json
{
  "commands": {
    "custom": [
      {
        "name": "deploy-staging",
        "command": "/project/deploy",
        "args": ["staging"],
        "description": "Deploy to staging environment"
      }
    ]
  }
}
```

## Error Handling

### Common Errors

#### Command Not Found
```
Error: Command '/unknown' not found
Suggestions:
- /epcc/epcc-explore
- /help
- /agent
```

#### Invalid Arguments
```
Error: Invalid argument for '/epcc/epcc-plan'
Expected: description (string)
Received: (empty)
Usage: /epcc/epcc-plan "description" [--options]
```

#### Permission Denied
```
Error: Permission denied for command '/admin/delete'
Required permission: admin
Current permissions: user, developer
```

### Error Recovery

#### Auto-correction
- Suggests similar command names
- Corrects common typos
- Provides usage examples

#### Fallback Behavior
- Graceful degradation for failed commands
- Alternative command suggestions
- Context-aware help

## Performance Considerations

### Command Execution Time

| Command Type | Typical Time | Notes |
|--------------|--------------|-------|
| Built-in | < 1s | Local execution |
| Slash commands | 1-5s | Context processing |
| EPCC commands | 30-120s | AI processing |
| Custom commands | Variable | Depends on implementation |

### Optimization Tips
- Use command aliases for frequently used commands
- Cache command results where appropriate
- Prefer specific commands over general ones
- Combine related operations in single commands

## Security Considerations

### Command Permissions
- Commands inherit security context
- Restricted commands require explicit permission
- Audit logging for sensitive operations

### Input Validation
- All arguments validated before execution
- Path traversal protection
- Injection attack prevention

### Output Sanitization
- Sensitive data filtered from outputs
- Log sanitization for security
- Error message sanitization

## See Also

- [Syntax Reference](syntax.md)
- [Built-in Commands](built-in.md)
- [Custom Command API](api.md)
- [EPCC Commands Reference](epcc-commands.md)