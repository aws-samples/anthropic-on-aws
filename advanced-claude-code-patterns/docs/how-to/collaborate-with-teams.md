# How to Set Up Team Collaboration with Claude Code

Practical guide for implementing Claude Code across development teams with shared standards and workflows.

## Prerequisites

- Claude Code access for team members
- Shared version control repository
- Team communication channels (Slack, Teams, etc.)
- Basic understanding of workflow patterns

## Set Up Shared Configuration

### Create Team Standards Configuration

Establish shared coding standards and practices:

```json
// team-settings.json
{
  "team": {
    "name": "platform-engineering",
    "standards": {
      "code_style": "black",
      "line_length": 88,
      "test_coverage": 80,
      "documentation": "required",
      "security_scan": "required"
    },
    "agents": {
      "shared_repo": "https://github.com/company/claude-agents",
      "auto_update": true,
      "version_policy": "stable"
    },
    "notifications": {
      "slack_channel": "#dev-platform",
      "email_list": "platform-eng@company.com",
      "urgent_alerts": "+1-555-ONCALL"
    },
    "environments": {
      "development": {
        "validation_level": "basic",
        "auto_deploy": true
      },
      "staging": {
        "validation_level": "thorough", 
        "approval_required": false
      },
      "production": {
        "validation_level": "comprehensive",
        "approval_required": true,
        "approvers": ["senior-engineers", "team-leads"]
      }
    }
  }
}
```

### Version Control Agent Configurations

Keep agent configurations in source control:

```bash
# Repository structure
team-claude-config/
├── agents/
│   ├── security-reviewer.md
│   ├── test-generator.md
│   ├── performance-optimizer.md
│   └── documentation-writer.md
├── commands/
│   ├── deploy-service.md
│   ├── run-tests.md
│   └── security-scan.md
├── hooks/
│   ├── pre-commit.json
│   ├── pre-push.json
│   └── post-deploy.json
├── commands/
│   ├── feature-development.md
│   ├── hotfix-process.md
│   └── release-pipeline.md
└── team-settings.json
```

### Distribute Configuration to Team

Set up automatic configuration sync:

```bash
#!/bin/bash
# sync-team-config.sh

# Pull latest team configuration
git pull origin main

# Sync agents to local Claude Code
for agent in agents/*.md; do
    agent_name=$(basename "$agent" .md)
    claude agent import "$agent" --name "$agent_name" --overwrite
done

# Sync commands
for command in commands/*.md; do
    command_name=$(basename "$command" .md)
    claude command import "$command" --name "$command_name" --overwrite
done

# Import team settings
claude config import team-settings.json

echo "Team configuration synced successfully"
```

Make this script part of the onboarding process:

```bash
# Add to .bashrc or team setup script
alias sync-claude="~/scripts/sync-team-config.sh"

# Auto-sync on shell startup
if [ -d "$HOME/team-claude-config" ]; then
    cd "$HOME/team-claude-config" && git pull --quiet && cd - > /dev/null
fi
```

## Implement Agent Sharing Workflow

### Export and Share Agents

Create a workflow for sharing successful agents:

```bash
# Export agent for sharing
claude agent export security-reviewer > shared/security-reviewer-v2.md

# Add metadata for team use
cat << 'EOF' >> shared/security-reviewer-v2.md

## Team Usage Notes
- **Version**: 2.0
- **Author**: alice@company.com
- **Last Updated**: 2024-01-15
- **Tested With**: Python 3.9+, Node.js 18+
- **Dependencies**: bandit, semgrep
- **Known Issues**: None
EOF

# Commit to shared repository
git add shared/security-reviewer-v2.md
git commit -m "feat: security reviewer v2.0 - improved Python analysis"
git push
```

### Agent Review Process

Implement peer review for shared agents:

```yaml
# .github/workflows/agent-review.yml
name: Agent Review
on:
  pull_request:
    paths: ['agents/**', 'commands/**']

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Validate Agent Structure
        run: |
          python scripts/validate-agents.py
      
      - name: Test Agent Behavior
        run: |
          python scripts/test-agents.py
      
      - name: Security Scan
        run: |
          python scripts/security-scan-agents.py
```

### Import Team Agents

Set up team members to easily import shared agents:

```bash
# Import all team agents
claude agent import-team --source company/claude-agents

# Import specific agent with updates
claude agent import security-reviewer --source company/claude-agents --update

# Check for agent updates
claude agent check-updates --source company/claude-agents
```

## Configure Team Commands

### Define Team-Specific Commands

Create command templates for common team processes:

```markdown
# Team command template - commands/feature-development.md
---
name: feature-development
description: Team feature development workflow
argument-hint: [feature-name] [--type api|frontend|infrastructure|data] [--urgency low|medium|high|critical]
version: 1.0.0
owner: platform-team
maintainers: ["alice", "bob", "charlie"]
documentation: https://wiki.company.com/commands/feature-dev
---

## Feature Development Command

This command orchestrates the team's feature development process.

### Usage
```bash
/feature-development "user authentication" --type api --urgency high
```

### Workflow Steps

1. **Validation Phase** (runs in parallel):
   - Using @team-code-reviewer agent for code review
   - Using @security-reviewer agent for security scan
   - Using @test-generator agent for test generation (API features only)

2. **Deployment Preparation**:
   - For API features: Using @api-deployment-checker agent
   - For Frontend: Using @frontend-deployment-checker agent
   - For Infrastructure: Using @infra-deployment-checker agent

3. **Approval Process** (high/critical urgency only):
   - Request approval from team leads
   - Notify senior engineers

### Arguments
- `feature-name`: Name of the feature to develop
- `--type`: Type of feature (api, frontend, infrastructure, data)
- `--urgency`: Priority level (low, medium, high, critical)
```

### Team Notification Setup

Configure notifications for team coordination:

```json
{
  "notifications": {
    "slack": {
      "webhook": "${env:TEAM_SLACK_WEBHOOK}",
      "channels": {
        "general": "#dev-platform",
        "alerts": "#platform-alerts", 
        "deployments": "#deployments"
      },
      "templates": {
        "agent_failure": "🚨 Agent {{agent_name}} failed in {{project}}: {{error}}",
        "command_complete": "✅ {{command_name}} completed for {{project}}",
        "approval_needed": "⏳ Approval needed for {{command_name}} by {{approvers}}"
      }
    },
    "email": {
      "smtp_server": "${env:SMTP_SERVER}",
      "lists": {
        "team": "platform-eng@company.com",
        "leads": "platform-leads@company.com"
      }
    }
  }
}
```

## Establish Governance and Standards

### Code Review Integration

Integrate Claude Code agents into code review process:

```bash
# Pre-commit hook that runs team standards
#!/bin/bash
# .git/hooks/pre-commit

echo "Running team code standards..."

# Run team linting standards
claude agent run code-formatter --input staged-files

# Run security review
claude agent run security-reviewer --input staged-files

# Generate test suggestions if missing
claude agent run test-gap-analyzer --input staged-files

echo "Team standards check complete"
```

### Define Agent Approval Process

Create approval workflow for new shared agents:

```markdown
# Agent Approval Checklist

## Technical Review
- [ ] Agent follows team template structure
- [ ] Appropriate model selection (cost/performance)
- [ ] Minimal required tools specified
- [ ] Input validation implemented
- [ ] Error handling comprehensive
- [ ] Performance tested with real workloads

## Security Review  
- [ ] No hardcoded credentials
- [ ] Proper input sanitization
- [ ] File access appropriately restricted
- [ ] Network access limited if needed
- [ ] Audit logging configured

## Team Impact Review
- [ ] Clear use case and value proposition
- [ ] Doesn't duplicate existing agents
- [ ] Compatible with team workflows
- [ ] Documentation complete and accurate
- [ ] Training plan for team adoption

## Approval
- [ ] Technical lead approval: @alice
- [ ] Security review: @security-team  
- [ ] Team consensus: @platform-team
```

### Version Management

Implement versioning for shared agents:

```bash
# Version management script
#!/bin/bash
# scripts/version-agent.sh

agent_name=$1
version_type=$2  # major, minor, patch

if [ -z "$agent_name" ] || [ -z "$version_type" ]; then
    echo "Usage: $0 <agent-name> <major|minor|patch>"
    exit 1
fi

# Get current version
current_version=$(grep "version:" "agents/${agent_name}.md" | cut -d' ' -f2)

# Calculate new version
new_version=$(semver bump $version_type $current_version)

# Update agent file
sed -i "s/version: $current_version/version: $new_version/" "agents/${agent_name}.md"

# Create git tag
git add "agents/${agent_name}.md"
git commit -m "chore: bump ${agent_name} to v${new_version}"
git tag "${agent_name}-v${new_version}"

echo "Agent ${agent_name} bumped to v${new_version}"
```

## Monitor Team Usage and Performance

### Usage Analytics

Track team adoption and performance:

```python
# Team analytics script
import json
from collections import defaultdict
from datetime import datetime, timedelta

def analyze_team_usage(log_file: str) -> dict:
    """Analyze team Claude Code usage patterns."""
    
    usage_stats = defaultdict(lambda: {
        'agent_calls': 0,
        'successful_runs': 0, 
        'failed_runs': 0,
        'total_tokens': 0,
        'unique_agents': set(),
        'commands_run': set()
    })
    
    with open(log_file) as f:
        for line in f:
            entry = json.loads(line)
            user = entry.get('user')
            
            if user:
                stats = usage_stats[user]
                stats['agent_calls'] += 1
                stats['unique_agents'].add(entry.get('agent'))
                stats['total_tokens'] += entry.get('tokens', 0)
                
                if entry.get('success'):
                    stats['successful_runs'] += 1
                else:
                    stats['failed_runs'] += 1
    
    # Convert sets to counts for JSON serialization
    for user_stats in usage_stats.values():
        user_stats['unique_agents'] = len(user_stats['unique_agents'])
        user_stats['commands_run'] = len(user_stats['commands_run'])
    
    return dict(usage_stats)

# Generate team report
def generate_team_report(usage_stats: dict) -> str:
    """Generate team usage report."""
    
    total_users = len(usage_stats)
    total_calls = sum(stats['agent_calls'] for stats in usage_stats.values())
    avg_success_rate = sum(
        stats['successful_runs'] / max(stats['agent_calls'], 1) 
        for stats in usage_stats.values()
    ) / max(total_users, 1)
    
    report = [
        "# Team Claude Code Usage Report",
        f"**Period**: Last 30 days",
        f"**Active Users**: {total_users}",
        f"**Total Agent Calls**: {total_calls:,}",
        f"**Average Success Rate**: {avg_success_rate:.1%}",
        "",
        "## Top Users",
    ]
    
    # Sort by usage
    sorted_users = sorted(
        usage_stats.items(), 
        key=lambda x: x[1]['agent_calls'],
        reverse=True
    )
    
    for user, stats in sorted_users[:10]:
        success_rate = stats['successful_runs'] / max(stats['agent_calls'], 1)
        report.append(
            f"- **{user}**: {stats['agent_calls']} calls, "
            f"{success_rate:.1%} success rate, "
            f"{stats['unique_agents']} unique agents"
        )
    
    return "\n".join(report)
```

### Performance Monitoring Dashboard

Set up team performance monitoring:

```python
# Team dashboard
def create_team_dashboard():
    """Create performance dashboard for team."""
    
    metrics = {
        'daily_agent_usage': get_daily_usage(),
        'popular_agents': get_popular_agents(),
        'failure_rate_by_agent': get_failure_rates(),
        'cost_by_team_member': get_cost_breakdown(),
        'command_success_rates': get_command_metrics()
    }
    
    # Generate dashboard HTML
    dashboard_html = generate_dashboard_html(metrics)
    
    # Save to shared location
    with open('/shared/dashboards/claude-team-dashboard.html', 'w') as f:
        f.write(dashboard_html)
    
    # Send summary to team channel
    send_slack_update(metrics)
```

## Troubleshooting Team Issues

### Common Team Collaboration Problems

1. **Inconsistent agent versions**
   ```bash
   # Check version consistency across team
   claude agent list --versions | sort
   
   # Force sync to latest team configuration
   sync-claude --force
   ```

2. **Configuration conflicts**
   ```bash
   # Validate team configuration
   claude config validate --team-mode
   
   # Reset to team defaults
   claude config reset --import team-settings.json
   ```

3. **Agent sharing issues**
   ```bash
   # Check agent compatibility
   claude agent validate security-reviewer --team-requirements
   
   # Test agent with team standards
   claude agent test security-reviewer --team-mode
   ```

### Team Support Procedures

Create escalation procedures:

```yaml
# team-support.yaml
support_levels:
  level_1:  # Self-service
    issues: ["configuration", "basic_usage", "agent_import"]
    resources: ["wiki", "faq", "team_chat"]
    
  level_2:  # Team leads
    issues: ["command_problems", "agent_conflicts", "performance"]
    contacts: ["alice@company.com", "bob@company.com"]
    response_time: "4 hours"
    
  level_3:  # Platform team
    issues: ["infrastructure", "security", "enterprise_features"]
    contacts: ["platform-team@company.com"]
    response_time: "24 hours"
```

## Best Practices Summary

- Establish shared configuration and standards early
- Version control all team agents and commands
- Implement peer review for shared components
- Set up automated configuration sync
- Monitor team usage and performance
- Create clear escalation procedures
- Regular team training on new patterns
- Document team-specific conventions
- Use notifications for coordination
- Maintain agent quality standards
- Regular review and improvement cycles