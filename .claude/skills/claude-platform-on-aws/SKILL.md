---
name: claude-platform-on-aws
description: Convert Anthropic 1P (direct API) code samples to Claude Platform on AWS (CPOA). Use when migrating from api.anthropic.com to aws-external-anthropic.{region}.api.aws, converting environment key auth to IAM SigV4 or CPOA API key auth, adding workspace headers, adapting MicroVM workers for CPOA, or when someone asks about differences between Anthropic 1P and CPOA authentication/endpoints. Triggers on phrases like "convert to CPOA", "migrate to Claude Platform on AWS", "CPOA auth", "workspace header", "aws-external-anthropic", "SigV4 anthropic".
---

# Claude Platform on AWS — Migration Skill

Convert Anthropic 1P API code to Claude Platform on AWS (CPOA).

## Key Differences: 1P vs CPOA

| Aspect | Anthropic 1P | CPOA |
|--------|-------------|------|
| Base URL | `https://api.anthropic.com` | `https://aws-external-anthropic.{region}.api.aws` |
| Auth | API key (`sk-ant-api03-...`) in `x-api-key` header | IAM SigV4 OR CPOA API key (`aws-external-anthropic-api-key-...`) |
| Required headers | `x-api-key`, `anthropic-version` | `anthropic-workspace-id` (on all requests) |
| Billing | Anthropic billing | AWS Marketplace |
| Inference | Anthropic infra | Anthropic infra (same — CPOA only changes auth/billing layer) |
| Env keys (agents) | `sk-ant-env01-...` | NOT used — use IAM role or CPOA API key |
| VPC access | Direct HTTPS to api.anthropic.com | PrivateLink available (VPC→AWS hop only; inference still on Anthropic) |
| Credential rotation | Manual API key management | Automatic via STS (IAM mode) |

## Conversion Steps

### 1. Identify Auth Mode

CPOA supports two auth modes:

- **IAM SigV4** (preferred for production): Uses execution role credentials. No secrets to manage.
- **API key** (dev/quick-start): CPOA-issued key with `aws-external-anthropic-api-key-` prefix. Short-lived (~15 min from Quick Start, longer for production keys).

### 2. Update Base URL

```
# Before (1P)
https://api.anthropic.com

# After (CPOA)
https://aws-external-anthropic.{region}.api.aws
```

Replace `{region}` with the AWS region (e.g., `us-west-2`).

### 3. Add Workspace Header

**Critical**: ALL CPOA API calls require `anthropic-workspace-id` header.

```
anthropic-workspace-id: wrkspc_XXXXX
```

### 4. Convert Client Initialization

See `references/code-patterns.md` for language-specific conversion patterns (Python, Node.js, curl).

### 5. Update Agent/Environment Workflows

For managed agents (self-hosted environments):
- Remove `environmentKey` usage — not available on CPOA
- Use `client.beta.environments.work.poll()` directly (bypasses WorkPoller sub-client limitation)
- Session creation: `client.beta.sessions.create(agent=agent_id, environment_id=env_id)`
- Event sending: `client.beta.sessions.events.send(session_id=..., events=[{type: 'user.message', content: [...]}])`

### 6. IAM Permissions (SigV4 mode)

Attach `AnthropicSelfHostedEnvironmentAccess` managed policy to execution role, which includes:
- `aws-external-anthropic:ProcessEnvironmentWork`
- `aws-external-anthropic:GetEnvironment`
- Work polling actions

### 7. Security Comparison

CPOA advantages for sandboxed/multi-tenant environments:
- No long-lived secrets — IAM creds rotate hourly via STS
- IAM policy scoping — restrict to specific actions
- Condition keys — `aws:SourceVpc`, `aws:SourceAccount`
- CloudTrail audit — native AWS logging
- SCP enforcement at org level

Tradeoff: more operational complexity (IAM setup, workspace subscription, headers).

## Common Pitfalls

1. **Missing workspace header** → 400 "Missing header" error on environments endpoints
2. **Using `AnthropicAWS` class** → Not available in Node.js SDK (Python-only); use standard `Anthropic` with `authToken`
3. **Using environment keys** → Not supported on CPOA; use IAM or API key directly
4. **Quick Start keys expire fast** → ~15 min (embedded STS session); use long-lived IAM for production
5. **WorkPoller requires `environmentKey`** → Bypass by calling `client.beta.environments.work.poll()` directly
6. **Account not CPOA-subscribed** → SigV4 will fail; need API key from a subscribed account/workspace
