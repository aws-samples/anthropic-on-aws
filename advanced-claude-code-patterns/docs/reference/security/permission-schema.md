# Permission Schema Reference

Complete specification for Claude Code permission configurations.

## Schema Overview

Claude Code permissions are configured using JSON schema with the following top-level structure:

```json
{
  "name": "string",
  "description": "string", 
  "permissions": {
    "file_access": { /* FileAccessConfig */ },
    "network_access": { /* NetworkAccessConfig */ },
    "tool_permissions": { /* ToolPermissionsConfig */ },
    "agent_permissions": { /* AgentPermissionsConfig */ }
  },
  "security_policies": { /* SecurityPoliciesConfig */ }
}
```

## File Access Configuration

### FileAccessConfig

```typescript
interface FileAccessConfig {
  allowed_paths: string[];           // Paths Claude can access
  denied_paths: string[];            // Explicitly blocked paths  
  read_only_paths: string[];         // Read-only access paths
  max_file_size_mb?: number;         // Maximum file size limit
  allowed_extensions?: string[];      // Permitted file extensions
  blocked_patterns?: string[];        // Blocked file patterns
}
```

### Path Variables

The following variables can be used in path configurations:

| Variable | Description | Example |
|----------|-------------|---------|
| `${project_root}` | Current project directory | `/home/user/myproject` |
| `${home}` | User home directory | `/home/user` |
| `${workspace}` | Current workspace | `/home/user/workspace` |
| `${temp}` | Temporary directory | `/tmp` |

### Example Configuration

```json
{
  "file_access": {
    "allowed_paths": [
      "${project_root}/src",
      "${project_root}/tests", 
      "${project_root}/docs",
      "${project_root}/scripts"
    ],
    "denied_paths": [
      "${project_root}/.env",
      "${project_root}/.env.*",
      "${project_root}/secrets",
      "${project_root}/.git/config",
      "${home}/.ssh",
      "${home}/.aws"
    ],
    "read_only_paths": [
      "${project_root}/vendor",
      "${project_root}/node_modules",
      "${project_root}/.git"
    ],
    "max_file_size_mb": 10,
    "allowed_extensions": [
      ".py", ".js", ".ts", ".jsx", ".tsx",
      ".md", ".txt", ".json", ".yaml", ".yml",
      ".css", ".scss", ".html", ".xml"
    ],
    "blocked_patterns": [
      "*.exe", "*.dll", "*.so", "*.dylib",
      "*.key", "*.pem", "*.p12", "*.pfx",
      "core.*", "*.dump"
    ]
  }
}
```

## Network Access Configuration

### NetworkAccessConfig

```typescript
interface NetworkAccessConfig {
  allowed_domains: string[];         // Permitted domains
  blocked_domains: string[];         // Blocked domains
  require_https: boolean;            // Force HTTPS only
  timeout_seconds?: number;          // Request timeout
  max_redirects?: number;            // Maximum redirects
  user_agent?: string;               // Custom user agent
  proxy_config?: ProxyConfig;        // Proxy settings
}
```

### ProxyConfig

```typescript
interface ProxyConfig {
  http_proxy?: string;               // HTTP proxy URL
  https_proxy?: string;              // HTTPS proxy URL  
  no_proxy?: string[];               // Domains to bypass proxy
}
```

### Domain Patterns

Domain configurations support wildcards and patterns:

| Pattern | Matches | Example |
|---------|---------|---------|
| `example.com` | Exact domain | `example.com` |
| `*.example.com` | Subdomains | `api.example.com`, `www.example.com` |
| `**.example.com` | All subdomains | `deep.nested.example.com` |
| `*.local` | Local domains | `app.local`, `dev.local` |

### Example Configuration

```json
{
  "network_access": {
    "allowed_domains": [
      "github.com",
      "*.github.com", 
      "api.github.com",
      "docs.anthropic.com",
      "pypi.org",
      "*.pypi.org",
      "npmjs.com",
      "registry.npmjs.org",
      "stackoverflow.com"
    ],
    "blocked_domains": [
      "*.onion",
      "*.local",
      "localhost",
      "127.0.0.1",
      "malicious-site.com"
    ],
    "require_https": true,
    "timeout_seconds": 30,
    "max_redirects": 5,
    "user_agent": "Claude-Code/1.0",
    "proxy_config": {
      "http_proxy": "http://proxy.company.com:8080",
      "https_proxy": "http://proxy.company.com:8080",
      "no_proxy": ["localhost", "127.0.0.1", "*.local"]
    }
  }
}
```

## Tool Permissions Configuration

### ToolPermissionsConfig

```typescript
interface ToolPermissionsConfig {
  bash?: BashPermissions;            // Bash command permissions
  write?: WritePermissions;          // File write permissions
  read?: ReadPermissions;            // File read permissions
  search?: SearchPermissions;        // Search tool permissions
}
```

### BashPermissions

```typescript
interface BashPermissions {
  allowed_commands: string[];        // Permitted commands
  blocked_commands: string[];        // Explicitly blocked commands
  require_confirmation: string[];    // Commands requiring approval
  timeout_seconds?: number;          // Command timeout
  working_directory?: string;        // Restrict working directory
}
```

### WritePermissions

```typescript
interface WritePermissions {
  max_file_size_mb: number;         // Maximum file size
  allowed_extensions: string[];      // Permitted extensions
  blocked_patterns: string[];        // Blocked file patterns
  backup_on_overwrite?: boolean;     // Create backups
  require_confirmation?: string[];   // Patterns requiring approval
}
```

### Example Configuration

```json
{
  "tool_permissions": {
    "bash": {
      "allowed_commands": [
        "git", "npm", "pip", "python", "node",
        "pytest", "jest", "docker", "kubectl",
        "ls", "cat", "grep", "find", "sort"
      ],
      "blocked_commands": [
        "rm -rf /", "sudo", "su", "chmod 777",
        "mkfs", "fdisk", "dd", "format",
        "shutdown", "reboot", "halt"
      ],
      "require_confirmation": [
        "git push", "npm publish", "docker push",
        "kubectl delete", "git reset --hard",
        "git push --force"
      ],
      "timeout_seconds": 300,
      "working_directory": "${project_root}"
    },
    "write": {
      "max_file_size_mb": 10,
      "allowed_extensions": [
        ".py", ".js", ".ts", ".jsx", ".tsx",
        ".md", ".txt", ".json", ".yaml", ".yml"
      ],
      "blocked_patterns": [
        "*.exe", "*.dll", "*.so",
        "*.key", "*.pem", "*.p12"
      ],
      "backup_on_overwrite": true,
      "require_confirmation": [
        "*.env", ".env.*", "package.json",
        "requirements.txt", "Dockerfile"
      ]
    }
  }
}
```

## Agent Permissions Configuration

### AgentPermissionsConfig

```typescript
interface AgentPermissionsConfig {
  model_selection?: ModelSelectionConfig;     // Model access controls
  parallel_execution?: ParallelExecutionConfig; // Concurrency limits
  resource_limits?: ResourceLimitsConfig;     // Resource constraints
}
```

### ModelSelectionConfig

```typescript
interface ModelSelectionConfig {
  allowed_models: string[];          // Permitted models
  default_model: string;             // Default model choice
  require_approval_for_opus?: boolean; // Opus approval required
  cost_limits?: CostLimitsConfig;    // Cost constraints
}
```

### ParallelExecutionConfig

```typescript
interface ParallelExecutionConfig {
  max_concurrent_agents: number;     // Maximum parallel agents
  timeout_seconds: number;           // Agent timeout
  memory_limit_mb?: number;          // Memory limit per agent
}
```

### Example Configuration

```json
{
  "agent_permissions": {
    "model_selection": {
      "allowed_models": ["sonnet", "opus", "haiku"],
      "default_model": "sonnet", 
      "require_approval_for_opus": true,
      "cost_limits": {
        "daily_budget_usd": 50,
        "monthly_budget_usd": 500,
        "per_request_limit_usd": 5
      }
    },
    "parallel_execution": {
      "max_concurrent_agents": 3,
      "timeout_seconds": 300,
      "memory_limit_mb": 1024
    },
    "resource_limits": {
      "max_file_reads_per_session": 100,
      "max_file_writes_per_session": 50,
      "max_network_requests_per_session": 20,
      "session_timeout_minutes": 60
    }
  }
}
```

## Security Policies Configuration

### SecurityPoliciesConfig

```typescript
interface SecurityPoliciesConfig {
  prevent_secrets_exposure?: boolean;        // Block secret commits
  scan_for_vulnerabilities?: boolean;       // Vulnerability scanning
  enforce_secure_coding?: boolean;          // Secure coding checks
  audit_logging?: boolean;                  // Enable audit logs
  secrets_detection?: SecretsDetectionConfig; // Secrets detection
  vulnerability_scanning?: VulnScanConfig;   // Vuln scan settings
}
```

### SecretsDetectionConfig

```typescript
interface SecretsDetectionConfig {
  enabled: boolean;                 // Enable secrets detection
  tools: string[];                  // Detection tools to use
  block_on_detection: boolean;      // Block on secret found
  alert_on_detection: boolean;      // Alert on secret found
  custom_patterns?: string[];       // Custom regex patterns
  exclude_patterns?: string[];      // Patterns to ignore
}
```

### Example Configuration

```json
{
  "security_policies": {
    "prevent_secrets_exposure": true,
    "scan_for_vulnerabilities": true,
    "enforce_secure_coding": true,
    "audit_logging": true,
    "secrets_detection": {
      "enabled": true,
      "tools": ["detect-secrets", "truffleHog"],
      "block_on_detection": true,
      "alert_on_detection": true,
      "custom_patterns": [
        "sk-[a-zA-Z0-9]{48}",
        "pk_[a-zA-Z0-9]{24}"
      ],
      "exclude_patterns": [
        "test_key_.*",
        "example_.*"
      ]
    },
    "vulnerability_scanning": {
      "enabled": true,
      "tools": ["safety", "bandit", "npm-audit"],
      "severity_threshold": "medium",
      "block_on_high": true,
      "scan_dependencies": true
    }
  }
}
```

## Permission Levels

### Predefined Permission Levels

Claude Code provides predefined permission levels:

#### Restricted (Level 1)
```json
{
  "level": "restricted",
  "description": "Minimal permissions for sensitive environments",
  "permissions": {
    "file_access": {
      "allowed_paths": ["${project_root}"],
      "read_only_paths": ["${project_root}"]
    },
    "network_access": {
      "allowed_domains": [],
      "blocked_domains": ["*"]
    },
    "tool_permissions": {
      "bash": {
        "allowed_commands": [],
        "blocked_commands": ["*"]
      }
    }
  }
}
```

#### Standard (Level 2)
```json
{
  "level": "standard", 
  "description": "Balanced permissions for development",
  "permissions": {
    "file_access": {
      "allowed_paths": [
        "${project_root}/src",
        "${project_root}/tests",
        "${project_root}/docs"
      ]
    },
    "network_access": {
      "allowed_domains": [
        "github.com", "pypi.org", "npmjs.com"
      ],
      "require_https": true
    }
  }
}
```

#### Extended (Level 3)
```json
{
  "level": "extended",
  "description": "Broad permissions for active development",
  "permissions": {
    "file_access": {
      "allowed_paths": ["${project_root}"],
      "denied_paths": [".env", "secrets/"]
    },
    "tool_permissions": {
      "bash": {
        "allowed_commands": [
          "git", "npm", "pip", "python", "docker"
        ]
      }
    }
  }
}
```

#### Trusted (Level 4)
```json
{
  "level": "trusted",
  "description": "Full permissions with safety guards",
  "permissions": {
    "file_access": {
      "allowed_paths": ["${home}"],
      "denied_paths": [
        "${home}/.ssh/id_rsa",
        "${home}/.aws/credentials"
      ]
    },
    "network_access": {
      "allowed_domains": ["*"],
      "blocked_domains": ["*.onion"]
    }
  }
}
```

## Validation Rules

### Configuration Validation

All permission configurations must pass validation:

1. **Path Validation**: All paths must be absolute or use valid variables
2. **Domain Validation**: Domains must be valid hostnames or patterns
3. **Command Validation**: Commands must not conflict between allowed/blocked
4. **Resource Limits**: Numeric limits must be positive integers
5. **Schema Compliance**: Configuration must match the JSON schema

### Error Handling

Invalid configurations result in specific error types:

| Error Type | Description | Example |
|------------|-------------|---------|
| `InvalidPathError` | Invalid file path | Relative path used |
| `InvalidDomainError` | Invalid domain pattern | Invalid regex |
| `ConflictingRulesError` | Contradictory rules | Same command allowed and blocked |
| `InvalidResourceLimitError` | Invalid resource limit | Negative timeout |
| `SchemaValidationError` | Schema validation failed | Missing required field |

## Environment-Specific Configurations

### Development Environment

```json
{
  "name": "development-permissions",
  "permissions": {
    "file_access": {
      "allowed_paths": ["${project_root}"],
      "denied_paths": [".env.production"]
    },
    "network_access": {
      "allowed_domains": ["*"],
      "require_https": false
    }
  }
}
```

### Testing Environment

```json
{
  "name": "testing-permissions", 
  "permissions": {
    "file_access": {
      "allowed_paths": [
        "${project_root}/src",
        "${project_root}/tests"
      ],
      "read_only_paths": ["${project_root}/src"]
    },
    "network_access": {
      "blocked_domains": ["*"]
    }
  }
}
```

### Production Environment

```json
{
  "name": "production-permissions",
  "permissions": {
    "file_access": {
      "allowed_paths": [
        "${project_root}/src",
        "${project_root}/config"
      ],
      "denied_paths": [
        "**/test/**",
        "**/tests/**"
      ]
    },
    "tool_permissions": {
      "bash": {
        "require_confirmation": ["*"]
      }
    }
  }
}
```