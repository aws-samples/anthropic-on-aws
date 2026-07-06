# EKS + IRSA — an alternative compute track (notes, not automated)

The primary track in this repo is **ECS Fargate** (`setup.sh` and `cdk/`). EKS is a
viable alternative; these notes capture what changes. They are **notes, not a
turnkey deploy** — adopt them if EKS is already your platform.

Why Fargate is primary, and the one EKS gotcha it sidesteps, is in
[`adr/0002-ecs-fargate-as-primary-compute.md`](adr/0002-ecs-fargate-as-primary-compute.md):
on **EC2-backed** node groups the default **IMDSv2 hop limit of 1** blocks the
in-container metadata call, so the AWS SDK's credential chain can't resolve the
role and **every Bedrock request returns 502** (`Could not load credentials from
any providers`). Boot and `/readyz` pass anyway, because the SDK resolves
credentials on the *first request*, not at client construction — a confusing
runtime-only failure. See the fix below.

## What stays the same

- The **distroless image** is identical — same pinned `claude` binary, same
  `claude gateway --config …` entrypoint.
- The **dual-ARN Bedrock policy** is identical (both `inference-profile/us.anthropic.*`
  and `foundation-model/anthropic.*`).
- **RDS**, the **internal-ALB / private-IP** requirement, the **idle-timeout**
  need, and the **Bedrock model-access prerequisite** are unchanged.

## What changes

### 1. Credentials: IRSA instead of an ECS task role

Create an IAM role with the dual-ARN Bedrock policy and a trust policy for the
cluster's OIDC provider scoped to the gateway's service account, then annotate
the service account:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: claude-gateway
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::<acct>:role/claude-gateway
```

`auth: {}` in the Bedrock upstream picks it up through the default credential
chain — no static keys.

### 2. Config + secrets: the Secrets Store CSI driver (file mounts)

This is **the one place a file mount is the natural AWS answer**, so the EKS track
diverges from the ECS "bake config + secrets-as-env-vars" decision
([`adr/0001`](adr/0001-bake-config-into-image-secrets-as-env.md)). With the
[AWS Secrets Store CSI driver](https://github.com/aws/secrets-store-csi-driver-provider-aws)
you can mount **both** the config and the secrets as files and use the
`${file:/path}` expansion form the gateway supports:

- Mount `gateway.yaml` from a `ConfigMap` (it's non-secret) at
  `/etc/claude/gateway.yaml`.
- Mount the JWT secret, OIDC client secret, and DB credentials as files under
  `/secrets/…` via a `SecretProviderClass`, and reference them in the YAML:

```yaml
session:
  jwt_secret: ${file:/secrets/jwt-secret}
oidc:
  client_secret: ${file:/secrets/oidc-client-secret}
store:
  postgres_url: postgres://${file:/secrets/db-host}:5432/claude_gateway?sslmode=require
  username: ${file:/secrets/db-username}
  password: ${file:/secrets/db-password}
```

This means you can use the **upstream image unchanged** (no per-environment bake)
and supply `gateway.yaml` from the ConfigMap — the EKS-native pattern. (On ECS the
task definition's `secrets:` injects env vars only, never files, which is why ECS
bakes the config instead.)

### 3. Ingress: internal ALB via the AWS Load Balancer Controller

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: claude-gateway
  annotations:
    alb.ingress.kubernetes.io/scheme: internal
    alb.ingress.kubernetes.io/ip-address-type: ipv4   # NOT dualstack — see below
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:<region>:<acct>:certificate/<id>
    alb.ingress.kubernetes.io/load-balancer-attributes: idle_timeout.timeout_seconds=3600
    alb.ingress.kubernetes.io/healthcheck-path: /healthz
spec:
  ingressClassName: alb
  rules:
    - host: claude-gateway.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend: { service: { name: claude-gateway, port: { number: 8080 } } }
```

**`ip-address-type: ipv4`, not `dualstack`** — an internal dual-stack ALB returns
public-range AAAA records that the CLI's `/login` private-IP check rejects.
**`idle_timeout=3600`** or long streaming responses get cut. Set `listen.public_url`
to the Ingress hostname.

### 4. Probes: readiness `/readyz`, liveness `/healthz`

```yaml
readinessProbe: { httpGet: { path: /readyz, port: 8080 } }
livenessProbe:  { httpGet: { path: /healthz, port: 8080 } }
```

Note the **outage tradeoff**: `/readyz` reports not-ready during a Postgres outage,
so a readiness probe on it drains every replica at once — even though the gateway
could still serve already-signed-in developers (bearer tokens validate locally;
session refresh doesn't touch the store). Point readiness at `/healthz` instead if
you'd rather signed-in developers keep working through a store blip, accepting that
new sign-ins fail against a replica that still reports ready. (The ECS track health-
checks `/healthz` for this reason.)

### 5. IMDSv2 hop-limit fix (EC2 node groups only)

If you run **EC2 node groups** (not Fargate profiles), raise the IMDSv2 hop limit
so the in-container metadata call works — otherwise Bedrock 502s as described
above:

```bash
aws ec2 modify-instance-metadata-options \
  --instance-id <id> --http-put-response-hop-limit 2 --http-tokens required
```

Set it in the launch template so it applies to every node. **EKS Fargate profiles
avoid this entirely** (no IMDS in the picture), matching the ECS Fargate track.

### 6. Connection pool

Keep `replicas × store.max_connections` below RDS `max_connections`. The default
`5` per replica is conservative; raise it only for a dedicated DB under load.
