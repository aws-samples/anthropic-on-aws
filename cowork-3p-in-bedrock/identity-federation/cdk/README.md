# Cowork 3P on Bedrock — Federation CDK

A self-contained AWS CDK v2 (TypeScript) app that provisions the AWS-side
infrastructure required for **Direct IdP federation** into Amazon Bedrock
for Claude Cowork 3P.

Mirrors the pattern in the AWS Machine Learning blog post
[Claude Code deployment patterns and best practices with Amazon Bedrock][blog],
adapted for Cowork Desktop's AWS profile + `credential_process` configuration.

[blog]: https://aws.amazon.com/blogs/machine-learning/claude-code-deployment-patterns-and-best-practices-with-amazon-bedrock/

---

## What it deploys

Two stacks. Deploy one or both depending on your scenario.

### 1. `CoworkFederationStack` (always)

- **IAM OIDC identity provider** pointing at your IdP's issuer URL
- **IAM role** (`CoworkBedrockUser`) with an `sts:AssumeRoleWithWebIdentity`
  trust policy scoped to that provider and a specific audience claim
- **IAM managed policy** granting least-privilege Bedrock access to Claude
  foundation models and inference profiles, constrained to the AWS regions
  you allow
- CloudFormation outputs with everything the Cowork credential helper needs
  (role ARN, OIDC provider ARN, issuer URL)

### 2. `CoworkCognitoStack` (optional — `--context createCognito=true`)

Skips if you already have an IdP (Entra, Okta, Auth0, Google Workspace).
When enabled, creates:

- **Cognito User Pool** with email sign-in and strong password policy
- **User Pool domain** (Cognito hosted UI) for the OIDC authorization flow
- **App client** configured for Authorization Code + PKCE with a loopback
  callback on `http://localhost:8765` (what the helper script listens on)
- Outputs: issuer URL, client ID, hosted-UI URL

When the Cognito stack is deployed, its issuer is fed automatically into the
federation stack.

## Prerequisites

- Node.js 18+ and npm
- AWS CDK v2 (`npm install -g aws-cdk` or use `npx cdk`)
- AWS credentials for the target account with permission to create IAM roles,
  IAM OIDC providers, and (optionally) Cognito user pools
- CDK bootstrapped in the target account/region (`cdk bootstrap`)
- Claude model access already granted in Amazon Bedrock for the region(s) you
  plan to use. This stack does **not** enable model access — that's a one-time
  console action per account.

## Quick start

```bash
cd cowork-3p-in-bedrock/identity-federation/cdk
npm install
npm run build

# Bootstrap CDK (one-time per account+region)
npx cdk bootstrap --profile default aws://<ACCOUNT_ID>/us-west-2
```

### Scenario A — Create a fresh Cognito user pool (no existing IdP)

```bash
npx cdk deploy --all \
  --profile default \
  --context createCognito=true \
  --context bedrockRegions=us-west-2,us-east-1 \
  --context cognitoDomainPrefix=my-cowork-$RANDOM
```

Outputs a role ARN, an issuer URL, a client ID, and a hosted-UI URL. Feed
them to the helper script (see parent README) and create a first user with:

```bash
aws cognito-idp admin-create-user \
  --user-pool-id <UserPoolId-from-output> \
  --username alice@example.com \
  --user-attributes Name=email,Value=alice@example.com Name=email_verified,Value=true \
  --profile default --region us-west-2
```

### Scenario B — Federate with your existing IdP

Works for Entra ID, Okta, Auth0, Google Workspace, or any OIDC provider.

```bash
# Example: Entra ID
npx cdk deploy CoworkFederationStack \
  --profile default \
  --context issuerUrl=https://login.microsoftonline.com/<TENANT_ID>/v2.0 \
  --context audience=<YOUR_APP_CLIENT_ID> \
  --context bedrockRegions=us-west-2,us-east-1
```

```bash
# Example: Okta
npx cdk deploy CoworkFederationStack \
  --profile default \
  --context issuerUrl=https://<ORG>.okta.com/oauth2/default \
  --context audience=<YOUR_APP_CLIENT_ID> \
  --context bedrockRegions=us-west-2
```

In your IdP's app registration, add `http://localhost:8765/callback` as an
allowed redirect URI.

## Context parameters

| Key | Required | Default | Description |
|---|---|---|---|
| `createCognito` | No | `false` | If `true`, also deploys `CoworkCognitoStack` and auto-wires its issuer into the federation stack |
| `issuerUrl` | When `createCognito=false` | — | OIDC issuer URL of your IdP |
| `audience` | When `createCognito=false` | — | Expected `aud` claim (usually your app client ID) |
| `bedrockRegions` | No | `us-west-2` | Comma-separated list of regions the role may invoke Bedrock in |
| `allowedModels` | No | Claude Opus, Sonnet, Haiku inference-profile ARN patterns | Comma-separated list of model ARN patterns to allow |
| `roleName` | No | `CoworkBedrockUser` | IAM role name |
| `sessionDurationHours` | No | `12` | Max session duration in hours (1–12) |
| `cognitoDomainPrefix` | No | auto-generated | Globally unique prefix for the Cognito hosted-UI domain |
| `cognitoCallbackPort` | No | `8765` | Loopback port the helper listens on |

## Architecture

```
┌─────────────────┐        ┌──────────────────┐        ┌────────────────┐
│  Claude Cowork  │◀──────▶│  Helper script   │◀──────▶│   Your IdP     │
│    Desktop      │  stdout│  (OIDC + STS)    │  OAuth │  (Cognito, Entra,│
│                 │  creds │                  │  PKCE  │   Okta, …)     │
└────────┬────────┘        └─────────┬────────┘        └────────────────┘
         │                           │
         │ InvokeModel               │ AssumeRoleWithWebIdentity
         ▼                           ▼
    ┌──────────┐                ┌─────────┐
    │ Amazon   │◀───── IAM Role ┤  AWS    │
    │ Bedrock  │   (temp creds) │  STS    │
    └──────────┘                └─────────┘
```

Components created by this CDK app (dashed box) sit on the AWS side.

## Security posture

- **No long-lived AWS credentials.** The role is assumed via
  `sts:AssumeRoleWithWebIdentity`, yielding temporary credentials scoped to
  the session. Cowork caches them for the helper TTL (default 1 h) and asks
  for fresh ones when that expires.
- **User attribution.** The assumed-role session carries the IdP's `sub` as
  the source identity, so CloudTrail shows which person called each
  `InvokeModel`.
- **Least-privilege IAM.** Only `bedrock:InvokeModel*` and read-only
  `bedrock:List*`/`Get*` on specific Claude model ARNs, gated by
  `aws:RequestedRegion`.
- **No conversation data stored anywhere this stack creates.** Conversations
  live only on the user's device (per Cowork architecture).

## Clean up

```bash
npx cdk destroy --all --profile default
```

Destroys the OIDC provider, role, policy, and (if deployed) Cognito user
pool. Bedrock model-access settings and any model weights are unaffected.

## Adapting to other IdPs

All three IdPs below work by changing only two context values
(`issuerUrl`, `audience`) and adding a redirect URI on the IdP side.

| IdP | `issuerUrl` format | Redirect URI to register |
|---|---|---|
| Cognito | `https://cognito-idp.<region>.amazonaws.com/<pool-id>` | auto-set if you use `CoworkCognitoStack` |
| Entra ID | `https://login.microsoftonline.com/<tenant-id>/v2.0` | `http://localhost:8765/callback` |
| Okta | `https://<org>.okta.com/oauth2/default` | `http://localhost:8765/callback` |
| Auth0 | `https://<tenant>.auth0.com/` | `http://localhost:8765/callback` |
| Google Workspace | `https://accounts.google.com` | `http://localhost:8765/callback` |

For Entra/Okta/etc., the app registration on the IdP side is a one-time
manual step — CDK cannot provision it.
