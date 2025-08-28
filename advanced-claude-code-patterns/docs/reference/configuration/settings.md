# Settings.json Reference

Complete reference for Claude Code settings.json configuration files.

## File Locations

### Global Settings
```
~/.claude/settings.json
```
- Applies to all projects
- User-wide defaults
- Global agents and hooks

### Project Settings
```
.claude/settings.json
```
- Project-specific configuration
- Overrides global settings
- Team-shared configuration

### Local Settings
```
.claude/settings.local.json
```
- Developer-specific overrides
- Ignored by version control
- Personal preferences

## Configuration Hierarchy

Settings are loaded in order of precedence:
1. Local settings (highest priority)
2. Project settings
3. Global settings (lowest priority)

## Complete Schema

### Minimal Configuration
```json
{
  "agents": []
}
```

### Full Configuration
```json
{
  "name": "My Project",
  "description": "Project description",
  "version": "1.0.0",
  "defaults": {
    "model": "sonnet",
    "maxTokens": 8192,
    "temperature": 0.1,
    "topP": 1.0,
    "timeout": 30
  },
  "agents": [
    {
      "name": "my-agent",
      "path": "./agents/my-agent.md",
      "enabled": true,
      "priority": 5,
      "scope": "project"
    }
  ],
  "hooks": [
    {
      "event": "preToolUse",
      "script": "./hooks/security-check.py",
      "enabled": true,
      "priority": 1,
      "toolMatcher": {
        "tool": "Write"
      }
    }
  ],
  "mcp": {
    "servers": [
      {
        "name": "database",
        "command": "python",
        "args": ["-m", "mcp_server_db"],
        "env": {
          "DB_URL": "postgresql://localhost/mydb"
        },
        "timeout": 10
      }
    ]
  },
  "workflows": {
    "epcc": {
      "enabled": true,
      "outputDir": ".claude/epcc",
      "templates": {
        "explore": "./templates/explore.md",
        "plan": "./templates/plan.md"
      }
    },
    "tdd": {
      "enabled": false,
      "testFramework": "pytest",
      "coverageThreshold": 80,
      "testPattern": "test_*.py"
    }
  },
  "quality": {
    "gates": [
      {
        "name": "lint",
        "command": "ruff check .",
        "required": true,
        "timeout": 30
      },
      {
        "name": "type-check",
        "command": "mypy .",
        "required": false,
        "timeout": 60
      }
    ],
    "preCommit": true,
    "testCoverage": {
      "enabled": true,
      "threshold": 80,
      "format": "lcov"
    }
  },
  "security": {
    "mode": "standard",
    "allowedTools": ["Read", "Write", "Edit"],
    "blockedPaths": ["*.key", "*.pem", ".env"],
    "requireConfirmation": ["Bash"],
    "auditLog": true
  },
  "performance": {
    "cacheEnabled": true,
    "maxCacheSize": 1073741824,
    "cacheTTL": 3600,
    "tokenOptimization": true,
    "parallelRequests": 3
  },
  "ui": {
    "theme": "dark",
    "showTokenUsage": true,
    "showPerformanceMetrics": false,
    "notificationLevel": "info"
  }
}
```

## Section Details

### Project Metadata

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | Project display name |
| `description` | string | No | Project description |
| `version` | string | No | Project version |

### Default Model Settings

| Field | Type | Default | Range | Description |
|-------|------|---------|--------|-------------|
| `model` | string | `sonnet` | `sonnet`, `opus` | Default model |
| `maxTokens` | number | 8192 | 1000-100000 | Token limit |
| `temperature` | number | 0.1 | 0.0-2.0 | Response randomness |
| `topP` | number | 1.0 | 0.0-1.0 | Nucleus sampling |
| `timeout` | number | 30 | 5-300 | Request timeout (seconds) |

### Agent Configuration

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Unique agent identifier |
| `path` | string | Yes | Path to agent file (relative or absolute) |
| `enabled` | boolean | No | Whether agent is active (default: true) |
| `priority` | number | No | Loading priority 1-10 (default: 5) |
| `scope` | string | No | `global` or `project` (default: based on file location) |

#### Agent Path Resolution
- Relative paths resolved from settings file directory
- `~` expands to user home directory
- Environment variables expanded: `${CLAUDE_AGENTS_DIR}/my-agent.md`

### Hook Configuration

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `event` | string | Yes | Hook event type |
| `script` | string | Yes | Path to hook script |
| `enabled` | boolean | No | Whether hook is active (default: true) |
| `priority` | number | No | Execution priority 1-10 (default: 5) |
| `toolMatcher` | object | No | Tool matching criteria |
| `condition` | string | No | Additional execution condition |

#### Supported Events
- `sessionStart` - Session initialization
- `userPromptSubmit` - User prompt submission
- `preToolUse` - Before tool execution
- `postToolUse` - After tool execution
- `notification` - Notification events
- `preCompact` - Before conversation compaction
- `subagentStop` - Subagent completion
- `stop` - Session end

#### Tool Matchers
```json
{
  "tool": "Edit",                      // Exact tool match
  "tools": ["Edit", "Write"],          // Multiple tools
  "tool": "!Read",                     // Exclude tool
  "pathPattern": "*.py",               // File pattern
  "parameterMatch": {                  // Parameter matching
    "file_path": "/src/*"
  }
}
```

### MCP Server Configuration

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Server identifier |
| `command` | string | Yes | Executable command |
| `args` | array | No | Command arguments |
| `env` | object | No | Environment variables |
| `timeout` | number | No | Connection timeout (default: 10) |
| `autoStart` | boolean | No | Start with Claude (default: true) |

#### Example MCP Configurations

##### Database Server
```json
{
  "name": "postgres",
  "command": "mcp-server-postgres",
  "env": {
    "DATABASE_URL": "postgresql://localhost/mydb"
  }
}
```

##### File System Server
```json
{
  "name": "filesystem",
  "command": "python",
  "args": ["-m", "mcp_server_filesystem", "/allowed/path"]
}
```

### Workflow Configuration

#### EPCC Workflow
```json
{
  "epcc": {
    "enabled": true,
    "outputDir": ".claude/epcc",
    "templates": {
      "explore": "./templates/explore.md",
      "plan": "./templates/plan.md",
      "code": "./templates/code.md",
      "commit": "./templates/commit.md"
    },
    "autoArchive": true,
    "maxFiles": 100
  }
}
```

#### TDD Workflow
```json
{
  "tdd": {
    "enabled": true,
    "testFramework": "pytest",
    "coverageThreshold": 80,
    "testPattern": "test_*.py",
    "coverageFormat": "lcov",
    "autoRun": true
  }
}
```

### Quality Gates

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Gate identifier |
| `command` | string | Yes | Command to execute |
| `required` | boolean | No | Block on failure (default: false) |
| `timeout` | number | No | Timeout in seconds (default: 30) |
| `workingDir` | string | No | Working directory |
| `env` | object | No | Environment variables |

#### Common Quality Gates
```json
{
  "gates": [
    {
      "name": "format",
      "command": "black --check .",
      "required": true
    },
    {
      "name": "lint", 
      "command": "ruff check .",
      "required": true
    },
    {
      "name": "type-check",
      "command": "mypy .",
      "required": false
    },
    {
      "name": "test",
      "command": "pytest",
      "required": true,
      "timeout": 120
    },
    {
      "name": "security",
      "command": "bandit -r .",
      "required": false
    }
  ]
}
```

### Security Configuration

| Field | Type | Description |
|-------|------|-------------|
| `mode` | string | `strict`, `standard`, `permissive` |
| `allowedTools` | array | Permitted tool names |
| `blockedPaths` | array | File patterns to block |
| `requireConfirmation` | array | Tools requiring confirmation |
| `auditLog` | boolean | Enable audit logging |

#### Security Modes

##### Strict Mode
- Only explicitly allowed tools
- Confirmation required for file writes
- All operations logged

##### Standard Mode (Default)
- Most tools allowed
- Confirmation for destructive operations
- Basic logging

##### Permissive Mode
- All tools allowed
- Minimal restrictions
- Optional logging

### Performance Configuration

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `cacheEnabled` | boolean | true | Enable response caching |
| `maxCacheSize` | number | 1GB | Cache size limit in bytes |
| `cacheTTL` | number | 3600 | Cache TTL in seconds |
| `tokenOptimization` | boolean | true | Optimize token usage |
| `parallelRequests` | number | 3 | Max concurrent requests |
| `requestDelay` | number | 0 | Delay between requests (ms) |

### UI Configuration

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `theme` | string | `auto` | UI theme (light, dark, auto) |
| `showTokenUsage` | boolean | true | Display token usage |
| `showPerformanceMetrics` | boolean | false | Show performance data |
| `notificationLevel` | string | `info` | Notification threshold |
| `fontSize` | string | `medium` | Font size (small, medium, large) |

## Configuration Examples

### Basic Project Setup
```json
{
  "agents": [
    {
      "name": "python-dev",
      "path": "./agents/python-developer.md"
    }
  ],
  "hooks": [
    {
      "event": "preToolUse",
      "script": "./hooks/python-lint.py",
      "toolMatcher": {
        "tools": ["Edit", "Write"],
        "pathPattern": "*.py"
      }
    }
  ]
}
```

### Team Development
```json
{
  "name": "Team Project",
  "defaults": {
    "model": "sonnet",
    "maxTokens": 8192
  },
  "agents": [
    {
      "name": "code-reviewer",
      "path": "./agents/code-reviewer.md",
      "priority": 8
    },
    {
      "name": "test-generator",
      "path": "./agents/test-generator.md",
      "priority": 6
    }
  ],
  "quality": {
    "gates": [
      {
        "name": "lint",
        "command": "npm run lint",
        "required": true
      },
      {
        "name": "test",
        "command": "npm test",
        "required": true
      }
    ],
    "preCommit": true
  },
  "workflows": {
    "epcc": {
      "enabled": true,
      "outputDir": ".claude/epcc"
    }
  }
}
```

### Enterprise Security
```json
{
  "security": {
    "mode": "strict",
    "allowedTools": ["Read", "Grep", "Glob"],
    "blockedPaths": [
      "*.key",
      "*.pem",
      ".env*",
      "secrets/*"
    ],
    "requireConfirmation": ["Write", "Edit"],
    "auditLog": true
  },
  "performance": {
    "tokenOptimization": true,
    "parallelRequests": 1,
    "requestDelay": 1000
  }
}
```

## Validation and Testing

### Validate Configuration
```bash
claude config validate
claude config validate --file .claude/settings.json
```

### Test Configuration
```bash
claude config test
claude config test --hooks-only
claude config test --agents-only
```

### Show Current Configuration
```bash
claude config show
claude config show --merged
claude config show --source
```

## Migration and Upgrades

### Configuration Migrations
Claude Code automatically migrates configurations between versions:

- Backup created before migration
- Deprecated fields logged with warnings  
- New fields added with defaults
- Invalid configurations fixed where possible

### Manual Migration
```bash
# Create backup
cp .claude/settings.json .claude/settings.json.backup

# Migrate to latest format
claude config migrate

# Validate migrated config
claude config validate
```

## See Also

- [Configuration Schema](schema.md)
- [Environment Variables](environment.md)
- [Agent Configuration](../agents/configuration.md)
- [Hook Configuration](../hooks/configuration.md)