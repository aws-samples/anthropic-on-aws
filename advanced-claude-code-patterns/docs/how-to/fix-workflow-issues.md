# How to Fix Workflow Command Issues

Task-focused solutions for workflow command failures and execution problems.

## Prerequisites
- Workflow commands installed in `.claude/commands/`
- Basic understanding of slash command syntax
- Access to Claude Code execution context

## Fix: Workflow Command Not Executing

**Quick Diagnosis:**
```bash
# List available commands
claude /[tab]
# Check command exists
ls .claude/commands/
```

**Steps:**
1. **Verify command is installed:**
   ```bash
   # Check command file exists
   ls -la .claude/commands/your-command.md
   ```

2. **Check command metadata:**
   ```markdown
   ---
   name: command-name
   description: Brief description
   version: 1.0.0
   argument-hint: [optional-arguments]
   ```

3. **Retry command execution:**
   ```bash
   # Re-run the command
   /command-name [arguments]
   
   # Or try with different arguments
   /command-name --force
   ```

## Fix: Command Dependency Issues

**Problem:** Commands have implicit dependencies that aren't met.

**Error Example:**
```
Error: Cannot run /deploy without successful test run
```

**Steps:**
1. **Check prerequisites:**
   ```bash
   # Ensure tests pass first
   /test
   # Then run deployment
   /deploy
   ```

2. **Use command chains:**
   ```bash
   # Run multiple commands in sequence
   /test && /deploy
   ```

3. **Add manual override:**
   ```bash
   # Force deployment if you're confident
   /deploy --skip-checks
   ```

## Fix: Lost Command Context

**Problem:** Claude loses context between commands, previous work lost.

**Steps:**
1. **Use session persistence:**
   ```bash
   # Save your conversation
   claude --resume
   ```

2. **Document progress in CLAUDE.md:**
   ```bash
   # Update project memory
   /memory
   ```

3. **Use explicit context:**
   ```bash
   # Reference previous work explicitly
   Continue from where we left off with the authentication implementation
   ```

## Fix: Command Order Issues

**Problem:** Commands executed in wrong order causing failures.

**Error Example:**
```
Error: Cannot deploy before running tests
```

**Steps:**
1. **Follow recommended order:**
   ```bash
   # Example: EPCC workflow
   /epcc/epcc-explore "feature"
   /epcc/epcc-plan
   /epcc/epcc-code
   /epcc/epcc-commit
   ```

2. **Use workflow commands:**
   ```bash
   # TDD workflow for features
   /tdd/tdd-feature "user authentication"
   
   # TDD workflow for bugs
   /tdd/tdd-bugfix "login issue"
   ```

3. **Document command sequence:**
   ```markdown
   # In .claude/CLAUDE.md
   ## Command Workflow
   1. First run /analyze
   2. Then run /plan
   3. Finally run /implement
   ```

## Fix: Command Resource Issues

**Problem:** Commands consuming too much context or memory.

**Steps:**
1. **Use compact mode:**
   ```bash
   # Free up context space
   /compact
   ```

2. **Process in smaller batches:**
   ```bash
   # Instead of analyzing entire codebase
   /analyze src/module1
   /analyze src/module2
   ```

3. **Use targeted commands:**
   ```bash
   # Be specific about scope
   /code-review --file src/auth.py
   # Instead of
   /code-review --all
   ```

## Fix: Command Syntax Errors

**Problem:** Command has incorrect syntax or arguments.

**Steps:**
1. **Check command syntax:**
   ```bash
   # View available commands
   /[tab]
   
   # Check command help
   /command-name --help
   ```

2. **Common syntax fixes:**
   ```bash
   # ✅ Correct argument format
   /docs-tutorial "authentication"
   
   # ❌ Wrong format
   /docs-tutorial authentication
   ```

3. **Fix argument errors:**
   ```bash
   # ✅ Valid arguments
   /analyze-performance --profile --verbose
   
   # ❌ Invalid arguments
   /analyze-performance --invalid-flag
   ```

## Fix: Environment Variable Issues

**Problem:** Commands can't access required environment variables.

**Steps:**
1. **Set environment variables:**
   ```bash
   # Export before running Claude
   export GITHUB_TOKEN="your_token"
   claude
   ```

2. **Use .env file:**
   ```bash
   # Create .env file
   echo "GITHUB_TOKEN=your_token" > .env
   # Load it
   source .env
   ```

3. **Pass to MCP servers:**
   ```bash
   # Configure MCP with env vars
   claude mcp add github --env GITHUB_TOKEN=${GITHUB_TOKEN}
   ```

## Fix: Command Performance Issues

**Problem:** Commands running slowly or timing out.

**Steps:**
1. **Use targeted scope:**
   ```bash
   # Analyze specific files
   /analyze-performance src/bottleneck.py
   # Instead of entire codebase
   ```

2. **Break into smaller tasks:**
   ```bash
   # Process modules separately
   /refactor-code src/auth --module
   /refactor-code src/api --module
   ```

3. **Use appropriate agents:**
   ```bash
   # Use lighter agents for simple tasks
   Using @test-generator for unit tests
   # Instead of heavyweight agents
   ```

## Emergency Recovery

**Complete session reset:**
```bash
# Clear conversation and start fresh
/clear

# Compact to free memory
/compact

# Resume from saved state
claude --resume
```

**Backup and restore:**
```bash
# Backup command definitions
cp -r .claude/commands/ .claude/commands.backup/

# Restore from backup
cp .claude/commands.backup/working-command.md .claude/commands/
```

## Troubleshooting Commands

**Check configuration:**
```bash
# View current config
/config

# Check available commands
/help

# View command list
/[tab]

# Check MCP servers
claude mcp list
```

**Debug and testing:**
```bash
# Run health check
/doctor

# View token usage
/cost

# Test specific command
/command-name --dry-run
```

## When to Get Help

Contact support if:
- Commands exist but won't execute
- Context loss occurs repeatedly
- Performance issues persist after optimization
- Environment variables set but not accessible

Include in your report:
- Command file (.claude/commands/)
- Error messages
- Output of `/doctor`
- Claude Code version (`claude --version`)