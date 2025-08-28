# Hook Exit Codes Reference

Technical reference for hook exit codes and their behavior in Claude Code.

## Exit Code Meanings

| Code | Meaning | Claude's Behavior | When to Use |
|------|---------|------------------|------------|
| **0** | Success | Continues normally | Everything is OK |
| **1** | Warning | Shows message, continues | Non-critical issues |
| **2** | Error | Shows message, Claude corrects | Issues Claude should fix |

## Our Hook Exit Codes

### Hooks that use Exit Code 2 (Claude will correct):

#### 1. **python_lint.py** ✅
- **When**: Linting errors found (Ruff, formatting issues)
- **Why**: Claude can automatically fix these issues
- **Message**: Shows specific linting problems and fix commands
```python
sys.exit(2)  # Claude will see errors and can run fixes
```

#### 2. **use_uv.py** ✅
- **When**: pip/pip3 commands detected
- **Why**: Claude should use UV instead
- **Message**: Suggests UV equivalent command
```python
sys.exit(2)  # Claude will correct to use UV
```

### Hooks that use Exit Code 0 (Non-blocking):

#### 1. **log_tool_use.py**
- **Purpose**: Logging only
- **Why**: Should never block operations

#### 2. **black_formatter.py**
- **Purpose**: Auto-formatting after edits
- **Why**: Formatting happens automatically, no need to block

### Best Practices

## When to Use Exit Code 2:

✅ **Use exit code 2 when:**
- Claude can fix the issue (linting, formatting)
- The issue blocks correctness (missing tests)
- You want to enforce a practice (use UV not pip)
- The error message provides clear correction instructions

❌ **Don't use exit code 2 when:**
- The operation is logging/monitoring only
- The fix happens automatically (auto-formatting)
- The issue is informational only
- You don't want to interrupt workflow

## Example Error Messages for Exit Code 2:

### Good (Actionable):
```python
error_msg = f"""
❌ Linting errors found in {file_path}

Issues:
- Line 42: Undefined variable 'x'
- Line 55: Unused import 'os'

To fix:
  ruff check --fix {file_path}
"""
print(error_msg, file=sys.stderr)
sys.exit(2)
```

### Bad (Not Actionable):
```python
print("Something went wrong", file=sys.stderr)
sys.exit(2)  # Claude doesn't know what to do
```

## Testing Hook Exit Codes

```bash
# Test a hook manually
echo '{"tool": "Edit", "file_path": "test.py"}' | python hooks/python_lint.py
echo $?  # Check exit code

# Exit codes:
# 0 = Success
# 1 = Warning  
# 2 = Error (Claude should correct)
```

## Summary

Our hooks correctly use exit code 2 for:
1. **Linting errors** - Claude can fix them
2. **Wrong package manager** - Claude can use UV instead
3. **Missing tests** - Claude can write tests first

This ensures Claude gets proper feedback and can take corrective action when needed.