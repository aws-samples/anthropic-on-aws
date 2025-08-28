# Model Selection Guide for Claude Code Agents

## Overview

Claude Code agents now support model selection, allowing developers to optimize for performance and cost. Each agent can be configured to use either "sonnet" (default) or "opus" based on task complexity.

## Available Models

### Sonnet (Default)
- **Best for**: Standard tasks, quick operations, routine automation
- **Performance**: Fast response times
- **Cost**: Standard pricing
- **Token Limits**: Standard context window

### Opus
- **Best for**: Complex analysis, deep reasoning, critical decisions
- **Performance**: Highest quality outputs
- **Cost**: Premium pricing
- **Token Limits**: Extended context window

## Usage Guidelines

### When to Use Sonnet (Default)

Use Sonnet for most agent tasks, including:

1. **Simple Operations**
   - Running tests
   - Executing commands
   - File operations
   - Basic validation

2. **Routine Automation**
   - Pre-commit hooks
   - Formatting checks
   - Dependency updates
   - Build processes

3. **Standard Analysis**
   - Basic code review
   - Simple refactoring
   - Documentation updates
   - Log parsing

### When to Use Opus

Reserve Opus for demanding tasks that require:

1. **Complex Analysis**
   - Security vulnerability assessment
   - Performance optimization
   - Architecture decisions
   - Code quality deep dives

2. **Critical Operations**
   - Production deployments
   - Database migrations
   - Breaking change analysis
   - Incident response

3. **Advanced Reasoning**
   - Legacy code understanding
   - Complex refactoring
   - Algorithm optimization
   - Design pattern selection

## Configuration Examples

### Basic Agent with Sonnet (Default)

```markdown
---
name: test-runner
description: Executes test suites and reports results
model: sonnet  # Default for routine tasks
tools: [Bash, Read, Grep]  # Minimal necessary tools
---

## Quick Reference
- Runs pytest test suites
- Reports coverage metrics
- Identifies failing tests
- Provides error summaries
- Supports parallel execution

## Activation Instructions

- CRITICAL: Always run tests in isolated environment
- WORKFLOW: Setup → Execute → Analyze → Report
- Capture both stdout and stderr
- Group failures by category
- STAY IN CHARACTER as TestRunner, QA specialist
```

### Complex Agent with Opus

```markdown
---
name: security-reviewer
description: MUST BE USED for security analysis. Identifies vulnerabilities and provides remediation.
model: opus  # Required for complex security analysis
tools: [Read, Grep, WebSearch]  # Security scanning tools
---

## Quick Reference
- Identifies OWASP Top 10 vulnerabilities
- Performs threat modeling
- Reviews authentication flows
- Analyzes data protection
- Provides severity ratings

## Activation Instructions

- CRITICAL: Never approve code with critical vulnerabilities
- WORKFLOW: Scan → Analyze → Prioritize → Report → Remediate
- Check against CVE databases
- Consider attack vectors
- STAY IN CHARACTER as SecureGuard, security expert
```

## Agent-Specific Recommendations

### Use Sonnet for These Agents
- **test-generator**: Basic test creation
- **doc-updater**: README maintenance
- **format-checker**: Code style validation
- **dependency-checker**: Version updates
- **build-runner**: CI/CD execution

### Use Opus for These Agents
- **security-reviewer**: Vulnerability analysis
- **optimization-engineer**: Performance implementation
- **code-archaeologist**: Legacy code analysis
- **architecture-documenter**: Complex documentation
- **incident-responder**: Production issues

## Efficient Agent Structure

All agents benefit from streamlined structure regardless of model:

```markdown
## Structure Benefits by Model

### Sonnet Agents (120-150 lines)
- Faster token processing
- Lower costs per invocation
- Quicker response times
- Reduced context usage

### Opus Agents (120-150 lines)
- More context for actual analysis
- Better focus on complex problems
- Clearer decision boundaries
- Improved consistency

## Example: Streamlined Architecture Agent

---
name: system-designer
description: MUST BE USED for system architecture planning
model: sonnet  # Pattern matching and analysis
tools: [Read, Write, Grep, Glob]
---

## Quick Reference
- Designs scalable system architectures
- Evaluates technology trade-offs
- Creates architectural diagrams
- Documents design decisions
- Ensures maintainability

## Activation Instructions

- CRITICAL: Consider both current and future scale
- WORKFLOW: Requirements → Design → Evaluate → Document
- Balance ideal with practical constraints
- Document ADRs for all decisions
- STAY IN CHARACTER as SystemCrafter, architect

[Additional focused content...]
```

## Cost Optimization Strategies

1. **Default to Sonnet**: Always start with Sonnet unless you know the task requires Opus

2. **Progressive Enhancement**: Use Sonnet for initial analysis, then Opus only for deep dives

3. **Task-Based Selection**: Map specific task types to appropriate models

4. **Batch Processing**: Group simple tasks for Sonnet, reserve Opus for critical paths

5. **Caching Results**: Store Opus results to avoid repeated expensive calls

## Performance Metrics

### Typical Response Times
- **Sonnet**: 1-3 seconds for most operations
- **Opus**: 3-8 seconds for complex analysis

### Context Window Usage
- **Sonnet**: Efficient for files under 10K lines
- **Opus**: Can handle entire codebases effectively

### Quality Differences
- **Sonnet**: 95% accuracy for standard tasks
- **Opus**: 99% accuracy for complex reasoning

## Best Practices

1. **Document Model Choice**: Always comment why Opus is chosen
   ```yaml
   model: "opus"  # Required for multi-file security analysis
   ```

2. **Monitor Usage**: Track which agents use Opus most frequently

3. **Regular Review**: Periodically assess if Opus is still needed

4. **User Configuration**: Allow users to override model selection
   ```bash
   claude-agent run security-check --model sonnet  # Override to save costs
   ```

5. **Fallback Strategy**: Implement graceful degradation
   ```python
   try:
       result = await run_with_opus()
   except RateLimitError:
       result = await run_with_sonnet()  # Fallback to Sonnet
   ```

## Migration Guide

### Updating Existing Agents

1. **Review Current Agents**: Identify which agents would benefit from Opus

2. **Add Model Parameter**: Update agent configurations
   ```yaml
   # Before
   agents:
     reviewer:
       name: "reviewer"
       description: "Code review"
   
   # After
   agents:
     reviewer:
       name: "reviewer"
       description: "Code review"
       model: "opus"  # Explicitly set for complex reviews
   ```

3. **Test Performance**: Compare outputs between models

4. **Measure Impact**: Track improvements in accuracy and completeness

## Conclusion

The model parameter provides fine-grained control over agent performance and cost. Use Sonnet by default and reserve Opus for tasks where the additional capabilities justify the increased cost. Regular monitoring and adjustment ensure optimal resource utilization.