---
name: epcc
description: Master EPCC (Explore-Plan-Code-Commit) workflow coordinator for systematic development
argument-hint: "[phase] [feature-description]"
---

# EPCC Workflow Coordinator

The EPCC methodology provides systematic development workflows for complex projects.

## Usage

```bash
# Run complete EPCC workflow
/epcc "Add user authentication system"

# Run specific phase
/epcc explore "user authentication"
/epcc plan "user authentication"  
/epcc code "user authentication"
/epcc commit "user authentication"
```

## EPCC Phase Orchestration

The EPCC workflow coordinates specialized agents for each phase:

### EXPLORE Phase
Deploy analysis specialists:
@code-archaeologist @business-analyst @system-designer

**Objective**: Understand codebase, constraints, and requirements thoroughly before taking action.

### PLAN Phase  
Deploy planning specialists:
@architect @project-manager @security-reviewer

**Objective**: Create detailed implementation plan based on exploration findings.

### CODE Phase
Deploy implementation specialists:
@[domain-specific-agents] @test-generator @qa-engineer

**Objective**: Implement the planned solution with quality assurance.

### COMMIT Phase
Deploy quality and deployment specialists:
@security-reviewer @deployment-agent @documentation-agent

**Objective**: Finalize, test, document, and deploy the implemented solution.

## Expected Workflow Outputs

### EPCC_EXPLORE.md
- Project structure analysis
- Current system patterns and constraints  
- Dependencies and technical debt assessment
- Risk identification and mitigation strategies
- Recommendations for implementation approach

### EPCC_PLAN.md
- Detailed implementation roadmap
- Architecture and design decisions
- Task breakdown and effort estimation
- Risk mitigation strategies
- Success criteria and testing approach

### EPCC_CODE.md  
- Implementation progress tracking
- Code quality metrics and reviews
- Testing results and coverage
- Technical decisions and trade-offs
- Integration and deployment notes

### EPCC_COMMIT.md
- Final quality assurance results
- Deployment verification and rollback plans
- Documentation updates and knowledge transfer
- Post-deployment monitoring and support plans
- Lessons learned and process improvements

## Success Criteria

- Each phase builds on previous phase documentation
- All code changes are thoroughly understood before implementation
- Quality gates are met at each phase transition
- Documentation provides complete project context
- Team coordination is systematic and repeatable