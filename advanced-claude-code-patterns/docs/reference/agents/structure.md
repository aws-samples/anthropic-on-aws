# Agent Structure Reference

Technical specification for Claude Code agent file structure.

## File Format

Agents are Markdown files with YAML frontmatter.

```
---
[YAML frontmatter]
---

[Markdown content]
```

## Required Structure

### Frontmatter (Required)

```yaml
---
name: agent-name           # Required: kebab-case identifier
description: string        # Required: agent purpose (MUST BE USED... format)
model: sonnet|opus        # Required: model selection
tools: []                 # Required: array of tool names
version: v1.0.0           # Recommended: semantic version
author: string            # Recommended: agent creator
last_updated: YYYY-MM-DD  # Recommended: last modification date
color: string             # Optional: UI color (see color values)
---
```

**Field Details:**
- `name`: Lowercase, kebab-case identifier matching filename
- `description`: Should start with "MUST BE USED when..." for activation clarity
- `model`: Choose based on complexity (sonnet for routine, opus for complex)
- `tools`: Array of available tools (see tools.md for complete list)
- `version`: Semantic versioning (vMAJOR.MINOR.PATCH)
- `author`: Creator attribution (typically "Jawhny Cooke" or team name)
- `last_updated`: ISO date format (YYYY-MM-DD)
- `color`: UI theme color - valid values: blue, green, red, purple, orange, yellow, pink, cyan, brown

### Content Sections

#### Quick Reference (Required First Section)

```markdown
## Quick Reference
- Capability statement (3-5 bullets)
- Primary workflow description
- Key constraints or requirements
- Main value proposition
- Critical dependencies
```

**Requirements:**
- Must be first section after frontmatter
- 3-5 bullet points
- Each bullet < 80 characters
- Focus on capabilities, not features

#### Activation Instructions

```markdown
## Activation Instructions

- CRITICAL: [Most important rule in CAPS]
- WORKFLOW: [Step] → [Step] → [Step] → [Step]
- [Essential behavioral rule]
- [Essential behavioral rule]
- STAY IN CHARACTER as [Name], [role]
```

**Requirements:**
- First line must be CRITICAL rule
- Second line must be WORKFLOW
- Maximum 6 lines total
- Last line must be character statement

#### Core Identity

```markdown
## Core Identity

**Role**: [Title]
**Identity**: You are **[Name]**, who [description].

**Principles**:
- **[Principle]**: [Description]
- **[Principle]**: [Description]
```

**Requirements:**
- Role and Identity fields required
- Identity must include persona name in bold
- Principles are action-oriented
- No background stories

## Additional Sections (Optional but Common)

### Behavioral Contract

```markdown
## Behavioral Contract

### ALWAYS:
- [Specific rule the agent must always follow]
- [Another always rule]
- [Critical behavior to maintain]

### NEVER:
- [Specific thing the agent must never do]
- [Another never rule]
- [Behavior to avoid]
```

**Purpose:** Defines hard boundaries for agent behavior
**Position:** After Core Identity section
**Usage:** Critical for safety-sensitive or high-stakes agents

### Pipeline Integration

```markdown
## Pipeline Integration

### Input Requirements
- [What this agent needs to receive]
- [Expected format or structure]

### Output Contract
- [What this agent guarantees to produce]
- [Format and structure of outputs]

### Compatible Agents
- **Upstream**: [agents that feed into this]
- **Downstream**: [agents this feeds into]
```

**Purpose:** Documents how agent works in multi-agent workflows
**Position:** Near end of agent file
**Usage:** For agents designed to work in sequences

### Edge Cases & Failure Modes

```markdown
## Edge Cases & Failure Modes

### When [Common Edge Case]
- **Behavior**: [What agent does]
- **Output**: [What it returns]
- **Fallback**: [Alternative approach]
```

**Purpose:** Documents known limitations and recovery strategies
**Position:** After main content sections
**Usage:** Important for production agents

### Changelog

```markdown
## Changelog

- **v1.0.0** (YYYY-MM-DD): Initial release
- **v0.9.0** (YYYY-MM-DD): Beta testing
- **v0.8.0** (YYYY-MM-DD): Alpha version
```

**Purpose:** Track agent evolution and changes
**Position:** At end of file
**Usage:** For versioned production agents

## Section Types

### Domain Knowledge Sections

```markdown
## [Domain Area]

### [Subsection]
```[language]
# Code example
code
```

### [Pattern Name]
- Implementation detail
- Best practice
- Specific approach
```

### Output Format Section

```markdown
## Output Format

[Description]:
- **[Field]**: [Content description]
- **[Field]**: [Content description]

[Deliverable type]:
- [Item specification]
- [Item specification]
```

## Validation Rules

### Structure Validation

```python
def validate_structure(agent_content):
    """Validate agent structure requirements."""
    
    validations = {
        'has_frontmatter': '---' in agent_content[:10],
        'has_name': 'name:' in frontmatter,
        'has_description': 'description:' in frontmatter,
        'has_model': 'model:' in frontmatter,
        'has_tools': 'tools:' in frontmatter,
        'has_version': 'version:' in frontmatter,  # Recommended
        'has_author': 'author:' in frontmatter,    # Recommended
        'has_last_updated': 'last_updated:' in frontmatter,  # Recommended
        'has_quick_reference': '## Quick Reference' in content,
        'quick_ref_first': content.index('## Quick Reference') < 100,
        'has_activation': '## Activation Instructions' in content,
        'has_identity': '## Core Identity' in content,
        'has_behavioral': '## Behavioral Contract' in content  # Optional
    }
    
    return all(validations.values())
```

### Content Validation

| Element | Validation Rule |
|---------|----------------|
| `name` | Lowercase, kebab-case, alphanumeric + hyphens |
| `description` | 10-200 characters |
| `model` | Exactly "sonnet" or "opus" |
| `tools` | Valid tool names from tools reference |
| `color` | Valid color: blue, green, red, purple, orange, yellow, pink, cyan, brown |

### Line Count Guidelines

| Section | Recommended Lines |
|---------|------------------|
| Quick Reference | 5-7 |
| Activation Instructions | 5-6 |
| Core Identity | 8-12 |
| Domain Sections | As needed for clarity |
| Output Format | 8-15 |
| **Total Agent** | As concise as necessary |

## File Naming Convention

```
[category]-[purpose].md
```

Examples:
- `security-reviewer.md`
- `test-generator.md`
- `doc-writer.md`

## Example Minimal Agent

```markdown
---
name: minimal-example
description: MUST BE USED when demonstrating minimal agent structure
model: sonnet
tools: [Read, Write]
version: v1.0.0
author: Documentation Team
last_updated: 2025-08-21
color: blue
---

## Quick Reference
- Primary capability description
- Key workflow or process
- Main constraint or requirement

## Activation Instructions

- CRITICAL: Follow user instructions precisely
- WORKFLOW: Analyze → Plan → Execute → Verify
- Stay focused on the task
- STAY IN CHARACTER as Helper, assistant

## Core Identity

**Role**: Assistant
**Identity**: You are **Helper**, who assists with tasks.

**Principles**:
- **Clarity**: Communicate clearly
- **Efficiency**: Work efficiently
```

## Structure Errors

### Common Issues

| Error | Cause | Solution |
|-------|-------|----------|
| `Agent not found` | Missing frontmatter | Add valid YAML frontmatter |
| `Invalid structure` | Missing required sections | Add Quick Reference as first section |
| `Parsing error` | Malformed YAML | Validate YAML syntax |
| `Section order incorrect` | Quick Reference not first | Move Quick Reference after frontmatter |

### Debug Commands

```bash
# Validate structure
claude --validate-agent agent-file.md

# Check parsing
yamllint agent-file.md

# Test loading
claude --agent agent-name --dry-run
```

## See Also

- [Configuration Reference](configuration.md)
- [Tools Reference](tools.md)
- [Configuration Schema](../configuration/schema.md)
- [CLAUDE.md Specification](../configuration/claude-md.md)