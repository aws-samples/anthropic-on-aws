# CLAUDE.md Specification

Complete specification for CLAUDE.md project configuration files.

## Purpose

CLAUDE.md files provide context and guidance to Claude Code when working in a project. They are automatically read and used to understand:

- Project structure and conventions
- Development workflows and tools
- Code style preferences
- Quality standards and testing requirements

## File Locations

### Global Template
```
~/.claude/CLAUDE.md
```
- Default template for new projects
- User preferences and standards
- Applied to all projects

### Project Configuration
```
./CLAUDE.md
```
- Project-specific guidance
- Team standards and conventions
- Version controlled with project

### Private Configuration
```
~/.claude/CLAUDE.md (user's private global instructions)
```
- Personal development preferences
- Never shared or committed
- Overrides project settings

## File Structure

### Basic Template
```markdown
# CLAUDE.md

This file provides guidance to Claude Code when working with this project.

## Project Overview
Brief description of what this project does.

## Development Environment
Tools, languages, and frameworks used.

## Code Standards
Style guides, formatting rules, and conventions.

## Testing Requirements
Testing frameworks, coverage requirements, quality gates.

## Project Structure
Directory layout and file organization.
```

### Complete Specification

```markdown
# CLAUDE.md - [Project Name]

This file provides guidance to Claude Code when working with this project.

## Project Overview
- **Purpose**: What this project does
- **Language**: Primary programming language  
- **Framework**: Main framework or technology stack
- **Architecture**: High-level architecture description

## Development Environment

### Required Tools
- List of required development tools
- Installation instructions or links
- Version requirements

### Setup Instructions
- Environment setup steps
- Configuration requirements
- Initial project setup

### Dependencies
- Key dependencies and their purpose
- Package management approach
- Update and maintenance policies

## Code Standards

### Style Guidelines
- Code formatting standards
- Naming conventions
- File organization rules

### Quality Requirements
- Code review process
- Testing requirements
- Documentation standards

### Performance Standards
- Performance requirements
- Optimization guidelines
- Monitoring and metrics

## Testing Strategy

### Testing Framework
- Primary testing framework
- Test structure and organization
- Test data management

### Coverage Requirements
- Minimum coverage percentages
- Coverage exceptions
- Quality gates

### Testing Types
- Unit testing approach
- Integration testing requirements
- End-to-end testing strategy

## Project Structure

### Directory Layout
- Directory purpose and organization
- File naming conventions
- Module structure

### Key Files
- Important configuration files
- Entry points and main modules
- Documentation locations

## Workflows

### Development Process
- Feature development workflow
- Code review process
- Release procedures

### Automation
- CI/CD pipeline description
- Automated quality checks
- Deployment process

## Security Considerations

### Security Standards
- Security requirements
- Vulnerability management
- Access control policies

### Data Protection
- Data handling requirements
- Privacy considerations
- Compliance requirements

## Documentation Standards

### Code Documentation
- Inline documentation requirements
- API documentation approach
- Code comment standards

### Project Documentation
- Documentation structure
- Update requirements
- Review process

## Environment Variables

### Required Variables
- List of required environment variables
- Purpose and default values
- Security considerations

### Configuration
- Configuration file locations
- Environment-specific settings
- Secret management approach

## Troubleshooting

### Common Issues
- Known issues and solutions
- Debug procedures
- Support resources

### Development Issues
- Common development problems
- Resolution strategies
- When to seek help

## Team Guidelines

### Communication
- Communication channels
- Review processes
- Decision-making procedures

### Collaboration
- Code sharing guidelines
- Conflict resolution
- Knowledge sharing

## Notes for Claude

When working with this project, please:
- Follow established patterns
- Maintain consistency with existing code
- Consider performance implications
- Document significant changes
- Ask for clarification when uncertain
```

## Frontmatter Configuration

### YAML Frontmatter
```yaml
---
name: "project-name"
description: "Project description"
language: "python"
framework: "fastapi"
version: "1.0.0"
team_size: 5
complexity: "medium"
status: "active"
---
```

### Supported Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Project identifier |
| `description` | string | Project description |
| `language` | string | Primary programming language |
| `framework` | string | Main framework |
| `version` | string | Project version |
| `team_size` | number | Development team size |
| `complexity` | string | Project complexity (low, medium, high) |
| `status` | string | Project status (active, maintenance, archived) |

## Content Guidelines

### Project Overview Section
- Keep description concise but comprehensive
- Include key technologies and architectural decisions
- Mention any unique aspects or constraints
- Explain the problem the project solves

### Development Environment Section
- List all required tools with versions
- Include installation links or commands
- Explain any special setup requirements
- Document environment configuration

### Code Standards Section
- Reference external style guides when applicable
- Include project-specific conventions
- Explain the reasoning behind standards
- Provide examples of preferred patterns

### Testing Section
- Specify minimum coverage requirements
- Explain testing philosophy and approach
- Document test data and fixture management
- Include quality gate requirements

### Project Structure Section
- Explain directory organization
- Document module boundaries
- Clarify naming conventions
- Identify key configuration files

## Claude-Specific Instructions

### Effective Instructions
```markdown
## Notes for Claude

When working with this project, please:
- Use Python 3.11+ features where appropriate
- Follow PEP 8 with Black formatting (88 character lines)
- Write comprehensive docstrings with examples
- Include type hints for all function parameters
- Test all new code with pytest
- Update documentation for API changes
```

### Context Optimization
```markdown
## Claude Context

### Priority Information
Most important information for Claude to know:
1. This is a FastAPI project with async/await patterns
2. Use SQLAlchemy 2.0 syntax for database operations
3. All endpoints require authentication via JWT tokens
4. Prefer composition over inheritance in service classes

### Common Patterns
- Services in `app/services/` directory
- Models in `app/models/` with Pydantic schemas
- Database queries in repository pattern
- Error handling with custom exceptions
```

### Tool Preferences
```markdown
## Tool Preferences

Claude should prefer:
- `Read` for understanding existing code
- `Edit` for targeted changes to existing files
- `Write` only for new files
- `Grep` for finding patterns across the codebase
- Avoid `WebSearch` unless specifically needed for documentation
```

## Template Examples

### Python Web Application
```markdown
# CLAUDE.md - Python Web Application

## Project Overview
- **Purpose**: REST API for user management
- **Language**: Python 3.11
- **Framework**: FastAPI with SQLAlchemy
- **Architecture**: Layered architecture with repository pattern

## Development Environment
- Python 3.11+ with uv for package management
- PostgreSQL 15+ for database
- Redis for caching and sessions
- Docker for local development

## Code Standards
- Follow PEP 8 with Black formatting (88 characters)
- Use type hints for all functions
- Write docstrings in Google format
- Prefer async/await for I/O operations

## Testing Strategy
- pytest for unit and integration tests
- Minimum 90% test coverage
- Use factories for test data
- Mock external services in tests

## Notes for Claude
When working with this project:
- Use SQLAlchemy 2.0 syntax
- Follow the repository pattern for data access
- Validate all inputs with Pydantic models
- Handle errors with custom exception classes
```

### React Frontend
```markdown
# CLAUDE.md - React Frontend

## Project Overview
- **Purpose**: User interface for web application
- **Language**: TypeScript
- **Framework**: React 18 with Next.js
- **Architecture**: Component-based with custom hooks

## Development Environment
- Node.js 18+ with npm for package management
- TypeScript for type safety
- Tailwind CSS for styling
- Jest and React Testing Library for testing

## Code Standards
- Use functional components with hooks
- Prefer custom hooks for business logic
- Follow Prettier formatting rules
- Use absolute imports with path mapping

## Testing Strategy
- Jest for unit tests
- React Testing Library for component tests
- Minimum 80% test coverage
- E2E tests with Playwright

## Notes for Claude
When working with this project:
- Use TypeScript strict mode
- Prefer composition over inheritance
- Follow React best practices for performance
- Use semantic HTML elements
```

## Best Practices

### Writing Effective CLAUDE.md Files

1. **Be Specific**: Provide concrete examples and patterns
2. **Stay Current**: Update as project evolves
3. **Include Context**: Explain why certain decisions were made
4. **Be Concise**: Focus on what Claude needs to know
5. **Use Examples**: Show preferred patterns and approaches

### Common Mistakes

1. **Too Generic**: Avoid boilerplate that doesn't help Claude
2. **Too Verbose**: Don't include unnecessary details
3. **Outdated Information**: Keep content current with project
4. **Missing Context**: Explain project-specific conventions
5. **No Prioritization**: Highlight most important information

### Maintenance

- Review and update quarterly
- Update after major architectural changes
- Validate examples and code snippets
- Get team input on effectiveness
- Version control with project code

## Integration with Claude Code

### Automatic Loading
- Claude Code automatically reads CLAUDE.md on project initialization
- Content is used to contextualize all interactions
- Updates are detected and reloaded automatically

### Context Management
- CLAUDE.md content counts toward context limits
- Prioritize most important information
- Use hierarchical structure for scanability
- Consider token usage when writing

### Agent Integration
- Agents can reference CLAUDE.md content
- Project-specific agents can extend CLAUDE.md guidance
- Team agents can enforce CLAUDE.md standards

## See Also

- [Configuration Schema](schema.md)
- [Settings.json Reference](settings.md)
- [Agent Configuration](../agents/configuration.md)
- [Project Templates](../../templates/)