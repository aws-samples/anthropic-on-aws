# Tutorial 1: Getting Started with Agents (20 minutes) 🚀

Welcome to Claude Code advanced patterns! In the next 20 minutes, you'll create your first professional AI agent - a **Project Assistant** that helps with real development tasks. You'll learn the fundamentals of agent architecture and build something genuinely useful.

## What You'll Build

You're going to create a **Project Assistant Agent** that:
- Analyzes project structure and suggests improvements
- Makes architectural decisions based on project context
- Provides actionable development guidance
- Creates documentation and design decisions
- Helps you become a more effective developer!

## Prerequisites

Just one thing:
- ✅ Claude Code installed (run `claude --version` to check)

Ready to build your first professional agent? Let's go! 🎉

---

## Step 1: Understand Agent Architecture (5 minutes)

Before building, let's understand what makes agents powerful:

### Agent Components
- **Identity**: What the agent specializes in (YAML frontmatter)
- **Instructions**: How the agent behaves (behavioral guidelines)
- **Tools**: What the agent can do (Read, Write, Edit, etc.)
- **Reasoning**: Why the agent makes specific decisions

### The Agent Mental Model
Think of agents as **specialized team members**:
- Each agent has expertise in a specific domain
- Agents can work together on complex problems  
- Agents follow consistent behavioral patterns
- Agents provide reasoning for their recommendations

This is different from general AI assistance - agents are **specialists** that maintain consistent identity and approach.

---

## Step 2: Create Your Project Assistant Agent (8 minutes)

Let's create an agent that actually helps with development work:

```bash
# Create agents directory if needed
mkdir -p ~/.claude/agents

# Download the project assistant agent template
curl -o ~/.claude/agents/project-assistant.md https://raw.githubusercontent.com/your-repo/advanced-claude-code-patterns/main/docs/templates/agents/project-assistant.md
```

**Alternative approach (works offline):**
```bash
# Copy the template from the local repository  
cp docs/templates/agents/project-assistant.md ~/.claude/agents/project-assistant.md
```

**What just happened?** You created a specialized agent with:
- **Identity**: Project analysis and architectural guidance
- **Tools**: File operations to understand project structure
- **Behavioral guidelines**: Consistent approach to recommendations
- **Decision frameworks**: Logic for making good architectural choices

> **💡 Want the full-featured version?** The complete project assistant template includes advanced decision frameworks, analysis patterns, ADR templates, and detailed success metrics. You can find it at [docs/templates/agents/project-assistant.md](../../templates/agents/project-assistant.md) or use the curl command above to download it directly.

**Checkpoint**: You should see a new file at `~/.claude/agents/project-assistant.md`. This agent can now be deployed with `@project-assistant`.

---

> **⚠️ Important**: After creating new agents and commands, restart Claude Code to load the updated configuration.

## Step 3: Test Your Agent (5 minutes)

Let's test your agent with a real project analysis:

### Deploy Your Agent
```bash
# Navigate to any project directory
cd /path/to/your/project

# Deploy your agent
@project-assistant
```

### Give It a Task
Try asking your agent:

> "Analyze this project's structure with @project-assistant and suggest three specific improvements with implementation steps."

**Expected behavior**: Your agent should:
1. Analyze the project files and structure
2. Provide specific, actionable recommendations
3. Explain the reasoning behind each suggestion
4. Give implementation steps for improvements

**Success criteria**: Agent provides contextual analysis rather than generic advice.

### Test Advanced Capabilities
Try this request:

> "Use @project-assistant to determine if this project should use microservices? Provide an architecture decision record with your recommendation."

**Expected result**: Agent analyzes project size, complexity, and team context before making a recommendation with clear reasoning.

---

## Step 4: Understand What Makes This "Advanced"? (2 minutes)

Your Project Assistant isn't just answering questions - it's following advanced patterns:

### Why This Agent Is Powerful
1. **Contextual Analysis**: Reads project files before making recommendations
2. **Consistent Reasoning**: Uses decision frameworks, not random advice
3. **Documentation**: Creates ADRs and formal decision records
4. **Implementation Focus**: Provides specific steps, not just theory
5. **Professional Output**: Creates deliverables you'd actually use

### Agent vs General AI
- **General AI**: "Here are some architecture patterns you could use"
- **Your Agent**: "Based on your 3-person team and React codebase, I recommend a monolith with clear module boundaries. Here's why and how to implement it."

This specialization makes agents incredibly valuable for development work.

---

## What You've Accomplished ✅

✓ **Created a specialized AI agent** that provides contextual development guidance
✓ **Understood agent architecture** - identity, instructions, tools, and reasoning  
✓ **Learned specialization value** - why focused agents beat general assistance
✓ **Built something useful** - an agent that helps with real project decisions
✓ **Mastered deployment** - using `@agent-name` syntax for agent activation

## Next Steps

Now that you understand agents, you're ready to:

- **Automate quality with hooks**: Learn to trigger agents automatically → [Tutorial 2](02-automation-with-hooks.md)
- **Coordinate multiple agents**: Build workflows that orchestrate specialists → [Tutorial 3](03-building-workflows.md)
- **Solve specific problems**: Check out our [How-to Guides](../how-to/) for targeted solutions

## Troubleshooting

**Problem**: Agent gives generic advice instead of project-specific recommendations
**Solution**: Make sure you're running the agent from within your project directory, and ask for specific analysis

**Problem**: Agent doesn't seem to follow the behavioral guidelines
**Solution**: Check that the agent file was created correctly with `cat ~/.claude/agents/project-assistant.md`

**Problem**: Can't deploy agent with `@project-assistant`
**Solution**: Verify Claude Code can find your agent with `claude agent list`

## Challenge: Customize Your Agent

Ready for more? Try customizing your agent:

1. **Add a specialty**: Focus on frontend, backend, or mobile development
2. **Add more tools**: Include `WebSearch` for researching best practices
3. **Create templates**: Add standardized templates for common documentation
4. **Modify reasoning**: Adjust decision frameworks for your specific needs

The agent you built today is just the beginning. Professional development workflows use dozens of specialized agents working together!

---

**Time to complete**: ~20 minutes  
**What you learned**: Agent architecture, specialization benefits, professional AI assistance patterns  
**What you built**: A project assistant that provides contextual architectural guidance