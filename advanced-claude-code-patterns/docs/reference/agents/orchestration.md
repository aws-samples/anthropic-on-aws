# Multi-Agent Orchestration Reference

Complete guide to orchestrating multiple agents for complex workflows.

## Overview

Multi-agent orchestration allows you to coordinate specialized agents to handle complex, multi-faceted tasks. This is accomplished through the `Task` tool, which enables agents to launch other agents as subagents.

## Basic Syntax

### Using the Task Tool

```yaml
# In agent frontmatter
tools: [Task, Read, Write]
```

### Launching a Single Subagent

```markdown
When you need specialized analysis, use the Task tool:

Task Parameters:
- `subagent_type`: The agent to launch (e.g., "security-reviewer")
- `description`: Brief task description (3-5 words)
- `prompt`: Detailed instructions for the subagent
```

### Example Single Agent Launch

```python
# Launching a security review
Task(
    subagent_type="security-reviewer",
    description="Security audit",
    prompt="Review the authentication system in src/auth/ for vulnerabilities"
)
```

## Parallel Agent Execution

### Launching Multiple Agents Concurrently

For optimal performance, launch multiple agents in a single message:

```markdown
## Parallel Exploration Pattern

Launch these agents simultaneously:
1. @code-archaeologist - Analyze legacy patterns
2. @business-analyst - Map business requirements  
3. @test-generator - Assess test coverage
4. @documentation-agent - Review documentation

All agents execute in parallel and return results together.
```

### Implementation Example

```python
# Parallel agent execution for comprehensive analysis
agents_to_launch = [
    {
        "type": "code-archaeologist",
        "task": "Analyze database layer architecture"
    },
    {
        "type": "security-reviewer", 
        "task": "Scan for OWASP vulnerabilities"
    },
    {
        "type": "performance-optimizer",
        "task": "Identify bottlenecks in API endpoints"
    }
]

# Launch all agents in one message for parallel execution
for agent in agents_to_launch:
    Task(
        subagent_type=agent["type"],
        description=f"Analysis task",
        prompt=agent["task"]
    )
```

## Agent Communication Patterns

### Sequential Processing

```markdown
## Sequential Workflow

1. @business-analyst → Gather requirements
2. @architect → Design solution based on requirements
3. @test-generator → Create tests from design
4. @documentation-agent → Document implementation
```

### Hub-and-Spoke Pattern

```markdown
## Coordinator Pattern

Main Agent (Hub):
- Receives initial request
- Delegates to specialized agents
- Aggregates results
- Provides unified response

Specialized Agents (Spokes):
- @api-designer → API specification
- @security-reviewer → Security analysis
- @test-generator → Test suite creation
```

### Pipeline Pattern

```markdown
## Pipeline Integration

Input → @validator → @transformer → @optimizer → Output

Each agent:
- Receives output from previous agent
- Performs specialized processing
- Passes result to next agent
```

## Available Subagent Types

### Development Agents
- `architect` - System architecture design
- `api-designer` - API specification and design
- `code-reviewer` - Code quality analysis
- `refactor-specialist` - Code refactoring
- `test-generator` - Test suite creation

### Analysis Agents
- `code-archaeologist` - Legacy code analysis
- `security-reviewer` - Security vulnerability scanning
- `performance-optimizer` - Performance bottleneck identification
- `ux-optimizer` - User experience analysis
- `business-analyst` - Business requirement mapping

### Documentation Agents
- `documentation-agent` - General documentation
- `docs-tutorial-agent` - Tutorial creation
- `docs-howto-agent` - How-to guide creation
- `docs-reference-agent` - Reference documentation
- `docs-explanation-agent` - Conceptual explanations

### Management Agents
- `project-manager` - Project planning and tracking
- `product-owner` - Product backlog management
- `scrum-master` - Agile process facilitation
- `qa-engineer` - Quality assurance

### Deployment Agents
- `deployment-agent` - Deployment orchestration
- `ui-designer` - UI implementation
- `test-generator` - Test generation

## Orchestration Best Practices

### 1. Agent Selection

```markdown
Choose agents based on:
- **Specialization**: Use the most specialized agent available
- **Complexity**: Simple tasks don't need orchestration
- **Dependencies**: Consider output/input requirements
```

### 2. Parallel vs Sequential

```markdown
**Use Parallel When:**
- Tasks are independent
- Need multiple perspectives
- Time is critical
- Gathering information

**Use Sequential When:**
- Tasks depend on prior output
- Order matters
- Building on previous work
- Implementing workflows
```

### 3. Error Handling

```markdown
## Orchestration Error Handling

- Subagents are stateless (single response only)
- Cannot send follow-up messages to subagents
- Plan complete task in initial prompt
- Handle failures gracefully
```

### 4. Performance Optimization

```markdown
## Performance Tips

1. **Batch Operations**: Launch all independent agents together
2. **Minimize Handoffs**: Reduce sequential dependencies
3. **Clear Instructions**: Provide complete context upfront
4. **Specific Prompts**: Be precise about expected outputs
```

## Complex Orchestration Example

### Multi-Phase Feature Implementation

```markdown
## Phase 1: Discovery (Parallel)
Launch simultaneously:
- @code-archaeologist: "Map existing authentication system"
- @business-analyst: "Document auth requirements"
- @security-reviewer: "Identify current vulnerabilities"

## Phase 2: Design (Sequential)
After Phase 1 completes:
- @architect: "Design new auth system based on findings"
- @api-designer: "Create auth API specification"

## Phase 3: Implementation (Parallel)
Launch together:
- @test-generator: "Create auth test suite"
- @documentation-agent: "Write auth documentation"

## Phase 4: Validation (Sequential)
- @qa-engineer: "Validate implementation"
- @deployment-agent: "Prepare deployment"
```

## Command Syntax in Agents

### Referencing Agents with @ Mentions

```markdown
## Activation Instructions

- Use @security-reviewer for vulnerability scanning
- Delegate to @test-generator for test creation
- Invoke @documentation-agent for docs
```

### Task Tool Configuration

```yaml
---
name: orchestrator-agent
description: Coordinates multiple specialized agents
model: sonnet
tools: [Task, Read, TodoWrite]
---

## Orchestration Strategy

When handling complex requests:
1. Analyze requirements
2. Identify needed specialists
3. Launch appropriate agents using Task tool
4. Aggregate and synthesize results
```

## Limitations and Constraints

### Subagent Limitations

1. **Stateless Execution**: Each subagent invocation is independent
2. **Single Response**: Subagents return one message only
3. **No Follow-ups**: Cannot send additional messages to running subagents
4. **Context Isolation**: Subagents don't share context with parent

### Orchestration Constraints

1. **Depth Limit**: Avoid deeply nested agent calls
2. **Timeout Considerations**: Long-running orchestrations may timeout
3. **Resource Usage**: Each agent consumes tokens/resources
4. **Error Propagation**: Subagent failures affect orchestration

## Debugging Orchestration

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Subagent not found | Invalid agent name | Verify agent exists in agents/ |
| No response | Timeout or error | Simplify prompt, check logs |
| Incomplete results | Vague instructions | Provide specific, detailed prompts |
| Performance issues | Too many sequential calls | Use parallel execution |

### Debug Techniques

```bash
# Check available agents
ls ~/.claude/agents/

# Validate agent syntax
claude --validate-agent agent-name.md

# Test individual agents
claude --agent agent-name "test task"

# Monitor orchestration
claude --debug --verbose
```

## See Also

- [Task Tool Documentation](tools.md#task)
- [Agent Structure](structure.md)
- [Agent Configuration](configuration.md)
- [EPCC Commands](../commands/epcc-commands.md)