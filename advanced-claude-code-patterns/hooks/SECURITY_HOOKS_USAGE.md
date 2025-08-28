# Security Hooks Usage Guide

This guide explains how to implement and customize the security hooks for Claude Code to protect against common security vulnerabilities in AI-assisted development.

## Overview

The security hooks provide two layers of protection:

1. **File Security (`security_check.py`)** - Validates file operations for sensitive content and secure practices
2. **Command Security (`command_security_check.sh`)** - Validates bash commands for dangerous or suspicious operations

## Quick Start

### 1. Installation

Copy the security scripts to your project:

```bash
# Copy from this repository to your project
cp hooks/security_check.py /path/to/your-project/hooks/
cp hooks/command_security_check.sh /path/to/your-project/hooks/

# Make executable
chmod +x /path/to/your-project/hooks/security_check.py
chmod +x /path/to/your-project/hooks/command_security_check.sh
```

### 2. Configuration

Add the hooks to your `.claude/settings.json`:

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

### 3. Testing

Test the security hooks with these commands:

```bash
# Test secret detection (should be blocked)
echo 'API_KEY="sk-1234567890abcdef"' > test.py
claude "edit test.py to add a function"

# Test dangerous command blocking (should be blocked)
claude "run chmod 777 *"
claude "run sudo rm -rf /"

# Test normal operations (should work)
claude "run ls -la"
claude "edit README.md to add documentation"
```

## File Security Details

### What it Protects Against

**Sensitive File Detection:**
- Environment files (`.env`, `.env.local`, etc.)
- Private keys (`.key`, `.pem`, `.p12`, `.pfx`, etc.)
- SSH configurations (`.ssh/` directory contents)
- Git configurations (`.git/config`)
- AWS/Cloud credentials (`.aws/`, `.kube/config`)

**Secret Detection Patterns:**
- API keys and tokens (various formats)
- Passwords in configuration
- Private keys in code
- UUIDs that might be secrets
- Service-specific tokens (OpenAI, GitHub, Slack, etc.)

**Security Validations:**
- Directory traversal prevention
- File permission validation
- Path sanitization
- Content scanning for hardcoded secrets

### Exit Codes

- `0` - Security check passed, operation continues
- `1` - Warning issued, operation continues with notification
- `2` - Security violation detected, operation blocked (Claude will attempt to fix)

### Customization

Edit `security_check.py` to customize:

```python
# Add custom sensitive file patterns
sensitive_patterns = [
    r'\.env.*',           # Environment files
    r'\.key$',            # Private keys  
    r'your-custom-pattern' # Add your patterns here
]

# Add custom secret detection patterns  
secret_patterns = [
    (r'your-api-key-pattern', 'Your API Key Type'),
    (r'custom-token-pattern', 'Custom Token'),
]

# Customize excluded paths (files to skip scanning)
excluded_paths = ['test/', '*.test.py', 'mock-data/']
```

## Command Security Details

### What it Protects Against

**Destructive Commands:**
- File system destruction (`rm -rf /`, format operations)
- Dangerous permissions (`chmod 777`)
- System modification attempts

**Suspicious Patterns:**
- Download-and-execute (`curl | sh`, `wget | bash`)
- Command injection attempts
- Eval/exec with variables
- Sudo usage (blocked entirely)

**Network Security:**
- Unencrypted downloads of executables
- Connections to suspicious hosts
- Local network execution patterns

### Command Categories

**Blocked Commands (Exit 2):**
- `rm -rf /` - System destruction
- `chmod 777` - Dangerous permissions  
- `sudo *` - Privilege escalation
- `curl * | sh` - Download and execute
- `eval $variable` - Dynamic code execution

**Warning Commands (Exit 0 with warning):**
- `rm -rf build/` - Potentially destructive but common
- `git push --force` - Requires confirmation
- `npm publish` - Publication commands
- `exec` usage - Potential security risk

### Customization

Edit `command_security_check.sh` to customize:

```bash
# Add dangerous command patterns
dangerous_patterns=(
    "rm -rf /"
    "your-custom-dangerous-pattern"
)

# Add confirmation-required patterns
confirmation_patterns=(
    "git push.*--force"
    "your-custom-confirmation-pattern"  
)

# Modify security checks
check_custom_security() {
    local cmd="$1"
    # Add your custom validation logic
}
```

## Monitoring and Auditing

### Audit Logs

Security events are logged to `.claude/security-audit.log`:

```
2024-01-15 10:30:45 SECURITY_CHECK Edit /path/to/file.py PASSED
2024-01-15 10:31:02 DANGEROUS_COMMAND "rm -rf /" BLOCKED
2024-01-15 10:31:15 SECRET_DETECTED "API_KEY=sk-123" BLOCKED
```

### Log Format

```
TIMESTAMP EVENT_TYPE TOOL/COMMAND RESULT
```

**Event Types:**
- `SECURITY_CHECK` - File security validation
- `DANGEROUS_COMMAND` - Blocked dangerous command
- `SECRET_DETECTED` - Hardcoded secret found
- `PERMISSION_WARNING` - File permission issue
- `COMMAND_CHECK` - Command security validation

### Monitoring Setup

```bash
# Watch security events in real-time
tail -f .claude/security-audit.log

# Count security violations
grep "BLOCKED" .claude/security-audit.log | wc -l

# Find recent secret detections
grep "SECRET_DETECTED" .claude/security-audit.log | tail -10

# Monitor for specific patterns
grep "rm -rf" .claude/security-audit.log
```

## Integration Examples

### CI/CD Pipeline Integration

```yaml
# .github/workflows/security-check.yml
name: Security Check
on: [push, pull_request]
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Security Hooks
        run: |
          # Simulate Claude Code security checks
          python hooks/security_check.py < test-input.json
          bash hooks/command_security_check.sh < test-command.json
```

### Team-wide Enforcement

```json
// .claude/settings.json (committed to repository)
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
      }
    ]
  },
  "permissions": {
    "deny": [
      "Bash(sudo:*)",
      "Bash(rm -rf:*)"
    ]
  }
}
```

### Compliance Reporting

```python
# Generate security compliance report
import json
from collections import defaultdict

def generate_security_report():
    events = defaultdict(int)
    
    with open('.claude/security-audit.log', 'r') as f:
        for line in f:
            if 'BLOCKED' in line:
                event_type = line.split()[2]
                events[event_type] += 1
    
    report = {
        'total_violations': sum(events.values()),
        'violation_types': dict(events),
        'compliance_status': 'PASS' if sum(events.values()) == 0 else 'VIOLATIONS_FOUND'
    }
    
    return report
```

## Troubleshooting

### Common Issues

**Hook Not Executing:**
- Verify scripts are executable (`chmod +x`)
- Check file paths in configuration
- Ensure `$CLAUDE_PROJECT_DIR` is set correctly

**False Positives:**
- Customize secret patterns to exclude test data
- Add exclusion paths for mock/test files
- Adjust validation rules for your workflow

**Performance Issues:**
- Exclude large directories from scanning
- Optimize regex patterns
- Consider async execution for large files

### Testing Security Hooks

```bash
# Test hook manually
echo '{"tool_name":"Edit","tool_input":{"file_path":"test.py","content":"password=\"secret\""}}' | python hooks/security_check.py
echo $?  # Should return 2 (blocked)

# Test command security
echo '{"tool_name":"Bash","tool_input":{"command":"rm -rf /"}}' | bash hooks/command_security_check.sh
echo $?  # Should return 2 (blocked)
```

### Debug Mode

Enable verbose logging by modifying the scripts:

```python
# In security_check.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

```bash  
# In command_security_check.sh
set -x  # Enable debug output
```

## Best Practices

### Security Configuration

1. **Start Restrictive**: Begin with strict rules and gradually relax as needed
2. **Regular Updates**: Update secret patterns and dangerous commands regularly  
3. **Team Alignment**: Ensure all team members use the same security configuration
4. **Documentation**: Document custom rules and exceptions clearly

### Monitoring

1. **Regular Audits**: Review security logs weekly
2. **Alert Thresholds**: Set up alerts for repeated violations
3. **Trend Analysis**: Monitor for increases in security events
4. **Incident Response**: Have a plan for handling security violations

### Maintenance

1. **Pattern Updates**: Keep secret detection patterns current
2. **False Positive Reduction**: Continuously refine validation rules
3. **Performance Monitoring**: Ensure hooks don't slow down development
4. **Security Reviews**: Regularly review and update security policies

## Advanced Configuration

### Environment-Specific Rules

```python
# Different rules for different environments
import os

env = os.environ.get('ENVIRONMENT', 'development')

if env == 'production':
    # Stricter rules for production
    block_all_secrets = True
    require_approval = True
elif env == 'development':
    # More lenient for development
    block_all_secrets = False
    require_approval = False
```

### Custom Integration

```python
# Custom security integration
class CustomSecurityIntegration:
    def __init__(self):
        self.security_service = ExternalSecurityService()
    
    def validate_operation(self, operation, context):
        # Integration with external security systems
        return self.security_service.validate(operation, context)
```

## Support and Contributing

### Getting Help

1. Check the audit logs for specific error messages
2. Review the customization examples above
3. Test hooks individually to isolate issues
4. Consult the main hooks documentation

### Contributing

To improve these security hooks:

1. Test thoroughly with various scenarios
2. Add new security patterns with examples
3. Improve performance and error handling
4. Update documentation with new features

---

*For more information, see the [main hooks documentation](../docs/hooks-guide.md) and [security guide](../docs/permissions-security-guide.md).*