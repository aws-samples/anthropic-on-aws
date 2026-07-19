# Gotchas & field notes — Claude apps gateway on AWS

A field guide for anyone deploying this solution. Each entry is a real trap: the
symptom you'll see, why it happens, and the fix. Items marked **[hit live]** were
encountered during an actual deploy of *this* example; the rest are design-level
traps the architecture is built to avoid.

The theme: **most failures are not in the gateway — they're in the environment
around it** (networking, model access, TLS, IAM, image packaging). Static checks
(`cdk synth`, `bash -n`, YAML parse) catch none of the runtime ones below; only a
live deploy does.

---

## 1. Telemetry: `forward_to.url` must be the bare origin, not the OTLP path  **[hit live]**

**Symptom:** the gateway boots fine and relays telemetry, but every export logs:
```
otel forward to https://monitoring.<region>.amazonaws.com/v1/metrics failed: Error: 404 Not Found
```

**Why:** the gateway appends the OTLP-standard signal path itself (`/v1/metrics`
for metrics, `/v1/logs`, `/v1/traces`) — same convention every OTLP HTTP
exporter follows. Configuring `forward_to.url` as
`https://monitoring.<region>.amazonaws.com/v1/metrics` (i.e. already including
the suffix) makes the actual request go to `.../v1/metrics/v1/metrics`, which
404s. The upstream config docs' own examples confirm this: they show a bare
origin (`https://otel-collector.internal.example.com`,
`https://api.datadoghq.com/api/v2/otlp`) with no signal-specific suffix.

**Fix:** point `forward_to.url` at `https://monitoring.<region>.amazonaws.com`
— no `/v1/metrics`. `gateway.yaml.template` and `gateway.yaml.example` in this
repo already do this correctly; this entry exists because an earlier draft of
the CloudWatch-direct migration got it wrong and only a live deploy caught it
(the gateway logs the failure but doesn't fail boot or the client request —
telemetry silently drops).

---

## 2. Telemetry: OTLP-ingested metrics don't show up in `list-metrics`/`get-metric-data`  **[hit live]**

**Symptom:** the gateway relays telemetry with zero errors, but `list-metrics` /
`get-metric-data` / `get-metric-statistics` return empty even minutes after real traffic.

**Why:** those classic APIs only surface `PutMetricData`-style metrics. OTLP-ingested
metrics land in a separate PromQL-native backend — no propagation delay involved, those
APIs simply never return OTLP data.

**Fix:** verify via the PromQL HTTP API (`https://monitoring.<region>.amazonaws.com/api/v1/query`,
SigV4-signed) or a PromQL-aware surface (Query Studio, Grafana), e.g. `{"claude_code.session.count"}`.

---

## 3. Telemetry: ADOT collector sidecar handles SigV4 auth

This example runs an **ADOT collector sidecar** in the same Fargate task.
The gateway sends OTLP to `http://localhost:4318` (the ADOT container), which
forwards metrics to CloudWatch using **SigV4 via the ECS task role** — no bearer
token or API key to manage or rotate. The task role needs
`cloudwatch:PutMetricData` (already granted in the CDK stack / `setup.sh`).

The ADOT sidecar is marked **non-essential**: if the agent crashes, the gateway
continues serving inference traffic. `CLAUDE_GATEWAY_ALLOW_LOOPBACK=1` is set on
the gateway container to permit forwarding to the localhost destination (the
gateway's SSRF guard blocks loopback by default).

Logs and traces need additional ADOT pipeline configuration and are out of scope — this
example ships `logs: false` / `traces: false`.

---

## 4. Baked config must be world-readable in the image  **[hit live]**

**Symptom:** every gateway task crash-loops; logs:
```
claude gateway: EACCES: permission denied, open '/etc/claude/gateway.yaml'
```

**Why:** the distroless image runs as the `nonroot` uid (65532). Two ways to
land here: the file itself isn't readable, *or* its parent dir isn't traversable.

- If your build stamps `gateway.yaml` via `mktemp` (mode `0600`, owner-only) and
  then `COPY`s it, the file lands root-owned and unreadable by `nonroot`.
- The obvious one-liner fix — `COPY --chmod=0644 gateway.yaml /etc/claude/gateway.yaml`
  — is **not enough on Docker/BuildKit**: the `--chmod` also stamps the
  *auto-created* `/etc/claude` parent at `0644`, dropping its traverse (execute)
  bit, so `nonroot` can't enter the directory → same `EACCES`. (podman's builder
  doesn't propagate the mode to the parent, so the one-liner *appears* to work
  there — an easy way to ship this bug if you only test on podman.)

**Fix:** assemble `/etc/claude` in a small builder stage with explicit modes
(dir `0755`, file `0644`), then copy the finished tree into the shell-less
distroless image — `COPY --from` preserves the modes verbatim on every builder:

```dockerfile
FROM debian:12-slim AS config
COPY gateway.yaml /tmp/gateway.yaml
RUN mkdir -p /out/etc/claude \
 && cp /tmp/gateway.yaml /out/etc/claude/gateway.yaml \
 && chmod 0755 /out/etc/claude \
 && chmod 0644 /out/etc/claude/gateway.yaml

FROM gcr.io/distroless/cc-debian12:nonroot
COPY --from=config /out/etc/claude /etc/claude
```

> Takeaway: any file you bake into a non-root distroless image needs an
> explicit readable mode **and** a traversable parent dir. This bites silently —
> the build succeeds, the container only fails at runtime — and it's
> builder-dependent, so a green build on one engine doesn't clear the other.

---

## 5. The ALB pattern opens 443 to the world by default  **[hit live]**

**Symptom (CDK):** the synthesized template has a security-group ingress of
`CidrIp: 0.0.0.0/0` on port 443, even though you created a separate, restricted SG.

**Why:** `ApplicationLoadBalancedFargateService` creates its **own** load-balancer
security group and, with `openListener: true` (the default), opens the listener
port to `0.0.0.0/0`. A separate SG you build by hand is never attached — it just
dangles.

**Fix:** set `openListener: false` on the pattern, then restrict the pattern's own
LB SG explicitly:
```ts
const svc = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'Gateway', {
  /* … */ openListener: false,
});
svc.loadBalancer.connections.allowFrom(ec2.Peer.ipv4(ingressCidr), ec2.Port.tcp(443));
```

> Takeaway: for a credential-holding internal service, audit the
> *synthesized* SG rules — don't trust that a hand-rolled SG is the one in effect.
> (Hand-rolled `setup.sh`-style scripts have the mirror risk: leaking an over-open
> `0.0.0.0/0:5432` on RDS. RDS ingress must be from the task SG only, never a CIDR.)

---

## 6. An internal ALB is unreachable from a laptop — and you can't fix that with public exposure  **[hit live]**

**Symptom:** `claude /login` from a laptop reports
`Could not resolve gateway host …`, or the connection times out.

**Why:** the gateway is **internal by design** — its hostname must resolve to
**private IPs only**. The CLI's `/login` *rejects any public-resolving address*,
because a trusted gateway can push settings that run commands on developer
machines. So you cannot "just expose it":
- **CloudFront / public ALB / ngrok / a public IP** → the CLI refuses with
  `…resolves to the public (or unrecognized) address…`. These let you `curl` but
  break the real `/login` flow.
- A laptop with **no path into the VPC** simply can't route to the private ALB at
  all, regardless of security-group rules.

**Fix:** provide a **private network path** + **private DNS resolution**:
- AWS Client VPN, site-to-site VPN, Direct Connect, or Transit Gateway, **or**
  work from inside the VPC (WorkSpaces / Cloud Desktop).
- `<public_url>` must resolve to the ALB's private IP *on the laptop* — a private
  Route 53 zone resolves only inside the VPC, so laptops need a Resolver inbound
  endpoint, corp DNS forwarding, or the record in a zone they already use.
- The security-group rule that matters is allowing 443 from the **VPN/client
  CIDR** (`ingressCidr`), *not* a laptop's public IP.

> Takeaway: this is the **#1 "it doesn't work from my laptop"** failure.
> Connectivity + private DNS is a hard prerequisite, not an afterthought. Plan it
> before you deploy. (See `connectivity.md`.)

---

## 7. IPv4-only internal ALB — dual-stack returns public AAAA  **[verified live]**

**Symptom:** `/login` rejects the gateway as public even though the ALB is
"internal".

**Why:** an internal **dual-stack** ALB hands back **public-range AAAA** records.
The CLI checks *every* resolved address and requires all of them to be private, so
one public AAAA fails the check.

**Fix:** make the ALB **IPv4-only** (`ipAddressType: ipv4`). Verified on the live
deploy: the internal IPv4 ALB resolved to `10.0.x.x` only, with **no AAAA records**.

---

## 8. Bedrock model access is a separate, non-IAM prerequisite

**Symptom:** invoke returns `AccessDeniedException` — or a `403` naming
`aws-marketplace:ViewSubscriptions` / `aws-marketplace:Subscribe` — even though the
`bedrock:InvokeModel*` IAM policy is correct.

**Why:** on Bedrock, Anthropic's models are AWS Marketplace offerings, so the first
use of a model in an account requires a one-time, **account/console-level**
model-access grant (a subscription), separate from IAM. For cross-region inference
profiles (`global.anthropic.*`) it must be enabled in the source region and any
region the profile may route to (global spans all commercial regions), not just your
endpoint region.

**Fix:** as an account admin, enable model access **once** — Bedrock console →
*Model access* (or the API) — for each Claude model you list in `availableModels`,
per region global may route to. After that the 403 is gone permanently and the task
role only ever needs `bedrock:InvokeModel` / `bedrock:InvokeModelWithResponseStream`.
This is the **#1 Bedrock-through-gateway failure** and it's easy to miss because IAM
looks correct.

> **Do NOT fix this by adding `aws-marketplace:Subscribe` to the task role.** It makes
> the error disappear — the task self-subscribes on first call — but it's the wrong
> posture: (1) it grants a *one-time provisioning* action as a **standing** permission
> on a long-lived, network-exposed runtime identity; (2) `Subscribe` is account-wide,
> so a compromised container could subscribe the account to arbitrary paid Marketplace
> products and accept their EULAs — well outside an inference proxy's blast radius;
> (3) procuring models is an account-governance decision, not a data-plane one. Enable
> access out-of-band as an admin instead — which is exactly why the CDK doesn't
> provision these permissions.

---

## 9. Bedrock IAM needs two ARN families

**Symptom:** `403` on invoke despite granting `bedrock:InvokeModel*`.

**Why:** you must grant the actions on **both** the inference-profile ARNs **and**
the underlying foundation-model ARNs:
```
arn:aws:bedrock:<region>:<acct>:inference-profile/global.anthropic.*
arn:aws:bedrock:*::foundation-model/anthropic.*
```
Missing either yields 403. (Note the foundation-model ARN has an empty region +
account segment — `:*::` — that's correct, not a typo.)

---

## 10. EC2/EKS-on-EC2: the IMDSv2 hop-limit trap

**Symptom:** every Bedrock request `502`s with
`Could not load credentials from any providers` — but boot and `/readyz` pass.

**Why:** on EC2-backed compute the default IMDSv2 hop limit of `1` blocks the
in-container metadata call, so the SDK can't resolve the role. It passes boot
because credentials resolve on the *first request*, not at startup — a confusing
runtime-only failure.

**Fix:** raise the hop limit to `2`
(`aws ec2 modify-instance-metadata-options --http-put-response-hop-limit 2`), or —
better — use **Fargate**, whose task roles come from the ECS container-credentials
endpoint and dodge IMDS entirely. (This example uses Fargate for exactly this
reason.)

---

## 11. The RDS-managed master secret has no `host` field

**Symptom:** injecting `DB_HOST` from `<rds-secret>:host::` resolves empty / fails.

**Why:** an RDS *managed* master secret (`--manage-master-user-password` /
`rds.Credentials.fromGeneratedSecret`) contains only `{username, password}`. It
does **not** carry the host.

**Fix:** inject `DB_USER`/`DB_PASSWORD` from the secret, but supply `DB_HOST` as a
**plain env var** from the instance endpoint (it's not a secret). The gateway's
`store.username`/`password` take precedence over any creds in the URL, so the URL
only needs `postgres://${DB_HOST}:5432/<db>?sslmode=require`.

---

## 12. `public_url` drives everything — and forces planning, not a redeploy loop

**Why:** the gateway builds its OIDC `redirect_uri` and discovery doc **only** from
`listen.public_url`, never from `X-Forwarded-*` (those are client-spoofable). So:
- You must register `<public_url>/oauth/callback` on your IdP client.
- `public_url` must be the externally visible HTTPS origin (the internal ALB name).

Because you bring your own Route 53 zone and pick the record name, `public_url` is
**known up front** (`claude-gateway.<your-zone>`), so there's no "deploy to learn
the URL" round trip. The only ordering constraint is **image-must-exist-before-
service** (the two-pass deploy).

---

## 13. Config is baked → the image is per-environment

**Why:** on ECS the task definition's `secrets:` injects **env vars only**, never
files, so this example bakes `gateway.yaml` into the image (only secrets + DB facts
stay as `${VAR}`). Consequence: **one image = one IdP + URL + region.** Changing any
of those means a rebuild.

**Fix / alternative:** on EKS the Secrets Store CSI driver *can* file-mount, so you
can use `${file:/secrets/…}` and keep the image generic. (See `eks-notes.md`.)

> Takeaway: this is a deliberate trade-off (keeps the image distroless, no
> wrapper, config versioned as code) but surprises anyone expecting the GCP
> example's store-the-YAML-in-a-secret pattern.

---

## 14. TLS cert pinning — ACM renewal is a planned event

**Why:** the CLI pins the ALB **leaf certificate by SHA-256** on first `/login`.
When ACM renews the cert, the fingerprint changes.

**Fix:** treat renewal as a planned event — **republish the new fingerprint** to
developers, or they'll see the trust prompt again. For a private-CA / internal-TLD
cert, developers need the CA in their OS trust store or `NODE_EXTRA_CA_CERTS` set.

---

## 15. Operational papercuts  **[hit live]**

- **`AWS_REGION` overrides `CDK_DEFAULT_REGION`.** A deploy can silently land in the
  wrong region if `AWS_REGION` is set in your shell. Pin region explicitly and
  confirm the stack's region before and after. (We initially deployed to the wrong
  region this way.)
- **EC2 security-group rule *descriptions* reject `>`.** Allowed charset is
  `a-zA-Z0-9. _-:/()#,@[]+=&;{}!$*`. Using `->` arrows in a rule description fails
  with `Invalid rule description`. Use `to`.
- **`docker` isn't required — `podman`/`finch` work, and `setup.sh` handles the
  flag difference.** On an arm64 Mac, podman built the `linux/amd64` image via its
  VM's emulation and pushed to ECR fine. The trap: `--provenance=false` is a
  **buildx-only** flag — `podman build` rejects it with `unknown flag: --provenance`.
  (The flag exists to stop buildx emitting an OCI image index that some runtimes
  reject; podman emits a plain image by default, so it simply doesn't need it.)
  `setup.sh` auto-detects `docker`/`podman`/`finch` (override with
  `CONTAINER_TOOL=…`) and only passes `--provenance=false` to docker — if you
  build by hand with podman, omit the flag yourself.
- **`setup.sh` needs bash 4+, but macOS ships bash 3.2.** The script uses no
  bash-4-isms now (an earlier `mapfile` was replaced with a `while read` loop), but
  if you extend it, avoid `mapfile`/`readarray`, `declare -A`, and `${var,,}`/`${var^^}`
  — all fail on the stock `/bin/bash` (3.2) with confusing "command not found" or
  syntax errors mid-run. Test on macOS bash 3.2, or run under `brew`-installed bash.
- **A failed ECS rollout can take ~3h to time out** unless you enable the
  deployment **circuit breaker** (`circuitBreaker: { rollback: true }`). Without it,
  a crash-looping task (e.g. the EACCES above) keeps CloudFormation `IN_PROGRESS`
  for hours before rolling back.

---

## 16. Smoke-testing without laptop connectivity  **[hit live]**

If you can't reach the internal ALB yet, you can still validate the full HTTP
surface with a **throwaway Fargate task in the VPC** that curls the gateway:

```
/healthz                                    → 200   (liveness)
/readyz                                     → 200   (Postgres reachable)
/.well-known/oauth-authorization-server     → 200   (config + OIDC discovery + upstream + migration all OK)
/oauth/device_authorization  (POST)         → 200   (returns device_code/user_code — RFC 8628 device flow works)
```

The discovery endpoint returning 200 is an end-to-end boot check — it only succeeds
after config load, OIDC discovery, upstream client construction, **and** Postgres
migration all pass. This validates everything except the browser SSO leg (which
needs real connectivity + the OIDC client secret set).

> Tip: scope the throwaway task's log group to one the existing execution role can
> already write, or it fails to start with a `logs:CreateLogStream` AccessDenied —
> the gateway's execution role is (correctly) least-privilege to its own log group.

---

## 17. A gateway session and a direct-Bedrock config can't share a config dir  **[hit live]**

**Symptom:** a developer signs in to the gateway successfully (the gateway audit
log shows `session.mint` → success and `managed.serve`), but the CLI then exits
oddly, or `/login` keeps showing the normal account picker instead of the **Cloud
gateway** screen. The gateway logs `auth.denied … path:/v1/logs` / `/v1/metrics`.

**Why:** the developer's `CLAUDE_CONFIG_DIR` already contained a
direct-Bedrock `settings.json` (the kind CCWB / "Claude Code on Bedrock" tooling
provisions) with, in its `env` block:
- `CLAUDE_CODE_USE_BEDROCK: "1"` — routes inference straight to Bedrock via the AWS
  credential chain, which contradicts a gateway session (the CLI must talk to the
  *gateway*, not Bedrock directly).
- `awsAuthRefresh` / a `credential-process` helper — a second, conflicting auth path.
- `CLAUDE_CODE_ENABLE_TELEMETRY: "1"` + `OTEL_EXPORTER_OTLP_ENDPOINT: http://…` —
  the CLI then tries to push OTLP to the gateway (hence the `auth.denied /v1/logs`),
  which this example doesn't run telemetry on.

The gateway auth itself is fine — the collision is entirely client-side, between the
minted gateway session and the pre-existing direct-Bedrock user-tier settings.

**Fix:** run gateway mode from a **clean, separate `CLAUDE_CONFIG_DIR`** with no
`USE_BEDROCK`, no `awsAuthRefresh`, and no `OTEL_*`/telemetry env — let the gateway
session drive provider, model, and telemetry. Also clear those vars from the shell
(`CLAUDE_CODE_USE_BEDROCK`, `ANTHROPIC_MODEL`, `CLAUDE_CODE_ENABLE_TELEMETRY`, the
`OTEL_*` set) if a wrapper/rc exports them.

> **Directly relevant to CCWB gateway integration (issue #719):** CCWB's own
> `settings.json` and a gateway session are mutually exclusive in the same config
> dir. A "gateway mode" in CCWB should provision a distinct config dir (or a
> settings profile) that omits the Bedrock/credential-process/telemetry env, rather
> than layering `forceLoginGatewayUrl` on top of the existing Bedrock settings.

**Also note (macOS):** managed settings live at a single machine-wide path
(`/Library/Application Support/ClaudeCode/managed-settings.json`) read by **every**
`claude` binary on the host — there is no env var or flag to relocate or scope it
per-install. `forceLoginGatewayUrl` is honored **only** at that managed tier
(ignored in user settings), and `forceLoginMethod` blocks API-key/`apiKeyHelper`
auth at startup — so pointing one binary at a test gateway also affects any other
`claude` (e.g. a corporate install) on the same machine while the file is present.
Back up any existing managed-settings file before testing, and restore it after.

---

## 18. Re-running `/login` when already signed in shows the generic picker  **[hit live]**

**Symptom:** after a successful gateway sign-in, running `/login` **again** shows
the normal `1. Claude account / 2. Console / 3. 3rd-party` picker, which looks like
the gateway config was lost.

**Why:** it wasn't. The banner already reads `… · Cloud gateway` and `Welcome
back!` — the session is live. `/login` re-initiates the login flow and the
interactive picker doesn't special-case an existing gateway session.

**Fix:** you don't need to log in again. Press **Esc** to dismiss the picker, or
just use the session (`claude -p "…"`). Confirm the session works end-to-end with a
real prompt; an `inference` event in the gateway audit log is the proof that
CLI → gateway → Bedrock → back all work.
