# Best Practices Guide

Production-ready patterns and recommendations for Claude Code advanced implementations.

## Table of Contents
1. [Architecture Principles](#architecture-principles)
2. [Agent Best Practices](#agent-best-practices)
3. [Hook Optimization](#hook-optimization)
4. [Workflow Design](#workflow-design)
5. [Security Considerations](#security-considerations)
6. [Performance Optimization](#performance-optimization)
7. [Team Collaboration](#team-collaboration)
8. [Monitoring and Observability](#monitoring-and-observability)
9. [Cost Optimization](#cost-optimization)
10. [Common Anti-Patterns](#common-anti-patterns)

## Architecture Principles

### 1. Separation of Concerns

**✅ Do:**
```markdown
# Specialized agents for specific tasks
.claude/
├── agents/
│   ├── security-reviewer.md    # Security only
│   ├── test-generator.md        # Testing only
│   ├── performance-profiler.md  # Analysis only
│   └── optimization-engineer.md # Implementation only
```

**❌ Don't:**
```markdown
# One agent trying to do everything
.claude/
└── agents/
    └── super-agent.md  # Does security, testing, performance, etc.
```

### 2. Composability Over Complexity

**✅ Do:**
```yaml
# Compose simple workflows
stages:
  - name: analyze
    agent: analyzer
    output: analysis
  
  - name: process
    agent: processor
    input: ${analyze.output}
```

**❌ Don't:**
```yaml
# Overly complex single stage
stages:
  - name: do_everything
    agent: complex-agent
    actions: [analyze, process, validate, deploy, test, rollback]
```

### 3. Fail Fast, Recover Gracefully

**✅ Do:**
```json
{
  "hooks": {
    "pre-commit": {
      "fail_fast": true,
      "on_failure": {
        "message": "Specific error: ${error}",
        "suggestion": "Run 'make fix' to resolve"
      }
    }
  }
}
```

**❌ Don't:**
```json
{
  "hooks": {
    "pre-commit": {
      "continue_on_error": true,
      "suppress_output": true
    }
  }
}
```

## Command Template Best Practices

### 1. Argument Handling

**✅ Always Handle Missing Arguments:**
```markdown
---
name: my-command
description: Does something useful
version: 1.0.0
argument-hint: [target] [--mode]
---

# Command Title

## Parameters
$ARGUMENTS

If no arguments provided above:
- Use sensible defaults
- Analyze current context
- Ask for clarification if needed
```

**❌ Don't Assume Arguments:**
```markdown
# Bad - fails when no arguments given
## Processing file: $ARGUMENTS
```

### 2. Clear Argument Instructions

**✅ Good Parsing Guidance:**
```markdown
## Input Parameters
$ARGUMENTS

Parse arguments to determine:
- Target: specific file or directory (default: current directory)
- Mode: --quick or --deep (default: --quick)
- Output: --json or --text (default: --text)

If no arguments provided, use defaults listed above.
```

### 3. Argument Hints

**✅ Helpful Hints:**
```yaml
argument-hint: <required-arg> [optional-arg] [--flag]
```

**Examples:**
- `argument-hint: <file-path>` - Single required argument
- `argument-hint: [target] [--deep]` - All optional
- `argument-hint: <issue-number> [--priority:high|medium|low]` - Required with optional flag

### 4. Deprecated Metadata Fields

**❌ Don't Use These:**
```yaml
---
name: my-command
model: opus        # ❌ Remove - let Claude choose
tools: [Read, Write]  # ❌ Remove - let Claude determine
---
```

**✅ Use Only These:**
```yaml
---
name: my-command
description: Clear description
version: 1.0.0
argument-hint: [optional-args]
---
```

## Agent Best Practices

### 1. Agent Structure Requirements

**✅ Standard Agent Structure (right-sized for purpose):**
```markdown
---
name: agent-name
description: Use PROACTIVELY when... [trigger phrase]
model: sonnet  # or opus for complex tasks
tools: [Read, Grep, Glob]  # Minimal necessary set
---

## Quick Reference
- Core capability 1
- Core capability 2  
- Primary workflow
- Key constraint
- Value proposition

## Activation Instructions

- CRITICAL: Most important rule in CAPS
- WORKFLOW: Step → Step → Step → Step
- Essential behavioral rule
- Another essential rule
- STAY IN CHARACTER as PersonaName, role

## Core Identity

**Role**: Senior/Principal Title
**Identity**: You are **PersonaName**, who [one-line impact].

**Principles**:
- **Principle**: Action-oriented description
- [4-5 more principles maximum]

## Domain Knowledge
[Focused content with 1-2 examples per concept]

## Output Format
Deliverables:
- **Field**: Description
- **Field**: Description
```

**❌ Common Mistakes:**
- Unnecessary verbosity without added value
- Missing Quick Reference section
- Overly verbose activation instructions
- Including background stories in persona
- Requesting unnecessary tools
- Using prose in output format

### 2. Model Selection Strategy

**Choose Sonnet for:**
- Code generation from templates
- Documentation writing
- Test generation
- API endpoint creation
- Simple refactoring
- Routine automation

**Choose Opus for:**
- Complex architectural decisions
- Security analysis
- Performance optimization
- Legacy code archaeology
- Multi-step problem solving
- Cross-domain analysis

```yaml
# Simple tasks - use sonnet
model: sonnet

# Complex analysis - use opus
model: opus
```

### 3. Essential Agent Elements

**Required Sections:**
1. **Quick Reference** (3-5 bullets) - First content section
2. **Activation Instructions** (5-6 lines max)
3. **Core Identity** (No background stories)
4. **Domain Knowledge** (Merged with responsibilities)
5. **Output Format** (Directive bullets)

**Agent Validation Checklist:**
```python
def validate_agent(content):
    checks = {
        'focused': is_content_focused(content),  # No unnecessary verbosity
        'has_quick_ref': '## Quick Reference' in content,
        'activation_brief': is_activation_concise(content),
        'has_identity': '## Core Identity' in content,
        'minimal_tools': count_tools(content) <= 7,
        'has_output': '## Output Format' in content
    }
    return all(checks.values())

def is_content_focused(content):
    """Check if content is focused and purposeful."""
    # Check for redundancy, unnecessary sections, verbose explanations
    return True  # Implementation depends on specific criteria
```

### 4. Minimal Tool Selection

**Base Tools (start with these):**
```yaml
tools: [Read, Grep, Glob]
```

**Add Only If Necessary:**
- `Write, Edit` - For file modifications
- `Bash` - For command execution
- `WebSearch` - For current information
- `TodoWrite` - For task management
- `Task` - For multi-agent orchestration

**Never Request All Tools:**
```yaml
# ❌ Bad
tools: [Read, Write, Edit, MultiEdit, Grep, Glob, LS, Bash, BashOutput, WebSearch, WebFetch, Task, TodoWrite]

# ✅ Good
tools: [Read, Write, Grep]  # Only what's needed
```

### 5. Effective Personas

**✅ Good Persona:**
```markdown
## Core Identity

**Role**: Principal Security Engineer
**Identity**: You are **SecureGuard**, who prevents breaches before they happen.

**Principles**:
- **Zero Trust**: Verify everything
- **Defense in Depth**: Layer protections
- **Shift Left**: Security from the start
- **Continuous Monitoring**: Never stop watching
- **Education First**: Teach secure practices
```

**❌ Bad Persona:**
```markdown
## Core Identity

**Role**: Security Expert
**Identity**: You are an agent that does security.

**Background**: [Long story about career history...]
**Certifications**: [List of credentials...]
**Experience**: [Detailed work history...]
```

### 6. Testing Agents

```python
# Test agent structure
def test_agent_structure():
    agent = load_agent("security-reviewer.md")
    assert agent.is_focused()  # No unnecessary content
    assert agent.has_section("Quick Reference")
    assert agent.activation_is_concise()
    assert agent.tools_count <= 7

# Test agent behavior
def test_agent_behavior():
    response = run_agent("security-reviewer", test_code)
    assert "SecureGuard" in response  # Stays in character
    assert follows_output_format(response)
```

## Advanced Topics

For detailed guidance on specific advanced topics, see:

### 📋 How-To Guides (Task-Oriented)
- **[Hook Optimization](./how-to/optimize-hooks.md)** - Make hooks faster and more efficient
- **[Security Implementation](./how-to/secure-claude-code.md)** - Secure your Claude Code deployments  
- **[Performance Optimization](./how-to/optimize-performance.md)** - Improve agent response times and reduce costs
- **[Team Collaboration](./how-to/collaborate-with-teams.md)** - Set up shared workflows and standards
- **[Cost Optimization](./how-to/optimize-costs.md)** - Reduce token usage and manage expenses

### 🎯 Explanation Documents (Understanding-Oriented)
- **[Workflow Design Principles](./explanation/workflow-design-principles.md)** - Why certain patterns work better
- **[Anti-Patterns](./explanation/anti-patterns.md)** - Common mistakes and how to avoid them

### 📖 Reference Documentation (Information-Oriented)
- **[Monitoring Configuration](./reference/monitoring-configuration.md)** - Complete monitoring and alerting setup

## Production Readiness Checklist

### Before Deploying to Production

- [ ] All agents have defined models and tools
- [ ] Hooks have timeout and retry configuration
- [ ] Workflows are idempotent and resumable
- [ ] Credentials are externalized
- [ ] Monitoring and alerting configured
- [ ] Cost limits and alerts set
- [ ] Audit logging enabled
- [ ] Backup and rollback procedures documented
- [ ] Team trained on patterns and tools
- [ ] Documentation up to date

## Continuous Improvement

### 1. Regular Reviews

```yaml
review_schedule:
  agents:
    frequency: monthly
    metrics: [usage, accuracy, cost]
  
  workflows:
    frequency: quarterly
    metrics: [success_rate, duration, cost]
  
  hooks:
    frequency: weekly
    metrics: [trigger_count, failure_rate]
```

### 2. A/B Testing

```yaml
experiments:
  - name: model_comparison
    variants:
      - name: control
        model: sonnet
      - name: treatment
        model: opus
    metrics: [accuracy, speed, cost]
    duration: 1_week
```

### 3. Feedback Loop

```python
# Collect and act on feedback
feedback_system = {
    "collection": ["user_ratings", "error_reports", "suggestions"],
    "analysis": "weekly",
    "action_items": "prioritized_backlog",
    "implementation": "sprint_planning"
}
```

## Next Steps

- Review [Troubleshooting Guide](./troubleshooting.md) for common issues
- Explore [Agent Templates](../agents/) for real implementations
- Check [Command Templates](../commands/) for more patterns
- Join [Community Forum](https://community.anthropic.com) for support

