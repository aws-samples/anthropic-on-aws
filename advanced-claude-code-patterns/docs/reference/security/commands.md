# Security Commands Reference

Complete reference for Claude Code security-related commands and tools.

## Permission Management Commands

### `/permissions`

Manage Claude Code permissions and access controls.

#### Syntax
```bash
claude /permissions [options]
```

#### Options

| Option | Description | Example |
|--------|-------------|---------|
| `--view` | View current permissions (default) | `/permissions --view` |
| `--configure` | Interactive permission setup | `/permissions --configure` |
| `--level <level>` | Set permission level | `/permissions --level standard` |
| `--export <file>` | Export permissions to file | `/permissions --export perms.json` |
| `--import <file>` | Import permissions from file | `/permissions --import perms.json` |
| `--validate` | Validate permission configuration | `/permissions --validate` |
| `--reset` | Reset to default permissions | `/permissions --reset` |
| `--diagnose` | Diagnose permission issues | `/permissions --diagnose` |

#### Permission Levels

| Level | Description | Use Case |
|-------|-------------|----------|
| `restricted` | Minimal access, read-only | Sensitive environments |
| `standard` | Balanced development access | General development |
| `extended` | Broad project access | Active development |
| `trusted` | Full access with guards | Power users |

#### Examples

```bash
# View current permissions
claude /permissions

# Set standard permission level
claude /permissions --level standard

# Export current permissions
claude /permissions --export project-perms.json

# Import and apply permissions
claude /permissions --import team-perms.json

# Validate configuration
claude /permissions --validate

# Interactive configuration
claude /permissions --configure
```

### `/audit`

Access audit logs and security monitoring data.

#### Syntax
```bash
claude /audit [options]
```

#### Options

| Option | Description | Example |
|--------|-------------|---------|
| `--view` | View audit logs (default) | `/audit --view` |
| `--last-24h` | Show last 24 hours | `/audit --last-24h` |
| `--last-week` | Show last week | `/audit --last-week` |
| `--filter <type>` | Filter by event type | `/audit --filter security` |
| `--export <file>` | Export logs to file | `/audit --export audit.json` |
| `--summary` | Show summary statistics | `/audit --summary` |
| `--alerts` | Show security alerts only | `/audit --alerts` |

#### Event Types

| Type | Description | Example Events |
|------|-------------|----------------|
| `file` | File operations | read, write, delete |
| `network` | Network requests | HTTP GET, POST |
| `command` | Command execution | bash, git, npm |
| `permission` | Permission changes | grant, deny, modify |
| `security` | Security events | secret detected, vuln found |
| `auth` | Authentication events | login, logout, token refresh |

#### Examples

```bash
# View recent audit logs
claude /audit

# Show security alerts from last 24 hours
claude /audit --last-24h --filter security

# Export weekly audit data
claude /audit --last-week --export weekly-audit.json

# Show audit summary
claude /audit --summary
```

## Security Scanning Commands

### `/security-scan`

Perform comprehensive security analysis of the codebase.

#### Syntax
```bash
claude /security-scan [options] [path]
```

#### Options

| Option | Description | Example |
|--------|-------------|---------|
| `--type <type>` | Scan type to perform | `--type secrets` |
| `--severity <level>` | Minimum severity level | `--severity medium` |
| `--format <format>` | Output format | `--format json` |
| `--fix` | Auto-fix issues where possible | `--fix` |
| `--report <file>` | Generate report file | `--report security-report.html` |

#### Scan Types

| Type | Description | Tools Used |
|------|-------------|------------|
| `secrets` | Detect hardcoded secrets | detect-secrets, truffleHog |
| `vulnerabilities` | Find security vulnerabilities | bandit, safety, npm-audit |
| `dependencies` | Scan dependencies for CVEs | pip-audit, npm audit |
| `code` | Static code analysis | semgrep, eslint |
| `containers` | Container security scan | docker scan, trivy |
| `all` | Complete security scan | All tools |

#### Severity Levels

| Level | Description | Action |
|-------|-------------|--------|
| `critical` | Immediate action required | Block deployment |
| `high` | High priority fix | Review required |
| `medium` | Medium priority | Should fix |
| `low` | Low priority | Consider fixing |
| `info` | Informational only | No action needed |

#### Examples

```bash
# Full security scan
claude /security-scan

# Scan for secrets only
claude /security-scan --type secrets

# High severity issues only
claude /security-scan --severity high

# Scan with auto-fix
claude /security-scan --type vulnerabilities --fix

# Generate HTML report
claude /security-scan --report security-audit.html
```

### `/detect-secrets`

Detect potential secrets in the codebase.

#### Syntax
```bash
claude /detect-secrets [options] [path]
```

#### Options

| Option | Description | Example |
|--------|-------------|---------|
| `--scan` | Scan for secrets (default) | `--scan` |
| `--audit` | Review detected secrets | `--audit` |
| `--baseline <file>` | Use baseline file | `--baseline .secrets.baseline` |
| `--create-baseline` | Create new baseline | `--create-baseline` |
| `--exclude <pattern>` | Exclude file patterns | `--exclude "*.test.js"` |
| `--plugins <list>` | Specify plugins to use | `--plugins "AWSKeyDetector,Base64HighEntropyString"` |

#### Secret Types Detected

| Type | Pattern | Example |
|------|---------|---------|
| AWS Access Key | `AKIA[0-9A-Z]{16}` | `AKIAIOSFODNN7EXAMPLE` |
| AWS Secret Key | `[A-Za-z0-9/+=]{40}` | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| GitHub Token | `ghp_[A-Za-z0-9]{36}` | `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| Private SSH Key | `-----BEGIN.*PRIVATE KEY-----` | SSH private key content |
| API Keys | `sk-[a-zA-Z0-9]{48}` | `sk-abc123def456...` |

#### Examples

```bash
# Scan entire project
claude /detect-secrets

# Create secrets baseline
claude /detect-secrets --create-baseline

# Audit detected secrets
claude /detect-secrets --audit

# Scan specific directory
claude /detect-secrets src/

# Exclude test files
claude /detect-secrets --exclude "**/*test*"
```

## Vulnerability Management Commands

### `/vuln-scan`

Scan for known vulnerabilities in dependencies and code.

#### Syntax
```bash
claude /vuln-scan [options]
```

#### Options

| Option | Description | Example |
|--------|-------------|---------|
| `--dependencies` | Scan dependencies only | `--dependencies` |
| `--code` | Static code analysis | `--code` |
| `--containers` | Scan container images | `--containers` |
| `--severity <level>` | Filter by severity | `--severity high` |
| `--cve <id>` | Check specific CVE | `--cve CVE-2023-1234` |
| `--fix` | Auto-fix where possible | `--fix` |

#### Supported Languages

| Language | Tools | Command |
|----------|-------|---------|
| Python | safety, bandit, pip-audit | `pip-audit` |
| Node.js | npm audit, yarn audit | `npm audit` |
| Java | OWASP dependency check | `dependency-check` |
| Go | govulncheck | `govulncheck` |
| Rust | cargo audit | `cargo audit` |
| Docker | trivy, docker scan | `docker scan` |

#### Examples

```bash
# Scan all dependencies
claude /vuln-scan --dependencies

# Static code analysis
claude /vuln-scan --code

# High severity only
claude /vuln-scan --severity high

# Auto-fix vulnerabilities
claude /vuln-scan --fix

# Check specific CVE
claude /vuln-scan --cve CVE-2023-44487
```

### `/compliance-check`

Check compliance with security standards and regulations.

#### Syntax
```bash
claude /compliance-check [options]
```

#### Options

| Option | Description | Example |
|--------|-------------|---------|
| `--standard <name>` | Compliance standard | `--standard GDPR` |
| `--report <file>` | Generate compliance report | `--report compliance.pdf` |
| `--remediate` | Show remediation steps | `--remediate` |

#### Supported Standards

| Standard | Description | Key Requirements |
|----------|-------------|------------------|
| `GDPR` | General Data Protection Regulation | Data protection, privacy |
| `HIPAA` | Health Insurance Portability Act | Healthcare data security |
| `SOC2` | Service Organization Control 2 | Security controls |
| `PCI-DSS` | Payment Card Industry | Payment data security |
| `ISO27001` | Information Security Management | Security management |
| `NIST` | NIST Cybersecurity Framework | Security framework |

#### Examples

```bash
# GDPR compliance check
claude /compliance-check --standard GDPR

# Generate SOC2 report
claude /compliance-check --standard SOC2 --report soc2-compliance.pdf

# Show remediation steps
claude /compliance-check --standard HIPAA --remediate
```

## Incident Response Commands

### `/incident-response`

Manage security incidents and response procedures.

#### Syntax
```bash
claude /incident-response [action] [options]
```

#### Actions

| Action | Description | Usage |
|--------|-------------|-------|
| `create` | Create new incident | `create --severity high` |
| `update` | Update existing incident | `update --id INC-001` |
| `close` | Close incident | `close --id INC-001` |
| `list` | List incidents | `list --status open` |
| `escalate` | Escalate incident | `escalate --id INC-001` |

#### Options

| Option | Description | Example |
|--------|-------------|---------|
| `--id <id>` | Incident identifier | `--id INC-001` |
| `--severity <level>` | Incident severity | `--severity critical` |
| `--type <type>` | Incident type | `--type data-breach` |
| `--status <status>` | Incident status | `--status investigating` |
| `--assignee <user>` | Assigned user | `--assignee security-team` |

#### Incident Types

| Type | Description | Response Time |
|------|-------------|---------------|
| `data-breach` | Unauthorized data access | 1 hour |
| `malware` | Malicious software detected | 2 hours |
| `phishing` | Phishing attack | 4 hours |
| `vulnerability` | Security vulnerability | 24 hours |
| `policy-violation` | Security policy violation | 48 hours |

#### Examples

```bash
# Create critical incident
claude /incident-response create --severity critical --type data-breach

# List open incidents
claude /incident-response list --status open

# Update incident
claude /incident-response update --id INC-001 --status resolved

# Escalate incident
claude /incident-response escalate --id INC-002
```

## Monitoring Commands

### `/security-metrics`

Display security metrics and monitoring data.

#### Syntax
```bash
claude /security-metrics [options]
```

#### Options

| Option | Description | Example |
|--------|-------------|---------|
| `--dashboard` | Show security dashboard | `--dashboard` |
| `--period <time>` | Time period | `--period 30d` |
| `--metric <name>` | Specific metric | `--metric failed-logins` |
| `--export <file>` | Export metrics | `--export metrics.json` |

#### Available Metrics

| Metric | Description | Threshold |
|--------|-------------|-----------|
| `permission-denials` | Permission denials per day | > 10 |
| `suspicious-operations` | Suspicious operations detected | > 0 |
| `secrets-detected` | Secrets found in code | > 0 |
| `vulnerable-dependencies` | Vulnerable dependencies | > 0 |
| `failed-auth-attempts` | Failed authentication attempts | > 5 |
| `policy-violations` | Security policy violations | > 0 |

#### Examples

```bash
# Show security dashboard
claude /security-metrics --dashboard

# Failed login attempts this week
claude /security-metrics --metric failed-logins --period 7d

# Export monthly metrics
claude /security-metrics --period 30d --export monthly-security.json
```

### `/alerts`

Manage security alerts and notifications.

#### Syntax
```bash
claude /alerts [action] [options]
```

#### Actions

| Action | Description | Usage |
|--------|-------------|-------|
| `list` | List active alerts | `list --severity high` |
| `acknowledge` | Acknowledge alert | `acknowledge --id ALT-001` |
| `resolve` | Resolve alert | `resolve --id ALT-001` |
| `configure` | Configure alert rules | `configure --type secrets` |

#### Alert Types

| Type | Description | Trigger |
|------|-------------|---------|
| `secrets-detected` | Secret found in code | detect-secrets scan |
| `vulnerability-found` | Vulnerability discovered | vuln scan |
| `permission-denied` | Access denied | Permission violation |
| `suspicious-activity` | Unusual activity | Behavior analysis |
| `compliance-violation` | Compliance rule violated | Compliance check |

#### Examples

```bash
# List high severity alerts
claude /alerts list --severity high

# Acknowledge alert
claude /alerts acknowledge --id ALT-001

# Configure secrets detection alerts
claude /alerts configure --type secrets
```

## Backup and Recovery Commands

### `/backup-security`

Backup security configurations and data.

#### Syntax
```bash
claude /backup-security [options]
```

#### Options

| Option | Description | Example |
|--------|-------------|---------|
| `--permissions` | Backup permissions config | `--permissions` |
| `--audit-logs` | Backup audit logs | `--audit-logs` |
| `--secrets-baseline` | Backup secrets baseline | `--secrets-baseline` |
| `--all` | Backup everything | `--all` |
| `--destination <path>` | Backup destination | `--destination ./backups/` |

#### Examples

```bash
# Backup all security data
claude /backup-security --all --destination ./security-backup/

# Backup permissions only
claude /backup-security --permissions

# Backup audit logs
claude /backup-security --audit-logs --destination ~/backups/
```

### `/restore-security`

Restore security configurations from backup.

#### Syntax
```bash
claude /restore-security [options]
```

#### Options

| Option | Description | Example |
|--------|-------------|---------|
| `--source <path>` | Backup source path | `--source ./backups/` |
| `--permissions` | Restore permissions | `--permissions` |
| `--audit-logs` | Restore audit logs | `--audit-logs` |
| `--verify` | Verify before restore | `--verify` |

#### Examples

```bash
# Restore from backup
claude /restore-security --source ./security-backup/ --verify

# Restore permissions only
claude /restore-security --permissions --source ./perms-backup/
```

## Environment-Specific Commands

### Development Environment

```bash
# Set development permissions
claude /permissions --level extended

# Enable verbose audit logging
claude /audit --configure --level verbose

# Scan for secrets (non-blocking)
claude /detect-secrets --scan --exclude "**/test/**"
```

### Testing Environment

```bash
# Set restricted permissions
claude /permissions --level restricted

# Run security tests
claude /security-scan --type all --severity medium

# Generate test report
claude /security-scan --report test-security.html
```

### Production Environment

```bash
# Set trusted permissions with confirmation
claude /permissions --level trusted --require-confirmation

# Enable real-time monitoring
claude /security-metrics --dashboard --realtime

# Configure critical alerts
claude /alerts configure --severity critical --notification email
```

## Integration Commands

### CI/CD Integration

```bash
# Pre-commit security check
claude /security-scan --type secrets --severity high --format junit

# Security gate for deployment
claude /security-scan --type all --severity critical --block-on-fail

# Generate security report for PR
claude /security-scan --report pr-security.md --format markdown
```

### IDE Integration

```bash
# Real-time security feedback
claude /security-scan --watch --type secrets

# Security linting
claude /security-scan --type code --format ide

# Quick security check
claude /detect-secrets --scan --quick
```