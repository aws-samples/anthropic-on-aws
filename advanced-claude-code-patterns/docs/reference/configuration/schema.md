# Configuration Schema Reference

Complete reference for Claude Code configuration file schemas.

## Settings.json Schema

### Global Settings (~/.claude/settings.json)

```json
{
  "$schema": "https://schemas.claude.ai/settings-v1.json",
  "defaults": {
    "model": "sonnet",
    "maxTokens": 8192,
    "temperature": 0.1
  },
  "agents": [
    {
      "name": "string",
      "path": "string",
      "scope": "global" | "project"
    }
  ],
  "hooks": [
    {
      "event": "string",
      "script": "string",
      "enabled": true,
      "toolMatcher": "object"
    }
  ],
  "mcp": {
    "servers": [
      {
        "name": "string",
        "command": "string",
        "args": ["string"],
        "env": "object"
      }
    ]
  },
  "security": {
    "allowedTools": ["string"],
    "blockedPaths": ["string"],
    "requireConfirmation": ["string"]
  },
  "performance": {
    "cacheEnabled": true,
    "maxCacheSize": 1073741824,
    "tokenOptimization": true
  }
}
```

### Project Settings (.claude/settings.json)

```json
{
  "$schema": "https://schemas.claude.ai/project-settings-v1.json",
  "name": "string",
  "description": "string",
  "defaults": {
    "model": "sonnet",
    "maxTokens": 8192,
    "temperature": 0.1
  },
  "agents": [
    {
      "name": "string",
      "path": "string",
      "priority": 1
    }
  ],
  "hooks": [
    {
      "event": "string",
      "script": "string",
      "enabled": true,
      "toolMatcher": "object",
      "priority": 1
    }
  ],
  "workflows": {
    "epcc": {
      "enabled": true,
      "outputDir": ".claude/epcc",
      "templates": "object"
    },
    "tdd": {
      "enabled": true,
      "testFramework": "string",
      "coverageThreshold": 80
    }
  },
  "quality": {
    "gates": [
      {
        "name": "string",
        "command": "string",
        "required": true
      }
    ],
    "preCommit": true,
    "testCoverage": {
      "enabled": true,
      "threshold": 80
    }
  }
}
```

## Field Specifications

### Model Configuration

| Field | Type | Values | Default | Description |
|-------|------|--------|---------|-------------|
| `model` | string | `sonnet`, `opus` | `sonnet` | LLM model selection |
| `maxTokens` | number | 1000-100000 | 8192 | Maximum tokens per request |
| `temperature` | number | 0.0-2.0 | 0.1 | Response randomness |

### Agent Configuration

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Unique agent identifier |
| `path` | string | Yes | Path to agent file |
| `scope` | string | No | `global` or `project` |
| `priority` | number | No | Execution priority (1-10) |

### Hook Configuration

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `event` | string | Yes | Hook event type |
| `script` | string | Yes | Path to hook script |
| `enabled` | boolean | No | Whether hook is active |
| `toolMatcher` | object | No | Tool matching criteria |
| `priority` | number | No | Execution priority |

### MCP Server Configuration

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Server identifier |
| `command` | string | Yes | Server executable |
| `args` | array | No | Command arguments |
| `env` | object | No | Environment variables |

### Security Configuration

| Field | Type | Description |
|-------|------|-------------|
| `allowedTools` | array | Permitted tool names |
| `blockedPaths` | array | Restricted file patterns |
| `requireConfirmation` | array | Tools requiring confirmation |

### Performance Configuration

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `cacheEnabled` | boolean | true | Enable response caching |
| `maxCacheSize` | number | 1GB | Maximum cache size in bytes |
| `tokenOptimization` | boolean | true | Optimize token usage |

### Workflow Configuration

#### EPCC Workflow

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enabled` | boolean | true | Enable EPCC workflow |
| `outputDir` | string | `.claude/epcc` | Output directory |
| `templates` | object | {} | Custom templates |

#### TDD Workflow

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enabled` | boolean | false | Enable TDD workflow |
| `testFramework` | string | `pytest` | Testing framework |
| `coverageThreshold` | number | 80 | Minimum coverage percent |

### Quality Gates Configuration

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Gate identifier |
| `command` | string | Yes | Command to execute |
| `required` | boolean | No | Whether gate is mandatory |

## Environment Variable Schema

### System Variables

| Variable | Type | Description |
|----------|------|-------------|
| `CLAUDE_HOME` | string | Claude Code installation directory |
| `CLAUDE_CONFIG_DIR` | string | Configuration directory path |
| `CLAUDE_CACHE_DIR` | string | Cache directory path |
| `CLAUDE_LOG_LEVEL` | string | Logging level (debug, info, warn, error) |

### Runtime Variables

| Variable | Type | Description |
|----------|------|-------------|
| `CLAUDE_SESSION_ID` | string | Current session identifier |
| `CLAUDE_PROJECT_ROOT` | string | Project root directory |
| `CLAUDE_AGENT_NAME` | string | Active agent name |
| `CLAUDE_MODEL` | string | Current model |

### Hook Variables

| Variable | Type | Description |
|----------|------|-------------|
| `CLAUDE_EVENT_TYPE` | string | Current hook event |
| `CLAUDE_TOOL_NAME` | string | Tool being executed |
| `CLAUDE_TOOL_PARAMS` | string | JSON-encoded tool parameters |

## CLAUDE.md Schema

### Project Configuration

```yaml
# Project metadata
name: string
description: string
version: string

# Development configuration
language: string
framework: string
build_tool: string

# Dependencies
dependencies:
  - name: string
    version: string
    required: boolean

# Agent preferences
agents:
  - name: string
    trigger: string
    description: string

# Quality standards
quality:
  test_coverage: number
  code_style: string
  documentation: boolean
```

### Agent Frontmatter Schema

```yaml
---
name: string              # Required: kebab-case identifier
description: string       # Required: purpose with trigger
model: sonnet | opus     # Required: model selection
tools: [string]          # Required: tool array
color: string            # Optional: UI color
priority: number         # Optional: 1-10
scope: global | project  # Optional: availability scope
---
```

## Validation Rules

### Required Fields
- Settings must include `agents` array
- Agents must have `name`, `description`, `model`, `tools`
- Hooks must have `event` and `script`
- MCP servers must have `name` and `command`

### Constraints
- Agent names must be unique within scope
- Hook priorities must be 1-10
- Model must be valid model name
- Tools must be recognized tool names

### Path Resolution
- Relative paths resolved from configuration file location
- `~` expands to user home directory
- Environment variables expanded with `${VAR}` syntax

## Migration Guide

### V1 to V2 Schema Changes
- `defaultModel` renamed to `defaults.model`
- `globalAgents` merged into `agents` with `scope` field
- `hookConfig` renamed to `hooks`
- Added `mcp` section for server configuration

### Backward Compatibility
- V1 configurations automatically upgraded
- Deprecated fields logged with warnings
- Migration performed on first load

## See Also

- [Environment Variables](environment.md)
- [Settings.json Reference](settings.md)
- [CLAUDE.md Specification](claude-md.md)
- [Agent Configuration](../agents/configuration.md)