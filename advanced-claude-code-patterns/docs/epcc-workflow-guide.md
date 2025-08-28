# Explore-Plan-Code-Commit (EPCC) Workflow Guide

## Overview

The Explore-Plan-Code-Commit (EPCC) workflow is Anthropic's recommended approach for using Claude Code effectively. This systematic methodology ensures thorough understanding, careful planning, quality implementation, and proper version control throughout your development process.

> 📊 **Visual Guide**: See the [EPCC Workflow Architecture Diagram](epcc-workflow-diagram.md) for a complete visual representation of how commands, agents, hooks, and outputs interact throughout the EPCC workflow.

## The Four Phases of EPCC

### 🔍 Phase 1: EXPLORE
**Understand the codebase, requirements, and constraints**  
**Output**: `EPCC_EXPLORE.md`

### 📋 Phase 2: PLAN
**Design the approach and break down the work**  
**Output**: `EPCC_PLAN.md`

### 💻 Phase 3: CODE
**Implement the solution with best practices**  
**Output**: `EPCC_CODE.md`

### ✅ Phase 4: COMMIT
**Review, test, and commit the changes**  
**Output**: `EPCC_COMMIT.md`

## Detailed Phase Breakdown

### Phase 1: EXPLORE - Understanding the Landscape

The Explore phase is about gathering context and understanding before taking action.

#### Key Activities

```
💬 /epcc/epcc-explore

# Or with specific focus:
💬 /epcc/epcc-explore authentication --deep
💬 /epcc/epcc-explore database --quick

# This generates EPCC_EXPLORE.md with:
# - Project structure analysis
# - Pattern identification
# - Dependency mapping
# - Similar implementations
```

#### Extended Thinking for Exploration

```
# For complex codebases:
💬 Think hard about the architecture and design patterns in this codebase

# For legacy systems:
💬 Ultrathink about how this legacy system works and its constraints
```

#### Exploration Checklist

- [ ] Project structure understood
- [ ] Key files and modules identified
- [ ] Coding conventions documented
- [ ] Dependencies mapped
- [ ] Similar implementations reviewed
- [ ] Constraints and limitations noted
- [ ] Testing approach understood
- [ ] Deployment process reviewed

#### Parallel Exploration Subagents

```yaml
exploration_agents:
  - name: codebase_explorer
    focus: "Map project structure and dependencies"
  - name: pattern_analyzer
    focus: "Identify coding patterns and conventions"
  - name: test_explorer
    focus: "Understand testing approach and coverage"
  - name: documentation_reader
    focus: "Review existing documentation"
```

### Phase 2: PLAN - Strategic Design

The Plan phase transforms understanding into actionable strategy.

#### Planning Approach

```
💬 /epcc/epcc-plan "user authentication feature"

# Or with specific parameters:
💬 /epcc/epcc-plan --detailed --with-risks "payment processing"

# This generates EPCC_PLAN.md with:
# - Implementation objectives
# - Technical approach
# - Task breakdown
# - Risk assessment
# - Testing strategy
```

#### Plan Documentation Template

```markdown
# Implementation Plan: [Feature Name]

## Objective
[Clear statement of what we're building]

## Approach
[High-level strategy]

## Tasks Breakdown
1. [ ] Task 1: Description (Estimated: X hours)
2. [ ] Task 2: Description (Estimated: X hours)
3. [ ] Task 3: Description (Estimated: X hours)

## Dependencies
- External: [List external dependencies]
- Internal: [List internal dependencies]

## Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Risk 1 | High | Mitigation strategy |

## Success Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Testing Strategy
- Unit tests: [Approach]
- Integration tests: [Approach]
- Manual testing: [Checklist]
```

#### Using TodoWrite for Planning

```
# Automatically create and track tasks:
💬 Use TodoWrite to create a task list for implementing user authentication
```

### Phase 3: CODE - Implementation Excellence

The Code phase is where plans become reality through disciplined implementation.

#### Coding Strategy

```
💬 /epcc/epcc-code "implement next task from EPCC_PLAN.md"

# Or with TDD approach:
💬 /epcc/epcc-code --tdd "implement user registration"

# This generates EPCC_CODE.md with:
# - Implementation progress
# - Code metrics
# - Test results
# - Key decisions
# - Documentation updates
```

#### Code Quality Gates

```python
# Before moving to next task
def code_quality_check():
    checks = {
        "tests_pass": run_tests(),
        "linting_clean": run_linter(),
        "type_checking": run_type_checker(),
        "security_scan": run_security_scan(),
        "documentation": check_documentation()
    }
    
    return all(checks.values())
```

#### Parallel Coding Subagents

```yaml
coding_agents:
  - name: implementation_agent
    focus: "Write the main implementation"
  - name: test_writer
    focus: "Create comprehensive tests"
  - name: documentation_agent
    focus: "Write inline documentation"
  - name: review_agent
    focus: "Review code for issues"
```

### Phase 4: COMMIT - Finalize and Version

The Commit phase ensures quality and maintains project history.

#### Pre-Commit Checklist

```
💬 /epcc/epcc-commit "feat: Add user authentication"

# Or with additional options:
💬 /epcc/epcc-commit --squash "Combine authentication commits"

# This generates EPCC_COMMIT.md with:
# - Change summary
# - Testing results
# - Security validations
# - Commit message
# - PR description
```

#### Commit Best Practices

```bash
# Use gh CLI for safer operations
gh pr create --title "feat: Add user authentication" \
  --body "Implements secure user authentication with JWT tokens"

# Structured commit message
git commit -m "feat(auth): Add JWT-based authentication

- Implement user registration and login
- Add JWT token generation and validation
- Create authentication middleware
- Add comprehensive test coverage

Closes #123"
```

#### Post-Commit Actions

- [ ] CI/CD pipeline passes
- [ ] Code review requested
- [ ] Documentation updated
- [ ] Team notified
- [ ] Task tracking updated

## EPCC Workflow Implementation

### EPCC Workflow Planning Example (YAML Documentation)

> **📝 Important Note About YAML Files**
> 
> YAML files are **NOT required** for EPCC workflows to function. The EPCC workflow is executed through slash commands (`/epcc/epcc-explore`, `/epcc/epcc-plan`, etc.), agents, and hooks.
> 
> However, YAML is a **best practice** for:
> - Drafting and brainstorming workflow designs
> - Documenting workflow structure for team collaboration
> - Planning complex multi-stage processes
> - Visualizing agent coordination and task dependencies
> 
> The following YAML example demonstrates how you might document your EPCC workflow for planning purposes:

**Example workflow documentation (not executable):**

```yaml
name: epcc_workflow
description: Explore-Plan-Code-Commit systematic development workflow
trigger: manual
model_strategy:
  explore: sonnet
  plan: sonnet
  code: sonnet
  complex_analysis: opus

stages:
  - name: explore
    description: Understand the codebase and requirements
    agent: general-purpose
    model: sonnet
    parallel_subagents:
      - name: structure_explorer
        tasks: [map_directories, identify_entry_points, trace_dependencies]
      - name: pattern_finder
        tasks: [analyze_code_style, identify_conventions, find_similar_code]
      - name: context_gatherer
        tasks: [read_documentation, check_tests, review_configs]
    outputs:
      - exploration_report.md
      - codebase_map.json
      - patterns_identified.md
    
  - name: plan
    description: Create detailed implementation plan
    agent: general-purpose
    model: sonnet
    tasks:
      - analyze_requirements
      - design_solution
      - break_down_tasks
      - estimate_effort
      - identify_risks
    tools: [TodoWrite]
    outputs:
      - implementation_plan.md
      - task_breakdown.md
      - risk_matrix.csv
    
  - name: code
    description: Implement the solution
    agent: general-purpose
    model: sonnet
    parallel_subagents:
      - name: tdd_implementer
        tasks: [write_tests, implement_code, verify_tests_pass]
      - name: quality_guardian
        tasks: [run_linting, check_types, scan_security]
    iterative: true
    iteration_condition: "all_tasks_complete"
    outputs:
      - src/
      - tests/
      - docs/
    
  - name: commit
    description: Finalize and commit changes
    agent: general-purpose
    model: sonnet
    tasks:
      - review_all_changes
      - run_final_tests
      - update_documentation
      - create_commit_message
      - push_changes
      - create_pull_request
    tools: [Bash, Git]
    outputs:
      - commit_summary.md
      - pr_description.md

quality_gates:
  explore_complete:
    - codebase_understood: true
    - patterns_documented: true
    - constraints_identified: true
  
  plan_complete:
    - tasks_defined: true
    - risks_assessed: true
    - estimates_provided: true
  
  code_complete:
    - all_tests_pass: true
    - code_quality_met: true
    - documentation_complete: true
  
  commit_ready:
    - changes_reviewed: true
    - ci_pipeline_passes: true
    - no_security_issues: true
```

## Using EPCC Command Templates

The EPCC workflow provides four command templates that generate standardized documentation. These commands are organized in the `epcc/` subdirectory for better grouping.

### Command Overview

| Command | Purpose | Output File | Key Contents |
|---------|---------|-------------|---------------|
| `/epcc/epcc-explore` | Understand codebase | `EPCC_EXPLORE.md` | Structure analysis, patterns, constraints |
| `/epcc/epcc-plan` | Design approach | `EPCC_PLAN.md` | Tasks, risks, timeline, test strategy |
| `/epcc/epcc-code` | Implement solution | `EPCC_CODE.md` | Progress, metrics, test results |
| `/epcc/epcc-commit` | Finalize changes | `EPCC_COMMIT.md` | Summary, commit message, PR details |

### Example: Complete EPCC Flow with Commands

```
# Step 1: EXPLORE - Understand the codebase
💬 /epcc/epcc-explore "authentication system" --deep

# Output: EPCC_EXPLORE.md is generated with:
# - Executive summary
# - Project structure mapping
# - Code patterns and conventions
# - Dependencies analysis
# - Constraints and risks
# - Recommendations

# Step 2: PLAN - Design the approach
💬 /epcc/epcc-plan "JWT authentication implementation"

# Output: EPCC_PLAN.md is generated with:
# - Implementation objectives
# - Technical design
# - Task breakdown with estimates
# - Risk matrix
# - Testing strategy
# - Success criteria

# Step 3: CODE - Implement the solution
💬 /epcc/epcc-code "implement JWT token generation"

# Output: EPCC_CODE.md is generated with:
# - Completed tasks checklist
# - Code metrics (coverage, quality)
# - Test results
# - Key implementation decisions
# - Challenges and resolutions

# Step 4: COMMIT - Finalize the changes
💬 /epcc/epcc-commit "feat: Add JWT authentication"

# Output: EPCC_COMMIT.md is generated with:
# - Complete change summary
# - Testing and security validation
# - Final commit message
# - Pull request description
# - Documentation updates
```

### EPCC Output Files Structure

#### EPCC_EXPLORE.md Example
```markdown
# Exploration Report: Authentication System
## Date: 2024-01-15

## Executive Summary
Current authentication uses session-based approach with potential security vulnerabilities...

## Project Structure
```
auth/
├── models/
│   └── user.py
├── services/
│   └── auth_service.py
└── middleware/
    └── auth_middleware.py
```

## Patterns Identified
- MVC architecture
- Repository pattern for data access
- Middleware for request authentication

## Dependencies
- External: Flask, SQLAlchemy, bcrypt
- Internal: Database module, Config module

## Constraints
- Must maintain backward compatibility
- Performance: <100ms response time
- Security: OWASP compliance required

## Recommendations
1. Migrate to JWT for stateless auth
2. Implement refresh tokens
3. Add rate limiting
```

#### EPCC_PLAN.md Example
```markdown
# Implementation Plan: JWT Authentication
## Date: 2024-01-15

## Objectives
- Replace session-based auth with JWT
- Implement secure token refresh
- Maintain backward compatibility

## Technical Approach
1. JWT token generation service
2. Token validation middleware
3. Refresh token mechanism
4. Migration path for existing users

## Task Breakdown
- [ ] Create JWT service (3h)
- [ ] Implement token generation (2h)
- [ ] Add validation middleware (2h)
- [ ] Create refresh endpoint (2h)
- [ ] Write migration script (3h)
- [ ] Update documentation (1h)

## Risk Assessment
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Token theft | Low | High | Short expiry, refresh tokens |
| Migration issues | Medium | High | Gradual rollout, fallback |

## Testing Strategy
- Unit tests: JWT service, validation
- Integration tests: Auth flow
- Security tests: Token validation
- Performance tests: <100ms target
```

#### EPCC_CODE.md Example
```markdown
# Code Implementation Report
## Date: 2024-01-15
## Feature: JWT Authentication

## Implemented Tasks
- [x] JWT service creation
  - Files: jwt_service.py, config.py
  - Tests: 12 added
  - Coverage: 98%
  
- [x] Token generation
  - Files: auth_controller.py
  - Tests: 8 added
  - Coverage: 95%

## Code Metrics
- Total LOC: 450
- Test Coverage: 96%
- Linting: Pass
- Security Scan: Pass

## Key Decisions
1. Used PyJWT library for token handling
2. 15-minute access token expiry
3. 7-day refresh token expiry

## Challenges Resolved
1. Token size optimization - Used custom claims
2. Clock skew handling - Added 30s leeway
```

#### EPCC_COMMIT.md Example
```markdown
# Commit Summary
## Date: 2024-01-15
## Feature: JWT Authentication

## Changes Overview
### What Changed
- Implemented JWT-based authentication
- Added token refresh mechanism
- Created migration path from sessions

### Why It Changed
- Improve scalability with stateless auth
- Enable mobile app authentication
- Reduce server memory usage

## Files Changed
```
Added: auth/jwt_service.py
Added: auth/refresh_token.py
Modified: auth/middleware.py
Added: tests/test_jwt.py
Updated: README.md
```

## Testing Summary
- Unit Tests: ✅ 45 passing
- Integration Tests: ✅ 12 passing
- Security Tests: ✅ 8 passing
- Coverage: 96%

## Commit Message
```
feat(auth): Add JWT authentication with refresh tokens

- Implement JWT token generation and validation
- Add refresh token mechanism with 7-day expiry
- Create migration path from session-based auth
- Add comprehensive test coverage (96%)
- Update documentation with JWT flow

Breaking Change: API now returns tokens instead of setting cookies
Migration: Run scripts/migrate_to_jwt.py

Closes #234
```

## Planning Framework

### 1. Define Objectives
- Clear goal statement
- Success criteria
- Non-goals (what we're NOT doing)

### 2. Design Approach
- High-level architecture
- Component interactions
- Data flow
- Error handling strategy

### 3. Break Down Work
Use TodoWrite to create tracked tasks:
- Granular, achievable tasks
- Clear dependencies
- Time estimates
- Priority levels

### 4. Risk Assessment
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Identify risks | Low/Med/High | Low/Med/High | Strategy |

## Extended Thinking

- **Simple features**: Standard planning
- **Complex features**: Think about edge cases
- **System changes**: Think hard about impacts
- **Architecture**: Ultrathink about long-term implications

## Planning Deliverables

1. **Implementation Plan** (implementation-plan.md)
2. **Task List** (via TodoWrite)
3. **Risk Matrix** (risks.md)
4. **Test Strategy** (test-plan.md)
5. **Timeline** (timeline.md)

## Usage

```bash
/epcc/epcc-plan "plan user authentication implementation"
/epcc/epcc-plan --detailed "plan database migration"
/epcc/epcc-plan --with-risks "plan payment system"
```
```

### Command Arguments and Options

#### /epcc/epcc-explore Arguments
```bash
# Basic exploration
/epcc/epcc-explore

# Focus on specific area
/epcc/epcc-explore "authentication system"

# Deep analysis
/epcc/epcc-explore "database layer" --deep

# Quick overview
/epcc/epcc-explore "API endpoints" --quick
```

#### /epcc/epcc-plan Arguments
```bash
# Basic planning
/epcc/epcc-plan "feature name"

# Detailed planning with risks
/epcc/epcc-plan "payment integration" --detailed --with-risks

# Quick planning for small changes
/epcc/epcc-plan "bug fix" --quick
```

#### /epcc/epcc-code Arguments
```bash
# Continue from plan
/epcc/epcc-code

# Specific task implementation
/epcc/epcc-code "implement user registration"

# Test-driven development
/epcc/epcc-code --tdd "add password validation"
```

#### /epcc/epcc-commit Arguments
```bash
# Standard commit
/epcc/epcc-commit "feat: Add feature"

# Amend last commit
/epcc/epcc-commit --amend

# Squash commits
/epcc/epcc-commit --squash "Combine related changes"
```

```markdown
---
name: epcc-code
description: Code phase of EPCC workflow - disciplined implementation
model: sonnet
tools: [Write, Edit, MultiEdit, Bash, Test]
---

# EPCC Code Command

You are in the CODE phase of the EPCC workflow. Implement the plan with excellence.

## Coding Principles

### 1. Test-Driven Development
- Write tests first
- Implement minimal code
- Refactor for quality

### 2. Incremental Progress
- Complete one task at a time
- Commit working code frequently
- Maintain green tests

### 3. Continuous Quality
- Run tests after each change
- Fix issues immediately
- Refactor as you go

## Implementation Process

For each task from the plan:
1. Write tests
2. Implement code
3. Verify tests pass
4. Refactor if needed
5. Update documentation
6. Mark task complete

## Parallel Coding Agents

Deploy specialized agents:
- **Main Coder**: Implement features
- **Test Writer**: Create tests
- **Quality Checker**: Lint and analyze
- **Documentation**: Update docs

## Quality Gates

Before moving to next task:
- [ ] Current tests pass
- [ ] Code is linted
- [ ] Types are correct
- [ ] Documentation updated
- [ ] Security scan clean

## Usage

```bash
/epcc/epcc-code "implement the next task from plan"
/epcc/epcc-code --task "implement user registration"
/epcc/epcc-code --tdd "add password validation"
```
```

### Workflow Integration Benefits

#### 1. Traceability
Each phase generates a document that feeds into the next:
- `EPCC_EXPLORE.md` → informs → `EPCC_PLAN.md`
- `EPCC_PLAN.md` → guides → `EPCC_CODE.md`
- `EPCC_CODE.md` → validates → `EPCC_COMMIT.md`

#### 2. Documentation
Automatically creates project documentation:
- Exploration findings preserved
- Design decisions documented
- Implementation details captured
- Change history maintained

#### 3. Review Process
Each output file can be reviewed:
```bash
# Team can review exploration findings
cat EPCC_EXPLORE.md

# Validate the plan before coding
cat EPCC_PLAN.md

# Check implementation progress
cat EPCC_CODE.md

# Review before merging
cat EPCC_COMMIT.md
```

#### 4. Continuous Improvement
Metrics from output files help improve:
- Time spent in each phase
- Task estimation accuracy
- Test coverage trends
- Defect rates by phase

```markdown
---
name: epcc-commit
description: Commit phase of EPCC workflow - finalize and version changes
model: sonnet
tools: [Bash, Read, Git]
---

# EPCC Commit Command

You are in the COMMIT phase of the EPCC workflow. Finalize changes with proper version control.

## Pre-Commit Checklist

### 1. Review Changes
```bash
git status
git diff --staged
git diff
```

### 2. Quality Verification
```bash
# Run all tests
pytest -v
npm test

# Check code quality
pylint src/
eslint .

# Security scan
bandit -r .
npm audit
```

### 3. Documentation Check
- README updated?
- API docs current?
- Inline comments clear?
- CHANGELOG updated?

## Commit Message Format

```
type(scope): subject

body

footer
```

Types: feat, fix, docs, style, refactor, test, chore

## Using gh CLI

```bash
# Create PR with gh
gh pr create \
  --title "feat: Add user authentication" \
  --body "$(cat pr-description.md)" \
  --label "enhancement" \
  --reviewer @team-lead
```

## Final Steps

1. Create descriptive commit
2. Push to feature branch
3. Create pull request
4. Request review
5. Update task tracking

## Usage

```bash
/epcc/epcc-commit "finalize authentication feature"
/epcc/epcc-commit --squash "combine related commits"
/epcc/epcc-commit --pr "create pull request"
```
```

## EPCC Best Practices

### 1. Don't Skip Exploration

```
# ❌ WRONG: Jump straight to coding
💬 implement user authentication

# ✅ RIGHT: Explore first
💬 explore the current authentication approach in this codebase
💬 plan improvements to authentication
💬 implement the authentication plan
💬 commit the authentication changes
```

### 2. Plan Before Coding

```
# ❌ WRONG: Code without a plan
💬 start adding features

# ✅ RIGHT: Plan systematically
💬 create a plan for adding OAuth support
💬 use TodoWrite to track the OAuth implementation tasks
```

### 3. Incremental Implementation

```
# ❌ WRONG: Try to do everything at once
💬 rewrite the entire backend

# ✅ RIGHT: Work incrementally
💬 implement the first task from our backend refactoring plan
💬 review and test what we just implemented
💬 proceed to the next task
```

### 4. Meaningful Commits

```bash
# ❌ WRONG: Generic commit messages
git commit -m "updates"

# ✅ RIGHT: Descriptive commits
git commit -m "feat(auth): Add JWT token validation with refresh logic"
```

## EPCC Integration with Other Patterns

### With TDD Workflow

```yaml
epcc_with_tdd:
  explore:
    - understand_testing_approach
    - identify_test_patterns
  plan:
    - plan_test_scenarios
    - design_test_structure
  code:
    - write_tests_first
    - implement_to_pass_tests
  commit:
    - verify_test_coverage
    - commit_tests_with_code
```

### With Extended Thinking

```yaml
epcc_with_thinking:
  explore:
    command: "Think hard about the system architecture"
  plan:
    command: "Think harder about potential edge cases"
  code:
    command: "Think about optimization opportunities"
  commit:
    command: "Think about commit message clarity"
```

### With Security Workflow

```yaml
epcc_with_security:
  explore:
    - identify_security_requirements
    - review_existing_security
  plan:
    - plan_security_controls
    - design_threat_model
  code:
    - implement_secure_coding
    - add_security_tests
  commit:
    - run_security_scan
    - verify_no_secrets
```

## EPCC Metrics and Monitoring

### Track EPCC Effectiveness

```python
epcc_metrics = {
    "explore_time": "Average time in exploration phase",
    "plan_accuracy": "% of planned tasks completed as designed",
    "code_quality": "Defect rate in coded features",
    "commit_frequency": "Commits per feature",
    "rework_rate": "% of code requiring rework",
    "cycle_time": "Time from explore to commit"
}
```

### EPCC Dashboard

```yaml
dashboard:
  current_phase: "explore|plan|code|commit"
  tasks_completed: 5
  tasks_remaining: 3
  quality_score: 95
  test_coverage: 92
  time_in_phase: "2h 15m"
  blockers: []
```

## Common EPCC Scenarios Using Commands

### Scenario 1: New Feature Development

```
# 1. EXPLORE - Understand existing patterns
💬 /epcc/epcc-explore "shopping cart" --deep
# → Generates EPCC_EXPLORE.md with current implementation analysis

# 2. PLAN - Design the new feature
💬 /epcc/epcc-plan "enhanced shopping cart with saved items"
# → Generates EPCC_PLAN.md with tasks and timeline

# 3. CODE - Implement following the plan
💬 /epcc/epcc-code --tdd "implement cart persistence"
# → Generates EPCC_CODE.md with progress tracking

# 4. COMMIT - Finalize with proper documentation
💬 /epcc/epcc-commit "feat: Add persistent shopping cart"
# → Generates EPCC_COMMIT.md with PR-ready content
```

### Scenario 2: Bug Fix

```
# 1. EXPLORE - Investigate the bug
💬 /epcc/epcc-explore "login bug #456" --focus authentication
# → EPCC_EXPLORE.md: Root cause analysis

# 2. PLAN - Design the fix
💬 /epcc/epcc-plan "fix login session timeout bug"
# → EPCC_PLAN.md: Fix approach with test cases

# 3. CODE - Fix with tests
💬 /epcc/epcc-code --tdd "fix session timeout handling"
# → EPCC_CODE.md: Implementation with test results

# 4. COMMIT - Document the fix
💬 /epcc/epcc-commit "fix: Resolve login session timeout issue"
# → EPCC_COMMIT.md: Complete fix documentation
```

### Scenario 3: Refactoring

```
# 1. EXPLORE - Analyze current state
💬 /epcc/epcc-explore "payment module" --deep
# → EPCC_EXPLORE.md: Current architecture and pain points

# 2. PLAN - Design improvements
💬 /epcc/epcc-plan "refactor payment module to strategy pattern"
# → EPCC_PLAN.md: Refactoring steps with risk mitigation

# 3. CODE - Refactor incrementally
💬 /epcc/epcc-code "refactor payment processor abstraction"
# → EPCC_CODE.md: Refactoring progress and test status

# 4. COMMIT - Finalize refactoring
💬 /epcc/epcc-commit "refactor: Implement strategy pattern for payments"
# → EPCC_COMMIT.md: Refactoring summary and benefits
```

## EPCC Automation

### Git Hooks for EPCC

`.git/hooks/pre-commit`:
```bash
#!/bin/bash
# Ensure we're not committing without exploration and planning

if ! [ -f ".epcc/exploration-complete" ]; then
  echo "Error: Exploration phase not documented"
  exit 1
fi

if ! [ -f ".epcc/plan-complete" ]; then
  echo "Error: Plan phase not documented"
  exit 1
fi

echo "EPCC phases verified ✓"
```

### CI/CD Integration

```yaml
name: EPCC Validation
on: [pull_request]

jobs:
  validate-epcc:
    runs-on: ubuntu-latest
    steps:
      - name: Check exploration docs
        run: test -f docs/exploration-report.md
      
      - name: Check plan docs
        run: test -f docs/implementation-plan.md
      
      - name: Check tests exist
        run: test -d tests/
      
      - name: Check commit message
        run: |
          git log -1 --pretty=%B | grep -E '^(feat|fix|docs|style|refactor|test|chore)'
```

## EPCC Quick Reference Card

```
┌─────────────────────────────────────────────────┐
│              EPCC WORKFLOW                      │
├─────────────────────────────────────────────────┤
│                                                 │
│  1. EXPLORE 🔍 → EPCC_EXPLORE.md              │
│     └─ Understand before acting                │
│     └─ Map codebase and patterns              │
│     └─ Identify constraints                    │
│                                                 │
│  2. PLAN 📋 → EPCC_PLAN.md                    │
│     └─ Design the approach                     │
│     └─ Break down into tasks                   │
│     └─ Assess risks                           │
│                                                 │
│  3. CODE 💻 → EPCC_CODE.md                    │
│     └─ Implement incrementally                 │
│     └─ Test continuously                       │
│     └─ Maintain quality                        │
│                                                 │
│  4. COMMIT ✅ → EPCC_COMMIT.md                │
│     └─ Review all changes                      │
│     └─ Ensure tests pass                       │
│     └─ Create clear commits                    │
│                                                 │
├─────────────────────────────────────────────────┤
│ Commands & Output Files:                        │
│   /epcc/epcc-explore → EPCC_EXPLORE.md         │
│   /epcc/epcc-plan → EPCC_PLAN.md               │
│   /epcc/epcc-code → EPCC_CODE.md               │
│   /epcc/epcc-commit → EPCC_COMMIT.md           │
├─────────────────────────────────────────────────┤
│ Complete Documentation Trail:                   │
│   All phases create permanent records          │
│   for review, audit, and learning              │
└─────────────────────────────────────────────────┘
```

## Conclusion

The EPCC workflow ensures systematic, high-quality development by:

1. **Understanding before acting** (Explore)
2. **Planning before implementing** (Plan)
3. **Coding with discipline** (Code)
4. **Committing with confidence** (Commit)

This methodology reduces errors, improves code quality, and creates better documentation throughout the development process.