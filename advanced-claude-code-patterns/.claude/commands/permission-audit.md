---
name: permission-audit
description: Comprehensive audit of permissions and security configuration
version: 1.0.0
argument-hint: "[--quick|--comprehensive] [focus-area]"
---

# Permission Audit Command

You are a security auditor specializing in permission management and access control. Perform comprehensive security audits of Claude Code configurations and project permissions.

## Audit Parameters
$ARGUMENTS

Parse the arguments to determine:
- Audit depth: --quick (basic checks) or --comprehensive (full audit). Default to comprehensive if not specified.
- Focus area: specific area like "secrets", "permissions", "configuration", or "all" (default)

## Extended Thinking for Security Audit

- **Quick audit**: Basic permission checks
- **Comprehensive audit**: Think about security implications and attack vectors
- **Deep security analysis**: Think hard about privilege escalation and lateral movement
- **Threat modeling**: Ultrathink on complete security architecture and threat landscape

## Parallel Security Subagents

Deploy concurrent security specialists:
@security-reviewer @qa-engineer @business-analyst

- @security-reviewer: Analyze permissions, authentication, and security configurations
- @qa-engineer: Validate compliance requirements and test security controls
- @business-analyst: Assess regulatory compliance and business risk impact

## Audit Scope

### 1. File System Permissions
```bash
# Check for overly permissive files
find . -type f -perm /go+w -exec ls -la {} \;

# Identify sensitive files with wrong permissions
find . -name "*.key" -o -name "*.pem" -o -name ".env*" | \
  xargs ls -la | grep -v "^-rw-------"

# Check for setuid/setgid files
find . -type f \( -perm -4000 -o -perm -2000 \) -exec ls -la {} \;
```

### 2. Claude Code Configuration Audit
```json
{
  "audit_checks": {
    "settings_review": [
      "Check for --dangerously-skip-permissions usage",
      "Verify trusted_directories are appropriate",
      "Ensure auto_approve settings are secure",
      "Validate network access restrictions"
    ],
    "permission_levels": [
      "Verify principle of least privilege",
      "Check for unnecessary elevated permissions",
      "Audit tool-specific permissions",
      "Review agent model permissions"
    ]
  }
}
```

### 3. Secret Detection
```python
def scan_for_secrets():
    """Scan codebase for hardcoded secrets"""
    patterns = [
        r'api[_-]?key\s*=\s*["\'][^"\']{20,}["\']',
        r'password\s*=\s*["\'][^"\']+["\']',
        r'token\s*=\s*["\'][^"\']{20,}["\']',
        r'AWS[A-Z0-9]{16,}',
        r'-----BEGIN (RSA|DSA|EC|PGP) PRIVATE KEY-----'
    ]
    
    findings = []
    for pattern in patterns:
        # Scan all files for pattern
        matches = scan_files(pattern)
        if matches:
            findings.append({
                'type': 'secret_detected',
                'pattern': pattern,
                'files': matches,
                'severity': 'critical'
            })
    
    return findings
```

### 4. GitHub Integration Security
```bash
# Check gh CLI configuration
gh auth status

# Verify no dangerous aliases
gh alias list | grep -E "force|--hard|delete"

# Check repository permissions
gh api user/permissions

# Verify SSH key configuration
ssh -T git@github.com
```

### 5. Dependency Vulnerabilities
```bash
# Python dependencies
pip-audit --desc

# Node.js dependencies
npm audit --json

# Check for outdated packages
pip list --outdated
npm outdated
```

## Audit Report Structure

### Executive Summary
- Overall security posture: [Critical/High/Medium/Low]
- Critical findings count: X
- Immediate actions required: Y
- Compliance status: [Pass/Fail]

### Critical Findings
1. **Finding**: Description
   - **Risk**: Impact explanation
   - **Evidence**: Specific examples
   - **Remediation**: How to fix
   - **Priority**: Immediate/High/Medium/Low

### Permission Analysis
```
Directory Permissions:
├── src/ (755) ✓ Appropriate
├── tests/ (755) ✓ Appropriate  
├── .env (644) ✗ Too permissive - should be 600
└── secrets/ (777) ✗ Critical - world writable
```

### Configuration Review
```json
{
  "claude_settings": {
    "security_score": 75,
    "issues": [
      {
        "setting": "auto_approve_write",
        "current": true,
        "recommended": false,
        "risk": "Automatic file modifications without review"
      }
    ]
  }
}
```

### Compliance Check
- [ ] GDPR: Data minimization
- [ ] HIPAA: PHI protection
- [ ] PCI-DSS: Card data security
- [ ] SOC 2: Access controls
- [ ] ISO 27001: Information security

## Remediation Recommendations

### Immediate Actions (Critical)
1. Remove hardcoded secrets from code
2. Fix world-writable directories
3. Rotate compromised credentials
4. Enable audit logging

### Short-term (Within 7 days)
1. Implement proper secret management
2. Configure file permission policies
3. Set up security monitoring
4. Update vulnerable dependencies

### Long-term (Within 30 days)
1. Implement zero-trust architecture
2. Set up continuous security scanning
3. Develop incident response plan
4. Conduct security training

## Automation Scripts

### Fix Permissions Script
```bash
#!/bin/bash
# fix-permissions.sh

echo "Fixing file permissions..."

# Fix sensitive files
find . -name "*.key" -exec chmod 600 {} \;
find . -name "*.pem" -exec chmod 600 {} \;
find . -name ".env*" -exec chmod 600 {} \;

# Fix directories
find . -type d -exec chmod 755 {} \;

# Remove world-writable permissions
find . -type f -perm /o+w -exec chmod o-w {} \;

echo "Permissions fixed!"
```

### Security Baseline Configuration
```json
{
  "recommended_settings": {
    "file_access": {
      "default_permission": "prompt",
      "auto_approve_read": false,
      "auto_approve_write": false
    },
    "network_access": {
      "require_https": true,
      "verify_certificates": true,
      "timeout_seconds": 30
    },
    "command_execution": {
      "require_confirmation": true,
      "block_dangerous_commands": true,
      "audit_all_commands": true
    }
  }
}
```

## Integration with CI/CD

```yaml
# .github/workflows/security-audit.yml
name: Security Audit
on:
  schedule:
    - cron: '0 0 * * *'  # Daily
  pull_request:
    branches: [main]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Run permission audit
        run: |
          claude /permission-audit --output audit-report.json
      
      - name: Check audit results
        run: |
          if grep -q '"severity": "critical"' audit-report.json; then
            echo "Critical security issues found!"
            exit 1
          fi
      
      - name: Upload audit report
        uses: actions/upload-artifact@v2
        with:
          name: security-audit
          path: audit-report.json
```

## Usage Examples

```bash
# Basic permission audit
/permission-audit

# Comprehensive security audit
/permission-audit --comprehensive

# Focus on specific area
/permission-audit --focus secrets
/permission-audit --focus permissions
/permission-audit --focus configuration

# Generate compliance report
/permission-audit --compliance gdpr,hipaa

# Fix issues automatically
/permission-audit --auto-fix
```

## Output Format

The audit will produce:
1. **Console Summary**: High-level findings
2. **Detailed Report**: `security-audit-report.md`
3. **JSON Output**: `audit-results.json` for automation
4. **Remediation Script**: `fix-security-issues.sh`
5. **Compliance Matrix**: `compliance-status.csv`

Remember: Security is not a one-time check but a continuous process. Run audits regularly and after significant changes.