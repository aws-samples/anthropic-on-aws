# How to Implement EPCC for New Features

Use the EPCC workflow to systematically develop new features with high quality and comprehensive documentation.

## Prerequisites
- Understanding of EPCC workflow phases
- Project with existing codebase
- Feature requirements defined

## Steps

### 1. Start with Deep Exploration

For new features, use deep exploration to understand the existing system:

```bash
/epcc/epcc-explore "user management system" --deep
```

**What to explore:**
- Existing similar features
- Database schema and models
- API patterns and conventions
- Authentication and authorization patterns
- Testing approaches
- Performance considerations

### 2. Create a Comprehensive Plan

Plan with detailed risk assessment for complex features:

```bash
/epcc/epcc-plan "implement user roles and permissions" --detailed --with-risks
```

**Include in your plan:**
- Clear feature objectives
- Technical architecture design
- Database schema changes
- API endpoint specifications
- Security considerations
- Performance requirements
- Migration strategy (if needed)

### 3. Use Test-Driven Implementation

Implement incrementally with TDD:

```bash
# Start with the first planned task
/epcc/epcc-code --tdd "implement role model and repository"

# Continue with subsequent tasks
/epcc/epcc-code --tdd "implement permission checking middleware"

# Complete each planned component
/epcc/epcc-code --tdd "implement role assignment API"
```

**Best practices:**
- Complete one task fully before moving to the next
- Write tests that cover both happy path and edge cases
- Keep the code quality high with each increment
- Update API documentation as you build

### 4. Finalize with Complete Documentation

Create comprehensive commit documentation:

```bash
/epcc/epcc-commit "feat: Add comprehensive user roles and permissions system"
```

**Ensure the commit includes:**
- Feature summary and business value
- Technical implementation details
- Migration instructions
- Testing coverage report
- Security validation results
- Documentation updates

## Example: E-commerce Product Recommendations

### Exploration Phase
```bash
/epcc/epcc-explore "product catalog and user behavior tracking" --deep
```

**Exploration findings might include:**
- Current product data structure
- User interaction tracking capabilities
- Existing recommendation logic
- Performance bottlenecks
- Data privacy considerations

### Planning Phase
```bash
/epcc/epcc-plan "implement ML-based product recommendations" --detailed --with-risks
```

**Plan might include:**
- Data collection strategy
- ML model selection and training approach
- API design for recommendation endpoints
- Caching strategy for performance
- A/B testing framework
- Privacy compliance measures

### Implementation Phase
```bash
# Implement data collection
/epcc/epcc-code --tdd "implement user behavior tracking"

# Build recommendation engine
/epcc/epcc-code --tdd "implement recommendation algorithm"

# Create API endpoints
/epcc/epcc-code --tdd "implement recommendation API endpoints"

# Add performance optimizations
/epcc/epcc-code --tdd "implement recommendation caching"
```

### Commit Phase
```bash
/epcc/epcc-commit "feat: Add ML-based product recommendation system"
```

## Troubleshooting

### If Exploration Takes Too Long
- Use `--quick` for smaller features
- Focus exploration with specific areas: `--focus database`
- Break large features into smaller, explorable components

### If Planning Becomes Overwhelming
- Split large features into multiple EPCC cycles
- Start with MVP planning, then extend
- Use `--quick` for simple additions to existing patterns

### If Implementation Stalls
- Review the plan and break tasks down further
- Focus on one component at a time
- Use extended thinking: "Think hard about the next implementation step"

### If Quality Gates Fail
- Fix issues immediately before proceeding
- Review the plan to ensure quality considerations
- Add additional testing or security measures

## Integration with Team Workflows

### Code Review Process
```bash
# After EPCC completion, share documentation
cat EPCC_EXPLORE.md > docs/features/user-roles-exploration.md
cat EPCC_PLAN.md > docs/features/user-roles-plan.md
cat EPCC_CODE.md > docs/features/user-roles-implementation.md
```

### Documentation Handoff
- Use EPCC files as basis for feature documentation
- Extract API documentation from implementation phase
- Create user guides from the exploration and planning phases

### Metrics and Improvement
- Track time spent in each EPCC phase
- Monitor defect rates by implementation approach
- Measure test coverage and quality metrics from CODE phase
- Use COMMIT phase documentation for post-mortem analysis