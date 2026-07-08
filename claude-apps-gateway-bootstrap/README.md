# Bootstrap add-on for the Claude apps gateway

> **Sample code — a documented add-on to [`../claude-apps-gateway`](../claude-apps-gateway).**
> Deploy that sample first; this directory adds ONE stack behind its existing ALB.
> Expect parts of this capability to be superseded as the Anthropic-native product
> evolves — see [Workarounds and expected supersession](#workarounds-and-expected-supersession).

The [`claude-apps-gateway`](../claude-apps-gateway) sample gives your organization
SSO-gated Claude **inference** on Amazon Bedrock. This add-on supplies the second half of
an enterprise **Claude Desktop** rollout: **per-user configuration delivery** — models,
surface toggles, egress allowlists, and an organization-managed **MCP server fleet**
(including the built-in Microsoft 365 connector) — served from a single JSON object in S3
that you can change at any time **without redeploying anything**.

It is a [bootstrap server](https://claude.com/docs/third-party/claude-desktop/bootstrap)
in **PKCE mode**: Claude Desktop signs in to your IdP directly (authorization-code +
PKCE), presents the access token to `GET /user/bootstrap`, and receives its configuration
overlay. PKCE mode lifts the platform's origin-pinning, so managed MCP servers are
delivered with their **native cross-origin URLs and native auth** — no reverse-proxying.

```
Claude Desktop ──(1) Entra PKCE sign-in──────────────▶ Microsoft Entra ID
       │                                                      │
       ├──(2) Bearer access token──▶ /user/bootstrap ─▶ BootstrapStack (this add-on)
       │                                 │                    reads bootstrap-config.json (S3, 60s TTL)
       ├──(3) device-code sign-in──▶ claude-apps-gateway ─▶ Amazon Bedrock   (inference, unchanged)
       └──(4) direct connections──▶ managed MCP servers      (native URLs + native auth)
```

**One gateway definition.** This add-on consumes a deployed `ClaudeGatewayStack` purely
through its CloudFormation outputs — the gateway sample is never modified. Inference,
sessions, and telemetry remain entirely the gateway sample's concern; sign-in for
inference is the gateway's own device-code flow, which is independent of bootstrap mode
(two sign-ins at launch, both against the same IdP identity).

## What you deploy

| Piece | What it is |
| --- | --- |
| `BootstrapStack` (CDK) | Fargate service (no secrets — validates tokens against the IdP's public JWKS) + S3 config bucket + one listener rule (`/user/bootstrap`) on the gateway's existing ALB |
| `bootstrap/` | The Node resource server (~200 lines) and its Dockerfile |
| `bootstrap-config.example.json` | The S3 configuration object: models, governance keys, managed MCP fleet |

## Prerequisites

- A deployed [`../claude-apps-gateway`](../claude-apps-gateway) `ClaudeGatewayStack`
  (Entra ID walkthrough below; any OIDC IdP that issues JWKS-verifiable access tokens works).
- Note these values from that deployment:

| Context key | Where to get it |
| --- | --- |
| `publicUrl` | `PublicUrl` stack output |
| `vpcId` | The VPC the stack created (or the `vpcId` you passed it) |
| `albSgId` | The ALB's security group (EC2 console, or `describe-load-balancers`) |
| `listenerArn` | One lookup from the `AlbDnsName` output: |

```bash
ALB_ARN=$(aws elbv2 describe-load-balancers \
  --query "LoadBalancers[?DNSName=='<AlbDnsName output>'].LoadBalancerArn" --output text)
aws elbv2 describe-listeners --load-balancer-arn "$ALB_ARN" \
  --query "Listeners[?Port==\`443\`].ListenerArn" --output text
```

- Client: Claude Desktop **≥ 1.19367.0** (earlier builds have a bootstrap connector-intake
  bug; see [Workarounds](#workarounds-and-expected-supersession)).
- Locally: Node 20+, Docker (one image build), AWS CLI v2, `az` CLI for the Entra steps.

## Step 1 — Entra ID app registration (desktop PKCE public client)

The desktop app needs its own **public client** registration (distinct from the gateway's
confidential client). Each omission below produces a specific `AADSTS` error at sign-in,
so follow exactly:

```bash
az ad app create --display-name "Claude Desktop PKCE" --sign-in-audience AzureADMyOrg \
  --is-fallback-public-client true \
  --public-client-redirect-uris \
    "http://localhost:8990/callback" "http://127.0.0.1:8990/callback" \
    "http://localhost:8990"          "http://127.0.0.1:8990"
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

# Pre-authorize itself (no consent prompt), then create the service principal
# (without it: AADSTS650052 "lacks a service principal").
az rest --method PATCH --url "https://graph.microsoft.com/v1.0/applications/$OBJ" --body "{
  \"api\": {\"preAuthorizedApplications\": [{\"appId\": \"$APP\", \"delegatedPermissionIds\": [\"$SCOPE\"]}]}}"
az ad sp create --id $APP
```

Gotchas encoded above: redirect URIs **must include the `/callback` path** (bare host →
AADSTS50011); the client profile's scope uses the **bare GUID** form `<appId>/.default`,
*not* `api://<appId>/.default`; `requestedAccessTokenVersion: 2` makes the token audience
the bare GUID this server validates.

**Optional — built-in Microsoft 365 connector.** To deliver Desktop's built-in M365
connector through the config, register one more public client with **both platform broker
redirect URIs** (the connector signs in via the OS account broker; each platform uses a
different URI, and the Windows one embeds the client id):

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
# Grant delegated Graph permissions matching the connector's scope (e.g. Mail.Read)
# in the Entra portal -> API permissions.
```

A missing broker URI surfaces as **AADSTS50011** at connector sign-in on that platform.

## Step 2 — Deploy the stack and build the image

```bash
cd cdk && npm ci
npx cdk deploy ClaudeBootstrapStack \
  -c region=<region> \
  -c publicUrl=https://<your-gateway-host> \
  -c listenerArn=<from prerequisites> \
  -c albSgId=<from prerequisites> \
  -c vpcId=<from prerequisites> \
  -c entraTenantId=<tenant guid> \
  -c desktopClientId=<App id from step 1>
```

Then build and push the image (same convention as the gateway sample — plain
`docker build` + push; substitute the `EcrRepositoryUri` stack output):

```bash
cd ../bootstrap
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com
docker build --platform linux/amd64 -t <EcrRepositoryUri>:latest .
docker push <EcrRepositoryUri>:latest
aws ecs update-service --cluster <BootstrapStack cluster> --service <service> --force-new-deployment
```

## Step 3 — Publish the client configuration

```bash
cp bootstrap/config/bootstrap-config.example.json bootstrap-config.json
# edit: your models, governance keys, managed MCP servers (start with none)
aws s3 cp bootstrap-config.json s3://<ConfigBucketName output>/bootstrap-config.json
```

This object is the **live client configuration** — the service re-reads it on a 60-second
TTL. Every later change (add an MCP server, flip a governance key, change the model list)
is an S3 push + client relaunch. **No redeploys, ever.**

Three managed-MCP entry shapes are supported (see the example file):
**no-auth remote** (plain `url`), **OAuth remote** (`oauth` block — the client runs its own
code+loopback flow against your IdP; note some IdPs reject the RFC 8707 `resource`
parameter the client sends — Cognito works, Entra does not), and **built-in**
(`server: "microsoft365"` + tenant/client IDs from step 1).

## Step 4 — Wire a client

**macOS** — create `~/claude-bootstrap-import.json`; **Windows** — same JSON at
`%USERPROFILE%\claude-bootstrap-import.json` (or deliver the same keys as REG_SZ values
under `HKLM\SOFTWARE\Policies\Claude` via Intune/GPO):

```json
{
  "bootstrapUrl": "https://<your-gateway-host>/user/bootstrap",
  "bootstrapOidc": {
    "clientId": "<App id from step 1>",
    "issuer": "https://login.microsoftonline.com/<tenant-id>/v2.0",
    "scopes": "openid offline_access <App id>/.default",
    "redirectPort": 8990
  }
}
```

In Claude Desktop: **Settings → Developer → Configure third-party inference → Import** the
file. At launch the app performs the Entra PKCE sign-in (configuration + MCP), then the
gateway's own device-code sign-in (inference).

Verify: `Help → Troubleshooting → Copy Managed Configuration Report` shows the bootstrap
source; the app log shows `bootstrap supplied config overlay { fields: [...] }`.

## Telemetry

The gateway sample already runs an ADOT collector behind its ALB (`OtelForwardTo` output,
`https://<gateway-host>:4318`). To collect Desktop/Cowork telemetry into the same
collector, set in the S3 config:

```json
"otlpEndpoint": "https://<your-gateway-host>:4318",
"otlpProtocol": "http/protobuf"
```

## Day-2 operations

| Task | How |
| --- | --- |
| Change models / MCP fleet / governance keys | Edit S3 object → `aws s3 cp` → relaunch client (60s TTL) |
| Bootstrap server code change | `docker build` + push → `ecs update-service --force-new-deployment` |
| User offboarding | Disable in the IdP — both the PKCE token and the gateway session expire |
| Roll back a bad config push | The bucket is versioned: `aws s3api get-object --version-id ...` |

## Troubleshooting

- **AADSTS650057 / 650052 / 50011 at Desktop sign-in** → Step 1 incomplete (expose API +
  v2 tokens / missing service principal / redirect URI without `/callback`).
- **AADSTS50011 at Microsoft 365 connector sign-in** → missing platform broker redirect
  URI (see step 1's optional block).
- **Bootstrap 401 `invalid_token`** → token-audience mismatch: confirm
  `requestedAccessTokenVersion: 2` and the bare-GUID `.default` scope.
- **Config change not appearing** → wait for the 60s TTL and fully relaunch the client;
  confirm with `Copy Managed Configuration Report`.
- **VPN connects but the bootstrap fetch times out** (small responses work, large ones
  hang) → MTU blackhole on the tunnel: the AWS VPN Client sets MTU 1500 on connect; if
  the underlying path passes less, TLS responses are silently dropped. Interim fix
  `sudo ifconfig <utun-if> mtu 1300` (macOS) /
  `netsh interface ipv4 set subinterface "<VPN adapter>" mtu=1300 store=persistent`
  (Windows); a persistent macOS clamp ships in [`scripts/macos/`](scripts/macos/).

## Workarounds and expected supersession

Parts of this add-on compensate for *current* product behavior and should be re-evaluated
on each Claude Desktop release:

| Item | Why it exists | Superseded when |
| --- | --- | --- |
| Desktop **≥ 1.19367.0** pin | Earlier builds had a bootstrap connector-intake bug (managed/built-in MCP entries delivered but not instantiated) | Already fixed in 1.19367.0; pin exists so fleets don't roll out older builds |
| `disabledBuiltinTools: ["WebSearch"]` + `coworkWebSearchEnabled: false` in the example config | Amazon Bedrock rejects the server-side `web_search_*` tool type (HTTP 400); disabling avoids burned retries. **Not needed on providers that support server-side search** | Server-side web search becomes available on your inference provider |
| PKCE mode itself (vs. device-code single-origin bootstrap) | Device-code mode origin-pins the response, which forces reverse-proxying of cross-origin MCP URLs | Native cross-origin MCP delivery in device-code mode, if the platform adds it |
| Org plugins/skills not delivered here | Network plugin delivery (`organizationPluginsUrl`) is unavailable in PKCE mode; plugins ship via the filesystem org-plugins directory through MDM | PKCE-mode network plugin delivery, if the platform adds it |

## Security notes

- The bootstrap task holds **no secrets**: PKCE-mode token validation uses the IdP's
  public JWKS + audience/issuer/expiry checks only.
- The service is reachable only through the gateway's internal ALB (same private-network
  posture as the gateway sample); its SG admits only the ALB.
- cdk-nag (AwsSolutions) runs on every synth; error-level findings fail the build unless
  acknowledged with a written justification at the construct.
- The S3 config is data, not code — review pushes to it like configuration change
  control, since it steers every client's tool surface and egress allowlist.

## Security

See [CONTRIBUTING](../CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the [LICENSE](../LICENSE) file.
