# Claude Apps Gateway + PKCE Bootstrap on AWS

> **Sample code — not production-ready as-is.** Deploying this creates AWS resources that
> incur costs (Fargate, RDS, NAT, Client VPN, ALB). Review the security posture and
> adaptation guidance in [`docs/AS-BUILT.md`](docs/AS-BUILT.md) before production use.

Self-hosted Claude enterprise control plane: the **Claude apps gateway** (SSO → Amazon
Bedrock inference, model policy, per-user spend quotas) and a **PKCE bootstrap server**
(per-user Claude Desktop/Cowork configuration + a managed MCP server fleet), on ECS Fargate
behind an internal ALB, reachable only over a private network path.

For the **architecture, platform rules, security posture, and tool governance**, read
[`docs/AS-BUILT.md`](docs/AS-BUILT.md). This README is the complete install and operations
guide — everything needed to stand the system up in your own account is on this page.

![Architecture](docs/architecture.png)

*(Editable source: `docs/architecture.drawio`)*

## Repo layout

```
cdk/                    CDK (TypeScript) app — all stacks wired in bin/cdk.ts
  lib/config.ts           reads deployment.config.json (gitignored, per-environment)
  lib/network-stack.ts    VPC, VPC endpoints (incl. AgentCore gateway PrivateLink), SGs
  lib/vpn-stack.ts        AWS Client VPN (mutual TLS)
  lib/data-stack.ts       RDS Postgres, ECR repos, private EC2 image builder
  lib/gateway-stack.ts    gateway + ADOT telemetry sidecar, internal IPv4-only ALB
  lib/bootstrap-stack.ts  bootstrap service + S3 config bucket
  lib/monitoring-stack.ts spend-metrics / spend-admin / web-search relay Lambdas + alarm
  lib/dashboard-stack.ts  CloudWatch dashboard (claude-observability)
  lib/private-mcp-stack.ts optional cross-region PrivateLink path (endpoint VPC + peering)
  lib/dns-stack.ts        split-horizon private DNS zone
gateway/                gateway image: Dockerfile + gateway.yaml (identifiers via env)
bootstrap/              bootstrap server (server.js), config example, org-plugins/
lambda/                 spend-metrics, spend-admin-mcp, websearch-mcp handlers
scripts/                numbered setup/ops scripts (referenced throughout this guide)
docs/                   AS-BUILT.md · architecture diagram
```

---

## Installation

Everything deployment-specific lives in **`deployment.config.json`** at the repo root
(gitignored). The repository itself contains no account IDs, domains, or tenant IDs.

### Prerequisites

- An AWS account with Amazon Bedrock **model access enabled** for the Claude models in your
  region (Bedrock console → Model access).
- A **Microsoft Entra ID tenant** you can create app registrations in (or any OIDC IdP for
  the gateway; the bootstrap PKCE steps below are written for Entra).
- A **public Route 53 hosted zone** for a domain you control (used for ACM certificate
  validation; the gateway hostname is never published publicly).
- Locally: Node 20+, AWS CLI v2, `az` CLI (for Entra), an AWS profile with admin access.
- **No local Docker needed** — images build on a private EC2 builder via SSM.
- Client versions: `claude` CLI ≥ 2.1.195; Claude Desktop ≥ 1.10270.0.

### Step 0 — Configuration file

```bash
cp deployment.config.example.json deployment.config.json
```

Fill in: account, region, VPC/VPN CIDRs, your public zone name, the gateway hostname
(e.g. `claude-gw.example.com`). The Entra IDs and secret ARNs are completed in steps 1–2.

**Region note:** `gateway/gateway.yaml` maps model IDs to Bedrock **inference profiles**.
The file ships with `au.anthropic.*` (ap-southeast-2) profiles — **edit the `models:` block
(and `GATEWAY_MODELS` in `cdk/lib/config.ts`) to your region's profile IDs**
(`us.anthropic.*`, `eu.anthropic.*`, …), or inference fails at runtime with
model-not-found errors.

### Step 1 — Entra ID app registrations

**App A — gateway (confidential client).** Used by the Claude apps gateway for user sign-in.

```bash
az ad app create --display-name "Claude Gateway" --sign-in-audience AzureADMyOrg \
  --web-redirect-uris "https://<your-gateway-host>/oauth/callback"
# note the appId → deployment.config.json "entraClientId"
az ad app credential reset --id <appId>        # note the client secret for step 2
az ad sp create --id <appId>
```

Add optional claims `email` and `upn` to the ID token (Entra portal → Token configuration).
For group-scoped model/settings policies, also enable the `groups` claim — Entra emits group
**Object IDs**, so use GUIDs in `gateway.yaml` `managed.policies.match.groups`.

**App B — desktop PKCE (public client).** Used by Claude Desktop to fetch its bootstrap
configuration. This app has several **non-obvious requirements** — each omission produces a
specific AADSTS error at sign-in, so follow exactly:

```bash
az ad app create --display-name "Claude Desktop PKCE" --sign-in-audience AzureADMyOrg \
  --is-fallback-public-client true \
  --public-client-redirect-uris \
    "http://localhost:8990/callback" "http://127.0.0.1:8990/callback" \
    "http://localhost:8990"          "http://127.0.0.1:8990"
# note the appId → deployment.config.json "desktopClientId"
APP=<appId>; OBJ=$(az ad app show --id $APP --query id -o tsv)

# Expose an API + delegated scope, and require v2 access tokens (aud = bare GUID).
# Without this: AADSTS650057 "Invalid resource" at sign-in.
SCOPE=$(python3 -c "import uuid; print(uuid.uuid4())")
az rest --method PATCH --url "https://graph.microsoft.com/v1.0/applications/$OBJ" --body "{
  \"identifierUris\": [\"api://$APP\"],
  \"api\": {\"requestedAccessTokenVersion\": 2,
    \"oauth2PermissionScopes\": [{\"id\": \"$SCOPE\", \"value\": \"access_as_user\",
      \"type\": \"User\", \"isEnabled\": true,
      \"adminConsentDisplayName\": \"Access bootstrap\", \"adminConsentDescription\": \"Fetch per-user Claude config\",
      \"userConsentDisplayName\": \"Access bootstrap\", \"userConsentDescription\": \"Fetch your Claude config\"}]}}"

# Pre-authorize itself (no consent prompt):
az rest --method PATCH --url "https://graph.microsoft.com/v1.0/applications/$OBJ" --body "{
  \"api\": {\"preAuthorizedApplications\": [{\"appId\": \"$APP\", \"delegatedPermissionIds\": [\"$SCOPE\"]}]}}"

# Service principal — without it: AADSTS650052 "lacks a service principal".
az ad sp create --id $APP
```

Gotchas encoded above, for the record: the redirect URIs **must include the `/callback`
path** (bare host only → AADSTS50011); the desktop import profile's scope uses the **bare
GUID** form `<appId>/.default`, *not* `api://<appId>/.default`; and
`requestedAccessTokenVersion: 2` is what makes the access-token audience the bare GUID the
bootstrap server validates.

**App C — built-in Microsoft 365 connector (public client, optional).** Only needed if you
deliver Claude Desktop's built-in M365 connector through the bootstrap config (requires
Desktop ≥ 1.19367.0). The connector signs in via the **OS account broker** (macOS SSO
broker / Windows WAM), and each platform uses a different redirect URI — register **both**
so one app registration serves Mac and Windows endpoints, plus the loopback fallback:

```bash
az ad app create --display-name "Claude M365 Connector" --sign-in-audience AzureADMyOrg \
  --is-fallback-public-client true
APP=<appId>; OBJ=$(az ad app show --id $APP --query id -o tsv)
az rest --method PATCH --url "https://graph.microsoft.com/v1.0/applications/$OBJ" --body "{
  \"publicClient\": {\"redirectUris\": [
    \"http://localhost\",
    \"msauth.com.anthropic.claudefordesktop://auth\",
    \"ms-appx-web://Microsoft.AAD.BrokerPlugin/$APP\",
    \"https://login.microsoftonline.com/common/oauth2/nativeclient\"]}}"
az ad sp create --id $APP
# Grant delegated Microsoft Graph permissions matching the connector entry's scope
# (e.g. Mail.Read) in the Entra portal → API permissions.
```

Missing the platform broker URI surfaces as **AADSTS50011** in the sign-in dialog on that
platform (the Windows one embeds the client ID, so it is registration-specific). Reference
the app in the S3 bootstrap config as
`{"name": "Microsoft 365", "server": "microsoft365", "tenantId": "<tenant>",
"clientId": "<App C appId>", "scope": "Mail.Read"}`.

### Step 2 — Secrets, certificates, CDK bootstrap

```bash
export AWS_PROFILE=<profile> AWS_REGION=<region>     # override any inherited AWS_REGION
cd cdk && npx cdk bootstrap && cd ..

bash scripts/01-secrets.sh          # creates Secrets Manager entries, prints their ARNs
#   → paste the printed ARNs into deployment.config.json "secrets"
#   → store App A's client secret:
#     aws secretsmanager put-secret-value \
#       --secret-id claude-gateway/entra-client-secret --secret-string '<App A secret>'

bash scripts/02-certs.sh            # VPN mutual-TLS certs + ACM import; writes cert-arns.env
source cert-arns.env
```

For the **ALB certificate**: request a public ACM certificate for your gateway hostname
(DNS-validated in your public zone) and use its ARN as `albCertArn` in step 3. Users then
get a browser-trusted padlock on a private-IP endpoint (split-horizon DNS — AS-BUILT §2.2).

### Step 3 — Deploy

```bash
cd cdk
npx cdk deploy ClaudeGw-Network ClaudeGw-Data --require-approval never
bash ../scripts/03-postgres-url.sh                        # Postgres URL secret from RDS
AWS_REGION=<region> bash ../scripts/04-build-images.sh    # builds BOTH images on the EC2 builder
npx cdk deploy --all --require-approval never \
  -c serverCertArn=$SERVER_CERT_ARN -c clientCertArn=$CLIENT_CERT_ARN \
  -c albCertArn=<your public ACM cert ARN>
```

Deploy order matters only the first time (Network/Data before the image build; the rest
after). Subsequent code changes: rebuild images (`04`) + force a new ECS deployment.

### Step 4 — Client bootstrap config (S3)

```bash
cp bootstrap/config/bootstrap-config.example.json bootstrap/config/bootstrap-config.json
# edit: your models, managed MCP servers (start with none), governance keys
aws s3 cp bootstrap/config/bootstrap-config.json \
  s3://<ConfigBucket name from the Bootstrap stack output>/bootstrap-config.json
```

This file is the **live client configuration** — the bootstrap server re-reads it on a 60s
TTL, so every later change is a push + client relaunch, **no redeploy**.

### Step 5 — Wire up a client machine

Both platforms need the **AWS VPN Client** first: export the Client VPN profile
(AWS console → Client VPN endpoint → Download client configuration), embed your client
cert/key from `./pki`, and import it into the AWS VPN Client.

**macOS**

```bash
bash scripts/05-wire-mac.sh    # writes managed-settings.json (CLI) + the Desktop import file
```

**Windows**

The equivalents are a registry policy (CLI) and the same JSON import file (Desktop). In an
elevated PowerShell:

```powershell
# Claude Code CLI — managed settings live under HKLM. Values must be REG_SZ (JSON string
# for arrays/objects) or REG_DWORD; other types are ignored by the app.
New-Item -Path "HKLM:\SOFTWARE\Policies\Claude" -Force | Out-Null
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Claude" -Name "forceLoginMethod" -Value "gateway" -Type String
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Claude" -Name "forceLoginGatewayUrl" -Value "https://<your-gateway-host>" -Type String

# Claude Desktop — same import file as macOS:
@"
{ "bootstrapUrl": "https://<your-gateway-host>/user/bootstrap",
  "bootstrapOidc": { "clientId": "<App B appId>",
    "issuer": "https://login.microsoftonline.com/<tenant-id>/v2.0",
    "scopes": "openid offline_access <App B appId>/.default",
    "redirectPort": 8990 } }
"@ | Set-Content "$env:USERPROFILE\claude-bootstrap-import.json"
```

Then, identically on both platforms:

- **Claude Code**: launch → gateway device-code sign-in → your Entra → model list.
- **Claude Desktop**: Settings → Developer → Configure third-party inference → Import the
  generated profile → Entra PKCE sign-in (config) + gateway sign-in (inference).
- Org plugins/skills (optional): `sudo bash scripts/06-install-org-plugins.sh` (macOS;
  Windows path is `C:\Program Files\Claude\org-plugins\`).

### Step 6 — Verify

```bash
dig +short <your-gateway-host>          # over VPN: private IPs only, no public answers
curl -s https://<your-gateway-host>/healthz
claude                                   # sign in, run a prompt → Bedrock via the gateway
AWS_REGION=<region> bash scripts/07-quota.sh spend   # per-user spend appears after first use
```

### Optional add-on — spend-admin & web-search MCP (AgentCore)

The managed MCP examples (spend administration in chat; in-region web search) use **Amazon
Bedrock AgentCore gateways**, which are **not yet in the CDK app** (created via CLI; a
`ClaudeGw-AdminMcp` stack is planned). Per gateway, the pattern is:

1. A Cognito user pool with `AllowAdminCreateUserOnly` — **pool membership is the access
   gate** — plus a public app client (code+PKCE, callbacks `http://localhost:8080/callback`
   and the `127.0.0.1` variant).
2. `aws bedrock-agentcore-control create-gateway` with a `CUSTOM_JWT` authorizer pointing at
   the pool's OIDC discovery URL and app client.
3. `create-gateway-target` wrapping a Lambda from the Monitoring stack (`SpendAdminMcpFn` /
   `WebSearchMcpFn` — ARNs in stack outputs), with an inline tool schema.
4. Add the gateway URL to the S3 bootstrap config with
   `oauth: {mode: "byo", clientId: <pool client>, authorizationServer: [<pool issuer>],
   scope: " openid email profile", callbackPort: 8080}`.

> **IdP note:** use Cognito (or another IdP that tolerates the RFC 8707 `resource`
> parameter) for MCP OAuth — the desktop client sends it on every authorize request and
> **Microsoft Entra rejects the combination** (AADSTS9010010). Details: AS-BUILT §7.1b.

In-region AgentCore gateways are reachable **privately** through the VPC's
`bedrock-agentcore.gateway` PrivateLink endpoint (deployed by the Network stack). The
optional `ClaudeGw-PrivateMcpUsEast1` stack extends the private path to us-east-1 gateways
(endpoint VPC + inter-region peering).

---

## Day-2 operations

| Task | How |
| --- | --- |
| Client config (models, MCP fleet, egress allowlist, governance keys) | Edit the S3 `bootstrap-config.json` → `aws s3 cp` → relaunch client. **60s TTL, no redeploy.** |
| Server code change (gateway.yaml, server.js) | `scripts/04-build-images.sh` → force-new-deployment on the ECS service |
| Org plugins / skills | `sudo bash scripts/06-install-org-plugins.sh` (filesystem delivery; fleet: MDM) |
| Spend quotas (view / set / block per user) | `scripts/07-quota.sh spend\|set\|block\|audit` — or the **spend-admin** connector in chat ("run the spend report"). The gateway API returns **USD cents**; the script and Lambdas convert to dollars. |
| Observability | CloudWatch dashboard `claude-observability`; alarm `claude-gateway-spend-cap-80pct` |
| User offboarding | Disable in Entra (inference stops within the 1h session TTL); for immediate block: `scripts/07-quota.sh block <sub>` |

## Troubleshooting quick hits

- **AADSTS650057 / 650052 / 50011 at Desktop sign-in** → Step 1 App B incomplete (expose
  API + v2 tokens / missing service principal / redirect URI without `/callback`).
- **AADSTS50011 at Microsoft 365 connector sign-in** → App C is missing the platform's
  broker redirect URI (`msauth.com.anthropic.claudefordesktop://auth` on macOS,
  `ms-appx-web://Microsoft.AAD.BrokerPlugin/<clientId>` on Windows). See Step 1 App C.
- **Model errors through the gateway (404/400)** → `gateway.yaml` `models:` block doesn't
  match your region's Bedrock inference-profile IDs.
- **`/login` refuses to connect** → the gateway hostname resolved to a public IP on the
  client; check VPN + split-horizon DNS (AS-BUILT §2).
- **Bootstrap 401 `invalid_token`** → App B token-audience mismatch; confirm
  `requestedAccessTokenVersion: 2` and the bare-GUID `.default` scope in the import profile.
- **MCP OAuth fails with AADSTS9010010** → an MCP server's BYO OAuth points at Entra; use
  Cognito (see the IdP note above).

### AWS Client VPN: connects but requests hang / "Configuration sync issue: timeout"

If the VPN connects and DNS resolves, but the Desktop bootstrap fetch (or any large HTTPS
response through the tunnel) times out while **small** responses work, suspect an **MTU
blackhole**: the AWS VPN Client sets the tunnel MTU to 1500 on every connect, and if any
hop between the endpoint and AWS passes smaller packets (common on hotel/home/office
links), large TLS records are silently dropped — TCP connects, the TLS handshake hangs.

Diagnose (macOS):

```bash
# TCP works... (instant small response from the ALB)
printf 'GET / HTTP/1.0\r\n\r\n' | nc -w 5 <alb-private-ip> 443   # → HTTP 400 instantly
# ...but a full TLS exchange hangs:
curl -sS --max-time 10 https://<your-gateway-host>/healthz        # → timeout
# Confirm the underlying path is smaller than 1500 (payload 1472 = 1500-byte packet):
ping -c 2 -D -s 1472 8.8.8.8    # dropped ⇒ path < 1500
ping -c 2 -D -s 1372 8.8.8.8    # passes  ⇒ path ≥ 1400
```

Fix: clamp the tunnel MTU below the path limit — `sudo ifconfig <utun-if> mtu 1300`
(find the interface with `route -n get <vpc-ip>`). The VPN client resets the MTU to 1500
on every reconnect, so for a permanent fix install the LaunchDaemon in
[`scripts/macos/`](scripts/macos/) (`clamp-vpn-mtu.sh` + `vpn-mtu-clamp.plist`), which
re-applies the clamp within 15 s of any reconnect. On Windows:
`netsh interface ipv4 set subinterface "<VPN adapter name>" mtu=1300 store=persistent`.

---

## Security

See [CONTRIBUTING](../CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the [LICENSE](../LICENSE) file.
