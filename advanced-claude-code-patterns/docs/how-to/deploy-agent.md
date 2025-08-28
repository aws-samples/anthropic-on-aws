# How to Deploy an Agent

Deploy your Claude Code agents globally or project-specifically depending on your needs.

## Prerequisites

- Agent file created and tested locally
- Claude Code installed and configured
- Write permissions to target directories

## Choose Your Deployment Type

| Deployment Type | When to Use | Location | Scope |
|----------------|-------------|----------|-------|
| **Global** | Personal agents used across all projects | `~/.claude/agents/` | All projects |
| **Project-Specific** | Team agents or project-unique agents | `.claude/agents/` | Current project only |

---

## Deploy Globally (Personal Use)

### Step 1: Copy Agent to Global Directory

```bash
# Ensure global agents directory exists
mkdir -p ~/.claude/agents

# Copy your agent file
cp my-agent.md ~/.claude/agents/

# Or move it permanently
mv my-agent.md ~/.claude/agents/
```

### Step 2: Verify Deployment

> **⚠️ Important**: After creating new agents and commands, restart Claude Code to load the updated configuration.

```bash
# List all global agents
ls -la ~/.claude/agents/

# Test the agent
claude --agent my-agent "Test message"
```

### Step 3: Set Permissions (Optional)

```bash
# Make agent read-only to prevent accidental changes
chmod 444 ~/.claude/agents/my-agent.md

# Make agent user-only (more secure)
chmod 600 ~/.claude/agents/my-agent.md
```

---

## Deploy Project-Specifically (Team Use)

### Step 1: Create Project Agent Directory

```bash
# Navigate to your project root
cd /path/to/your/project

# Create project agents directory
mkdir -p .claude/agents
```

### Step 2: Add Agent to Project

```bash
# Copy agent to project
cp my-agent.md .claude/agents/

# Or create directly in project
cat > .claude/agents/team-agent.md << 'EOF'
---
name: team-agent
description: Shared team agent for code reviews
model: sonnet
tools: [Read, Grep]
---
# Agent content here...
EOF
```

### Step 3: Add to Version Control

```bash
# Add to git (if using git)
git add .claude/agents/team-agent.md
git commit -m "Add team code review agent"
git push
```

### Step 4: Team Members Update

```bash
# Team members pull the changes
git pull

# Verify agent is available
ls .claude/agents/
claude --agent team-agent "Ready to review"
```

---

## Deploy Multiple Agents at Once

### Batch Global Deployment

```bash
# Copy all agents from a directory
cp ./my-agents/*.md ~/.claude/agents/

# Or use rsync for smarter copying
rsync -av --include="*.md" ./my-agents/ ~/.claude/agents/
```

### Batch Project Deployment

```bash
# Copy multiple agents to project
cp ./team-agents/*.md ./.claude/agents/

# Add all to version control
git add .claude/agents/*.md
git commit -m "Add team agent collection"
```

---

## Organize Agents by Category

### Create Subdirectories (Global)

```bash
# Create category folders
mkdir -p ~/.claude/agents/{development,testing,documentation,utilities}

# Deploy to specific category
cp test-agent.md ~/.claude/agents/testing/
cp doc-agent.md ~/.claude/agents/documentation/
```

### Project Organization

```bash
# Organize project agents
mkdir -p .claude/agents/{team,personal,experimental}

# Deploy accordingly
cp team-*.md .claude/agents/team/
cp experimental-*.md .claude/agents/experimental/
```

---

## Update Deployed Agents

### Update Global Agent

```bash
# Edit in place
nano ~/.claude/agents/my-agent.md

# Or replace entirely
cp updated-agent.md ~/.claude/agents/my-agent.md
```

### Update Project Agent

```bash
# Edit and commit changes
vim .claude/agents/team-agent.md
git add .claude/agents/team-agent.md
git commit -m "Update team agent with new features"
git push
```

---

## Remove Deployed Agents

### Remove Global Agent

```bash
# Remove single agent
rm ~/.claude/agents/old-agent.md

# Remove with confirmation
rm -i ~/.claude/agents/old-agent.md
```

### Remove Project Agent

```bash
# Remove and commit deletion
git rm .claude/agents/deprecated-agent.md
git commit -m "Remove deprecated agent"
git push
```

---

## Deployment Verification

### Check Agent Availability

```bash
# List all available agents (global + project)
claude --list-agents

# Check specific agent details
claude --agent my-agent --info
```

### Test Agent Functionality

```bash
# Quick test
claude --agent my-agent "Hello"

# Verbose test (shows agent loading)
claude --debug --agent my-agent "Test"
```

---

## Troubleshooting Deployment Issues

### Agent Not Found

```bash
# Check file exists in correct location
ls -la ~/.claude/agents/my-agent.md  # Global
ls -la .claude/agents/my-agent.md    # Project

# Check file extension is .md
file ~/.claude/agents/my-agent*

# Check agent name in frontmatter matches
head -n 5 ~/.claude/agents/my-agent.md
```

### Permission Denied

```bash
# Fix permissions
chmod 644 ~/.claude/agents/my-agent.md  # Read for all
chmod 600 ~/.claude/agents/my-agent.md  # Read for user only

# Check ownership
ls -la ~/.claude/agents/
```

### Agent Not Loading

```bash
# Validate YAML frontmatter
claude --validate ~/.claude/agents/my-agent.md

# Check for syntax errors
yamllint ~/.claude/agents/my-agent.md

# Test with minimal agent
cat > ~/.claude/agents/test-minimal.md << 'EOF'
---
name: test-minimal
description: Minimal test agent
model: sonnet
tools: []
---
Test agent content
EOF
```

### Conflicts Between Global and Project

```bash
# Project agents override global agents with same name
# Check which is being used
claude --agent my-agent --which

# Rename to avoid conflicts
mv ~/.claude/agents/my-agent.md ~/.claude/agents/my-agent-global.md
# Or
mv .claude/agents/my-agent.md .claude/agents/my-agent-project.md
```

---

## Team Deployment Best Practices

### Version Control Setup

```bash
# Add .claude to git
echo "# Claude Code Configuration" > .claude/README.md
git add .claude/
git commit -m "Initialize Claude Code configuration"

# Create .gitignore for personal agents
echo "personal-*.md" > .claude/agents/.gitignore
git add .claude/agents/.gitignore
git commit -m "Ignore personal agents"
```

### Naming Conventions

```bash
# Use clear, descriptive names
team-code-reviewer.md       # Good
agent1.md                   # Bad

# Include purpose in name
security-scanner.md         # Good
scanner.md                  # Unclear

# Use prefixes for categorization
dev-typescript-helper.md    # Development
test-unit-runner.md        # Testing
doc-api-generator.md       # Documentation
```

### Documentation

```bash
# Create agents README
cat > .claude/agents/README.md << 'EOF'
# Team Agents

## Available Agents

- `team-reviewer`: Code review assistant
- `team-tester`: Test generation helper
- `team-documenter`: Documentation generator

## Usage

```bash
claude --agent team-reviewer "Review this PR"
```

## Contributing

1. Create agent in .claude/agents/
2. Test locally
3. Submit PR with description
EOF

git add .claude/agents/README.md
git commit -m "Add agents documentation"
```

---

## Security Considerations

### Sensitive Agents

```bash
# Don't commit agents with sensitive information
echo "secret-*.md" >> .gitignore

# Store sensitive agents in secure location
mkdir -p ~/.claude/agents/private
chmod 700 ~/.claude/agents/private
```

### Audit Deployed Agents

```bash
# Review all global agents
find ~/.claude/agents -name "*.md" -exec head -n 10 {} \;

# Check for exposed secrets
grep -r "API_KEY\|SECRET\|PASSWORD" ~/.claude/agents/
```

---

## Quick Reference

### Deployment Commands

| Action | Global | Project |
|--------|--------|---------|
| Deploy | `cp agent.md ~/.claude/agents/` | `cp agent.md .claude/agents/` |
| List | `ls ~/.claude/agents/` | `ls .claude/agents/` |
| Test | `claude --agent name` | `claude --agent name` |
| Remove | `rm ~/.claude/agents/agent.md` | `git rm .claude/agents/agent.md` |
| Update | Edit in `~/.claude/agents/` | Edit and commit in `.claude/agents/` |

### Priority Order

1. Project agents (`.claude/agents/`)
2. Global agents (`~/.claude/agents/`)
3. Built-in agents (if any)

---

## Related Guides

- [How to Share Agents with Your Team](share-agents.md)
- [How to Create Custom Agents](create-agent.md)
- [How to Version Control Agents](version-control.md)
- [How to Test Agents](test-agents.md)

---

<div align="center">

[Back to How-To Guides](README.md) | [Back to Documentation](../README.md)

</div>