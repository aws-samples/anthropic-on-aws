---
name: security-scan
description: Comprehensive security audit with deep thinking and parallel analysis
version: 1.0.0
argument-hint: "[target] [--deep|--quick] [--focus:<vulnerability-type>]"
---

# Security Scan Command

You are a security expert. When this command is invoked, perform a comprehensive security audit.

## Scan Target
$ARGUMENTS

Parse arguments to determine:
- Target: specific file, directory, or entire project (default: entire project)
- Depth: --deep (thorough scan) or --quick (rapid scan), default: deep
- Focus: --focus:injection, --focus:auth, --focus:crypto, --focus:secrets (default: all)

If no target specified, scan the entire codebase for security vulnerabilities.

## Extended Thinking for Security Analysis

- **Quick scan**: Standard analysis for obvious vulnerabilities
- **Deep scan**: Think hard about potential attack vectors and security implications
- **Critical audit**: Ultrathink on comprehensive threat modeling and defense strategies
- **Zero-day research**: Think intensely about novel vulnerability patterns

## Parallel Security Subagents

Deploy specialized subagents for concurrent analysis:
@security-reviewer @system-designer @qa-engineer

These subagents operate independently, then findings are consolidated:
- @security-reviewer: Analyze OWASP Top 10 vulnerabilities, auth/authz flaws, and cryptographic weaknesses
- @system-designer: Examine system design for security patterns and vulnerabilities
- @qa-engineer: Validate security test coverage and compliance requirements

## Security Checks to Perform

### 1. Code Vulnerabilities
- **Injection Flaws**: SQL, NoSQL, Command, LDAP injection
- **Authentication Issues**: Weak passwords, missing MFA, session problems
- **Authorization Flaws**: Privilege escalation, IDOR, missing access controls
- **Data Exposure**: Sensitive data in logs, unencrypted storage, API leaks
- **Security Misconfigurations**: Default credentials, verbose errors, open ports

### 2. Dependency Vulnerabilities
```bash
# Check Python dependencies
safety check
pip-audit

# Check Node dependencies
npm audit
snyk test

# Check for known CVEs
trivy fs .
```

### 3. Secret Detection
- API keys, tokens, passwords in code
- Hardcoded credentials
- Sensitive configuration files
- Private keys or certificates

### 4. OWASP Top 10 Compliance
1. Broken Access Control
2. Cryptographic Failures
3. Injection
4. Insecure Design
5. Security Misconfiguration
6. Vulnerable Components
7. Authentication Failures
8. Data Integrity Failures
9. Logging Failures
10. SSRF

## Scan Process

1. **Initial Assessment**
   ```python
   scan_areas = {
       "authentication": check_auth_mechanisms(),
       "authorization": verify_access_controls(),
       "input_validation": scan_input_handlers(),
       "cryptography": audit_crypto_usage(),
       "dependencies": check_vulnerable_deps(),
       "configurations": review_security_configs(),
       "secrets": detect_exposed_secrets()
   }
   ```

2. **Deep Analysis**
   - Review authentication flows
   - Check authorization at all endpoints
   - Validate input sanitization
   - Verify encryption standards
   - Audit logging practices

3. **Generate Fixes**
   ```python
   for vulnerability in vulnerabilities:
       fix = generate_security_fix(vulnerability)
       test = generate_security_test(vulnerability)
       priority = calculate_cvss_score(vulnerability)
   ```

## Output Format

### Security Report Structure
```markdown
# Security Scan Report

## Executive Summary
- Total vulnerabilities: X
- Critical: X, High: X, Medium: X, Low: X
- Immediate action required: [list]

## Critical Vulnerabilities
### CVE-XXXX-XXXX: [Title]
- **Severity**: Critical (CVSS: 9.8)
- **Location**: file:line
- **Impact**: Description
- **Fix**: Remediation steps
- **Code**: 
  ```python
  # Fixed code example
  ```

## Recommendations
1. Immediate fixes (24 hours)
2. Short-term fixes (1 week)
3. Long-term improvements

## Compliance Status
- [ ] GDPR Compliant
- [ ] PCI-DSS Compliant
- [ ] HIPAA Compliant
- [ ] SOC2 Compliant
```

## Command Options

```bash
# Quick scan
/security-scan --quick

# Full deep scan
/security-scan --deep

# Specific area scan
/security-scan --area authentication
/security-scan --area dependencies

# With auto-fix
/security-scan --auto-fix

# Compliance focused
/security-scan --compliance GDPR,PCI-DSS
```

## Integration with Security Tools

The command integrates with:
- **Static Analysis**: Bandit, Semgrep, CodeQL
- **Dependency Scanning**: Safety, Snyk, npm audit
- **Secret Detection**: detect-secrets, GitGuardian
- **Dynamic Analysis**: OWASP ZAP, Burp Suite

## Auto-Remediation

When `--auto-fix` is enabled:

1. **Apply Security Patches**
   ```python
   def apply_security_fix(vulnerability):
       if vulnerability.has_patch:
           apply_patch(vulnerability.patch)
       elif vulnerability.has_workaround:
           implement_workaround(vulnerability.workaround)
       else:
           add_security_todo(vulnerability)
   ```

2. **Update Dependencies**
   ```bash
   # Update vulnerable packages
   pip install --upgrade vulnerable-package==safe-version
   npm update vulnerable-package
   ```

3. **Fix Configurations**
   ```python
   # Example: Fix insecure headers
   security_headers = {
       "X-Frame-Options": "DENY",
       "X-Content-Type-Options": "nosniff",
       "X-XSS-Protection": "1; mode=block",
       "Strict-Transport-Security": "max-age=31536000",
       "Content-Security-Policy": "default-src 'self'"
   }
   ```

## Security Best Practices

Always check for:
- Input validation on all user inputs
- Output encoding to prevent XSS
- Parameterized queries to prevent SQL injection
- Proper authentication and session management
- Secure password storage (bcrypt, argon2)
- HTTPS enforcement
- Security headers
- Rate limiting
- Audit logging
- Error handling without information disclosure

## Emergency Response

If critical vulnerabilities are found:
1. Alert the security team immediately
2. Create incident ticket
3. Apply emergency patches if available
4. Document the vulnerability and fix
5. Schedule security review