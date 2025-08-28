# How to Manage Secrets Securely with Claude Code

Implement secure secrets management to protect sensitive information in your development workflow.

## Prerequisites
- Claude Code installed and configured
- Understanding of environment variables
- Project with secrets that need protection

## Identify and Secure Existing Secrets

### Step 1: Scan for Hardcoded Secrets

Install and run secrets detection tools:

```bash
# Install detect-secrets
pip install detect-secrets

# Scan entire project
detect-secrets scan --all-files > .secrets.baseline

# Review detected secrets
detect-secrets audit .secrets.baseline
```

### Step 2: Remove Hardcoded Secrets

Replace hardcoded secrets with environment variables:

```python
# ❌ WRONG: Hardcoded secrets
API_KEY = "sk-abc123def456"
DATABASE_PASSWORD = "mypassword123"

# ✅ CORRECT: Use environment variables
import os
API_KEY = os.environ.get('API_KEY')
DATABASE_PASSWORD = os.environ.get('DB_PASSWORD')

# ✅ BETTER: Use environment variables with defaults
API_KEY = os.environ.get('API_KEY', 'development-key')
if not API_KEY or API_KEY == 'development-key':
    raise ValueError("API_KEY environment variable must be set")
```

### Step 3: Update .gitignore

Ensure secrets files are never committed:

```bash
# Add to .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.*.local" >> .gitignore
echo "secrets/" >> .gitignore
echo "*.key" >> .gitignore
echo "*.pem" >> .gitignore
echo "*.p12" >> .gitignore
echo "*.pfx" >> .gitignore
```

## Set Up Environment-Based Configuration

### Step 1: Create Environment Files

Create environment-specific configuration files:

```bash
# Development environment
cat > .env.development << EOF
API_KEY=dev-key-123
DB_PASSWORD=dev-password
DEBUG=true
LOG_LEVEL=debug
EOF

# Production environment (template only)
cat > .env.production.template << EOF
API_KEY=your-production-api-key
DB_PASSWORD=your-production-password
DEBUG=false
LOG_LEVEL=info
EOF
```

### Step 2: Load Environment Variables

Create a configuration loader:

```python
# config.py
import os
from pathlib import Path
from typing import Optional

def load_environment(env_name: str = None) -> None:
    """Load environment variables from .env files"""
    if env_name is None:
        env_name = os.environ.get('ENVIRONMENT', 'development')
    
    env_file = Path(f'.env.{env_name}')
    if env_file.exists():
        load_dotenv(env_file)
    
    # Always try to load .env (local overrides)
    load_dotenv('.env')

def get_required_env(key: str) -> str:
    """Get required environment variable or raise error"""
    value = os.environ.get(key)
    if not value:
        raise ValueError(f"Required environment variable {key} is not set")
    return value

def get_optional_env(key: str, default: str = None) -> Optional[str]:
    """Get optional environment variable with default"""
    return os.environ.get(key, default)

# Usage in your application
load_environment()
API_KEY = get_required_env('API_KEY')
DEBUG = get_optional_env('DEBUG', 'false').lower() == 'true'
```

### Step 3: Validate Configuration

Create validation for required secrets:

```python
# validation.py
import os
import sys
from typing import List, Dict

def validate_secrets(required_secrets: List[str]) -> Dict[str, bool]:
    """Validate that all required secrets are present"""
    results = {}
    missing_secrets = []
    
    for secret in required_secrets:
        value = os.environ.get(secret)
        is_present = bool(value and value.strip())
        results[secret] = is_present
        
        if not is_present:
            missing_secrets.append(secret)
    
    if missing_secrets:
        print(f"❌ Missing required secrets: {', '.join(missing_secrets)}")
        print("Please set these environment variables before running the application.")
        sys.exit(1)
    
    print("✅ All required secrets are configured")
    return results

# Usage
REQUIRED_SECRETS = ['API_KEY', 'DB_PASSWORD', 'JWT_SECRET']
validate_secrets(REQUIRED_SECRETS)
```

## Configure Claude Code Hooks for Secrets Protection

### Step 1: Set Up Secrets Detection Hook

Configure secrets detection using Claude Code's hooks system. You can use either the interactive `/hooks` command or manually edit your settings file.

**Method 1: Interactive Configuration (Recommended)**
```bash
# Open hooks configuration
/hooks
```
Follow the prompts to add PreToolUse hooks for file validation.

**Method 2: Manual Configuration**
Add to `.claude/settings.json` or `~/.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Validating content for secrets...' && if command -v detect-secrets >/dev/null 2>&1; then echo \"$content\" | detect-secrets scan --string - --force-use-all-plugins --quiet || (echo 'Secrets detected. Please remove before proceeding.' >&2 && exit 2); else echo \"$content\" | grep -E 'sk-[a-zA-Z0-9]{32,}|API_KEY.*=|password.*=' && (echo 'Potential secrets detected!' >&2 && exit 2) || true; fi"
          }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "if echo \"$command\" | grep -E '\\.(env|key|pem|p12|pfx)' >/dev/null; then echo 'Command accesses sensitive files. Please review.' >&2 && exit 2; fi"
          }
        ]
      }
    ]
  }
}
```

> **Important**: Claude Code provides environment variables like `$content` (file content) and `$command` (bash command) to hooks for validation.

### Step 2: Enhanced Secrets Detection

For more comprehensive detection, you can enhance your hooks with additional validation patterns:

**Install detect-secrets tool:**
```bash
# Install detect-secrets for advanced pattern detection
pip install detect-secrets

# Initialize secrets baseline (optional)
detect-secrets scan --all-files > .secrets.baseline

# Audit detected secrets
detect-secrets audit .secrets.baseline
```

**Common Secrets Patterns to Detect:**
- API Keys: `sk-[a-zA-Z0-9]{32,}`, `pk_[a-zA-Z0-9]{24,}`
- Database passwords: `password.*=.*`
- JWT tokens: `eyJ[A-Za-z0-9-_]+`
- Private keys: `-----BEGIN.*PRIVATE KEY-----`

**Testing Your Hooks:**
```bash
# Test hook configuration
/hooks

# Create test file with secrets to verify detection
echo "API_KEY=sk-abc123def456" > test-secrets.txt

# Try editing with Claude Code - should be blocked by hook
```

### Step 3: Create Secrets Detection Slash Command

Create `.claude/commands/detect-secrets.md`:

```markdown
---
name: detect-secrets
description: Scan codebase for potential secrets using detect-secrets tool
argument-hint: "[directory-path]"
---

# Detect Secrets Command

Scan the codebase for potential secrets and sensitive information using detect-secrets.

## Usage

```bash
/detect-secrets
/detect-secrets src/
/detect-secrets --update-baseline
```

## What This Command Does

1. **Scans all files** in the specified directory (or current directory)
2. **Detects potential secrets** using multiple detection plugins
3. **Compares against baseline** to identify new potential secrets
4. **Provides remediation guidance** for any findings

## Detection Capabilities

- **API Keys**: AWS, GitHub, Slack, etc.
- **Private Keys**: RSA, SSH, PGP keys
- **Database Credentials**: Connection strings, passwords
- **Authentication Tokens**: JWT, Bearer tokens
- **Configuration Secrets**: Environment variables, config files

## Expected Output

- Summary of files scanned
- List of potential secrets found (if any)
- Remediation steps for each finding
- Updated baseline file (if requested)

## Example

Scan the current project and provide a security assessment with specific remediation steps for any detected secrets.
```

## Use External Secrets Management

### Step 1: Set Up Cloud Secrets Manager

For AWS Secrets Manager:

```python
# secrets_manager.py
import boto3
import json
from typing import Dict, Any

class SecretsManager:
    def __init__(self, region_name: str = 'us-east-1'):
        self.client = boto3.client('secretsmanager', region_name=region_name)
    
    def get_secret(self, secret_name: str) -> Dict[str, Any]:
        """Retrieve secret from AWS Secrets Manager"""
        try:
            response = self.client.get_secret_value(SecretId=secret_name)
            return json.loads(response['SecretString'])
        except Exception as e:
            raise ValueError(f"Failed to retrieve secret {secret_name}: {e}")
    
    def get_secret_value(self, secret_name: str, key: str) -> str:
        """Get specific value from secret"""
        secret_dict = self.get_secret(secret_name)
        if key not in secret_dict:
            raise KeyError(f"Key {key} not found in secret {secret_name}")
        return secret_dict[key]

# Usage
secrets = SecretsManager()
api_key = secrets.get_secret_value('prod/myapp/api', 'api_key')
```

### Step 2: Configure for Different Environments

```python
# config/secrets.py
import os
from .secrets_manager import SecretsManager

class Config:
    def __init__(self):
        self.environment = os.environ.get('ENVIRONMENT', 'development')
        self.secrets_manager = None
        
        if self.environment == 'production':
            self.secrets_manager = SecretsManager()
    
    def get_api_key(self) -> str:
        if self.environment == 'production':
            return self.secrets_manager.get_secret_value(
                'prod/myapp/api', 'api_key'
            )
        else:
            return os.environ.get('API_KEY', 'dev-key-123')
    
    def get_db_password(self) -> str:
        if self.environment == 'production':
            return self.secrets_manager.get_secret_value(
                'prod/myapp/database', 'password'
            )
        else:
            return os.environ.get('DB_PASSWORD', 'dev-password')
```

### Step 3: Implement Secret Rotation

```python
# secret_rotation.py
from datetime import datetime, timedelta
from typing import Optional

class SecretRotationManager:
    def __init__(self, secrets_manager):
        self.secrets_manager = secrets_manager
    
    def should_rotate_secret(self, secret_name: str, max_age_days: int = 90) -> bool:
        """Check if secret should be rotated based on age"""
        try:
            response = self.secrets_manager.client.describe_secret(
                SecretId=secret_name
            )
            last_changed = response.get('LastChangedDate')
            if last_changed:
                age = datetime.now(last_changed.tzinfo) - last_changed
                return age.days > max_age_days
        except Exception:
            pass
        return False
    
    def rotate_api_key(self, secret_name: str) -> str:
        """Rotate API key and update secret"""
        # Generate new API key (implementation depends on service)
        new_key = self.generate_new_api_key()
        
        # Update secret
        self.secrets_manager.client.update_secret(
            SecretId=secret_name,
            SecretString=json.dumps({'api_key': new_key})
        )
        
        return new_key
```

## Secure Development Practices

### Step 1: Create Secure Development Guidelines

Create `SECURITY.md` in your project:

```markdown
# Security Guidelines

## Secrets Management

1. **Never commit secrets**: Use environment variables or secrets managers
2. **Use strong secrets**: Generate cryptographically secure random values
3. **Rotate regularly**: Update secrets according to your security policy
4. **Limit access**: Only grant access to secrets when necessary
5. **Monitor usage**: Log and audit secret access

## Development Workflow

1. **Local development**: Use `.env` files (never committed)
2. **Testing**: Use test-specific environment variables
3. **Production**: Use cloud secrets manager or secure key management

## Secret Generation

Use secure methods to generate secrets:

```bash
# Generate secure random string
openssl rand -base64 32

# Generate API key format
echo "sk-$(openssl rand -hex 16)"

# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Step 2: Implement Input Validation

```python
# security_utils.py
import re
import os
from pathlib import Path

def validate_filename(filename: str) -> str:
    """Validate filename to prevent path traversal"""
    if not re.match(r'^[\w\-. ]+$', filename):
        raise ValueError("Invalid filename")
    return filename

def safe_file_path(filename: str, base_dir: str = None) -> Path:
    """Create safe file path within project directory"""
    if base_dir is None:
        base_dir = os.getcwd()
    
    filename = validate_filename(filename)
    safe_path = Path(base_dir) / filename
    
    # Ensure path is within base directory
    if not str(safe_path.resolve()).startswith(str(Path(base_dir).resolve())):
        raise ValueError("Path traversal detected")
    
    return safe_path

def sanitize_input(user_input: str) -> str:
    """Sanitize user input to prevent injection"""
    # Remove potentially dangerous characters
    sanitized = re.sub(r'[<>&"\'\\]', '', user_input)
    return sanitized.strip()
```

### Step 3: Set Up Security Testing

```bash
# security_test.py
import unittest
import os
from unittest.mock import patch

class SecurityTest(unittest.TestCase):
    def test_no_hardcoded_secrets(self):
        """Test that no secrets are hardcoded in source"""
        # This would integrate with detect-secrets
        result = os.system('detect-secrets scan --all-files --force-use-all-plugins')
        self.assertEqual(result, 0, "Secrets detected in codebase")
    
    def test_environment_variables_required(self):
        """Test that required environment variables are validated"""
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaises(ValueError):
                from config import get_required_env
                get_required_env('API_KEY')
    
    def test_secure_random_generation(self):
        """Test that secrets are generated securely"""
        from secrets import token_urlsafe
        secret1 = token_urlsafe(32)
        secret2 = token_urlsafe(32)
        
        self.assertNotEqual(secret1, secret2)
        self.assertGreaterEqual(len(secret1), 32)
```

## Troubleshooting

### Environment Variable Issues
If environment variables aren't loading:
1. Check `.env` file syntax (no spaces around `=`)
2. Verify file permissions are readable
3. Ensure environment is loaded before use
4. Check for typos in variable names

### Secrets Detection False Positives
If secrets scanner reports false positives:
1. Add exceptions to `.secrets.baseline`
2. Use inline comments to mark false positives
3. Update detection patterns
4. Review and approve legitimate exceptions

### Cloud Secrets Manager Access
If cloud secrets access fails:
1. Verify IAM permissions
2. Check AWS credentials configuration
3. Confirm secret names and regions
4. Test network connectivity

## Best Practices

1. **Principle of Least Privilege**: Grant minimal secret access
2. **Regular Rotation**: Rotate secrets according to policy
3. **Monitoring**: Log and audit secret access
4. **Encryption**: Encrypt secrets at rest and in transit
5. **Separation**: Use different secrets for different environments
6. **Documentation**: Document secret management procedures

## Next Steps

- [Set up audit logging](setup-audit-logging.md)
- [Configure compliance monitoring](setup-compliance.md)
- [Implement incident response](setup-incident-response.md)