# Cost

What this example bills at its defaults, and what changing the network security
posture saves. Figures are **us-east-1, stack defaults**; rates vary by region.

There is no license or per-seat fee for the gateway. Bedrock inference is billed
separately at the same rates as calling Bedrock directly.

---

## Baseline

Idle, before any inference traffic:

| Line item | Per day | Per month | Rate |
|---|---|---|---|
| 6 interface VPC endpoints × 2 AZs | ~$2.90 | ~$88 | $0.01 per endpoint per AZ-hour, + $0.01/GB |
| NAT gateway | ~$1.15 | ~$35 | $0.045/hr, + $0.045/GB |
| ECS Fargate, 2 tasks (0.5 vCPU, 1 GB) | ~$1.00 | ~$30 | Gateway + ADOT sidecar share the task |
| Application Load Balancer | ~$0.60 | ~$18 | + LCU charges |
| RDS `db.t4g.micro`, single-AZ, 20 GB gp3 | ~$0.45 | ~$14 | |
| ACM certificate | free | free | |
| S3 gateway endpoint | free | free | Gateway endpoints have no hourly or per-GB charge |
| **Total** | **~$6.10** | **~$185** | |


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

| Posture | Endpoints | Monthly | Over NAT instead of PrivateLink |
|---|---|---|---|
| Full private (default) | 6 × 2 AZ | ~$88 | IdP leg only |
| Private inference | Bedrock only, 1 × 2 AZ | ~$15 | Secrets at task start, ECR metadata, logs, metrics |
| NAT only | none | $0 | All AWS-service traffic, including prompts |


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

Moves ~$123/month off this workload onto shared infrastructure. Authorise 443
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

**Tear down when idle.** A demo or pilot bills ~$185/month whether or not anyone
signs in. See [`teardown.md`](teardown.md).

