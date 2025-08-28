# How to Optimize Hook Performance

Practical guide for making hooks faster and more efficient.

## Prerequisites

- Basic understanding of Claude Code hooks
- Existing hook configuration to optimize
- Access to hook execution logs

## Performance-First Design

### Make Hooks Fast

Create lightweight hooks that don't block development workflow:

```json
{
  "name": "quick-checks",
  "timeout": 10,
  "parallel": true,
  "actions": [
    {
      "type": "command",
      "command": "ruff check .",
      "cache": true
    }
  ]
}
```

### Avoid Slow Operations

Don't run expensive operations on every trigger:

```json
// ❌ Don't: Run full test suite on every commit
{
  "name": "slow-checks",
  "actions": [
    {
      "type": "command",
      "command": "pytest tests/",
      "timeout": 600
    }
  ]
}
```

## Progressive Validation Strategy

Set up hooks that validate incrementally based on context:

```json
{
  "name": "progressive-validation",
  "stages": [
    {
      "name": "quick",
      "timeout": 5,
      "actions": ["syntax-check", "lint-changed-files"]
    },
    {
      "name": "thorough",
      "when": "branch == 'main'",
      "actions": ["full-test-suite", "security-scan"]
    }
  ]
}
```

**Benefits:**
- Fast feedback for development branches
- Comprehensive validation for production
- Reduced CI/CD time

## Implement Smart Caching

### File-Based Caching

Cache results based on file changes:

```json
{
  "name": "cached-checks",
  "cache": {
    "key": "${files_hash}",
    "ttl": 3600
  },
  "actions": [
    {
      "type": "command",
      "command": "npm run build",
      "cache_output": true,
      "skip_if_cached": true
    }
  ]
}
```

### Time-Based Caching

Set appropriate cache durations:

- **Syntax checks**: 5 minutes
- **Builds**: 1 hour
- **Security scans**: 24 hours
- **Documentation**: 6 hours

## Optimize Command Execution

### Use Fast Tools

Replace slow tools with faster alternatives:

```bash
# Fast linting
ruff check .          # Instead of flake8
black --check .       # Instead of manual formatting

# Fast testing
pytest -x             # Stop on first failure
pytest --lf           # Run only last failed tests
```

### Parallel Execution

Run independent checks in parallel:

```json
{
  "name": "parallel-checks",
  "parallel": true,
  "max_workers": 4,
  "actions": [
    {"command": "ruff check ."},
    {"command": "mypy ."},
    {"command": "bandit -r ."},
    {"command": "black --check ."}
  ]
}
```

## Conditional Execution

### File Type Conditions

Run hooks only for relevant files:

```json
{
  "name": "python-checks",
  "when": "changed_files.any(f => f.endsWith('.py'))",
  "actions": ["python-lint", "python-test"]
}
```

### Branch Conditions

Different validation for different branches:

```json
{
  "name": "branch-specific",
  "actions": [
    {
      "when": "branch == 'main'",
      "command": "full-validation"
    },
    {
      "when": "branch.startsWith('feature/')",
      "command": "quick-validation"
    }
  ]
}
```

## Resource Management

### Set Timeouts

Prevent hooks from hanging:

```json
{
  "name": "timed-operations",
  "timeout": 30,
  "actions": [
    {
      "command": "long-running-task",
      "timeout": 60,
      "kill_on_timeout": true
    }
  ]
}
```

### Memory Limits

Control resource usage:

```json
{
  "name": "memory-controlled",
  "resources": {
    "memory": "512MB",
    "cpu": "0.5"
  }
}
```

## Troubleshooting Slow Hooks

### Measure Performance

Add timing to identify bottlenecks:

```json
{
  "name": "measured-hook",
  "actions": [
    {"command": "echo 'Starting checks at $(date)'"},
    {"command": "time ruff check ."},
    {"command": "echo 'Completed at $(date)'"}
  ]
}
```

### Profile Hook Execution

Use debugging output:

```bash
# Run hook with debug output
claude hook run my-hook --debug --verbose

# Check hook execution logs
tail -f ~/.claude/logs/hooks.log
```

### Common Performance Issues

1. **Running tests on every commit** - Use CI instead
2. **No caching** - Cache expensive operations
3. **Sequential execution** - Parallelize independent tasks
4. **Large file processing** - Process only changed files
5. **Network operations** - Cache or batch network calls

## Best Practices Summary

- Keep hooks under 10 seconds for development workflow
- Cache expensive operations with appropriate TTL
- Use progressive validation (quick → thorough)
- Run hooks in parallel when possible
- Set timeouts to prevent hanging
- Profile and measure to identify bottlenecks
- Consider the developer experience impact