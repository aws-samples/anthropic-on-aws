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

1. **Bedrock model access** enabled in the console for each Claude model in
   `gateway.yaml`'s `availableModels`. The gateway uses **global** cross-region
   inference profiles (`global.anthropic.*`), which route to any commercial region,
   so enable access in your source region and any region global may route to. Missing
   this yields `AccessDeniedException` on invoke even when IAM is correct. Verify it up
   front with a 5-token invoke per model (success = access is enabled):

   ```bash
   aws bedrock-runtime converse --model-id global.anthropic.claude-sonnet-5 \
     --messages '[{"role":"user","content":[{"text":"ping"}]}]' \
     --inference-config '{"maxTokens":5}' >/dev/null && echo model access OK
   ```

   Not every model has a short-alias inference profile. `claude-opus-5`,
   `claude-sonnet-5`, and `claude-fable-5` do, but **Haiku 4.5 exists only as the
   dated profile** `global.anthropic.claude-haiku-4-5-20251001-v1:0` — the short
   `global.anthropic.claude-haiku-4-5` is rejected as `ValidationException: invalid`.
   Run `aws bedrock list-inference-profiles` for the exact IDs. In `gateway.yaml`'s
   `models:` block the friendly name (`claude-haiku-4-5`) maps to the dated profile;
   for data residency, swap the `global.` prefix for a geo profile (`us.`/`eu.`/`au.`, plus
   and `jp.` for some models — geo coverage varies per model).
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

> Reusing a VPC with `VPC_ID` has constraints — fixed subnet CIDRs, and endpoint
> security groups you must authorize yourself. See
> [Reusing an existing VPC](#reusing-an-existing-vpc).

## Track B — CDK (two-pass)

The stack is parameterized by **CDK context** (`-c key=value`); the full table is in
[`../cdk/README.md`](../cdk/README.md#cdk-context-variables). Two passes because the
ECS service needs the image to exist first.

**Pass 1 — create the ECR repo** (first deploy only):

```bash
cd cdk
npm install
npx cdk bootstrap -c imageReady=false    # first time in the account/region only
npx cdk deploy -c imageReady=false
```

> [!CAUTION]
> Run pass 1 **only on a first deploy**. Its template holds one resource, so
> deploying it over a stack that already reached pass 2 tells CloudFormation to
> delete everything else — the RDS instance and its data included. To update an
> existing deployment, build the image and run **pass 2 only**. (`deploy.sh` skips
> pass 1 automatically when the stack exists.)

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
CLAUDE_VERSION=2.1.229
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

> Reusing a VPC: `-c vpcId=vpc-...` and, if it already has the service endpoints,
> `-c createVpcEndpoints=false`. Read
> [Reusing an existing VPC](#reusing-an-existing-vpc) first — the endpoint SGs need
> authorizing by hand, and the ordering is fiddly.

The stack creates `claude-gateway-oidc-client-secret` with a CDK-**generated**
placeholder (a real secret can't ride in CDK context — it would land in
`cdk.context.json`). The value is generated, not a fixed string, on purpose:
CloudFormation sets it only at create time and never overwrites it on later
deploys, so the real value you seed below survives future `cdk deploy` runs.
After pass 2, set the real value and bounce the service so tasks pick it up:

```bash
aws secretsmanager put-secret-value --secret-id claude-gateway-oidc-client-secret \
  --secret-string '<your-oidc-client-secret>'
aws ecs update-service --cluster claude-gateway --service claude-gateway --force-new-deployment
```

To roll a new image later: push a new tag, then re-run pass 2 with
`-c imageTag=<tag>`.

> [!IMPORTANT]
> **A config change needs a new image tag.** `gateway.yaml` is baked into the image,
> not mounted (ECS `secrets:` injects env vars only, never files — see
> [`gotchas.md` §13](gotchas.md#13-config-is-baked--the-image-is-per-environment)), so
> editing `gateway.yaml.template` has no effect until you rebuild **and** point the
> service at the new image. The tag above is the bare `CLAUDE_VERSION`, which does not
> change when only the config does — so re-running the build would overwrite
> `:2.1.229` in place, and re-running pass 2 with the same `-c imageTag` leaves the
> task definition unchanged, meaning ECS may not redeploy at all. Either symptom looks
> like a successful deploy that silently kept the old config.
>
> Include the config in the tag so this can't happen (this is what `setup.sh` does by
> default):
>
> ```bash
> CONFIG_HASH=$(shasum -a 256 gateway.yaml | cut -c1-12)
> IMAGE_TAG="${CLAUDE_VERSION}-${CONFIG_HASH}"
> docker build --platform=linux/amd64 --provenance=false -t "${ECR_URI}:${IMAGE_TAG}" .
> docker push "${ECR_URI}:${IMAGE_TAG}"
> # then pass 2 with the matching tag:
> npx cdk deploy -c imageTag="${IMAGE_TAG}" ...
> ```

> [!NOTE]
> `cdk/scripts/deploy.sh` is a separate convenience script that runs both passes
> from `.env`: it maps your values onto the CDK context above and builds the image in
> CodeBuild, so no local Docker is needed. It shares this track's tracked
> `Dockerfile` and `stamp-config.sh` (distroless image, placeholder guard) and builds
> the same `--platform=linux/amd64 --provenance=false` image. Two differences from the
> walkthrough above: it uses whatever `claude` binary you have already staged rather
> than downloading and SHA-verifying one itself, and it pushes `:latest` rather than a
> config-hashed tag — so re-read the config-tag box above before treating `:latest` as
> a record of what is deployed.

## Reusing an existing VPC

Both tracks can deploy into a VPC you already have — `VPC_ID=vpc-...` for `setup.sh`,
`-c vpcId=vpc-...` for CDK — typically to keep an existing Client VPN association
intact. Three things to know.

**CIDR.** `setup.sh` creates subnets at fixed CIDRs (`10.20.0.0/24`, `10.20.1.0/24`,
`10.20.10.0/24`, `10.20.11.0/24`), so the VPC must be `10.20.0.0/16` or a superset
with those four ranges free; anything else fails at `create-subnet`. The CDK track
imports the VPC's existing subnets instead, so any CIDR works.

**Endpoint security groups.** If the VPC already has the Bedrock / Secrets Manager /
ECR / CloudWatch **interface** endpoints, tell the CDK track not to recreate them with
`CREATE_VPC_ENDPOINTS=false` (`deploy.sh`) or `-c createVpcEndpoints=false` (by hand)
— AWS allows one private-DNS endpoint per service per VPC. `setup.sh` has no such
flag and needs none: it describes before creating, so it adopts endpoints already in
the VPC. Neither track then touches those endpoints' security groups, so **you** must
allow 443 from the gateway task SG on each, or tasks time out fetching secrets,
images, and logs. S3 is a *gateway* endpoint: no SG, no 443 — it just needs an
association with the tasks' private route table.

**Ordering, which differs by track.** `setup.sh` creates its task SG (`$P-task-sg`)
before tasks start: authorize it, then re-run. CDK's `TaskSg` exists only in pass 2,
so it can't be preauthorized — and a pass 2 that can't stabilize normally rolls back
and *deletes* the SG you were about to authorize. Deploy that pass with rollback
disabled so it survives:

```bash
npx cdk deploy --no-rollback ...   # by hand
NO_ROLLBACK=1 ./scripts/deploy.sh  # or via deploy.sh
```

Then authorize 443 from `TaskSg` on the interface endpoints' SGs and deploy **pass 2
only** — never re-run pass 1 (see the caution under [Track B](#track-b--cdk-two-pass));
`deploy.sh` skips it for you.

A `--no-rollback` failure leaves the stack in `UPDATE_FAILED`. From there, either
retry the update (that redeploy) or abandon it with `npx cdk rollback` /
`aws cloudformation rollback-stack`. `continue-update-rollback` does **not** apply —
it only accepts `UPDATE_ROLLBACK_FAILED`. Having to make that call by hand is why
neither path disables rollback by default.

Set `NO_ROLLBACK=1` **per run**, as above — don't export it or put it in `.env`.
CloudFormation refuses an update that requires *replacing* a resource while rollback
is disabled, so a leftover `NO_ROLLBACK=1` makes some unrelated later change fail for
a reason that has nothing to do with the change.

Tearing down a reused VPC needs care too — see
[Reused VPC](teardown.md#reused-vpc) in the teardown guide.

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
  "forceLoginGatewayUrl": "https://claude-gateway.example.com",
  "parentSettingsBehavior": "merge"
}
```

| Platform | Path |
|---|---|
| macOS | `/Library/Application Support/ClaudeCode/managed-settings.json` |
| Linux / WSL | `/etc/claude-code/managed-settings.json` |
| Windows | `C:\Program Files\ClaudeCode\managed-settings.json` |

`parentSettingsBehavior: "merge"` is the key that's easy to drop. Claude Code ignores
settings supplied by a launching process (*parent settings*) on any machine with an
admin-deployed managed source unless the winning source sets it — and Claude Desktop
delivers the gateway's policy to the embedded Claude Code sessions it launches *as* parent
settings. Omit it and those sessions run unpoliced with no warning. Only the
highest-priority admin source's value counts and the sources don't merge, so if you deliver
policy via an HKLM registry policy or a macOS managed-preferences plist (both outrank the
`managed-settings.json` file), put all three keys there instead — and mirror
`parentSettingsBehavior` into the gateway policy's `cli` block, which outranks both on
connected machines.

Publish the cert's SHA-256 fingerprint (printed by `setup.sh`, or the
`CertFingerprintHint` stack output) so developers can confirm the prompt on first
`/login`. (A public, browser-trusted ACM cert shows no prompt — see prerequisite 2.)

### Claude Desktop

Claude Desktop connects to the same gateway, but through Desktop's own managed
configuration and a different key — `bootstrapUrl`, pointed at `<public_url>/user/bootstrap`
— plus a server-side opt-in: the policy matching the user must carry a `desktop` key or
`/user/bootstrap` returns `404`. The gateway server must be on v2.1.203 or later (this
example pins 2.1.229). Desktop then runs the same browser SSO and fetches its config from
the gateway; per-group model access and policy match the CLI's. The endpoint shares the
gateway's host and port, so the ALB needs no extra listener rule. See the
[config reference](https://code.claude.com/docs/en/claude-apps-gateway-config#claude-desktop-overlay)
and the README's capability 2 for the `desktop:` feature gates.

## Telemetry

`gateway.yaml`'s `telemetry.forward_to` sends OTLP metrics to an **ADOT collector
sidecar** running in the same Fargate task. The gateway pushes to
`http://localhost:4318` (the ADOT collector's OTLP receiver), and the collector
forwards to CloudWatch's native OTLP endpoint using **SigV4 via the ECS task
role** — no bearer token or API key, so no key rotation or expiration concerns.

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

### CloudWatch Coding Agent Insights

Because the sidecar forwards to CloudWatch's **native OTLP metrics endpoint**
(`monitoring.<region>.amazonaws.com/v1/metrics`), these metrics also populate
**[Coding Agent Insights](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/coding-agents-insights.html)** —
ready-made dashboards under the console's **GenAI Observability → Coding Agent
Insights** (Claude Code tab). No extra wiring beyond the telemetry setup above; the
dashboards appear automatically and populate from metrics in the expected OTel shape.
AWS's [gateway setup guide](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/coding-agents-claude-code-gateway.html)
describes this path, and our ADOT config mirrors AWS's recommended metrics-collector
config (same `otlphttp`→`monitoring/v1/metrics` exporter, `sigv4auth` service
`monitoring`, `cloudwatch:PutMetricData` via the task role). These native-OTLP metrics
are queryable with PromQL and live in the GenAI Observability store — they do **not**
appear under classic CloudWatch `list-metrics`.

**What populates automatically.** The gateway stamps each export with the signed-in
developer's identity as OTel *resource* attributes — `user.email`, `user.id`,
`identity.source` — and Claude Code adds `model` and token `type`. So the per-user,
per-model, and per-token-type views work with no developer- or admin-side config.

**By team / department / cost center is *not* automatic.** The gateway's identity
stamping is user-level only; it does not emit `team.id`, `department`, `cost_center`,
or `organization`. It does stamp `user.groups` when your IdP emits them, but that lands
as a *comma-separated string* of all group memberships — it is not one of the
dashboards' grouping dimensions and does not become `team.id`/`department` on its own.
To drive the team/department/cost-center segments, push them as resource attributes via
[`OTEL_RESOURCE_ATTRIBUTES`](https://code.claude.com/docs/en/monitoring-usage) (a
standard OpenTelemetry variable the CLI honors) through a group-scoped
[managed policy](https://code.claude.com/docs/en/claude-apps-gateway-config#managed)'s
`env` block:

```yaml
managed:
  policies:
    - match: { groups: [team-payments] }
      cli:
        env:
          OTEL_RESOURCE_ATTRIBUTES: "team.id=payments,department=engineering,cost_center=CC-1234"
```

The CLI stamps these into the OTLP resource block, the gateway relays them verbatim,
and CloudWatch retains them so the by-team/department/cost-center dashboard segments
populate. The values are static per policy, so you map one policy per team/group rather
than deriving attributes from a directory. `OTEL_RESOURCE_ATTRIBUTES` isn't on the CLI's `env` safe list, so it rides
the same one-time managed-settings approval dialog the pushed OTLP endpoint already
triggers.

**Availability.** Coding Agent Insights is in all commercial regions except Middle
East (UAE), Middle East (Bahrain), and Israel (Tel Aviv). Standard CloudWatch OTLP
metric-ingestion pricing applies.

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
