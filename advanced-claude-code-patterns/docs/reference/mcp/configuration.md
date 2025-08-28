# MCP Configuration Reference

Complete reference for configuring MCP servers in Claude Code.

## Configuration Overview

MCP servers are configured in Claude Code settings files using the `mcp` section. Configuration can be global (applies to all projects) or project-specific.

### Configuration Hierarchy
1. **Local settings** (`.claude/settings.local.json`) - highest priority
2. **Project settings** (`.claude/settings.json`) - team shared
3. **Global settings** (`~/.claude/settings.json`) - user defaults

## Basic Configuration

### Minimal Server Configuration
```json
{
  "mcp": {
    "servers": [
      {
        "name": "filesystem",
        "command": "uvx",
        "args": ["mcp-server-filesystem", "/home/user/projects"]
      }
    ]
  }
}
```

### Complete Server Configuration
```json
{
  "mcp": {
    "enabled": true,
    "timeout": 30,
    "servers": [
      {
        "name": "postgres-db",
        "description": "PostgreSQL database server",
        "command": "uvx",
        "args": ["mcp-server-postgres"],
        "env": {
          "DATABASE_URL": "${DATABASE_URL}",
          "PGPASSWORD": "${PGPASSWORD}"
        },
        "workingDirectory": "/app",
        "timeout": 60,
        "autoStart": true,
        "enabled": true,
        "retries": 3,
        "healthCheck": {
          "enabled": true,
          "interval": 30
        },
        "security": {
          "readOnly": false,
          "allowedHosts": ["localhost", "db.internal"]
        }
      }
    ]
  }
}
```

## Server Configuration Fields

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Unique server identifier |
| `command` | string | Executable command |

### Optional Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `description` | string | | Human-readable description |
| `args` | array | `[]` | Command line arguments |
| `env` | object | `{}` | Environment variables |
| `workingDirectory` | string | Current dir | Working directory |
| `timeout` | number | 30 | Connection timeout (seconds) |
| `autoStart` | boolean | true | Start automatically |
| `enabled` | boolean | true | Server enabled |
| `retries` | number | 3 | Connection retry attempts |

## Environment Variables

### Variable Expansion
Environment variables are expanded using `${VAR}` syntax:

```json
{
  "env": {
    "DATABASE_URL": "${DATABASE_URL}",
    "API_KEY": "${MY_API_KEY}",
    "LOG_LEVEL": "${LOG_LEVEL:-info}",
    "PORT": "${PORT:8080}"
  }
}
```

**Expansion Patterns:**
- `${VAR}` - Simple expansion
- `${VAR:-default}` - Default value if unset
- `${VAR:?error}` - Error if unset
- `${VAR:+value}` - Value if VAR is set

### Common Environment Variables

#### Database Servers
```json
{
  "env": {
    "DATABASE_URL": "postgresql://user:pass@host:5432/db",
    "MYSQL_HOST": "localhost",
    "MYSQL_USER": "user",
    "MYSQL_PASSWORD": "password",
    "SQLITE_PATH": "/path/to/database.db"
  }
}
```

#### API Servers
```json
{
  "env": {
    "API_KEY": "${GITHUB_TOKEN}",
    "API_URL": "https://api.example.com",
    "RATE_LIMIT": "100",
    "TIMEOUT": "30"
  }
}
```

#### Authentication
```json
{
  "env": {
    "AUTH_TYPE": "bearer",
    "ACCESS_TOKEN": "${ACCESS_TOKEN}",
    "CLIENT_ID": "${CLIENT_ID}",
    "CLIENT_SECRET": "${CLIENT_SECRET}"
  }
}
```

## Server Types and Templates

### Database Server Template
```json
{
  "name": "database",
  "command": "uvx",
  "args": ["mcp-server-postgres"],
  "env": {
    "DATABASE_URL": "${DATABASE_URL}"
  },
  "timeout": 60,
  "healthCheck": {
    "enabled": true,
    "interval": 30,
    "query": "SELECT 1"
  }
}
```

### File System Server Template
```json
{
  "name": "filesystem",
  "command": "uvx",
  "args": ["mcp-server-filesystem", "${PROJECT_ROOT}"],
  "security": {
    "readOnly": false,
    "allowedExtensions": [".txt", ".md", ".json", ".py"],
    "maxFileSize": "10MB",
    "pathWhitelist": ["src/", "docs/", "tests/"]
  }
}
```

### HTTP API Server Template
```json
{
  "name": "api-client",
  "command": "uvx",
  "args": ["mcp-server-http"],
  "env": {
    "ALLOWED_HOSTS": "api.example.com,api2.example.com",
    "DEFAULT_TIMEOUT": "30",
    "MAX_RETRIES": "3"
  },
  "security": {
    "allowedHosts": ["api.example.com"],
    "requireHttps": true
  }
}
```

### Development Tool Server Template
```json
{
  "name": "dev-tools",
  "command": "uvx",
  "args": ["mcp-server-dev"],
  "env": {
    "PROJECT_TYPE": "python",
    "BUILD_TOOL": "poetry",
    "TEST_FRAMEWORK": "pytest"
  },
  "autoStart": true,
  "workingDirectory": "${PROJECT_ROOT}"
}
```

## Security Configuration

### Access Control
```json
{
  "security": {
    "readOnly": true,
    "allowedHosts": ["localhost", "*.internal"],
    "blockedHosts": ["*.malicious.com"],
    "requireHttps": true,
    "maxRequestSize": "10MB",
    "rateLimiting": {
      "enabled": true,
      "requestsPerMinute": 100
    }
  }
}
```

### File System Security
```json
{
  "security": {
    "pathWhitelist": [
      "/allowed/path1",
      "/allowed/path2/*"
    ],
    "pathBlacklist": [
      "/etc/*",
      "/var/log/*",
      "*.key",
      "*.pem"
    ],
    "allowedExtensions": [".txt", ".md", ".json"],
    "maxFileSize": "10MB",
    "maxFiles": 1000
  }
}
```

### Network Security
```json
{
  "security": {
    "allowedHosts": [
      "api.github.com",
      "*.googleapis.com"
    ],
    "requireHttps": true,
    "certificateValidation": true,
    "proxy": {
      "http": "http://proxy.company.com:8080",
      "https": "http://proxy.company.com:8080"
    }
  }
}
```

## Health Monitoring

### Health Check Configuration
```json
{
  "healthCheck": {
    "enabled": true,
    "interval": 30,
    "timeout": 5,
    "retries": 3,
    "method": "ping",
    "endpoint": "/_health",
    "expectedStatus": 200,
    "failureThreshold": 3
  }
}
```

### Custom Health Checks
```json
{
  "healthCheck": {
    "enabled": true,
    "interval": 60,
    "custom": {
      "database": {
        "query": "SELECT 1",
        "timeout": 10
      },
      "api": {
        "endpoint": "/api/health",
        "expectedResponse": {"status": "ok"}
      }
    }
  }
}
```

## Performance Configuration

### Connection Pooling
```json
{
  "pool": {
    "enabled": true,
    "maxConnections": 10,
    "minConnections": 2,
    "idleTimeout": 300,
    "maxLifetime": 3600,
    "keepAlive": true
  }
}
```

### Caching
```json
{
  "cache": {
    "enabled": true,
    "provider": "memory",
    "maxSize": "100MB",
    "ttl": 300,
    "keyPrefix": "mcp:",
    "strategy": "lru"
  }
}
```

### Request Optimization
```json
{
  "optimization": {
    "compression": true,
    "keepAlive": true,
    "maxConcurrentRequests": 10,
    "requestTimeout": 30,
    "retryDelay": 1000,
    "exponentialBackoff": true
  }
}
```

## Error Handling and Resilience

### Retry Configuration
```json
{
  "retry": {
    "enabled": true,
    "maxAttempts": 3,
    "initialDelay": 1000,
    "maxDelay": 10000,
    "exponentialBackoff": true,
    "jitter": true,
    "retryableErrors": [
      "ECONNRESET",
      "ENOTFOUND",
      "TIMEOUT"
    ]
  }
}
```

### Circuit Breaker
```json
{
  "circuitBreaker": {
    "enabled": true,
    "failureThreshold": 5,
    "resetTimeout": 60000,
    "monitoringPeriod": 10000
  }
}
```

### Fallback Configuration
```json
{
  "fallback": {
    "enabled": true,
    "servers": [
      {
        "name": "backup-db",
        "command": "uvx",
        "args": ["mcp-server-postgres"],
        "env": {
          "DATABASE_URL": "${BACKUP_DATABASE_URL}"
        }
      }
    ],
    "failoverDelay": 5000,
    "healthCheckRequired": true
  }
}
```

## Logging Configuration

### Basic Logging
```json
{
  "logging": {
    "enabled": true,
    "level": "info",
    "format": "json",
    "output": "/var/log/mcp-server.log",
    "rotation": {
      "enabled": true,
      "maxSize": "100MB",
      "maxFiles": 10
    }
  }
}
```

### Structured Logging
```json
{
  "logging": {
    "enabled": true,
    "level": "debug",
    "structured": true,
    "fields": {
      "service": "mcp-server",
      "version": "1.0.0",
      "environment": "${NODE_ENV}"
    },
    "destinations": [
      {
        "type": "file",
        "path": "/var/log/mcp.log"
      },
      {
        "type": "elasticsearch",
        "host": "elasticsearch:9200",
        "index": "mcp-logs"
      }
    ]
  }
}
```

## Environment-Specific Configurations

### Development Configuration
```json
{
  "mcp": {
    "servers": [
      {
        "name": "dev-db",
        "command": "uvx",
        "args": ["mcp-server-sqlite", "./dev.db"],
        "autoStart": true,
        "logging": {
          "level": "debug"
        }
      },
      {
        "name": "local-fs",
        "command": "uvx",
        "args": ["mcp-server-filesystem", "."],
        "security": {
          "readOnly": false
        }
      }
    ]
  }
}
```

### Testing Configuration
```json
{
  "mcp": {
    "servers": [
      {
        "name": "test-db",
        "command": "uvx",
        "args": ["mcp-server-sqlite", ":memory:"],
        "env": {
          "NODE_ENV": "test"
        },
        "timeout": 10
      },
      {
        "name": "mock-api",
        "command": "uvx",
        "args": ["mcp-server-mock"],
        "env": {
          "MOCK_MODE": "true"
        }
      }
    ]
  }
}
```

### Production Configuration
```json
{
  "mcp": {
    "servers": [
      {
        "name": "prod-db",
        "command": "uvx",
        "args": ["mcp-server-postgres"],
        "env": {
          "DATABASE_URL": "${PROD_DATABASE_URL}"
        },
        "pool": {
          "maxConnections": 20
        },
        "healthCheck": {
          "enabled": true,
          "interval": 30
        },
        "security": {
          "readOnly": true,
          "requireHttps": true
        },
        "logging": {
          "level": "warn",
          "auditEnabled": true
        }
      }
    ]
  }
}
```

## Dynamic Configuration

### Configuration Providers
```json
{
  "mcp": {
    "configProvider": {
      "type": "consul",
      "endpoint": "http://consul:8500",
      "keyPrefix": "mcp/servers/",
      "watchChanges": true
    }
  }
}
```

### Environment-Based Selection
```json
{
  "mcp": {
    "servers": [
      {
        "name": "database",
        "command": "uvx",
        "args": ["mcp-server-postgres"],
        "env": {
          "DATABASE_URL": "${NODE_ENV === 'production' ? PROD_DB_URL : DEV_DB_URL}"
        }
      }
    ]
  }
}
```

## Configuration Validation

### Schema Validation
Claude Code validates MCP configurations against a JSON schema:

```bash
# Validate configuration
claude config validate --mcp

# Test MCP server connections
claude mcp test --all

# Show MCP server status
claude mcp status
```

### Common Validation Errors

#### Missing Required Fields
```
Error: MCP server configuration missing required field 'command'
Server: postgres-db
Fix: Add "command": "uvx" to server configuration
```

#### Invalid Environment Variables
```
Error: Environment variable 'DATABASE_URL' not found
Server: postgres-db
Fix: Set DATABASE_URL environment variable or provide default value
```

#### Connection Failures
```
Error: Failed to connect to MCP server 'api-client'
Cause: Connection timeout after 30 seconds
Fix: Check server availability or increase timeout value
```

## Configuration Templates

### Quick Start Templates
```bash
# Initialize with common MCP servers
claude mcp init --template web-dev
claude mcp init --template data-science
claude mcp init --template devops

# Add specific server types
claude mcp add postgres --template database
claude mcp add github --template git-integration
claude mcp add aws --template cloud-services
```

### Custom Templates
```json
{
  "templates": {
    "python-dev": {
      "description": "Python development environment",
      "servers": [
        {
          "name": "filesystem",
          "command": "uvx",
          "args": ["mcp-server-filesystem", "${PROJECT_ROOT}"]
        },
        {
          "name": "jupyter",
          "command": "uvx",
          "args": ["mcp-server-jupyter"]
        }
      ]
    }
  }
}
```

## Management Commands

### Server Lifecycle
```bash
# List configured servers
claude mcp list

# Start specific server
claude mcp start postgres-db

# Stop server
claude mcp stop postgres-db

# Restart server
claude mcp restart postgres-db

# Remove server
claude mcp remove old-server
```

### Configuration Management
```bash
# Show current configuration
claude mcp config show

# Add new server
claude mcp add github --command "uvx mcp-server-github"

# Update server configuration
claude mcp config set postgres-db.timeout 60

# Export configuration
claude mcp config export > mcp-config.json
```

## See Also

- [MCP Protocol Reference](protocol.md)
- [MCP Servers Reference](servers.md)
- [Building MCP Servers](building.md)
- [Configuration Schema](../configuration/schema.md)