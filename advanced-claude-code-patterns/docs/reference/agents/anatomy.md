# Agent Anatomy Reference

Complete technical specification for Claude Code agent structure and components.

## Agent File Structure

Every agent is a Markdown file with three main components:

```
---
[YAML Frontmatter]     # Metadata and configuration
---

[Markdown Content]     # Behavioral instructions and knowledge
```

## Frontmatter Specification

### Required Fields

```yaml
---
name: agent-name           # Unique identifier (kebab-case)
description: string        # When and why to use this agent
model: sonnet|opus        # Model selection based on complexity
tools: []                 # Array of permitted tool names
---
```

### Extended Metadata (Recommended)

```yaml
---
name: agent-name
description: string
model: sonnet|opus
tools: []
version: v1.0.0           # Semantic versioning
author: string            # Creator name or team
last_updated: YYYY-MM-DD  # Last modification date
tags: []                  # Categorization tags
---
```

## Content Sections

### 1. Quick Reference (Required First)

**Purpose**: Immediate understanding of agent capabilities

```markdown
## Quick Reference
- Primary capability statement (< 80 chars)
- Core workflow or process description
- Key constraints or requirements
- Main value proposition
- Critical dependencies or prerequisites
```

**Requirements**:
- Must be the first section after frontmatter
- Exactly 3-5 bullet points
- Each bullet under 80 characters
- Focus on capabilities, not features

### 2. Activation Instructions (Required)

**Purpose**: Behavioral control and workflow definition

```markdown
## Activation Instructions

- CRITICAL: [Most important rule in CAPS]
- WORKFLOW: [Step] → [Step] → [Step] → [Step]
- [Essential behavioral rule]
- [Essential behavioral rule]
- STAY IN CHARACTER as [Persona], [role]
```

**Requirements**:
- First line must start with "CRITICAL:"
- Second line must define "WORKFLOW:"
- Maximum 6 lines total
- Last line must establish character/persona

### 3. Core Identity (Required)

**Purpose**: Establish agent persona and principles

```markdown
## Core Identity

**Role**: [Professional Title]
**Identity**: You are **[PersonaName]**, who [impactful description].

**Principles**:
- **[Principle]**: [Action-oriented description]
- **[Principle]**: [Action-oriented description]
- **[Principle]**: [Action-oriented description]
```

**Requirements**:
- Role and Identity fields required
- Persona name must be bold
- 2-4 action-oriented principles
- No background stories or fluff

### 4. Behavioral Contract (Recommended)

**Purpose**: Define predictable behavior patterns

```markdown
## Behavioral Contract

### ALWAYS:
- Validate input before processing
- Log significant operations
- Provide clear error messages
- Follow existing code patterns
- Test changes before committing

### NEVER:
- Modify code without understanding context
- Skip error handling
- Ignore security implications
- Break existing functionality
- Assume defaults without checking
```

**Requirements**:
- 5-7 rules per section
- Rules must be absolute (no exceptions)
- Focus on observable behaviors
- Include both ALWAYS and NEVER sections

### 5. Domain Knowledge Sections

**Purpose**: Provide specialized expertise

```markdown
## [Domain Area]

### [Specific Topic]
[Concise explanation or pattern]

```language
# Code example demonstrating concept
code here
```

### [Another Topic]
[Pattern or best practice]

**Example**:
```language
# Another focused example
```
```

**Requirements**:
- Keep sections focused and concise
- Include practical code examples
- Use appropriate language syntax highlighting
- Avoid redundant explanations

### 6. Pipeline Integration (Recommended)

**Purpose**: Define how agent works with others

```markdown
## Pipeline Integration

### Input Requirements
- Accepts: [data format/structure]
- Validates: [validation rules]
- Prerequisites: [required context]

### Output Contract
- Produces: [output format]
- Guarantees: [quality promises]
- Format: [JSON/Markdown/etc]

### Compatible Agents
**Upstream**: agents that typically precede this one
- `agent-1`: Provides [what]
- `agent-2`: Supplies [what]

**Downstream**: agents that typically follow
- `agent-3`: Consumes [what]
- `agent-4`: Processes [what]
```

### 7. Edge Cases and Failure Modes (Recommended)

**Purpose**: Handle exceptional situations

```markdown
## Edge Cases

### Large Files
- Strategy: Process in chunks
- Threshold: > 10,000 lines
- Fallback: Summarize instead of full analysis

### Missing Dependencies
- Detection: Check package files
- Recovery: Suggest installation commands
- Fallback: Work with available tools

### Timeout Scenarios
- Threshold: 30 seconds
- Action: Return partial results
- Recovery: Suggest splitting task
```

### 8. Output Format (Required)

**Purpose**: Define expected output structure

```markdown
## Output Format

### Success Response
```json
{
  "status": "success",
  "data": {
    "findings": [],
    "recommendations": [],
    "metrics": {}
  },
  "metadata": {
    "duration": "seconds",
    "files_analyzed": 0
  }
}
```

### Error Response
```json
{
  "status": "error",
  "error": {
    "type": "ValidationError",
    "message": "Clear description",
    "suggestion": "How to fix"
  }
}
```
```

## Size and Complexity Guidelines

### Optimal Agent Size
- **Target**: 120-150 lines total
- **Maximum**: 200 lines (hard limit)
- **Minimum**: 80 lines (for simple agents)

### Line Distribution
```
Frontmatter:           5-10 lines
Quick Reference:       5-7 lines
Activation:           6 lines
Core Identity:        8-12 lines
Behavioral Contract:  15-20 lines
Domain Knowledge:     40-80 lines
Pipeline Integration: 15-20 lines
Edge Cases:          10-15 lines
Output Format:       10-20 lines
```

## Agent Categories

### By Model Choice

#### Sonnet Agents (Default)
Best for:
- Pattern matching
- Code generation
- Routine analysis
- Documentation
- Testing

Examples:
- `test-generator`
- `documentation-agent`
- `system-designer`
- `performance-profiler`

#### Opus Agents (Complex Tasks)
Best for:
- Security analysis
- Complex reasoning
- Multi-file analysis
- Architecture decisions
- Legacy code understanding

Examples:
- `security-reviewer`
- `code-archaeologist`
- `architecture-documenter`
- `optimization-engineer`

### By Responsibility

#### Analysis Agents
- Read-only permissions
- Focus on understanding
- Generate reports

#### Implementation Agents
- Write permissions
- Create/modify code
- Follow specifications

#### Review Agents
- Read and analyze
- Identify issues
- Suggest improvements

#### Orchestration Agents
- Coordinate other agents
- Manage workflows
- Aggregate results

## Best Practices

### Naming Conventions
```
✅ Good Names:
- security-reviewer
- test-generator
- performance-profiler
- code-archaeologist

❌ Bad Names:
- helper
- assistant
- general-agent
- do-everything
```

### Tool Permissions
```yaml
# Minimal permissions
tools: [Read, Grep]           # Analysis only

# Standard permissions
tools: [Read, Write, Edit]    # Implementation

# Extended permissions
tools: [Read, Write, Edit, Bash, WebSearch]  # Full capabilities
```

### Version Management
```yaml
# Semantic versioning
version: v1.0.0   # Major.Minor.Patch

# Version history in comments
# v1.0.0 - Initial release
# v1.1.0 - Added security checks
# v1.2.0 - Improved performance analysis
# v2.0.0 - Complete rewrite for new architecture
```

## Anti-Patterns to Avoid

### 1. Kitchen Sink Agent
❌ **Don't**: Create agents that do everything
```yaml
name: super-developer
description: Does coding, testing, deployment, and documentation
```

✅ **Do**: Create focused, single-purpose agents
```yaml
name: test-generator
description: Creates comprehensive test suites for code
```

### 2. Vague Instructions
❌ **Don't**: Use ambiguous language
```markdown
- Maybe check for errors
- Consider security if needed
```

✅ **Do**: Use definitive instructions
```markdown
- ALWAYS validate input types
- NEVER execute untrusted code
```

### 3. Excessive Verbosity
❌ **Don't**: Include lengthy explanations
```markdown
## Background
This agent was created to help developers who need assistance with...
[500 words of context]
```

✅ **Do**: Be concise and direct
```markdown
## Quick Reference
- Identifies security vulnerabilities
- Checks OWASP Top 10
- Provides remediation code
```

### 4. Missing Failure Handling
❌ **Don't**: Assume happy path only
```markdown
Process the file and return results.
```

✅ **Do**: Define failure behaviors
```markdown
If file not found: Return clear error with suggestion
If timeout: Return partial results with continuation plan
```

## Testing Your Agent

### Validation Checklist
- [ ] Frontmatter is valid YAML
- [ ] All required sections present
- [ ] Under 200 lines total
- [ ] Clear, unique purpose
- [ ] Appropriate model selection
- [ ] Minimal tool permissions
- [ ] Behavioral contract defined
- [ ] Output format specified
- [ ] Edge cases handled
- [ ] Compatible with other agents

### Test Scenarios
1. **Minimal Input**: Does it handle empty/minimal data?
2. **Maximum Load**: Does it handle large inputs?
3. **Error Conditions**: Does it fail gracefully?
4. **Integration**: Does it work with other agents?
5. **Performance**: Does it complete in reasonable time?

## Migration Guide

### Updating Old Agents

#### Before (Old Format):
```markdown
# Code Reviewer Agent
This agent reviews code for quality issues.

Instructions:
Review the code and provide feedback.
```

#### After (New Format):
```yaml
---
name: code-reviewer
description: Reviews code for quality and security issues
model: sonnet
tools: [Read, Grep, Glob]
version: v2.0.0
author: Team Name
last_updated: 2024-01-20
---

## Quick Reference
- Reviews code for quality issues
- Identifies security vulnerabilities
- Suggests improvements
- Checks best practices

## Activation Instructions
- CRITICAL: Never modify code during review
- WORKFLOW: Analyze → Identify → Report → Suggest
- Focus on actionable feedback
- Prioritize by severity
- STAY IN CHARACTER as CodeGuardian, quality gatekeeper

[Additional sections...]
```

## Conclusion

Well-structured agents with clear anatomy lead to:
- **Predictable Behavior**: Users know what to expect
- **Better Performance**: Focused agents work faster
- **Easier Maintenance**: Clear structure simplifies updates
- **Improved Composition**: Agents work well together
- **Lower Costs**: Efficient structure reduces token usage

Follow this anatomy guide to create professional, reliable agents that enhance developer productivity.