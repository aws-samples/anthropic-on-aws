# How to Create Effective Agents

Build high-quality, focused agents that follow best practices.

## Prerequisites

- Understanding of agent basics
- Access to `.claude/agents/` directory
- Familiarity with YAML frontmatter

## Agent Structure Guidelines

### Step 1: Define Clear Purpose

Start with a focused, single-responsibility agent:

```markdown
---
name: security-reviewer
description: Use PROACTIVELY before deployments to identify vulnerabilities
model: opus  # Complex analysis requires opus
tools: [Read, Grep, Glob]  # Minimal necessary tools
---
```

**Key Principles:**
- One agent, one responsibility
- Clear trigger phrase in description
- Appropriate model for complexity
- Minimal tool set

### Step 2: Create Quick Reference

Always include a Quick Reference as the first content section:

```markdown
## Quick Reference
- Identifies OWASP Top 10 vulnerabilities
- Checks for hardcoded secrets
- Validates authentication flows
- Reviews dependency security
- Generates security report
```

**Guidelines:**
- 3-5 bullet points maximum
- Core capabilities only
- Action-oriented descriptions

### Step 3: Write Concise Activation Instructions

Keep activation instructions focused and brief:

```markdown
## Activation Instructions

- CRITICAL: Block any code with critical vulnerabilities
- WORKFLOW: Scan → Analyze → Report → Recommend
- Focus on security issues only
- Provide specific remediation steps
- STAY IN CHARACTER as SecBot, security expert
```

**Best Practices:**
- 5-6 lines maximum
- Start with CRITICAL rule in CAPS
- Include clear WORKFLOW
- End with character reminder

### Step 4: Define Core Identity

Create a focused identity without background stories:

```markdown
## Core Identity

**Role**: Principal Security Engineer
**Identity**: You are **SecBot**, who ensures code security.

**Principles**:
- **Zero Trust**: Verify everything, trust nothing
- **Defense in Depth**: Multiple security layers
- **Least Privilege**: Minimal access rights
- **Fail Secure**: Default to safe state
- **Continuous Validation**: Ongoing security checks
```

**Requirements:**
- No background stories or history
- Clear role and one-line identity
- 4-5 actionable principles
- Focus on behavior, not biography

### Step 5: Add Domain Knowledge

Include only essential domain knowledge with examples:

```markdown
## Domain Knowledge

### Authentication Patterns
```python
# Secure: Using bcrypt
password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt())

# Insecure: Plain MD5
password_hash = hashlib.md5(password.encode()).hexdigest()  # VULNERABLE
```

### Input Validation
- Always sanitize user input
- Use parameterized queries
- Validate types and ranges
```

**Guidelines:**
- 1-2 examples per concept
- Focus on practical patterns
- Include anti-patterns to avoid

### Step 6: Specify Output Format

Define clear, structured output format:

```markdown
## Output Format

Deliver findings as:
- **Risk Level**: CRITICAL | HIGH | MEDIUM | LOW
- **Issue**: Specific vulnerability found
- **Location**: File:line where found
- **Impact**: What could happen
- **Fix**: Specific remediation code
- **References**: OWASP/CWE identifiers
```

**Requirements:**
- Directive bullets (imperative mood)
- Structured format
- Clear field descriptions
- No prose paragraphs

## Model Selection Strategy

### Use Sonnet For:
- Code generation from templates
- Documentation writing
- Test generation
- Simple refactoring
- Routine automation
- Pattern matching

### Use Opus For:
- Complex architectural decisions
- Security analysis
- Performance optimization
- Legacy code archaeology
- Multi-step problem solving
- Cross-domain analysis

## Tool Selection Guidelines

### Start With Base Tools

```yaml
tools: [Read, Grep, Glob]
```

### Add Only When Necessary

| Tool | When to Add |
|------|-------------|
| `Write, Edit` | File modifications required |
| `Bash` | Command execution needed |
| `WebSearch` | Current information required |
| `TodoWrite` | Task tracking needed |
| `Task` | Multi-agent orchestration |

### Never Over-Request

```yaml
# ❌ Bad - requesting everything
tools: [Read, Write, Edit, MultiEdit, Grep, Glob, LS, Bash, BashOutput, WebSearch, WebFetch, Task, TodoWrite]

# ✅ Good - minimal set
tools: [Read, Write, Grep]
```

## Validation Checklist

Before deploying your agent, verify:

- [ ] **Single responsibility** - Does one thing well
- [ ] **Quick Reference section** - First content section
- [ ] **Concise activation** - 5-6 lines maximum
- [ ] **No background stories** - Identity focused on behavior
- [ ] **Minimal tools** - Only necessary ones
- [ ] **Clear output format** - Structured deliverables
- [ ] **Appropriate model** - Sonnet for simple, Opus for complex
- [ ] **Proactive trigger** - Clear "Use PROACTIVELY when..." phrase

## Emoji Usage Guidelines

### When to Use Emojis

Emojis can enhance agent communication when used appropriately:

**✅ Good Uses:**
- Status indicators: ✅ Success, ❌ Error, ⚠️ Warning
- Section markers in output: 🔍 Analysis, 📝 Report, 🚀 Deploy
- Progress tracking: ⏳ In Progress, ✅ Complete, 🔄 Retry
- Friendly greeting agents: 👋 Hello, 🎉 Celebration

**❌ Avoid:**
- Overuse in technical documentation
- Multiple emojis per line
- Decorative emojis without meaning
- Emojis in code comments or file names

### Examples

```markdown
## Output Format

Status indicators:
- ✅ **PASSED**: All tests successful
- ❌ **FAILED**: Critical issues found
- ⚠️ **WARNING**: Non-critical issues

Progress tracking:
- 🔍 Analyzing codebase...
- 📝 Generating report...
- ✅ Complete!
```

### Agent-Specific Guidelines

```yaml
# Friendly agents (greetings, tutorials)
color: green
# Can use emojis liberally: 👋😊🎉

# Technical agents (security, architecture)
color: blue
# Use sparingly for status only: ✅❌⚠️

# Critical agents (deployment, qa)
color: red
# Minimal emojis, focus on clarity: ⚠️🚨
```

## Common Mistakes to Avoid

### 1. Overly Verbose Instructions

**❌ Bad:**
```markdown
## Activation Instructions

- STEP 1: First, carefully read through this entire document
- STEP 2: Understand all the context and requirements
- STEP 3: Adopt the persona described below
- STEP 4: Follow the workflow exactly as specified
- STEP 5: Make sure to stay in character
[... continues for 20+ lines ...]
```

**✅ Good:**
```markdown
## Activation Instructions

- CRITICAL: Security issues block deployment
- WORKFLOW: Scan → Analyze → Report
- Focus only on security vulnerabilities
- STAY IN CHARACTER as SecBot
```

### 2. Unnecessary Background Stories

**❌ Bad:**
```markdown
**Background**: With 15 years of experience in cybersecurity, having worked at major tech companies and contributed to numerous security frameworks...
```

**✅ Good:**
```markdown
**Identity**: You are **SecBot**, who ensures code security.
```

### 3. Requesting Unnecessary Tools

**❌ Bad:**
```yaml
tools: [Read, Write, Edit, MultiEdit, Grep, Glob, LS, Bash, BashOutput, WebSearch, WebFetch]
```

**✅ Good:**
```yaml
tools: [Read, Grep]  # Only what's needed for security scanning
```

## Testing Your Agent

### Quick Test

```bash
# Test basic functionality
claude --agent your-agent "simple test task"

# Test with debug output
claude --debug --agent your-agent "test task" 2>&1 | grep -i agent
```

### Validation Script

```python
def validate_agent(file_path):
    """Validate agent meets best practices."""
    with open(file_path) as f:
        content = f.read()
    
    errors = []
    
    # Check structure
    if '## Quick Reference' not in content:
        errors.append("Missing Quick Reference section")
    
    # Check activation brevity
    if content.count('## Activation Instructions') == 1:
        activation = content.split('## Activation Instructions')[1].split('##')[0]
        if len(activation.strip().split('\n')) > 8:
            errors.append("Activation Instructions too verbose")
    
    # Check for background stories
    if 'Background:' in content:
        errors.append("Remove background stories")
    
    return errors
```

## Quick Reference

### Agent Structure Template

```markdown
---
name: agent-name
description: Use PROACTIVELY when [trigger]
model: sonnet
tools: [Read, Grep]
---

## Quick Reference
- Capability 1
- Capability 2
- Capability 3

## Activation Instructions
- CRITICAL: Most important rule
- WORKFLOW: Step → Step → Step
- Key behavior
- STAY IN CHARACTER as Name

## Core Identity
**Role**: Title
**Identity**: You are **Name**, who [impact].

**Principles**:
- **Principle**: Description

## Domain Knowledge
[Focused examples]

## Output Format
- **Field**: Description
```

## Related Guides

- [How to Deploy Agents](deploy-agent.md)
- [How to Fix Agent Issues](fix-agent-issues.md)
- [How to Test Agents](test-agents.md)
- [Agent Architecture Explained](../explanation/agent-architecture.md)