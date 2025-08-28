# How to Secure Claude Code Implementations

Essential security practices for production Claude Code deployments.

## Prerequisites

- Claude Code environment set up
- Understanding of your threat model
- Access to environment variable configuration

## Secure Credential Management

### Use Environment Variables

Never hardcode credentials in configuration files:

**✅ Secure approach:**
```yaml
authentication:
  github:
    token: ${env:GITHUB_TOKEN}
  database:
    password: ${env:DB_PASSWORD}
  api_keys:
    openai: ${env:OPENAI_API_KEY}
```

**❌ Insecure approach:**
```yaml
authentication:
  github:
    token: "ghp_actualTokenHere"
  database:
    password: "actualPassword"
```

### Set Up Environment Variables

Create environment files that are not committed to version control:

```bash
# .env (add to .gitignore)
GITHUB_TOKEN=ghp_your_token_here
DB_PASSWORD=secure_password
OPENAI_API_KEY=sk-your-key-here
```

Load them in your shell:
```bash
# In .bashrc or .zshrc
set -a; source .env; set +a
```

### Rotate Credentials Regularly

Set up automated credential rotation:
- **API tokens**: Rotate monthly
- **Database passwords**: Rotate quarterly  
- **SSH keys**: Rotate annually
- **Certificates**: Set up auto-renewal

## Implement Input Validation

### Sanitize User Inputs

Always validate inputs in agents and commands:

```python
def validate_user_input(input_str: str) -> str:
    """Validate and sanitize user input."""
    # Remove potential command injection characters
    dangerous_chars = [';', '|', '&', '$', '`', '(', ')', '<', '>']
    if any(char in input_str for char in dangerous_chars):
        raise ValueError(f"Invalid characters in input: {input_str}")
    
    # Limit input length
    if len(input_str) > 1000:
        raise ValueError("Input too long")
    
    # Escape for SQL if needed
    escaped = input_str.replace("'", "''")
    
    return escaped
```

### Validate File Paths

Prevent directory traversal attacks:

```python
import os
from pathlib import Path

def validate_file_path(file_path: str, allowed_dirs: list[str]) -> Path:
    """Validate file path is within allowed directories."""
    path = Path(file_path).resolve()
    
    # Check if path is within allowed directories
    for allowed_dir in allowed_dirs:
        try:
            path.relative_to(Path(allowed_dir).resolve())
            return path
        except ValueError:
            continue
    
    raise ValueError(f"Path {file_path} not in allowed directories")
```

### Command Injection Prevention

Use parameterized commands instead of string concatenation:

```python
# ❌ Vulnerable to injection
command = f"ls {user_input}"

# ✅ Safe parameterized approach
import subprocess
result = subprocess.run(["ls", user_input], capture_output=True, text=True)
```

## Apply Least Privilege Principle

### Restrict Agent Permissions

Give agents only the minimum tools they need:

```markdown
---
name: read-only-analyzer
model: sonnet
tools: [Read, Grep]  # No Write or Bash access
permissions:
  read_paths: ["src/", "tests/", "docs/"]
  deny_paths: [".env", "secrets/", "*.key", "*.pem"]
---
```

### File System Restrictions

Limit which directories agents can access:

```json
{
  "security": {
    "file_access": {
      "allowed_paths": [
        "/project/src",
        "/project/tests", 
        "/project/docs"
      ],
      "denied_paths": [
        "/etc",
        "/home/*/.ssh",
        "**/*.key",
        "**/*.pem",
        ".env*"
      ]
    }
  }
}
```

### Network Access Controls

Restrict outbound network access:

```json
{
  "security": {
    "network": {
      "allowed_domains": [
        "api.github.com",
        "registry.npmjs.org"
      ],
      "blocked_ips": [
        "10.0.0.0/8",
        "172.16.0.0/12", 
        "192.168.0.0/16"
      ]
    }
  }
}
```

## Enable Comprehensive Audit Logging

### Configure Audit Logging

Track all Claude Code operations:

```json
{
  "audit": {
    "enabled": true,
    "log_level": "info",
    "include": [
      "agent_executions",
      "hook_triggers", 
      "workflow_runs",
      "file_modifications",
      "command_executions",
      "authentication_events"
    ],
    "destination": "/var/log/claude-code/audit.log",
    "format": "json",
    "rotation": {
      "max_size": "100MB",
      "max_files": 10
    }
  }
}
```

### Log Analysis

Set up log monitoring and alerting:

```bash
# Monitor for suspicious activity
tail -f /var/log/claude-code/audit.log | grep -E "(FAILED|ERROR|DENIED)"

# Alert on multiple failed attempts
awk '/FAILED/ {count++} END {if(count > 5) print "ALERT: Multiple failures detected"}' audit.log
```

### Security Event Alerting

Configure alerts for security events:

```yaml
alerts:
  - name: unauthorized_access
    pattern: "access_denied|authentication_failed"
    threshold: 5
    window: 300  # 5 minutes
    action: "email security@company.com"
  
  - name: suspicious_commands
    pattern: "rm -rf|sudo|chmod 777"
    threshold: 1
    action: "slack #security-alerts"
```

## Secure Agent Deployment

### Agent Code Review Process

Implement security reviews for all agents:

```bash
# Security checklist for agent review
cat << 'EOF' > agent-security-checklist.md
## Agent Security Review Checklist

- [ ] No hardcoded credentials
- [ ] Input validation implemented
- [ ] Minimal tool permissions
- [ ] File path validation
- [ ] No arbitrary command execution
- [ ] Error handling doesn't leak sensitive info
- [ ] Logging doesn't include secrets
- [ ] Dependencies are up to date
EOF
```

### Secure Agent Templates

Create secure agent templates:

```markdown
---
name: secure-agent-template
model: sonnet
tools: [Read, Grep]  # Minimal set
---

# Secure Agent Template

## Security Validation
$ARGUMENTS

Validate all arguments:
1. Check for injection patterns
2. Validate file paths are within allowed directories
3. Sanitize any user-provided strings
4. Log security-relevant actions

## Implementation
Only proceed if security validation passes.
```

## Monitor and Respond to Threats

### Real-time Monitoring

Set up monitoring for security events:

```python
import logging
import re
from pathlib import Path

class SecurityMonitor:
    def __init__(self):
        self.suspicious_patterns = [
            r'\.\./',           # Directory traversal
            r'rm\s+-rf',        # Dangerous deletions
            r'sudo\s+',         # Privilege escalation
            r'chmod\s+777',     # Dangerous permissions
            r'curl.*\|\s*sh',   # Remote execution
        ]
    
    def scan_command(self, command: str) -> bool:
        """Return True if command looks suspicious."""
        for pattern in self.suspicious_patterns:
            if re.search(pattern, command, re.IGNORECASE):
                logging.warning(f"Suspicious command detected: {command}")
                return True
        return False
```

### Incident Response

Define response procedures:

```yaml
incident_response:
  threat_levels:
    low:
      actions: [log, monitor]
    medium: 
      actions: [log, alert, review]
    high:
      actions: [log, alert, block, investigate]
    critical:
      actions: [log, alert, block, escalate, isolate]
  
  contacts:
    security_team: "security@company.com"
    on_call: "+1-555-SECURITY"
```

## Secure Configuration Management

### Configuration Encryption

Encrypt sensitive configuration data:

```bash
# Encrypt configuration files
gpg --symmetric --cipher-algo AES256 config.json

# Decrypt for use
gpg --decrypt config.json.gpg > config.json
```

### Configuration Validation

Validate configuration files before use:

```python
import json
import jsonschema

def validate_config(config_file: str, schema_file: str):
    """Validate configuration against security schema."""
    with open(config_file) as f:
        config = json.load(f)
    
    with open(schema_file) as f:
        schema = json.load(f)
    
    try:
        jsonschema.validate(config, schema)
        return True
    except jsonschema.ValidationError as e:
        print(f"Configuration validation failed: {e}")
        return False
```

## Security Testing

### Automated Security Scanning

Add security scans to your workflow:

```bash
# Scan for secrets in code
git-secrets --scan

# Dependency vulnerability scanning
npm audit
pip-audit

# Static code analysis
bandit -r src/
semgrep --config=security
```

### Penetration Testing

Regularly test your Claude Code setup:

```bash
# Test input validation
./test-inputs.sh

# Test file access controls  
./test-file-permissions.sh

# Test network restrictions
./test-network-access.sh
```

## Troubleshooting Security Issues

### Common Security Problems

1. **Permission denied errors**: Check file/directory permissions
2. **Authentication failures**: Verify environment variables are set
3. **Input validation errors**: Check for special characters in inputs
4. **Network timeouts**: Verify allowed domains configuration

### Security Debugging

Enable security debugging:

```bash
# Enable detailed security logging
export CLAUDE_SECURITY_DEBUG=true

# Check security events
claude security events --last 24h

# Validate current security configuration
claude security validate
```

## Security Best Practices Summary

- Use environment variables for all secrets
- Implement comprehensive input validation
- Apply least privilege for all agents
- Enable audit logging for all operations
- Review all agent code for security issues
- Monitor for suspicious activities
- Encrypt sensitive configuration data
- Regularly scan for vulnerabilities
- Test security controls regularly
- Have an incident response plan