# Built-in Commands Reference

Complete reference for all Claude Code built-in commands.

## Core Commands

### help
Display help information for Claude Code commands.

```bash
claude help [command]
claude <command> --help
```

**Arguments:**
- `command` (optional): Specific command to get help for

**Examples:**
```bash
claude help                    # General help
claude help init              # Help for init command
claude config --help          # Help for config command
```

**Output:**
- Command description
- Usage syntax
- Available options
- Examples
- Related commands

### version
Display Claude Code version information.

```bash
claude version
claude --version
claude -V
```

**Output:**
```
Claude Code v2.1.0
Build: 2024-01-15T10:30:00Z
Platform: darwin-arm64
Python: 3.11.5
```

### init
Initialize a new Claude Code project or add Claude Code to existing project.

```bash
claude init [template] [directory] [options]
```

**Arguments:**
- `template` (optional): Project template to use
- `directory` (optional): Target directory (default: current directory)

**Options:**
| Option | Short | Description |
|--------|-------|-------------|
| `--template <name>` | `-t` | Specify template explicitly |
| `--force` | `-f` | Overwrite existing configuration |
| `--minimal` | `-m` | Create minimal configuration |
| `--interactive` | `-i` | Interactive setup wizard |
| `--no-git` | | Skip git initialization |
| `--no-hooks` | | Skip hook setup |

**Available Templates:**
- `python-web-app` - FastAPI/Flask web application
- `react-spa` - React single-page application
- `node-api` - Node.js REST API
- `data-science` - Python data science project
- `microservices` - Microservices architecture
- `minimal` - Basic configuration only

**Examples:**
```bash
# Initialize with interactive wizard
claude init --interactive

# Create Python web app in new directory
claude init python-web-app my-app

# Add Claude Code to existing project
claude init --minimal

# Force reinitialize with template
claude init --force --template react-spa
```

**Files Created:**
- `.claude/settings.json` - Project configuration
- `CLAUDE.md` - Project guidance file
- `.claude/agents/` - Project-specific agents
- `.claude/hooks/` - Project-specific hooks
- `.gitignore` - Updated with Claude Code entries

## Configuration Commands

### config
Manage Claude Code configuration.

```bash
claude config <subcommand> [arguments] [options]
```

#### config show
Display current configuration.

```bash
claude config show [section] [options]
```

**Arguments:**
- `section` (optional): Specific configuration section

**Options:**
| Option | Description |
|--------|-------------|
| `--global` | Show global configuration only |
| `--project` | Show project configuration only |
| `--local` | Show local configuration only |
| `--merged` | Show final merged configuration |
| `--format <format>` | Output format (json, yaml, table) |
| `--verbose` | Include metadata and sources |

**Examples:**
```bash
claude config show                 # Show all configuration
claude config show agents         # Show agents section
claude config show --global       # Global config only
claude config show --merged --format json
```

#### config set
Set configuration values.

```bash
claude config set <key> <value> [options]
```

**Arguments:**
- `key`: Configuration key (dot notation supported)
- `value`: Value to set

**Options:**
| Option | Description |
|--------|-------------|
| `--global` | Set in global configuration |
| `--project` | Set in project configuration |
| `--type <type>` | Value type (string, number, boolean, array) |

**Examples:**
```bash
claude config set defaults.model opus
claude config set security.mode strict --global
claude config set agents[0].enabled false
```

#### config get
Get configuration values.

```bash
claude config get <key> [options]
```

**Arguments:**
- `key`: Configuration key to retrieve

**Options:**
| Option | Description |
|--------|-------------|
| `--default <value>` | Default value if key not found |
| `--raw` | Return raw value without formatting |

**Examples:**
```bash
claude config get defaults.model
claude config get agents --format json
claude config get nonexistent --default "not-found"
```

#### config validate
Validate configuration files.

```bash
claude config validate [file] [options]
```

**Arguments:**
- `file` (optional): Specific configuration file

**Options:**
| Option | Description |
|--------|-------------|
| `--fix` | Automatically fix common issues |
| `--strict` | Use strict validation |
| `--report <file>` | Save validation report |

**Examples:**
```bash
claude config validate              # Validate all configs
claude config validate .claude/settings.json
claude config validate --fix --strict
```

#### config migrate
Migrate configuration to latest format.

```bash
claude config migrate [options]
```

**Options:**
| Option | Description |
|--------|-------------|
| `--backup` | Create backup before migration |
| `--force` | Force migration even if current |
| `--dry-run` | Show what would be migrated |

**Examples:**
```bash
claude config migrate --backup
claude config migrate --dry-run
```

## Agent Management Commands

### agent
Manage Claude Code agents.

```bash
claude agent <subcommand> [arguments] [options]
```

#### agent list
List available agents.

```bash
claude agent list [options]
```

**Options:**
| Option | Description |
|--------|-------------|
| `--global` | Show global agents only |
| `--project` | Show project agents only |
| `--enabled` | Show enabled agents only |
| `--disabled` | Show disabled agents only |
| `--format <format>` | Output format (table, json, yaml) |
| `--verbose` | Include detailed information |

**Examples:**
```bash
claude agent list
claude agent list --project --enabled
claude agent list --format json
```

#### agent show
Show detailed agent information.

```bash
claude agent show <name> [options]
```

**Arguments:**
- `name`: Agent name to display

**Options:**
| Option | Description |
|--------|-------------|
| `--config` | Show configuration details |
| `--usage` | Show usage statistics |
| `--dependencies` | Show agent dependencies |

**Examples:**
```bash
claude agent show python-developer
claude agent show code-reviewer --config
claude agent show documentation-agent --usage
```

#### agent create
Create a new agent.

```bash
claude agent create <name> [options]
```

**Arguments:**
- `name`: Name for the new agent

**Options:**
| Option | Description |
|--------|-------------|
| `--template <template>` | Base template to use |
| `--description <text>` | Agent description |
| `--model <model>` | Default model (sonnet, opus) |
| `--tools <tools>` | Comma-separated tool list |
| `--global` | Create as global agent |
| `--interactive` | Interactive creation wizard |

**Available Templates:**
- `basic` - Basic agent template
- `developer` - Software developer agent
- `reviewer` - Code review agent
- `documentation` - Documentation agent
- `security` - Security analysis agent
- `testing` - Test generation agent

**Examples:**
```bash
claude agent create my-agent --interactive
claude agent create api-designer --template developer --model opus
claude agent create security-scanner --template security --global
```

#### agent enable/disable
Enable or disable agents.

```bash
claude agent enable <name>
claude agent disable <name>
```

**Arguments:**
- `name`: Agent name to enable/disable

**Examples:**
```bash
claude agent enable python-developer
claude agent disable legacy-agent
```

#### agent remove
Remove an agent.

```bash
claude agent remove <name> [options]
```

**Arguments:**
- `name`: Agent name to remove

**Options:**
| Option | Description |
|--------|-------------|
| `--force` | Remove without confirmation |
| `--backup` | Create backup before removal |

**Examples:**
```bash
claude agent remove old-agent
claude agent remove test-agent --force --backup
```

## Execution Commands

### run
Execute Claude Code with specified agent or workflow.

```bash
claude run [arguments] [options]
```

**Options:**
| Option | Description |
|--------|-------------|
| `--agent <name>` | Specify agent to use |
| `--model <model>` | Override default model |
| `--input <file>` | Read input from file |
| `--output <file>` | Write output to file |
| `--interactive` | Start interactive session |
| `--prompt <text>` | Provide initial prompt |
| `--context <file>` | Load context from file |
| `--max-tokens <n>` | Override token limit |
| `--temperature <n>` | Override temperature |

**Examples:**
```bash
# Start interactive session
claude run --interactive

# Run with specific agent
claude run --agent python-developer --prompt "Review this code"

# Process file with output
claude run --input code.py --output review.md --agent code-reviewer

# Use custom model settings
claude run --model opus --max-tokens 16384 --temperature 0.2
```

### test
Run project tests using Claude Code.

```bash
claude test [test-pattern] [options]
```

**Arguments:**
- `test-pattern` (optional): Test file pattern or specific test

**Options:**
| Option | Description |
|--------|-------------|
| `--framework <framework>` | Test framework to use |
| `--coverage` | Generate coverage report |
| `--watch` | Watch for changes and rerun |
| `--parallel` | Run tests in parallel |
| `--verbose` | Verbose test output |
| `--filter <pattern>` | Filter tests by pattern |

**Examples:**
```bash
claude test                     # Run all tests
claude test test_auth.py       # Run specific test file
claude test --coverage --verbose
claude test --framework pytest --parallel
```

### build
Build project using Claude Code.

```bash
claude build [target] [options]
```

**Arguments:**
- `target` (optional): Build target (default: all)

**Options:**
| Option | Description |
|--------|-------------|
| `--clean` | Clean build artifacts first |
| `--watch` | Watch for changes and rebuild |
| `--production` | Production build |
| `--verbose` | Verbose build output |
| `--parallel` | Parallel build processes |

**Examples:**
```bash
claude build                   # Build project
claude build --clean --production
claude build frontend --watch
```

### deploy
Deploy project using Claude Code.

```bash
claude deploy [environment] [options]
```

**Arguments:**
- `environment` (optional): Deployment environment

**Options:**
| Option | Description |
|--------|-------------|
| `--dry-run` | Simulate deployment |
| `--force` | Force deployment |
| `--rollback` | Rollback to previous version |
| `--config <file>` | Use specific deployment config |

**Examples:**
```bash
claude deploy staging
claude deploy production --force
claude deploy --rollback
```

## Utility Commands

### status
Show Claude Code project status.

```bash
claude status [options]
```

**Options:**
| Option | Description |
|--------|-------------|
| `--verbose` | Show detailed status |
| `--format <format>` | Output format (table, json) |
| `--check-health` | Include health checks |

**Output includes:**
- Project configuration status
- Active agents
- Recent usage statistics
- System health
- Configuration issues

**Examples:**
```bash
claude status
claude status --verbose --check-health
```

### logs
View Claude Code logs.

```bash
claude logs [options]
```

**Options:**
| Option | Description |
|--------|-------------|
| `--follow` | Follow log output |
| `--lines <n>` | Number of lines to show |
| `--level <level>` | Filter by log level |
| `--since <time>` | Show logs since timestamp |
| `--format <format>` | Output format |

**Examples:**
```bash
claude logs                    # Show recent logs
claude logs --follow          # Tail logs
claude logs --level error --since 1h
```

### clean
Clean Claude Code cache and temporary files.

```bash
claude clean [options]
```

**Options:**
| Option | Description |
|--------|-------------|
| `--cache` | Clean response cache |
| `--logs` | Clean log files |
| `--temp` | Clean temporary files |
| `--all` | Clean everything |
| `--dry-run` | Show what would be cleaned |
| `--force` | Don't ask for confirmation |

**Examples:**
```bash
claude clean --cache
claude clean --all --dry-run
claude clean --force
```

### doctor
Diagnose Claude Code installation and configuration issues.

```bash
claude doctor [options]
```

**Options:**
| Option | Description |
|--------|-------------|
| `--fix` | Automatically fix issues |
| `--report <file>` | Save diagnostic report |
| `--verbose` | Detailed diagnostic output |

**Checks performed:**
- Installation integrity
- Configuration validity
- Permission issues
- Network connectivity
- Agent and hook functionality
- Performance issues

**Examples:**
```bash
claude doctor                  # Run diagnostics
claude doctor --fix           # Fix issues automatically
claude doctor --report diagnostics.json
```

## Environment and Context

### Environment Variables
All commands respect these environment variables:

| Variable | Description |
|----------|-------------|
| `CLAUDE_CONFIG_DIR` | Configuration directory |
| `CLAUDE_PROJECT_ROOT` | Project root override |
| `CLAUDE_LOG_LEVEL` | Logging level |
| `CLAUDE_API_KEY` | API key override |
| `CLAUDE_MODEL` | Default model override |

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Configuration error |
| 3 | Permission error |
| 4 | Network error |
| 5 | Agent error |
| 6 | Validation error |

### Command Chaining
Commands can be chained using shell operators:

```bash
# Sequential execution
claude test && claude build && claude deploy staging

# Conditional execution
claude config validate || claude config migrate

# Parallel execution (where safe)
claude test --parallel & claude lint &
```

## See Also

- [Command Index](index.md)
- [Syntax Reference](syntax.md)
- [Custom Command API](api.md)
- [Configuration Reference](../configuration/settings.md)