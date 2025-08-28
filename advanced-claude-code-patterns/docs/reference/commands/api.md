# Custom Command API Reference

Complete API reference for creating custom Claude Code commands.

## Command Architecture

### Command Types

#### Project Commands
- Located in `.claude/commands/`
- Available only within specific project
- Shared with team via version control
- Project-specific functionality

#### User Commands
- Located in `~/.claude/commands/`
- Available across all projects
- Personal development workflows
- Private customizations

#### System Commands
- Built into Claude Code
- Cannot be overridden
- Standard functionality
- Documented in [Built-in Commands](built-in.md)

## Command File Format

### Basic Structure
```markdown
# Command Title

Brief description of what this command does.

## Usage
```
/category/command-name [arguments] [options]
```

## Arguments
- `argument1`: Description of first argument
- `argument2`: Description of second argument

## Options
- `--option1`: Description of option
- `--option2`: Description of another option

## Examples
```
/category/command-name "example argument"
/category/command-name --option1 value
```

## Implementation

[Command implementation using Claude Code patterns]
```

### Frontmatter Configuration
```yaml
---
name: command-name
category: project
description: Brief command description
version: 1.0.0
author: Your Name
requires:
  - tools: [Read, Write, Edit]
  - permissions: [file_read, file_write]
  - agents: [optional-agent-name]
arguments:
  - name: description
    type: string
    required: true
    description: What to implement
  - name: target
    type: string
    required: false
    description: Target file or directory
options:
  - name: force
    type: boolean
    default: false
    description: Force operation
  - name: verbose
    type: boolean
    default: false
    description: Verbose output
---
```

## Implementation Patterns

### File Operations Command
```markdown
# file-backup

Create backup of project files.

## Usage
```
/project/file-backup [pattern] [--destination]
```

## Implementation

Use the Read tool to find files matching the pattern, then create backups using Write tool.

1. Find files matching pattern:
   - Use Glob tool to find files
   - Filter by modification date if needed
   - Exclude already backed up files

2. Create backup directory:
   - Use standard backup naming convention
   - Include timestamp in directory name
   - Ensure destination has sufficient space

3. Copy files:
   - Use Read tool to get file contents
   - Use Write tool to create backup copies
   - Preserve file metadata where possible
   - Report progress for large operations

4. Verify backup:
   - Compare file sizes
   - Validate critical files
   - Generate backup manifest
```

### Code Analysis Command
```markdown
# analyze-complexity

Analyze code complexity metrics.

## Usage
```
/project/analyze-complexity [directory] [--format] [--threshold]
```

## Implementation

Analyze code complexity using established metrics and report findings.

1. Discover source files:
   - Use Glob to find source files
   - Filter by language and relevance
   - Exclude test files if requested

2. Analyze each file:
   - Use Read tool to examine source code
   - Calculate cyclomatic complexity
   - Measure function length and nesting
   - Identify code smells

3. Generate report:
   - Summarize findings by file and function
   - Highlight areas exceeding thresholds
   - Suggest refactoring opportunities
   - Format output as requested

4. Recommend actions:
   - Prioritize issues by severity
   - Suggest specific improvements
   - Provide refactoring guidance
```

### Testing Command
```markdown
# generate-integration-tests

Generate integration tests for API endpoints.

## Usage
```
/project/generate-integration-tests [endpoint-pattern] [--framework]
```

## Implementation

Generate comprehensive integration tests for API endpoints.

1. Discover API endpoints:
   - Use Grep to find route definitions
   - Parse endpoint patterns and methods
   - Identify request/response schemas
   - Extract authentication requirements

2. Generate test cases:
   - Create positive test cases for each endpoint
   - Generate negative test cases for error scenarios
   - Include edge cases and boundary conditions
   - Test authentication and authorization

3. Create test files:
   - Use framework-specific patterns
   - Include setup and teardown code
   - Add helper functions for common operations
   - Generate test data fixtures

4. Validate tests:
   - Ensure tests are runnable
   - Check for required dependencies
   - Validate test data and assertions
   - Provide execution instructions
```

## Command Registration

### Automatic Discovery
Commands are automatically discovered when:
- Files are placed in correct directories
- Files follow naming conventions
- Markdown format is valid
- Frontmatter is properly configured

### Naming Conventions
```
project-commands/
├── deploy-staging.md       # /project/deploy-staging
├── test-feature.md         # /project/test-feature
├── backup/
│   └── create-backup.md    # /project/backup/create-backup
└── analysis/
    ├── code-metrics.md     # /project/analysis/code-metrics
    └── security-scan.md    # /project/analysis/security-scan

personal-commands/
├── setup-workspace.md     # /personal/setup-workspace
├── daily-standup.md       # /personal/daily-standup
└── utils/
    └── clean-downloads.md  # /personal/utils/clean-downloads
```

### Command Categories
Commands are organized by category based on directory structure:

| Category | Location | Purpose |
|----------|----------|---------|
| `project` | `.claude/commands/` | Project-specific workflows |
| `personal` | `~/.claude/commands/` | Personal development tools |
| `team` | `.claude/commands/team/` | Team collaboration tools |
| `admin` | `.claude/commands/admin/` | Administrative tasks |

## Argument and Option Handling

### Argument Types

#### String Arguments
```yaml
arguments:
  - name: description
    type: string
    required: true
    pattern: '^[a-zA-Z0-9\s\-_]+$'
    description: Feature description
```

#### File Path Arguments
```yaml
arguments:
  - name: target_file
    type: path
    required: true
    exists: true
    type: file
    description: File to process
```

#### Enum Arguments
```yaml
arguments:
  - name: environment
    type: enum
    values: [development, staging, production]
    default: development
    description: Deployment environment
```

### Option Types

#### Boolean Options
```yaml
options:
  - name: force
    type: boolean
    default: false
    description: Force operation without confirmation
```

#### Integer Options
```yaml
options:
  - name: timeout
    type: integer
    default: 30
    min: 1
    max: 300
    description: Timeout in seconds
```

#### Array Options
```yaml
options:
  - name: include
    type: array
    item_type: string
    description: Patterns to include
```

### Validation Rules

#### Built-in Validators
- `required`: Argument/option must be provided
- `pattern`: Must match regex pattern
- `min`/`max`: Numeric range validation
- `exists`: File/directory must exist
- `enum`: Must be one of specified values

#### Custom Validation
```markdown
## Validation

Before executing, validate:
- Target directory exists and is writable
- Required tools are available
- No conflicting operations in progress
- Sufficient disk space for operation
```

## Tool Integration

### Available Tools
Commands can use all Claude Code tools:

| Tool | Purpose | Example Usage |
|------|---------|---------------|
| `Read` | Read file contents | Analyze existing code |
| `Write` | Create/overwrite files | Generate new files |
| `Edit` | Modify existing files | Update configurations |
| `MultiEdit` | Multiple file edits | Refactor across files |
| `Grep` | Search text in files | Find patterns |
| `Glob` | Find files by pattern | Discover source files |
| `LS` | List directory contents | Explore structure |

### Tool Usage Patterns

#### Sequential Processing
```markdown
1. Use Glob to find all Python files
2. For each file:
   - Use Read to examine contents
   - Analyze code patterns
   - Use Edit to apply fixes
3. Use Write to create summary report
```

#### Conditional Tool Usage
```markdown
1. Use LS to check if directory exists
2. If not exists:
   - Create directory structure
   - Initialize with templates
3. If exists:
   - Use Grep to check for conflicts
   - Update existing files with Edit
```

### Error Handling
```markdown
## Error Handling

Handle common error scenarios:

1. File not found:
   - Check if file was moved or renamed
   - Suggest alternative locations
   - Offer to create if appropriate

2. Permission denied:
   - Check file permissions
   - Suggest running with appropriate permissions
   - Offer alternative approaches

3. Tool execution failed:
   - Retry with exponential backoff
   - Fallback to alternative tools
   - Provide detailed error context
```

## Agent Integration

### Agent Requirements
```yaml
requires:
  agents:
    - name: python-developer
      required: true
      reason: Needs Python expertise for code analysis
    - name: security-reviewer
      required: false
      reason: Optional security analysis
```

### Agent Invocation
```markdown
## Implementation

If python-developer agent is available:
1. Activate python-developer agent
2. Request code analysis with specific focus
3. Generate implementation plan
4. Execute plan with agent guidance

If no suitable agent available:
1. Use general code analysis patterns
2. Apply best practices from documentation
3. Generate basic implementation
4. Flag areas requiring expert review
```

### Agent Communication
```markdown
## Agent Workflow

1. Prepare context for agent:
   - Gather relevant files
   - Summarize requirements
   - Prepare specific questions

2. Invoke agent with clear instructions:
   - Specify expected deliverables
   - Set quality requirements
   - Provide decision criteria

3. Process agent response:
   - Validate recommendations
   - Apply suggested changes
   - Document decisions made
```

## Security Considerations

### Permission Requirements
```yaml
requires:
  permissions:
    - file_read: "Read project files for analysis"
    - file_write: "Create backup files"
    - network_access: "Download dependencies"
    - shell_execute: "Run build commands"
```

### Security Validation
```markdown
## Security Checks

Before execution:
1. Validate all file paths are within project boundaries
2. Check for malicious patterns in arguments
3. Ensure network requests go to approved domains
4. Validate shell commands for safety

During execution:
1. Monitor resource usage
2. Limit network access scope
3. Validate all tool outputs
4. Log security-relevant actions
```

### Safe Defaults
- Always prefer read-only operations when possible
- Require explicit confirmation for destructive actions
- Limit network access to known-safe domains
- Sanitize all user inputs
- Use principle of least privilege

## Testing Commands

### Command Testing Framework
```markdown
# test-deploy-command

Test the deployment command functionality.

## Test Cases

1. Valid deployment:
   - Provide valid environment
   - Verify successful deployment
   - Check deployment artifacts

2. Invalid environment:
   - Provide invalid environment name
   - Verify appropriate error message
   - Ensure no partial deployment

3. Missing permissions:
   - Remove deployment permissions
   - Verify permission error
   - Check graceful failure

## Implementation

Use test framework to validate command behavior:

1. Setup test environment
2. Mock external dependencies
3. Execute command with test inputs
4. Validate outputs and side effects
5. Cleanup test artifacts
```

### Manual Testing
```bash
# Test command with various inputs
/project/test-command "valid input"
/project/test-command "invalid input"
/project/test-command --option value

# Test error conditions
/project/test-command ""
/project/test-command --invalid-option
/project/test-command missing-required-arg
```

## Performance Optimization

### Caching Strategies
```markdown
## Performance

Optimize command execution:

1. Cache expensive operations:
   - File system scans
   - Code analysis results
   - Network requests

2. Use incremental processing:
   - Process only changed files
   - Store intermediate results
   - Resume from checkpoints

3. Parallel processing:
   - Process independent files in parallel
   - Use async operations for I/O
   - Batch similar operations
```

### Resource Management
```markdown
## Resource Limits

Manage resource usage:

1. Memory limits:
   - Process large files in chunks
   - Clean up temporary data
   - Monitor memory usage

2. Disk space:
   - Check available space before operations
   - Clean up temporary files
   - Compress large outputs

3. Network bandwidth:
   - Batch network requests
   - Use compression when possible
   - Implement retry with backoff
```

## Documentation Standards

### Command Documentation
Every command must include:
- Clear purpose statement
- Complete usage syntax
- Argument descriptions
- Option explanations
- Practical examples
- Error scenarios
- Performance considerations

### Code Comments
```markdown
## Implementation

<!-- Step 1: Validation -->
Validate input parameters and check prerequisites.

<!-- Step 2: Discovery -->
Use Glob tool to find all relevant files:
- Include source files only
- Exclude build artifacts
- Filter by modification date

<!-- Step 3: Processing -->
For each file discovered:
- Read contents with Read tool
- Apply analysis algorithms
- Collect metrics and issues

<!-- Step 4: Reporting -->
Generate comprehensive report:
- Summarize findings
- Provide recommendations
- Format for requested output type
```

## Command Lifecycle

### Registration Phase
1. Command files discovered on startup
2. Frontmatter parsed and validated
3. Dependencies checked
4. Command registered in system

### Execution Phase
1. User invokes command
2. Arguments and options parsed
3. Validation rules applied
4. Prerequisites checked
5. Command implementation executed
6. Results returned to user

### Error Recovery
1. Syntax errors caught during parsing
2. Validation errors reported with suggestions
3. Execution errors logged with context
4. Partial operations rolled back when possible
5. User provided with recovery options

## See Also

- [Command Index](index.md)
- [Syntax Reference](syntax.md)
- [Built-in Commands](built-in.md)
- [Agent API Reference](../agents/api.md)