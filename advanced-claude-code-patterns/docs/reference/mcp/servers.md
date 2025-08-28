# MCP Servers Reference

Complete reference for available MCP servers and their capabilities.

## Official MCP Servers

### Database Servers

#### PostgreSQL Server
Connect to PostgreSQL databases for data operations.

```json
{
  "name": "postgres",
  "command": "uvx",
  "args": ["mcp-server-postgres"],
  "env": {
    "DATABASE_URL": "postgresql://user:pass@localhost:5432/dbname"
  }
}
```

**Capabilities:**
- Execute SQL queries
- Schema introspection
- Table data access
- Transaction support

**Tools:**
- `query`: Execute SQL queries
- `describe_table`: Get table schema
- `list_tables`: List database tables

**Resources:**
- `postgres://table/{table_name}`: Table schema and sample data
- `postgres://query/{query_id}`: Saved query results

#### MySQL Server
Connect to MySQL databases.

```json
{
  "name": "mysql",
  "command": "uvx",
  "args": ["mcp-server-mysql"],
  "env": {
    "MYSQL_HOST": "localhost",
    "MYSQL_USER": "user",
    "MYSQL_PASSWORD": "password",
    "MYSQL_DATABASE": "dbname"
  }
}
```

**Capabilities:**
- SQL query execution
- Database schema access
- Stored procedure execution
- Connection pooling

#### SQLite Server
Work with SQLite database files.

```json
{
  "name": "sqlite",
  "command": "uvx",
  "args": ["mcp-server-sqlite", "/path/to/database.db"]
}
```

**Capabilities:**
- Local database access
- No external dependencies
- Full SQLite feature support
- File-based storage

### File System Servers

#### File System Server
Access local file system with security controls.

```json
{
  "name": "filesystem",
  "command": "uvx",
  "args": ["mcp-server-filesystem", "/allowed/path"]
}
```

**Capabilities:**
- Read file contents
- Write new files
- Create directories
- List directory contents
- File metadata access

**Tools:**
- `read_file`: Read file contents
- `write_file`: Write file contents
- `create_directory`: Create directories
- `list_directory`: List directory contents
- `move_file`: Move/rename files
- `delete_file`: Delete files

**Resources:**
- `file://{path}`: File contents and metadata

**Security Features:**
- Path restriction to allowed directories
- File type filtering
- Size limits
- Permission checks

#### Git Server
Interact with Git repositories.

```json
{
  "name": "git",
  "command": "uvx",
  "args": ["mcp-server-git", "/path/to/repo"]
}
```

**Capabilities:**
- Git repository access
- Commit history
- Branch management
- Diff generation

**Tools:**
- `git_log`: Get commit history
- `git_diff`: Show differences
- `git_show`: Show commit details
- `git_blame`: Show line-by-line authorship

### Web and API Servers

#### HTTP Server
Make HTTP requests to external APIs.

```json
{
  "name": "http",
  "command": "uvx",
  "args": ["mcp-server-http"],
  "env": {
    "ALLOWED_HOSTS": "api.example.com,api2.example.com"
  }
}
```

**Capabilities:**
- HTTP GET/POST/PUT/DELETE requests
- Header customization
- Response parsing
- Rate limiting

**Tools:**
- `http_get`: GET request
- `http_post`: POST request with body
- `http_put`: PUT request
- `http_delete`: DELETE request

**Security Features:**
- Host allowlist
- Request size limits
- Timeout controls
- Header filtering

#### GitHub Server
Interact with GitHub repositories and APIs.

```json
{
  "name": "github",
  "command": "uvx",
  "args": ["mcp-server-github"],
  "env": {
    "GITHUB_TOKEN": "${GITHUB_TOKEN}"
  }
}
```

**Capabilities:**
- Repository access
- Issue management
- Pull request operations
- User and organization data

**Tools:**
- `create_issue`: Create GitHub issue
- `list_issues`: List repository issues
- `get_pull_request`: Get PR details
- `create_pull_request`: Create new PR
- `search_repositories`: Search GitHub repos

**Resources:**
- `github://repo/{owner}/{repo}`: Repository information
- `github://issue/{owner}/{repo}/{number}`: Issue details
- `github://pr/{owner}/{repo}/{number}`: Pull request details

### Cloud Service Servers

#### AWS Server
Interact with Amazon Web Services.

```json
{
  "name": "aws",
  "command": "uvx",
  "args": ["mcp-server-aws"],
  "env": {
    "AWS_ACCESS_KEY_ID": "${AWS_ACCESS_KEY_ID}",
    "AWS_SECRET_ACCESS_KEY": "${AWS_SECRET_ACCESS_KEY}",
    "AWS_REGION": "us-east-1"
  }
}
```

**Capabilities:**
- S3 bucket operations
- EC2 instance management
- Lambda function access
- CloudWatch metrics

**Tools:**
- `s3_list_buckets`: List S3 buckets
- `s3_get_object`: Download S3 object
- `s3_put_object`: Upload S3 object
- `ec2_describe_instances`: List EC2 instances
- `lambda_invoke`: Invoke Lambda function

#### Google Cloud Server
Access Google Cloud Platform services.

```json
{
  "name": "gcp",
  "command": "uvx",
  "args": ["mcp-server-gcp"],
  "env": {
    "GOOGLE_APPLICATION_CREDENTIALS": "/path/to/credentials.json",
    "GOOGLE_CLOUD_PROJECT": "project-id"
  }
}
```

**Capabilities:**
- Cloud Storage access
- Compute Engine management
- BigQuery operations
- Cloud Functions

### Development Tool Servers

#### Docker Server
Manage Docker containers and images.

```json
{
  "name": "docker",
  "command": "uvx",
  "args": ["mcp-server-docker"],
  "env": {
    "DOCKER_HOST": "unix:///var/run/docker.sock"
  }
}
```

**Capabilities:**
- Container management
- Image operations
- Network inspection
- Volume management

**Tools:**
- `list_containers`: List running containers
- `inspect_container`: Get container details
- `start_container`: Start container
- `stop_container`: Stop container
- `list_images`: List Docker images
- `pull_image`: Pull image from registry

#### Kubernetes Server
Interact with Kubernetes clusters.

```json
{
  "name": "k8s",
  "command": "uvx",
  "args": ["mcp-server-kubernetes"],
  "env": {
    "KUBECONFIG": "/path/to/kubeconfig"
  }
}
```

**Capabilities:**
- Pod management
- Service discovery
- Deployment operations
- Resource monitoring

**Tools:**
- `get_pods`: List pods
- `describe_pod`: Get pod details
- `get_services`: List services
- `apply_manifest`: Apply Kubernetes manifest
- `delete_resource`: Delete Kubernetes resource

### Data Processing Servers

#### Jupyter Server
Execute code in Jupyter notebooks.

```json
{
  "name": "jupyter",
  "command": "uvx",
  "args": ["mcp-server-jupyter"],
  "env": {
    "JUPYTER_TOKEN": "${JUPYTER_TOKEN}"
  }
}
```

**Capabilities:**
- Code execution
- Notebook management
- Kernel operations
- Output capture

**Tools:**
- `execute_code`: Execute code in notebook
- `create_notebook`: Create new notebook
- `list_notebooks`: List available notebooks
- `get_notebook`: Get notebook contents

#### Pandas Server
Work with pandas DataFrames.

```json
{
  "name": "pandas",
  "command": "uvx",
  "args": ["mcp-server-pandas"]
}
```

**Capabilities:**
- DataFrame operations
- Data analysis
- Visualization
- Statistical operations

**Tools:**
- `read_csv`: Load CSV into DataFrame
- `dataframe_info`: Get DataFrame information
- `dataframe_describe`: Generate descriptive statistics
- `plot_data`: Create data visualizations

## Third-Party MCP Servers

### Productivity Servers

#### Notion Server
Access Notion databases and pages.

```json
{
  "name": "notion",
  "command": "notion-mcp-server",
  "env": {
    "NOTION_TOKEN": "${NOTION_TOKEN}"
  }
}
```

**Capabilities:**
- Database queries
- Page creation
- Block manipulation
- User management

#### Slack Server
Integrate with Slack workspaces.

```json
{
  "name": "slack",
  "command": "slack-mcp-server",
  "env": {
    "SLACK_BOT_TOKEN": "${SLACK_BOT_TOKEN}"
  }
}
```

**Capabilities:**
- Send messages
- Channel management
- User lookup
- File sharing

### Analytics Servers

#### Google Analytics Server
Access Google Analytics data.

```json
{
  "name": "ga",
  "command": "ga-mcp-server",
  "env": {
    "GA_CREDENTIALS": "/path/to/credentials.json",
    "GA_PROPERTY_ID": "12345"
  }
}
```

**Capabilities:**
- Traffic data
- User metrics
- Conversion tracking
- Custom reports

#### Elasticsearch Server
Search and analyze data in Elasticsearch.

```json
{
  "name": "elasticsearch",
  "command": "elasticsearch-mcp-server",
  "env": {
    "ES_HOST": "localhost:9200",
    "ES_USERNAME": "${ES_USERNAME}",
    "ES_PASSWORD": "${ES_PASSWORD}"
  }
}
```

**Capabilities:**
- Document search
- Index management
- Aggregation queries
- Mapping operations

## Server Configuration Patterns

### Environment-Specific Configuration

#### Development Environment
```json
{
  "mcp": {
    "servers": [
      {
        "name": "dev-db",
        "command": "uvx",
        "args": ["mcp-server-postgres"],
        "env": {
          "DATABASE_URL": "postgresql://dev:dev@localhost:5432/myapp_dev"
        }
      },
      {
        "name": "local-fs",
        "command": "uvx",
        "args": ["mcp-server-filesystem", "/home/user/projects"]
      }
    ]
  }
}
```

#### Production Environment
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
        }
      },
      {
        "name": "s3-storage",
        "command": "uvx",
        "args": ["mcp-server-aws"],
        "env": {
          "AWS_ACCESS_KEY_ID": "${AWS_ACCESS_KEY_ID}",
          "AWS_SECRET_ACCESS_KEY": "${AWS_SECRET_ACCESS_KEY}",
          "AWS_REGION": "us-west-2"
        }
      }
    ]
  }
}
```

### Security Configuration

#### Restricted Access
```json
{
  "name": "secure-fs",
  "command": "uvx",
  "args": ["mcp-server-filesystem", "/restricted/path"],
  "env": {
    "MCP_SECURITY_MODE": "strict",
    "ALLOWED_EXTENSIONS": ".txt,.md,.json",
    "MAX_FILE_SIZE": "10MB"
  },
  "security": {
    "readOnly": true,
    "pathWhitelist": ["/restricted/path/public"],
    "requireAuth": true
  }
}
```

#### Audit Logging
```json
{
  "name": "audited-db",
  "command": "uvx",
  "args": ["mcp-server-postgres"],
  "env": {
    "DATABASE_URL": "${DATABASE_URL}",
    "AUDIT_LOG": "true",
    "LOG_QUERIES": "true"
  },
  "logging": {
    "level": "info",
    "auditFile": "/var/log/mcp-audit.log"
  }
}
```

## Performance Optimization

### Connection Pooling
```json
{
  "name": "pooled-db",
  "command": "uvx",
  "args": ["mcp-server-postgres"],
  "env": {
    "DATABASE_URL": "${DATABASE_URL}",
    "POOL_SIZE": "10",
    "POOL_TIMEOUT": "30"
  },
  "pool": {
    "maxConnections": 5,
    "idleTimeout": 300,
    "keepAlive": true
  }
}
```

### Caching Configuration
```json
{
  "name": "cached-api",
  "command": "uvx",
  "args": ["mcp-server-http"],
  "cache": {
    "enabled": true,
    "ttl": 300,
    "maxSize": "100MB",
    "strategy": "lru"
  }
}
```

### Resource Limits
```json
{
  "name": "limited-server",
  "command": "uvx",
  "args": ["mcp-server-custom"],
  "limits": {
    "memory": "512MB",
    "cpu": "0.5",
    "timeout": 30,
    "maxRequests": 1000
  }
}
```

## Health Monitoring

### Health Check Configuration
```json
{
  "name": "monitored-db",
  "command": "uvx",
  "args": ["mcp-server-postgres"],
  "healthCheck": {
    "enabled": true,
    "interval": 30,
    "timeout": 5,
    "retries": 3,
    "endpoint": "/_health"
  }
}
```

### Metrics Collection
```json
{
  "name": "metrics-server",
  "command": "uvx",
  "args": ["mcp-server-custom"],
  "metrics": {
    "enabled": true,
    "endpoint": "/_metrics",
    "interval": 60,
    "prometheus": true
  }
}
```

## Error Handling

### Retry Configuration
```json
{
  "name": "resilient-api",
  "command": "uvx",
  "args": ["mcp-server-http"],
  "retry": {
    "enabled": true,
    "maxAttempts": 3,
    "backoffMs": 1000,
    "exponential": true
  }
}
```

### Fallback Servers
```json
{
  "mcp": {
    "servers": [
      {
        "name": "primary-db",
        "command": "uvx",
        "args": ["mcp-server-postgres"],
        "env": {
          "DATABASE_URL": "${PRIMARY_DB_URL}"
        }
      },
      {
        "name": "fallback-db",
        "command": "uvx",
        "args": ["mcp-server-postgres"],
        "env": {
          "DATABASE_URL": "${FALLBACK_DB_URL}"
        },
        "fallbackFor": "primary-db"
      }
    ]
  }
}
```

## Development and Testing

### Local Development
```json
{
  "name": "dev-server",
  "command": "python",
  "args": ["-m", "my_mcp_server"],
  "env": {
    "DEBUG": "true",
    "LOG_LEVEL": "debug"
  },
  "autoRestart": true,
  "workingDirectory": "/path/to/server"
}
```

### Testing Configuration
```json
{
  "name": "test-server",
  "command": "python",
  "args": ["-m", "pytest", "--mcp-mode"],
  "env": {
    "TESTING": "true",
    "MOCK_EXTERNAL_APIS": "true"
  },
  "timeout": 60
}
```

## Server Discovery

### Automatic Discovery
Claude Code can automatically discover MCP servers:

1. **Registry**: Check official MCP server registry
2. **Local**: Scan for installed MCP packages
3. **Environment**: Check environment variables
4. **Configuration**: Read from configuration files

### Manual Registration
```bash
# Install MCP server
uvx install mcp-server-postgres

# Register with Claude Code
claude mcp add postgres --auto-configure

# Test connection
claude mcp test postgres
```

## Security Considerations

### Access Control
- Server-level permissions
- Resource-specific access rules
- Tool execution limits
- Network access restrictions

### Data Protection
- Encryption in transit
- Credential management
- Data sanitization
- Audit logging

### Isolation
- Process isolation
- Network segmentation
- Resource limits
- Sandboxing

## See Also

- [MCP Protocol Reference](protocol.md)
- [MCP Configuration](configuration.md)
- [Building MCP Servers](building.md)
- [Security Best Practices](../security/permission-schema.md)