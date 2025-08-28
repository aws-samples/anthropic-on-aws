# EPCC Commands Reference

Complete reference for all Explore-Plan-Code-Commit workflow commands.

## Command Overview

| Command | Purpose | Output File | Model |
|---------|---------|-------------|-------|
| `/epcc/epcc-explore` | Understand codebase and requirements | `EPCC_EXPLORE.md` | sonnet |
| `/epcc/epcc-plan` | Design approach and break down work | `EPCC_PLAN.md` | sonnet |
| `/epcc/epcc-code` | Implement solution with best practices | `EPCC_CODE.md` | sonnet |
| `/epcc/epcc-commit` | Review, test, and commit changes | `EPCC_COMMIT.md` | sonnet |

## /epcc/epcc-explore

**Purpose**: Analyze and understand the codebase, requirements, and constraints before beginning work.

### Syntax
```bash
/epcc/epcc-explore [target] [options]
```

### Parameters
- `target` (optional): Specific area to explore (e.g., "authentication system", "database layer")

### Options
- `--quick`: Perform rapid overview for small changes
- `--deep`: Conduct comprehensive analysis for complex features
- `--focus <area>`: Concentrate on specific aspect (authentication, database, performance, security, testing)

### Examples
```bash
# Basic exploration of entire codebase
/epcc/epcc-explore

# Focus on specific system
/epcc/epcc-explore "user authentication"

# Quick overview for small changes
/epcc/epcc-explore "login validation" --quick

# Deep analysis for complex features
/epcc/epcc-explore "payment processing" --deep

# Focus on specific aspect
/epcc/epcc-explore "API endpoints" --focus performance
```

### Output: EPCC_EXPLORE.md

**Standard sections:**
- **Executive Summary**: High-level findings and recommendations
- **Project Structure**: Directory layout and key files
- **Patterns Identified**: Code patterns, conventions, and architectural choices
- **Dependencies**: External libraries and internal dependencies
- **Constraints**: Technical, business, and regulatory limitations
- **Security Considerations**: Current security measures and gaps
- **Performance Analysis**: Current performance characteristics
- **Testing Approach**: Existing test coverage and patterns
- **Recommendations**: Suggested improvements and next steps

### Use Cases
- Beginning new feature development
- Investigating bugs or issues
- Planning refactoring efforts
- Onboarding to existing codebases
- Security audits
- Performance assessments

## /epcc/epcc-plan

**Purpose**: Create detailed implementation plan based on exploration findings.

### Syntax
```bash
/epcc/epcc-plan [description] [options]
```

### Parameters
- `description` (required): Brief description of what you're planning to implement

### Options
- `--quick`: Create simplified plan for minor changes
- `--detailed`: Generate comprehensive plan with full analysis
- `--with-risks`: Include detailed risk assessment and mitigation strategies

### Examples
```bash
# Basic planning
/epcc/epcc-plan "implement user registration feature"

# Quick planning for small changes
/epcc/epcc-plan "fix validation bug" --quick

# Detailed planning with risk analysis
/epcc/epcc-plan "migrate to microservices architecture" --detailed --with-risks

# Planning for security features
/epcc/epcc-plan "implement OAuth 2.0 authentication" --with-risks
```

### Output: EPCC_PLAN.md

**Standard sections:**
- **Implementation Objectives**: Clear goals and success criteria
- **Technical Approach**: High-level design and architecture
- **Task Breakdown**: Detailed tasks with time estimates
- **Dependencies**: Required external and internal dependencies
- **Risk Assessment**: Potential risks and mitigation strategies
- **Testing Strategy**: Unit, integration, and manual testing approach
- **Timeline**: Estimated completion schedule
- **Success Criteria**: Measurable outcomes for completion

### Use Cases
- Feature development planning
- Bug fix strategy
- Refactoring roadmaps
- Architecture changes
- Performance optimization plans
- Security improvements

## /epcc/epcc-code

**Purpose**: Implement the planned solution with disciplined development practices.

### Syntax
```bash
/epcc/epcc-code [task] [options]
```

### Parameters
- `task` (optional): Specific task to implement from the plan

### Options
- `--tdd`: Use Test-Driven Development approach
- `--continue`: Continue with next task from current plan

### Examples
```bash
# Continue with current plan
/epcc/epcc-code

# Implement specific task
/epcc/epcc-code "implement JWT token generation"

# Use test-driven development
/epcc/epcc-code --tdd "add user validation logic"

# Continue from previous work
/epcc/epcc-code --continue
```

### Output: EPCC_CODE.md

**Standard sections:**
- **Implementation Progress**: Completed and remaining tasks
- **Code Metrics**: Lines of code, test coverage, complexity metrics
- **Test Results**: Unit test results and coverage reports
- **Key Implementation Decisions**: Important technical choices made
- **Challenges and Resolutions**: Problems encountered and solutions
- **Quality Checks**: Linting, type checking, security scan results
- **Performance Metrics**: Performance measurements where applicable
- **Documentation Updates**: Changes made to documentation

### Use Cases
- Feature implementation
- Bug fixing
- Code refactoring
- Performance optimization
- Security improvements
- Test coverage improvement

## /epcc/epcc-commit

**Purpose**: Finalize changes with proper testing, documentation, and version control.

### Syntax
```bash
/epcc/epcc-commit [message] [options]
```

### Parameters
- `message` (required): Commit message following conventional commit format

### Options
- `--squash`: Combine multiple commits into one
- `--amend`: Modify the last commit
- `--pr`: Create pull request after commit

### Examples
```bash
# Standard commit
/epcc/epcc-commit "feat: Add JWT authentication system"

# Squash multiple commits
/epcc/epcc-commit "feat: Complete user management refactor" --squash

# Amend last commit
/epcc/epcc-commit "fix: Correct user validation logic" --amend

# Create pull request
/epcc/epcc-commit "feat: Add product recommendation engine" --pr
```

### Output: EPCC_COMMIT.md

**Standard sections:**
- **Change Summary**: What was changed and why
- **Files Modified**: List of files added, modified, or deleted
- **Testing Summary**: Test results and coverage reports
- **Security Validation**: Security scan results and considerations
- **Performance Impact**: Performance measurements and implications
- **Breaking Changes**: Any breaking changes and migration notes
- **Commit Message**: Properly formatted conventional commit message
- **Pull Request Description**: Complete PR description template

### Use Cases
- Feature completion
- Bug fix finalization
- Refactoring completion
- Security patch deployment
- Performance improvement documentation

## Command Chaining

### Sequential Workflow
```bash
# Complete EPCC cycle
/epcc/epcc-explore "user authentication"
/epcc/epcc-plan "implement JWT authentication"
/epcc/epcc-code --tdd "implement JWT service"
/epcc/epcc-commit "feat: Add JWT authentication"
```

### Iterative Development
```bash
# Multiple coding iterations
/epcc/epcc-explore "shopping cart"
/epcc/epcc-plan "implement shopping cart with persistence"
/epcc/epcc-code --tdd "implement cart model"
/epcc/epcc-code --tdd "implement cart persistence"
/epcc/epcc-code --tdd "implement cart API"
/epcc/epcc-commit "feat: Add persistent shopping cart"
```

## Error Handling

### Missing Prerequisites
- If exploration not completed: Command suggests running exploration first
- If plan not available: Command suggests creating a plan
- If tests failing: Command requires fixing tests before proceeding

### Invalid Options
- Unknown options display help message
- Incompatible option combinations show error with suggestions
- Missing required parameters prompt for input

## Integration with Other Tools

### Git Integration
- Commands automatically check git status
- Commit command validates staged changes
- Pull request creation uses GitHub CLI

### Testing Integration
- Code command runs tests automatically
- Commit command validates test coverage
- Quality gates prevent progression with failing tests

### Documentation Integration
- All commands update relevant documentation
- API documentation generated from code changes
- README and changelog updated automatically

## Best Practices

### Command Usage
- Always start with exploration for new work
- Use appropriate depth flags (`--quick`, `--deep`)
- Include risk assessment for complex changes
- Use TDD flag for new feature development

### Output File Management
- Review each phase output before proceeding
- Store EPCC files in project documentation
- Use output files for code reviews
- Archive completed EPCC cycles for reference

### Team Collaboration
- Share exploration findings before planning
- Review plans before implementation
- Use commit documentation for pull requests
- Reference EPCC files in team discussions

## See Also

- [Command Index](commands/index.md)
- [Command Syntax Reference](commands/syntax.md)
- [Workflow Configuration](workflow-configuration.md)
- [EPCC Philosophy](../explanation/epcc-philosophy.md)