# Agent Development Guide

Comprehensive guide to creating and using custom Claude Code agents for specialized tasks.

## Navigation by Need

This guide is organized using the Diataxis framework to match your specific needs:

### 🎯 I want to understand agents
**[Agent Architecture & Concepts](./explanation/agent-architecture.md)**  
Learn what agents are, why they exist, and how they work psychologically.

### 📋 I need technical specifications  
**Agent Reference Documentation:**
- **[Agent Structure](./reference/agents/structure.md)** - YAML format and structure requirements
- **[Configuration Options](./reference/agents/configuration.md)** - Frontmatter settings and model selection
- **[Available Tools](./reference/agents/tools.md)** - Complete tools reference with usage guidelines

### 🛠️ I want to create an agent
**[How to Create a Custom Agent](./how-to/create-agent.md)**  
Step-by-step guide to building your first specialized agent.

### 📚 I want to learn by example
**[Tutorial: Getting Started with Agents](./tutorials/01-getting-started-agents.md)**  
Hands-on lesson building a professional project assistant agent from scratch.

## Quick Agent Examples

### API Designer
```yaml
---
name: api-designer
description: Use PROACTIVELY when designing REST APIs
model: sonnet
tools: [Read, Write, WebSearch]
---
```

### Security Reviewer  
```yaml
---
name: security-reviewer
description: Identifies security vulnerabilities and provides remediation
model: opus
tools: [Read, Grep, Glob]
---
```

### Test Generator
```yaml
---
name: test-generator
description: Creates comprehensive test suites with high coverage
model: sonnet
tools: [Read, Write, Edit]
---
```

## Agent Library Reference

### Development & Testing
- `test-generator`: TDD test creation
- `code-reviewer`: Code quality analysis
- `refactoring-assistant`: Safe code improvements

### Security & Performance
- `security-reviewer`: Vulnerability analysis
- `performance-profiler`: Performance bottleneck analysis
- `optimization-engineer`: Performance optimization implementation
- `cost-optimizer`: Resource optimization

### Architecture & Design
- `system-designer`: High-level system architecture
- `tech-evaluator`: Technology choice evaluation
- `architecture-documenter`: Architecture documentation creation
- `api-designer`: RESTful API design
- `database-optimizer`: Query and schema optimization

### Documentation & UX
- `documentation-agent`: Automated documentation
- `ux-optimizer`: User experience enhancement
- `ui-designer`: Interface implementation

### Agile & Management
- `scrum-master`: Sprint facilitation
- `product-owner`: Backlog management
- `project-manager`: Product strategy
- `business-analyst`: Requirements analysis

### Specialized
- `code-archaeologist`: Legacy code analysis
- `deployment-agent`: CI/CD orchestration
- `qa-engineer`: Quality assurance

## Common Pitfalls to Avoid

1. **Exceeding 150 lines**: Keep agents focused and concise
2. **Missing Quick Reference**: Always include as first section
3. **Verbose activation**: Limit to 5-6 essential lines
4. **Tool overload**: Only request necessary tools
5. **Unfocused examples**: Keep code samples practical and brief
6. **Generic personas**: Create memorable, specific identities
7. **Prose output format**: Use directive bullet points
8. **Scope creep**: Maintain single responsibility

## Best Practices Summary

✅ **Do:**
- Single responsibility principle
- Clear scope boundaries
- Focused expertise
- Start with Quick Reference immediately after frontmatter
- List 3-5 key capabilities
- Keep to 5-6 lines maximum for activation
- Select only necessary tools
- Include 1-2 working examples per concept
- Use descriptive compound names

❌ **Don't:**
- Create "super agents" that do everything
- Exceed 150 lines
- Mix unrelated capabilities
- Skip the Quick Reference section
- Write lengthy descriptions
- Write verbose step-by-step guides
- Request all available tools
- Provide multiple variations of same concept

## Next Steps

- **New to agents?** Start with [Agent Architecture](./explanation/agent-architecture.md)
- **Ready to build?** Follow [How to Create an Agent](./how-to/create-agent.md)
- **Need technical details?** Check the [Reference Documentation](./reference/agents/)
- **Want hands-on learning?** Try [Tutorial 1](./tutorials/01-getting-started-agents.md)
- **Advanced patterns?** Explore [Hooks](./hooks-guide.md) and [Workflows](./epcc-workflow-guide.md)

---

*For working examples, see the [agents directory](../agents/) in the repository.*