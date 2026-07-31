# Claude Code on Lambda MicroVMs: architecture and deployment guide

## Purpose

This guide describes how to deploy a private remote development environment
in AWS where:

- developers create and manage disposable environments through a private
  browser control plane with an embedded terminal;
- operators can automate IAM-owned environments with a source-tree CLI;
- Visual Studio Code connects to a Linux ARM64 AWS Lambda MicroVM through
  Microsoft Remote Tunnels;
- Claude Code runs inside the MicroVM rather than on the developer device;
- browser users authenticate with an Amazon Cognito user pool created by the
  platform stack;
- Claude inference uses Amazon Bedrock directly through a private endpoint by
  default, with an optional integration for a separately deployed private
  gateway;
- workspace state is checkpointed to encrypted Amazon S3 storage; and
- approved MCP tools can be exposed through Amazon Bedrock AgentCore Gateway.

The document is written for cloud, identity, network, security, and operations
teams. Replace values in angle brackets with values approved for the target
environment.

The package [README](../README.md) is the canonical developer quickstart,
including the cross-platform Terminal and VS Code connection workflows. This
guide remains the source of truth for architecture, deployment, identity,
networking, security boundaries, acceptance, operations, and teardown. It
adds operator detail without requiring developers to follow the deployment
procedure.

For the default Bedrock mode, work through [Prerequisites](#prerequisites),
[Network preparation](#network-preparation),
[Deploy the platform](#deploy-the-platform),
[Configure portal identity](#configure-portal-identity-amazon-cognito), and
[Acceptance](#acceptance-and-verification).

For `claude-gateway` mode, first deploy and approve that component using its
own documentation, then complete
[Optional private gateway integration](#optional-private-gateway-integration).
This guide intentionally does not duplicate the gateway's identity,
deployment, operations, or teardown procedures.

## What will be deployed

The `ClaudeMicrovmStack` deploys:

- a VPC spanning two Availability Zones;
- two private subnets for Lambda Network Connector ENIs and VPC endpoints;
- two public subnets for approved public egress through a NAT Gateway;
- a private API Gateway REST API;
- an optional Amazon Cognito user pool, hosted UI domain, and secretless
  browser PKCE app client;
- a control Lambda for environment lifecycle operations;
- DynamoDB tables for session and ownership state;
- an encrypted, versioned S3 bucket for workspace checkpoints;
- KMS keys, CloudWatch log groups, IAM roles, and SSM parameters; and
- optional AgentCore Gateway private connectivity.

The Lambda MicroVM itself runs in the AWS-managed service plane. It is not an
EC2 instance and is not placed in a subnet you manage. The platform VPC
contains Network Connector ENIs through which the MicroVM reaches approved
private and public destinations.

The platform does not deploy private developer connectivity, corporate DNS,
or the optional inference gateway. Those remain separately managed
prerequisites.

## Architecture

![Remote development architecture](../images/architecture.png)

The editable source is
[../images/architecture.drawio](../images/architecture.drawio).

### Primary flows

| Flow | Description |
| --- | --- |
| Cognito control | The browser signs in through the Cognito hosted UI with authorization code and PKCE, sends an ID token to the private API, and the Cognito authorizer validates it before the control Lambda manages a MicroVM for the `oidc:<sub>` owner. |
| IAM control | The CLI signs requests to the private API with SigV4, and the control Lambda derives a separate owner from the IAM caller ARN. |
| Browser terminal | The portal requests a five-minute native shell credential for one running environment, then connects directly to that MicroVM's `SHELL_INGRESS` WebSocket. |
| Remote editor | Local VS Code and the remote VS Code Server connect outbound through Microsoft dev tunnels. No SSH listener or inbound application endpoint is created. |
| Inference, default | Claude Code uses the MicroVM execution role to invoke the approved Amazon Bedrock model through the private Runtime or Messages endpoint selected by its model ID. |
| Inference, optional gateway | Claude Code reaches a separately deployed private HTTPS gateway through the platform VPC connector and private routing. |
| MCP tools | The MicroVM uses execution-role SigV4 credentials to call the approved AgentCore Gateway through PrivateLink. |
| Persistence | `/workspace` is checkpointed to versioned, KMS-encrypted S3. Tunnel credentials and server binaries are intentionally excluded. |

## Design rationale

### Cognito browser authentication

The platform stack creates its own Amazon Cognito user pool, hosted UI domain,
and public browser app client. Operators create users directly in the pool;
self-service sign-up is disabled. The callback is the private portal URL, and
the client has no secret because it uses authorization code with PKCE. The
portal derives ownership from the Cognito `sub`.

An optional inference gateway owns its own identity configuration. Its
identity client and secrets are not shared with the platform Cognito client.

### Service-side image builds

The MicroVM image is built by the AWS Lambda MicroVM service from a source
archive. Local Docker is not required. The image's Claude Code and VS Code CLI
versions and checksums are declared once in `microvm/tool-versions.json`.

### Durable workspace, ephemeral compute

The MicroVM is disposable. Source code, Git state, and Claude state under
`/workspace` survive replacement through encrypted S3 checkpoints. Remote
Tunnel identity, VS Code Server binaries, temporary AWS credentials, and
device codes are not checkpointed.

### Eight-hour replacement lifecycle

Each MicroVM invocation has a maximum duration of 28,800 seconds. Suspended
time counts toward that limit. The reconciler begins a managed termination 45
minutes before expiry so the terminate hook can pause the tunnel and upload
`/workspace`.

The checkpoint is addressed by authenticated owner and workspace ID. Starting
the same workspace after termination restores the latest checkpoint into a
fresh MicroVM. This is checkpoint and restore, not live process migration.
Running processes, memory, open terminals, `/home/developer`, VS Code Server
files, and temporary credentials are recreated. A hard interruption can lose
changes since the latest successful checkpoint, so Git remains the source of
record.

## Identity and authorization boundaries

| Boundary | Authentication | Authorizes |
| --- | --- | --- |
| Cognito browser control | Amazon Cognito user pool ID token | Create, read, connect, suspend, resume, terminate, and start tunnel authentication for the `oidc:<sub>` owner |
| IAM CLI control | AWS SigV4 | Private control API operations for the IAM principal owner |
| Native shell | Five-minute Lambda MicroVM shell token | Temporary terminal attachment to one MicroVM |
| VS Code tunnel | Microsoft or GitHub device identity | Join one Microsoft dev tunnel |
| Amazon Bedrock | MicroVM execution-role SigV4 | Invoke the configured model endpoint and resources |
| Optional inference gateway | Gateway-owned user identity | Gateway session, policy, and inference access |
| AgentCore tools | MicroVM execution-role SigV4 | Invoke the approved AgentCore Gateway and targets |

A credential in one boundary does not grant access in another:

- Cognito sign-in does not authenticate VS Code Remote Tunnels;
- Cognito and IAM ownership remain separate, with no identity linking or
  environment migration;
- Remote Tunnels sign-in does not grant Claude inference;
- AgentCore policy does not govern `/v1/messages`; and
- the developer device does not receive the MicroVM execution role.

## Prerequisites

### Organizational decisions

Agree and record the following before deployment:

- AWS account and Region;
- platform VPC CIDR;
- private connectivity and private DNS for developer devices;
- trusted private source CIDR for the API endpoint;
- portal user-provisioning ownership for the Cognito user pool;
- approved Bedrock model and endpoint family;
- log retention, data classification, and checkpoint retention;
- NAT or centralized egress architecture;
- production resilience, quotas, alarms, and cost controls;
- for VS Code sessions, approval to relay source, terminal, and editor
  protocol traffic through Microsoft dev tunnels, including the permitted
  Microsoft or GitHub identity, data residency, proxy, endpoint allowlisting,
  and TLS-inspection policy; and
- when optional gateway mode is selected, ownership and approval of the
  separately deployed gateway and the private network integration described
  in [Optional private gateway integration](#optional-private-gateway-integration).

Relay approval is a deployment prerequisite for VS Code mode, not a
post-deployment limitation. Organizations that do not approve that relay can
deploy terminal-only environments.

### AWS access

The platform deployment role requires permissions to create and manage:

- CloudFormation and CDK bootstrap resources;
- VPCs, subnets, route tables, endpoints, security groups, NAT Gateways, and
  Elastic IP addresses;
- API Gateway, Lambda, Lambda MicroVM resources, and Network Connectors;
- IAM roles and policies;
- S3, KMS, DynamoDB, SSM, Cognito, and CloudWatch; and
- Bedrock and optional AgentCore resources.

Use a dedicated deployment or CI role rather than long-lived IAM user
credentials. A separately deployed gateway has its own permission
requirements in its canonical deployment documentation.

### Local tools

- Node.js 20 or later on deployment and operator systems
- npm
- Python 3.12 for local MicroVM agent tests
- AWS CLI v2
- AWS CDK CLI compatible with this repository
- `jq`

No local Docker installation is required.

Developer devices need only a supported browser for Terminal environments.
They do not require Node.js, npm, an AWS profile, a source checkout, or a
custom executable. VS Code environments additionally require an approved VS
Code Desktop and Remote Tunnels installation.

### Deployment value worksheet

| Value | Example | Your value |
| --- | --- | --- |
| AWS profile or CI role | `platform-admin` | |
| AWS account | `111122223333` | |
| AWS Region | `us-east-1` | |
| Platform VPC CIDR | `10.42.0.0/16` | |
| Trusted developer source CIDR | `10.100.0.0/22` | |
| Bedrock model or profile ID | `anthropic.claude-sonnet-5` | |
| AgentCore Gateway URL and ARN | Optional | |
| Portal enabled | `true` | |
| Optional gateway URL | `https://<private-gateway-hostname>` | |
| Optional gateway VPC CIDR | Non-overlapping private CIDR | |

## Network preparation

### CIDR and routes

The platform VPC, developer networks, corporate networks, and Transit Gateway
attachments must use non-overlapping CIDRs.

The platform private subnets require:

| Destination | Route |
| --- | --- |
| S3 prefix list | S3 gateway endpoint |
| Private AWS services | Interface endpoints |
| Approved public HTTPS | NAT Gateway or centralized egress |

The default sample creates one NAT Gateway to control cost. Production
deployments that require zonal resilience should use one NAT Gateway per
Availability Zone or an approved centralized egress design.

### Private connectivity for developers

Provide an organization-managed private path using one of:

- AWS Client VPN or site-to-site VPN;
- AWS Direct Connect;
- Transit Gateway connectivity; or
- an approved VDI or workstation already inside the routed network.

The private API is not reachable from an unrouted public workstation. The
stack does not create client VPN endpoints, certificates, or private network
attachments.

Developer devices must resolve and reach the private execute-api endpoint.
The Cognito hosted UI and approved relay endpoints use public HTTPS through
the organization's existing device egress.

### Security-group policy

Minimum platform rules are:

| Resource | Inbound |
| --- | --- |
| Platform API endpoint | TCP 443 from the trusted private client CIDR and connector security group |
| Interface VPC endpoints | TCP 443 from workload security groups only |

Do not expose the API endpoint publicly. The API resource policy is pinned to
the stack-created VPC endpoint.

## Configure portal identity (Amazon Cognito)

The stack creates the user pool, hosted UI domain, and browser app client when
`"enablePortal": true` is set in deployment configuration. There is nothing
to register before deployment.

The app client is a public PKCE client with no secret. Its callback is the
stack's `PortalUrl` output. Self-service sign-up is disabled.

After deployment, create each user with a verified email address:

```bash
PORTAL_USER_POOL_ID="$(
  aws cloudformation describe-stacks \
    --stack-name ClaudeMicrovmStack \
    --region <region> \
    --profile <profile> \
    --query "Stacks[0].Outputs[?OutputKey=='PortalUserPoolId'].OutputValue" \
    --output text
)"

aws cognito-idp admin-create-user \
  --user-pool-id "$PORTAL_USER_POOL_ID" \
  --username '<user@example.com>' \
  --user-attributes \
    Name=email,Value='<user@example.com>' \
    Name=email_verified,Value=true \
  --region <region> \
  --profile <profile>
```

Cognito emails a temporary password and requires a new password at first
sign-in. Passwords require at least 12 characters with upper case, lower
case, digits, and symbols.

The browser requests `openid profile email`. The API Gateway authorizer
validates token signature, issuer, app-client audience, and expiry. The
control Lambda uses the verified `sub` as the owner identity.

## Optional private gateway integration

The gateway is a separate deployable component. Its own documentation is the
source of truth:

- [Deployment and identity configuration](../../claude-apps-gateway/cdk/README.md)
- [Private connectivity and DNS](../../claude-apps-gateway/docs/connectivity.md)
- [Operational gotchas](../../claude-apps-gateway/docs/gotchas.md)
- [Teardown](../../claude-apps-gateway/docs/teardown.md)

Do not copy those procedures into this guide. Complete their security review,
identity setup, image build, deployment, acceptance, operations, and teardown
in the gateway's own change record.

This platform needs only the following integration contract:

1. The gateway exposes an approved private HTTPS URL.
2. The gateway and platform CIDRs do not overlap.
3. Platform private subnets have a route to the gateway, and the gateway
   network has the corresponding return route.
4. The gateway security policy accepts HTTPS from the effective platform
   source CIDR.
5. The private hostname resolves to private IPv4 addresses from both the
   MicroVM network path and the developer browser's approved private network.
6. The TLS hostname and chain are trusted by both clients.
7. Gateway health, identity, inference, rollback, and recovery acceptance has
   passed under the gateway owner's procedures.

Record the approved URL and gateway CIDR, then configure the platform with:

```json
{
  "inferenceMode": "claude-gateway",
  "claudeGatewayUrl": "https://<private-gateway-hostname>",
  "claudeGatewayCidr": "<gateway-vpc-cidr>"
}
```

The network owner supplies the routes described above. The platform applies
the runtime provider settings, but it does not create, upgrade, monitor, or
delete the gateway.

## Deploy the platform

### Configure deployment

Copy the example:

```bash
cp deployment.example.json deployment.json
```

Configure the default Bedrock path:

```json
{
  "region": "<region>",
  "vpcCidr": "<platform-vpc-cidr>",
  "projectName": "claude-microvm",
  "trustedClientCidr": "<routed-developer-source-cidr>",
  "inferenceMode": "bedrock",
  "bedrockModelId": "<approved-bedrock-model-or-profile-id>",
  "allowClaudeAiSubscription": false,
  "agentCoreGatewayUrl": "<optional-agentcore-url>",
  "agentCoreGatewayArn": "<optional-agentcore-arn>",
  "idleAfterSeconds": 900,
  "suspendedRetentionSeconds": 3600,
  "microvmMemoryMib": 4096,
  "provisionTimeoutMinutes": 60,
  "enablePortal": true
}
```

Set `agentCoreGatewayUrl` and `agentCoreGatewayArn` together or omit both.
Keep `allowClaudeAiSubscription` false unless direct personal subscriptions
are explicitly approved.

For optional gateway mode, replace the inference fields with the values in
[Optional private gateway integration](#optional-private-gateway-integration).

### Choose a Bedrock model ID

The stack pins one explicit Claude model ID and rejects other providers and
malformed values. The accepted ID determines the endpoint:

- `anthropic.claude-sonnet-5` is the default direct model ID. Claude Code
  routes this form to the Messages API, and the stack creates a private
  Messages endpoint with the required project-scoped permission.
- `us.anthropic.claude-*`, `eu.anthropic.claude-*`,
  `au.anthropic.claude-*`, and `global.anthropic.claude-*` are geographic or
  global inference-profile IDs. Claude Code routes these through the private
  Bedrock Runtime endpoint.

Machine-managed settings expose the matching Claude Code family alias, such as
`sonnet`, as the only selectable model and map that alias to the exact
`bedrockModelId`. The raw `anthropic.*` or inference-profile ID is therefore
not shown as a second Custom model. Before deployment, confirm that the exact
model and endpoint are available in the target Region and that the account has
model access. See the
[Claude Sonnet 5 model card](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-anthropic-claude-sonnet-5.html).

### Validate and deploy

```bash
npm ci
npm --prefix microvm ci
npm test
npm run build
npm --prefix microvm run build
npm run synth -- --quiet

npm run deploy -- \
  --config deployment.json \
  --profile <profile> \
  --require-approval never
```

The deploy command:

1. deploys `ClaudeMicrovmStack`;
2. creates or updates the Lambda Network Connector;
3. packages and uploads the MicroVM source;
4. creates or updates the ARM64 MicroVM image through the AWS service;
5. waits for an active image version; and
6. records the active image and connector ARNs in SSM.

No local Docker build is used.

### Provider policy inside the MicroVM

For Bedrock mode, the root lifecycle agent configures Claude Code with the
execution role's temporary AWS credentials and the approved model ID. Direct
IDs enable the Messages endpoint; inference-profile IDs use the Runtime
endpoint. No interactive Claude sign-in occurs.

For optional gateway mode, the lifecycle agent writes machine-managed
settings equivalent to:

```json
{
  "forceLoginMethod": "gateway",
  "forceLoginGatewayUrl": "https://<private-gateway-hostname>",
  "allowManagedMcpServersOnly": true
}
```

Changing an active workspace between `bedrock`, `claude-gateway`, and
`claude-ai` requires terminating and recreating that session.

## Configure developer devices

### Network access

Connect through the approved private network or an approved routed VDI.
Validate private DNS and HTTPS to:

- the private API Gateway endpoint;
- the Cognito hosted UI domain when the portal is enabled;
- Microsoft dev tunnels and required VS Code distribution endpoints for VS
  Code mode; and
- the private gateway URL when optional gateway mode is enabled.

### Visual Studio Code compatibility workarounds

The portal does not install software on the developer device. Use an approved
VS Code Desktop and Remote Tunnels installation. The source-tree IAM operator
CLI has an optional acceptance helper that uses an isolated local profile
under `~/.claude-microvm/vscode-user-data` and currently applies two temporary
compatibility workarounds:

1. It installs a pinned pre-release `ms-vscode.remote-server` build with
   `--pre-release --force`. A stable extension release supersedes this pin
   only after remote connection, terminal, extension, and reconnect acceptance
   passes on supported macOS and Windows clients.
2. It writes
   `"microsoft-authentication.implementation": "msal-no-broker"` so Microsoft
   authentication uses the system browser. Remove this override only after
   the native broker passes Microsoft tunnel sign-in and reconnect acceptance
   through the isolated profile and approved VDI path on supported macOS and
   Windows clients.

These settings are current-behavior workarounds, not permanent platform
requirements. Keep them confined to the isolated profile. The other managed
compatibility setting is:

```json
{
  "extensions.supportNodeGlobalNavigator": true
}
```

The local and remote tunnel endpoints must use the same approved Microsoft or
GitHub identity. Microsoft is the default provider in the portal, control
service, and source-tree operator CLI; select GitHub explicitly when required.

### Start environments

The browser is the developer control plane. **Terminal** embeds a terminal
connected to the native MicroVM shell and does not start VS Code Server or a
Remote Tunnel. **VS Code** creates an editor environment and requires a
separate Microsoft or GitHub tunnel identity.

#### Portal Terminal workflow

1. Open the private `PortalUrl` and sign in through Cognito.
2. Select **Terminal**, create the environment, wait for `RUNNING`, and choose
   **Connect** in that environment's row.
3. The portal requests a five-minute shell credential and opens the native
   `SHELL_INGRESS` WebSocket using the documented Lambda MicroVM WebSocket
   subprotocols. The credential remains in memory and is not written to
   browser storage or downloaded.
4. The portal starts `/usr/local/bin/developer-shell` as user 1000 and presents
   the `/workspace` shell. Run `claude` at that prompt.
5. Choose **Close** or run `exit` to disconnect. Choose **Reconnect** or
   **Connect** to open another shell; disconnecting does not stop the
   environment.

No handoff file, AWS profile, local Claude installation, source checkout,
Node.js, npm, or custom executable participates in this workflow. Use the
portal for explicit lifecycle operations. **Suspend** checkpoints and pauses
the MicroVM. **Restart** checkpoint-terminates it, waits for completion, and
starts a replacement for the same workspace. **Terminate**
checkpoint-terminates it without replacement.

#### Portal VS Code workflow

1. Open the private `PortalUrl` and sign in through Cognito.
2. Select **VS Code** and the approved tunnel identity.
3. Create the environment and wait for `RUNNING`.
4. Choose **Connect**, complete the Microsoft or GitHub device flow, and open
   the assigned tunnel.

Tunnel identity is separate from Cognito and applies only to VS Code mode.

#### IAM workflows

The source-tree CLI is an IAM-authorized operator and automation tool. It is
not distributed to developers.

IAM terminal workflow:

```text
npm run client -- --region REGION --profile PROFILE start WORKSPACE
```

IAM VS Code workflow:

```text
npm run client -- --region REGION --profile PROFILE vscode WORKSPACE
```

IAM-owned and Cognito-owned environments use separate ownership namespaces
and are not linked or migrated.

## User flow

### Browser control and terminal

1. The developer connects to the approved private network.
2. The browser completes Cognito authorization code with PKCE.
3. The portal sends the ID token to the Cognito-authorized private API route.
4. The control Lambda derives `oidc:<sub>` and creates or manages that user's
   environment.
5. For Terminal access, the portal obtains a five-minute shell token and opens
   a direct WebSocket from the browser to the environment's shell endpoint.
6. The embedded terminal sends keyboard and resize events to the native PTY;
   the shell, commands, and Claude Code process remain inside the MicroVM.

The portal stores its Cognito ID token only in tab-scoped `sessionStorage` and
holds the shell credential only in memory. Expired Cognito authentication
returns the developer to sign-in. No local callback, refresh token, handoff
file, or downloaded shell credential participates in this flow.

### VS Code Remote Tunnels

1. The tunnel-login helper runs inside the MicroVM as the unprivileged
   developer user.
2. The developer approves the Microsoft or GitHub device code.
3. VS Code Server and VS Code Desktop connect outbound through Microsoft dev
   tunnels.
4. Source, terminal, Git, and extension execution remain inside the MicroVM.

### Bedrock inference

1. Claude Code signs a request with the MicroVM execution role's temporary
   credentials.
2. A direct `anthropic.*` ID uses the private Messages endpoint; a geographic
   or global profile ID uses the private Bedrock Runtime endpoint.
3. Bedrock invokes the configured model and streams the response over the same
   private path.

## Acceptance and verification

### Identity configuration

Confirm for the portal Cognito user pool:

- self-service sign-up is disabled;
- the browser app client has no secret;
- its callback is the exact `PortalUrl`;
- the hosted UI domain resolves; and
- each approved developer has a verified pool user.

### End-to-end acceptance

Record dated evidence for:

- portal Cognito sign-in;
- environment creation and owner isolation;
- browser Terminal connection from each supported browser and device OS;
- keyboard input, paste, terminal resize, disconnect, and reconnect;
- confirmation that the shell token is absent from browser storage and URLs;
- a normal `/workspace` shell followed by an interactive `claude` launch;
- Microsoft and, when approved, GitHub tunnel authentication;
- VS Code connection to the Linux ARM64 workspace;
- one successful prompt through the configured inference mode;
- one selectable Claude Code model family mapped to the configured Bedrock
  model ID, without a duplicate Custom model entry;
- one approved AgentCore tool call when enabled;
- suspend and resume;
- restart and terminate/recreate with workspace restoration; and
- denial for an unapproved user.

Before removing either VS Code workaround, run the relevant supersession
criteria from
[Visual Studio Code compatibility workarounds](#visual-studio-code-compatibility-workarounds)
on both supported macOS and Windows clients. Include an approved VDI path when
VDI is in scope. Current validation includes one routed Windows Server 2022
host, remote workspace connection, and graphical Claude Code prompt; it does
not yet provide the full macOS, Windows, reconnect, lifecycle, and VDI
acceptance matrix required to remove either workaround.

For optional gateway mode, attach the gateway owner's separate deployment and
acceptance record rather than duplicating its checks here.

## Day-2 operations

### Update the platform

Update dependency pins and `microvm/tool-versions.json` through review, run the
full validation suite, inspect `cdk diff`, then rerun:

```bash
npm run deploy -- \
  --config deployment.json \
  --profile <profile> \
  --require-approval never
```

### Offboard a Cognito user

1. Disable or delete the user in the Cognito user pool.
2. Terminate active MicroVM environments owned by that user.
3. Preserve or delete checkpoints according to retention policy.
4. Review control-plane and portal audit events.

Cognito ID tokens expire after one hour. The browser holds no refresh token,
so disabled users cannot renew access.

### Backup and recovery

Production operations must test:

- S3 checkpoint version recovery;
- KMS key access and recovery controls;
- restoration into a non-production environment; and
- recreation of a terminated workspace from its latest checkpoint.

Operate and recover an optional gateway through its
[canonical deployment documentation](../../claude-apps-gateway/cdk/README.md)
and [operational gotchas](../../claude-apps-gateway/docs/gotchas.md).

## Troubleshooting

| Symptom | Likely cause | Resolution |
| --- | --- | --- |
| Bedrock returns 403 | Model access is not enabled or the selected endpoint permission is missing | Enable model access. Direct IDs require the Messages project permission; profile IDs require invoke actions on the profile and underlying foundation model. |
| Portal returns HTTP 401 | The Cognito ID token expired or its audience, issuer, or authorization header is wrong | Sign in again. If the problem persists, confirm `config.json` contains the deployed browser app client and exact portal callback URL. |
| Terminal does not connect | The environment is not `RUNNING`, the browser cannot reach the shell endpoint, the shell credential expired, or WebSocket subprotocols are filtered | Use **Refresh**, confirm live state, then choose **Reconnect**. Verify browser WebSocket access and that intermediaries preserve `lambda-microvms` subprotocol headers. |
| Terminal opens but input or sizing is wrong | Browser compatibility, focus, clipboard policy, or resize observation failed | Focus the terminal, retry in a supported browser, and inspect browser console/network errors. Re-run keyboard, paste, and resize acceptance. |
| VS Code repeatedly invokes a failing native Microsoft broker | Current native-broker behavior is incompatible with the isolated tunnel or VDI path | Retain the temporary `msal-no-broker` setting in the isolated profile. Remove it only after the documented desktop acceptance criteria pass. |
| Remote Tunnel connects but extensions fail | Microsoft update, Marketplace, CDN, or relay egress is blocked | Apply the organization's approved endpoint policy and repeat relay acceptance. |
| Portal environment is absent from the IAM CLI | Cognito and IAM are separate ownership namespaces | Manage `oidc:<sub>` environments in the portal and IAM-owned environments with the source-tree CLI; the platform does not link them. |
| Checkpoint restore fails | Object, KMS, archive limits, or integrity validation failed | Review the MicroVM log group and retained S3 object version, then restore a known-good checkpoint version. |

For optional gateway failures, use the gateway's
[operational gotchas](../../claude-apps-gateway/docs/gotchas.md). Keep fixes
and incident evidence with that component rather than adding a second
troubleshooting table here.

## Teardown

Destroy the platform only after checkpoints, logs, and audit evidence have
been retained according to policy:

```bash
npm run destroy:microvm -- \
  --region <region> \
  --profile <profile>

npx cdk destroy ClaudeMicrovmStack \
  --profile <profile>
```

The portal Cognito user pool, domain, and app client are deleted with the
platform stack. Confirm retained S3, DynamoDB, KMS, and log resources against
your deletion policy.

Delete separately managed private routes and DNS only when no other workload
uses them. Tear down an optional gateway with its
[canonical teardown procedure](../../claude-apps-gateway/docs/teardown.md).

## Diagram regeneration

The architecture diagram is maintained by hand in
[../images/architecture.drawio](../images/architecture.drawio). After editing
it in Draw.io Desktop, re-export the PNG:

```bash
DRAWIO='/Applications/draw.io.app/Contents/MacOS/draw.io'

"$DRAWIO" \
  --export \
  --format png \
  --page-index 1 \
  --border 20 \
  --scale 2 \
  --output images/architecture.png \
  images/architecture.drawio
```

Inspect the PNG at full size after export. Confirm that labels do not overlap,
connectors do not cross labels, and the MicroVM remains outside the VPC.
