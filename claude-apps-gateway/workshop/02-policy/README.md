# Module 2: Policy (Model Access and Managed Settings)

## What it is

The gateway enforces policies per IdP group that control which models developers can use, which tools are allowed or denied, and what permissions apply. Policies are defined in `gateway.yaml` and delivered to the CLI at sign-in. Model access is enforced both client-side (model picker) and server-side (400 on unauthorized model).

## What the customer gets

- Different teams get different models: engineering gets Opus, contractors get Haiku only
- Tool restrictions: block web access for some groups, limit file reads
- Central control: settings are locked and cannot be overridden locally by developers
- Bypass protection: prevent developers from using `--dangerously-skip-permissions`
- No developer action: policies apply automatically at sign-in and refresh hourly

## How to configure it

```yaml
managed:
  policies:
    # Contractors: restricted to Haiku, no web access
    - match: { groups: [contractors] }
      cli:
        availableModels: [claude-haiku-4-5]
        enforceAvailableModels: true
        permissions:
          deny: ["WebFetch", "WebSearch"]

    # Engineers: full access with some guardrails
    - match: { groups: [engineers] }
      cli:
        availableModels: [claude-opus-4-8, claude-sonnet-4-6, claude-haiku-4-5]
        permissions:
          allow: [Read, Grep, Bash, Edit]
          deny: ["Read(./.env)", "Read(./secrets/**)"]

    # Everyone else: default access
    - match: {}
      cli:
        availableModels: [claude-haiku-4-5, claude-sonnet-4-6]
```

### Configuration notes

- Policies are evaluated top to bottom, first match wins
- `match: {}` is the catch-all (every authenticated user), should be last
- `match: { groups: [a, b] }` matches if the user has ANY of the listed groups
- `availableModels` is enforced both client-side AND server-side
- `enforceAvailableModels: true` makes the "Default" model resolve to one in the allowlist
- Deny-lists (permissions.deny) take the union of the base and specific policy

### What you can control per group

| Setting | What it does |
|---------|-------------|
| `availableModels` | Which models appear in the picker and are accepted server-side |
| `permissions.allow` | Tools that auto-approve without prompting |
| `permissions.deny` | Tools or patterns that are always blocked |
| `permissions.ask` | Tools that always prompt for confirmation |
| `disableBypassPermissionsMode` | Prevents `--dangerously-skip-permissions` |
| `allowManagedPermissionRulesOnly` | Ignores user/project permission rules |
| `env` | Environment variables pushed to the CLI process |
| `hooks` | Org-wide pre/post tool hooks |

### Other things you can enforce via policy

**Block specific tools or file access:**
Deny web access for contractors, or prevent reading secrets files. Uses glob patterns for file paths.
```yaml
permissions:
  deny: ["WebFetch", "WebSearch", "Read(./.env)", "Read(./secrets/**)"]
```

**Lock down permission bypass:**
Prevent developers from running Claude Code in "yolo mode" where all tool calls auto-approve.
```yaml
disableBypassPermissionsMode: disable
allowManagedPermissionRulesOnly: true
```

**Push environment variables:**
Control update behavior, set proxy settings, or inject org-wide config into every CLI session.
```yaml
env:
  DISABLE_UPDATES: "1"
  HTTP_PROXY: http://proxy.company.com:8080
```

**Enforce org-wide hooks:**
Run a script after every file edit (e.g., audit logging) on developer machines. Hook commands execute on the developer's machine, not the gateway.
```yaml
hooks:
  PostToolUse:
    - matcher: "Edit|Write"
      hooks:
        - { type: command, command: /usr/local/bin/audit-edit.sh }
```

**Block MCP servers:**
Prevent developers from connecting to unapproved MCP servers.
```yaml
deniedMcpServers:
  - { serverName: "untrusted-server" }
```

**Control plugin marketplaces:**
Restrict which plugin sources developers can install from.
```yaml
strictKnownMarketplaces:
  - { source: github, repo: "your-org/approved-plugins" }
```

### How groups work

The gateway reads group membership from the IdP token's `groups` claim. For this to work:
- Your IdP must emit groups in the id_token (or set `userinfo_fallback: true`)
- Group names in the policy must match the IdP's exact casing
- In Auth0: use Roles (appear as groups via a Login Action)
- In Okta: request the `groups` scope
- In Entra: groups come as Object IDs; use `groups_claim: roles` for app roles

## How to verify it

### 1. Check managed settings are configured

When the gateway boots with a `managed` block, you should see:
```
[gateway] ... info managed settings: configured
```

### 2. Server-side model enforcement

Request a model that's NOT in any policy's `availableModels`:

```bash
curl -s https://<gateway>/v1/messages \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -H "anthropic-version: 2023-06-01" \
  -d '{"model":"fake-model-xyz","max_tokens":10,"messages":[{"role":"user","content":"Hi"}]}'
```

Expected output:
```json
{"type":"error","error":{"type":"invalid_request_error","message":"model fake-model-xyz is not in the operator's model allowlist"}}
```

### 3. Allowed model works

```bash
curl -s https://<gateway>/v1/messages \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -H "anthropic-version: 2023-06-01" \
  -d '{"model":"claude-haiku-4-5","max_tokens":10,"messages":[{"role":"user","content":"Say ok"}]}'
```

Expected output: a valid response with `"text": "ok"` or similar.

### 4. Verify managed settings delivery

The gateway serves managed settings at:
```bash
curl -s https://<gateway>/managed/settings \
  -H "Authorization: Bearer <token>"
```

This returns the policy document that the CLI applies. It includes the `availableModels`, permissions, and environment variables for the user's matched group.

## Setting up groups in Auth0 (for testing)

To test group-based policies with Auth0:

1. Create roles in Auth0 (via dashboard or API):
   - `engineers`
   - `contractors`

2. Assign users to roles

3. Create a Login Action that adds roles to the token:
   ```javascript
   exports.onExecutePostLogin = async (event, api) => {
     const roles = event.authorization?.roles || [];
     if (roles.length > 0) {
       api.idToken.setCustomClaim("groups", roles);
       api.accessToken.setCustomClaim("groups", roles);
     }
   };
   ```

4. Deploy the action and bind it to the Login flow

5. After the next sign-in, the gateway sees the user's groups and matches the right policy

## Key takeaways

- Models outside the allowlist return 400 server-side
- Different IdP groups can receive different policies
- `disableBypassPermissionsMode: disable` prevents developers from overriding permissions
- Policies refresh hourly; a config redeployment reaches all developers within an hour
- `GET /managed/settings` returns the active policy for the authenticated user

## Tested result

```
✅ Gateway boots with "managed settings: configured"
✅ Unknown model rejected: "not in the operator's model allowlist"
✅ Allowed model (haiku) returns valid response
✅ Auth0 roles created and Login Action deployed (groups appear in token)
```
