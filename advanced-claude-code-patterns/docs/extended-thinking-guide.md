# Extended Thinking Mode Guide

Leverage Claude Code's advanced reasoning capabilities for complex problem-solving.

## Overview

Extended thinking mode allows Claude Code to allocate additional processing time for complex analysis, deep reasoning, and sophisticated problem-solving. By using specific keywords, you can trigger different levels of thinking based on task complexity.

## Thinking Levels

### 1. Basic Thinking - `think`
**Token Budget**: ~8,000 tokens  
**Use Cases**: Moderate complexity problems requiring some analysis

```bash
# Example usage
Think about the best database schema for our user management system
```

**Ideal for:**
- Algorithm design
- Architecture decisions
- Code optimization strategies
- Debugging complex issues

### 2. Enhanced Thinking - `think hard` or `think a lot`
**Token Budget**: ~15,000 tokens  
**Use Cases**: Complex problems requiring deeper analysis

```bash
# Example usage
Think hard about optimizing this sorting algorithm for large datasets
```

**Ideal for:**
- Performance bottleneck analysis
- Security vulnerability assessment
- Complex refactoring strategies
- Multi-component integration design

### 3. Intensive Thinking - `think harder` or `think intensely`
**Token Budget**: ~16,000-62,000 tokens  
**Use Cases**: Very complex problems requiring extensive reasoning

```bash
# Example usage
Think harder about potential security vulnerabilities in our authentication flow
```

**Ideal for:**
- Complete system architecture redesign
- Complex distributed system problems
- Critical security analysis
- Performance optimization of critical paths

### 4. Maximum Thinking - `ultrathink`
**Token Budget**: ~64,000-190,000 tokens  
**Use Cases**: Extremely complex problems requiring maximum analysis

```bash
# Example usage
Ultrathink on migrating our monolith to microservices architecture
```

**Ideal for:**
- Large-scale architectural transformations
- Complex legacy system analysis
- Critical business logic reimplementation
- Comprehensive security audits

## Visual Indicator

When Claude uses extended thinking, the reasoning process appears as **italic gray text** above the response, showing the thought process before the final answer.

## Integration with Agents

### Security Reviewer Agent
```markdown
---
name: security-reviewer
model: opus
---

For comprehensive security analysis, I'll think hard about potential vulnerabilities.

[Triggers enhanced thinking for security-critical analysis]
```

### Performance Optimizer Agent
```markdown
---
name: performance-optimizer
model: opus
---

For optimization opportunities, I'll think intensely about performance bottlenecks.

[Uses intensive thinking for complex performance analysis]
```

### Code Archaeologist Agent
```markdown
---
name: code-archaeologist
model: opus
---

To understand this legacy system, I'll ultrathink about the codebase structure.

[Maximum thinking for complex legacy code analysis]
```

## Command Template Integration

### Performance Analysis Command
```markdown
---
name: analyze-performance
description: Deep performance analysis with extended thinking
model: opus
---

## Analysis Process

For simple metrics: Standard analysis
For bottleneck identification: Think about performance patterns
For complex optimization: Think hard about algorithmic improvements
For system-wide performance: Ultrathink on architectural changes
```

### Security Scan Command
```markdown
---
name: security-scan
description: Comprehensive security audit
model: opus
---

## Scan Levels

Quick scan: Check common vulnerabilities
Deep scan: Think hard about security implications
Comprehensive audit: Ultrathink on attack vectors and defenses
```

## Workflow Integration

### Feature Development Workflow
```yaml
stages:
  - name: planning
    prompt: "Think hard about the implementation approach for this feature"
    
  - name: architecture
    prompt: "Think intensely about the system design implications"
    
  - name: implementation
    prompt: "Standard implementation without extended thinking"
    
  - name: review
    prompt: "Think about potential issues and improvements"
```

### Incident Response Workflow
```yaml
stages:
  - name: analysis
    prompt: "Ultrathink on the root cause of this incident"
    
  - name: solution
    prompt: "Think hard about the fix and prevention strategies"
```

## Best Practices

### 1. Choose Appropriate Level
- **Don't over-think**: Simple tasks don't need extended thinking
- **Match complexity**: Use higher levels for more complex problems
- **Consider cost**: Higher thinking levels consume more tokens

### 2. Strategic Placement
```bash
# Good: Use thinking for planning
Think hard about the architecture before we start coding

# Bad: Using thinking for simple tasks
Ultrathink about adding a console.log statement
```

### 3. Combine with Model Selection
- **Sonnet + basic thinking**: Good for moderate complexity
- **Opus + enhanced thinking**: Ideal for complex analysis
- **Opus + ultrathink**: Reserved for critical decisions

### 4. Iterative Refinement
```bash
# First pass: Quick analysis
Analyze this code for issues

# Second pass: Deeper thinking if needed
Think hard about the performance implications we found

# Final pass: Maximum analysis for critical issues
Ultrathink on the security vulnerability we discovered
```

## Examples

### Example 1: Database Schema Design
```bash
Ultrathink on the database schema design for our user management system with RBAC, multi-tenancy, and audit logging requirements
```

### Example 2: Performance Optimization
```bash
Think hard about optimizing this sorting algorithm that processes 10 million records
```

### Example 3: Security Analysis
```bash
Think harder about potential security vulnerabilities in our JWT implementation
```

### Example 4: Architecture Decision
```bash
Think intensely about whether we should use event sourcing for our order management system
```

## Cost Optimization

### Token Usage by Level
| Thinking Level | Token Budget | Relative Cost | Use Frequency |
|---------------|--------------|---------------|---------------|
| None | Standard | 1x | 70% of tasks |
| Basic (think) | ~8K | 2x | 20% of tasks |
| Enhanced (think hard) | ~15K | 3x | 7% of tasks |
| Intensive (think harder) | ~16K-62K | 4-8x | 2% of tasks |
| Maximum (ultrathink) | ~64K-190K | 8-24x | 1% of tasks |

### Optimization Strategies

1. **Start Simple**: Begin without thinking, escalate if needed
2. **Batch Complex Tasks**: Group problems requiring deep thinking
3. **Cache Results**: Save outputs from expensive thinking sessions
4. **Team Review**: Have team validate before using ultrathink

## Integration with Parallel Subagents

When using extended thinking with parallel subagents:

```markdown
## Complex Analysis with Parallel Subagents

I'll think hard about this problem using multiple perspectives:

1. **Security Agent**: Think about security implications
2. **Performance Agent**: Think about performance impact  
3. **Architecture Agent**: Think about design patterns

[All agents work in parallel with appropriate thinking levels]
```

## Monitoring and Metrics

Track thinking usage:

```json
{
  "thinking_stats": {
    "total_sessions": 100,
    "basic_thinking": 20,
    "enhanced_thinking": 7,
    "intensive_thinking": 2,
    "maximum_thinking": 1,
    "average_tokens": 3500,
    "cost_efficiency": 0.85
  }
}
```

## Troubleshooting

### Issue: Thinking Not Triggering
- Ensure keywords are in the prompt
- Check model compatibility (opus recommended)
- Verify token limits aren't exceeded

### Issue: Excessive Token Usage
- Review thinking level selection
- Consider breaking complex problems into parts
- Use caching for repeated analysis

### Issue: Slow Response Times
- Extended thinking takes time - be patient
- Consider using parallel processing
- Run intensive thinking asynchronously

## Related Resources

- [Model Selection Guide](./model-selection-guide.md)
- [Performance Optimization](./best-practices.md#performance)
- [Cost Management](./best-practices.md#cost-optimization)
- [Agent Development](./agents-guide.md)

---

*Extended thinking mode is a powerful feature - use it strategically for maximum benefit while managing costs effectively.*