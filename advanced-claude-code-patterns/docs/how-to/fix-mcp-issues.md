# How to Fix MCP Server Issues

Resolve Model Context Protocol (MCP) server problems in Claude Code.

## Prerequisites

- MCP servers installed
- Understanding of MCP basics
- Access to server configurations

## MCP Server Won't Start

### Quick Diagnosis

```bash
# Check installed MCP servers
claude mcp list

```

### Solution Steps

1. **Verify installation**
   ```bash
   # Check if server exists
   which npx
   npx @modelcontextprotocol/server-github --version
   ```

2. **Check environment variables**
   ```bash
   # Required variables
   echo $GITHUB_TOKEN
   echo $DATABASE_URL
   echo $API_KEY
   
   # Set missing variables
   export GITHUB_TOKEN="ghp_xxxxx"
   ```

3. **Test server directly**
   ```bash
   # Run server manually
   npx @modelcontextprotocol/server-github
   
   # Check logs
   tail -f ~/.claude/logs/mcp-github.log
   ```

4. **Reinstall MCP server**
   ```bash
   # Remove and reinstall
   claude mcp remove github
   claude mcp add github -- npx @modelcontextprotocol/server-github
   ```

## Authentication Failures

### Quick Diagnosis

```bash
# Test credentials
psql $DATABASE_URL -c "SELECT 1"
gh auth status
```

### Solution Steps

1. **Update MCP configuration**
   ```json
   // .claude/mcp-settings.json
   {
     "servers": {
       "postgres": {
         "env": {
           "DATABASE_URL": "${env:DATABASE_URL}"
         }
       }
     }
   }
   ```

2. **Use secure credential storage**
   ```bash
   # Store in keychain/vault
   security add-generic-password -s claude-mcp -a postgres -w
   
   # Retrieve in script
   export DATABASE_URL=$(security find-generic-password -s claude-mcp -a postgres -w)
   ```

3. **Configure OAuth tokens**
   ```bash
   # GitHub OAuth
   gh auth login
   export GITHUB_TOKEN=$(gh auth token)
   
   # Other services
   claude mcp auth [server-name]
   ```

## Connection Timeouts

### Quick Diagnosis

```bash
# Monitor connection attempts
claude mcp debug [server-name]

# Check network connectivity
ping api.github.com
curl -I https://api.github.com
```

### Solution Steps

1. **Increase timeout settings**
   ```json
   {
     "servers": {
       "database": {
         "timeout": 30000,  # 30 seconds
         "connection_timeout": 5000,
         "retry_attempts": 3
       }
     }
   }
   ```

2. **Optimize queries**
   ```sql
   -- Add indexes
   CREATE INDEX idx_user_email ON users(email);
   
   -- Limit results
   SELECT * FROM large_table LIMIT 100;
   
   -- Use pagination
   SELECT * FROM table OFFSET 0 LIMIT 50;
   ```

3. **Configure connection pooling**
   ```json
   {
     "servers": {
       "database": {
         "pool": {
           "min": 2,
           "max": 10,
           "idle_timeout": 10000
         }
       }
     }
   }
   ```

## Server Crashes

### Quick Diagnosis

```bash
# Check server process
ps aux | grep mcp

# View crash logs
tail -100 ~/.claude/logs/mcp-crash.log

# Check system resources
top -p $(pgrep -f mcp)
```

### Solution Steps

1. **Configure auto-restart**
   ```json
   {
     "servers": {
       "unstable-server": {
         "auto_restart": true,
         "max_restarts": 5,
         "restart_delay": 1000
       }
     }
   }
   ```

2. **Add health checks**
   ```json
   {
     "servers": {
       "api-server": {
         "health_check": {
           "endpoint": "/health",
           "interval": 30000,
           "timeout": 5000
         }
       }
     }
   }
   ```

3. **Implement circuit breaker**
   ```json
   {
     "servers": {
       "external-api": {
         "circuit_breaker": {
           "threshold": 5,
           "timeout": 60000,
           "reset_timeout": 120000
         }
       }
     }
   }
   ```

## Rate Limiting Issues

### Quick Diagnosis

```bash
# Check rate limit status
claude mcp rate-limit [server-name]

# Monitor API calls
claude mcp stats [server-name] --api-calls
```

### Solution Steps

1. **Implement request throttling**
   ```json
   {
     "servers": {
       "github": {
         "rate_limit": {
           "requests_per_minute": 30,
           "burst_size": 10
         }
       }
     }
   }
   ```

2. **Add caching layer**
   ```json
   {
     "servers": {
       "api": {
         "cache": {
           "enabled": true,
           "ttl": 300,  # 5 minutes
           "max_size": "100MB"
         }
       }
     }
   }
   ```

3. **Use webhooks instead of polling**
   ```json
   {
     "servers": {
       "github": {
         "mode": "webhook",
         "webhook_url": "https://your-domain/webhooks/github"
       }
     }
   }
   ```

## Protocol Version Mismatch

### Quick Diagnosis

```bash
# Check MCP version
claude mcp version

# Check server compatibility
npm list @modelcontextprotocol/sdk
```

### Solution Steps

1. **Update MCP components**
   ```bash
   # Update Claude Code
   claude update
   
   # Update MCP SDK
   npm update @modelcontextprotocol/sdk
   
   # Update specific server
   npm update @modelcontextprotocol/server-github
   ```

2. **Configure protocol version**
   ```json
   {
     "servers": {
       "legacy-server": {
         "protocol_version": "1.0",
         "compatibility_mode": true
       }
     }
   }
   ```

## Emergency Recovery

### Reset MCP Configuration

```bash
# Backup current config
cp -r ~/.claude/mcp ~/.claude/mcp.backup

# Reset to defaults
rm -rf ~/.claude/mcp
claude mcp init

# Restore specific servers
claude mcp add github -- npx @modelcontextprotocol/server-github
```

### Debug MCP Issues

```bash
# Enable debug mode
export CLAUDE_MCP_DEBUG=true

# Run with trace
claude --mcp-debug [command]

# Monitor MCP communication
claude mcp trace [server-name]
```

### Validate MCP Setup

```bash
#!/bin/bash
# validate-mcp.sh

echo "Checking MCP servers..."

for server in $(claude mcp list --json | jq -r '.servers[].name'); do
  echo "Testing $server..."
  
  # Check status
  if claude mcp test $server; then
    echo "  ✅ $server is working"
  else
    echo "  ❌ $server has issues"
    
    # Try to fix
    claude mcp restart $server
    
    # Retest
    if claude mcp test $server; then
      echo "  ✅ Fixed after restart"
    else
      echo "  ⚠️  Requires manual intervention"
    fi
  fi
done
```

## Quick Reference

### Common Commands

| Command | Purpose |
|---------|---------|
| `mcp list` | Show all servers |
| `mcp add` | Add new server |
| `mcp remove` | Remove server |
| `mcp restart` | Restart server |
| `mcp test` | Test connectivity |
| `mcp logs` | View server logs |

### MCP Server States

| State | Description | Action |
|-------|-------------|--------|
| `running` | Server active | None |
| `stopped` | Not running | Start server |
| `error` | Failed state | Check logs |
| `connecting` | Starting up | Wait |
| `unauthorized` | Auth failed | Fix credentials |

## Related Guides

- [How to Configure MCP Servers](configure-mcp.md)
- [How to Fix Authentication Issues](fix-auth-issues.md)
- [How to Monitor Performance](fix-performance-issues.md)
- [How to Debug Connection Issues](debug-connections.md)