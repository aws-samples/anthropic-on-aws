# Claude Apps Gateway: Deploy on AWS with CDK

This CDK stack deploys the Claude apps gateway on Amazon ECS Fargate with everything it needs to run: load balancer, database, DNS, TLS, and IAM roles. After deployment, you push a config file to developer machines and they can sign in with corporate SSO.

![Claude Apps Gateway Architecture](../images/architecture.png)

## What you are deploying

The Claude apps gateway is a proxy that sits between your developers and Amazon Bedrock (or Claude Platform on AWS). Developers authenticate with corporate SSO instead of holding AWS credentials. The gateway holds a single IAM role, enforces who can use which models, and tracks usage per developer.

> **Note:** This CDK stack deploys with Amazon Bedrock as the upstream. To use Claude Platform on AWS instead, change `provider: bedrock` to `provider: anthropicAws` in the gateway.yaml template and add your `workspace_id`. See the [routing module](../workshop/04-routing/README.md) for details.

This CDK stack creates all the AWS infrastructure needed to run it:

| Resource | Why it's needed |
|----------|----------------|
| **ECS Fargate cluster + service** | Runs the gateway container. Stateless, no instances to manage. |
| **Application Load Balancer (internal)** | Entry point for developers. Terminates TLS so traffic is encrypted. Must be internal (private IP) because the CLI rejects public gateway addresses. |
| **ACM certificate** | Free TLS certificate for the ALB. Auto-renews. |
| **RDS PostgreSQL (db.t4g.micro)** | Stores short-lived sign-in state (device codes, rate limits). Smallest tier is sufficient. |
| **ECR repository** | Holds the gateway container image you build and push. |
| **IAM task role** | Gives the gateway container permission to call Bedrock (`InvokeModel` + `InvokeModelWithResponseStream`). No static keys. |
| **IAM execution role** | Lets ECS pull the image from ECR and write logs to CloudWatch. |
| **Security groups** | Network rules: ALB accepts HTTPS (443), ECS accepts traffic from ALB only (8080), RDS accepts traffic from ECS only (5432). |
| **Route53 A record** | Points your gateway hostname at the ALB so developers can reach it by name. |
| **CloudWatch log group** | Gateway logs go here. Boot messages, auth events, errors. |
| **ADOT collector sidecar** | Runs *in the same Fargate task* as the gateway (not a separate service, no extra ALB listener). Receives per-user usage telemetry (OTLP) from the gateway on `localhost:4318` and forwards it to CloudWatch metrics (namespace `ClaudeGateway`) via SigV4 on the task role. The gateway container sets `CLAUDE_GATEWAY_ALLOW_LOOPBACK=1` so it can push to the loopback sidecar past its SSRF guard. See "Telemetry" below. |

## How traffic flows

**Sign-in (one time per developer):**

1. Developer runs `claude /login` on their laptop (connected to VPN)
2. CLI connects to the gateway (via ALB) and gets a device code
3. Developer opens a browser link, clicks "Approve", and is redirected to their corporate IdP (Okta, Entra, etc.)
4. After SSO login, the IdP redirects back to the gateway. Gateway writes the session to PostgreSQL.
5. CLI picks up the session token. Developer is signed in.

**Inference (every request after sign-in):**

1. Developer asks Claude a question in Claude Code
2. CLI sends the request to the gateway (via ALB) with the session token
3. Gateway validates the token, checks the developer's model access policy
4. Gateway calls Amazon Bedrock using the ECS task role
5. Amazon Bedrock streams the response back through the gateway to the developer

**Telemetry (fire-and-forget, alongside every request):**

1. After each request the gateway exports OTLP metrics — stamped with the developer's identity — to `telemetry.forward_to` in `gateway.yaml`
2. That target is `http://localhost:4318`, the ADOT collector sidecar in the same task
3. The sidecar forwards the metrics to CloudWatch (namespace `ClaudeGateway`) via SigV4 on the task role — for per-user cost and usage dashboards
4. This leg is fire-and-forget: if the sidecar is down, inference is unaffected

> The gateway only forwards telemetry when **both** `telemetry.forward_to` and `listen.public_url` are set. Both deploy paths (`setup.sh` and `deploy.sh`) stamp `gateway.yaml` from [`gateway.yaml.template`](gateway.yaml.template), whose `telemetry:` block points `forward_to` at the localhost sidecar — so telemetry is on by default and metrics-only (no prompt/tool-input content). To send to your *own* external collector (Datadog, Splunk, etc.) instead, edit that block (swap `url` for an `https://` endpoint and add `headers` if needed). To turn telemetry off, delete the block; the sidecar then just receives nothing (it shares the gateway task, so there's no separate service to remove).

## What you need before deploying

Before running `cdk deploy`, make sure you have:

### 1. A DNS hostname for the gateway (optional: Route53 hosted zone)

The gateway needs a DNS name that resolves to a private IP. If you have a Route53 hosted zone, the CDK stack will create the DNS record and validate the TLS certificate automatically. Provide the **hosted zone ID** and **zone name**.

If you manage DNS outside Route53 (corporate DNS, Active Directory, etc.), you can skip the hosted zone. After deployment, manually create a DNS record pointing your hostname to the ALB's DNS name, and use a pre-existing ACM certificate or import one.

### 2. An OIDC identity provider with a registered app

Register an OAuth/OIDC application in your IdP (Okta, Entra, Google Workspace, Cognito, Keycloak, etc.) with:
- **Redirect URI**: `https://<your-gateway-hostname>/oauth/callback`
- Note the **issuer URL**, **client ID**, and **client secret**

### 3. AWS CLI configured

Your terminal must have AWS credentials with permission to create ECS, ALB, RDS, IAM, ECR, Route53, ACM, S3, and CodeBuild resources. The `deploy.sh` script uses S3 to stage the container build artifacts and CodeBuild to build and push the image without needing Docker installed locally. If you prefer to build the image yourself with Docker, you only need ECS, ALB, RDS, IAM, ECR, Route53, and ACM permissions.

### 4. Node.js 18+ and CDK CLI

```bash
npm install -g aws-cdk
```

### 5. The Claude Code linux-x64 binary

The gateway container needs the Linux build of Claude Code. Download it from the public releases endpoint:

```bash
VERSION=$(curl -fsSL https://downloads.claude.ai/claude-code-releases/stable)
mkdir -p linux-x64
curl -fL -o linux-x64/claude \
  "https://downloads.claude.ai/claude-code-releases/${VERSION}/linux-x64/claude"
chmod +x linux-x64/claude
```

Or download it via the standard installer on a Linux machine.

## TLS: bring an ACM cert

The gateway needs a TLS cert on the internal ALB. Import one with `certArn` and the
ALB uses it as-is. On first `/login` the CLI **pins the cert's SHA-256 fingerprint**
and prompts the developer to confirm it — this is intended behavior (the CLI pinning
the authentic gateway). The stack prints the command to read that fingerprint (the
`CertFingerprintHint` output; `setup.sh` prints it too) so you can publish it.

**Want no first-login prompt?** Request a **public** ACM cert for the gateway
hostname, DNS-validate it, and pass its ARN as `certArn`. ACM public certs validate
by **DNS, not endpoint reachability**, so the cert is browser-trusted (no prompt, no
`NODE_EXTRA_CA_CERTS`, no keychain import) while the ALB stays internal — DNS
validation never needs the hostname to be publicly resolvable.

## How to deploy

> [!IMPORTANT]
> The canonical, verified walkthrough (for both this CDK track and `setup.sh`) is
> [`../docs/deployment.md`](../docs/deployment.md) — a two-pass `cdk deploy` driven
> by the [context variables below](#cdk-context-variables), with the image built
> from the tracked distroless `Dockerfile` and SHA-verified binary. The
> `.env` + `deploy.sh` flow in the steps below is a convenience path: `deploy.sh`
> builds the image via CodeBuild using its own inline Dockerfile and config, and
> maps your `.env` values onto the CDK context (`-c`) the stack requires, running
> both deploy passes for you. Driving `npx cdk deploy` directly (Option B below)
> means supplying that context yourself.

### Step 1: Configure

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```bash
# Name prefix for all resources (e.g., "claude-gateway")
GATEWAY_NAME=claude-gateway

# The hostname developers will connect to
GATEWAY_HOSTNAME=claude-gateway.internal.company.com

# From your Route53 hosted zone
HOSTED_ZONE_ID=ZXXXXXXXXXXXXXXXXX
HOSTED_ZONE_NAME=internal.company.com

# From your OIDC identity provider registration
OIDC_ISSUER=https://company.okta.com/
OIDC_CLIENT_ID=your-client-id
OIDC_CLIENT_SECRET=your-client-secret

# Comma-separated list of email domains allowed to sign in
ALLOWED_EMAIL_DOMAINS=company.com

# AWS region where Amazon Bedrock models are available
BEDROCK_REGION=us-east-1

# Imported ACM cert ARN for GATEWAY_HOSTNAME (use a public, browser-trusted cert)
CERT_ARN=arn:aws:acm:us-east-1:123456789012:certificate/abc-123

# VPN/corp CLIENT CIDR developers connect from — NOT the VPC CIDR
INGRESS_CIDR=10.0.0.0/8
```

### Step 2: Install dependencies

```bash
npm install
```

### Step 3: Deploy

**Option A: Full deploy (recommended).** This runs CDK, builds the container image via CodeBuild, and starts the service:

```bash
./scripts/deploy.sh
```

**Option B: Drive CDK yourself.** Run the two passes by hand, supplying the
context the stack requires (`deploy.sh` does this for you from `.env`). Pass 1
creates just the ECR repo; build and push the image to the ECR URI shown in its
outputs; then pass 2 brings up the full stack (the service starts automatically
at `desiredCount 2` — no manual scale-up):

```bash
npx cdk bootstrap -c imageReady=false    # first time only

# Pass 1: ECR repo only
npx cdk deploy -c imageReady=false \
  -c publicUrl=https://claude-gateway.internal.company.com \
  -c zoneName=internal.company.com -c ingressCidr=10.0.0.0/8 \
  -c certArn=arn:aws:acm:us-east-1:123456789012:certificate/abc-123

# ...build + push the image to the ECR repo...

# Pass 2: full stack (imageReady defaults to true)
npx cdk deploy \
  -c publicUrl=https://claude-gateway.internal.company.com \
  -c zoneName=internal.company.com -c ingressCidr=10.0.0.0/8 \
  -c certArn=arn:aws:acm:us-east-1:123456789012:certificate/abc-123
```

See [CDK context variables](#cdk-context-variables) for the full list, or
[`../docs/deployment.md`](../docs/deployment.md) for the canonical walkthrough.

### Step 4: Verify

```bash
# Should return a JSON discovery document
curl https://<your-gateway-hostname>/.well-known/oauth-authorization-server

# Should return a device code and verification URL
curl -X POST https://<your-gateway-hostname>/oauth/device_authorization
```

If both return valid JSON, the gateway is running and ready for developers.

### Step 5: Connect developers

Push this JSON file to developer machines via your MDM tool (Jamf, Intune, Ansible, etc.):

```json
{
  "forceLoginMethod": "gateway",
  "forceLoginGatewayUrl": "https://claude-gateway.internal.company.com"
}
```

| Platform | File path |
|----------|-----------|
| macOS | `/Library/Application Support/ClaudeCode/managed-settings.json` |
| Linux and WSL | `/etc/claude-code/managed-settings.json` |
| Windows | `C:\Program Files\ClaudeCode\managed-settings.json` |

Developers then run `claude /login`, press Enter, complete browser SSO, and they're connected.

## Configuration reference

All values come from `.env`. The CDK code reads them at deploy time.

| Variable | What it is |
|----------|-----------|
| `GATEWAY_NAME` | Prefix for the stack's named resources (repo, cluster, service, secrets, log group); `deploy.sh` passes it to the `gatewayName` context so the stack matches |
| `GATEWAY_HOSTNAME` | The full DNS name developers connect to |
| `HOSTED_ZONE_ID` | Route53 zone ID where the DNS record is created (optional if managing DNS externally) |
| `HOSTED_ZONE_NAME` | Route53 zone name (optional if managing DNS externally) |
| `OIDC_ISSUER` | Your IdP's OIDC discovery URL (must serve `/.well-known/openid-configuration`) |
| `OIDC_CLIENT_ID` | OAuth client ID from your IdP app registration |
| `OIDC_CLIENT_SECRET` | OAuth client secret from your IdP app registration; `deploy.sh` seeds it into Secrets Manager (never baked into the image) and refuses to deploy while it's still the placeholder |
| `ALLOWED_EMAIL_DOMAINS` | Only users with these email domains can sign in |
| `BEDROCK_REGION` | Region whose Bedrock endpoint the gateway calls (the upstream `region:` + the inference-profile IAM ARN). Any region works — the gateway uses global inference profiles. See [Regions & data residency](#regions--data-residency) |
| `DEPLOY_REGION` | Optional. Region the **stack** deploys into (VPC/ALB/RDS/ECR/ECS/CodeBuild). Defaults to `BEDROCK_REGION`; `deploy.sh` exports it as `AWS_REGION`/`AWS_DEFAULT_REGION` so every `aws` call and CDK agree. See [Regions](#regions) |
| `CERT_ARN` | Imported ACM cert ARN for `GATEWAY_HOSTNAME` (required; `deploy.sh` maps it to the `certArn` context) |
| `INGRESS_CIDR` | VPN/corp **client** CIDR developers connect from — **not** the VPC CIDR (required; maps to `ingressCidr`) |
| `VPC_ID` | Optional. Reuse an existing VPC (e.g. to keep a Client VPN association intact) instead of creating one; maps to `vpcId` |
| `CREATE_VPC_ENDPOINTS` | Optional. Set `false` with `VPC_ID` when the reused VPC already has the interface endpoints; maps to `createVpcEndpoints` |

### CDK context variables

The stack itself is parameterized by CDK context (`-c key=value`, or set them in
`cdk.json` / `cdk.context.json`). The two-pass deploy exists because the ECS service
needs the image to exist: pass 1 (`-c imageReady=false`) creates just the ECR repo,
pass 2 (default) deploys the full stack.

| Context | Pass | Required | Meaning |
|---|---|---|---|
| `region` | both | no | Region the **stack** deploys into — VPC/ALB/RDS/ECR/ECS (default `CDK_DEFAULT_REGION` or `us-east-1`) |
| `bedrockRegion` | both | no | Region of the Bedrock endpoint — the upstream `region:` + inference-profile ARN (default: `region`). Any region works — the gateway uses global inference profiles. See [Regions & data residency](#regions--data-residency) |
| `imageReady` | both | no | `false` = pass 1 (repo only); omit/`true` = pass 2 |
| `publicUrl` | 2 | **yes** | Internal ALB https origin, e.g. `https://claude-gateway.example.com` |
| `imageTag` | 2 | no | ECR tag (default = pinned claude version) |
| `certArn` | 2 | **yes** | ACM cert ARN for `publicUrl`'s hostname (imported) |
| `zoneName` | 2 | **yes** | Route 53 hosted-zone name, e.g. `example.com` |
| `zoneId` | 2 | no | Hosted-zone id (looked up from `zoneName` if omitted) |
| `ingressCidr` | 2 | **yes** | VPN/corp **client** CIDR developers connect from — **not** the VPC CIDR |
| `vpcId` | 2 | no | Import an existing VPC instead of creating one |
| `createVpcEndpoints` | 2 | no | Default `true`. Set `false` **only** when reusing a `vpcId` that already has the Bedrock/Secrets Manager/ECR/CloudWatch/S3 endpoints — AWS allows one private-DNS endpoint per service per VPC, so recreating them fails the deploy |

### Regions & data residency

There are two region concepts, and they are **separate**:

- **Deploy region** (`region` context / `DEPLOY_REGION` env) — where the stack's
  own resources live: VPC, ALB, RDS, ECR, ECS, CodeBuild, S3.
- **Bedrock region** (`bedrockRegion` context / `BEDROCK_REGION` env) — the Bedrock
  endpoint the gateway calls: the upstream `region:` in `gateway.yaml` and the region
  in the inference-profile IAM ARN.

They **default to the same value**. `deploy.sh` resolves the deploy region as
`DEPLOY_REGION → BEDROCK_REGION → shell AWS_REGION → profile default` and exports it
as `AWS_REGION`/`AWS_DEFAULT_REGION`, so every `aws` CLI call and CDK agree on one
region regardless of what your shell had set. (Before this, region-less `aws` calls
silently followed the shell while CDK followed `.env`, so a mismatched shell
`AWS_REGION` broke the deploy.)

**Any Bedrock region works out of the box.** The `gateway.yaml` model catalog maps
each model to a **global cross-region inference profile** (`global.anthropic.*`),
which resolves from any commercial region — so `BEDROCK_REGION` can be `us-east-1`,
`eu-central-1`, `ap-southeast-2`, etc. with no config change, and the IAM policy
grants `inference-profile/global.anthropic.*` to match. The gateway still connects
only to the Bedrock endpoint in `BEDROCK_REGION` over the private VPC interface
endpoint; the cross-region routing happens inside Bedrock, so the "AWS traffic never
leaves the VPC" posture is unchanged.

**Data residency caveat.** A global profile routes inference to *any* commercial AWS
region, and prompts/outputs may be processed or stored outside `BEDROCK_REGION` (AWS
may retain inputs/outputs in the destination region for abuse detection). If you need
inference confined to a specific geography, switch the catalog off global:

- Edit the `models:` block (in `deploy.sh`'s inline `gateway.yaml`, or your stamped
  `gateway.yaml` on the hardened path) — replace each `global.` prefix with a geo
  profile (`us.` / `eu.` / `apac.`). Confirm the exact id per model with
  `aws bedrock list-inference-profiles --region <your-region>` — they're not a clean
  substitution (e.g. Claude Haiku 4.5 has no short alias, only a dated id).
- Change `inference-profile/global.anthropic.*` → your geo prefix in
  `claude-gateway-stack.ts`.
- A geo (or in-region) profile only routes within that geography, so pick a
  `BEDROCK_REGION` the profile actually spans.

**Default model set.** The shipped catalog is Claude Opus 4.8, Sonnet 5, and Haiku 4.5
— all three invoke via their global profiles from any region. **Claude Fable 5 is
opt-in**: on Bedrock it requires a non-default data-retention mode that isn't enabled
in every region, so it returns `ValidationException: data retention mode 'default' is
not available for this model` where the default three work. To add it, enable that
prereq for your region, then uncomment `claude-fable-5` in both `availableModels` and
the `models:` block (`gateway.yaml.template` / `.example`, or `deploy.sh`'s inline
`gateway.yaml`).

> **Driving CDK by hand (Option B)?** The two-pass `cdk deploy` creates the OIDC
> client secret with a generated placeholder — it does **not** seed your real
> secret. After pass 2, seed it yourself (and re-run the service so tasks pick it up):
> ```bash
> aws secretsmanager put-secret-value \
>   --secret-id <GATEWAY_NAME>-oidc-client-secret \
>   --secret-string '<your-oidc-client-secret>'
> aws ecs update-service --cluster <GATEWAY_NAME> --service <GATEWAY_NAME> --force-new-deployment
> ```
> `deploy.sh` (Option A) does both automatically from `.env`.

## Before going to production

This stack is a worked example — it already ships the security-relevant defaults
(internal IPv4-only ALB, `desiredCount: 2`, ECS tasks in private subnets, the OIDC
client secret and DB credentials pulled from Secrets Manager). What it trades for
easy teardown is data durability. Before using it with real workloads, edit
`claude-gateway-stack.ts` to:

- **Protect the database.** The RDS instance uses `deletionProtection: false`,
  `removalPolicy: DESTROY`, `multiAz: false`, and `backupRetention: 1 day` for clean
  teardown. Flip to `deletionProtection: true`, `removalPolicy: RETAIN`,
  `multiAz: true`, and a longer backup window.
- **Retain the other stateful resources.** The ECR repository (`emptyOnDelete: true`)
  and the log group set `removalPolicy: DESTROY`, and the secrets default to it. Switch
  them to `RETAIN` so a `cdk destroy` can't wipe images, credentials, or audit logs.
- **Populate the OIDC client secret.** The stack creates it in Secrets Manager with a
  placeholder — set the real value from your IdP before developers sign in.
- **Set up VPN or Direct Connect** so developers on the corporate network can reach the
  internal ALB (its hostname must resolve to private IPs only, which is why the ALB is
  internal in the first place).

## Testing without VPC network access (local workaround)

In production, the gateway runs behind an internal ALB and developers reach it over a private network path to the VPC (VPN, Direct Connect, Transit Gateway, etc.). But for testing on your own laptop without that access, you can run the gateway locally.

This works because the Claude Code CLI accepts `127.0.0.1` (loopback) as a valid private address.

### What you need

- PostgreSQL running locally (`brew install postgresql@16 && brew services start postgresql@16`)
- The gateway binary for your platform (macOS: `darwin-arm64/claude`, from a Claude Code install or the releases endpoint used in step 5)
- An OIDC provider configured (Auth0 free tier works for testing)
- A self-signed TLS certificate

### Steps

**1. Create a local database:**

```bash
createdb gateway
```

**2. Generate a self-signed certificate:**

```bash
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes \
  -subj "/CN=gateway.test.example.com" \
  -addext "subjectAltName=DNS:gateway.test.example.com"
```

**3. Add a /etc/hosts entry so the hostname resolves to localhost:**

```bash
echo "127.0.0.1 gateway.test.example.com" | sudo tee -a /etc/hosts
sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder
```

**4. Write a local gateway.yaml:**

```yaml
listen:
  host: 0.0.0.0
  port: 443
  public_url: https://gateway.test.example.com
  tls:
    cert: ./cert.pem
    key: ./key.pem

oidc:
  issuer: https://your-auth0-tenant.us.auth0.com/
  client_id: your-client-id
  client_secret: your-client-secret
  allowed_email_domains: [yourcompany.com]
  userinfo_fallback: true

session:
  jwt_secret: Y2xhdWRlLWdhdGV3YXktand0LXNlY3JldC1mb3ItdGVzdGluZy0yMDI0
  ttl_hours: 1

store:
  postgres_url: postgres://yourusername@localhost:5432/gateway

upstreams:
  - provider: bedrock
    region: us-east-1
    auth: {}

# Global inference profiles → region-agnostic (see "Regions & data residency")
auto_include_builtin_models: false
models:
  - id: claude-opus-4-8
    label: Claude Opus 4.8
    upstream_model: { bedrock: global.anthropic.claude-opus-4-8 }
```

**5. Trust the self-signed cert:**

```bash
# Add to macOS system keychain
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain cert.pem

# Tell Claude Code to trust it
echo '{"env":{"NODE_EXTRA_CA_CERTS":"'$(pwd)'/cert.pem"}}' > ~/.claude/settings.json
```

**6. Start the gateway:**

```bash
sudo CLAUDE_CONFIG_DIR=/tmp/.claude ./darwin-arm64/claude gateway --config ./gateway.yaml
```

**7. Deploy managed settings:**

```bash
sudo mkdir -p "/Library/Application Support/ClaudeCode"
echo '{"forceLoginMethod":"gateway","forceLoginGatewayUrl":"https://gateway.test.example.com"}' | \
  sudo tee "/Library/Application Support/ClaudeCode/managed-settings.json"
```

**8. Test:**

```bash
claude /login
```

You should see the Cloud gateway screen. Press Enter, complete browser SSO, and Claude Code will route through your local gateway to Amazon Bedrock.

### Notes on the local workaround

- The Auth0 callback URL must be set to `https://gateway.test.example.com/oauth/callback`
- Your local machine needs AWS credentials configured (`~/.aws/credentials` or env vars) for Amazon Bedrock access
- `.dev` domains have HSTS preloaded in browsers, so avoid them for the hostname (self-signed certs won't work in the browser)
- The Claude Code binary must be v2.1.195+. If your standard install is older, replace it with the gateway binary
- This is for testing only. Customers with a private network path to the VPC (VPN, Direct Connect, etc.) do not need any of this.

---

## Cleanup

Remove everything the stack created:

```bash
npx cdk destroy
```

This deletes the ECS service, ALB, RDS database, ECR repository, IAM roles, security groups, DNS record, and log group. The S3 bucket and CodeBuild project used for image builds (if created by `deploy.sh`) are separate and may need manual cleanup.

## Cost

| Resource | Monthly cost |
|----------|-------------|
| ECS Fargate (0.5 vCPU, 1 GB — gateway + ADOT sidecar) | ~$9 |
| RDS db.t4g.micro | ~$12 |
| Application Load Balancer | ~$16 |
| ACM certificate | Free |
| **Total** | **~$37** |

The ADOT collector runs as a sidecar inside the gateway's Fargate task (a small memory reservation), so per-user usage telemetry adds no separate service cost. Turning telemetry off (deleting the `telemetry:` block — see "Telemetry" under "How traffic flows") saves nothing here, since there's no idle task to remove.

No license or per-seat fee from Anthropic. Amazon Bedrock inference costs are separate and the same as calling Amazon Bedrock directly without the gateway.
