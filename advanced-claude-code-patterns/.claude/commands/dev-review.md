---
name: dev-review
description: Comprehensive development review using coordinated specialist agents
argument-hint: "[project-directory]"
---

# Development Review Workflow

This workflow orchestrates multiple specialist agents to provide comprehensive project analysis.

## Workflow Overview

This command deploys three specialist agents in parallel to analyze your project:

1. **Project Architecture Analysis** (@project-assistant)
2. **Security Vulnerability Assessment** (@security-reviewer)  
3. **Documentation Quality Review** (@documentation-agent)

## Usage

```bash
/dev-review [project-directory]
```

## Parallel Agent Orchestration

Deploy all three specialist agents simultaneously:

@project-assistant @security-reviewer @documentation-agent

Each agent will analyze the project from their specialized perspective:

- **@project-assistant**: Analyzes project structure, architecture decisions, and provides improvement recommendations
- **@security-reviewer**: Identifies security vulnerabilities, reviews authentication patterns, and provides remediation guidance
- **@documentation-agent**: Reviews existing documentation, identifies gaps, and creates comprehensive technical documentation

## Agent Coordination Instructions

**For @project-assistant:**
Focus on architectural analysis and development workflow improvements. Provide specific recommendations for code organization, technology choices, and project structure.

**For @security-reviewer:**  
Conduct comprehensive security analysis focusing on OWASP Top 10 vulnerabilities. Identify specific security issues and provide actionable remediation steps.

**For @documentation-agent:**
Review documentation completeness and quality. Create missing documentation and ensure existing docs are accurate and useful.

## Expected Deliverables

After all agents complete their analysis:

1. **Architecture Report**: Structural analysis and improvement recommendations
2. **Security Assessment**: Vulnerability identification and remediation plan
3. **Documentation Audit**: Documentation gaps and improvement recommendations
4. **Integrated Action Plan**: Prioritized list of improvements across all areas

## Success Criteria

- All three agents provide analysis from their specialized perspective
- Recommendations are specific and actionable
- Security issues are clearly identified with fixes
- Documentation gaps are identified and addressed
- Integrated recommendations prioritize highest-impact improvements