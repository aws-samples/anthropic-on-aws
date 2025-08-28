# API Reference

Complete technical reference for Claude Code Advanced Patterns APIs, formats, and configurations.

## Quick Navigation

| Component | Description | Reference |
|-----------|-------------|-----------|
| **Agents** | AI assistant configurations | [Agent APIs](#agent-api) |
| **Commands** | Slash command definitions | [Command APIs](#command-api) |  
| **Hooks** | Lifecycle event handlers | [Hook APIs](#hook-api) |
| **Configuration** | Settings and environment | [Config APIs](#configuration-api) |
| **MCP Servers** | External integrations | [MCP APIs](#mcp-api) |
| **Security** | Permission and security | [Security APIs](#security-api) |

---

## Agent API

Agents are specialized AI assistants configured with YAML frontmatter and markdown content.

### Core Reference Documentation
- **[Agent Structure](./reference/agents/structure.md)** - YAML frontmatter and markdown format
- **[Configuration Options](./reference/agents/configuration.md)** - Model selection, tools, metadata  
- **[Available Tools](./reference/agents/tools.md)** - Complete tools reference with usage guidelines
- **[Agent Anatomy](./reference/agents/anatomy.md)** - Internal structure and components
- **[Orchestration](./reference/agents/orchestration.md)** - Multi-agent workflows and coordination

### Agent Format Specification

```yaml
---
name: agent-name                    # Required: Unique identifier
description: Agent description      # Required: What the agent does
model: sonnet|opus                 # Required: Model selection
version: 1.0.0                     # Optional: Semantic version
tools: [Read, Write, Edit]         # Required: List of allowed tools
color: blue                        # Optional: UI color hint
---

# Agent Content
Agent documentation and instructions in markdown format.
```

### Model Selection Guidelines
- **Sonnet**: Default for routine tasks (80% of operations)
- **Opus**: Complex tasks requiring deep analysis (20% of operations)

---

## Command API

Commands are slash commands that orchestrate workflows with argument support.

### Core Reference Documentation
- **[Command Syntax](./reference/commands/syntax.md)** - Argument parsing and validation
- **[Built-in Commands](./reference/commands/built-in.md)** - Claude Code built-in commands
- **[Command Index](./reference/commands/index.md)** - All available commands
- **[TDD Commands](./reference/commands/tdd.md)** - Test-driven development commands
- **[Diataxis Commands](./reference/commands/diataxis.md)** - Documentation workflow commands
- **[EPCC Commands](./reference/epcc-commands.md)** - Explore-Plan-Code-Commit workflow

### Command Format Specification

```yaml
---
name: command-name                          # Required: Command identifier  
description: Brief command description      # Required: What it does
version: 1.0.0                             # Optional: Semantic version
argument-hint: "[required] [--optional]"   # Optional: Usage hint
---

# Command Implementation
Command logic and agent orchestration in markdown format.
```

### Argument Handling Patterns
```markdown
## Arguments Processing
$ARGUMENTS                          # Raw arguments string
if not $ARGUMENTS:                  # Handle missing arguments
    ask user for required input

# Deploy agents based on arguments
@agent1 @agent2 $ARGUMENTS
```

---

## Hook API

Hooks are lifecycle event handlers that trigger at specific workflow stages.

### Core Reference Documentation
- **[Hook Configuration](./reference/hooks/configuration.md)** - JSON configuration format
- **[Hook Events](./reference/hooks/events.md)** - Available lifecycle events
- **[Exit Codes](./reference/hooks/exit-codes.md)** - Exit code meanings and behavior

### Hook Format Specification

```json
{
  "name": "hook-name",
  "description": "Hook description", 
  "hooks": {
    "EventType": [
      {
        "matcher": "ToolPattern",           // Optional: Tool pattern to match
        "hooks": [
          {
            "type": "command",              // Hook type
            "command": "shell-command",     // Command to execute
            "timeout": 60000,               // Optional: Timeout in milliseconds
            "blocking": true                // Optional: Block on failure
          }
        ]
      }
    ]
  }
}
```

### Available Hook Events
- **PreToolUse**: Before any tool execution
- **PostToolUse**: After tool execution
- **UserPromptSubmit**: When user submits a prompt
- **Stop**: When session ends

### Exit Code Behavior
- **0**: Success - Continue normally
- **1**: Warning - Show message, continue
- **2**: Error - Show message, Claude corrects

---

## Configuration API

Configuration files control Claude Code behavior and permissions.

### Core Reference Documentation
- **[Settings Configuration](./reference/configuration/settings.md)** - settings.json format
- **[Environment Variables](./reference/configuration/environment.md)** - Environment configuration
- **[Schema Reference](./reference/configuration/schema.md)** - Configuration schemas
- **[CLAUDE.md Format](./reference/configuration/claude-md.md)** - Project configuration

### Settings Format Specification

```json
{
  "permissions": {
    "allow": ["Read", "Write", "Bash(git:*)"],      // Allowed tools
    "deny": ["Read(**/*secret*)"],                   // Denied patterns
    "ask": ["Bash(rm:*)"]                          // Ask for permission
  },
  "hooks": {
    "PreToolUse": [/* hook configurations */]
  },
  "env": {
    "CLAUDE_CODE_MODEL": "sonnet",                  // Environment variables
    "CLAUDE_CODE_TIMEOUT": "600"
  }
}
```

### Permission Patterns
```bash
"Read"                              # Allow all Read operations
"Read(**/*.md)"                     # Allow reading markdown files
"Bash(git:*)"                       # Allow all git commands
"Write(**/*secret*)"                # Deny writing secret files
```

---

## MCP API

Model Context Protocol (MCP) servers extend Claude Code with external capabilities.

### Core Reference Documentation
- **[MCP Configuration](./reference/mcp/configuration.md)** - MCP server setup
- **[MCP Protocol](./reference/mcp/protocol.md)** - Protocol specifications
- **[Available Servers](./reference/mcp/servers.md)** - Pre-built MCP servers
- **[Building Servers](./reference/mcp/building.md)** - Creating custom servers

### MCP Server Configuration
```bash
# Add MCP server
claude mcp add server-name -- command args

# Examples
claude mcp add github -- npx @modelcontextprotocol/server-github
claude mcp add postgres -- postgres-server --connection-string $DATABASE_URL
```

---

## Security API

Security configurations, permissions, and compliance frameworks.

### Core Reference Documentation
- **[Security Commands](./reference/security/commands.md)** - Security-related commands
- **[Permission Schema](./reference/security/permission-schema.md)** - Permission system details

### Security Best Practices
- Never store secrets in configuration
- Use environment variables for sensitive data
- Implement least-privilege permissions
- Regular security audits with security hooks

---

## Workflow Configuration

Advanced workflow and orchestration patterns.

### Core Reference Documentation
- **[Workflow Configuration](./reference/workflow-configuration.md)** - Multi-stage workflows
- **[Monitoring Configuration](./reference/monitoring-configuration.md)** - Performance monitoring

---

## Examples and Patterns

### Multi-Agent Orchestration
```markdown
# Parallel agent deployment
@docs-tutorial-agent @docs-howto-agent @docs-reference-agent @docs-explanation-agent

# Sequential workflow with data passing
1. @analyzer → analysis results
2. @processor → processed data  
3. @validator → validation report
```

### Hook Composition
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          {"type": "command", "command": "python3 hooks/black_formatter.py"},
          {"type": "command", "command": "python3 hooks/python_lint.py"}
        ]
      }
    ]
  }
}
```

### Command with Arguments
```markdown
---
name: deploy-app
argument-hint: "[environment] [--dry-run]"
---

## Deployment Command
Environment: $ARGUMENTS

if "$ARGUMENTS" contains "--dry-run":
    @deployment-agent simulate deployment to $ENV
else:
    @deployment-agent deploy to $ENV
```

---

## Version Compatibility

| Component | Version | Compatibility |
|-----------|---------|---------------|
| Agent API | v1.0 | Claude Code 1.0+ |
| Command API | v1.0 | Claude Code 1.0+ |  
| Hook API | v1.0 | Claude Code 1.0+ |
| MCP API | v1.0 | Claude Code 1.0+ |

---

## Migration Guide

### From Basic to Advanced Patterns
1. **Agents**: Add frontmatter metadata and tool specifications
2. **Commands**: Add argument handling and validation  
3. **Hooks**: Implement proper exit codes and error handling
4. **Configuration**: Migrate to structured settings.json format

---

For implementation examples and tutorials, see:
- **[Quick Start Guide](./quick-start.md)** - Getting started
- **[Best Practices](./best-practices.md)** - Production patterns
- **[Troubleshooting](./troubleshooting.md)** - Common issues

*Last updated: 2025-08-27 | Version: 1.0.0*