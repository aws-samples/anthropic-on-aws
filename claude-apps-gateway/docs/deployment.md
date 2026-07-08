# Deployment guide

The canonical install walkthrough for this example: prerequisites, then one of two
deployment tracks, then verification. Both tracks provision the **same** ECS Fargate
deployment (internal ALB, RDS PostgreSQL, ECR, Secrets Manager, IAM task role,
ADOT telemetry collector); pick by what you want:

| Track | Tool | Best when | Teardown |
|---|---|---|---|
| **A — `setup.sh`** | idempotent `aws`-CLI script | You want to read/adapt every AWS call, no IaC abstraction | By hand ([`teardown.md`](teardown.md)) |
| **B — CDK** | TypeScript → CloudFormation | You want managed lifecycle, drift detection | `cdk destroy` |

EKS is a documented alternative, not automated — see [`eks-notes.md`](eks-notes.md).

> [!TIP]
> Read [`gotchas.md`](gotchas.md) before you deploy. Most gateway failures are in
> the environment around it (DNS, VPN, Bedrock model access), not the gateway.

## Prerequisites (both tracks)

These are **out of band** — the example does not create them, and missing any one is
a common failure:

1. **Bedrock model access** enabled in the console, **per region**, for each Claude
   model in `gateway.yaml`'s `availableModels`. For cross-region inference profiles
   (`us.anthropic.*`), enable it in **every region the profile spans**. Missing this
   yields `AccessDeniedException` on invoke even when IAM is correct.
2. **TLS — pick one.** Either **import** an ACM cert for your gateway hostname
   (`CERT_ARN` / `-c certArn`) — developers then confirm its SHA-256 fingerprint on
   first `/login` — or leave it unset for **managed public-cert mode**, which
   requests a DNS-validated public ACM cert for you (browser-trusted, no prompt).
   Managed mode needs a **public, delegated** Route 53 zone for the hostname's
   parent domain (`PUBLIC_ZONE_ID` + `PUBLIC_ZONE_NAME` / `-c publicZoneId
   -c publicZoneName`), used only for the ACM validation CNAME. See the TLS section
   in [`../cdk/README.md`](../cdk/README.md).
3. **A private Route 53 hosted zone** (`ZONE_ID`/`ZONE_NAME` / `-c zoneId
   -c zoneName`) for the gateway A-record. The hostname must resolve to a
   **private** IP — the CLI rejects public gateway addresses.
4. **Connectivity + private DNS from developer laptops to the internal ALB** — a
   VPN / Direct Connect / Transit Gateway path. This is the #1 "internal ALB doesn't
   work from my laptop" failure — see [`connectivity.md`](connectivity.md).
5. **An OIDC client** registered in your IdP with redirect URI
   `<public_url>/oauth/callback`. Note the issuer URL, client ID, and client secret.
6. **Tooling**: `aws` CLI with credentials, `docker` (or `podman`), `jq`, `openssl`,
   `gpg`, `curl`. Track A needs bash 4+ (macOS ships 3.2 — `brew install bash`).
   Track B additionally needs Node.js 18+ (`npm install -g aws-cdk`).

`public_url` is chosen **up front** — it's `https://claude-gateway.<your-zone>`,
known before anything is created — so neither track has a "deploy to learn the URL"
round trip.

## Track A — `setup.sh`

One command deploys end to end (the image is built and pushed before the service is
created, within the same run):

```bash
PUBLIC_URL=https://claude-gateway.example.com \
AWS_REGION=us-east-1 \
OIDC_ISSUER=https://example.okta.com \
OIDC_CLIENT_ID=0oa1example2 \
ALLOWED_EMAIL_DOMAINS=example.com \
PUBLIC_ZONE_ID=Z0PUBLICEXAMPLE \
PUBLIC_ZONE_NAME=example.com \
ZONE_ID=Z0123456789ABCDEFGHIJ \
ZONE_NAME=example.com \
INGRESS_CIDR=10.100.0.0/16 \
cdk/scripts/setup.sh
```

> Swap the two `PUBLIC_ZONE_*` lines for `CERT_ARN=arn:aws:acm:...` to use an
> imported cert instead. `INGRESS_CIDR` is the VPN/corp **client** CIDR developers
> connect from — **not** the VPC CIDR.

What it does, in order: stamps `gateway.yaml` from the template (refusing to
continue if any placeholder is unresolved), downloads the pinned `claude` binary and
verifies its SHA-256 against the GPG-signed release manifest, builds and pushes the
distroless image, then provisions VPC + endpoints, RDS, Secrets Manager, the
internal IPv4 ALB (idle timeout 3600s, `/healthz` health check), the ECS services
(gateway + ADOT collector), DNS, and IAM.

It is **idempotent** — re-run it any time to roll a new image or reconcile drift.
It finishes by printing the ALB hostname, the OAuth redirect URI to register, and
(imported-cert mode only) the cert SHA-256 fingerprint to publish to developers.

Optional flags: `ENABLE_DASHBOARD=true` (CloudWatch dashboard + ALB-5xx alarm),
`DAILY_COST_THRESHOLD_USD=50` (daily cost alarm), `ALARM_EMAIL=ops@example.com`
(SNS subscription), `VPC_ID=vpc-...` (reuse an existing VPC). The full list with
defaults is at the top of [`setup.sh`](../cdk/scripts/setup.sh).

## Track B — CDK (two-pass)

The stack is parameterized by **CDK context** (`-c key=value`); the full table is in
[`../cdk/README.md`](../cdk/README.md#cdk-context-variables). Two passes because the
ECS service needs the image to exist first.

**Pass 1 — create the ECR repo:**

```bash
cd cdk
npm install
npx cdk bootstrap        # first time in the account/region only
npx cdk deploy -c imageReady=false
```

**Between passes — build and push the image** to the ECR URI from the pass-1
output. The stamped config and verified binary must sit next to the `Dockerfile` in
`cdk/`:

```bash
# Stamp gateway.yaml from the template (fails if any placeholder is unresolved)
PUBLIC_URL=https://claude-gateway.example.com AWS_REGION=us-east-1 \
OIDC_ISSUER=https://example.okta.com OIDC_CLIENT_ID=0oa1example2 \
ALLOWED_EMAIL_DOMAINS=example.com \
./scripts/stamp-config.sh

# Download the pinned linux-x64 binary and verify it (versions must match the
# claudeVersion pin in bin/app.ts). setup.sh's phase 2 shows the full
# GPG-signed-manifest verification; the abbreviated form:
CLAUDE_VERSION=2.1.199
curl -fL -o claude "https://downloads.claude.ai/claude-code-releases/${CLAUDE_VERSION}/linux-x64/claude"
curl -fsSL "https://downloads.claude.ai/claude-code-releases/${CLAUDE_VERSION}/manifest.json" \
  | jq -r '.platforms["linux-x64"].checksum' | xargs -I{} sh -c 'echo "{}  claude" | shasum -a 256 -c'

# Build (amd64, plain image — some runtimes reject buildx OCI indexes) and push
ECR_URI=<EcrRepositoryUri from pass-1 outputs>
aws ecr get-login-password | docker login --username AWS --password-stdin "${ECR_URI%%/*}"
docker build --platform=linux/amd64 --provenance=false -t "${ECR_URI}:${CLAUDE_VERSION}" .
docker push "${ECR_URI}:${CLAUDE_VERSION}"
```

**Pass 2 — deploy the full stack:**

```bash
npx cdk deploy \
  -c publicUrl=https://claude-gateway.example.com \
  -c zoneName=example.com -c zoneId=Z0123456789ABCDEFGHIJ \
  -c publicZoneId=Z0PUBLICEXAMPLE -c publicZoneName=example.com \
  -c ingressCidr=10.100.0.0/16
```

> Swap the `publicZone*` line for `-c certArn=arn:aws:acm:...` to use an imported
> cert. Add `-c enableDashboard=true` (and optionally
> `-c dailyCostThresholdUsd=50 -c alarmEmail=ops@example.com`) for the CloudWatch
> dashboard + alarms. Reusing a VPC: `-c vpcId=vpc-...` and, if it already has the
> service endpoints, `-c createVpcEndpoints=false`.

To roll a new image later: push a new tag, then re-run pass 2 with
`-c imageTag=<tag>`.

> [!NOTE]
> `cdk/scripts/deploy.sh` is a separate convenience script that builds the image
> via CodeBuild using its own inline Dockerfile and config. It does **not** use the
> hardened build path above (distroless image, SHA-verified binary, placeholder
> guard) and does not pass CDK context, so this guide — not that script — is the
> supported route.

## Verify

Run these in order; each failure points at a different layer:

```bash
# 1. Gateway is up and OIDC discovery works (TLS + ALB + task healthy)
curl https://claude-gateway.example.com/.well-known/oauth-authorization-server

# 2. Postgres is writable (device-auth flow works end to end)
curl -X POST https://claude-gateway.example.com/oauth/device_authorization

# 3. Full sign-in from a developer laptop (on the VPN)
claude /login
```

Both must return JSON. If (1) times out, it's connectivity/DNS
([`connectivity.md`](connectivity.md)); if (1) works but (2) errors, check RDS and
the task logs in CloudWatch (`/claude-gateway/gateway`).

Then push the managed-settings file to developer machines via MDM:

```json
{
  "forceLoginMethod": "gateway",
  "forceLoginGatewayUrl": "https://claude-gateway.example.com"
}
```

| Platform | Path |
|---|---|
| macOS | `/Library/Application Support/ClaudeCode/managed-settings.json` |
| Linux / WSL | `/etc/claude-code/managed-settings.json` |
| Windows | `C:\Program Files\ClaudeCode\managed-settings.json` |

In imported-cert mode, publish the cert's SHA-256 fingerprint (printed by
`setup.sh`, or the `CertFingerprintHint` stack output) so developers can confirm the
prompt on first `/login`. Managed-cert mode shows no prompt.

## Removing a deployment

CDK: `npx cdk destroy`. `setup.sh`: by hand, in reverse dependency order — follow
[`teardown.md`](teardown.md).
