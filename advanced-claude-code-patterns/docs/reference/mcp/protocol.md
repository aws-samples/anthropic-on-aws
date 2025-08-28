# MCP Protocol Reference

Complete reference for the Model Context Protocol (MCP) used by Claude Code.

## Protocol Overview

The Model Context Protocol (MCP) is a standardized way for AI assistants to securely connect to external data sources and services. Claude Code implements MCP to enable seamless integration with external tools, databases, APIs, and other resources.

### Key Concepts

- **MCP Server**: External service that provides data/functionality
- **MCP Client**: Claude Code acting as client to MCP servers
- **Transport**: Communication channel between client and server
- **Resources**: Data provided by MCP servers
- **Tools**: Functions exposed by MCP servers
- **Prompts**: Templates provided by MCP servers

## Transport Mechanisms

### Standard I/O Transport
Most common transport for local MCP servers.

```json
{
  "name": "filesystem",
  "command": "python",
  "args": ["-m", "mcp_server_filesystem"],
  "transport": "stdio"
}
```

**Characteristics:**
- Process-based communication
- Standard input/output streams
- Local execution only
- High performance for local services

### WebSocket Transport
For remote or web-based MCP servers.

```json
{
  "name": "remote-api",
  "url": "wss://api.example.com/mcp",
  "transport": "websocket",
  "auth": {
    "type": "bearer",
    "token": "${API_TOKEN}"
  }
}
```

**Characteristics:**
- Network-based communication
- Real-time bidirectional communication
- Supports remote services
- Requires network connectivity

### HTTP Transport
For REST API-style MCP servers.

```json
{
  "name": "rest-api",
  "baseUrl": "https://api.example.com/mcp",
  "transport": "http",
  "auth": {
    "type": "api_key",
    "header": "X-API-Key",
    "value": "${API_KEY}"
  }
}
```

**Characteristics:**
- Request/response pattern
- Standard HTTP methods
- Wide compatibility
- Stateless communication

## Message Protocol

### Message Structure
All MCP messages follow this structure:

```json
{
  "jsonrpc": "2.0",
  "id": "unique-id",
  "method": "method_name",
  "params": {
    "parameter": "value"
  }
}
```

### Response Structure
```json
{
  "jsonrpc": "2.0",
  "id": "unique-id",
  "result": {
    "data": "response data"
  }
}
```

### Error Structure
```json
{
  "jsonrpc": "2.0",
  "id": "unique-id",
  "error": {
    "code": -32000,
    "message": "Error description",
    "data": {
      "details": "Additional error information"
    }
  }
}
```

## Core Methods

### Initialization

#### initialize
Establish connection with MCP server.

```json
{
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "roots": {
        "listChanged": true
      },
      "sampling": {}
    },
    "clientInfo": {
      "name": "claude-code",
      "version": "2.1.0"
    }
  }
}
```

**Response:**
```json
{
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "logging": {},
      "prompts": {
        "listChanged": true
      },
      "resources": {
        "subscribe": true,
        "listChanged": true
      },
      "tools": {
        "listChanged": true
      }
    },
    "serverInfo": {
      "name": "mcp-server-filesystem",
      "version": "0.4.0"
    }
  }
}
```

#### initialized
Confirm initialization complete.

```json
{
  "method": "initialized",
  "params": {}
}
```

### Resource Management

#### resources/list
List available resources.

```json
{
  "method": "resources/list",
  "params": {}
}
```

**Response:**
```json
{
  "result": {
    "resources": [
      {
        "uri": "file:///path/to/file.txt",
        "name": "Configuration File",
        "description": "Application configuration",
        "mimeType": "text/plain"
      }
    ]
  }
}
```

#### resources/read
Read resource content.

```json
{
  "method": "resources/read",
  "params": {
    "uri": "file:///path/to/file.txt"
  }
}
```

**Response:**
```json
{
  "result": {
    "contents": [
      {
        "uri": "file:///path/to/file.txt",
        "mimeType": "text/plain",
        "text": "File content here"
      }
    ]
  }
}
```

#### resources/subscribe
Subscribe to resource changes.

```json
{
  "method": "resources/subscribe",
  "params": {
    "uri": "file:///path/to/file.txt"
  }
}
```

#### resources/unsubscribe
Unsubscribe from resource changes.

```json
{
  "method": "resources/unsubscribe",
  "params": {
    "uri": "file:///path/to/file.txt"
  }
}
```

### Tool Management

#### tools/list
List available tools.

```json
{
  "method": "tools/list",
  "params": {}
}
```

**Response:**
```json
{
  "result": {
    "tools": [
      {
        "name": "read_file",
        "description": "Read contents of a file",
        "inputSchema": {
          "type": "object",
          "properties": {
            "path": {
              "type": "string",
              "description": "Path to file"
            }
          },
          "required": ["path"]
        }
      }
    ]
  }
}
```

#### tools/call
Execute a tool.

```json
{
  "method": "tools/call",
  "params": {
    "name": "read_file",
    "arguments": {
      "path": "/path/to/file.txt"
    }
  }
}
```

**Response:**
```json
{
  "result": {
    "content": [
      {
        "type": "text",
        "text": "File content here"
      }
    ],
    "isError": false
  }
}
```

### Prompt Management

#### prompts/list
List available prompt templates.

```json
{
  "method": "prompts/list",
  "params": {}
}
```

**Response:**
```json
{
  "result": {
    "prompts": [
      {
        "name": "analyze_code",
        "description": "Analyze code for issues",
        "arguments": [
          {
            "name": "language",
            "description": "Programming language",
            "required": true
          }
        ]
      }
    ]
  }
}
```

#### prompts/get
Get prompt template.

```json
{
  "method": "prompts/get",
  "params": {
    "name": "analyze_code",
    "arguments": {
      "language": "python"
    }
  }
}
```

**Response:**
```json
{
  "result": {
    "description": "Code analysis prompt",
    "messages": [
      {
        "role": "user",
        "content": {
          "type": "text",
          "text": "Analyze this Python code for potential issues..."
        }
      }
    ]
  }
}
```

### Logging

#### logging/setLevel
Set logging level.

```json
{
  "method": "logging/setLevel",
  "params": {
    "level": "info"
  }
}
```

## Notification Methods

### Resource Updates

#### notifications/resources/updated
Resource has been updated.

```json
{
  "method": "notifications/resources/updated",
  "params": {
    "uri": "file:///path/to/file.txt"
  }
}
```

#### notifications/resources/list_changed
Resource list has changed.

```json
{
  "method": "notifications/resources/list_changed",
  "params": {}
}
```

### Tool Updates

#### notifications/tools/list_changed
Tool list has changed.

```json
{
  "method": "notifications/tools/list_changed",
  "params": {}
}
```

### Prompt Updates

#### notifications/prompts/list_changed
Prompt list has changed.

```json
{
  "method": "notifications/prompts/list_changed",
  "params": {}
}
```

## Error Codes

### Standard JSON-RPC Errors

| Code | Message | Description |
|------|---------|-------------|
| -32700 | Parse error | Invalid JSON |
| -32600 | Invalid Request | Invalid JSON-RPC request |
| -32601 | Method not found | Method does not exist |
| -32602 | Invalid params | Invalid method parameters |
| -32603 | Internal error | Internal JSON-RPC error |

### MCP-Specific Errors

| Code | Message | Description |
|------|---------|-------------|
| -32000 | Server error | Generic server error |
| -32001 | Resource not found | Requested resource not found |
| -32002 | Resource access denied | Access denied to resource |
| -32003 | Tool execution failed | Tool execution error |
| -32004 | Unsupported operation | Operation not supported |
| -32005 | Invalid resource URI | Malformed resource URI |

## Capability Negotiation

### Client Capabilities
```json
{
  "capabilities": {
    "roots": {
      "listChanged": true
    },
    "sampling": {}
  }
}
```

**Supported Client Capabilities:**
- `roots.listChanged`: Client can handle root list changes
- `sampling`: Client supports sampling

### Server Capabilities
```json
{
  "capabilities": {
    "logging": {},
    "prompts": {
      "listChanged": true
    },
    "resources": {
      "subscribe": true,
      "listChanged": true
    },
    "tools": {
      "listChanged": true
    }
  }
}
```

**Server Capability Types:**
- `logging`: Server supports logging
- `prompts`: Server provides prompt templates
- `resources`: Server provides resources
- `tools`: Server provides executable tools

## Authentication

### API Key Authentication
```json
{
  "auth": {
    "type": "api_key",
    "header": "X-API-Key",
    "value": "${API_KEY}"
  }
}
```

### Bearer Token Authentication
```json
{
  "auth": {
    "type": "bearer",
    "token": "${BEARER_TOKEN}"
  }
}
```

### Basic Authentication
```json
{
  "auth": {
    "type": "basic",
    "username": "${USERNAME}",
    "password": "${PASSWORD}"
  }
}
```

### OAuth 2.0 Authentication
```json
{
  "auth": {
    "type": "oauth2",
    "tokenUrl": "https://auth.example.com/token",
    "clientId": "${CLIENT_ID}",
    "clientSecret": "${CLIENT_SECRET}",
    "scope": "read write"
  }
}
```

## Security Considerations

### Input Validation
- All parameters validated against schema
- Path traversal protection for file operations
- SQL injection protection for database operations
- Command injection protection for shell operations

### Access Control
- Resource-level permissions
- Tool execution permissions
- Rate limiting per client
- Audit logging for all operations

### Data Protection
- Encryption in transit for network transports
- Secure credential storage
- Data sanitization in logs
- PII detection and handling

## Performance Optimization

### Connection Pooling
```json
{
  "pool": {
    "maxConnections": 10,
    "timeout": 30,
    "keepAlive": true
  }
}
```

### Caching
```json
{
  "cache": {
    "resources": {
      "ttl": 300,
      "maxSize": 1000
    },
    "tools": {
      "ttl": 3600,
      "maxSize": 100
    }
  }
}
```

### Batching
```json
{
  "method": "batch",
  "params": {
    "requests": [
      {
        "method": "resources/read",
        "params": {"uri": "file:///file1.txt"}
      },
      {
        "method": "resources/read", 
        "params": {"uri": "file:///file2.txt"}
      }
    ]
  }
}
```

## Protocol Extensions

### Custom Methods
MCP servers can implement custom methods:

```json
{
  "method": "custom/analyze_performance",
  "params": {
    "codebase": "/path/to/code",
    "metrics": ["complexity", "coverage"]
  }
}
```

### Custom Notifications
```json
{
  "method": "notifications/custom/deployment_status",
  "params": {
    "environment": "production",
    "status": "completed",
    "version": "1.2.3"
  }
}
```

## Debugging and Monitoring

### Debug Mode
Enable debug logging:

```json
{
  "debug": true,
  "logLevel": "debug",
  "traceRequests": true
}
```

### Health Checks
```json
{
  "method": "health/ping",
  "params": {}
}
```

Response:
```json
{
  "result": {
    "status": "healthy",
    "uptime": 3600,
    "version": "1.0.0"
  }
}
```

### Metrics
```json
{
  "method": "metrics/get",
  "params": {}
}
```

Response:
```json
{
  "result": {
    "requests_total": 1500,
    "requests_per_second": 2.5,
    "average_response_time": 120,
    "error_rate": 0.01
  }
}
```

## See Also

- [MCP Servers Reference](servers.md)
- [MCP Configuration](configuration.md)
- [Building MCP Servers](building.md)
- [Security Best Practices](../security/permission-schema.md)