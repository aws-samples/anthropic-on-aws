# Permission Management and Security Guide for Claude Code

## Overview

Security and permission management are critical aspects of using Claude Code effectively in production environments. This guide covers best practices for managing permissions, securing your development workflow, and safely integrating with external services.

## Core Security Principles

### 1. Principle of Least Privilege
Claude Code should only have access to the resources it needs:
- File system access limited to project directories
- Network access restricted to approved domains
- Tool permissions granted on a per-need basis

### 2. Explicit Permission Granting
Never use `--dangerously-skip-permissions` in production:
```bash
# ❌ NEVER DO THIS IN PRODUCTION
claude --dangerously-skip-permissions "Delete all test files"

# ✅ PROPERLY MANAGE PERMISSIONS
claude "Delete all test files"  # Claude will ask for permission
```

### 3. Security-First Mindset
- Assume all external input is potentially malicious
- Validate and sanitize all data
- Use secure communication channels
- Regularly audit permissions and access logs

## Permission Management

### Using the /permissions Command

The `/permissions` command provides fine-grained control over Claude Code's capabilities:

```bash
# View current permissions
claude /permissions

# Configure permissions interactively
claude /permissions --configure

# Export permission configuration
claude /permissions --export > permissions.json

# Import permission configuration
claude /permissions --import permissions.json
```

### Permission Configuration Files

#### Project-Level Permissions (.claude/settings.json)

```json
{
  "name": "project-permissions",
  "description": "Project-specific Claude Code permissions",
  "permissions": {
    "file_access": {
      "allowed_paths": [
        "${project_root}/src",
        "${project_root}/tests",
        "${project_root}/docs"
      ],
      "denied_paths": [
        "${project_root}/.env",
        "${project_root}/secrets",
        "${project_root}/.git/config"
      ],
      "read_only_paths": [
        "${project_root}/vendor",
        "${project_root}/node_modules"
      ]
    },
    "network_access": {
      "allowed_domains": [
        "github.com",
        "api.github.com",
        "docs.anthropic.com",
        "pypi.org",
        "npmjs.com"
      ],
      "blocked_domains": [
        "*.onion",
        "*.local"
      ],
      "require_https": true
    },
    "tool_permissions": {
      "bash": {
        "allowed_commands": [
          "git",
          "npm",
          "pytest",
          "docker"
        ],
        "blocked_commands": [
          "rm -rf /",
          "sudo",
          "chmod 777"
        ],
        "require_confirmation": [
          "git push",
          "npm publish",
          "docker push"
        ]
      },
      "write": {
        "max_file_size_mb": 10,
        "allowed_extensions": [
          ".py", ".js", ".ts", ".md", ".json", ".yaml"
        ],
        "blocked_patterns": [
          "*.exe",
          "*.dll",
          "*.so"
        ]
      }
    },
    "agent_permissions": {
      "model_selection": {
        "allowed_models": ["sonnet", "opus"],
        "default_model": "sonnet",
        "require_approval_for_opus": true
      },
      "parallel_execution": {
        "max_concurrent_agents": 3,
        "timeout_seconds": 300
      }
    }
  },
  "security_policies": {
    "prevent_secrets_exposure": true,
    "scan_for_vulnerabilities": true,
    "enforce_secure_coding": true,
    "audit_logging": true
  }
}
```

#### Global Permissions (~/.claude/settings.json)

```json
{
  "name": "global-permissions",
  "description": "User-wide Claude Code permissions",
  "permissions": {
    "default_file_access": "prompt",
    "default_network_access": "prompt",
    "auto_approve_read": false,
    "auto_approve_write": false,
    "require_confirmation_for_destructive": true
  },
  "trusted_directories": [
    "~/projects/work",
    "~/projects/personal"
  ],
  "security_preferences": {
    "always_use_gh_cli": true,
    "prefer_ssh_over_https": true,
    "enforce_2fa": true
  }
}
```

### Permission Levels

#### Level 1: Restricted (Default)
- Read access to current directory only
- No network access
- No bash execution
- Requires explicit approval for all operations

#### Level 2: Standard
- Read/write in project directory
- Network access to approved domains
- Limited bash commands
- Auto-approve safe operations

#### Level 3: Extended
- Full project directory access
- Broader network access
- Most bash commands allowed
- Auto-approve most operations

#### Level 4: Trusted
- Full file system access (with exceptions)
- Unrestricted network access
- All bash commands except dangerous ones
- Minimal confirmation prompts

### Dynamic Permission Requests

Claude Code can request permissions dynamically:

```python
# Example: Claude requests permission for specific operation
"""
Claude: I need to access the database configuration file to set up the connection.
Would you like me to:
1. Read /config/database.yml (read-only)
2. Skip this step
3. Provide the configuration manually

Please choose (1-3): 
"""
```

## GitHub CLI Integration for Security

### Why Use gh CLI Instead of Direct Git

The GitHub CLI (`gh`) provides safer repository interactions:

```bash
# ✅ SAFER: Using gh CLI
gh pr create --title "Add feature" --body "Description"
gh pr review 123 --approve
gh issue create --title "Bug report"

# ⚠️ RISKIER: Direct git commands
git push --force origin main  # Can overwrite history
git reset --hard HEAD~10      # Can lose commits
```

### Setting Up gh CLI Securely

```bash
# Install gh CLI
brew install gh  # macOS
sudo apt install gh  # Ubuntu

# Authenticate with GitHub
gh auth login

# Use SSH authentication (more secure)
gh auth login --protocol ssh

# Verify authentication
gh auth status
```

### Safe GitHub Operations

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

## Security Best Practices

### 1. Secrets Management

**Never store secrets in code or configuration files:**

```python
# ❌ WRONG: Hardcoded secrets
API_KEY = "sk-abc123def456"
DATABASE_PASSWORD = "mypassword123"

# ✅ CORRECT: Use environment variables
import os
API_KEY = os.environ.get('API_KEY')
DATABASE_PASSWORD = os.environ.get('DB_PASSWORD')
```

**Use .env files with proper .gitignore:**

```bash
# .env file (never commit this)
API_KEY=sk-abc123def456
DB_PASSWORD=secure_password

# .gitignore
.env
.env.local
secrets/
*.key
*.pem
```

### 2. Input Validation

Always validate and sanitize input:

```python
# Command injection prevention
def safe_file_operation(filename):
    # Validate filename
    if not re.match(r'^[\w\-. ]+$', filename):
        raise ValueError("Invalid filename")
    
    # Restrict to project directory
    safe_path = os.path.join(PROJECT_ROOT, filename)
    if not safe_path.startswith(PROJECT_ROOT):
        raise ValueError("Path traversal detected")
    
    return safe_path
```

### 3. Secure Communication

```json
{
  "network_security": {
    "enforce_https": true,
    "verify_ssl_certificates": true,
    "timeout_seconds": 30,
    "max_redirects": 5,
    "user_agent": "Claude-Code/1.0"
  }
}
```

### 4. Audit Logging

Enable comprehensive audit logging:

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

Example audit log entry:
```json
{
  "timestamp": "2025-08-09T10:30:45Z",
  "action": "file_write",
  "path": "/project/src/main.py",
  "user": "developer",
  "claude_session": "abc-123",
  "permission_level": "standard",
  "status": "approved",
  "size_bytes": 1024
}
```

## MCP Server Security

### Securing MCP Server Connections

When using Model Context Protocol servers, ensure secure configuration:

```bash
# Add MCP server with security considerations
claude mcp add github-server \
  --env GITHUB_TOKEN="${GITHUB_TOKEN}" \
  --timeout 30 \
  --max-retries 3 \
  -- npx @modelcontextprotocol/server-github

# Use environment variables for sensitive data
export GITHUB_TOKEN=$(gh auth token)
export DATABASE_URL="postgresql://user:pass@localhost/db"
```

### MCP Server Permission Model

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

## Security Workflows

### Pre-Tool Security Checks

Add comprehensive security validation to your `.claude/settings.json`:

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

These security hooks provide multi-layered protection:

**File Security Validation:**
- Automatically detects hardcoded secrets and API keys in file content
- Blocks writes to sensitive files (.env, .key, .pem, credential files)
- Prevents directory traversal and path-based attacks
- Enforces secure file permissions on sensitive files
- Maintains comprehensive audit logs in `.claude/security-audit.log`

**Command Security Validation:**
- Blocks inherently dangerous commands (rm -rf /, chmod 777, format operations)
- Prevents suspicious download-and-execute patterns (curl | sh, wget | bash)
- Restricts sudo usage in hooks for security compliance
- Warns about potentially destructive operations before execution
- Logs all command security events for compliance auditing

### Security Review Command

Create `.claude/commands/security-review.md`:

```markdown
---
name: security-review
description: Comprehensive security analysis with permission checks
model: opus
tools: [Read, Grep, WebSearch, Task]
---

# Security Review Command

Perform thorough security analysis of the codebase.

## Security Checks

1. **Permission Analysis**
   - File system permissions
   - API access controls
   - User authentication
   - Authorization checks

2. **Vulnerability Scanning**
   - Known CVEs
   - OWASP Top 10
   - Dependency vulnerabilities
   - Code injection risks

3. **Secret Detection**
   - Hardcoded credentials
   - API keys in code
   - Private keys
   - Connection strings

4. **Best Practice Validation**
   - Input validation
   - Output encoding
   - Secure communication
   - Error handling

## Extended Thinking

- **Basic review**: Standard security checks
- **Deep analysis**: Think hard about attack vectors
- **Threat modeling**: Ultrathink on security architecture

## Output

Provide security report with:
- Critical issues (must fix)
- High priority (should fix)
- Medium priority (consider fixing)
- Low priority (nice to fix)
- Recommendations
```

## Container and Sandbox Security

### Running Claude Code in Containers

For additional isolation, run Claude Code in containers:

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

```bash
# Run Claude Code in sandbox
docker run -it \
  --rm \
  --read-only \
  --tmpfs /tmp \
  --security-opt=no-new-privileges \
  -v $(pwd):/workspace:ro \
  claude-sandbox
```

## Compliance and Regulatory Considerations

### GDPR Compliance

```json
{
  "gdpr_compliance": {
    "data_minimization": true,
    "purpose_limitation": true,
    "consent_required": true,
    "data_retention_days": 30,
    "right_to_erasure": true,
    "audit_trail": true
  }
}
```

### HIPAA Compliance

```json
{
  "hipaa_compliance": {
    "phi_detection": true,
    "encryption_required": true,
    "access_logging": true,
    "minimum_necessary_rule": true,
    "secure_disposal": true
  }
}
```

### SOC 2 Compliance

```json
{
  "soc2_compliance": {
    "access_controls": true,
    "change_management": true,
    "risk_assessment": true,
    "monitoring": true,
    "incident_response": true
  }
}
```

## Security Monitoring and Alerting

### Real-time Security Monitoring

```python
# security_monitor.py
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

### Security Metrics Dashboard

Track security metrics:

```json
{
  "security_metrics": {
    "permission_denials_per_day": 0,
    "suspicious_operations": 0,
    "secrets_detected": 0,
    "vulnerable_dependencies": 0,
    "failed_auth_attempts": 0,
    "policy_violations": 0
  }
}
```

## Incident Response

### Security Incident Workflow

```yaml
name: security_incident_response
description: Automated security incident response
triggers:
  - security_alert
  - vulnerability_detected
  - unauthorized_access

stages:
  - name: detect
    actions:
      - identify_threat
      - assess_severity
      - capture_evidence
  
  - name: contain
    actions:
      - isolate_affected_systems
      - revoke_compromised_credentials
      - block_malicious_ips
  
  - name: eradicate
    actions:
      - remove_malicious_code
      - patch_vulnerabilities
      - update_security_policies
  
  - name: recover
    actions:
      - restore_from_backup
      - verify_system_integrity
      - resume_normal_operations
  
  - name: lessons_learned
    actions:
      - document_incident
      - update_response_procedures
      - implement_preventive_measures
```

## Security Checklist

### Daily Security Tasks
- [ ] Review audit logs for anomalies
- [ ] Check for new CVEs in dependencies
- [ ] Verify no secrets in recent commits
- [ ] Confirm permissions are appropriate

### Weekly Security Tasks
- [ ] Run full vulnerability scan
- [ ] Review and update access controls
- [ ] Test backup and recovery procedures
- [ ] Update security documentation

### Monthly Security Tasks
- [ ] Conduct security training
- [ ] Perform penetration testing
- [ ] Review and update security policies
- [ ] Audit third-party integrations

## Quick Reference

### Essential Security Commands

```bash
# Check current permissions
claude /permissions

# Run security scan
claude /security-review

# Audit recent operations
claude /audit --last-24h

# Check for secrets
detect-secrets scan --all-files

# Vulnerability scan
npm audit  # For Node.js
pip-audit  # For Python
```

### Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [Claude Code Security Updates](https://docs.anthropic.com/security)

## Conclusion

Security and permission management are not optional features but essential requirements for production Claude Code usage. By following these guidelines:

1. **Never skip permission checks**
2. **Use principle of least privilege**
3. **Prefer gh CLI for GitHub operations**
4. **Audit and monitor all operations**
5. **Keep secrets out of code**
6. **Validate all inputs**
7. **Use secure communication**
8. **Plan for incident response**

Remember: Security is a continuous process, not a one-time setup. Regularly review and update your security configurations as your project evolves.