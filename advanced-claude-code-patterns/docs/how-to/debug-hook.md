# How to Debug a Hook

Debug hooks that aren't working as expected in Claude Code.

## Prerequisites

- Hook configured in settings file
- Basic understanding of hook events
- Access to command line

## Quick Diagnosis

### Check If Hook Is Registered

```bash
# View current configuration
/config list

# Check specific settings file
cat .claude/settings.json | jq '.hooks'

# Verify file exists
ls -la .claude/settings*.json
```

### Verify Hook Syntax

```bash
# Validate JSON syntax
jq '.' .claude/settings.json > /dev/null

# Check for common issues
grep -E '"event":|"command":' .claude/settings.json
```

## Debug Step-by-Step

### Step 1: Enable Debug Mode

```bash
# Run Claude with debug output
claude --debug

# Or set environment variable
export CLAUDE_DEBUG=1
claude
```

### Step 2: Test Hook Manually

Create test script to simulate hook:

```bash
# Create test context using Claude Code hook input format
cat > /tmp/test-context.json << 'EOF'
{
  "session_id": "test-session",
  "transcript_path": "/tmp/test.jsonl",
  "cwd": "/test/directory",
  "hook_event_name": "PreToolUse",
  "tool_name": "Edit",
  "tool_input": {
    "file_path": "test.py",
    "content": "test content"
  }
}
EOF

# Run hook command manually
your-hook-command < /tmp/test-context.json
```

### Step 3: Add Logging to Hook

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Hook triggered' >&2 && your-actual-command"
          }
        ]
      }
    ]
  }
}
```

Or create wrapper script:

```bash
#!/bin/bash
# debug-wrapper.sh
INPUT=$(cat)
echo "[$(date)] Hook triggered" >> ~/hook-debug.log
echo "Input: $INPUT" >> ~/hook-debug.log

# Pass input to actual command
echo "$INPUT" | exec your-actual-command "$@"
```

### Step 4: Check Exit Codes

```bash
# Test command exit code
your-hook-command
echo "Exit code: $?"

# Common exit codes - see docs/reference/hooks/exit-codes.md for complete specs
# 0 = success
# 1 = warning (non-blocking)
# 2 = error (blocking - Claude should correct)
# 2 = correct parameters
# 126 = not executable
# 127 = command not found
```

## Common Issues and Solutions

### Hook Not Triggering

#### Check Event Name
```bash
# Verify exact event name (case-sensitive)
grep '"event"' .claude/settings.json

# Valid events (PascalCase):
# PreToolUse, PostToolUse, UserPromptSubmit, 
# Notification, Stop, SubagentStop, PreCompact, SessionStart
```

#### Check Tool Matcher
```bash
# Test if tool matcher is too restrictive
{
  "toolMatcher": {
    "tool": "Edit",
    "pathPattern": "*.py"  # Only matches Python files
  }
}

# Try broader matcher first
{
  "toolMatcher": {
    "tool": "Edit"  # Matches all Edit operations
  }
}
```

#### Verify File Permissions
```bash
# Check if script is executable
ls -la your-hook-script.sh
chmod +x your-hook-script.sh

# Check settings file permissions
ls -la .claude/settings.json
chmod 644 .claude/settings.json
```

### Hook Timing Out

#### Increase Timeout
```json
{
  "event": "preToolUse",
  "command": "slow-command",
  "timeout": 30000  // 30 seconds instead of default 5
}
```

#### Make Hook Non-Blocking
```json
{
  "event": "postToolUse",
  "command": "long-running-task &",
  "blocking": false
}
```

### Hook Blocking Incorrectly

#### Check Exit Code
```bash
# Ensure correct exit code
#!/bin/bash
if [ condition ]; then
  exit 0  # Allow
else
  exit 1  # Block
fi
```

#### Check Output Format
```bash
# For exit code 2 (correction)
echo '{"corrected": true, "parameters": {...}}'

# For blocking with message
echo '{"allow": false, "message": "Blocked because..."}'
```

### Environment Issues

#### Debug Environment Variables
```bash
# Add to hook command
{
  "command": "env | grep CLAUDE > /tmp/claude-env.log && your-command"
}
```

#### Set Required Variables
```json
{
  "event": "preToolUse",
  "command": "your-command",
  "env": {
    "PATH": "/usr/local/bin:$PATH",
    "CUSTOM_VAR": "value"
  }
}
```

### Working Directory Problems

#### Specify Working Directory
```json
{
  "event": "preToolUse",
  "command": "./relative-script.sh",
  "workingDirectory": "${PROJECT_ROOT}"
}
```

#### Use Absolute Paths
```json
{
  "command": "/absolute/path/to/script.sh"
}
```

## Testing Strategies

### Unit Test Your Hook

```bash
#!/bin/bash
# test-hook.sh

# Test case 1: Should allow
echo '{"toolName": "Read"}' | ./hook-script.sh
[ $? -eq 0 ] && echo "✓ Test 1 passed" || echo "✗ Test 1 failed"

# Test case 2: Should block
echo '{"toolName": "Bash", "parameters": {"command": "rm -rf"}}' | ./hook-script.sh
[ $? -eq 1 ] && echo "✓ Test 2 passed" || echo "✗ Test 2 failed"
```

### Integration Test

```bash
# Create test file
echo "test content" > test.txt

# Trigger hook through Claude
edit test.txt and add a comment

# Check if hook ran
grep "Hook executed" ~/hook-debug.log
```

### Performance Test

```bash
# Measure hook execution time
time your-hook-command < test-context.json

# Profile hook
/usr/bin/time -v your-hook-command < test-context.json
```

## Debug Output Analysis

### Parse Hook Logs

```bash
# Check recent hook executions
tail -f ~/hook-debug.log

# Count hook triggers
grep "Hook triggered" ~/hook-debug.log | wc -l

# Find errors
grep -i error ~/hook-debug.log
```

### Monitor in Real-Time

```bash
# Watch hook execution
claude --debug 2>&1 | grep -i hook

# Monitor specific event
claude --debug 2>&1 | grep preToolUse
```

## Advanced Debugging

### Use Strace (Linux/macOS)

```bash
# Trace system calls
strace -f -e trace=process claude

# On macOS
sudo dtruss -f claude
```

### Check Process Tree

```bash
# See hook process hierarchy
ps auxf | grep claude

# On macOS
pstree -p $(pgrep claude)
```

### Network Debugging

```bash
# If hook makes network calls
tcpdump -i any -w hook-traffic.pcap 'port 443'

# Or use simpler tool
curl -v https://api.example.com/webhook
```

## Quick Reference

### Debug Checklist

- [ ] Hook event name is correct
- [ ] Command path is absolute or in PATH
- [ ] Script has execute permissions
- [ ] JSON syntax is valid
- [ ] Tool matcher isn't too restrictive
- [ ] Timeout is sufficient
- [ ] Exit codes are correct
- [ ] Environment variables are set
- [ ] Working directory is correct
- [ ] No conflicting hooks

### Debug Commands

| Purpose | Command |
|---------|---------|
| Validate JSON | `jq '.' .claude/settings.json` |
| Test manually | `./hook-script.sh < test.json` |
| Check exit code | `echo $?` |
| Watch logs | `tail -f debug.log` |
| Trace execution | `bash -x hook-script.sh` |

## Related Guides

- [How to Create Hooks](create-hook.md)
- [How to Chain Hooks](chain-hooks.md)
- [How to Test Hooks](test-hooks.md)
- [Fix Hook Performance Issues](optimize-hooks.md)