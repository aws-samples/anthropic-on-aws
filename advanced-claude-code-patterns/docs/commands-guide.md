# Slash Commands Guide

Complete guide to creating and using custom slash commands in Claude Code.

## Table of Contents
1. [Overview](#overview)
2. [Creating Commands](#creating-commands)
3. [Command Arguments](#command-arguments)
4. [Command Metadata](#command-metadata)
5. [Best Practices](#best-practices)
6. [Advanced Patterns](#advanced-patterns)
7. [Examples](#examples)

## Overview

Slash commands are custom shortcuts that extend Claude Code's capabilities. They allow you to:
- Create reusable templates for common tasks
- Standardize workflows across your team
- Automate complex multi-step processes
- Integrate with your project's specific needs

### Command Locations

Commands can be stored in three locations:
- **Repository templates**: `commands/` - Version-controlled templates to copy from
- **Global commands**: `~/.claude/commands/` - Available in all your projects
- **Project commands**: `.claude/commands/` - Specific to the current project

### Command Organization

Commands can be organized into subdirectories for better grouping:
- `commands/diataxis/` - Diataxis documentation workflow commands (5 commands)
- `commands/epcc/` - EPCC development workflow commands (4 commands)
- `commands/tdd/` - TDD workflow commands (2 commands)
- `commands/` - General commands (8 commands)

Total: **19 slash commands** available

When using subdirectories, the command path includes the directory:
- `/diataxis/diataxis-tutorial` - Creates learning-oriented documentation
- `/epcc/epcc-explore` - Runs the explore phase of EPCC
- `/tdd/tdd-feature` - Implements a feature using TDD

## Creating Commands

### Basic Structure

Create a markdown file in the commands directory:

```markdown
---
name: command-name
description: Brief description of what the command does
version: 1.0.0
argument-hint: [optional-arguments] [--flags]
---

# Command Title

Instructions for Claude on what to do when this command is invoked.
```

### Command File Naming

- Use kebab-case for file names: `my-command.md`
- File name should match the command name in metadata
- Keep names descriptive but concise

## Command Arguments

### Using Arguments in Templates

Commands can accept optional arguments using the `$ARGUMENTS` placeholder:

```markdown
---
name: fix-issue
description: Fix a GitHub issue
version: 1.0.0
argument-hint: <issue-number> [--priority]
---

# Fix Issue Command

## Issue to Fix
$ARGUMENTS

Parse the arguments to extract:
- Issue number (required)
- Priority flag (optional)

If no issue number provided, ask: "Which issue would you like to fix?"
```

### Argument Best Practices

1. **Always Handle Missing Arguments**
   ```markdown
   ## Target
   $ARGUMENTS
   
   If no arguments provided above, perform default action or ask for clarification.
   ```

2. **Provide Clear Parsing Instructions**
   ```markdown
   Parse arguments to determine:
   - Target: specific file or module (default: current context)
   - Mode: --deep or --quick (default: --deep)
   - Options: Additional flags or parameters
   ```

3. **Use argument-hint Metadata**
   ```yaml
   argument-hint: <required> [optional] [--flag]
   ```
   This provides auto-complete hints to users

### Argument Patterns

#### Single Argument
```markdown
argument-hint: <feature-description>

## Feature
$ARGUMENTS

If no feature specified, ask: "What feature would you like to implement?"
```

#### Multiple Arguments
```markdown
argument-hint: <file> [--mode] [--output]

## Parameters
$ARGUMENTS

Parse to extract:
1. File path (first argument)
2. Mode flag (--test, --prod)
3. Output format (--json, --yaml)
```

#### Flag-based Arguments
```markdown
argument-hint: [--quick|--deep] [--focus:<area>]

## Configuration
$ARGUMENTS

Check for flags:
- Depth: --quick (fast scan) or --deep (thorough)
- Focus area: --focus:security, --focus:performance
```

## Command Metadata

### Required Fields

```yaml
---
name: command-name        # The slash command name (required)
description: Short desc    # Brief description (required)
version: 1.0.0            # Semantic versioning (required)
---
```

### Optional Fields

```yaml
---
name: command-name
description: Brief description
version: 1.0.0
argument-hint: [args]     # Argument hints for auto-complete
author: Your Name         # Command author
tags: [testing, automation] # Categories for organization
---
```

### Deprecated Fields (Do Not Use)

```yaml
# These fields should NOT be used in command templates:
model: opus              # ❌ Don't specify model
tools: [Read, Write]     # ❌ Don't specify tools
```

## Best Practices

### 1. Clear Instructions

**✅ Good:**
```markdown
# API Test Generator

You are a test generation expert. Generate comprehensive API tests.

## Target API
$ARGUMENTS

If no API specified, analyze the current project for API endpoints.

Generate tests for:
1. Happy path scenarios
2. Error cases
3. Edge cases
4. Authentication scenarios
```

**❌ Bad:**
```markdown
# Test Command

Generate some tests.
```

### 2. Graceful Fallbacks

Always provide default behavior when no arguments are given:

```markdown
## Task
$ARGUMENTS

If no specific task provided above:
1. Analyze current context
2. Suggest relevant actions
3. Ask for user confirmation
```

### 3. Progressive Enhancement

Start with simple functionality, add complexity based on arguments:

```markdown
## Analysis Level
$ARGUMENTS

Parse for depth indicator:
- No args or --quick: Basic analysis (5 min)
- --standard: Standard analysis (15 min)
- --deep: Comprehensive analysis (30 min)
- --exhaustive: Complete analysis with all edge cases
```

### 4. Version Management

Track command evolution:

```markdown
---
name: security-scan
version: 2.1.0
# Changelog:
# 2.1.0: Added support for --focus flag
# 2.0.0: Rewrote to use parallel agents
# 1.0.0: Initial version
---
```

### 5. Composable Commands

Design commands that work well together:

```markdown
# After running this command, consider:
# - /test-feature to generate tests
# - /document-feature to create docs
# - /review-feature for code review
```

## Advanced Patterns

### 1. Conditional Logic

```markdown
## Processing Mode
$ARGUMENTS

If arguments contain "--production":
  Apply production-level checks
  Require approval steps
  Add comprehensive logging
Else:
  Use development mode
  Skip approval steps
  Use debug logging
```

### 2. Multi-Stage Commands

```markdown
## Workflow Stages
$ARGUMENTS

Stage 1: Exploration
- If args include file path, explore that file
- Otherwise, explore entire codebase

Stage 2: Planning
- Based on exploration, create action plan

Stage 3: Execution
- If --dry-run in args, show plan only
- Otherwise, execute the plan
```

### 3. Contextual Defaults

```markdown
## Target Selection
$ARGUMENTS

If no arguments provided:
  1. Check for open file in editor
  2. Check for recent git changes
  3. Analyze most recently modified files
  4. Fall back to project-wide analysis
```

### 4. Integration with External Tools

```markdown
## GitHub Integration
$ARGUMENTS

Parse for GitHub references:
- Issue numbers: #123
- PR references: PR#456
- Commit SHAs: abc123def

Fetch relevant data using gh CLI if available
```

### 5. Extended Thinking Integration

```markdown
## Complexity Assessment
$ARGUMENTS

Analyze arguments for complexity indicators:
- Simple task: Standard processing
- Complex task with --complex: Think before acting
- Critical task with --critical: Think hard about implications
- Architectural change: Ultrathink about long-term impact
```

## Workflow Commands

### Diataxis Documentation Workflow

The Diataxis workflow provides systematic documentation creation following the four-quadrant framework:

```bash
# Master orchestrator - analyzes and routes
/diataxis/diataxis-docs "authentication system" --full

# Individual documentation types
/diataxis/diataxis-tutorial "Getting started with React"    # Learning
/diataxis/diataxis-howto "Deploy to production"             # Tasks
/diataxis/diataxis-reference "REST API endpoints"           # Lookup
/diataxis/diataxis-explanation "Microservices architecture" # Understanding
```

**Key Features:**
- Automatic documentation type detection
- Parallel agent deployment for comprehensive coverage
- Cross-referencing between documentation types
- Output files organized in `docs/` subdirectories:
  - `docs/tutorials/[topic].md` for learning content
  - `docs/how-to/[task].md` for task guides
  - `docs/reference/[component].md` for technical specs
  - `docs/explanation/[concept].md` for conceptual content

### EPCC Development Workflow

Systematic development through four phases:

```bash
/epcc/epcc-explore "user authentication"  # Analyze codebase
/epcc/epcc-plan                           # Create implementation plan
/epcc/epcc-code                           # Execute implementation
/epcc/epcc-commit                         # Commit with message
```

**Output files:** `EPCC_EXPLORE.md`, `EPCC_PLAN.md`, `EPCC_CODE.md`

### TDD Workflow

Test-driven development automation:

```bash
/tdd/tdd-feature "shopping cart"  # Implement feature with TDD
/tdd/tdd-bugfix "payment issue"   # Fix bug with tests first
```

## Examples

### Example 1: Feature Development Command

```markdown
---
name: implement-feature
description: Implement a new feature with TDD
version: 1.0.0
argument-hint: <feature-description> [--skip-tests]
---

# Feature Implementation

## Feature Request
$ARGUMENTS

Parse arguments:
- Feature description (required)
- --skip-tests flag (optional, not recommended)

If no feature specified, ask: "What feature should I implement?"

## Implementation Process

1. **Understand Requirements**
   - Parse feature description
   - Identify acceptance criteria

2. **Test-First Development** (unless --skip-tests)
   - Write failing tests
   - Implement minimal code
   - Refactor

3. **Documentation**
   - Update relevant docs
   - Add usage examples
```

### Example 2: Multi-Mode Analysis Command

```markdown
---
name: analyze
description: Comprehensive codebase analysis
version: 2.0.0
argument-hint: [target] [--security|--performance|--quality|--all]
---

# Analysis Command

## Analysis Parameters
$ARGUMENTS

Parse arguments to determine:
- Target: file, directory, or entire project
- Focus: --security, --performance, --quality, or --all (default)

If no target specified, analyze entire codebase.

## Analysis Modes

Based on flags in arguments:

### --security
- Check for vulnerabilities
- Scan for secrets
- Review authentication

### --performance  
- Identify bottlenecks
- Check for N+1 queries
- Analyze algorithm complexity

### --quality
- Code style violations
- Test coverage gaps
- Documentation issues

### Default (--all or no flag)
Execute all analysis modes
```

### Example 3: Contextual Helper Command

```markdown
---
name: help-me
description: Intelligent contextual assistance
version: 1.0.0
argument-hint: [specific-question]
---

# Contextual Helper

## User Query
$ARGUMENTS

If specific question provided:
  Answer the specific question
Else:
  Analyze current context:
  - Check for error messages
  - Review recent commands
  - Examine current files
  - Suggest relevant actions based on context
```

## Testing Commands

### Local Testing

```bash
# Test a command with arguments
/my-command test arguments here

# Test without arguments
/my-command

# Test with flags
/my-command --deep --focus:security
```

### Unit Testing Commands

```python
# tests/test_commands.py
def test_command_handles_no_arguments():
    """Command should provide defaults when no args given."""
    response = run_command("my-command", args="")
    assert "default behavior" in response
    
def test_command_parses_arguments():
    """Command should correctly parse arguments."""
    response = run_command("my-command", args="file.py --deep")
    assert "file.py" in response
    assert "deep analysis" in response
```

## Troubleshooting

### Common Issues

1. **Arguments Not Being Passed**
   - Ensure you're using `$ARGUMENTS` (not `{{ARGS}}` or other syntax)
   - Check that argument-hint is properly formatted

2. **Command Not Found**
   - Verify file is in `~/.claude/commands/` (global) or `.claude/commands/` (project)
   - Check that file has `.md` extension
   - Ensure metadata includes `name` field

3. **Arguments Not Parsing Correctly**
   - Provide clear parsing instructions in template
   - Test with various argument formats
   - Include examples in the template

## Best Practices Summary

1. ✅ **Always handle missing arguments gracefully**
2. ✅ **Provide clear argument-hint metadata**
3. ✅ **Include parsing instructions in template**
4. ✅ **Document expected argument format**
5. ✅ **Test with and without arguments**
6. ✅ **Version your commands**
7. ✅ **Keep commands focused and composable**
8. ❌ **Don't specify model or tools in metadata**
9. ❌ **Don't assume arguments will always be provided**
10. ❌ **Don't create overly complex argument parsing**

## Next Steps

- Review [command templates](../commands/) in the repository
- Read [Best Practices Guide](./best-practices.md) for general guidelines
- Explore [Workflow Guide](./workflows-guide.md) for multi-command orchestration