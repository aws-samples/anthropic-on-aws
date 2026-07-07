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

The gateway container needs the Linux build of Claude Code. Extract it from the tarball:

```bash
tar -xzf claude-gateway-*-all.tar.gz linux-x64/claude
```

Or download it via the standard installer on a Linux machine.

## How to deploy

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

**Option B: Infrastructure only.** Deploy the stack, then push the image separately:

```bash
npx cdk bootstrap    # first time only
npx cdk deploy
```

After the stack completes, build and push the gateway image to the ECR URI shown in the outputs, then scale up:

```bash
aws ecs update-service --cluster claude-gateway --service claude-gateway-svc \
  --desired-count 1 --force-new-deployment
```

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
| `GATEWAY_NAME` | Prefix for all resource names (cluster, service, ALB, RDS, etc.) |
| `GATEWAY_HOSTNAME` | The full DNS name developers connect to |
| `HOSTED_ZONE_ID` | Route53 zone ID where the DNS record is created (optional if managing DNS externally) |
| `HOSTED_ZONE_NAME` | Route53 zone name (optional if managing DNS externally) |
| `OIDC_ISSUER` | Your IdP's OIDC discovery URL (must serve `/.well-known/openid-configuration`) |
| `OIDC_CLIENT_ID` | OAuth client ID from your IdP app registration |
| `OIDC_CLIENT_SECRET` | OAuth client secret from your IdP app registration |
| `ALLOWED_EMAIL_DOMAINS` | Only users with these email domains can sign in |
| `BEDROCK_REGION` | Region for Bedrock API calls |

## Before going to production

This stack is designed for quick testing and proof-of-concept. Before using it with real workloads:

- Change the ALB from `internetFacing: true` to `internetFacing: false` in `claude-gateway-stack.ts`. Developers must access it through VPN.
- Enable `deletionProtection: true` on the RDS instance so it's not accidentally deleted.
- Move the OIDC client secret to AWS Secrets Manager instead of passing it as an environment variable.
- Increase `desiredCount` from 0 to 2+ for high availability.
- Use private subnets for ECS tasks and remove `assignPublicIp: true`.
- Set up a VPN or Direct Connect so developers on the corporate network can reach the internal ALB.

## Testing without a VPN (local workaround)

In production, the gateway runs behind an internal ALB and developers access it through VPN. But for testing on your own laptop without VPN access to the VPC, you can run the gateway locally.

This works because the Claude Code CLI accepts `127.0.0.1` (loopback) as a valid private address.

### What you need

- PostgreSQL running locally (`brew install postgresql@16 && brew services start postgresql@16`)
- The gateway binary for your platform (macOS: `darwin-arm64/claude` from the tarball)
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

auto_include_builtin_models: true
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
- This is for testing only. Customers with VPN access do not need any of this.

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
| ECS Fargate (0.25 vCPU, 1 GB) | ~$9 |
| RDS db.t4g.micro | ~$12 |
| Application Load Balancer | ~$16 |
| ACM certificate | Free |
| **Total** | **~$37** |

No license or per-seat fee from Anthropic. Amazon Bedrock inference costs are separate and the same as calling Amazon Bedrock directly without the gateway.
