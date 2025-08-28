# Tutorial 3: Building Workflows (25 minutes) 🔄

Welcome back! You've mastered agents and hooks - now let's combine them into **workflows** that coordinate multiple specialists to solve complex problems. In the next 25 minutes, you'll build a workflow that orchestrates multiple agents working together.

## What You'll Build

You're going to create a **Development Workflow** that:
- Coordinates multiple agents working in parallel
- Combines analysis, planning, and implementation guidance
- Demonstrates agent orchestration patterns
- Shows how specialists collaborate on complex tasks

## Prerequisites

- ✅ Completed [Tutorial 1: Getting Started with Agents](01-getting-started-agents.md)
- ✅ Completed [Tutorial 2: Automation with Hooks](02-automation-with-hooks.md)
- ✅ Understanding of agent deployment (`@agent-name` syntax)
- ✅ Claude Code configured and working

Ready to orchestrate multiple agents? Let's build! 🚀

---

## Step 1: Understanding Workflow Orchestration (5 minutes)

Before building, let's understand what makes workflows powerful:

### What Are Workflows?
**Workflows coordinate multiple agents and hooks** to solve complex problems:

```
Complex Task → Agent Orchestration → Parallel Processing → Coordinated Results
```

### Workflow Components
- **Agent Coordination**: Multiple specialists working together
- **Hook Integration**: Automation at key workflow points
- **Result Synthesis**: Combining insights from different agents
- **Process Orchestration**: Managing complex multi-step processes

### The Orchestration Model
Think of workflows as **conducting an orchestra**:
- Each agent has specialized expertise (instruments)
- Workflows coordinate timing and interaction (conductor)
- Results are harmonized into coherent output (symphony)

### Agent Orchestration Syntax
```bash
# Single agent deployment
@project-assistant

# Parallel agent orchestration
@project-assistant @security-reviewer @qa-engineer

# Cross-functional teams
@architect @documentation-agent @deployment-agent
```

---

## Step 2: Create Supporting Agents (10 minutes)

First, let's create additional agents that will work with your Project Assistant:

### Create a Security Reviewer Agent
```bash
# Copy the security reviewer agent template
cp docs/templates/agents/security-reviewer.md ~/.claude/agents/security-reviewer.md
```

### Create a Documentation Agent
```bash
# Copy the documentation agent template
cp docs/templates/agents/documentation-agent.md ~/.claude/agents/documentation-agent.md
```

**What just happened?** You created two additional specialists:
- **Security Reviewer**: Identifies and fixes security issues
- **Documentation Agent**: Creates comprehensive technical documentation

> **💡 Need to view the templates?** The complete agent specifications are available at [docs/templates/agents/security-reviewer.md](../../templates/agents/security-reviewer.md) and [docs/templates/agents/documentation-agent.md](../../templates/agents/documentation-agent.md), and the workflow command at [docs/templates/commands/dev-review.md](../../templates/commands/dev-review.md).

---

## Step 3: Build Your First Workflow (7 minutes)

Now let's create a workflow that coordinates all three agents:

### Create a Development Review Workflow
```bash
# Create commands directory if needed
mkdir -p ~/.claude/commands

# Copy the development review workflow template
cp docs/templates/commands/dev-review.md ~/.claude/commands/dev-review.md
```

**What does this workflow do?** The Development Review workflow:
- **Coordinates three specialists simultaneously**: Each agent analyzes from their expertise area
- **Provides comprehensive analysis**: Architecture, security, and documentation insights
- **Synthesizes results**: Combines findings into actionable recommendations
- **Avoids duplication**: Agents complement rather than repeat each other's work

> **💡 Need to see the workflow details?** The complete workflow specification is available at [docs/templates/commands/dev-review.md](../../templates/commands/dev-review.md).

**Checkpoint**: You now have a workflow command that orchestrates three specialist agents working in parallel.

> **⚠️ Important**: After creating new agents and commands, restart Claude Code to load the updated configuration: `claude --restart` or simply exit and restart Claude Code.

---

## Step 4: Test Your Workflow (3 minutes)

Let's test your multi-agent workflow:

### Run Your Development Review Workflow
```bash
# Navigate to any project directory
cd /path/to/your/project

# Deploy your workflow (this orchestrates all three agents)
/dev-review
```

### Give It Real Tasks
Try these requests to see the workflow in action:

> "/dev-review on this project and provide a comprehensive analysis with prioritized recommendations."

**Expected behavior**: The workflow should:
1. Deploy all three agents simultaneously
2. Each agent provides specialized analysis from their domain
3. Results are coordinated into a comprehensive review
4. Recommendations are prioritized by impact

### Test Specialized Analysis
Try this more specific request:

> "/dev-review to analyze this codebase for production readiness. Focus on security vulnerabilities, architectural improvements, and documentation gaps."

**Expected result**: Each agent provides targeted analysis:
- **Project Assistant**: Architecture patterns and improvement recommendations
- **Security Reviewer**: Specific vulnerability identification with fixes
- **Documentation Agent**: Documentation gaps with creation priorities

### Observe Agent Coordination
Notice how the workflow:
- **Deploys agents in parallel**: All three start working simultaneously
- **Specializes analysis**: Each agent focuses on their expertise area  
- **Coordinates results**: Insights are combined into comprehensive review
- **Avoids duplication**: Agents don't repeat each other's analysis

**Success criteria**: You get specialized analysis from three different perspectives in a single coordinated workflow.

### Advanced Workflow Usage
Once comfortable with basic workflow execution, try these advanced patterns:

> "/dev-review create action items for the top 3 issues found across all areas."

> "/dev-review prepare this project for a security audit. Provide a remediation plan."

> "/dev-review focus on scalability concerns. What changes are needed for 10x user growth?"

---

## What You've Accomplished ✅

✓ **Built multi-agent orchestration** that coordinates specialists working in parallel
✓ **Created workflow commands** that manage complex multi-step processes  
✓ **Learned agent coordination patterns** using the `@agent-name` syntax
✓ **Implemented parallel processing** where agents work simultaneously, not sequentially
✓ **Built something professionally useful** - comprehensive development reviews

## Key Workflow Concepts Mastered

### Agent Orchestration
- **Parallel Deployment**: Multiple agents working simultaneously
- **Specialization**: Each agent focuses on their expertise area
- **Coordination**: Results are synthesized into coherent output
- **Efficiency**: Parallel work is faster than sequential analysis

### Workflow Architecture
- **Command Structure**: Workflows are implemented as commands
- **Agent Coordination**: Using `@agent-name` syntax for deployment
- **Result Integration**: Combining insights from multiple specialists
- **Process Management**: Orchestrating complex multi-step workflows

### Why This Workflow Is Powerful
1. **Comprehensive Coverage**: Three specialized perspectives in one analysis
2. **Coordinated Results**: Agents work together, not in isolation
3. **Actionable Output**: Prioritized recommendations you can implement immediately
4. **Scalable Pattern**: Foundation for more complex multi-agent workflows
5. **Professional Quality**: Enterprise-grade analysis and documentation

## Next Steps

Now that you understand workflows, you're ready to:

- **Build architecture automation**: Create specialized architecture workflows → [Tutorial 4](04-architecture-automation.md)
- **Learn advanced patterns**: Master enterprise workflow patterns → [Tutorial 5](05-advanced-patterns.md)
- **Solve specific problems**: Apply workflows to your projects → [How-to Guides](../how-to/)

## Verify Success

### Quick Check
Your workflow should coordinate multiple agents:
```bash
# Run workflow and verify three different types of analysis
/dev-review
```

### Complete Validation
1. **Agent Deployment Test**
   ```bash
   # All three agents should be available
   /agent
   ```
   **Success criteria**: All three agents are listed and available

2. **Workflow Coordination Test**
   - Run `/dev-review` in a project directory
   - Observe parallel agent deployment (not sequential)
   - Verify specialized analysis from each agent
   **Success criteria**: Three distinct types of analysis coordinated into comprehensive review

3. **Integration Test**
   - Architecture recommendations from project-assistant
   - Security issues identified by security-reviewer  
   - Documentation gaps found by documentation-agent
   **Success criteria**: Each agent provides specialized insights without duplicating others' work

## Troubleshooting

**Problem**: Only one agent seems to activate
**Solution**: Check that all three agent files exist and are properly configured with `claude agent list`

**Problem**: Agents give overlapping advice instead of specialized analysis
**Solution**: Review agent instructions to ensure each has distinct specialization focus

**Problem**: Workflow command not recognized
**Solution**: Verify command is registered in `~/.claude/settings.json` and restart Claude Code

**Problem**: Workflow gives generic advice instead of project-specific analysis
**Solution**: Make sure you're running the workflow from within your project directory, and use specific prompts like the examples above

## Challenge: Extend Your Workflow

Ready for more? Try extending your workflow:

1. **Add more specialists**: Include performance analysis, testing, or deployment agents
2. **Create hooks integration**: Add hooks that trigger at workflow stages
3. **Build domain-specific workflows**: Create workflows for frontend, backend, or mobile development
4. **Add conditional logic**: Different agent combinations based on project type

Your workflow system is now the foundation for sophisticated development automation that coordinates multiple AI specialists!

---

**Time to complete**: ~25 minutes  
**What you learned**: Agent orchestration, parallel processing, workflow command creation, specialist coordination  
**What you built**: Multi-agent development review workflow that provides comprehensive project analysis