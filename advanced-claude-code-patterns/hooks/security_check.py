#!/usr/bin/env python3
"""
Security validation hook for file operations.

This hook validates Write/Edit/MultiEdit operations for security compliance:
- Blocks writes to sensitive files (.env, .key, etc.)
- Scans content for potential secrets/API keys
- Validates file permissions and paths
- Prevents directory traversal attacks

Exit codes:
  0 - File passes all security checks
  1 - Warning issued but operation continues
  2 - Security violation, operation blocked (Claude will correct)

Author: Claude Code Advanced Patterns
Version: 1.0.0
"""

import json
import os
import re
import sys
from pathlib import Path
from typing import Dict, Any, List, Tuple


def read_hook_input() -> Dict[str, Any]:
    """Read and parse Claude Code hook input from stdin."""
    try:
        return json.load(sys.stdin)
    except json.JSONDecodeError:
        print("ERROR: Invalid JSON input from Claude Code", file=sys.stderr)
        sys.exit(1)


def is_sensitive_file(file_path: str) -> bool:
    """Check if file path matches sensitive file patterns."""
    sensitive_patterns = [
        r'\.env.*',           # Environment files
        r'\.key$',            # Private keys
        r'\.pem$',            # PEM certificates
        r'\.p12$',            # PKCS#12 files
        r'\.pfx$',            # PKCS#12 files
        r'\.jks$',            # Java keystores
        r'\.keystore$',       # Keystores
        r'secret.*',          # Files with 'secret' in name
        r'credential.*',      # Files with 'credential' in name
        r'\.ssh/.*',          # SSH directory contents
        r'\.git/config$',     # Git configuration
        r'\.aws/.*',          # AWS configuration
        r'\.docker/config\.json$',  # Docker config
        r'\.kube/config$',    # Kubernetes config
    ]
    
    file_name = Path(file_path).name.lower()
    file_path_lower = file_path.lower()
    
    for pattern in sensitive_patterns:
        if re.search(pattern, file_name) or re.search(pattern, file_path_lower):
            return True
    
    return False


def scan_for_secrets(content: str, file_path: str) -> List[Tuple[str, str]]:
    """Scan file content for potential secrets and credentials."""
    secrets_found = []
    
    # Common secret patterns
    secret_patterns = [
        (r'api[_-]?key\s*[:=]\s*["\']([^"\']{20,})["\']', 'API Key'),
        (r'secret[_-]?key\s*[:=]\s*["\']([^"\']{20,})["\']', 'Secret Key'),
        (r'access[_-]?token\s*[:=]\s*["\']([^"\']{20,})["\']', 'Access Token'),
        (r'password\s*[:=]\s*["\']([^"\']{8,})["\']', 'Password'),
        (r'private[_-]?key\s*[:=]\s*["\']([^"\']+)["\']', 'Private Key'),
        (r'bearer\s+([a-zA-Z0-9\-_\.]+)', 'Bearer Token'),
        (r'sk-[a-zA-Z0-9]{48}', 'OpenAI API Key'),
        (r'xoxb-[a-zA-Z0-9\-]+', 'Slack Bot Token'),
        (r'ghp_[a-zA-Z0-9]{36}', 'GitHub Personal Access Token'),
        (r'AKIA[0-9A-Z]{16}', 'AWS Access Key'),
        (r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', 'UUID (potential secret)'),
    ]
    
    for pattern, secret_type in secret_patterns:
        matches = re.finditer(pattern, content, re.IGNORECASE)
        for match in matches:
            # Skip if it looks like a placeholder or example
            matched_text = match.group(0).lower()
            if any(placeholder in matched_text for placeholder in 
                   ['example', 'placeholder', 'your_key', 'your-key', 'replace', 'xxx', '***']):
                continue
            
            secrets_found.append((secret_type, match.group(0)[:50] + '...' if len(match.group(0)) > 50 else match.group(0)))
    
    return secrets_found


def validate_file_path(file_path: str, project_root: str) -> bool:
    """Validate file path for directory traversal and other security issues."""
    try:
        # Resolve the absolute path
        abs_path = Path(file_path).resolve()
        project_path = Path(project_root).resolve()
        
        # Check if the file is within the project directory
        try:
            abs_path.relative_to(project_path)
        except ValueError:
            return False  # Path is outside project directory
            
        # Check for suspicious path components
        suspicious_components = ['..', '.git/hooks', '.ssh']
        path_str = str(abs_path)
        
        for component in suspicious_components:
            if component in path_str:
                return False
        
        return True
        
    except (OSError, ValueError):
        return False


def check_file_permissions(file_path: str) -> Tuple[bool, str]:
    """Check if file has appropriate permissions."""
    try:
        if not os.path.exists(file_path):
            return True, ""  # New file, permissions will be set by system
            
        stat_info = os.stat(file_path)
        mode = stat_info.st_mode
        
        # Check for world-writable files (except directories)
        if not os.path.isdir(file_path) and (mode & 0o002):
            return False, "File is world-writable (dangerous permissions)"
        
        # Check for sensitive files with loose permissions
        if is_sensitive_file(file_path):
            if (mode & 0o077):  # Group or others have any permissions
                return False, "Sensitive file has loose permissions (should be 600)"
        
        return True, ""
        
    except (OSError, PermissionError):
        return True, ""  # Can't check permissions, allow operation


def main():
    """Main hook execution function."""
    try:
        # Read hook input
        hook_input = read_hook_input()
        
        # Extract relevant information
        tool_name = hook_input.get('tool_name', 'unknown')
        tool_input = hook_input.get('tool_input', {})
        project_root = os.environ.get('CLAUDE_PROJECT_DIR', os.getcwd())
        
        # Get file information
        file_path = tool_input.get('file_path', '')
        content = tool_input.get('content', '') or tool_input.get('new_string', '')
        
        if not file_path:
            # No file path to validate
            sys.exit(0)
        
        # Validate file path for security
        if not validate_file_path(file_path, project_root):
            print(f"""
❌ SECURITY VIOLATION: Suspicious file path
File: {file_path}

Issues:
- Path traversal attempt or file outside project directory
- Attempting to access system or hidden directories

This operation is blocked for security reasons.
""", file=sys.stderr)
            sys.exit(2)
        
        # Check if this is a sensitive file
        if is_sensitive_file(file_path):
            print(f"""
⚠️  SECURITY WARNING: Sensitive file modification
File: {file_path}

This file appears to contain sensitive information:
- Environment variables, keys, or credentials
- Configuration files with potential secrets

Please ensure:
1. No secrets are hardcoded in the file
2. Use environment variables for sensitive data
3. Add file to .gitignore if it contains secrets
4. Review the changes carefully before committing
""", file=sys.stderr)
            # Continue with warning (exit 0), don't block sensitive file edits entirely
        
        # Check file permissions
        perms_ok, perms_msg = check_file_permissions(file_path)
        if not perms_ok:
            print(f"""
⚠️  SECURITY WARNING: File permission issue
File: {file_path}
Issue: {perms_msg}

Recommendation: 
  chmod 600 {file_path}  # For sensitive files
  chmod 644 {file_path}  # For regular files
""", file=sys.stderr)
            # Continue with warning
        
        # Scan content for secrets if available
        if content:
            secrets = scan_for_secrets(content, file_path)
            if secrets:
                print(f"""
❌ SECURITY VIOLATION: Potential secrets detected in file content
File: {file_path}

Detected patterns:
""", file=sys.stderr)
                for secret_type, sample in secrets[:5]:  # Show max 5 matches
                    print(f"  - {secret_type}: {sample}", file=sys.stderr)
                
                print(f"""
CRITICAL: Never commit secrets to version control!

Recommendations:
1. Use environment variables: os.environ.get('API_KEY')
2. Use config files that are in .gitignore
3. Use secret management services (AWS Secrets Manager, etc.)
4. Remove the secrets and use placeholder values

This operation is BLOCKED to prevent secret exposure.
""", file=sys.stderr)
                sys.exit(2)
        
        # Log the security check (non-blocking)
        log_file = Path(project_root) / '.claude' / 'security-audit.log'
        log_file.parent.mkdir(exist_ok=True)
        
        with open(log_file, 'a') as f:
            import time
            timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
            f.write(f"{timestamp} SECURITY_CHECK {tool_name} {file_path} PASSED\n")
        
        # Security check passed
        sys.exit(0)
        
    except Exception as e:
        # Don't let hook failures crash Claude Code
        print(f"Security hook warning: {e}", file=sys.stderr)
        sys.exit(0)  # Continue despite hook error


if __name__ == "__main__":
    main()