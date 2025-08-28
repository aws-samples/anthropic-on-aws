# Quick Start Guide

Get up and running with Claude Code advanced patterns in 5 minutes.

## 🚀 Prerequisites

### Install Claude Code

**Option 1: NPM Install (Recommended if you have Node.js 18+)**
```bash
npm install -g @anthropic-ai/claude-code
```

**Option 2: Native Install (Beta)**

For macOS/Linux/WSL:
```bash
curl -fsSL claude.ai/install.sh | bash
```

For Windows PowerShell:
```powershell
irm https://claude.ai/install.ps1 | iex
```

### Verify Installation
```bash
claude --version
```

## 📦 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/aws-samples/anthropic-on-aws.git
cd anthropic-on-aws/advanced-claude-code-patterns
```

### 2. Set Up Your Project
```bash
# Create .claude directory in your project
mkdir -p .claude/{agents,commands}

# Copy templates
cp -r templates/* .claude/

# OPTIONAL: Choose a project template (e.g., python_web_app)
cp templates/python_web_app.md .claude/CLAUDE.md
```

### 3. Install Required MCP Servers
```bash
# Install commonly used MCP servers
claude mcp add github -- npx @modelcontextprotocol/server-github
claude mcp add filesystem -- npx @modelcontextprotocol/server-filesystem .
claude mcp add git -- npx @modelcontextprotocol/server-git
```

## ⚡ Quick Examples

### Example 1: Create Your First Agent

Create a simple API designer agent (save as `.claude/agents/api-designer.md`):

```markdown
---
name: api-designer
description: Use PROACTIVELY when designing REST APIs. Creates OpenAPI specs and best practices.
model: sonnet
tools: [Read, Write, WebSearch]
---

## Quick Reference
- Designs RESTful APIs following standards
- Creates OpenAPI/Swagger specifications
- Implements proper HTTP methods
- Ensures backward compatibility
- Provides comprehensive examples

## Activation Instructions

- CRITICAL: Follow REST principles and HTTP standards
- WORKFLOW: Resources → Endpoints → Schemas → Examples
- Always version APIs from the start
- Include pagination for collections
- STAY IN CHARACTER as APIcrafter, API architect

## Core Identity

**Role**: Principal API Architect
**Identity**: You are **APIcrafter**, who designs APIs developers love.

**Principles**:
- **REST First**: Proper HTTP methods and status codes
- **Consistency**: Predictable patterns
- **Documentation**: Every endpoint fully documented
- **Versioning**: Plan for evolution
- **Developer Experience**: Natural APIs

## API Patterns

### Resource Design

GET /api/v1/users          # Collection
GET /api/v1/users/{id}     # Single resource
POST /api/v1/users         # Create
PUT /api/v1/users/{id}     # Full update
PATCH /api/v1/users/{id}   # Partial update
DELETE /api/v1/users/{id}  # Remove


## Output Format

API design includes:
- **Endpoints**: Complete resource mapping
- **Schemas**: Request/response models
- **Examples**: Working curl commands
- **OpenAPI**: Full specification
```

Use the agent:
```bash
Using the @api-designer agent, create a user management API
```

### Example 2: Use a Pre-Built Security Agent
```bash
# Copy the security reviewer agent
# For global use (available in all projects):
cp agents/security-reviewer.md ~/.claude/agents/
# OR for project-specific use:
cp agents/security-reviewer.md .claude/agents/

# Run security scan on your code
Run a security review on the authentication module using the @security-reviewer agent
```

### Example 3: Set Up a Hook
```bash
# Copy quality gates hook
cp hooks/quality_gates.json .claude/hooks/

# The hook will now run automatically on commits
git commit -m "feat: add new feature"
# Hook runs tests, linting, and security checks
```

### Example 4: Execute a Development Workflow
```bash
# Use the EPCC workflow command for systematic development
/epcc/epcc-explore "user authentication"  # Analyze codebase
/epcc/epcc-plan                           # Create implementation plan
/epcc/epcc-code                           # Execute implementation
/epcc/epcc-commit                         # Commit with message
```

### Example 5: Create a Custom Command
```bash
# Copy a command template
# For global use:
cp commands/analyze-performance.md ~/.claude/commands/
# OR for project-specific use:
cp commands/analyze-performance.md .claude/commands/

# Use the command
claude /analyze-performance
```

## 🎯 Common Use Cases

### 1. Automated Code Review
```bash
# Set up the code review agent (choose one):
cp agents/security-reviewer.md ~/.claude/agents/     # Global
cp agents/security-reviewer.md .claude/agents/       # Project-specific

# Configure GitHub MCP
claude mcp add github --env GITHUB_TOKEN=${GITHUB_TOKEN} -- npx @modelcontextprotocol/server-github

# Run automated review
Review PR #123 for security and performance issues
```

### 2. Test Generation
```bash
# Set up test generator (choose one):
cp agents/test-generator.md ~/.claude/agents/        # Global
cp agents/test-generator.md .claude/agents/          # Project-specific

# Generate tests for a module
Generate comprehensive tests for src/services/user_service.py
```

### 3. Incident Response
```bash
# Copy the incident response command (if available)
# OR use agents directly for incident response
Using the @code-archaeologist agent, analyze the API timeout issue
Using the @performance-profiler agent, identify bottlenecks
Using the @optimization-engineer agent, implement fixes
```

## 🔧 Configuration

### Basic Configuration (.claude/settings.json)
```json
{
  "agents": {
    "defaultModel": "sonnet",
    "complexTasksModel": "opus"
  },
  "hooks": {
    "enabled": true,
    "autoFix": true
  },
  "commands": {
    "projectPrefix": "project",
    "globalPrefix": "global"
  }
}
```

### Environment Variables
```bash
# Create .env file
cat > .env << EOF
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
DATABASE_URL=postgresql://localhost:5432/mydb
OPENAI_API_KEY=sk-xxxxxxxxxxxx
SLACK_WEBHOOK_URL=https://hooks.slack.com/xxx
EOF

# Load environment
source .env
```

## 📚 Next Steps

### Learn More About Components

1. **[Agents Guide](./agents-guide.md)**: Deep dive into custom agents
   - Creating agents
   - Model selection (sonnet vs opus)
   - Agent composition

2. **[Hooks Guide](./hooks-guide.md)**: Lifecycle event handling
   - Pre-commit hooks
   - Post-deployment hooks
   - Error recovery

3. **[Commands Guide](./commands-guide.md)**: Workflow automation
   - Slash commands with arguments
   - Multi-stage workflows via commands
   - EPCC and TDD workflows

4. **[MCP Integration](./mcp-guide.md)**: External tools
   - Database access
   - API integrations
   - Cloud services

### Try Example Projects

#### Python Web API
```bash
# For a Python API project:
Set up a Python web API project with all recommended patterns
```

#### Data Science Project
```bash
# For a Data Science project:
Configure ML experiment tracking and model deployment
```

#### Microservices
```bash
# For a Microservices project:
Set up service mesh and distributed tracing
```

## 🆘 Getting Help

### Quick Troubleshooting

**Agent not working?**
```bash
# Check agent is loaded
ls ~/.claude/agents/
# Verify model access
claude "List available models"
```

**Hook not triggering?**
```bash
# Check hook configuration
cat .claude/hooks/quality_gates.json
# Test hook manually
claude --trigger-hook pre-commit
```

**MCP server issues?**
```bash
# List MCP servers
claude mcp list
# Check MCP logs
claude --mcp-debug
```

### Resources
- [Troubleshooting Guide](./troubleshooting.md)
- [GitHub Issues](https://github.com/anthropics/claude-code/issues)
- [Community Forum](https://community.anthropic.com)

## ✅ Quick Setup Checklist

- [ ] Claude Code installed and working
- [ ] Project `.claude/` directory created
- [ ] CLAUDE.md template selected and customized
- [ ] Required MCP servers installed
- [ ] Environment variables configured
- [ ] At least one agent copied to project
- [ ] Basic hook configured
- [ ] Test command executed successfully

## 🎉 Success Indicators

You know you're set up correctly when:

1. ✅ `claude "Hello"` responds correctly
2. ✅ `.claude/` directory exists with subdirectories
3. ✅ `claude mcp list` shows installed servers
4. ✅ Custom commands appear with `claude /[tab]`
5. ✅ Agents respond to specific requests
6. ✅ Hooks trigger on events

## 📖 Full Documentation

For comprehensive documentation, see:
- [Complete Agents Guide](./agents-guide.md)
- [Advanced Hooks Patterns](./hooks-guide.md)
- [Workflow Commands](./commands-guide.md)
- [Best Practices](./best-practices.md)

---

*Need help? Check our [Troubleshooting Guide](./troubleshooting.md) or ask in the [Community Forum](https://community.anthropic.com).*