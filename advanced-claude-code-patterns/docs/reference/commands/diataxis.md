# Diataxis Commands Reference

Complete technical reference for the Diataxis documentation workflow commands.

## Command Overview

The Diataxis workflow provides 5 specialized commands for creating comprehensive documentation following the Diataxis framework.

| Command | Purpose | Model | Output File |
|---------|---------|-------|-------------|
| `/diataxis-docs` | Master orchestrator | N/A | Varies by type |
| `/diataxis-tutorial` | Learning documentation | Uses agents | `docs/tutorials/[topic].md` |
| `/diataxis-howto` | Task documentation | Uses agents | `docs/how-to/[task].md` |
| `/diataxis-reference` | Technical specs | Uses agents | `docs/reference/[component].md` |
| `/diataxis-explanation` | Conceptual docs | Uses agents | `docs/explanation/[concept].md` |

## Command Specifications

### `/diataxis-docs`

**Purpose**: Master orchestrator that analyzes documentation needs and coordinates creation.

**Syntax**:
```bash
/diataxis-docs [topic] [--full|--learning|--working|--understanding]
```

**Arguments**:
- `topic` (required): The subject to document
- `--full`: Create all four documentation types
- `--learning`: Create tutorial and explanation
- `--working`: Create how-to and reference
- `--understanding`: Create explanation and reference

**Deployed Agents**: Varies based on selected documentation types

**Examples**:
```bash
/diataxis-docs "authentication system" --full
/diataxis-docs "React hooks" --learning
/diataxis-docs "database migrations" --working
```

### `/diataxis-tutorial`

**Purpose**: Creates learning-oriented documentation for beginners.

**Syntax**:
```bash
/diataxis-tutorial [topic] [--beginner|--intermediate|--advanced]
```

**Arguments**:
- `topic` (required): The concept or skill to teach
- `--beginner`: For complete newcomers (default)
- `--intermediate`: For users with basic knowledge
- `--advanced`: For experienced users learning new concepts

**Deployed Agents**:
- `@docs-tutorial-agent`: Primary tutorial creator
- `@test-generator`: Validates code examples
- `@ux-optimizer`: Optimizes learning experience
- `@documentation-agent`: Supporting documentation

**Output Structure**:
```markdown
# Tutorial: [Topic Name]
## What You'll Learn
## Prerequisites
## Part 1: Getting Started
## Part 2: Core Concepts
## Part 3: Building Your [Project]
## Part 4: Celebrating Success
## Troubleshooting
## Complete Code
```

### `/diataxis-howto`

**Purpose**: Creates task-oriented guides for solving specific problems.

**Syntax**:
```bash
/diataxis-howto [problem] [--quick|--comprehensive|--troubleshooting]
```

**Arguments**:
- `problem` (required): The specific task or problem to solve
- `--quick`: Minimal steps, fastest solution
- `--comprehensive`: All options and variations
- `--troubleshooting`: Focus on problem resolution

**Deployed Agents**:
- `@docs-howto-agent`: Primary how-to creator
- `@code-archaeologist`: Analyzes existing patterns
- `@system-designer`: Designs optimal approach
- `@optimization-engineer`: Ensures efficient solutions

**Output Structure**:
```markdown
# How to [Achieve Goal]
## Goal
## Prerequisites
## Steps
## Alternative Approaches
## Common Issues
## Related Tasks
## Summary
```

### `/diataxis-reference`

**Purpose**: Creates comprehensive technical specifications and API documentation.

**Syntax**:
```bash
/diataxis-reference [system] [--api|--config|--cli|--complete]
```

**Arguments**:
- `system` (required): The system or API to document
- `--api`: Focus on API endpoints
- `--config`: Focus on configuration options
- `--cli`: Focus on command-line interface
- `--complete`: Comprehensive documentation

**Deployed Agents**:
- `@docs-reference-agent`: Primary reference creator
- `@documentation-agent`: API documentation generation
- `@code-archaeologist`: Extracts undocumented features
- `@test-generator`: Validates examples

**Output Structure**:
```markdown
# [System Name] Reference
## Overview
## Quick Reference
## Complete Reference
### Module: [Name]
### Configuration Reference
### Error Reference
### Type Definitions
## Appendices
## Index
```

### `/diataxis-explanation`

**Purpose**: Creates conceptual documentation for understanding design and architecture.

**Syntax**:
```bash
/diataxis-explanation [concept] [--architecture|--design|--theory|--comparison]
```

**Arguments**:
- `concept` (required): The concept or design to explain
- `--architecture`: Focus on system architecture
- `--design`: Focus on design decisions
- `--theory`: Focus on theoretical background
- `--comparison`: Compare different approaches

**Deployed Agents**:
- `@docs-explanation-agent`: Primary explanation creator
- `@architecture-documenter`: Documents design decisions
- `@system-designer`: Explains system patterns
- `@business-analyst`: Provides business context

**Output Structure**:
```markdown
# Understanding [Topic]
## Introduction
## The Big Picture
## Core Concepts
## Design Philosophy
## Alternatives and Comparisons
## Practical Implications
## Common Misconceptions
## Future Directions
## Summary
## Further Reading
```

## Configuration

### Project Settings

Configure Diataxis workflow in `.claude/settings.json`:

```json
{
  "workflows": {
    "diataxis": {
      "enabled": true,
      "outputDir": "./docs",
      "defaultMode": "full",
      "autoIndex": true,
      "templates": {
        "tutorial": "./templates/tutorial.md",
        "howto": "./templates/howto.md",
        "reference": "./templates/reference.md",
        "explanation": "./templates/explanation.md"
      }
    }
  }
}
```

### Global Settings

Configure defaults in `~/.claude/settings.json`:

```json
{
  "diataxis": {
    "preferredStyle": "comprehensive",
    "includeExamples": true,
    "generateDiagrams": true,
    "crossReference": true
  }
}
```

## Integration with Other Workflows

### With EPCC Workflow

```bash
# First explore and code
/epcc-explore "new feature"
/epcc-plan
/epcc-code

# Then document
/diataxis-docs "new feature" --full
```

### With TDD Workflow

```bash
# First implement with TDD
/tdd-feature "payment processing"

# Then create documentation
/diataxis-tutorial "payment processing"
/diataxis-reference "payment API"
```

## Best Practices

### Choosing Documentation Types

| User Need | Command to Use | Output |
|-----------|---------------|--------|
| Learning new system | `/diataxis-tutorial` | Step-by-step guide |
| Solving specific problem | `/diataxis-howto` | Task solution |
| Looking up details | `/diataxis-reference` | Technical specs |
| Understanding design | `/diataxis-explanation` | Conceptual overview |
| Complete documentation | `/diataxis-docs --full` | All types |

### Documentation Quality

1. **Always test examples**: All code in tutorials and how-tos must work
2. **Keep types pure**: Don't mix tutorial content in reference docs
3. **Cross-reference**: Link between different documentation types
4. **Version control**: Track documentation with code changes
5. **User feedback**: Update based on questions and confusion

## Error Handling

### Common Issues

| Error | Cause | Solution |
|-------|-------|----------|
| "Topic too broad" | Vague topic description | Be more specific |
| "No agents available" | Agents not installed | Copy agents to `.claude/agents/` |
| "Output file exists" | Previous documentation exists | Use `--force` or rename |
| "Timeout exceeded" | Complex documentation | Use individual commands |

## Performance

### Typical Execution Times

| Command | Simple Topic | Complex Topic |
|---------|-------------|---------------|
| `/diataxis-tutorial` | 30-60 seconds | 2-3 minutes |
| `/diataxis-howto` | 20-40 seconds | 1-2 minutes |
| `/diataxis-reference` | 40-80 seconds | 3-5 minutes |
| `/diataxis-explanation` | 30-60 seconds | 2-3 minutes |
| `/diataxis-docs --full` | 2-4 minutes | 8-12 minutes |

### Optimization Tips

1. Use specific commands instead of `--full` when possible
2. Provide clear, focused topics
3. Use flags to narrow scope
4. Run commands in parallel for different topics
5. Cache common documentation patterns

## See Also

- [Diataxis Workflow Guide](../../diataxis-workflow-guide.md)
- [Documentation Agents](../../agents-guide.md#documentation--ux)
- [EPCC Commands](./epcc-commands.md)
- [Command Creation Guide](../../commands-guide.md)