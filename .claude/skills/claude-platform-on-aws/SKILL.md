---
name: claude-platform-on-aws
description: Convert Anthropic 1P (direct API) code samples to Claude Platform on AWS (CPOA). Use when migrating from api.anthropic.com to aws-external-anthropic.{region}.api.aws, converting auth to IAM SigV4 or CPOA API key, adding workspace headers, adapting self-hosted sandbox workers for CPOA, or when someone asks about differences between Anthropic 1P and CPOA authentication/endpoints. Triggers on phrases like "convert to CPOA", "migrate to Claude Platform on AWS", "CPOA auth", "workspace header", "aws-external-anthropic", "SigV4 anthropic".
---

# Claude Platform on AWS — Migration Skill

Convert Anthropic 1P API code to Claude Platform on AWS (CPOA).

## Key Differences: 1P vs CPOA

| Aspect | Anthropic 1P | CPOA |
|--------|-------------|------|
| Base URL | `https://api.anthropic.com` | `https://aws-external-anthropic.{region}.api.aws` |
| Auth | API key (`sk-ant-api03-...`) in `x-api-key` header | IAM SigV4 OR CPOA API key (generated in AWS Console) |
| Required headers | `x-api-key`, `anthropic-version` | `anthropic-workspace-id` (handled by platform SDK clients) |
| SDK client | `Anthropic` | `AnthropicAWS` (Python) / `AnthropicAws` (TypeScript) |
| Billing | Anthropic billing | AWS Marketplace |
| Inference | Anthropic infra | Anthropic infra (same — CPOA only changes auth/billing layer) |
| Env keys (self-hosted workers) | `sk-ant-env01-...` (from Claude Console) | NOT used — workers authenticate via IAM or CPOA API key |
| VPC access | Direct HTTPS to api.anthropic.com | PrivateLink available (VPC→AWS hop only; inference still on Anthropic) |
| Credential rotation | Manual API key management | Automatic via STS (IAM mode) |

## Conversion Steps

### 1. Identify Auth Mode

CPOA supports two auth modes:

- **IAM SigV4** (preferred for production): Uses execution role credentials via standard AWS provider chain. No secrets to manage.
- **API key** (dev/quick-start): Generated in AWS Console under Claude Platform on AWS → API keys. Short-term tokens generated from AWS credentials default to 12 hours (capped at the lesser of requested duration, AWS credentials' expiry, and 12 hours).

### 2. Install the Platform SDK

The platform-specific SDK client handles SigV4 signing, base URL construction, and the `anthropic-workspace-id` header automatically.

```bash
# Python
pip install -U "anthropic[aws]"

# TypeScript
npm install @anthropic-ai/aws-sdk
```

### 3. Convert Client Initialization

See `references/code-patterns.md` for language-specific conversion patterns (Python, Node.js, curl).

The platform client reads `AWS_REGION` and `ANTHROPIC_AWS_WORKSPACE_ID` from environment variables. Set them:

```bash
export AWS_REGION='us-west-2'
export ANTHROPIC_AWS_WORKSPACE_ID='wrkspc_XXXXX'
```

### 4. Update Self-Hosted Sandbox Workers

For self-hosted environments on CPOA:
- Environment keys from the Claude Console **do not work** on the CPOA endpoint
- Workers authenticate via IAM (attach `AnthropicSelfHostedEnvironmentAccess` policy) or CPOA API key
- Use the `EnvironmentWorker` SDK helper (`.run()` / `.run_one()`) or call `GET /v1/environments/{id}/work/poll` directly

### 5. IAM Permissions

Different policies for different use cases:

- **Inference** (`/v1/messages`): Attach `AnthropicInferenceAccess` managed policy (includes `CreateInference`)
- **Self-hosted workers**: Attach `AnthropicSelfHostedEnvironmentAccess` managed policy (includes `ProcessEnvironmentWork`, `GetEnvironment`, `GetSession`, `UpdateSession`, `GetSkill`, `CallWithBearerToken` — but NOT `CreateInference`)

A role with only `AnthropicSelfHostedEnvironmentAccess` will 403 on `/v1/messages`. Combine both policies if the worker also needs to make inference calls.

### 6. Security Comparison

CPOA advantages for sandboxed/multi-tenant environments:
- No long-lived secrets — IAM creds rotate hourly via STS
- IAM policy scoping — restrict to specific actions
- Condition keys — `aws:SourceVpc`, `aws:SourceAccount`
- CloudTrail audit — native AWS logging
- SCP enforcement at org level

Tradeoff: more operational complexity (IAM setup, workspace subscription, outbound web identity federation enablement).

## Common Pitfalls

1. **Missing workspace header** → 400 error. Use the platform SDK client (`AnthropicAWS`/`AnthropicAws`) which adds it automatically, or set `ANTHROPIC_AWS_WORKSPACE_ID` env var.
2. **Outbound web identity federation disabled** → Every request fails with "Outbound web identity federation is disabled for your account". Run `aws iam enable-outbound-web-identity-federation` once per AWS account.
3. **Using Claude Console environment keys on CPOA** → Won't work. Workers on CPOA authenticate via IAM or CPOA API key instead.
4. **Confusing IAM policies** → `AnthropicSelfHostedEnvironmentAccess` does NOT grant inference. Need `AnthropicInferenceAccess` for `/v1/messages`.
5. **Region not set** → Unlike `AnthropicBedrock` (which falls back to `us-east-1`), the platform client raises an error if no region is set.
6. **Account not CPOA-subscribed** → SigV4 will fail; ensure the AWS account has completed Claude Platform on AWS sign-up.
