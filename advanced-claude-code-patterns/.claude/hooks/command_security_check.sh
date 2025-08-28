#!/bin/bash
# Command Security Check Hook
# 
# This hook validates Bash commands for security compliance:
# - Blocks destructive commands (rm -rf /, chmod 777, etc.)
# - Flags suspicious operations (curl | sh, eval, etc.) 
# - Requires confirmation for sensitive operations
# - Blocks sudo operations entirely
#
# Exit codes:
#   0 - Command passes all security checks
#   1 - Warning issued but command continues  
#   2 - Security violation, command blocked (Claude will correct)
#
# Author: Claude Code Advanced Patterns
# Version: 1.0.0

set -euo pipefail

# Read Claude Code hook input from stdin
INPUT_JSON=$(cat)

# Extract command from hook input
COMMAND=$(echo "$INPUT_JSON" | jq -r '.tool_input.command // empty')
PROJECT_ROOT=${CLAUDE_PROJECT_DIR:-$(pwd)}

if [ -z "$COMMAND" ]; then
    # No command to validate
    exit 0
fi

# Function to log security events
log_security_event() {
    local event_type="$1"
    local command="$2" 
    local result="$3"
    
    local log_dir="$PROJECT_ROOT/.claude"
    mkdir -p "$log_dir"
    local log_file="$log_dir/security-audit.log"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "$timestamp COMMAND_SECURITY_CHECK $event_type \"$command\" $result" >> "$log_file"
}

# Function to block dangerous commands
check_dangerous_commands() {
    local cmd="$1"
    
    # Extremely dangerous commands that should never be allowed
    local dangerous_patterns=(
        "rm -rf /"
        "rm -rf \*"
        "> /dev/sda"
        "dd if=/dev/zero"
        "mkfs\."
        "fdisk /dev/"
        "parted /dev/"
        ":(){ :|:& };:"  # Fork bomb
    )
    
    for pattern in "${dangerous_patterns[@]}"; do
        if [[ "$cmd" == *"$pattern"* ]]; then
            echo "❌ SECURITY VIOLATION: Dangerous command blocked" >&2
            echo "Command: $cmd" >&2
            echo "" >&2
            echo "This command could cause system damage or data loss." >&2
            echo "Operation blocked for security reasons." >&2
            log_security_event "DANGEROUS_COMMAND" "$cmd" "BLOCKED"
            exit 2
        fi
    done
}

# Function to check for suspicious operations
check_suspicious_operations() {
    local cmd="$1"
    
    # More precise patterns to avoid false positives
    # These patterns specifically target download-and-execute scenarios
    local suspicious_patterns=(
        "curl\s+[^|]*\|\s*(sh|bash)\s*$"
        "wget\s+[^|]*\|\s*(sh|bash)\s*$"
        "curl\s+.*\s+\|\s+sh\s+"
        "wget\s+.*\s+\|\s+bash\s+"
        "(curl|wget)\s+.*\s*\|\s*(sh|bash)\s*$"
    )
    
    for pattern in "${suspicious_patterns[@]}"; do
        if echo "$cmd" | grep -qE "$pattern"; then
            # Additional validation to reduce false positives
            # Allow common legitimate patterns like "git diff | grep" or "cat file | head"
            if echo "$cmd" | grep -qE "^(git|cat|ls|find|grep|awk|sed|head|tail|sort|uniq)\s+.*\|" && ! echo "$cmd" | grep -qE "(curl|wget)\s+.*\|\s+(sh|bash)"; then
                log_security_event "LEGITIMATE_PIPE" "$cmd" "ALLOWED"
                continue
            fi
            
            echo "❌ SECURITY VIOLATION: Suspicious download and execute pattern" >&2
            echo "Command: $cmd" >&2 
            echo "" >&2
            echo "Downloading and executing scripts from the internet is dangerous." >&2
            echo "" >&2
            echo "Safer alternatives:" >&2
            echo "  1. Download first: curl -o script.sh https://example.com/script.sh" >&2
            echo "  2. Review the script: cat script.sh" >&2
            echo "  3. Execute if safe: bash script.sh" >&2
            log_security_event "SUSPICIOUS_DOWNLOAD" "$cmd" "BLOCKED"
            exit 2
        fi
    done
}

# Function to check for command injection risks
check_command_injection() {
    local cmd="$1"
    
    # Check for eval usage
    if echo "$cmd" | grep -qE "\beval\b"; then
        echo "⚠️  SECURITY WARNING: eval usage detected" >&2
        echo "Command: $cmd" >&2
        echo "" >&2
        echo "The 'eval' command can be dangerous as it executes arbitrary code." >&2
        echo "Please ensure the evaluated string is properly sanitized." >&2
        log_security_event "EVAL_USAGE" "$cmd" "WARNING"
        # Continue with warning (exit 0)
    fi
    
    # Check for exec usage
    if echo "$cmd" | grep -qE "\bexec\b.*\$"; then
        echo "⚠️  SECURITY WARNING: exec with variable detected" >&2
        echo "Command: $cmd" >&2
        echo "" >&2
        echo "Using 'exec' with variables can be risky." >&2
        echo "Ensure variables are properly validated." >&2
        log_security_event "EXEC_VARIABLE" "$cmd" "WARNING"
        # Continue with warning
    fi
}

# Function to check for destructive file operations
check_destructive_operations() {
    local cmd="$1"
    
    # Check for dangerous rm operations
    if echo "$cmd" | grep -qE "rm\s+.*-r.*-f|rm\s+.*-rf|rm\s+.*-fr"; then
        # Allow common safe patterns
        if echo "$cmd" | grep -qE "rm\s+-rf?\s+(\.pytest_cache|\*\.pyc|__pycache__|node_modules|\.git|build|dist|\.venv)"; then
            log_security_event "RM_RF_SAFE" "$cmd" "ALLOWED"
            return 0
        fi
        
        echo "⚠️  SECURITY WARNING: Recursive force delete detected" >&2
        echo "Command: $cmd" >&2
        echo "" >&2
        echo "The 'rm -rf' command permanently deletes files and directories." >&2
        echo "Please double-check the target path is correct." >&2
        log_security_event "RM_RF_WARNING" "$cmd" "WARNING"
        # Continue with warning
    fi
    
    # Check for dangerous chmod operations  
    if echo "$cmd" | grep -qE "chmod\s+(777|666)"; then
        echo "❌ SECURITY VIOLATION: Dangerous permissions detected" >&2
        echo "Command: $cmd" >&2
        echo "" >&2
        echo "Setting permissions to 777 or 666 makes files world-writable." >&2
        echo "This is a security risk." >&2
        echo "" >&2
        echo "Safer alternatives:" >&2
        echo "  chmod 755 file  # Executable files" >&2
        echo "  chmod 644 file  # Regular files" >&2
        echo "  chmod 600 file  # Private files" >&2
        log_security_event "DANGEROUS_CHMOD" "$cmd" "BLOCKED"
        exit 2
    fi
}

# Function to check operations requiring confirmation
check_confirmation_required() {
    local cmd="$1"
    
    local confirmation_patterns=(
        "git push.*--force"
        "git push.*-f\b"
        "git reset.*--hard"
        "npm publish"
        "pip upload"
        "pypi upload"
        "docker push.*:latest"
        "kubectl delete"
        "terraform destroy"
        "aws.*delete"
        "gcloud.*delete"
    )
    
    for pattern in "${confirmation_patterns[@]}"; do
        if echo "$cmd" | grep -qE "$pattern"; then
            echo "⚠️  SECURITY WARNING: Potentially destructive operation" >&2
            echo "Command: $cmd" >&2
            echo "" >&2
            echo "This command could have significant impact." >&2
            echo "Please ensure you want to proceed with this operation." >&2
            log_security_event "CONFIRMATION_REQUIRED" "$cmd" "WARNING"
            # Continue with warning, don't block
            return 0
        fi
    done
}

# Function to block sudo operations
check_sudo_usage() {
    local cmd="$1"
    
    if echo "$cmd" | grep -qE "^\s*sudo\b"; then
        echo "❌ SECURITY VIOLATION: sudo operations not permitted" >&2
        echo "Command: $cmd" >&2
        echo "" >&2
        echo "Claude Code hooks should not use sudo for security reasons." >&2
        echo "" >&2
        echo "If elevated privileges are needed:" >&2
        echo "  1. Run the command manually outside Claude Code" >&2
        echo "  2. Use user-level alternatives (e.g., --user flag for pip)" >&2
        echo "  3. Configure system permissions appropriately" >&2
        log_security_event "SUDO_BLOCKED" "$cmd" "BLOCKED"
        exit 2
    fi
}

# Function to check for network security issues
check_network_security() {
    local cmd="$1"
    
    # Check for connections to suspicious domains
    if echo "$cmd" | grep -qE "(localhost|127\.0\.0\.1).*\|.*sh"; then
        echo "❌ SECURITY VIOLATION: Local network execution detected" >&2
        echo "Command: $cmd" >&2
        echo "" >&2
        echo "Connecting to localhost and executing commands is suspicious." >&2
        log_security_event "LOCALHOST_EXEC" "$cmd" "BLOCKED"
        exit 2
    fi
    
    # Check for unencrypted downloads of executables
    if echo "$cmd" | grep -qE "http://.*\.(sh|py|pl|rb|exe|bin)"; then
        echo "⚠️  SECURITY WARNING: Unencrypted download of executable" >&2
        echo "Command: $cmd" >&2
        echo "" >&2
        echo "Downloading executables over HTTP is insecure." >&2
        echo "Consider using HTTPS instead." >&2
        log_security_event "HTTP_EXECUTABLE" "$cmd" "WARNING"
        # Continue with warning
    fi
}

# Main security validation
main() {
    echo "Checking command security: $COMMAND" >&2
    
    # Run all security checks
    check_dangerous_commands "$COMMAND"
    check_suspicious_operations "$COMMAND"
    check_command_injection "$COMMAND"
    check_destructive_operations "$COMMAND"
    check_confirmation_required "$COMMAND"
    check_sudo_usage "$COMMAND"
    check_network_security "$COMMAND"
    
    # Log successful validation
    log_security_event "COMMAND_CHECK" "$COMMAND" "PASSED"
    
    echo "Command security check passed" >&2
    exit 0
}

# Error handling
trap 'echo "Security hook error on line $LINENO" >&2; exit 0' ERR

# Run main function
main