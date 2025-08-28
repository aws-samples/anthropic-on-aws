# Environment Variables Reference

Complete reference for Claude Code environment variables.

## System Environment Variables

### Core Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `CLAUDE_HOME` | Platform-specific | Claude Code installation directory |
| `CLAUDE_CONFIG_DIR` | `~/.claude` | Global configuration directory |
| `CLAUDE_CACHE_DIR` | `~/.claude/cache` | Cache storage directory |
| `CLAUDE_DATA_DIR` | `~/.claude/data` | Application data directory |

### Logging Configuration

| Variable | Default | Values | Description |
|----------|---------|--------|-------------|
| `CLAUDE_LOG_LEVEL` | `info` | `debug`, `info`, `warn`, `error` | Logging verbosity |
| `CLAUDE_LOG_FILE` | `~/.claude/logs/claude.log` | File path | Log file location |
| `CLAUDE_LOG_FORMAT` | `text` | `text`, `json` | Log output format |
| `CLAUDE_LOG_ROTATION` | `daily` | `hourly`, `daily`, `weekly` | Log rotation frequency |

### Network Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `CLAUDE_API_URL` | `https://api.anthropic.com` | API endpoint URL |
| `CLAUDE_API_KEY` | None | Authentication key (required) |
| `CLAUDE_TIMEOUT` | `30` | Request timeout in seconds |
| `CLAUDE_RETRY_COUNT` | `3` | Number of retry attempts |
| `CLAUDE_PROXY_URL` | None | HTTP proxy URL |

### Performance Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `CLAUDE_MAX_TOKENS` | `8192` | Default maximum tokens |
| `CLAUDE_CACHE_ENABLED` | `true` | Enable response caching |
| `CLAUDE_CACHE_TTL` | `3600` | Cache TTL in seconds |
| `CLAUDE_PARALLEL_REQUESTS` | `5` | Max concurrent requests |

## Runtime Environment Variables

### Session Information

| Variable | Set By | Description |
|----------|--------|-------------|
| `CLAUDE_SESSION_ID` | Runtime | Unique session identifier |
| `CLAUDE_SESSION_START` | Runtime | Session start timestamp |
| `CLAUDE_PROJECT_ROOT` | Runtime | Current project root directory |
| `CLAUDE_PROJECT_NAME` | Runtime | Project name from configuration |

### Agent Context

| Variable | Set By | Description |
|----------|--------|-------------|
| `CLAUDE_AGENT_NAME` | Runtime | Currently active agent name |
| `CLAUDE_AGENT_MODEL` | Runtime | Agent's configured model |
| `CLAUDE_AGENT_TOOLS` | Runtime | Comma-separated tool list |
| `CLAUDE_AGENT_COLOR` | Runtime | Agent's UI color |

### Tool Execution Context

| Variable | Set By | Description |
|----------|--------|-------------|
| `CLAUDE_TOOL_NAME` | Tool execution | Name of tool being executed |
| `CLAUDE_TOOL_PARAMS` | Tool execution | JSON-encoded tool parameters |
| `CLAUDE_TOOL_START_TIME` | Tool execution | Tool execution start time |
| `CLAUDE_TOOL_TIMEOUT` | Tool execution | Tool timeout in seconds |

## Hook Environment Variables

### Event Context

| Variable | Description | Available In |
|----------|-------------|--------------|
| `CLAUDE_EVENT_TYPE` | Current hook event type | All hooks |
| `CLAUDE_EVENT_TIMESTAMP` | Event timestamp | All hooks |
| `CLAUDE_MESSAGE_ID` | Current message ID | Most events |
| `CLAUDE_USER` | Current user identifier | All hooks |

### Tool Hook Variables

| Variable | Description | Available In |
|----------|-------------|--------------|
| `CLAUDE_TOOL_NAME` | Tool being executed | preToolUse, postToolUse |
| `CLAUDE_TOOL_PARAMS` | JSON tool parameters | preToolUse, postToolUse |
| `CLAUDE_TOOL_RESULT` | Tool execution result | postToolUse |
| `CLAUDE_TOOL_ERROR` | Tool error message | postToolUse |
| `CLAUDE_TOOL_DURATION` | Execution time in ms | postToolUse |

### Prompt Hook Variables

| Variable | Description | Available In |
|----------|-------------|--------------|
| `CLAUDE_PROMPT` | User prompt text | userPromptSubmit |
| `CLAUDE_PROMPT_LENGTH` | Prompt character count | userPromptSubmit |
| `CLAUDE_CONVERSATION_LENGTH` | Number of messages | userPromptSubmit |

### Notification Hook Variables

| Variable | Description | Available In |
|----------|-------------|--------------|
| `CLAUDE_NOTIFICATION_TYPE` | info, warning, error | notification |
| `CLAUDE_NOTIFICATION_MESSAGE` | Notification message | notification |
| `CLAUDE_NOTIFICATION_DETAILS` | Additional details JSON | notification |

## MCP Environment Variables

### Server Configuration

| Variable | Description |
|----------|-------------|
| `MCP_SERVER_NAME` | MCP server identifier |
| `MCP_SERVER_COMMAND` | Server executable path |
| `MCP_SERVER_ARGS` | Command line arguments |
| `MCP_TRANSPORT` | Transport type (stdio, websocket) |

### Authentication

| Variable | Description |
|----------|-------------|
| `MCP_AUTH_TYPE` | Authentication method |
| `MCP_AUTH_TOKEN` | Authentication token |
| `MCP_CLIENT_ID` | Client identifier |
| `MCP_CLIENT_SECRET` | Client secret |

## Security Environment Variables

### Permission Control

| Variable | Default | Description |
|----------|---------|-------------|
| `CLAUDE_SECURITY_MODE` | `standard` | Security level (strict, standard, permissive) |
| `CLAUDE_ALLOWED_TOOLS` | All tools | Comma-separated allowed tools |
| `CLAUDE_BLOCKED_PATHS` | None | Colon-separated blocked path patterns |
| `CLAUDE_REQUIRE_CONFIRMATION` | None | Tools requiring user confirmation |

### Audit and Monitoring

| Variable | Default | Description |
|----------|---------|-------------|
| `CLAUDE_AUDIT_ENABLED` | `false` | Enable audit logging |
| `CLAUDE_AUDIT_FILE` | `~/.claude/audit.log` | Audit log file |
| `CLAUDE_MONITOR_PERFORMANCE` | `false` | Enable performance monitoring |
| `CLAUDE_METRICS_ENDPOINT` | None | Metrics reporting endpoint |

## Development Environment Variables

### Debug Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `CLAUDE_DEBUG` | `false` | Enable debug mode |
| `CLAUDE_VERBOSE` | `false` | Enable verbose output |
| `CLAUDE_TRACE_HOOKS` | `false` | Trace hook execution |
| `CLAUDE_TRACE_TOOLS` | `false` | Trace tool execution |

### Testing Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `CLAUDE_TEST_MODE` | `false` | Enable test mode |
| `CLAUDE_MOCK_API` | `false` | Use mock API responses |
| `CLAUDE_TEST_DATA_DIR` | `tests/data` | Test data directory |
| `CLAUDE_COVERAGE_ENABLED` | `false` | Enable coverage tracking |

## Platform-Specific Variables

### Windows

| Variable | Default | Description |
|----------|---------|-------------|
| `CLAUDE_WINDOWS_SHELL` | `cmd` | Default shell (cmd, powershell) |
| `CLAUDE_WINDOWS_ENCODING` | `utf-8` | Text encoding |

### macOS

| Variable | Default | Description |
|----------|---------|-------------|
| `CLAUDE_MACOS_KEYCHAIN` | `true` | Use keychain for secrets |
| `CLAUDE_MACOS_NOTIFICATIONS` | `true` | Enable system notifications |

### Linux

| Variable | Default | Description |
|----------|---------|-------------|
| `CLAUDE_LINUX_DESKTOP` | Auto-detect | Desktop environment |
| `CLAUDE_LINUX_NOTIFICATIONS` | `true` | Enable desktop notifications |

## Configuration File Variables

### Variable Expansion

Environment variables can be used in configuration files:

```json
{
  "api_key": "${CLAUDE_API_KEY}",
  "cache_dir": "${CLAUDE_CACHE_DIR}/responses",
  "log_file": "${HOME}/.claude/logs/${USER}.log"
}
```

### Supported Syntax

- `${VAR}` - Variable expansion
- `${VAR:-default}` - Default value if unset
- `${VAR:?error}` - Error if unset
- `${VAR:+value}` - Value if set

## Setting Environment Variables

### Shell Configuration

#### Bash/Zsh (~/.bashrc, ~/.zshrc)
```bash
export CLAUDE_API_KEY="your-api-key"
export CLAUDE_LOG_LEVEL="debug"
export CLAUDE_CACHE_ENABLED="true"
```

#### Fish (~/.config/fish/config.fish)
```fish
set -gx CLAUDE_API_KEY "your-api-key"
set -gx CLAUDE_LOG_LEVEL "debug"
set -gx CLAUDE_CACHE_ENABLED "true"
```

### System Configuration

#### systemd (.service files)
```ini
[Service]
Environment=CLAUDE_API_KEY=your-api-key
Environment=CLAUDE_LOG_LEVEL=info
```

#### Docker
```dockerfile
ENV CLAUDE_API_KEY=your-api-key
ENV CLAUDE_LOG_LEVEL=info
ENV CLAUDE_CACHE_ENABLED=true
```

### Project Configuration

#### .env files
```env
CLAUDE_PROJECT_NAME=my-project
CLAUDE_LOG_LEVEL=debug
CLAUDE_CACHE_ENABLED=true
```

#### direnv (.envrc)
```bash
export CLAUDE_PROJECT_NAME="my-project"
export CLAUDE_LOG_LEVEL="debug"
```

## Troubleshooting

### Common Issues

#### Variable Not Found
```bash
# Check if variable is set
echo $CLAUDE_API_KEY

# Set temporarily
export CLAUDE_API_KEY="your-key"
```

#### Permission Denied
```bash
# Check file permissions
ls -la ~/.claude/

# Fix permissions
chmod 600 ~/.claude/settings.json
```

#### Invalid Values
```bash
# Validate environment
claude config validate

# Show current values
claude config show --env
```

### Debug Commands

```bash
# Show all Claude variables
env | grep CLAUDE

# Test configuration
claude --debug config test

# Validate environment
claude config validate --env
```

## See Also

- [Configuration Schema](schema.md)
- [Settings.json Reference](settings.md)
- [Security Configuration](../security/permission-schema.md)
- [Hook Configuration](../hooks/configuration.md)