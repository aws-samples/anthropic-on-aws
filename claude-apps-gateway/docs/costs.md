# Cost

What this example bills at its defaults, and what changing the network security
posture saves. This is the **infrastructure** bill: what the stack costs to run
before anyone signs in. Figures are **us-east-1, stack defaults, 730 hours/month**;
rates vary by region.

There is no license or per-seat fee for the gateway. Bedrock inference is billed
separately and the gateway adds no margin — the per-token rate is whatever the
inference profile in `gateway.yaml`'s `models:` block costs when called directly.
That rate is not uniform across profiles: the **global** profiles this example
defaults to bill at list price, while the geo/regional profiles you would switch to
for data residency are priced above global. Which profile to run is a residency
decision, not a cost-reduction lever, so it is out of scope here — see
[Regions & data residency](../cdk/README.md#regions--data-residency).

---

## Baseline

Idle, before any inference traffic:

| Line item | Per day | Per month | Rate |
|---|---|---|---|
| 6 interface VPC endpoints × 2 AZs | ~$2.88 | ~$88 | 12 ENIs at $0.01 per AZ-hour, + $0.01/GB |
| ECS Fargate, 2 tasks (0.5 vCPU, 1 GB) | ~$1.19 | ~$36 | $0.04048/vCPU-hr + $0.004445/GB-hr; gateway + ADOT sidecar share the task |
| NAT gateway | ~$1.08 | ~$33 | $0.045/hr, + $0.045/GB |
| Application Load Balancer | ~$0.54 | ~$16 | $0.0225/hr, + LCU charges |
| RDS `db.t4g.micro`, single-AZ, 20 GB gp3 | ~$0.46 | ~$14 | $0.016/hr + $0.115/GB-month |
| Secrets Manager, 3 secrets | ~$0.04 | ~$1.20 | $0.40/secret/month — jwt, OIDC client, RDS-managed |
| ACM certificate | free | free | |
| S3 gateway endpoint | free | free | Gateway endpoints have no hourly or per-GB charge |
| **Total** | **~$6.20** | **~$188** | |

Two line items above scale with traffic rather than sitting flat: CloudWatch Logs
ingestion ($0.50/GB, cents/day at idle) and the custom metrics the ADOT sidecar
publishes ($0.30 per metric per month). Neither is material until developers are
actually signing in, and both are then dwarfed by inference.

**Client VPN**, if you built the sketch in [`connectivity.md`](connectivity.md) to
give laptops a private path: ~$2.40/day (~$73/month) per subnet association, plus
$0.05/hour per connected developer.

---

## Endpoint posture

### How it works today

The stack creates six interface endpoints so that no AWS-service traffic leaves
the VPC. The tasks also sit in `PRIVATE_WITH_EGRESS` subnets behind a NAT
gateway, and **NAT cannot be removed**: the gateway makes server-side calls to
the OIDC issuer for discovery, JWKS, and the token exchange, which is internet
egress for a public IdP (Okta, Entra, Google Workspace). See
`cdk/lib/claude-gateway-stack.ts:122`.

Every service the endpoints cover is therefore also reachable over NAT. Removing
an endpoint does not break function; that leg falls back to the public AWS
endpoint over NAT, with no error raised. The endpoint buys the private path only.

### What each endpoint protects

| Endpoint | Traffic on that leg | Frequency |
|---|---|---|
| Bedrock runtime | Prompts and completions | Every request |
| CloudWatch Logs + monitoring | Auth events, `user.email`, `user.id`. No prompt content | Continuous |
| Secrets Manager | OIDC client secret, DB password | Task start |
| ECR API + Docker | Image manifests and auth tokens | Task start |

Removing the two ECR endpoints does not send image data over NAT. Layer
downloads are S3 presigned URLs routed through the free S3 gateway endpoint, so
only manifest and auth calls become public.

### Options

| Posture | Endpoints | Endpoint cost | Stack total | Over NAT instead of PrivateLink |
|---|---|---|---|---|
| Full private (default) | 6 × 2 AZ | ~$88 | ~$188 | IdP leg only |
| Private inference | Bedrock only, 1 × 2 AZ | ~$15 | ~$115 | Secrets at task start, ECR metadata, logs, metrics |
| NAT only | none | $0 | ~$100 | All AWS-service traffic, including prompts |

Each leg that moves to NAT picks up NAT data processing at $0.045/GB, so "NAT only"
is not quite a clean $88 saving once prompt volume is real.


- **Private inference:** comment out the five non-Bedrock `addIfaceEndpoint` calls
  at `cdk/lib/claude-gateway-stack.ts:153-157`, keeping `BedrockRuntimeEndpoint`
  and the S3 gateway endpoint. Mirror in `setup.sh`.
- **NAT only:** `-c createVpcEndpoints=false`. This also drops the free S3 gateway
  endpoint. The flag exists for VPC reuse
  ([`../cdk/README.md`](../cdk/README.md#cdk-context-variables)), where the reused
  VPC already provides the same private egress; on a fresh VPC it is a posture
  change.

### Before removing the Bedrock endpoint

- **Check for an `aws:SourceVpce` condition.** If an SCP, a Bedrock resource
  policy, or a Config rule requires private connectivity for this workload,
  removing the endpoint denies access rather than degrading posture.
- **Know which claim changes.** "No data to Anthropic" is unaffected, since
  Bedrock is an AWS service either way. What changes is the "AWS traffic never
  leaves the VPC" statement in
  [`../cdk/README.md`](../cdk/README.md#regions--data-residency). Retaining the
  Bedrock endpoint keeps that true for prompt content.

---

## Reductions that do not change security posture

**Reuse an existing VPC.** If a VPC already has these interface endpoints and a
NAT gateway:

```bash
-c vpcId=vpc-0123456789abcdef -c createVpcEndpoints=false
```

Moves ~$121/month off this workload onto shared infrastructure. Authorise 443
from the task security group on those endpoints; see the `vpcId` /
`createVpcEndpoints` rows in
[`../cdk/README.md`](../cdk/README.md#cdk-context-variables).

**Single-AZ endpoints (non-production).** Interface endpoints bill per ENI, one
per subnet, and CDK places them in both private subnets. One AZ halves whichever
posture above (~$44/month on full private, ~$7 on private inference). Tasks in
the other AZ then reach the endpoint cross-AZ, adding per-GB transfer and an AZ
dependency that partly negates `desiredCount: 2`.

**Log retention.** The gateway log group defaults to three months
(`cdk/lib/claude-gateway-stack.ts:230`). Set it to the audit requirement; the
OTLP metrics, not the logs, are the analytics surface.

**Tear down when idle.** A demo or pilot bills ~$188/month whether or not anyone
signs in. See [`teardown.md`](teardown.md).

---

## One inference-cost note

Not a lever, just a thing to know: from gateway 2.1.260 an aborted request's input
tokens are counted with Bedrock's free `CountTokens` API instead of a billable
`max_tokens:1` probe — which is why the task role grants `bedrock:CountTokens`. Of
this example's catalog only Haiku 4.5 supports it today, so Opus 5 and Sonnet 5 still
take the probe. This example pins **2.1.274**, so the behaviour is present.

