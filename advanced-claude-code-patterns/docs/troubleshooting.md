# Troubleshooting Guide

Solutions to common issues when working with Claude Code advanced patterns.

## Table of Contents
1. [Quick Diagnostics](#quick-diagnostics)
2. [Agent Issues](#agent-issues)
3. [Hook Problems](#hook-problems)
4. [Workflow Failures](#workflow-failures)
5. [MCP Server Issues](#mcp-server-issues)
6. [Performance Problems](#performance-problems)
7. [Authentication and Permissions](#authentication-and-permissions)
8. [Environment Issues](#environment-issues)
9. [Error Messages](#error-messages)
10. [Recovery Procedures](#recovery-procedures)

## Quick Diagnostics

### Run Health Check

```bash
# Check Claude Code status
claude --version
/doctor

# Check configurations
/config list
claude mcp list

# Check agents (both locations)
ls -la ~/.claude/agents/     # Global
ls -la .claude/agents/       # Project-specific

# Check hooks (both locations)
ls -la ~/.claude/hooks/      # Global
ls -la .claude/hooks/        # Project-specific

# Check environment
env | grep CLAUDE
```

### Common Quick Fixes

| Symptom | Quick Fix |
|---------|-----------|
| Claude not responding | Exit and restart Claude Code |
| Agent not found | Check `~/.claude/agents/` (global) or `.claude/agents/` (project) |
| Hook not triggering | Verify event name and enabled status |
| MCP connection failed | `claude mcp restart [server-name]` |
| High token usage | Check model selection (opus vs sonnet) |
| Slow performance | Clear context with `/clear` |

## Agent Issues

### Issue: Agent Not Found

**Symptoms:**
```
Error: Agent 'security-reviewer' not found
```

**Solutions:**

1. **Check agent file exists:**
```bash
# Check both possible locations
ls ~/.claude/agents/security-reviewer.md      # Global
ls .claude/agents/security-reviewer.md        # Project
```

2. **Verify agent format:**
```markdown
# File must have YAML frontmatter
---
name: security-reviewer
model: opus
---
```

3. **Check file permissions:**
```bash
chmod 644 ~/.claude/agents/*.md    # Global
chmod 644 .claude/agents/*.md      # Project
```

4. **Reload agents:**
```bash
# Note: Agents are automatically reloaded when files change
# Or exit and restart Claude Code to reload
```

### Issue: Agent Using Wrong Model

**Symptoms:**
- Simple tasks using opus (expensive)
- Complex tasks failing with sonnet

**Solutions:**

1. **Check agent configuration:**
```markdown
---
name: my-agent
model: sonnet  # Change to opus for complex tasks
---
```

2. **Use conditional model selection:**
```markdown
For simple analysis: Continue with current model (sonnet)
For complex analysis: Request model upgrade to opus
```

3. **Override model at runtime:**
```bash
claude --model opus "Complex security analysis needed"
```

### Issue: Agent Not Following Instructions

**Symptoms:**
- Agent ignoring guidelines
- Inconsistent behavior
- Breaking character

**Solutions:**

1. **Validate agent structure:**
```python
def validate_agent(file_path):
    """Check agent meets requirements."""
    with open(file_path) as f:
        content = f.read()
    
    errors = []
    
    # Check for unnecessary verbosity
    if has_redundant_content(content):
        errors.append("Agent contains redundant or unfocused content")
    
    # Check required sections
    if '## Quick Reference' not in content:
        errors.append("Missing Quick Reference section")
    
    if '## Activation Instructions' not in content:
        errors.append("Missing Activation Instructions")
    
    # Check activation conciseness
    activation = content.split('## Activation Instructions')[1].split('##')[0]
    if is_overly_verbose(activation):
        errors.append("Activation Instructions are overly verbose")
    
    # Check for background stories
    if 'Background:' in content and len(content.split('Background:')[1].split('\n')[0]) > 100:
        errors.append("Remove background stories from persona")
    
    return errors

def has_redundant_content(content):
    """Check if agent has unnecessary verbosity."""
    # Look for repeated information, overly long explanations
    # This is context-dependent based on agent purpose
    return False  # Implementation varies by agent
```

2. **Fix common structure issues:**
```markdown
# ✅ GOOD Structure (focused and concise)
---
name: my-agent
description: Clear trigger phrase...
model: sonnet
tools: [Read, Grep, Glob]  # Minimal
---

## Quick Reference
- Capability 1
- Capability 2
- Workflow
- Constraint
- Value prop

## Activation Instructions

- CRITICAL: Most important rule
- WORKFLOW: Step → Step → Step
- Essential rule
- Another rule
- STAY IN CHARACTER as Name, role

## Core Identity

**Role**: Senior Title
**Identity**: You are **Name**, who [one line].

**Principles**:
- **Principle**: Action-oriented
- [4-5 more max]

# ❌ BAD Structure
---
name: my-agent
---

## Activation Instructions

- STEP 1: Read this entire file...
- STEP 2: Understand the context...
- STEP 3: Adopt the persona...
[... 20+ lines of instructions ...]

## Persona

**Background**: [Long career story...]
**Experience**: [Detailed history...]
```

3. **Test agent behavior:**
```bash
# Manually validate structure
# Check agent file format and frontmatter

# Test character consistency
response=$(claude --agent my-agent "test task")
echo "$response" | grep -q "PersonaName" || echo "Agent breaking character!"
```

## Hook Problems

### Issue: Hook Not Triggering

**Symptoms:**
- Expected automation not happening
- No hook execution logs

**Solutions:**

1. **Verify hook configuration:**
```json
{
  "name": "pre-commit",
  "enabled": true,  // Must be true
  "events": ["pre-commit"],  // Check event name
  "actions": [...]
}
```

2. **Check hook installation:**
```bash
# For git hooks
ls .git/hooks/
cat .git/hooks/pre-commit

# Should contain:
#!/bin/sh
# Hook script content goes here
# Hooks are triggered automatically by Claude Code
```

3. **Test hook manually:**
```bash
# Run hook script directly for testing
bash -x ~/.claude/hooks/pre-commit.sh
```

4. **Check conditions:**
```json
{
  "conditions": {
    "branches": ["main"],  // Current branch must match
    "files": ["*.py"],     // Changed files must match
    "environment": ["dev"]  // Current env must match
  }
}
```

### Issue: Hook Timing Out

**Symptoms:**
```
Error: Hook 'pre-commit' exceeded timeout of 30s
```

**Solutions:**

1. **Increase timeout:**
```json
{
  "timeout": 120,  // Increase from default 30s
  "actions": [...]
}
```

2. **Optimize hook actions:**
```json
{
  "parallel": true,  // Run actions in parallel
  "actions": [
    {
      "type": "command",
      "command": "quick-lint",  // Use faster tools
      "cache": true  // Cache results
    }
  ]
}
```

3. **Split into stages:**
```json
{
  "stages": [
    {
      "name": "quick",
      "timeout": 10,
      "actions": ["syntax-check"]
    },
    {
      "name": "thorough",
      "async": true,  // Run asynchronously
      "actions": ["full-test-suite"]
    }
  ]
}
```

### Issue: Hook Failing Silently

**Symptoms:**
- Hook appears to run but nothing happens
- No error messages

**Solutions:**

1. **Enable verbose logging:**
```json
{
  "debug": true,
  "verbose": true,
  "log_file": "hook.log"
}
```

2. **Add error handling:**
```json
{
  "actions": [
    {
      "type": "command",
      "command": "test-command",
      "on_failure": {
        "log": true,
        "message": "Command failed: ${error}",
        "abort": true
      }
    }
  ]
}
```

3. **Check command availability:**
```bash
# Verify commands exist
which black
which pytest
which npm
```

## Workflow Failures

### Issue: Workflow Stuck

**Symptoms:**
- Workflow not progressing
- Tasks in pending state

**Solutions:**

1. **Check workflow status:**
```bash
# Note: Workflow commands may vary by implementation
# Check workflow status through your CI/CD system
# Or use project-specific workflow commands
```

2. **Identify blocking task:**
```yaml
stages:
  - name: stuck_stage
    timeout: 300  # Add timeout
    on_timeout: skip  # Or: fail, retry
```

3. **Force progression:**
```bash
# Skip current stage (implementation-specific)
# Check your workflow system documentation
```

4. **Restart workflow:**
```bash
# Restart workflow (implementation-specific)
# Check your workflow system documentation
```

### Issue: Workflow Dependencies Not Met

**Symptoms:**
```
Error: Stage 'deploy' depends on 'test' which failed
```

**Solutions:**

1. **Add conditional dependencies:**
```yaml
stages:
  - name: deploy
    depends_on: 
      - stage: test
        condition: success  # Or: complete, skipped
```

2. **Allow partial success:**
```yaml
stages:
  - name: deploy
    depends_on: [test]
    continue_on_dependency_failure: true
    when: ${test.success_rate} > 0.8
```

3. **Add fallback path:**
```yaml
stages:
  - name: deploy
    depends_on: [test]
    on_dependency_failure:
      - name: manual_review
        type: approval
```

### Issue: Workflow State Lost

**Symptoms:**
- Workflow restart from beginning
- Previous progress lost

**Solutions:**

1. **Enable state persistence:**
```yaml
state:
  backend: redis  # Or: file, database
  ttl: 86400
  checkpoint_frequency: after_each_task
```

2. **Recover from checkpoint:**
```bash
# Recover from checkpoint (implementation-specific)
# Check your workflow system documentation
```

3. **Manual state recovery:**
```python
# Recover workflow state
import json

state_file = ".claude/workflow-state.json"
state = json.load(open(state_file))
state["current_stage"] = "deployment"
state["completed_tasks"] = ["test", "build"]
json.dump(state, open(state_file, "w"))
```

## MCP Server Issues

### Issue: MCP Server Won't Start

**Symptoms:**
```
Error: Failed to start MCP server 'github'
```

**Solutions:**

1. **Check installation:**
```bash
# Verify MCP server installed
claude mcp list
npm list @modelcontextprotocol/server-github
```

2. **Check environment variables:**
```bash
# Ensure required vars set
echo $GITHUB_TOKEN
echo $DATABASE_URL
```

3. **Test MCP server directly:**
```bash
# Run server manually
npx @modelcontextprotocol/server-github

# Check logs
tail -f ~/.claude/logs/mcp-github.log
```

4. **Reinstall MCP server:**
```bash
claude mcp remove github
claude mcp add github -- npx @modelcontextprotocol/server-github
```

### Issue: MCP Authentication Failed

**Symptoms:**
```
Error: Authentication failed for MCP server 'postgres'
```

**Solutions:**

1. **Verify credentials:**
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

2. **Update MCP configuration:**
```json
// .claude/mcp-settings.json
{
  "servers": {
    "postgres": {
      "env": {
        "DATABASE_URL": "${env:DATABASE_URL}"
      }
    }
  }
}
```

3. **Use secure credential storage:**
```bash
# Use secret manager
export DATABASE_URL=$(vault kv get -field=password secret/db)
```

### Issue: MCP Timeout

**Symptoms:**
- MCP operations timing out
- Slow responses

**Solutions:**

1. **Increase timeout:**
```json
{
  "servers": {
    "database": {
      "timeout": 30000,  // 30 seconds
      "connection_timeout": 5000
    }
  }
}
```

2. **Optimize queries:**
```sql
-- Add indexes
CREATE INDEX idx_user_email ON users(email);

-- Limit results
SELECT * FROM large_table LIMIT 100;
```

3. **Use connection pooling:**
```json
{
  "servers": {
    "database": {
      "pool": {
        "min": 2,
        "max": 10
      }
    }
  }
}
```

## Performance Problems

### Issue: Slow Agent Responses

**Symptoms:**
- Long wait times
- Timeouts

**Solutions:**

1. **Use appropriate model:**
```markdown
---
model: sonnet  # Faster for simple tasks
# model: opus  # Only for complex analysis
---
```

2. **Implement caching:**
```python
from functools import lru_cache

@lru_cache(maxsize=100)
def get_agent_response(agent, input_hash):
    return claude(f"Using {agent}: {input_hash}")
```

3. **Limit scope:**
```markdown
## Focus Areas
Only analyze:
- Files in src/
- Python files
- Modified in last commit
```

### Issue: High Memory Usage

**Symptoms:**
- System slowdown
- Out of memory errors

**Solutions:**

1. **Set resource limits:**
```yaml
resources:
  limits:
    memory: 2Gi
    cpu: 2
```

2. **Clear cache:**
```bash
# Clear conversation context
/clear
# Clear cache files manually if needed
rm -rf ~/.claude/cache/*
```

3. **Limit concurrent operations:**
```yaml
parallel:
  max_workers: 4  # Reduce from default
  chunk_size: 10  # Process in smaller batches
```

### Issue: Token Limit Exceeded

**Symptoms:**
```
Error: Token limit exceeded (used 150k/128k)
```

**Solutions:**

1. **Reduce context:**
```bash
# Use targeted file reading
Analyze only src/main.py

# Clear conversation
/clear
```

2. **Split into smaller tasks:**
```yaml
stages:
  - name: analyze_part1
    files: ["src/module1/*"]
  - name: analyze_part2
    files: ["src/module2/*"]
```

3. **Use summarization:**
```markdown
First, summarize the codebase structure.
Then, focus only on the authentication module.
```

## Authentication and Permissions

### Issue: Permission Denied

**Symptoms:**
```
Error: Permission denied accessing /protected/path
```

**Solutions:**

1. **Check file permissions:**
```bash
ls -la /protected/path
chmod 644 file.txt
```

2. **Run with correct user:**
```bash
sudo -u claude-user claude command
```

3. **Configure allowed paths:**
```json
{
  "security": {
    "allowed_paths": [
      "/home/user/project",
      "/tmp"
    ],
    "denied_paths": [
      "/etc",
      "/root"
    ]
  }
}
```

### Issue: API Rate Limiting

**Symptoms:**
```
Error: Rate limit exceeded for GitHub API
```

**Solutions:**

1. **Implement backoff:**
```json
{
  "retry": {
    "strategy": "exponential_backoff",
    "max_attempts": 3,
    "initial_delay": 1000
  }
}
```

2. **Cache API responses:**
```python
import time

cache = {}
CACHE_TTL = 300  # 5 minutes

def cached_api_call(endpoint):
    if endpoint in cache:
        if time.time() - cache[endpoint]['time'] < CACHE_TTL:
            return cache[endpoint]['data']
    
    result = make_api_call(endpoint)
    cache[endpoint] = {'data': result, 'time': time.time()}
    return result
```

3. **Use webhooks instead of polling:**
```yaml
triggers:
  - webhook: https://api.example.com/webhooks
    events: [push, pull_request]
```

## Environment Issues

### Issue: Environment Variables Not Set

**Symptoms:**
```
Error: Environment variable GITHUB_TOKEN not found
```

**Solutions:**

1. **Set variables:**
```bash
# Temporary
export GITHUB_TOKEN=ghp_xxxxx

# Permanent (.bashrc/.zshrc)
echo 'export GITHUB_TOKEN=ghp_xxxxx' >> ~/.bashrc
source ~/.bashrc
```

2. **Use .env file:**
```bash
# Create .env
cat > .env << EOF
GITHUB_TOKEN=ghp_xxxxx
DATABASE_URL=postgresql://localhost/db
EOF

# Load it
source .env
```

3. **Check variable loading:**
```bash
# Debug environment
claude --debug env
```

### Issue: Wrong Python/Node Version

**Symptoms:**
```
Error: Required Python 3.9+, found 3.7
```

**Solutions:**

1. **Use version managers:**
```bash
# Python (pyenv)
pyenv install 3.9.0
pyenv local 3.9.0

# Node (nvm)
nvm install 16
nvm use 16
```

2. **Use virtual environments:**
```bash
# Python
python3.9 -m venv venv
source venv/bin/activate

# Node
npm init -y
npm install --save-dev node@16
```

3. **Docker container:**
```dockerfile
FROM python:3.9
WORKDIR /app
COPY . .
RUN pip install claude-code
```

## Error Messages

### Common Error Messages and Solutions

| Error Message | Cause | Solution |
|--------------|-------|----------|
| `Model not available` | Invalid model name | Use 'sonnet' or 'opus' |
| `Tool not permitted` | Agent lacks tool access | Add tool to agent config |
| `Workflow cycle detected` | Circular dependencies | Review stage dependencies |
| `Hook already registered` | Duplicate hook name | Use unique hook names |
| `MCP server unreachable` | Connection issue | Check network and server status |
| `Context length exceeded` | Too much data | Reduce input size or clear context |
| `Invalid YAML syntax` | Malformed configuration | Validate YAML syntax |
| `Agent timeout` | Long-running operation | Increase timeout or optimize |

## Recovery Procedures

### Disaster Recovery

**Complete System Reset:**
```bash
# Backup current state
cp -r .claude .claude.backup

# Clean reset
rm -rf .claude
/init

# Restore configurations (choose destination)
cp agents/* ~/.claude/agents/          # Global restore
cp agents/* .claude/agents/            # Project restore
cp hooks/* ~/.claude/hooks/            # Global hooks
cp hooks/* .claude/hooks/              # Project hooks
```

**Corrupted Configuration:**
```bash
# Use doctor command to check system
/doctor

# Manually check and fix configuration files
# Check agents in ~/.claude/agents/ and .claude/agents/
# Check hooks in ~/.claude/hooks/ and .claude/hooks/
```

**Emergency Rollback:**
```bash
# Git-based rollback
git checkout HEAD~1 .claude/

# Or timestamp-based
claude restore --timestamp "2024-01-01 12:00:00"
```

### Data Recovery

**Lost Workflow State:**
```python
# Recover from logs
import re

log_file = open("~/.claude/logs/workflow.log")
state = {}

for line in log_file:
    if "STATE:" in line:
        match = re.search(r'STATE: (.+)', line)
        if match:
            state = json.loads(match.group(1))

# Restore state manually
# Copy state.json to appropriate location based on your workflow system
```

**Cache Corruption:**
```bash
# Clear conversation context
/clear

# Manually clear cache files if needed
rm -rf ~/.claude/cache/*
```

## Debug Mode

### Enable Comprehensive Debugging

```bash
# Maximum verbosity
export CLAUDE_DEBUG=true
export CLAUDE_LOG_LEVEL=debug
export CLAUDE_TRACE=true

# Run with debug flags
claude --debug --verbose --trace "Your command"

# Check debug output
tail -f ~/.claude/logs/debug.log
```

### Debug Configuration

```json
// .claude/debug.json
{
  "debug": {
    "enabled": true,
    "log_level": "debug",
    "trace_agents": true,
    "trace_hooks": true,
    "trace_workflows": true,
    "trace_mcp": true,
    "save_all_responses": true,
    "break_on_error": true
  }
}
```

## Getting Additional Help

### Resources

1. **Documentation**: [Full documentation](./README.md)
2. **Templates**: Check repository `templates/`, `agents/`, and `commands/` directories
3. **Community Forum**: https://community.anthropic.com
4. **GitHub Issues**: https://github.com/anthropics/claude-code/issues
5. **Discord**: Join the Claude Code Discord

### Reporting Issues

When reporting issues, include:

```markdown
## Issue Report

**Version**: claude --version output
**OS**: Operating system and version
**Config**: Relevant configuration files
**Error**: Complete error message
**Steps**: How to reproduce
**Expected**: What should happen
**Actual**: What actually happens
**Logs**: Relevant log entries
```

### Emergency Support

For critical production issues:
1. Check [Status Page](https://status.anthropic.com)
2. Review [Known Issues](https://github.com/anthropics/claude-code/issues)
3. Contact support with issue details

---

*This troubleshooting guide is continuously updated based on user feedback. Contribute solutions via [GitHub](https://github.com/anthropics/claude-code).*