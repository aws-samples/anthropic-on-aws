# How to Set Up Secure Claude Code Workflows

Implement security-first workflows for production Claude Code usage.

## Prerequisites
- Claude Code with configured permissions
- GitHub CLI installed and authenticated
- Understanding of git workflows

## Set Up GitHub CLI for Secure Git Operations

### Step 1: Install GitHub CLI

```bash
# macOS
brew install gh

# Ubuntu/Debian
sudo apt install gh

# Windows (PowerShell)
winget install GitHub.cli
```

### Step 2: Authenticate Securely

```bash
# Authenticate with SSH (recommended)
gh auth login --protocol ssh

# Verify authentication
gh auth status
```

### Step 3: Configure Secure GitHub Operations

Create permission configuration for GitHub operations:

```json
{
  "github_operations": {
    "allowed_operations": [
      "gh pr create",
      "gh pr list",
      "gh pr view",
      "gh issue create",
      "gh issue list",
      "gh repo clone"
    ],
    "require_confirmation": [
      "gh pr merge",
      "gh repo delete",
      "gh release create"
    ],
    "blocked_operations": [
      "gh repo delete --confirm",
      "gh auth logout"
    ]
  }
}
```

## Implement Pre-Commit Security Hooks

### Step 1: Create Security Hook Configuration

Add security hooks to your `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/hooks/security_check.py"
          }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command", 
            "command": "$CLAUDE_PROJECT_DIR/hooks/command_security_check.sh"
          }
        ]
      }
    ]
  }
}
```

This configuration enables:

**File Security Checks:**
- Prevents writing to sensitive files (.env, .key, .pem, etc.)
- Scans content for hardcoded secrets and API keys  
- Validates file paths for directory traversal attempts
- Checks file permissions for security compliance
- Logs all security events to `.claude/security-audit.log`

**Command Security Checks:**
- Blocks destructive commands (rm -rf /, chmod 777, etc.)
- Prevents suspicious download-and-execute patterns
- Warns about potentially dangerous operations
- Blocks sudo usage in Claude Code for security
- Validates network operations and connections

### Step 2: Copy Security Hook Scripts

The security hooks are included in this repository. Copy them to your project:

```bash
# Copy security scripts from this repository
cp hooks/security_check.py your-project/hooks/
cp hooks/command_security_check.sh your-project/hooks/

# Make scripts executable
chmod +x your-project/hooks/security_check.py
chmod +x your-project/hooks/command_security_check.sh
```

### Step 3: Test Security Hooks

```bash
# Test file security check with a sample file containing secrets
echo 'API_KEY="sk-1234567890abcdef"' > test.py
claude "edit test.py to add a function"  # Should be blocked for secrets

# Test command security check
claude "run chmod 777 *"  # Should be blocked for dangerous permissions

# Test with safe operations
claude "run ls -la"  # Should work normally
```

## Configure MCP Server Security

### Step 1: Secure MCP Server Setup

```bash
# Add MCP server with environment variables
claude mcp add github-server \
  --env GITHUB_TOKEN="${GITHUB_TOKEN}" \
  --timeout 30 \
  --max-retries 3 \
  -- npx @modelcontextprotocol/server-github
```

### Step 2: Define MCP Permissions

Add MCP-specific permissions to `.claude/settings.json`:

```json
{
  "mcp_permissions": {
    "github_server": {
      "allowed_operations": [
        "read_issues",
        "read_pulls",
        "create_issues"
      ],
      "denied_operations": [
        "delete_repo",
        "force_push"
      ]
    },
    "database_server": {
      "allowed_operations": [
        "select",
        "insert",
        "update"
      ],
      "denied_operations": [
        "drop",
        "truncate",
        "alter"
      ],
      "require_transaction": true
    }
  }
}
```

### Step 3: Test MCP Security

```bash
# Test MCP server connection
claude --mcp-debug

# Verify permissions work correctly
claude "list recent GitHub issues"  # Should work
claude "delete this repository"      # Should be blocked
```

## Set Up Audit Logging

### Step 1: Enable Audit Configuration

Add audit logging to `.claude/settings.json`:

```json
{
  "audit_configuration": {
    "log_file_operations": true,
    "log_network_requests": true,
    "log_command_execution": true,
    "log_permission_changes": true,
    "retention_days": 90,
    "log_location": "~/.claude/audit.log"
  }
}
```

### Step 2: Configure Log Rotation

```bash
# Create logrotate configuration
sudo cat > /etc/logrotate.d/claude-audit << EOF
~/.claude/audit.log {
    daily
    rotate 90
    compress
    missingok
    notifempty
    create 644 $(whoami) $(whoami)
}
EOF
```

### Step 3: Monitor Audit Logs

```bash
# View recent audit entries
tail -f ~/.claude/audit.log

# Search for specific events
grep "permission_denied" ~/.claude/audit.log

# Check for security alerts
grep "SECURITY_ALERT" ~/.claude/audit.log
```

## Implement Container Security

### Step 1: Create Secure Dockerfile

Create a `Dockerfile` for isolated Claude Code execution:

```dockerfile
# Dockerfile for Claude Code sandbox
FROM python:3.11-slim

# Create non-root user
RUN useradd -m -s /bin/bash claude
USER claude

# Set working directory
WORKDIR /workspace

# Install Claude Code
RUN pip install --user claude-code

# Set security restrictions
ENV CLAUDE_SANDBOX_MODE=true
ENV CLAUDE_MAX_FILE_SIZE=10MB
ENV CLAUDE_NETWORK_RESTRICTED=true

# Entry point
ENTRYPOINT ["claude"]
```

### Step 2: Build and Run Secure Container

```bash
# Build container
docker build -t claude-sandbox .

# Run Claude Code in sandbox
docker run -it \
  --rm \
  --read-only \
  --tmpfs /tmp \
  --security-opt=no-new-privileges \
  -v $(pwd):/workspace:ro \
  claude-sandbox
```

### Step 3: Test Container Security

```bash
# Test file system isolation
docker run claude-sandbox "read /etc/passwd"  # Should fail

# Test network restrictions
docker run claude-sandbox "access external API"  # Should be limited
```

## Set Up Security Monitoring

### Step 1: Create Security Monitor Script

Create `security_monitor.py`:

```python
import logging
import re
from pathlib import Path

class SecurityMonitor:
    def __init__(self):
        self.logger = logging.getLogger('claude-security')
        self.suspicious_patterns = [
            r'exec\s*\(',
            r'eval\s*\(',
            r'__import__',
            r'subprocess\.call',
            r'os\.system'
        ]
    
    def monitor_file_operation(self, operation, path):
        """Monitor file operations for suspicious activity"""
        if self.is_sensitive_path(path):
            self.alert(f"Access to sensitive path: {path}")
        
        if operation == 'write' and self.contains_suspicious_code(path):
            self.alert(f"Suspicious code detected in: {path}")
    
    def is_sensitive_path(self, path):
        sensitive = ['.env', '.git/config', 'secrets/', '.ssh/']
        return any(s in str(path) for s in sensitive)
    
    def contains_suspicious_code(self, filepath):
        if Path(filepath).exists():
            content = Path(filepath).read_text()
            for pattern in self.suspicious_patterns:
                if re.search(pattern, content):
                    return True
        return False
    
    def alert(self, message):
        self.logger.critical(f"SECURITY ALERT: {message}")
        # Send to monitoring system
        # Trigger incident response
```

### Step 2: Integrate with Claude Code

Add monitoring to your workflows by configuring hooks that use the security monitor.

### Step 3: Set Up Alerting

Configure your monitoring system to alert on security events:

```bash
# Example: Send alerts to Slack
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Security alert: Suspicious activity detected"}' \
  YOUR_SLACK_WEBHOOK_URL
```

## Troubleshooting

### Permission Conflicts
If security policies conflict with functionality:
1. Review permission logs for denied operations
2. Adjust permissions incrementally
3. Test each change before applying to production

### Hook Failures
If security hooks prevent valid operations:
1. Check hook configuration syntax
2. Verify security tools are installed
3. Test hooks independently before integration

### MCP Security Issues
If MCP servers fail security checks:
1. Verify environment variables are set
2. Check server authentication
3. Review MCP permission configuration

## Best Practices

1. **Defense in Depth**: Layer multiple security controls
2. **Principle of Least Privilege**: Grant minimal necessary permissions
3. **Regular Security Reviews**: Audit configurations monthly
4. **Automated Security Checks**: Use hooks and monitoring
5. **Incident Response Plan**: Prepare for security events
6. **Documentation**: Keep security procedures up to date

## Next Steps

- [Manage secrets securely](manage-secrets.md)
- [Set up compliance monitoring](setup-compliance.md)
- [Configure incident response](setup-incident-response.md)