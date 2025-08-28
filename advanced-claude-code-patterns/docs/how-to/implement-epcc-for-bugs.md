# How to Implement EPCC for Bug Fixes

Use the EPCC workflow to systematically investigate and fix bugs with proper root cause analysis and prevention.

## Prerequisites
- Bug report with reproduction steps
- Access to logs and monitoring data
- Understanding of the affected system

## Steps

### 1. Explore the Bug Context

Use focused exploration to understand the bug:

```bash
/epcc/epcc-explore "login timeout bug #456" --focus authentication
```

**Investigation areas:**
- Reproduction steps and conditions
- Related code components
- Recent changes that might have introduced the bug
- Similar past issues and their fixes
- System logs and error patterns
- Performance implications

### 2. Plan the Fix Strategy

Create a focused plan for the bug fix:

```bash
/epcc/epcc-plan "fix session timeout causing premature logout"
```

**Planning considerations:**
- Root cause analysis
- Fix approach (patch vs. architectural change)
- Regression testing strategy
- Impact assessment on other features
- Rollback plan if needed
- Monitoring and validation approach

### 3. Implement with Test Coverage

Fix the bug using TDD to ensure proper test coverage:

```bash
/epcc/epcc-code --tdd "fix session timeout handling in authentication middleware"
```

**Implementation approach:**
- Write a test that reproduces the bug
- Implement the minimal fix to make the test pass
- Add additional tests for edge cases
- Refactor if the fix reveals design issues

### 4. Document the Resolution

Create comprehensive fix documentation:

```bash
/epcc/epcc-commit "fix: Resolve premature session timeout in authentication"
```

**Documentation should include:**
- Root cause explanation
- Fix implementation details
- Test coverage for the bug
- Verification steps
- Prevention measures added

## Example: Database Connection Leak

### Exploration Phase
```bash
/epcc/epcc-explore "database connection timeout errors" --focus database
```

**Investigation findings:**
- Connection pool configuration
- Database query patterns
- Connection lifecycle management
- Error patterns in logs
- Resource monitoring data

### Planning Phase
```bash
/epcc/epcc-plan "fix database connection leaks in payment processor"
```

**Fix strategy:**
- Identify connection leak sources
- Implement proper connection cleanup
- Add connection pool monitoring
- Create connection usage tests
- Plan for connection pool tuning

### Implementation Phase
```bash
# Write tests that expose the connection leak
/epcc/epcc-code --tdd "add connection leak detection tests"

# Fix the connection management
/epcc/epcc-code --tdd "implement proper connection cleanup in payment flows"

# Add monitoring and alerting
/epcc/epcc-code --tdd "add connection pool health monitoring"
```

### Commit Phase
```bash
/epcc/epcc-commit "fix: Resolve database connection leaks in payment processing"
```

## Bug-Specific EPCC Patterns

### Critical Production Bugs

For urgent production issues:

```bash
# Quick exploration for immediate understanding
/epcc/epcc-explore "payment processing failure" --quick

# Focused plan for immediate fix
/epcc/epcc-plan "hotfix payment gateway timeout" --quick

# Implement with existing test patterns
/epcc/epcc-code "apply timeout configuration fix"

# Fast-track commit for production
/epcc/epcc-commit "hotfix: Increase payment gateway timeout"
```

### Security Vulnerabilities

For security issues:

```bash
# Deep exploration with security focus
/epcc/epcc-explore "SQL injection vulnerability" --deep --focus security

# Plan with security validation
/epcc/epcc-plan "fix SQL injection in user search" --with-risks

# Implement with security testing
/epcc/epcc-code --tdd "implement parameterized queries for user search"

# Commit with security validation
/epcc/epcc-commit "security: Fix SQL injection vulnerability in user search"
```

### Performance Issues

For performance-related bugs:

```bash
# Explore with performance analysis
/epcc/epcc-explore "API response time degradation" --focus performance

# Plan performance optimization
/epcc/epcc-plan "optimize slow database queries in product search"

# Implement with performance testing
/epcc/epcc-code --tdd "optimize product search query and add caching"

# Commit with performance metrics
/epcc/epcc-commit "perf: Optimize product search query performance"
```

## Troubleshooting Bug Fixes

### When Root Cause Is Unclear
```bash
# Use extended thinking for complex issues
Think hard about the potential root causes of this intermittent database error

# Explore related systems
/epcc/epcc-explore "payment system dependencies" --deep

# Consider system-wide impact
Think harder about how this bug might affect other components
```

### When Fix Impact Is Uncertain
- Use `--with-risks` in planning phase
- Create comprehensive test scenarios
- Plan for gradual rollout
- Implement feature flags for easy rollback

### When Bug Affects Multiple Components
- Break into multiple EPCC cycles per component
- Use exploration phase to map all affected areas
- Coordinate fixes across components
- Test integration scenarios thoroughly

## Quality Assurance for Bug Fixes

### Pre-Commit Checklist
- [ ] Bug reproduction test exists and fails before fix
- [ ] Bug reproduction test passes after fix
- [ ] Regression tests cover similar scenarios
- [ ] Performance impact measured
- [ ] Security implications reviewed
- [ ] Documentation updated

### Post-Fix Monitoring
- Set up alerts for similar issues
- Monitor the fix in production
- Track fix effectiveness over time
- Document lessons learned for future prevention

## Integration with Bug Tracking

### Link EPCC Documentation to Tickets
```bash
# Reference the bug report in exploration
/epcc/epcc-explore "memory leak reported in ticket #789"

# Include ticket number in commit
/epcc/epcc-commit "fix: Resolve memory leak in image processing (closes #789)"
```

### Create Follow-up Tasks
Use the EPCC documentation to identify:
- Technical debt revealed by the bug
- Process improvements needed
- Additional monitoring or alerting
- Code quality improvements
- Documentation gaps