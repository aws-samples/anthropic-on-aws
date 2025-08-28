# Command Syntax Reference

Complete syntax reference for all Claude Code command types.

## Command Types Overview

Claude Code supports three types of commands:

1. **CLI Commands**: Terminal commands for project management
2. **Slash Commands**: Interactive session commands 
3. **Custom Commands**: User-defined command extensions

## CLI Commands

### Basic Syntax
```bash
claude <command> [subcommand] [arguments] [options]
```

### Global Options

| Option | Short | Description |
|--------|-------|-------------|
| `--help` | `-h` | Show help information |
| `--version` | `-V` | Show version number |
| `--verbose` | `-v` | Enable verbose output |
| `--quiet` | `-q` | Suppress non-error output |
| `--config` | `-c` | Specify config file |
| `--project` | `-p` | Specify project directory |

### Examples
```bash
# Basic command
claude init

# Command with arguments
claude init python-web-app my-project

# Command with options
claude config show --verbose

# Combined options
claude run --agent python-dev --model opus
```

### Core CLI Commands

#### init
Initialize a new project or configure existing project.

```bash
claude init [template] [directory] [options]
```

**Arguments:**
- `template` (optional): Project template name
- `directory` (optional): Target directory (default: current)

**Options:**
- `--template <name>`: Specify template
- `--force`: Overwrite existing files
- `--minimal`: Minimal setup
- `--interactive`: Interactive setup

**Examples:**
```bash
claude init
claude init python-web-app
claude init --template react-spa my-app
claude init --minimal --force
```

#### config
Manage Claude Code configuration.

```bash
claude config <subcommand> [options]
```

**Subcommands:**
- `show`: Display current configuration
- `set <key> <value>`: Set configuration value
- `get <key>`: Get configuration value
- `validate`: Validate configuration
- `migrate`: Migrate to latest format

**Examples:**
```bash
claude config show
claude config show --merged
claude config set defaults.model opus
claude config get agents
claude config validate --fix
```

#### agent
Manage agents.

```bash
claude agent <subcommand> [arguments] [options]
```

**Subcommands:**
- `list`: List available agents
- `show <name>`: Show agent details
- `create <name>`: Create new agent
- `enable <name>`: Enable agent
- `disable <name>`: Disable agent
- `remove <name>`: Remove agent

**Examples:**
```bash
claude agent list
claude agent show python-dev
claude agent create my-agent --template basic
claude agent enable code-reviewer
```

#### run
Execute agent workflow.

```bash
claude run [arguments] [options]
```

**Options:**
- `--agent <name>`: Specify agent
- `--model <model>`: Override model
- `--input <file>`: Input from file
- `--output <file>`: Output to file
- `--interactive`: Interactive mode

**Examples:**
```bash
claude run
claude run --agent documentation-writer
claude run --input requirements.txt --output analysis.md
```

## Slash Commands

### Basic Syntax
```
/<command> [arguments] [options]
```

### Core Slash Commands

#### /help
Show help information.

```
/help [command]
```

**Examples:**
```
/help
/help epcc-explore
/help commands
```

#### /clear
Clear conversation history.

```
/clear
```

#### /compact
Compact conversation to save tokens.

```
/compact [focus]
```

**Arguments:**
- `focus` (optional): Focus area for compaction

**Examples:**
```
/compact
/compact authentication
/compact --preserve-code
```

#### /cost
Show token usage and costs.

```
/cost [period]
```

**Arguments:**
- `period` (optional): Time period (session, day, week, month)

**Examples:**
```
/cost
/cost session
/cost week
```

#### /model
Change active model.

```
/model <model-name>
```

**Arguments:**
- `model-name`: Model to switch to (sonnet, opus)

**Examples:**
```
/model opus
/model sonnet
```

#### /agent
Switch active agent.

```
/agent <agent-name>
```

**Arguments:**
- `agent-name`: Agent to activate

**Examples:**
```
/agent python-developer
/agent code-reviewer
/agent off
```

### Agent Management Commands

#### /agents
List available agents.

```
/agents [filter]
```

**Arguments:**
- `filter` (optional): Filter by category or pattern

**Examples:**
```
/agents
/agents python
/agents --enabled
```

#### /reload
Reload agent configuration.

```
/reload [agent-name]
```

**Arguments:**
- `agent-name` (optional): Specific agent to reload

**Examples:**
```
/reload
/reload python-dev
```

### Context Management Commands

#### /context
Manage conversation context.

```
/context <subcommand> [options]
```

**Subcommands:**
- `show`: Display context usage
- `clear`: Clear context
- `save <name>`: Save context
- `load <name>`: Load context

**Examples:**
```
/context show
/context clear --keep-recent 5
/context save work-session
```

#### /memory
Manage long-term memory.

```
/memory <subcommand> [arguments]
```

**Subcommands:**
- `add <key> <value>`: Add memory
- `get <key>`: Retrieve memory
- `list`: List all memories
- `remove <key>`: Remove memory

**Examples:**
```
/memory add project-goal "Build user auth system"
/memory get project-goal
/memory list
```

## EPCC Commands

### Command Structure
```
/epcc/<phase> [description] [options]
```

### /epcc/epcc-explore
Analyze codebase and requirements.

```
/epcc/epcc-explore [target] [options]
```

**Arguments:**
- `target` (optional): Specific area to explore

**Options:**
- `--quick`: Rapid overview
- `--deep`: Comprehensive analysis
- `--focus <area>`: Specific focus area

**Examples:**
```
/epcc/epcc-explore
/epcc/epcc-explore "authentication system"
/epcc/epcc-explore --quick "login bug"
/epcc/epcc-explore --deep --focus security
```

### /epcc/epcc-plan
Create implementation plan.

```
/epcc/epcc-plan <description> [options]
```

**Arguments:**
- `description` (required): What to implement

**Options:**
- `--quick`: Simplified plan
- `--detailed`: Comprehensive plan
- `--with-risks`: Include risk assessment

**Examples:**
```
/epcc/epcc-plan "implement JWT authentication"
/epcc/epcc-plan "fix validation bug" --quick
/epcc/epcc-plan "migrate to microservices" --detailed --with-risks
```

### /epcc/epcc-code
Implement solution.

```
/epcc/epcc-code [task] [options]
```

**Arguments:**
- `task` (optional): Specific task from plan

**Options:**
- `--tdd`: Use test-driven development
- `--continue`: Continue from previous work

**Examples:**
```
/epcc/epcc-code
/epcc/epcc-code "implement JWT validation"
/epcc/epcc-code --tdd "add user model"
```

### /epcc/epcc-commit
Finalize and commit changes.

```
/epcc/epcc-commit <message> [options]
```

**Arguments:**
- `message` (required): Commit message

**Options:**
- `--squash`: Squash commits
- `--amend`: Amend last commit
- `--pr`: Create pull request

**Examples:**
```
/epcc/epcc-commit "feat: Add JWT authentication"
/epcc/epcc-commit "fix: Correct validation logic" --amend
/epcc/epcc-commit "feat: User management system" --squash --pr
```

## Custom Commands

### Command File Structure

#### Project Commands (.claude/commands/)
```markdown
# command-name.md

Brief description of what this command does.

## Usage
```
/project/command-name [arguments] [options]
```

## Implementation
- Command logic here
- Can reference other files
- Uses standard Claude Code tools
```

#### User Commands (~/.claude/commands/)
```markdown
# personal-command.md

Personal command description.

## Usage
```
/personal/command-name [arguments]
```

## Implementation
- Personal workflow automation
- Custom development patterns
```

### Command Syntax

#### Basic Custom Command
```
/project/deploy [environment] [options]
/personal/backup [location]
/team/review [pull-request-id]
```

#### Command with Arguments
```
/project/test-feature "user authentication" --coverage
/personal/setup-env development --quick
```

#### Command Chaining
```
/project/test && /project/build && /project/deploy staging
```

### Command Parameters

#### Positional Parameters
```
/project/deploy staging
# staging is positional argument 1
```

#### Named Parameters
```
/project/deploy --env staging --branch main
# env and branch are named parameters
```

#### Optional Parameters
```
/project/deploy [environment] [--options]
# environment is optional positional
# options are optional named
```

## Option Syntax

### Boolean Flags
```bash
--verbose, -v         # Enable verbose mode
--force, -f          # Force operation
--dry-run           # Simulate operation
--no-cache          # Disable caching
```

### Value Options
```bash
--model opus                    # Single value
--env production               # Single value
--include "*.py" "*.js"       # Multiple values
--exclude pattern             # Single value with spaces
```

### Combined Options
```bash
-vf                    # Same as --verbose --force
--model=opus          # Alternative syntax
--env="production"    # Quoted value
```

## Error Handling

### Syntax Errors

#### Invalid Command
```
Error: Unknown command '/invalid'
Did you mean:
  /epcc/epcc-explore
  /help
```

#### Missing Arguments
```
Error: Missing required argument 'description'
Usage: /epcc/epcc-plan <description> [options]
Example: /epcc/epcc-plan "implement user authentication"
```

#### Invalid Options
```
Error: Unknown option '--invalid'
Valid options for /epcc/epcc-explore:
  --quick     Rapid overview
  --deep      Comprehensive analysis
  --focus     Specific focus area
```

### Validation Errors

#### Invalid Values
```
Error: Invalid model 'invalid-model'
Valid models: sonnet, opus
```

#### File Not Found
```
Error: Agent file not found: './agents/missing-agent.md'
Available agents:
  - python-developer
  - code-reviewer
```

## Command Completion

### Auto-completion Features
- Command name completion
- Argument suggestions
- Option flag completion
- File path completion
- Agent name completion
- Model name completion

### Completion Examples
```bash
/ep<TAB>         # Expands to /epcc/
/agent py<TAB>   # Suggests python-developer
--mo<TAB>        # Expands to --model
```

## Best Practices

### Command Naming
- Use kebab-case for command names
- Choose descriptive, specific names
- Group related commands with prefixes
- Avoid conflicts with built-in commands

### Argument Design
- Make required arguments positional
- Use options for optional parameters
- Provide sensible defaults
- Include help text and examples

### Error Messages
- Provide clear, actionable error messages
- Suggest corrections for common mistakes
- Include usage examples in error output
- Use consistent error format

### Documentation
- Include usage examples
- Document all parameters and options
- Explain when to use the command
- Provide troubleshooting tips

## See Also

- [Command Index](index.md)
- [Built-in Commands](built-in.md)
- [Custom Command API](api.md)
- [EPCC Commands Reference](../epcc-commands.md)