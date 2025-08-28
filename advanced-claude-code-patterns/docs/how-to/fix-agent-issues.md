# How to Fix Agent Issues

Resolve common agent problems in Claude Code.

## Prerequisites

- Basic understanding of agents
- Access to `.claude/agents/` directories
- Claude Code installed and configured

## Agent Not Found

### Quick Diagnosis

```bash
# Check if agent exists
ls -la ~/.claude/agents/
ls -la .claude/agents/

# Verify agent name from the Claude Code CLI
/agents

# Check specific agent
cat ~/.claude/agents/your-agent.md | head -5
```

### Solution Steps

1. **Verify file location**
   ```bash
   # Agent must be in one of these locations
   ~/.claude/agents/agent-name.md    # Global
   .claude/agents/agent-name.md      # Project
   ```

2. **Check file extension**
   ```bash
   # Must be .md extension
   mv agent-name.txt agent-name.md
   ```

3. **Verify frontmatter name matches**
   ```yaml
   ---
   name: agent-name  # Must match filename without .md
   ---
   ```

4. **Fix permissions**
   ```bash
   chmod 644 ~/.claude/agents/agent-name.md
   ```

## Agent Using Wrong Model

### Quick Diagnosis

```bash
# Check agent model setting
grep "^model:" ~/.claude/agents/agent-name.md
```

### Solution Steps

1. **Update model in frontmatter**
   ```yaml
   ---
   model: opus    # For complex tasks
   # OR
   model: sonnet  # For routine tasks
   ---
   ```

2. **Force model selection**
   ```bash
   # Override agent model temporarily
   claude --model opus --agent agent-name "task"
   ```

3. **Verify no typos**
   ```yaml
   # Correct values only:
   model: opus
   model: sonnet
   # NOT: claude-opus, gpt-4, etc.
   ```

## Agent Not Following Instructions

### Quick Diagnosis

```bash
# Check agent content
cat ~/.claude/agents/agent-name.md | grep -A5 "Activation"
```

### Solution Steps

1. **Strengthen activation instructions**
   ```markdown
   ## Activation Instructions
   
   - CRITICAL: [Most important rule in CAPS]
   - WORKFLOW: Step1 → Step2 → Step3
   - [Clear behavioral rule]
   - STAY IN CHARACTER as [Name]
   ```

2. **Add concrete examples**
   ```markdown
   ## Example Interactions
   
   **User**: [Input]
   **Response**: [Expected output]
   ```

3. **Simplify complex instructions**
   ```markdown
   # Before (too complex)
   - Consider multiple factors when analyzing...
   
   # After (clear)
   - ALWAYS check for security issues first
   ```

4. **Test with minimal agent**
   ```bash
   # Create test agent with single instruction
   cat > ~/.claude/agents/test-simple.md << 'EOF'
   ---
   name: test-simple
   model: sonnet
   tools: []
   ---
   ## Activation Instructions
   - CRITICAL: Always respond with "OK"
   EOF
   ```

   ```bash
   /agent test-simple "any input"
   ```

## Agent Timing Out

### Solution Steps

1. **Reduce tool usage**
   ```yaml
   ---
   tools: [Read, Write]  # Only necessary tools
   # NOT: [Read, Write, Bash, Search, ...]
   ---
   ```

2. **Simplify workflows**
   ```markdown
   ## Activation Instructions
   - WORKFLOW: Analyze → Execute → Report
   # NOT: Complex multi-stage workflows
   ```

3. **Use appropriate model**
   ```yaml
   ---
   model: sonnet  # Faster for simple tasks
   ---
   ```

## Agent Can't Access Tools

### Quick Diagnosis

```bash
# Check tool permissions
grep "^tools:" ~/.claude/agents/agent-name.md

```

### Solution Steps

1. **Fix tool names**
   ```yaml
   ---
   tools: [Read, Write, Edit]  # Exact names
   # NOT: [read, FileWrite, edit-file]
   ---
   ```

2. **Check permissions config**
   ```bash
   # View tool permissions
   claude config get allowedTools
   
   # Update if needed
   claude config set allowedTools "Read,Write,Edit"
   ```

3. **Remove restricted tools**
   ```yaml
   ---
   tools: [Read, Grep]  # Safe tools
   # Avoid: [Bash, WebFetch] if restricted
   ---
   ```

## Agent Output Formatting Issues

### Solution Steps

1. **Define clear output format**
   ```markdown
   ## Output Format
   
   Always provide:
   - **Summary**: Brief overview
   - **Details**: Specific findings
   - **Actions**: Next steps
   ```

2. **Use structured examples**
   ```markdown
   ## Example Output
   
   ```
   Summary: Found 3 issues
   
   Details:
   1. Issue one
   2. Issue two
   3. Issue three
   
   Actions:
   - Fix issue one first
   - Then address two and three
   ```
   ```

3. **Set output constraints**
   ```markdown
   ## Output Requirements
   - Maximum 500 words
   - Use bullet points
   - Include code examples
   ```

## Quick Reference

### Common Fixes

| Issue | Command |
|-------|---------|
| Agent not found | `ls -la ~/.claude/agents/` |
| Wrong model | `sed -i 's/model: opus/model: sonnet/' agent.md` |
| Bad permissions | `chmod 644 ~/.claude/agents/*.md` |
| Name mismatch | Ensure `name:` matches filename |

## Related Guides

- [How to Create Custom Agents](create-agent.md)
- [How to Deploy Agents](deploy-agent.md)
- [How to Debug Hooks](debug-hook.md)
- [How to Optimize Performance](fix-performance-issues.md)