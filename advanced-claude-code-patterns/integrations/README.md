# MCP (Model Context Protocol) Server Integrations

This directory contains example MCP server implementations that extend Claude Code's capabilities by connecting to external tools and services.

## What are MCP Servers?

MCP servers are executable programs that implement the Model Context Protocol, allowing Claude Code to interact with external systems, databases, APIs, and tools. They communicate with Claude Code via stdio or HTTP.

## MCP Server Examples

### 1. GitHub MCP Server (`github-mcp/`)
Python-based MCP server for GitHub integration:
- Pull request management
- Issue tracking
- Repository analysis
- Automated workflows

### 2. Database MCP Server (`database-mcp/`)
Safe database operations server:
- Read-only queries by default
- Schema inspection
- Migration validation
- Multiple database support

### 3. Documentation MCP Server (`docs-mcp/`)
Documentation generation and management:
- Generate docs from code
- Publish to platforms
- Maintain README files
- API documentation

### 4. Testing MCP Server (`testing-mcp/`)
Test execution and analysis:
- Run test suites
- Coverage analysis
- Performance testing
- Test generation

### 5. Security MCP Server (`security-mcp/`)
Security scanning integration:
- Vulnerability scanning
- Secret detection
- Compliance checking
- Automated remediation

## Installation

Each MCP server can be installed either globally or project-specific:

### Global Installation
```bash
# Add to global Claude Code configuration
claude mcp add github-server --global -- python /path/to/github-mcp/server.py

# Or use uvx for Python servers
claude mcp add github-server --global -- uvx --from /path/to/github-mcp run-server
```

### Project-Specific Installation
```bash
# Add to project's .claude/ directory
claude mcp add github-server -- python ./integrations/github-mcp/server.py
```

## Configuration

MCP servers are configured in `.claude/mcp-settings.json`:

```json
{
  "servers": {
    "github-server": {
      "command": "python",
      "args": ["./integrations/github-mcp/server.py"],
      "env": {
        "GITHUB_TOKEN": "${env:GITHUB_TOKEN}"
      }
    },
    "database-server": {
      "command": "uvx",
      "args": ["--from", "./integrations/database-mcp", "run-server"],
      "env": {
        "DATABASE_URL": "${env:DATABASE_URL}"
      }
    }
  }
}
```

## Environment Variables

Most MCP servers require authentication via environment variables:

```bash
# Set in your shell profile or .env file
export GITHUB_TOKEN="your-github-token"
export DATABASE_URL="postgresql://user:pass@localhost:5432/db"
export OPENAI_API_KEY="your-openai-key"
```

## Creating Custom MCP Servers

To create your own MCP server:

1. **Choose your language**: Python (recommended), TypeScript, or any language that can handle stdio
2. **Install MCP SDK**: 
   ```bash
   pip install mcp  # For Python
   npm install @anthropic/mcp  # For TypeScript
   ```
3. **Implement the protocol**: See example servers in this directory
4. **Package your server**: Include requirements.txt or package.json
5. **Add to Claude Code**: Use `claude mcp add` command

## Testing MCP Servers

Test your MCP server before adding to Claude Code:

```bash
# Test server directly
python server.py

# Test with Claude Code in debug mode
claude --mcp-debug

# View MCP server logs
tail -f ~/.claude/logs/mcp-*.log
```

## Security Considerations

- **Authentication**: Always use environment variables for sensitive credentials
- **Permissions**: MCP servers run with your user permissions
- **Read-only by default**: Database operations should default to read-only
- **Audit logging**: Log all operations for security review
- **Input validation**: Validate all inputs from Claude Code

## Troubleshooting

### Server won't start
- Check Python/Node version compatibility
- Verify all dependencies are installed
- Check environment variables are set
- Review logs in `~/.claude/logs/`

### Connection errors
- Ensure server is executable: `chmod +x server.py`
- Check firewall settings for HTTP-based servers
- Verify stdio communication isn't blocked

### Authentication failures
- Confirm environment variables are exported
- Check token/API key validity
- Verify permissions for the credentials

## Examples by Use Case

### For Development Teams
- **github-mcp**: Automate PR reviews and issue management
- **testing-mcp**: Run tests and analyze coverage
- **database-mcp**: Safe production database queries

### For DevOps
- **monitoring-mcp**: Query metrics and logs
- **cloud-mcp**: Manage infrastructure
- **security-mcp**: Security scanning

### For Documentation
- **docs-mcp**: Generate and maintain documentation
- **api-mcp**: Generate API documentation
- **changelog-mcp**: Automate changelog generation

## Resources

- [MCP Protocol Specification](https://github.com/anthropics/mcp)
- [Claude Code MCP Documentation](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [MCP Python SDK](https://github.com/anthropics/mcp-python)
- [MCP TypeScript SDK](https://github.com/anthropics/mcp-typescript)