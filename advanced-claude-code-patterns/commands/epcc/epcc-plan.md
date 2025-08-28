---
name: epcc-plan
description: Plan phase of EPCC workflow - strategic design before implementation
version: 1.0.0
argument-hint: "[feature-or-task-to-plan]"
---

# EPCC Plan Command

You are in the **PLAN** phase of the Explore-Plan-Code-Commit workflow. Transform exploration insights into actionable strategy.

⚠️ **IMPORTANT**: This phase is for PLANNING ONLY. Do NOT write any implementation code. Focus exclusively on:
- Creating detailed plans
- Breaking down tasks
- Assessing risks
- Documenting everything in EPCC_PLAN.md

All implementation will happen in the CODE phase.

## Planning Target
$ARGUMENTS

If no specific feature or task was provided above, ask the user: "What feature or task would you like to plan?"

## 📋 Planning Objectives

1. **Define Clear Goals**: What exactly are we building?
2. **Design the Approach**: How will we build it?
3. **Break Down Work**: What are the specific tasks?
4. **Assess Risks**: What could go wrong?
5. **Set Success Criteria**: How do we know we're done?

## Extended Thinking Strategy

- **Simple features**: Standard task breakdown
- **Complex features**: Think about edge cases and interactions
- **System changes**: Think hard about ripple effects
- **Architecture decisions**: Ultrathink about long-term implications

## Parallel Planning Subagents

Deploy specialized planning agents you have access to:
@system-designer @tech-evaluator @business-analyst @security-reviewer @qa-engineer @project-manager

**Agent Instructions**: Each agent must ONLY plan and document. Save all implementation for the CODE phase:
- @system-designer: Design system architecture and component interactions (NO CODING - only design)
- @tech-evaluator: Evaluate technology choices and build vs buy decisions (NO IMPLEMENTATION)
- @business-analyst: Break down requirements into manageable tasks (NO IMPLEMENTATION)
- @security-reviewer: Assess risks and identify potential vulnerabilities (NO FIXES - only identify)
- @qa-engineer: Plan comprehensive testing strategy (NO TEST WRITING - only strategy)
- @project-manager: Calculate realistic timelines and resource allocation (PLANNING ONLY)

Note: You can find details about the codebase in EPCC_EXPLORE.md if it exists.

## Planning Framework

### Step 1: Define Objectives

```markdown
## Feature Objective

### What We're Building
[Clear, concise description]

### Why It's Needed
[Business value and user benefit]

### Success Criteria
- [ ] Criterion 1: Measurable outcome
- [ ] Criterion 2: Measurable outcome
- [ ] Criterion 3: Measurable outcome

### Non-Goals (What We're NOT Doing)
- Not implementing X (will be done later)
- Not changing Y (out of scope)
- Not optimizing Z (separate task)
```

### Step 2: Design the Approach

```markdown
## Technical Approach

### High-Level Architecture
```
[Component A] --> [Component B] --> [Component C]
     |                |                  |
     v                v                  v
[Database]      [Cache Layer]      [External API]
```

### Design Decisions
| Decision | Option Chosen | Rationale |
|----------|--------------|-----------|
| Database | PostgreSQL | Need ACID compliance |
| Caching | Redis | Fast, supports our data types |
| Auth | JWT | Stateless, scalable |

### Data Flow
1. User initiates request
2. System validates input
3. Process business logic
4. Update database
5. Return response
```

### Step 3: Task Breakdown

Use TodoWrite to create trackable tasks (DO NOT implement these tasks now - only document them):

```python
tasks = [
    {
        "id": "1",
        "content": "Set up database schema",
        "estimate": "2 hours",
        "dependencies": [],
        "priority": "high"
    },
    {
        "id": "2", 
        "content": "Implement authentication middleware",
        "estimate": "3 hours",
        "dependencies": ["1"],
        "priority": "high"
    },
    {
        "id": "3",
        "content": "Create API endpoints",
        "estimate": "4 hours",
        "dependencies": ["1", "2"],
        "priority": "medium"
    }
]
```

### Step 4: Risk Assessment

```markdown
## Risk Matrix

| Risk | Probability | Impact | Mitigation Strategy |
|------|------------|--------|-------------------|
| Database migration fails | Low | High | Create rollback script, test in staging |
| API rate limits exceeded | Medium | Medium | Implement caching, request batching |
| Performance degradation | Low | High | Load testing, monitoring, optimization plan |
| Security vulnerability | Low | Critical | Security review, penetration testing |
```

### Step 5: Test Strategy

```markdown
## Testing Plan

### Unit Tests
- [ ] Model validation tests
- [ ] Service logic tests
- [ ] Utility function tests
- Coverage target: 90%

### Integration Tests
- [ ] API endpoint tests
- [ ] Database interaction tests
- [ ] External service mock tests
- Coverage target: 80%

### End-to-End Tests
- [ ] User workflow tests
- [ ] Error scenario tests
- [ ] Performance tests
- Coverage target: Critical paths

### Security Tests
- [ ] Authentication tests
- [ ] Authorization tests
- [ ] Input validation tests
- [ ] SQL injection tests
```

## Planning Deliverables

### Output File: EPCC_PLAN.md

All planning documentation will be generated in `EPCC_PLAN.md` in the project root.

### 1. Implementation Plan Structure

```markdown
# Implementation Plan: [Feature Name]

## Overview
- **Objective**: [What we're building]
- **Timeline**: [Estimated duration]
- **Priority**: [High/Medium/Low]
- **Owner**: [Responsible party]

## Approach
[Detailed technical approach]

## Task Breakdown
1. [ ] Task 1 (2h) - Description
2. [ ] Task 2 (3h) - Description
3. [ ] Task 3 (4h) - Description

## Dependencies
- External: [List external dependencies]
- Internal: [List internal dependencies]
- Blockers: [List any blockers]

## Risks & Mitigations
[Risk assessment table]

## Success Metrics
- Performance: [Metrics]
- Quality: [Metrics]
- User satisfaction: [Metrics]

## Testing Strategy
[Test plan summary]

## Rollout Plan
- Phase 1: [Description]
- Phase 2: [Description]
- Rollback procedure: [Description]
```

### 2. Task List (included in EPCC_PLAN.md)

Tasks will be documented in EPCC_PLAN.md and can also be tracked via TodoWrite:

```bash
# Create task list
TodoWrite.create([
    "Database schema design",
    "API endpoint implementation",
    "Authentication setup",
    "Frontend integration",
    "Testing",
    "Documentation"
])
```

### 3. Technical Design Document (included in EPCC_PLAN.md)

```markdown
# Technical Design: [Feature Name]

## Architecture
[Detailed architecture diagram and explanation]

## API Design
### Endpoints
- `POST /api/resource` - Create resource
- `GET /api/resource/:id` - Get resource
- `PUT /api/resource/:id` - Update resource
- `DELETE /api/resource/:id` - Delete resource

### Data Models
```json
{
  "resource": {
    "id": "uuid",
    "name": "string",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

## Database Schema
```sql
CREATE TABLE resources (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## Security Considerations
- Authentication: [Method]
- Authorization: [Method]
- Data validation: [Method]
- Encryption: [Method]
```

## Planning Best Practices

### DO:
- ✅ Break tasks into < 4 hour chunks
- ✅ Include testing in every task
- ✅ Consider edge cases explicitly
- ✅ Document design decisions
- ✅ Plan for rollback

### DON'T:
- ❌ Skip risk assessment
- ❌ Underestimate complexity
- ❌ Ignore dependencies
- ❌ Plan without exploration
- ❌ Forget documentation tasks

## Planning Checklist

Before proceeding to CODE phase, ensure all plans are documented in `EPCC_PLAN.md`.

**REMINDER**: No code should be written during this phase. If you're tempted to implement something, document it as a task instead:

- [ ] Objectives clearly defined
- [ ] Approach thoroughly designed
- [ ] Tasks broken down and estimated
- [ ] Dependencies identified
- [ ] Risks assessed and mitigated
- [ ] Test strategy defined
- [ ] Success criteria established
- [ ] Documentation planned
- [ ] Timeline realistic
- [ ] Resources available

## Usage Examples

```bash
# Basic planning
/epcc-plan "Plan user authentication feature"

# Detailed planning with risk assessment
/epcc-plan --detailed --with-risks "Plan payment processing"

# Quick planning for small feature
/epcc-plan --quick "Plan UI tooltip addition"

# Planning with specific focus
/epcc-plan --focus backend "Plan API refactoring"
/epcc-plan --focus security "Plan security improvements"
```

## Integration with Other Phases

### From EXPLORE:
- Use exploration findings from `EPCC_EXPLORE.md`
- Reference identified patterns from exploration
- Consider discovered constraints

### To CODE:
- Provide clear task list in `EPCC_PLAN.md`
- Define acceptance criteria in plan document
- Specify test requirements

### To COMMIT:
- Reference `EPCC_PLAN.md` in commit message
- Update documentation
- Include plan details in PR description

## Final Output

Upon completion, generate `EPCC_PLAN.md` containing:
- Implementation overview and objectives
- Technical approach and architecture
- Complete task breakdown with estimates
- Risk assessment and mitigation strategies
- Testing strategy and success criteria
- Dependencies and timeline

Remember: **A good plan is half the implementation!**

🚫 **DO NOT**: Write code, create files, implement features, or fix bugs
✅ **DO**: Plan, document, design, assess risks, break down tasks, and save everything to EPCC_PLAN.md