# How to Configure Claude Code Permissions

Learn to set up secure permission configurations for your Claude Code projects.

## Prerequisites
- Claude Code installed and authenticated
- Project directory with `.claude/` folder
- Basic understanding of JSON configuration

## Configure Project-Level Permissions

### Step 1: Create Permission Configuration

Create `.claude/settings.json` in your project root:

```bash
mkdir -p .claude
touch .claude/settings.json
```

### Step 2: Define File Access Permissions

Add file access controls to limit Claude Code's file system access:

```json
{
  "name": "project-permissions",
  "description": "Project-specific Claude Code permissions",
  "permissions": {
    "file_access": {
      "allowed_paths": [
        "${project_root}/src",
        "${project_root}/tests",
        "${project_root}/docs"
      ],
      "denied_paths": [
        "${project_root}/.env",
        "${project_root}/secrets",
        "${project_root}/.git/config"
      ],
      "read_only_paths": [
        "${project_root}/vendor",
        "${project_root}/node_modules"
      ]
    }
  }
}
```

### Step 3: Configure Network Access

Add network restrictions to control external communications:

```json
{
  "permissions": {
    "network_access": {
      "allowed_domains": [
        "github.com",
        "api.github.com",
        "docs.anthropic.com",
        "pypi.org",
        "npmjs.com"
      ],
      "blocked_domains": [
        "*.onion",
        "*.local"
      ],
      "require_https": true
    }
  }
}
```

### Step 4: Set Tool Permissions

Configure bash and file write permissions:

```json
{
  "permissions": {
    "tool_permissions": {
      "bash": {
        "allowed_commands": [
          "git",
          "npm",
          "pytest",
          "docker"
        ],
        "blocked_commands": [
          "rm -rf /",
          "sudo",
          "chmod 777"
        ],
        "require_confirmation": [
          "git push",
          "npm publish",
          "docker push"
        ]
      },
      "write": {
        "max_file_size_mb": 10,
        "allowed_extensions": [
          ".py", ".js", ".ts", ".md", ".json", ".yaml"
        ],
        "blocked_patterns": [
          "*.exe",
          "*.dll",
          "*.so"
        ]
      }
    }
  }
}
```

## Configure Global Permissions

### Step 1: Create Global Configuration

Create `~/.claude/settings.json` for user-wide permissions:

```json
{
  "name": "global-permissions",
  "description": "User-wide Claude Code permissions",
  "permissions": {
    "default_file_access": "prompt",
    "default_network_access": "prompt",
    "auto_approve_read": false,
    "auto_approve_write": false,
    "require_confirmation_for_destructive": true
  },
  "trusted_directories": [
    "~/projects/work",
    "~/projects/personal"
  ]
}
```

### Step 2: Set Security Preferences

Add security preferences to enforce best practices:

```json
{
  "security_preferences": {
    "always_use_gh_cli": true,
    "prefer_ssh_over_https": true,
    "enforce_2fa": true
  }
}
```

## Manage Permissions with CLI

### View Current Permissions

```bash
# Check current permissions
claude /permissions

# View detailed permission status
claude /permissions --verbose
```

### Configure Permissions Interactively

```bash
# Launch interactive permission configuration
claude /permissions --configure
```

### Export and Import Configurations

```bash
# Export current permissions
claude /permissions --export > permissions.json

# Import permission configuration
claude /permissions --import permissions.json
```

## Set Permission Levels

Choose the appropriate permission level for your use case:

### Restricted (Default)
```bash
claude /permissions --level restricted
```
- Read access to current directory only
- No network access
- No bash execution
- Requires explicit approval for all operations

### Standard (Recommended)
```bash
claude /permissions --level standard
```
- Read/write in project directory
- Network access to approved domains
- Limited bash commands
- Auto-approve safe operations

### Extended
```bash
claude /permissions --level extended
```
- Full project directory access
- Broader network access
- Most bash commands allowed
- Auto-approve most operations

### Trusted (Use with Caution)
```bash
claude /permissions --level trusted
```
- Full file system access (with exceptions)
- Unrestricted network access
- All bash commands except dangerous ones
- Minimal confirmation prompts

## Troubleshooting

### Permission Denied Errors
If Claude Code cannot access required files:
1. Check `.claude/settings.json` for correct paths
2. Verify file permissions on the directory
3. Use `/permissions --diagnose` to identify issues

### Network Access Issues
If external API calls fail:
1. Check `allowed_domains` configuration
2. Verify HTTPS enforcement settings
3. Test network connectivity manually

### Tool Execution Blocked
If bash commands are rejected:
1. Review `allowed_commands` list
2. Check if command requires confirmation
3. Use interactive mode to approve specific operations

## Best Practices

1. **Start Restrictive**: Begin with restricted permissions and gradually expand as needed
2. **Regular Audits**: Review permissions monthly and remove unused access
3. **Document Decisions**: Comment why specific permissions are granted
4. **Test Configurations**: Verify permissions work as expected before deployment
5. **Use Environment Variables**: Store sensitive configuration in environment variables

## Next Steps

- [Set up secure workflows](secure-workflows.md)
- [Configure audit logging](setup-audit-logging.md)
- [Implement secrets management](manage-secrets.md)