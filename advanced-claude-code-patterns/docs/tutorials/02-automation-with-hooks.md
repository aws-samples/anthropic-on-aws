# Tutorial 2: Automation with Hooks (15 minutes) 🪝

Welcome back! Now that you've mastered agents, let's learn about **hooks** - automated helpers that run at specific moments to maintain code quality and consistency. In the next 15 minutes, you'll build a hook that automatically validates your code before changes are made.

## What You'll Build

You're going to create a **Quality Validation Hook** that:
- Automatically runs before code editing
- Checks for common quality issues
- Prevents problematic changes from being made
- Maintains consistent code standards

## Prerequisites

- ✅ Completed [Tutorial 1: Getting Started with Agents](01-getting-started-agents.md) (understand agent basics)
- ✅ Claude Code installed and working
- ✅ `jq` installed for JSON processing (`brew install jq` on macOS, `apt install jq` on Ubuntu)
- ✅ Basic understanding of development workflows

Ready to automate quality? Let's build! 🚀

---

## Step 1: Understanding Hook Automation (3 minutes)

Before building, let's understand how hooks work:

### What Are Hooks?
**Hooks are event-driven automation** that trigger at specific workflow moments:

```
Development Action → Hook Trigger → Validation → Action Continues/Stops
```

### Hook Lifecycle Events
Claude Code provides several hook events that run at different points:

- **PreToolUse**: Before any tool executes (Edit, Write, Read, etc.) - can block execution
- **PostToolUse**: After any tool completes successfully
- **UserPromptSubmit**: When you submit a prompt, before Claude processes it
- **Notification**: When Claude Code sends notifications (awaiting input, etc.)
- **Stop**: When Claude Code finishes responding to your request
- **SubagentStop**: When subagent tasks complete
- **SessionStart**: When Claude Code starts or resumes a session
- **SessionEnd**: When Claude Code session ends

### Why Use Hooks?
- **Consistency**: Ensure standards are always applied
- **Prevention**: Catch issues before they become problems
- **Automation**: Remove manual quality checking
- **Team Alignment**: Everyone follows the same standards

---

## Step 2: Create Your Quality Hook (8 minutes)

Let's create a hook that validates code quality before edits using Claude Code's built-in hook configuration:

> **⚠️ Security Warning**: Hooks run automatically with your environment's credentials. Always review hook commands before adding them, as malicious hooks can compromise your system or data.

### Method 1: Interactive Configuration (Recommended)

```bash
# Open hooks configuration interface
/hooks
```

This opens the interactive hook configuration. Follow these steps:

1. **Select PreToolUse** from the available hook events
2. **Add a matcher**: Type `Edit` to target file editing operations  
3. **Add your first hook** with this command:
   ```bash
   echo 'Validating code quality...'
   ```
4. **Add a blocking hook** for TODO validation:
   ```bash
   jq -r '.tool_input.file_path' | { read file_path; if [ -f "$file_path" ] && grep -q 'TODO:' "$file_path"; then echo '⚠️ Unfinished TODOs found. Please complete before editing.' && exit 1; fi; }
   ```
5. **Add another blocking hook** for FIXME validation:
   ```bash
   jq -r '.tool_input.file_path' | { read file_path; if [ -f "$file_path" ] && grep -q 'FIXME' "$file_path"; then echo '⚠️ FIXME comments found. Please resolve before editing.' && exit 1; fi; }
   ```
6. **Save to User Settings** so the hook applies to all projects

### Method 2: Manual Configuration (Alternative)

If you prefer manual configuration, you can directly edit `~/.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Validating code quality...'"
          },
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | { read file_path; if [ -f \"$file_path\" ] && grep -q 'TODO:' \"$file_path\"; then echo '⚠️ Unfinished TODOs found. Please complete before editing.' && exit 1; fi; }"
          },
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | { read file_path; if [ -f \"$file_path\" ] && grep -q 'FIXME' \"$file_path\"; then echo '⚠️ FIXME comments found. Please resolve before editing.' && exit 1; fi; }"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '\"✅ File edited successfully: \" + .tool_input.file_path'"
          }
        ]
      }
    ]
  }
}
```

**What just happened?** You created a hook system that:
- **Uses JSON data processing**: Extracts file paths from tool input via `jq`
- **Validates before editing**: Checks for TODOs and FIXME comments in target files
- **Blocks problematic changes**: Stops edits if quality issues are found (exit code 1)
- **Provides clear feedback**: Shows validation messages and success confirmations
- **Follows security best practices**: Uses proper data extraction and validation

**Checkpoint**: Your hook is now active and will trigger before file edits.

### Bonus: Add a Notification Hook

While you're learning, let's add a notification hook to see the full power of hook events:

```bash
# Add this via /hooks or manually to your settings.json
```

**Notification Hook Configuration:**
```json
{
  "hooks": {
    "Notification": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "echo '🔔 Claude Code needs your attention!' && (command -v notify-send >/dev/null && notify-send 'Claude Code' 'Awaiting your input' || echo 'Desktop notifications not available')"
          }
        ]
      }
    ]
  }
}
```

This demonstrates how hooks can extend beyond just file operations to enhance your entire Claude Code experience.

> **⚠️ Important**: After creating new agents and commands, restart Claude Code to load the updated configuration.

---

## Step 3: Test Your Hook (2 minutes)

Let's test your quality automation:

### Create a Test File with Quality Issues
```bash
# Create test file with quality issues
cat > test-file.js << 'EOF'
function calculateTotal(items) {
  // TODO: Add input validation
  // FIXME: Handle negative numbers
  return items.reduce((sum, item) => sum + item.price, 0);
}
EOF
```

### Try to Edit the File
```bash
# This should be blocked by your hook - use Claude Code's Edit tool
# Try asking Claude: "Add a console.log statement to the test-file.js"
```

**Expected result**: Hook should detect TODOs/FIXME and block the edit with warning message like:
```
Validating code quality...
⚠️ Unfinished TODOs found. Please complete before editing.
```

### Clean the File and Try Again
```bash
# Remove quality issues
cat > test-file.js << 'EOF'
function calculateTotal(items) {
  // Validate input array
  if (!Array.isArray(items)) return 0;
  
  // Handle negative numbers by using absolute values
  return items.reduce((sum, item) => sum + Math.abs(item.price || 0), 0);
}
EOF

# Now try editing with Claude Code
# Ask Claude: "Add a console.log statement to the test-file.js"
```

**Expected result**: Hook allows the edit and shows success confirmation like:
```
Validating code quality...
✅ File edited successfully: test-file.js
```

**Success criteria**: Hook automatically validates code quality and prevents problematic edits.

---

## Step 4: Understand Hook Power (2 minutes)

Your quality hook demonstrates key automation concepts:

### Event-Driven Automation
- **Triggers**: Hooks respond to specific events (tool use, commits, etc.)
- **Conditional Logic**: Hooks can make decisions about whether to proceed
- **Feedback**: Hooks provide clear information about their actions

### Quality Enforcement Patterns
- **Prevention**: Stop problems before they happen
- **Validation**: Check against standards automatically
- **Consistency**: Apply rules uniformly across all development

### Professional Development Impact
This simple hook provides:
- **Code Quality**: Maintains standards without manual checking
- **Team Consistency**: Everyone follows the same quality rules
- **Error Prevention**: Catches issues early in development
- **Workflow Integration**: Quality checks happen automatically

---

## What You've Accomplished ✅

✓ **Created automated quality validation** that prevents problematic code changes
✓ **Learned hook lifecycle events** and when they trigger
✓ **Built event-driven automation** that maintains code standards
✓ **Implemented quality enforcement** that works consistently for all team members
✓ **Mastered hook configuration** with blocking and non-blocking behaviors

## Next Steps

Now that you understand automation, you're ready to:

- **Coordinate agents and hooks**: Build complete workflows → [Tutorial 3](03-building-workflows.md)
- **Create complex automation**: Learn advanced hook patterns → [How-to Guides](../how-to/)
- **Implement team standards**: Apply hooks across your development workflow

## Verify Success

### Quick Check
Your hook should automatically validate files before editing:
```bash
# Test with a file containing TODO comments - should be blocked
# Test with clean files - should proceed normally
```

### Complete Validation
1. **Hook Configuration Test**
   ```bash
   # View your hooks configuration
   /hooks
   # OR check settings directly
   cat ~/.claude/settings.json | jq '.hooks'
   ```
   **Success criteria**: Hooks are properly configured in settings

2. **Hook Data Processing Test**
   ```bash
   # Test jq processing (requires a sample JSON input)
   echo '{"tool_input":{"file_path":"test-file.js"}}' | jq -r '.tool_input.file_path'
   ```
   **Success criteria**: Returns "test-file.js" demonstrating proper JSON processing

3. **Quality Validation Test**
   - Create file with TODO → Ask Claude to edit → Should be blocked
   - Clean file → Ask Claude to edit → Should succeed
   **Success criteria**: Hook correctly prevents/allows edits based on quality

## Troubleshooting

**Problem**: Hook doesn't seem to trigger
**Solution**: 
- Check hook configuration with `/hooks` command
- Verify hook is in `~/.claude/settings.json`
- Ensure `jq` is installed: `which jq` (install with `brew install jq` or package manager)

**Problem**: Hook triggers but doesn't block edits
**Solution**: 
- Verify commands use `exit 1` for blocking behavior
- Check that JSON processing is working: test with sample input
- Review hook matcher is targeting correct tools (e.g., "Edit")

**Problem**: JSON processing errors
**Solution**: 
- Install jq: `brew install jq` (macOS) or `apt install jq` (Ubuntu)
- Test command independently: `echo '{"tool_input":{"file_path":"test.js"}}' | jq -r '.tool_input.file_path'`
- Check for shell escaping issues in hook commands

## Challenge: Extend Your Hook

Ready for more? Try extending your quality hook:

1. **Add more validations**: Check for console.log statements, long functions, missing documentation
2. **Add file type specificity**: Different rules for different file types (.js, .py, .md)
3. **Add custom messages**: Personalized feedback for different quality issues
4. **Add post-edit actions**: Format code automatically after successful edits

Your quality hook is now part of a professional development workflow that maintains standards automatically!

---

**Time to complete**: ~15 minutes  
**What you learned**: Hook lifecycle, event-driven automation, quality enforcement patterns  
**What you built**: Automated quality validation that maintains code standards consistently