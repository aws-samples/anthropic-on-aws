# How to Implement EPCC for Refactoring

Use the EPCC workflow to systematically refactor code while maintaining functionality and improving design quality.

## Prerequisites
- Identified code that needs refactoring
- Comprehensive test coverage for the target area
- Understanding of the current implementation
- Clear refactoring objectives

## Steps

### 1. Explore the Current Implementation

Conduct deep exploration to understand the existing design:

```bash
/epcc/epcc-explore "payment processing module" --deep
```

**Key exploration areas:**
- Current architecture and design patterns
- Code quality issues and technical debt
- Dependencies and coupling points
- Performance characteristics
- Test coverage and quality
- Maintenance pain points

### 2. Plan the Refactoring Approach

Create a detailed refactoring plan with risk mitigation:

```bash
/epcc/epcc-plan "refactor payment module to use strategy pattern" --detailed --with-risks
```

**Planning considerations:**
- Target architecture and design improvements
- Incremental refactoring steps
- Backward compatibility requirements
- Testing strategy during refactoring
- Risk mitigation for breaking changes
- Rollback plan if issues arise

### 3. Implement Incremental Changes

Refactor incrementally while maintaining green tests:

```bash
/epcc/epcc-code "extract payment processor interface"
/epcc/epcc-code "implement credit card payment strategy"
/epcc/epcc-code "implement PayPal payment strategy"
/epcc/epcc-code "migrate existing code to use strategy pattern"
```

**Refactoring principles:**
- Make small, focused changes
- Keep tests passing at each step
- Extract before you abstract
- Maintain functionality throughout

### 4. Document the Refactoring

Create comprehensive refactoring documentation:

```bash
/epcc/epcc-commit "refactor: Implement strategy pattern for payment processing"
```

**Documentation should include:**
- Refactoring objectives and benefits
- Before/after architecture comparison
- Improvement metrics (complexity, coupling, etc.)
- Migration guide for dependent code
- Performance impact analysis

## Example: Monolithic Service Decomposition

### Exploration Phase
```bash
/epcc/epcc-explore "user service monolith" --deep
```

**Exploration findings:**
- Current service responsibilities
- Database dependencies and relationships
- API interfaces and contracts
- Performance bottlenecks
- Deployment and scaling challenges
- Team ownership boundaries

### Planning Phase
```bash
/epcc/epcc-plan "extract authentication service from user monolith" --detailed --with-risks
```

**Decomposition strategy:**
- Service boundaries and responsibilities
- Data migration strategy
- API versioning approach
- Service communication patterns
- Gradual migration plan
- Monitoring and observability

### Implementation Phase
```bash
# Extract the domain model
/epcc/epcc-code "extract authentication domain entities"

# Create the new service interface
/epcc/epcc-code "implement authentication service API"

# Implement data migration
/epcc/epcc-code "implement authentication data migration"

# Update client code
/epcc/epcc-code "update user service to use authentication API"

# Remove deprecated code
/epcc/epcc-code "remove authentication logic from user service"
```

### Commit Phase
```bash
/epcc/epcc-commit "refactor: Extract authentication service from user monolith"
```

## Refactoring-Specific Patterns

### Legacy Code Modernization

```bash
# Understand legacy patterns
/epcc/epcc-explore "legacy customer management system" --deep

# Plan modernization approach
/epcc/epcc-plan "modernize customer API to REST standards" --with-risks

# Implement with adapter pattern for compatibility
/epcc/epcc-code "implement REST adapter for legacy customer API"

# Document modernization
/epcc/epcc-commit "refactor: Modernize customer API with REST standards"
```

### Performance Optimization

```bash
# Analyze performance issues
/epcc/epcc-explore "slow product search performance" --focus performance

# Plan optimization strategy
/epcc/epcc-plan "optimize product search with caching and indexing"

# Implement performance improvements
/epcc/epcc-code "implement Redis caching for product search"
/epcc/epcc-code "add database indexes for search queries"

# Document performance gains
/epcc/epcc-commit "perf: Optimize product search with caching and indexing"
```

### Architecture Pattern Migration

```bash
# Understand current architecture
/epcc/epcc-explore "event handling system" --deep

# Plan pattern migration
/epcc/epcc-plan "migrate from observer to event sourcing pattern"

# Implement new pattern incrementally
/epcc/epcc-code "implement event store infrastructure"
/epcc/epcc-code "create event sourcing handlers"
/epcc/epcc-code "migrate existing events to event store"

# Document architecture evolution
/epcc/epcc-commit "refactor: Migrate to event sourcing architecture"
```

## Best Practices for Refactoring with EPCC

### Maintain Test Coverage

```bash
# Before refactoring, ensure tests exist
/epcc/epcc-explore "test coverage for payment module" --focus testing

# During refactoring, add characterization tests
/epcc/epcc-code "add characterization tests for payment behaviors"

# Maintain green tests throughout
/epcc/epcc-code "refactor payment interface while keeping tests green"
```

### Use Branch-by-Abstraction

```bash
# Create abstraction layer
/epcc/epcc-code "create payment processor abstraction"

# Implement new solution behind abstraction
/epcc/epcc-code "implement new payment strategy behind interface"

# Gradually migrate callers
/epcc/epcc-code "migrate checkout flow to new payment interface"

# Remove old implementation
/epcc/epcc-code "remove legacy payment implementation"
```

### Measure Improvement

Track refactoring benefits:

```bash
# Document before metrics in exploration
- Cyclomatic complexity: 15
- Test coverage: 65%
- Lines of code: 2,500
- Deployment time: 10 minutes

# Document after metrics in commit
- Cyclomatic complexity: 8
- Test coverage: 95%
- Lines of code: 1,800
- Deployment time: 3 minutes
```

## Troubleshooting Refactoring Issues

### When Refactoring Scope Expands

```bash
# Break large refactoring into phases
/epcc/epcc-plan "refactor phase 1: extract interfaces"
# Complete first phase, then:
/epcc/epcc-plan "refactor phase 2: implement new strategies"
```

### When Tests Break During Refactoring

- Stop refactoring immediately
- Fix tests before continuing
- Consider if refactoring step was too large
- Use smaller, more incremental changes

### When Performance Regresses

- Measure performance at each step
- Use feature flags to enable/disable new implementation
- Keep old implementation until performance is verified
- Add performance tests to prevent future regressions

## Integration with Code Quality Tools

### Automated Quality Checks

```bash
# Include quality metrics in exploration
/epcc/epcc-explore "code quality metrics for user service"

# Set quality targets in planning
/epcc/epcc-plan "reduce cyclomatic complexity below 10"

# Validate improvements in coding
/epcc/epcc-code "validate quality improvements with automated tools"

# Document quality gains in commit
/epcc/epcc-commit "refactor: Improve code quality metrics (complexity: 15→8)"
```

### Continuous Refactoring

- Use EPCC for regular small refactorings
- Schedule exploration phases for technical debt assessment
- Plan refactoring work alongside feature development
- Document refactoring decisions for future reference