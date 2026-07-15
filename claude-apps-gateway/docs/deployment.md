# Deployment guide

The canonical install walkthrough for this example: prerequisites, then one of two
deployment tracks, then verification. Both tracks provision the **same** ECS Fargate
deployment (internal ALB, RDS PostgreSQL, ECR, Secrets Manager, IAM task role);
pick by what you want:

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
   yields `AccessDeniedException` on invoke even when IAM is correct. Verify it up
   front with a 5-token invoke per model (success = access is enabled):

   ```bash
   aws bedrock-runtime converse --model-id us.anthropic.claude-sonnet-5 \
     --messages '[{"role":"user","content":[{"text":"ping"}]}]' \
     --inference-config '{"maxTokens":5}' >/dev/null && echo model access OK
   ```

   Not every model has a short-alias inference profile. `claude-opus-4-8`,
   `claude-sonnet-5`, and `claude-fable-5` do, but **Haiku 4.5 exists only as the
   dated profile** `us.anthropic.claude-haiku-4-5-20251001-v1:0` — the short
   `us.anthropic.claude-haiku-4-5` is rejected as `ValidationException: invalid`.
   Run `aws bedrock list-inference-profiles` for the exact IDs. This caveat only
   affects this manual check; in `gateway.yaml` you still list the **friendly**
   name (`claude-haiku-4-5`) and the gateway's built-in catalog resolves it to the
   right profile.
2. **An ACM cert** for your gateway hostname, passed as `CERT_ARN` / `-c certArn`.
   On first `/login` the CLI pins the cert's SHA-256 fingerprint and prompts the
   developer to confirm it — intended behavior (the CLI pinning the authentic
   gateway). **Want no first-login prompt?** Request a **public** ACM cert for the
   hostname, DNS-validate it, and pass its ARN as `CERT_ARN`: ACM public certs
   validate by DNS, not endpoint reachability, so the cert is browser-trusted with
   no prompt while the ALB stays internal.
3. **A Route 53 hosted zone** (`ZONE_ID`/`ZONE_NAME` / `-c zoneId -c zoneName`)
   for the gateway A-record. The real requirement is that the hostname resolves
   to a **private** IP on developer laptops — the CLI rejects public gateway
   addresses. Two topologies satisfy it:
   - **Public zone, private answer** (simplest, verified live): put the A-record
     in the public delegated zone; it answers the internal ALB's private IPs, so
     laptops need no special DNS — only a network route into the VPC. On Track B
     (CDK), pass `-c zoneId` explicitly for this topology: the automatic zone
     lookup filters for a *private* zone (`fromLookup(..., { privateZone: true })`)
     and won't find a public one.
   - **Private hosted zone**: keeps the record out of the public DNS tree, but
     note the example does **not** associate the zone with the VPC it creates
     (associate it yourself for in-VPC resolution), and off-VPC laptops then need
     a Route 53 Resolver inbound endpoint or corp-DNS forwarding — see
     [`connectivity.md`](connectivity.md).
4. **Connectivity + private DNS from developer laptops to the internal ALB** — a
   VPN / Direct Connect / Transit Gateway path. This is the #1 "internal ALB doesn't
   work from my laptop" failure — see [`connectivity.md`](connectivity.md).
5. **An OIDC client** registered in your IdP with redirect URI
   `<public_url>/oauth/callback`. Note the issuer URL, client ID, and client secret.
6. **Tooling**: `aws` CLI with credentials, a container tool (`setup.sh`
   auto-detects `docker`/`podman`/`finch`; override with `CONTAINER_TOOL=…`),
   `jq`, `openssl`, `gpg`, `curl`. Track A runs on stock macOS bash 3.2 — it
   deliberately avoids bash-4-isms (see [`gotchas.md`](gotchas.md) §13 before
   extending it). Track B additionally needs Node.js 18+
   (`npm install -g aws-cdk`).

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
OIDC_CLIENT_SECRET=your-oidc-client-secret \
ALLOWED_EMAIL_DOMAINS=example.com \
CERT_ARN=arn:aws:acm:us-east-1:123456789012:certificate/abc-123 \
ZONE_ID=Z0123456789ABCDEFGHIJ \
ZONE_NAME=example.com \
INGRESS_CIDR=10.100.0.0/16 \
cdk/scripts/setup.sh
```

> `INGRESS_CIDR` is the VPN/corp **client** CIDR developers
> connect from — **not** the VPC CIDR — *unless* that path is **AWS Client VPN**,
> which source-NATs client traffic to the association subnet's IP: then use the
> VPC CIDR (`10.20.0.0/16` for the VPC this script creates). See the Client VPN
> gotchas in [`connectivity.md`](connectivity.md).
>
> `OIDC_CLIENT_SECRET` is seeded straight into Secrets Manager (never baked into
> the image or logged). Prefer not to have it in your shell env? Omit it —
> preflight then fails fast with the `create-secret`/`put-secret-value` command
> to run out of band, after which a plain re-run works.

What it does, in order: stamps `gateway.yaml` from the template (refusing to
continue if any placeholder is unresolved), downloads the pinned `claude` binary and
verifies its SHA-256 against the GPG-signed release manifest, builds and pushes the
distroless image, then provisions VPC + endpoints, RDS, Secrets Manager, the
internal IPv4 ALB (idle timeout 3600s, `/healthz` health check), the gateway ECS
service, DNS, and IAM.

It is **idempotent** — re-run it any time to roll a new image or reconcile drift.
It finishes by printing the ALB hostname, the OAuth redirect URI to register, and
the cert SHA-256 fingerprint to publish to developers.

Optional flags: `VPC_ID=vpc-...` (reuse an existing VPC). The full list with
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

# Build (amd64, plain image — some runtimes reject buildx OCI indexes) and push.
# Building with podman/finch instead? Omit --provenance=false (buildx-only flag).
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
  -c certArn=arn:aws:acm:us-east-1:123456789012:certificate/abc-123 \
  -c ingressCidr=10.100.0.0/16
```

> Reusing a VPC: `-c vpcId=vpc-...` and, if it already has the
> service endpoints, `-c createVpcEndpoints=false`.

The stack creates `claude-gateway-oidc-client-secret` as a `REPLACE_ME`
placeholder (a real secret can't ride in CDK context — it would land in
`cdk.context.json`). After pass 2, set the real value and bounce the service so
tasks pick it up:

```bash
aws secretsmanager put-secret-value --secret-id claude-gateway-oidc-client-secret \
  --secret-string '<your-oidc-client-secret>'
aws ecs update-service --cluster claude-gateway --service claude-gateway --force-new-deployment
```

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

Publish the cert's SHA-256 fingerprint (printed by `setup.sh`, or the
`CertFingerprintHint` stack output) so developers can confirm the prompt on first
`/login`. (A public, browser-trusted ACM cert shows no prompt — see prerequisite 2.)

## Telemetry

`gateway.yaml`'s `telemetry.forward_to` sends OTLP metrics to an **ADOT collector
sidecar** running in the same Fargate task. The gateway pushes to
`http://localhost:4318` (the ADOT collector's OTLP receiver), and the agent forwards to
CloudWatch using **SigV4 via the ECS task role**. No
key rotation, no expiration concerns.

The ADOT sidecar:
- Authenticates automatically using the task role (needs `cloudwatch:PutMetricData`,
  already granted in the CDK stack / `setup.sh` IAM policy)
- Is marked **non-essential** — if the agent crashes, the gateway continues serving
  inference traffic uninterrupted
- Requires `CLAUDE_GATEWAY_ALLOW_LOOPBACK=1` on the gateway container (already set)
  to permit forwarding to a localhost destination (the gateway's SSRF guard blocks
  loopback by default)

Both tracks provision this automatically — no manual credential setup required for
telemetry. The task role's `cloudwatch:PutMetricData` permission is the only
prerequisite.

Metrics only: the ADOT sidecar in this example is configured for metrics. Logs and
traces need additional ADOT pipeline configuration and are out of scope here. See
[`workshop/03-telemetry/README.md`](../workshop/03-telemetry/README.md) and
[`gotchas.md`](gotchas.md) §1 for more.

## Cost expectations

A live deploy of this example idles at roughly **US$5–7/day** (us-east-1,
defaults). The two biggest line items are easy to miss: the **six interface VPC
endpoints × two AZs (~$2.90/day)** and the **NAT gateway (~$1.15/day + data)**;
Fargate (2× gateway) is ~$1/day, the ALB ~$0.60/day, RDS
`db.t4g.micro` ~$0.45/day. If you build the Client VPN sketch from
[`connectivity.md`](connectivity.md), add ~$2.40/day per subnet association plus
$0.05/h per connected client. Tear down when idle ([`teardown.md`](teardown.md)).

## Removing a deployment

CDK: `npx cdk destroy`. `setup.sh`: by hand, in reverse dependency order — follow
[`teardown.md`](teardown.md).
