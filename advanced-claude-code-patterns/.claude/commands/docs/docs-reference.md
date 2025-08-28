---
name: docs-reference
description: Create comprehensive technical reference documentation with complete specifications
version: 1.0.0  
argument-hint: "[system/API to document] [--api|--config|--cli|--complete]"
---

# Diataxis Reference Command

You are in the **REFERENCE** phase of the Diataxis documentation workflow. Your mission is to create comprehensive, accurate, information-oriented documentation that serves as the authoritative source of technical truth.

⚠️ **IMPORTANT**: This command is for creating REFERENCE documentation ONLY. Focus exclusively on:
- Providing complete, accurate technical information
- Structuring for quick lookup and search
- Maintaining consistency and predictability
- Being the authoritative source of truth
- Documenting everything in `docs/reference/[topic-slug].md`

## System/API to Document
$ARGUMENTS

If no specific system was provided above, ask the user: "What system, API, or technical component needs reference documentation?"

## 📖 Reference Objectives

1. **Complete Coverage**: Document every feature, option, and parameter
2. **Consistent Structure**: Predictable organization across entries
3. **Accurate Information**: Technically precise and verified
4. **Quick Lookup**: Optimized for searching and scanning
5. **Authoritative Source**: The definitive technical truth

## Extended Thinking Strategy

- **Simple APIs**: Straightforward parameter documentation
- **Complex systems**: Think about hierarchical organization
- **Configuration**: Think hard about dependencies and interactions
- **Enterprise systems**: Ultrathink about completeness and accuracy

## Parallel Reference Subagents

Deploy concurrent documentation specialists:
@docs-reference-agent @documentation-agent @code-archaeologist @test-generator

All subagents work in parallel to create comprehensive reference:
- @docs-reference-agent: Create structured technical documentation
- @documentation-agent: Generate API documentation and schemas
- @code-archaeologist: Extract undocumented features and parameters
- @test-generator: Validate examples and usage patterns

## Reference Documentation Framework

### Step 1: Define Scope

```markdown
## Documentation Scope

### System Overview
- **Name**: [System/API name]
- **Version**: [Version number]
- **Type**: [API/CLI/Configuration/Library]
- **Purpose**: [One-line description]

### Coverage
- Components documented: [count]
- Parameters documented: [count]
- Examples provided: [count]
- Last updated: [date]
```

### Step 2: Structure Organization

```markdown
## Reference Structure

### Top-Level Organization
1. Overview
2. Core Concepts
3. [Component/Module A]
4. [Component/Module B]
5. Configuration
6. API Reference
7. Error Codes
8. Glossary
9. Index

### Entry Template
Each entry follows:
- Name and signature
- Description
- Parameters/Options
- Return values/Output
- Examples
- Related entries
```

### Step 3: API Documentation

```markdown
## API Reference

### Endpoints / Functions / Commands

#### `functionName(parameters)`

**Description**: Brief description of what it does

**Signature**:
```language
returnType functionName(
    param1: type,
    param2: type = defaultValue,
    *args,
    **kwargs
)
```

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| param1 | string | Yes | - | Description of param1 |
| param2 | number | No | 10 | Description of param2 |

**Returns**:

| Type | Description |
|------|-------------|
| object | Description of return value |

**Exceptions**:

| Exception | When Raised |
|-----------|-------------|
| ValueError | When input is invalid |
| KeyError | When key not found |

**Example**:
```language
# Basic usage
result = functionName("value", 20)

# With optional parameters
result = functionName(
    param1="value",
    param2=30,
    extra_option=True
)
```

**See Also**:
- [relatedFunction](#relatedfunction)
- [Configuration](#configuration)
```

### Step 4: Configuration Reference

```markdown
## Configuration Reference

### Configuration File Structure

```yaml
# config.yaml
system:
  setting1: value    # Required
  setting2: value    # Optional, default: X
  
  subsystem:
    option1: value   # Required
    option2: []      # Optional, default: empty
```

### Configuration Options

#### `system.setting1`
- **Type**: string
- **Required**: Yes
- **Default**: None
- **Description**: Controls primary system behavior
- **Valid Values**: 
  - `value1`: Description
  - `value2`: Description
- **Example**: `system.setting1: value1`

#### `system.subsystem.option1`
- **Type**: integer
- **Required**: Yes
- **Range**: 1-1000
- **Description**: Sets subsystem threshold
- **Related**: See `system.subsystem.option2`
```

### Step 5: CLI Reference

```markdown
## Command-Line Interface

### Global Options
```bash
command [global-options] <subcommand> [options] [arguments]
```

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| --verbose | -v | Increase output verbosity | False |
| --config FILE | -c | Specify configuration file | ./config.yaml |

### Commands

#### `command create`

Create a new resource.

**Synopsis**:
```bash
command create [options] <name>
```

**Arguments**:
- `<name>`: Name of the resource to create (required)

**Options**:
| Option | Description | Default |
|--------|-------------|---------|
| --type TYPE | Resource type | standard |
| --force | Overwrite if exists | False |

**Examples**:
```bash
# Create with defaults
command create myresource

# Create with options
command create --type advanced --force myresource
```

**Exit Codes**:
- `0`: Success
- `1`: General error
- `2`: Invalid arguments
```

## Reference Deliverables

### Output File Location

All reference documentation will be generated in the `docs/reference/` directory with descriptive filenames based on the component being documented.

### Reference Template Structure

```markdown
# [System Name] Reference

## Overview
[Brief description and version information]

## Quick Reference

### Most Common Operations
| Operation | Command/Method | Description |
|-----------|---------------|-------------|
| [Common 1] | `syntax` | Brief description |
| [Common 2] | `syntax` | Brief description |

## Complete Reference

### Module: [Module Name]

#### Class: `ClassName`

##### Constructor
```language
new ClassName(param1, param2)
```

##### Methods

###### `methodName(params)`
[Complete documentation following template]

### Configuration Reference

[Complete configuration documentation]

### Error Reference

| Code | Name | Description | Resolution |
|------|------|-------------|------------|
| E001 | ErrorName | What causes it | How to fix |

### Type Definitions

```language
type TypeName = {
    field1: type;
    field2?: type;
}
```

## Appendices

### A. Complete Parameter List
[Alphabetical list of all parameters]

### B. Deprecations
[List of deprecated features]

### C. Version History
[Changes across versions]

## Index
[Alphabetical index of all entries]
```

## Reference Best Practices

### DO:
- ✅ Document EVERY parameter and option
- ✅ Use consistent structure throughout
- ✅ Provide accurate type information
- ✅ Include valid ranges and defaults
- ✅ Show working examples
- ✅ Cross-reference related items
- ✅ Maintain version information
- ✅ Use tables for structured data

### DON'T:
- ❌ Include tutorials or how-to content
- ❌ Explain concepts at length
- ❌ Omit edge cases or limitations
- ❌ Use inconsistent formatting
- ❌ Leave parameters undocumented
- ❌ Include outdated information
- ❌ Mix reference with guidance

## Quality Checklist

Before finalizing reference documentation:

- [ ] Every feature/parameter documented
- [ ] Consistent structure throughout
- [ ] All examples tested and working
- [ ] Type information complete
- [ ] Default values specified
- [ ] Valid ranges/values listed
- [ ] Error codes documented
- [ ] Cross-references accurate
- [ ] Version information current
- [ ] Index/search optimized

## Usage Examples

```bash
# Basic reference generation
/diataxis-reference "REST API endpoints"

# Specify documentation type
/diataxis-reference "database configuration" --config
/diataxis-reference "CLI tool" --cli
/diataxis-reference "Python library" --api
/diataxis-reference "entire system" --complete

# Specific components
/diataxis-reference "authentication module"
/diataxis-reference "payment processing API"
```

## Integration with Other Diataxis Types

### Relationship to Other Documentation
- **From Tutorial**: "For complete details, see [reference](../reference/)"
- **From How-to**: "For all parameters, consult [reference](../reference/)"
- **To Explanation**: "For background on these concepts, see [explanation](../explanation/)"

### Documentation Navigation
```
Tutorial → How-to → Reference (You are here) → Explanation
Learning → Doing → Looking up → Understanding
```

## Common Reference Patterns

### REST API Pattern
```markdown
### GET /api/resource/{id}

**Description**: Retrieve a specific resource

**Parameters**:
- Path: `id` (required) - Resource identifier
- Query: `include` (optional) - Related data to include

**Response**: 200 OK
```json
{
    "id": "string",
    "data": {}
}
```
```

### Configuration Pattern
```markdown
### setting.name
- **Type**: string|number|boolean
- **Default**: value
- **Environment**: SETTING_NAME
- **Description**: What it controls
```

### CLI Pattern
```markdown
### command [options] <required> [optional]
Options:
  --flag, -f    Description
Arguments:
  required      Description
  optional      Description (default: value)
```

## Final Output

Upon completion, generate `docs/reference/[topic-slug].md` containing:
- Complete technical specifications
- Every parameter and option
- Consistent structure throughout
- Working examples
- Error references
- Type definitions
- Cross-references and index

Remember: **Your job is to be the authoritative source of technical truth!**

🚫 **DO NOT**: Explain why, provide tutorials, omit details
✅ **DO**: Document everything, maintain consistency, ensure accuracy, optimize lookup