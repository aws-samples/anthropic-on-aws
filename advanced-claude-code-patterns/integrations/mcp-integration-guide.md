# MCP Server Integration Guide

This guide documents recommended MCP (Model Context Protocol) servers and how they integrate with our custom agents, hooks, and workflows.

## Overview

MCP servers extend Claude Code's capabilities by providing access to external tools and services. They are executable programs that communicate with Claude Code via stdio or HTTP, enabling interactions with databases, APIs, and various development tools.

## Recommended MCP Servers

### 1. Filesystem MCP Server
**Purpose**: Enhanced file system operations beyond Claude Code's built-in tools
**Installation**: 
```bash
claude mcp add filesystem -- npx @modelcontextprotocol/server-filesystem /path/to/allowed/directory
```

**Integration with our patterns:**
- **Agents**: `code-archaeologist` uses this for deep codebase exploration
- **Hooks**: `quality_gates` hook can leverage for pre-commit file checks
- **Workflows**: `refactoring` workflow uses for safe file operations

### 2. Git MCP Server
**Purpose**: Direct Git operations and repository management
**Installation**:
```bash
claude mcp add git -- npx @modelcontextprotocol/server-git
```

**Integration with our patterns:**
- **Agents**: 
  - `deployment-agent` - Manages releases and tags
  - `code-archaeologist` - Analyzes git history
- **Hooks**: 
  - `auto_recovery` - Can revert problematic commits
  - `compliance` - Enforces commit message standards
- **Workflows**: 
  - `feature_development` - Branch management
  - `incident_response` - Quick rollbacks

### 3. GitHub MCP Server
**Purpose**: GitHub API integration for issues, PRs, and workflows
**Installation**:
```bash
claude mcp add github --env GITHUB_TOKEN=${GITHUB_TOKEN} -- npx @modelcontextprotocol/server-github
```

**Integration with our patterns:**
- **Agents**:
  - `security-reviewer` - Comments on PRs with security findings
  - `documentation-agent` - Updates GitHub wikis and READMEs
- **Commands**:
  - `/security-scan` - Reports findings as GitHub issues
  - `/analyze-performance` - Creates PR comments with analysis
- **Workflows**:
  - `feature_development` - Automates PR creation and review
  - `incident_response` - Creates incident issues

### 4. PostgreSQL MCP Server
**Purpose**: Safe database queries and schema inspection
**Installation**:
```bash
claude mcp add postgres --env DATABASE_URL=${DATABASE_URL} -- npx @modelcontextprotocol/server-postgres
```

**Integration with our patterns:**
- **Agents**:
  - `performance-optimizer` - Analyzes query performance
  - `test-generator` - Generates test data from schema
- **Hooks**:
  - `performance_monitor` - Tracks database metrics
- **Workflows**:
  - `refactoring` - Validates database migrations
  - `security_audit` - Checks for SQL injection vulnerabilities

### 5. Playwright MCP Server
**Purpose**: Browser automation for testing, scraping, and cross-browser compatibility
**Installation**:
```bash
claude mcp add playwright -- npx @modelcontextprotocol/server-playwright
```

**Integration with our patterns:**
- **Agents**:
  - `test-generator` - Creates E2E tests with cross-browser support
  - `documentation-agent` - Captures screenshots for docs across browsers
- **Commands**:
  - `/generate-tests` - Records user interactions with built-in test generation
- **Workflows**:
  - `onboarding` - Automated product tours with mobile support
  - `security_audit` - Tests for XSS vulnerabilities across browsers

### 6. Slack MCP Server
**Purpose**: Team communication and notifications
**Installation**:
```bash
claude mcp add slack --env SLACK_TOKEN=${SLACK_TOKEN} -- npx @modelcontextprotocol/server-slack
```

**Integration with our patterns:**
- **Hooks**:
  - `notifications` - Sends alerts to team channels
  - `auto_recovery` - Notifies on-call engineers
- **Workflows**:
  - `incident_response` - Creates incident channels
  - `feature_development` - Updates team on progress

### 7. Memory MCP Server
**Purpose**: Persistent memory across Claude Code sessions
**Installation**:
```bash
claude mcp add memory -- npx @modelcontextprotocol/server-memory
```

**Integration with our patterns:**
- **Agents**:
  - `code-archaeologist` - Remembers codebase insights
  - `performance-optimizer` - Tracks optimization history
- **Workflows**:
  - `onboarding` - Tracks developer progress
  - `refactoring` - Maintains refactoring decisions

## Integration Patterns

### Pattern 1: Agent + MCP Collaboration
```markdown
# In .claude/agents/database-analyst.md
---
name: database-analyst
model: opus
tools: [Read, Grep, Task]
mcp_servers: [postgres]  # Requires postgres MCP
---

Analyze database performance using the postgres MCP server to:
1. Query slow query logs
2. Analyze execution plans
3. Suggest index optimizations
```

### Pattern 2: Hook-Triggered MCP Actions
```json
// In hooks/deployment_notification.json
{
  "name": "deployment_notification",
  "events": ["post-deployment"],
  "actions": [
    {
      "type": "mcp_call",
      "server": "slack",
      "method": "send_message",
      "params": {
        "channel": "#deployments",
        "message": "Deployment completed: ${version}"
      }
    }
  ]
}
```

### Pattern 3: Command MCP Orchestration
```markdown
# In commands/database-migration.md
---
name: database-migration
description: Orchestrate database migration with MCP servers
argument-hint: [migration-file] [--environment dev|staging|prod]
---

## Database Migration Command

This command orchestrates database migration using MCP servers.

### Workflow Steps:
1. **Backup**: Using @deployment-agent with postgres MCP server to create backup
2. **Validate**: Using @test-generator with postgres MCP server to validate schema
3. **Migrate**: Using @deployment-agent with postgres MCP server to run migration
4. **Notify**: Using slack MCP server to send completion notification

### Usage:
```bash
/database-migration "v2.0-schema.sql" --environment staging
```
```

## Configuration Best Practices

### 1. Environment Variables
Store sensitive data in environment variables:
```bash
# .env file (never commit this)
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
DATABASE_URL=postgresql://user:pass@localhost/db
SLACK_TOKEN=xoxb-xxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxx
```

### 2. Project-Specific Configuration
```json
// .claude/mcp-settings.json
{
  "servers": {
    "github": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${env:GITHUB_TOKEN}"
      }
    },
    "postgres": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "${env:DATABASE_URL}"
      },
      "settings": {
        "read_only": true,  // Safety first
        "timeout": 5000
      }
    }
  }
}
```

### 3. Security Considerations
- **Read-only by default**: Database MCPs should default to read-only
- **Scoped permissions**: Limit filesystem MCP to specific directories
- **Token rotation**: Regularly rotate API tokens
- **Audit logging**: Enable logging for sensitive operations

## Usage Examples

### Example 1: Database Analysis with Agent
```bash
# Use database-analyst agent with postgres MCP
claude "Analyze our database performance and suggest optimizations"
# The agent will automatically use the postgres MCP to query metrics
```

### Example 2: Automated PR Review
```bash
# security-reviewer agent + github MCP
claude "Review the latest PR for security issues"
# Agent uses github MCP to comment findings directly on the PR
```

### Example 3: Incident Response Workflow
```bash
# Triggers multiple MCP servers
claude "Start incident response for the payment service outage"
# Uses: slack (create channel), github (create issue), postgres (analyze logs)
```

## Troubleshooting MCP Integrations

### Common Issues

1. **MCP server not found**
   - Verify installation: `claude mcp list`
   - Check logs: `tail -f ~/.claude/logs/mcp-*.log`

2. **Authentication failures**
   - Verify environment variables are set
   - Check token permissions
   - Ensure tokens haven't expired

3. **Timeout errors**
   - Increase timeout in mcp-settings.json
   - Check network connectivity
   - Verify server resources

### Debug Mode
```bash
# Run Claude Code with MCP debugging
claude --mcp-debug

# Check MCP server status
claude mcp status

# Restart specific MCP server
claude mcp restart github
```

## Advanced Patterns

### Pattern 1: Conditional MCP Usage
Agents can conditionally use MCP servers based on context:
```markdown
# In agent definition
If working with production database:
  - Use postgres MCP with read_only=true
If working with test database:
  - Use postgres MCP with full permissions
```

### Pattern 2: MCP Chain Operations
Workflows can chain MCP operations:
```yaml
stages:
  - name: query_metrics
    mcp: [postgres, monitoring]
    parallel: true
  - name: analyze_results
    agent: performance-optimizer
    input: previous_stage_results
  - name: report_findings
    mcp: [slack, github]
```

### Pattern 3: Fallback Strategies
Handle MCP server failures gracefully:
```json
{
  "mcp_strategy": {
    "primary": "postgres",
    "fallback": "cached_data",
    "on_failure": "notify_team"
  }
}
```

## Recommended MCP Server Combinations

### For Full-Stack Development
- filesystem + git + github + postgres + playwright

### For DevOps
- git + github + slack + monitoring servers

### For Data Analysis
- postgres + filesystem + memory

### For Testing
- playwright + filesystem + github

## Future MCP Servers to Watch

- **Kubernetes MCP**: Direct K8s cluster management
- **AWS/GCP/Azure MCPs**: Cloud resource management
- **Monitoring MCPs**: Datadog, Prometheus, Grafana
- **CI/CD MCPs**: Jenkins, CircleCI, GitHub Actions

## Summary

MCP servers seamlessly integrate with our custom agents, hooks, and workflows to create powerful automation patterns. They extend Claude Code's capabilities while maintaining security and safety through proper configuration and permissions management.