# Building MCP Servers

Complete guide for building custom MCP servers for Claude Code.

## MCP Server Architecture

### Core Components

#### Server Interface
Every MCP server must implement the basic server interface:

```python
from mcp import Server, types
from mcp.server.models import InitializationOptions
import mcp.server.stdio

class CustomMCPServer:
    def __init__(self):
        self.server = Server("custom-server")
        self.setup_handlers()
    
    def setup_handlers(self):
        # Register initialization handler
        @self.server.initialize()
        async def initialize(params: InitializationOptions) -> types.InitializeResult:
            return types.InitializeResult(
                protocol_version="2024-11-05",
                capabilities=types.ServerCapabilities(
                    resources=types.ResourcesCapability(),
                    tools=types.ToolsCapability(),
                    prompts=types.PromptsCapability()
                ),
                server_info=types.ServerInfo(
                    name="custom-server",
                    version="1.0.0"
                )
            )
```

#### Resource Providers
Expose data as resources:

```python
@self.server.list_resources()
async def list_resources() -> list[types.Resource]:
    return [
        types.Resource(
            uri="custom://data/users",
            name="Users Database",
            description="User account information",
            mimeType="application/json"
        )
    ]

@self.server.read_resource()
async def read_resource(uri: str) -> str:
    if uri == "custom://data/users":
        # Return user data
        return json.dumps(await get_users())
    else:
        raise ValueError(f"Unknown resource: {uri}")
```

#### Tool Providers
Expose functionality as tools:

```python
@self.server.list_tools()
async def list_tools() -> list[types.Tool]:
    return [
        types.Tool(
            name="create_user",
            description="Create a new user account",
            inputSchema={
                "type": "object",
                "properties": {
                    "username": {"type": "string"},
                    "email": {"type": "string"},
                    "role": {"type": "string", "enum": ["user", "admin"]}
                },
                "required": ["username", "email"]
            }
        )
    ]

@self.server.call_tool()
async def call_tool(name: str, arguments: dict) -> types.CallToolResult:
    if name == "create_user":
        result = await create_user_account(
            username=arguments["username"],
            email=arguments["email"],
            role=arguments.get("role", "user")
        )
        return types.CallToolResult(
            content=[
                types.TextContent(
                    type="text",
                    text=f"Created user: {result['username']}"
                )
            ]
        )
    else:
        raise ValueError(f"Unknown tool: {name}")
```

## Development Setup

### Python MCP Server

#### Project Structure
```
my-mcp-server/
├── src/
│   └── my_mcp_server/
│       ├── __init__.py
│       ├── server.py
│       ├── resources/
│       │   ├── __init__.py
│       │   └── data_provider.py
│       └── tools/
│           ├── __init__.py
│           └── operations.py
├── tests/
├── pyproject.toml
├── README.md
└── requirements.txt
```

#### pyproject.toml
```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "my-mcp-server"
version = "1.0.0"
description = "Custom MCP server for my application"
dependencies = [
    "mcp>=0.5.0",
    "asyncio",
    "aiohttp",
    "pydantic"
]

[project.scripts]
my-mcp-server = "my_mcp_server.server:main"

[project.optional-dependencies]
dev = [
    "pytest",
    "pytest-asyncio",
    "black",
    "ruff"
]
```

#### Main Server Implementation
```python
# src/my_mcp_server/server.py
import asyncio
import json
from typing import Any, Dict, List
from mcp import Server, types
from mcp.server.models import InitializationOptions
import mcp.server.stdio

from .resources.data_provider import DataProvider
from .tools.operations import OperationsHandler

class MyMCPServer:
    def __init__(self):
        self.server = Server("my-mcp-server")
        self.data_provider = DataProvider()
        self.operations = OperationsHandler()
        self.setup_handlers()
    
    def setup_handlers(self):
        @self.server.initialize()
        async def initialize(params: InitializationOptions) -> types.InitializeResult:
            return types.InitializeResult(
                protocol_version="2024-11-05",
                capabilities=types.ServerCapabilities(
                    resources=types.ResourcesCapability(
                        subscribe=True,
                        listChanged=True
                    ),
                    tools=types.ToolsCapability(
                        listChanged=True
                    ),
                    prompts=types.PromptsCapability(
                        listChanged=True
                    ),
                    logging=types.LoggingCapability()
                ),
                server_info=types.ServerInfo(
                    name="my-mcp-server",
                    version="1.0.0"
                )
            )
        
        # Resource handlers
        @self.server.list_resources()
        async def list_resources() -> List[types.Resource]:
            return await self.data_provider.list_resources()
        
        @self.server.read_resource()
        async def read_resource(uri: str) -> str:
            return await self.data_provider.read_resource(uri)
        
        # Tool handlers
        @self.server.list_tools()
        async def list_tools() -> List[types.Tool]:
            return await self.operations.list_tools()
        
        @self.server.call_tool()
        async def call_tool(name: str, arguments: Dict[str, Any]) -> types.CallToolResult:
            return await self.operations.call_tool(name, arguments)
        
        # Prompt handlers
        @self.server.list_prompts()
        async def list_prompts() -> List[types.Prompt]:
            return [
                types.Prompt(
                    name="analyze_data",
                    description="Analyze dataset for insights",
                    arguments=[
                        types.PromptArgument(
                            name="dataset",
                            description="Dataset identifier",
                            required=True
                        )
                    ]
                )
            ]
        
        @self.server.get_prompt()
        async def get_prompt(name: str, arguments: Dict[str, str]) -> types.GetPromptResult:
            if name == "analyze_data":
                dataset_info = await self.data_provider.get_dataset_info(
                    arguments["dataset"]
                )
                return types.GetPromptResult(
                    description="Data analysis prompt",
                    messages=[
                        types.PromptMessage(
                            role="user",
                            content=types.TextContent(
                                type="text",
                                text=f"Analyze this dataset: {dataset_info}"
                            )
                        )
                    ]
                )

async def main():
    server = MyMCPServer()
    async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
        await server.server.run(
            read_stream,
            write_stream,
            server.server.create_initialization_options()
        )

if __name__ == "__main__":
    asyncio.run(main())
```

#### Resource Provider
```python
# src/my_mcp_server/resources/data_provider.py
import json
from typing import List
from mcp import types

class DataProvider:
    def __init__(self):
        self.data_sources = {
            "users": self._get_users_data,
            "products": self._get_products_data,
            "orders": self._get_orders_data
        }
    
    async def list_resources(self) -> List[types.Resource]:
        resources = []
        for source_name in self.data_sources:
            resources.append(
                types.Resource(
                    uri=f"custom://data/{source_name}",
                    name=f"{source_name.title()} Data",
                    description=f"Access to {source_name} information",
                    mimeType="application/json"
                )
            )
        return resources
    
    async def read_resource(self, uri: str) -> str:
        # Parse URI to extract data source
        if not uri.startswith("custom://data/"):
            raise ValueError(f"Unsupported URI scheme: {uri}")
        
        source_name = uri.replace("custom://data/", "")
        
        if source_name not in self.data_sources:
            raise ValueError(f"Unknown data source: {source_name}")
        
        data = await self.data_sources[source_name]()
        return json.dumps(data, indent=2)
    
    async def get_dataset_info(self, dataset_id: str) -> dict:
        # Return metadata about dataset
        return {
            "id": dataset_id,
            "rows": 1000,
            "columns": ["id", "name", "email", "created_at"],
            "size": "2.5MB"
        }
    
    async def _get_users_data(self) -> dict:
        # Simulate database query
        return {
            "users": [
                {"id": 1, "name": "Alice", "email": "alice@example.com"},
                {"id": 2, "name": "Bob", "email": "bob@example.com"}
            ],
            "total": 2
        }
    
    async def _get_products_data(self) -> dict:
        return {
            "products": [
                {"id": 1, "name": "Widget", "price": 19.99},
                {"id": 2, "name": "Gadget", "price": 29.99}
            ],
            "total": 2
        }
    
    async def _get_orders_data(self) -> dict:
        return {
            "orders": [
                {"id": 1, "user_id": 1, "product_id": 1, "quantity": 2},
                {"id": 2, "user_id": 2, "product_id": 2, "quantity": 1}
            ],
            "total": 2
        }
```

#### Tools Handler
```python
# src/my_mcp_server/tools/operations.py
from typing import Any, Dict, List
from mcp import types

class OperationsHandler:
    def __init__(self):
        self.tools = {
            "create_user": {
                "handler": self._create_user,
                "schema": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string"},
                        "email": {"type": "string", "format": "email"},
                        "role": {"type": "string", "enum": ["user", "admin"]}
                    },
                    "required": ["name", "email"]
                }
            },
            "update_user": {
                "handler": self._update_user,
                "schema": {
                    "type": "object",
                    "properties": {
                        "user_id": {"type": "integer"},
                        "name": {"type": "string"},
                        "email": {"type": "string", "format": "email"}
                    },
                    "required": ["user_id"]
                }
            },
            "delete_user": {
                "handler": self._delete_user,
                "schema": {
                    "type": "object",
                    "properties": {
                        "user_id": {"type": "integer"}
                    },
                    "required": ["user_id"]
                }
            }
        }
    
    async def list_tools(self) -> List[types.Tool]:
        tools = []
        for tool_name, tool_config in self.tools.items():
            tools.append(
                types.Tool(
                    name=tool_name,
                    description=f"Tool for {tool_name.replace('_', ' ')}",
                    inputSchema=tool_config["schema"]
                )
            )
        return tools
    
    async def call_tool(self, name: str, arguments: Dict[str, Any]) -> types.CallToolResult:
        if name not in self.tools:
            raise ValueError(f"Unknown tool: {name}")
        
        try:
            result = await self.tools[name]["handler"](arguments)
            return types.CallToolResult(
                content=[
                    types.TextContent(
                        type="text",
                        text=str(result)
                    )
                ]
            )
        except Exception as e:
            return types.CallToolResult(
                content=[
                    types.TextContent(
                        type="text",
                        text=f"Error: {str(e)}"
                    )
                ],
                isError=True
            )
    
    async def _create_user(self, args: Dict[str, Any]) -> dict:
        # Simulate user creation
        user_id = hash(args["email"]) % 10000
        return {
            "id": user_id,
            "name": args["name"],
            "email": args["email"],
            "role": args.get("role", "user"),
            "status": "created"
        }
    
    async def _update_user(self, args: Dict[str, Any]) -> dict:
        # Simulate user update
        return {
            "id": args["user_id"],
            "updated_fields": {k: v for k, v in args.items() if k != "user_id"},
            "status": "updated"
        }
    
    async def _delete_user(self, args: Dict[str, Any]) -> dict:
        # Simulate user deletion
        return {
            "id": args["user_id"],
            "status": "deleted"
        }
```

### Node.js MCP Server

#### package.json
```json
{
  "name": "my-mcp-server",
  "version": "1.0.0",
  "description": "Custom MCP server implementation",
  "main": "dist/index.js",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsx watch src/index.ts",
    "test": "jest"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "tsx": "^4.0.0",
    "jest": "^29.0.0"
  },
  "bin": {
    "my-mcp-server": "./dist/index.js"
  }
}
```

#### TypeScript Implementation
```typescript
// src/index.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  InitializeRequest,
  InitializeRequestSchema,
  ListResourcesRequest,
  ListResourcesRequestSchema,
  ReadResourceRequest,
  ReadResourceRequestSchema,
  ListToolsRequest,
  ListToolsRequestSchema,
  CallToolRequest,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

class MyMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'my-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          resources: {
            subscribe: true,
            listChanged: true,
          },
          tools: {
            listChanged: true,
          },
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // Initialize handler
    this.server.setRequestHandler(
      InitializeRequestSchema,
      async (request: InitializeRequest) => {
        return {
          protocolVersion: '2024-11-05',
          capabilities: {
            resources: {
              subscribe: true,
              listChanged: true,
            },
            tools: {
              listChanged: true,
            },
          },
          serverInfo: {
            name: 'my-mcp-server',
            version: '1.0.0',
          },
        };
      }
    );

    // Resource handlers
    this.server.setRequestHandler(
      ListResourcesRequestSchema,
      async (request: ListResourcesRequest) => {
        return {
          resources: [
            {
              uri: 'myserver://data/users',
              name: 'Users',
              description: 'User database',
              mimeType: 'application/json',
            },
          ],
        };
      }
    );

    this.server.setRequestHandler(
      ReadResourceRequestSchema,
      async (request: ReadResourceRequest) => {
        const { uri } = request.params;
        
        if (uri === 'myserver://data/users') {
          const users = await this.getUsers();
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(users, null, 2),
              },
            ],
          };
        }
        
        throw new Error(`Unknown resource: ${uri}`);
      }
    );

    // Tool handlers
    this.server.setRequestHandler(
      ListToolsRequestSchema,
      async (request: ListToolsRequest) => {
        return {
          tools: [
            {
              name: 'create_user',
              description: 'Create a new user',
              inputSchema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                },
                required: ['name', 'email'],
              },
            },
          ],
        };
      }
    );

    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request: CallToolRequest) => {
        const { name, arguments: args } = request.params;
        
        if (name === 'create_user') {
          const result = await this.createUser(args as any);
          return {
            content: [
              {
                type: 'text',
                text: `Created user: ${result.name}`,
              },
            ],
          };
        }
        
        throw new Error(`Unknown tool: ${name}`);
      }
    );
  }

  private async getUsers() {
    // Simulate database query
    return [
      { id: 1, name: 'Alice', email: 'alice@example.com' },
      { id: 2, name: 'Bob', email: 'bob@example.com' },
    ];
  }

  private async createUser(args: { name: string; email: string }) {
    // Simulate user creation
    const id = Math.floor(Math.random() * 10000);
    return { id, ...args };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

async function main() {
  const server = new MyMCPServer();
  await server.run();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
```

## Testing MCP Servers

### Unit Testing
```python
# tests/test_server.py
import pytest
import json
from mcp import types
from my_mcp_server.server import MyMCPServer

@pytest.mark.asyncio
async def test_list_resources():
    server = MyMCPServer()
    resources = await server.data_provider.list_resources()
    
    assert len(resources) == 3
    assert any(r.uri == "custom://data/users" for r in resources)

@pytest.mark.asyncio
async def test_read_resource():
    server = MyMCPServer()
    data = await server.data_provider.read_resource("custom://data/users")
    
    parsed_data = json.loads(data)
    assert "users" in parsed_data
    assert len(parsed_data["users"]) >= 0

@pytest.mark.asyncio
async def test_call_tool():
    server = MyMCPServer()
    result = await server.operations.call_tool(
        "create_user",
        {"name": "Test User", "email": "test@example.com"}
    )
    
    assert result.content[0].text.startswith("Created user:")
```

### Integration Testing
```python
# tests/test_integration.py
import asyncio
import json
from mcp.client import Client
from mcp.client.stdio import stdio_client

async def test_full_server_interaction():
    # Start server process
    import subprocess
    server_process = subprocess.Popen(
        ["python", "-m", "my_mcp_server.server"],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    
    try:
        # Connect client
        async with stdio_client(server_process.stdin, server_process.stdout) as client:
            # Test initialization
            result = await client.initialize()
            assert result.server_info.name == "my-mcp-server"
            
            # Test listing resources
            resources = await client.list_resources()
            assert len(resources.resources) > 0
            
            # Test reading resource
            content = await client.read_resource("custom://data/users")
            data = json.loads(content.contents[0].text)
            assert "users" in data
            
            # Test calling tool
            tool_result = await client.call_tool(
                "create_user",
                {"name": "Integration Test", "email": "integration@test.com"}
            )
            assert "Created user:" in tool_result.content[0].text
    
    finally:
        server_process.terminate()
        server_process.wait()
```

## Error Handling

### Input Validation
```python
from pydantic import BaseModel, ValidationError

class UserInput(BaseModel):
    name: str
    email: str
    role: str = "user"

async def _create_user(self, args: Dict[str, Any]) -> dict:
    try:
        # Validate input
        user_data = UserInput(**args)
    except ValidationError as e:
        raise ValueError(f"Invalid input: {e}")
    
    # Process validated data
    return await self._perform_user_creation(user_data)
```

### Error Response Format
```python
async def call_tool(self, name: str, arguments: Dict[str, Any]) -> types.CallToolResult:
    try:
        result = await self._execute_tool(name, arguments)
        return types.CallToolResult(
            content=[
                types.TextContent(type="text", text=str(result))
            ]
        )
    except ValueError as e:
        return types.CallToolResult(
            content=[
                types.TextContent(
                    type="text", 
                    text=f"Validation error: {str(e)}"
                )
            ],
            isError=True
        )
    except Exception as e:
        return types.CallToolResult(
            content=[
                types.TextContent(
                    type="text",
                    text=f"Internal error: {str(e)}"
                )
            ],
            isError=True
        )
```

## Security Considerations

### Input Sanitization
```python
import re
from pathlib import Path

def sanitize_path(path: str) -> str:
    # Remove path traversal attempts
    path = path.replace("..", "").replace("//", "/")
    
    # Ensure path is within allowed directory
    allowed_root = Path("/allowed/directory")
    full_path = (allowed_root / path).resolve()
    
    if not str(full_path).startswith(str(allowed_root)):
        raise ValueError("Path outside allowed directory")
    
    return str(full_path)

def sanitize_sql(query: str) -> str:
    # Basic SQL injection prevention
    dangerous_patterns = [
        r";\s*(drop|delete|insert|update)",
        r"--",
        r"/\*.*\*/"
    ]
    
    for pattern in dangerous_patterns:
        if re.search(pattern, query, re.IGNORECASE):
            raise ValueError("Potentially dangerous SQL detected")
    
    return query
```

### Authentication and Authorization
```python
class SecureMCPServer(MyMCPServer):
    def __init__(self, api_key: str):
        super().__init__()
        self.api_key = api_key
        self.authenticated = False
    
    async def authenticate(self, provided_key: str) -> bool:
        self.authenticated = provided_key == self.api_key
        return self.authenticated
    
    def require_auth(self, func):
        async def wrapper(*args, **kwargs):
            if not self.authenticated:
                raise ValueError("Authentication required")
            return await func(*args, **kwargs)
        return wrapper
    
    async def call_tool(self, name: str, arguments: Dict[str, Any]) -> types.CallToolResult:
        # Check authentication for sensitive operations
        if name in ["delete_user", "admin_action"]:
            if not self.authenticated:
                return types.CallToolResult(
                    content=[
                        types.TextContent(
                            type="text",
                            text="Authentication required for this operation"
                        )
                    ],
                    isError=True
                )
        
        return await super().call_tool(name, arguments)
```

## Deployment

### Docker Deployment
```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY src/ ./src/
COPY pyproject.toml .

RUN pip install -e .

EXPOSE 8080

CMD ["my-mcp-server"]
```

### Production Configuration
```python
# config/production.py
import os

class ProductionConfig:
    DATABASE_URL = os.getenv("DATABASE_URL")
    REDIS_URL = os.getenv("REDIS_URL")
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    MAX_CONNECTIONS = int(os.getenv("MAX_CONNECTIONS", "100"))
    TIMEOUT = int(os.getenv("TIMEOUT", "30"))
    
    # Security settings
    API_KEY = os.getenv("MCP_API_KEY")
    ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "").split(",")
    ENABLE_HTTPS = os.getenv("ENABLE_HTTPS", "true").lower() == "true"
```

### Health Monitoring
```python
from datetime import datetime
from typing import Dict, Any

class HealthMonitor:
    def __init__(self):
        self.start_time = datetime.now()
        self.request_count = 0
        self.error_count = 0
    
    async def health_check(self) -> Dict[str, Any]:
        uptime = (datetime.now() - self.start_time).total_seconds()
        error_rate = self.error_count / max(self.request_count, 1)
        
        return {
            "status": "healthy" if error_rate < 0.1 else "degraded",
            "uptime": uptime,
            "requests": self.request_count,
            "errors": self.error_count,
            "error_rate": error_rate,
            "timestamp": datetime.now().isoformat()
        }
    
    def record_request(self):
        self.request_count += 1
    
    def record_error(self):
        self.error_count += 1
```

## Best Practices

### Performance Optimization
- Use connection pooling for databases
- Implement caching for frequently accessed data
- Use async/await for I/O operations
- Batch operations when possible
- Monitor memory usage and clean up resources

### Error Handling
- Provide clear, actionable error messages
- Log errors with sufficient context
- Implement graceful degradation
- Use appropriate HTTP status codes
- Validate all inputs

### Security
- Sanitize all user inputs
- Implement proper authentication
- Use HTTPS in production
- Limit resource access
- Audit sensitive operations

### Documentation
- Document all tools and resources
- Provide usage examples
- Include troubleshooting guides
- Maintain API documentation
- Version your server properly

## See Also

- [MCP Protocol Reference](protocol.md)
- [MCP Servers Reference](servers.md)
- [MCP Configuration](configuration.md)
- [Security Best Practices](../security/permission-schema.md)