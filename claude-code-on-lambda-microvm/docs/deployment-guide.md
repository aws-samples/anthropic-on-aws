# Claude Code on Lambda MicroVMs: architecture and deployment guide

## Purpose

This guide describes how to deploy a private remote development environment
in AWS where:

- developers create and manage disposable development environments through a
  private browser portal or command-line client;
- Visual Studio Code connects to a Linux ARM64 AWS Lambda MicroVM through
  Microsoft Remote Tunnels;
- Claude Code runs inside the MicroVM rather than on the developer device;
- portal users authenticate with an Amazon Cognito user pool created by the
  platform stack;
- Claude inference uses Amazon Bedrock directly through a private Bedrock
  Runtime endpoint by default; a legacy mode that routes inference through a
  separately deployed private Claude Apps Gateway remains available;
- workspace state is checkpointed to encrypted Amazon S3 storage; and
- approved MCP tools are exposed separately through Amazon Bedrock AgentCore
  Gateway.

The document is written for cloud, identity, network, security, and
operations teams. Replace all values in angle brackets with values approved
for the target environment. Sections marked **legacy gateway mode** apply
only when `inferenceMode` is `claude-gateway`; skip them for the default
Bedrock mode.

**Deployment path (default Bedrock mode):** work through
[Prerequisites](#prerequisites), the
[deployment value worksheet](#deployment-value-worksheet),
[network preparation](#network-dns-and-tls-preparation), then
[deploy the remote development platform](#deploy-the-remote-development-platform),
[create portal users](#configure-portal-identity-amazon-cognito) if the
portal is enabled, [configure developer devices](#configure-developer-devices),
and finish with [acceptance](#acceptance-and-verification). That is the
entire path — every skipped section is gateway-only.

**Deployment path (legacy gateway mode):** the same path, plus — before the
platform deployment — [Entra configuration](#configure-microsoft-entra-id-legacy-gateway-mode),
[gateway deployment](#deploy-claude-apps-gateway-legacy-gateway-mode), and
[connecting the platform and gateway VPCs](#connect-the-platform-and-gateway-vpcs-legacy-gateway-mode).

The design uses two separate identity clients:

1. **Portal Cognito app client** - a public browser client using
   authorization code with PKCE against the Cognito hosted UI. It has no
   client secret and is created by the platform stack.
2. **Claude Apps Gateway web application** - a confidential Microsoft Entra
   web client used by the optional legacy gateway for OIDC
   authorization-code exchange. Its client secret is stored only in AWS
   Secrets Manager.

Microsoft Entra ID is required only when the legacy Claude Apps Gateway
mode is deployed; the portal itself needs no external identity provider.

## What will be deployed

The default Bedrock deployment is one AWS stack (the remote development
platform) plus supporting network configuration. The legacy gateway mode
adds a second, separately deployed Claude Apps Gateway stack and its
identity configuration.

### Remote development platform

The platform stack deploys:

- a VPC spanning two Availability Zones;
- two private subnets for Lambda Network Connector ENIs and VPC endpoints;
- two public subnets for approved public egress through a NAT Gateway;
- a private API Gateway REST API;
- an optional Amazon Cognito user pool, hosted UI domain, and secretless
  PKCE app client authorizing browser portal calls;
- a control Lambda for environment lifecycle operations;
- DynamoDB tables for session and ownership state;
- an encrypted, versioned S3 bucket for workspace checkpoints;
- KMS keys, CloudWatch log groups, IAM roles, and SSM parameters;
- optional AWS Client VPN connectivity; and
- optional AgentCore Gateway private connectivity.

The Lambda MicroVM itself is in the AWS-managed service plane. It is not an
EC2 instance and is not placed in a subnet you manage. The platform VPC
contains only the Network Connector ENIs through which the MicroVM reaches
your network resources.

### Claude Apps Gateway (legacy gateway mode)

The gateway stack deploys:

- a separate VPC spanning two Availability Zones;
- public subnets for NAT egress to Microsoft Entra ID;
- private subnets for the internal load balancer and workloads;
- an IPv4-only internal Application Load Balancer;
- two Claude Apps Gateway Fargate tasks;
- an encrypted private RDS PostgreSQL 16 database;
- one ADOT collector service for aggregate metrics;
- an ECR repository for immutable gateway images;
- interface endpoints for Bedrock Runtime, ECR, Secrets Manager, CloudWatch
  Logs, and CloudWatch Monitoring;
- an S3 gateway endpoint;
- task and execution IAM roles;
- AWS Secrets Manager secrets for the gateway JWT, OIDC client, and database
  credentials; and
- private Route 53 DNS for the gateway hostname.

### What you configure

You configure:

- private connectivity from developer devices to the platform;
- DNS resolution for the private API;
- Bedrock model access in the selected Region or Regions;
- developer and operator access policies; and
- for legacy gateway mode only: a Microsoft Entra application registration,
  DNS and trusted TLS for the gateway hostname, VPC peering or an
  equivalent routed private connection between the platform and gateway
  VPCs, and CI or CodeBuild permissions for the gateway image.

## Architecture

![Remote development architecture](../images/architecture.png)

The editable source is
[../images/architecture.drawio](../images/architecture.drawio).

### Primary flows

| Flow | Description |
| --- | --- |
| Portal control | Browser signs in through the Cognito hosted UI with authorization code and PKCE, sends the ID token to the private API, and the API Gateway Cognito authorizer validates the signature, issuer, audience, and expiry before the control Lambda manages a MicroVM. |
| Remote editor | Local VS Code and the remote VS Code Server each establish outbound connections to Microsoft dev tunnels. No SSH listener or inbound application endpoint is created. |
| Inference (default) | Claude Code uses the MicroVM execution role's temporary AWS credentials to invoke approved Amazon Bedrock models through the Bedrock Runtime VPC endpoint. No additional sign-in is required. |
| Gateway sign-in (legacy) | Claude Code obtains a device code from the gateway. The browser authenticates through the gateway Entra web app and returns to the gateway callback. The gateway completes the code exchange and records the device state in PostgreSQL. |
| Inference (legacy gateway) | Claude Code sends model requests through Network Connector ENIs, private routing, the internal gateway ALB, and the gateway tasks. The gateway uses its ECS task role to invoke Amazon Bedrock through a private endpoint. |
| MCP tools | The MicroVM uses execution-role SigV4 credentials to call the approved AgentCore Gateway through PrivateLink. AgentCore policy governs tools only, not Claude inference. |
| Persistence | `/workspace` is checkpointed to versioned, KMS-encrypted S3. Remote Tunnel credentials and server binaries are intentionally excluded. |

## Design rationale

### Cognito portal authentication

The platform stack creates its own Amazon Cognito user pool, hosted UI
domain, and app client, so the portal deploys without any external identity
provider, tenant approval, or app registration. Operators create portal
users directly in the pool; self-service sign-up is disabled.

The portal and gateway must not share one identity client:

- the portal is a public SPA client and must never possess a secret;
- the gateway is a server-side confidential client and requires a secret;
- the redirect URI types differ; and
- separate clients allow different assignment and access policies.

### Private gateway endpoint (legacy gateway mode)

The gateway is intentionally behind an internal IPv4-only ALB. Claude Code
validates that a managed gateway resolves only to private addresses because
the gateway can deliver managed settings to the client.

Do not replace the internal ALB with a public ALB, CloudFront distribution,
public IP, or public tunnel. A public DNS answer causes `claude /login` to
reject the gateway.

### Separate platform and gateway VPCs (legacy gateway mode)

Separate VPCs keep the development control plane and the inference gateway
independently deployable. Private routing between them is explicit and can be
implemented through VPC peering, Transit Gateway, or your central network
architecture.

### Service-side image builds

The MicroVM image is built by the AWS Lambda MicroVM service from a source
archive; local Docker is not required. In legacy gateway mode, the gateway
image is separately built as `linux/amd64` in AWS CodeBuild and pushed to
ECR with an immutable tag.

### Durable workspace, ephemeral compute

The MicroVM is disposable. Source code, Git state, and Claude state under
`/workspace` survive replacement through encrypted S3 checkpoints. Remote
Tunnel identity, VS Code Server binaries, temporary AWS credentials, and
device codes are not checkpointed.

### Eight-hour replacement lifecycle

Each MicroVM invocation has a maximum duration of 28,800 seconds. Suspended
time counts toward that limit. The control-plane reconciler begins a managed
termination 45 minutes before expiry so the terminate hook has time to pause
the tunnel and upload `/workspace` to the workspace checkpoint bucket.

The checkpoint is addressed by the authenticated owner and workspace ID, not
by the disposable MicroVM or session ID. After the old invocation reaches a
terminal state, start the same workspace ID again. The new MicroVM downloads
and validates the latest checkpoint before starting the shell or VS Code
tunnel.

The current workflow requires a new connection after replacement:

1. the existing terminal or VS Code connection closes;
2. the user starts the same workspace ID from the portal or client;
3. `/workspace` is restored into a fresh MicroVM; and
4. a VS Code user completes a new Microsoft Remote Tunnel device login.

This is checkpoint and restore, not live process migration. Running processes,
memory, open terminals, `/home/developer`, VS Code Server files, tunnel
credentials, device codes, and temporary AWS credentials are recreated. The
default checkpoint limits are 128 MiB compressed and 1 GiB extracted. A hard
service interruption can lose changes made after the most recent successful
checkpoint, so Git remains the source of record.

## Identity and authorization boundaries

| Boundary | Authentication | Authorizes |
| --- | --- | --- |
| Portal | Amazon Cognito user pool ID token | Create, read, suspend, resume, terminate, and start tunnel authentication for the Cognito owner |
| CLI control | AWS SigV4 | Private control API operations for the AWS principal owner |
| Native shell | Five-minute Lambda MicroVM shell token | Temporary bootstrap or terminal attachment to one MicroVM |
| VS Code tunnel | Microsoft or GitHub device identity | Join one Microsoft dev tunnel |
| Amazon Bedrock (default) | MicroVM execution-role SigV4 | Invoke approved model or inference-profile ARNs |
| Claude gateway (legacy) | Entra OIDC through the gateway web app | Gateway session, model policy, and inference access |
| Amazon Bedrock (legacy gateway) | ECS task-role SigV4 | Invoke approved model or inference-profile ARNs |
| AgentCore tools | MicroVM execution-role SigV4 | Invoke the approved AgentCore Gateway and targets |

A credential in one boundary does not grant access in another. In particular:

- portal sign-in does not authenticate VS Code Remote Tunnels;
- Remote Tunnels sign-in does not grant Claude inference;
- AgentCore policy does not govern `/v1/messages`; and
- the developer device does not receive the MicroVM execution-role or
  gateway ECS role credentials.

## Prerequisites

### Organizational decisions

Agree the following before deployment:

- AWS account and Region;
- platform VPC CIDR (and, for legacy gateway mode, a non-overlapping
  gateway VPC CIDR);
- private connectivity method for developer devices;
- private DNS ownership and forwarding;
- portal user provisioning ownership for the Cognito user pool;
- Bedrock models and inference profiles;
- log retention and data classification;
- NAT or centralized egress architecture;
- for legacy gateway mode: the gateway hostname, TLS certificate authority
  and renewal process, approved Entra tenant, user groups, guest-user
  policy, Conditional Access and MFA requirements, approved email domains,
  RDS availability, backup, and deletion-protection requirements, the
  source repository, build account, and image promotion process, and
  operations ownership for secret and certificate rotation.

### AWS access

The deployment role requires permissions to create and manage:

- CloudFormation and CDK bootstrap resources;
- VPCs, subnets, route tables, peering, endpoints, security groups, NAT
  Gateways, and Elastic IP addresses;
- API Gateway, Lambda, Lambda MicroVM resources, and Network Connectors;
- ECS, Fargate, ECR, ALB, RDS, and CodeBuild (legacy gateway mode only);
- IAM roles and policies;
- Route 53 and ACM integrations;
- Secrets Manager, S3, KMS, DynamoDB, SSM, Cognito, and CloudWatch; and
- Bedrock and optional AgentCore resources.

Use a dedicated deployment role or CI role rather than long-lived IAM user
credentials.

### Local tools

- Node.js 20 or later
- npm
- AWS CLI v2
- AWS CDK CLI compatible with the repositories
- Azure CLI authenticated to the target Entra tenant (legacy gateway mode
  only)
- `jq`
- Draw.io Desktop only when regenerating the diagram

No local Docker installation is required.

### Required source artifacts

- the remote development platform repository (this sample);
- approved deployment configuration; and
- for legacy gateway mode: the Claude Apps Gateway CDK repository, the
  approved Linux x86-64 Claude gateway binary, and the release checksum or
  signed manifest used to verify that binary.

## Deployment value worksheet

Record these values in your change record. Values marked "gateway mode"
apply only to the legacy gateway deployment.

| Value | Example | Your value |
| --- | --- | --- |
| AWS profile or CI role | `platform-admin` | |
| AWS account | `111122223333` | |
| AWS Region | `us-east-1` | |
| Platform VPC CIDR | `10.42.0.0/16` | |
| VPN client CIDR | `10.100.0.0/22` | |
| Bedrock model/profile IDs | Approved values | |
| AgentCore Gateway URL and ARN | Optional | |
| Gateway VPC CIDR (gateway mode) | `10.60.0.0/16` | |
| Effective ALB source CIDR (gateway mode) | Often the platform VPC CIDR after VPN SNAT | |
| Gateway URL (gateway mode) | `https://claude-gateway.dev.example.com` | |
| Private hosted zone ID (gateway mode) | `Z...` | |
| Hosted zone name (gateway mode) | `dev.example.com` | |
| ACM certificate ARN (gateway mode) | `arn:aws:acm:...` | |
| Entra tenant ID (gateway mode) | GUID | |
| Gateway Entra client ID (gateway mode) | GUID | |
| Allowed email domains (gateway mode) | `example.com` | |
| Gateway image tag (gateway mode) | `2.1.197-entra-YYYYMMDD` | |

## Network, DNS, and TLS preparation

### CIDR planning

The platform VPC, VPN client pool, corporate networks, any Transit Gateway
attachments, and (in legacy gateway mode) the gateway VPC must use
non-overlapping CIDRs.

Recommended route policy (gateway rows apply to legacy gateway mode only):

| Source | Destination | Route |
| --- | --- | --- |
| Platform private subnets | S3 prefix list | S3 gateway endpoint |
| Platform private subnets | Private AWS services | Interface endpoints |
| Platform private subnets | Approved public HTTPS | NAT or centralized egress |
| Platform private subnets | Gateway VPC CIDR | VPC peering or Transit Gateway |
| Gateway private subnets | Platform VPC CIDR | Return route through the same private connection |
| Gateway private subnets | Bedrock, ECR, Secrets, Logs, Monitoring | Interface endpoints |
| Gateway private subnets | Entra authorize/token endpoints | NAT or centralized egress |

### Private connectivity for developers

Provide one of:

- AWS Client VPN;
- site-to-site VPN;
- Direct Connect;
- Transit Gateway connectivity; or
- a managed VDI or workstation already inside the routed network.

The private API (and, in legacy gateway mode, the gateway) is not reachable
from an unrouted public workstation. The connectivity method is an
organizational decision and is outside the scope of this sample.

When AWS Client VPN is used with the legacy gateway, confirm the source CIDR
observed by the gateway ALB. Client VPN commonly source-NATs traffic to its
association subnet, so the ALB may observe the platform VPC CIDR rather than
the VPN client pool. Use that effective source CIDR for the gateway
`ingressCidr`.

### Private DNS (legacy gateway mode)

The gateway hostname must resolve to private IPv4 addresses from:

- both platform private subnets;
- the gateway VPC;
- the developer browser; and
- any validation workstation or VDI.

Use one of:

- a Route 53 private hosted zone associated with both VPCs;
- Route 53 Resolver inbound endpoints and corporate conditional forwarding;
  or
- corporate split-horizon DNS.

Do not publish an AAAA record for an IPv4-only gateway. Verify every returned
address is private:

```bash
dig +short <gateway-hostname> A
dig +short <gateway-hostname> AAAA
```

### TLS (legacy gateway mode)

Use a trusted ACM certificate whose subject alternative name exactly matches
the gateway hostname. A common pattern is:

- public DNS validation for the certificate; and
- a private DNS A/alias record for the internal ALB.

If a private CA is used, distribute the root and intermediate CA certificates
to every developer device and remote runtime that validates the gateway.

Treat ACM renewal as an operational event because Claude Code can pin the
gateway leaf-certificate fingerprint on first use.

### Security-group policy

Minimum rules are (gateway rows apply to legacy gateway mode only):

| Resource | Inbound |
| --- | --- |
| Platform API endpoint | TCP 443 from approved VPN and connector security groups |
| VPC endpoints | TCP 443 from the workload security groups only |
| Internal ALB | TCP 443 from the effective platform/VPN source CIDR |
| Gateway tasks | TCP 8080 from the ALB security group only |
| RDS PostgreSQL | TCP 5432 from the gateway task security group only |

Do not allow `0.0.0.0/0` to the gateway listener or database.

## Configure portal identity (Amazon Cognito)

The platform stack creates the portal user pool, hosted UI domain, and app
client automatically when the portal is enabled with `"enablePortal": true`
in the deployment configuration. There is nothing to register before
deployment.

The app client is a public PKCE client. It has no client secret, and its
callback URL is set automatically to the stack's `PortalUrl` output.
Self-service sign-up is disabled: only operator-created users can sign in.

After platform deployment, create each portal user with a real email
address:

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

Cognito emails the user a temporary password; the hosted UI forces a new
password on first sign-in. Passwords require at least 12 characters with
upper case, lower case, digits, and symbols.

The portal requests `openid profile email`. The API Gateway Cognito
authorizer validates:

- the token signature against the user pool JWKS;
- the user pool issuer;
- audience equal to the portal app client ID;
- token expiry; and
- the verified `sub` owner claim.

## Configure Microsoft Entra ID (legacy gateway mode)

This section applies only when the legacy Claude Apps Gateway inference
mode is deployed. Skip it for the default Bedrock mode.

Authenticate Azure CLI to the target tenant:

```bash
az login --tenant <tenant-id>
az account show --query '{tenantId:tenantId,user:user.name}' --output json
```

The operator must be permitted to create app registrations, service
principals, and credentials.

### Create the gateway confidential web application

Choose the gateway hostname before creating this application because the
callback URI must match exactly.

```bash
TENANT_ID='<tenant-id>'
GATEWAY_URL='https://<gateway-hostname>'
OPTIONAL_CLAIMS='{
  "idToken": [
    {
      "name": "email",
      "essential": false
    }
  ],
  "accessToken": [],
  "saml2Token": []
}'

GATEWAY_APP_JSON="$(
  az ad app create \
    --display-name "Claude Apps Gateway" \
    --sign-in-audience AzureADMyOrg \
    --web-home-page-url "$GATEWAY_URL" \
    --web-redirect-uris "${GATEWAY_URL}/oauth/callback" \
    --optional-claims "$OPTIONAL_CLAIMS" \
    --output json
)"

GATEWAY_CLIENT_ID="$(jq -r '.appId' <<<"$GATEWAY_APP_JSON")"
GATEWAY_OBJECT_ID="$(jq -r '.id' <<<"$GATEWAY_APP_JSON")"

az ad sp create --id "$GATEWAY_CLIENT_ID" --output none

printf 'Gateway client ID: %s\n' "$GATEWAY_CLIENT_ID"
printf 'Gateway object ID: %s\n' "$GATEWAY_OBJECT_ID"
```

Do not create the credential until the gateway stack has created
`claude-gateway-oidc-client-secret`. This allows the generated value to be
written directly to Secrets Manager without displaying or storing it.

Validate the registration:

```bash
az ad app show \
  --id "$GATEWAY_CLIENT_ID" \
  --query '{
    appId:appId,
    signInAudience:signInAudience,
    web:web,
    optionalClaims:optionalClaims
  }' \
  --output json
```

Expected:

- single-tenant `AzureADMyOrg`;
- one web redirect URI:
  `https://<gateway-hostname>/oauth/callback`;
- `email` in the ID-token optional claims;
- no SPA redirect URI; and
- a service principal with `appRoleAssignmentRequired` configured according
  to your policy.

### Users with external email domains

Adding `gmail.com` or another domain to the gateway allowlist does not make
that identity a tenant user. For a single-tenant app, an external user must
first exist in the Entra tenant as an approved member or guest and must be
allowed by enterprise-application assignment and Conditional Access.

Confirm the user has a populated `mail` or equivalent email claim and add the
domain only when your identity policy explicitly permits it.

### Conditional Access and assignment

For the gateway enterprise application:

- require MFA as appropriate;
- restrict access to approved users or groups;
- apply compliant-device or location requirements where appropriate;
- review user-consent settings;
- configure sign-in and audit-log retention; and
- document emergency access and break-glass procedures.

The gateway app performs a browser flow but is a server-side confidential
client. The portal app is a browser SPA and must remain secretless.

## Deploy Claude Apps Gateway (legacy gateway mode)

This section applies only when the legacy gateway inference mode is
deployed. The commands below use the CDK deployment under
`claude-apps-gateway/cdk`.

### Install and validate dependencies

```bash
cd claude-apps-gateway/cdk
npm ci
npm test -- --runInBand
npm run build
```

Verify the AWS identity and Region before making changes:

```bash
aws sts get-caller-identity --profile <profile>
aws configure get region --profile <profile>
```

### Bootstrap CDK

Run once per account and Region:

```bash
npx cdk bootstrap \
  aws://<account-id>/<region> \
  --profile <profile>
```

### Pass 1: create the ECR repository

```bash
npx cdk deploy ClaudeGatewayStack \
  --profile <profile> \
  --require-approval never \
  -c region=<region> \
  -c imageReady=false
```

Record the `EcrRepositoryUri` output.

### Stamp the non-secret gateway configuration

The generated `gateway.yaml` contains the public URL, Entra issuer, Entra
client ID, allowed email domains, Region, and database name. It contains
references to environment variables for all secrets.

```bash
PUBLIC_URL='https://<gateway-hostname>' \
AWS_REGION='<region>' \
OIDC_ISSUER='https://login.microsoftonline.com/<tenant-id>/v2.0' \
OIDC_CLIENT_ID='<gateway-client-id>' \
ALLOWED_EMAIL_DOMAINS='example.com' \
DB_NAME='claude_gateway' \
./scripts/stamp-config.sh
```

For approved external identities, use a comma-separated list such as:

```bash
ALLOWED_EMAIL_DOMAINS='example.com,gmail.com'
```

For Entra, do not add a Cognito-specific `scopes` override. The gateway
default must include:

```text
openid profile email offline_access
```

Validate the stamped values and confirm the secret remains an environment
reference:

```bash
grep -E 'issuer:|client_id:|client_secret:|allowed_email_domains:' gateway.yaml
```

Expected:

```yaml
oidc:
  issuer: https://login.microsoftonline.com/<tenant-id>/v2.0
  client_id: <gateway-client-id>
  client_secret: ${OIDC_CLIENT_SECRET}
  allowed_email_domains: [example.com]
```

### Build and push through AWS CodeBuild

Use an immutable tag:

```bash
IMAGE_TAG='<gateway-version>-entra-<yyyymmdd>'
```

The CodeBuild source bundle contains exactly:

```text
Dockerfile
buildspec.yml
claude
gateway.yaml
```

The `claude` file must be the approved Linux x86-64 binary and must be
verified against its trusted release checksum before packaging.

Example `buildspec.yml`:

```yaml
version: 0.2
env:
  variables:
    DOCKER_BUILDKIT: "1"
phases:
  pre_build:
    commands:
      - aws ecr get-login-password --region "$AWS_REGION" |
        docker login --username AWS --password-stdin "$ECR_REGISTRY"
  build:
    commands:
      - chmod 0755 claude
      - docker build --platform=linux/amd64 --provenance=false
        -t "$ECR_REPOSITORY:$IMAGE_TAG" .
      - test "$(docker image inspect
        "$ECR_REPOSITORY:$IMAGE_TAG"
        --format '{{.Architecture}}')" = amd64
  post_build:
    commands:
      - docker push "$ECR_REPOSITORY:$IMAGE_TAG"
```

Provision the CodeBuild project through your approved infrastructure
pipeline. Use:

- source type `S3` or your source pipeline;
- image `aws/codebuild/standard:7.0` or an approved later standard image;
- x86-64 `LINUX_CONTAINER`;
- privileged mode enabled;
- no build artifacts, because the output is pushed to ECR; and
- CloudWatch Logs enabled with your retention policy.

The CodeBuild service role must be able to:

- read the source bundle from the staging S3 bucket;
- obtain an ECR authorization token;
- upload layers and images to the gateway ECR repository; and
- write its own CloudWatch build logs.

Add `kms:Decrypt` for the staging key when the source bucket uses a
customer-managed KMS key. Do not grant the build access to the Entra client
secret; the image contains non-secret configuration only.

The following example creates a project when one is not already provided. `CODEBUILD_ROLE_ARN` refers to the pre-created service role with
the permissions above:

```bash
BUILD_PROJECT='claude-gateway-build'
BUILD_BUCKET='<approved-build-bucket>'
BUILD_KEY="claude-gateway/${IMAGE_TAG}/source.zip"
CODEBUILD_ROLE_ARN='<codebuild-service-role-arn>'

aws codebuild create-project \
  --name "$BUILD_PROJECT" \
  --source "type=S3,location=${BUILD_BUCKET}/${BUILD_KEY}" \
  --artifacts type=NO_ARTIFACTS \
  --environment \
    type=LINUX_CONTAINER,image=aws/codebuild/standard:7.0,computeType=BUILD_GENERAL1_SMALL,privilegedMode=true,imagePullCredentialsType=CODEBUILD \
  --service-role "$CODEBUILD_ROLE_ARN" \
  --region <region> \
  --profile <profile>
```

Package and upload the four build inputs. These commands require `zip` and the
AWS CLI locally, but do not require Docker:

```bash
ECR_REPOSITORY="$(
  aws cloudformation describe-stacks \
    --stack-name ClaudeGatewayStack \
    --region <region> \
    --profile <profile> \
    --query "Stacks[0].Outputs[?OutputKey=='EcrRepositoryUri'].OutputValue" \
    --output text
)"
ECR_REGISTRY="${ECR_REPOSITORY%%/*}"
SOURCE_ZIP="/tmp/claude-gateway-${IMAGE_TAG}.zip"

rm -f "$SOURCE_ZIP"
zip -j "$SOURCE_ZIP" Dockerfile buildspec.yml claude gateway.yaml

aws s3 cp \
  "$SOURCE_ZIP" \
  "s3://${BUILD_BUCKET}/${BUILD_KEY}" \
  --region <region> \
  --profile <profile>
```

Start the build with the immutable image tag and wait for a terminal status:

```bash
BUILD_ID="$(
  aws codebuild start-build \
    --project-name "$BUILD_PROJECT" \
    --source-location-override "${BUILD_BUCKET}/${BUILD_KEY}" \
    --environment-variables-override \
      "name=ECR_REGISTRY,value=${ECR_REGISTRY},type=PLAINTEXT" \
      "name=ECR_REPOSITORY,value=${ECR_REPOSITORY},type=PLAINTEXT" \
      "name=IMAGE_TAG,value=${IMAGE_TAG},type=PLAINTEXT" \
    --region <region> \
    --profile <profile> \
    --query 'build.id' \
    --output text
)"

while :; do
  BUILD_STATUS="$(
    aws codebuild batch-get-builds \
      --ids "$BUILD_ID" \
      --region <region> \
      --profile <profile> \
      --query 'builds[0].buildStatus' \
      --output text
  )"
  case "$BUILD_STATUS" in
    SUCCEEDED) break ;;
    FAILED|FAULT|STOPPED|TIMED_OUT)
      printf 'CodeBuild failed: %s\n' "$BUILD_STATUS" >&2
      exit 1
      ;;
  esac
  sleep 15
done
```

Do not overwrite an existing immutable tag. Verify the resulting digest:

```bash
aws ecr describe-images \
  --repository-name claude-gateway \
  --image-ids imageTag="$IMAGE_TAG" \
  --region <region> \
  --profile <profile> \
  --query 'imageDetails[0].{digest:imageDigest,pushedAt:imagePushedAt,tags:imageTags}'
```

### Pass 2: deploy the full gateway stack

The private hosted zone and ACM certificate must already exist.

```bash
npx cdk diff ClaudeGatewayStack \
  --profile <profile> \
  -c region=<region> \
  -c publicUrl=https://<gateway-hostname> \
  -c imageTag="$IMAGE_TAG" \
  -c certArn=<acm-certificate-arn> \
  -c zoneName=<private-zone-name> \
  -c zoneId=<private-zone-id> \
  -c ingressCidr=<effective-platform-or-vpn-source-cidr> \
  -c imageReady=true
```

Review every replacement before deployment, then deploy with the same
context:

```bash
npx cdk deploy ClaudeGatewayStack \
  --profile <profile> \
  --require-approval never \
  -c region=<region> \
  -c publicUrl=https://<gateway-hostname> \
  -c imageTag="$IMAGE_TAG" \
  -c certArn=<acm-certificate-arn> \
  -c zoneName=<private-zone-name> \
  -c zoneId=<private-zone-id> \
  -c ingressCidr=<effective-platform-or-vpn-source-cidr> \
  -c imageReady=true
```

Record:

- `PublicUrl`;
- `OAuthRedirectUri`;
- `EcrRepositoryUri`;
- `AlbDnsName`;
- `TaskRoleArn`; and
- `RdsEndpoint`.

### Create and store the gateway Entra credential

Generate the credential and put it directly into Secrets Manager. Do not
print it or write it to a file:

```bash
set -euo pipefail

SECRET=''
trap 'unset SECRET' EXIT

SECRET="$(
  az ad app credential reset \
    --id '<gateway-client-id>' \
    --append \
    --display-name 'AWS Claude Apps Gateway' \
    --years 1 \
    --query password \
    --output tsv
)"

test -n "$SECRET"

aws secretsmanager put-secret-value \
  --secret-id claude-gateway-oidc-client-secret \
  --secret-string="$SECRET" \
  --region <region> \
  --profile <profile> \
  --query VersionId \
  --output text

unset SECRET
```

The equals form in `--secret-string="$SECRET"` safely handles generated
secrets that begin with a hyphen.

Force a new ECS deployment so new tasks receive the current secret version:

```bash
aws ecs update-service \
  --cluster claude-gateway \
  --service claude-gateway \
  --force-new-deployment \
  --region <region> \
  --profile <profile>

aws ecs wait services-stable \
  --cluster claude-gateway \
  --services claude-gateway \
  --region <region> \
  --profile <profile>
```

### Production hardening

Before production use:

- enable RDS deletion protection;
- use approved backup retention and restore testing;
- select Multi-AZ RDS if the recovery objective requires it;
- use one NAT Gateway per AZ or centralized resilient egress;
- retain production ECR images and scan them;
- enable CloudTrail, VPC Flow Logs, and required security monitoring;
- set log retention to your organizational standard;
- protect the hosted zone, ACM certificate, secrets, and KMS keys;
- alarm on unhealthy ECS tasks, ALB 5xx, database capacity, and failed auth;
- define maintenance windows and patch/update ownership; and
- protect CloudFormation stacks from accidental deletion.

## Connect the platform and gateway VPCs (legacy gateway mode)

Create VPC peering or your standard routed attachment after both VPCs
exist.

For VPC peering:

1. create the peering connection;
2. accept it in the peer account when cross-account;
3. enable DNS resolution from the remote VPC on both sides;
4. add the gateway CIDR route to both platform private route tables;
5. add the platform CIDR return route to both gateway private route tables;
6. associate or share the gateway private hosted zone with the platform VPC;
7. confirm NACLs and security groups allow the intended traffic; and
8. add Client VPN authorization and split-tunnel routes for the gateway CIDR
   when Client VPN is used.

Required connectivity tests:

```bash
dig +short <gateway-hostname>
curl -fsS https://<gateway-hostname>/healthz
curl -fsS https://<gateway-hostname>/readyz
```

The DNS response must contain private IPv4 addresses only.

## Deploy the remote development platform

### Configure the deployment

Copy the example file:

```bash
cp deployment.example.json deployment.json
```

Configure Bedrock inference and the portal:

```json
{
  "region": "<region>",
  "vpcCidr": "<platform-vpc-cidr>",
  "projectName": "claude-microvm",
  "vpnClientCidr": "<vpn-client-cidr>",
  "createClientVpn": false,
  "vpnClientName": "developer",
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

For legacy gateway mode, replace the inference settings with:

```json
{
  "inferenceMode": "claude-gateway",
  "claudeGatewayUrl": "https://<gateway-hostname>",
  "claudeGatewayCidr": "<gateway-vpc-cidr>"
}
```

Set `agentCoreGatewayUrl` and `agentCoreGatewayArn` together or omit both.
Keep `allowClaudeAiSubscription` false unless direct personal subscriptions
are explicitly approved.

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

### Create portal users

The Cognito app client callback URL is set automatically to the stack's
`PortalUrl` output; no redirect URI configuration is required. Create each
portal user in the pool using the commands in
[Configure portal identity (Amazon Cognito)](#configure-portal-identity-amazon-cognito).

Open the portal only from a device with private network access.

### How provider policy reaches the MicroVM

For the default Bedrock mode, the root lifecycle agent configures Claude
Code with the MicroVM execution role's temporary AWS credentials and the
approved Bedrock model or inference profile; no interactive Claude sign-in
occurs.

For a legacy gateway-mode session, the root lifecycle agent writes
machine-managed Claude settings equivalent to:

```json
{
  "forceLoginMethod": "gateway",
  "forceLoginGatewayUrl": "https://<gateway-hostname>",
  "allowManagedMcpServersOnly": true
}
```

Users cannot override these values from repository or user settings.

Changing the gateway's Entra issuer while retaining the same gateway URL is a
server-side gateway change and does not require a new MicroVM. Changing an
active workspace between `bedrock`, `claude-gateway`, and `claude-ai` does
require terminating and recreating that session.

## Configure developer devices

### Network access

Install and connect the approved VPN client or use an approved routed VDI.
Validate private DNS and HTTPS to:

- the private API Gateway endpoint;
- the Cognito hosted UI domain (public HTTPS);
- Microsoft dev tunnels and required VS Code distribution endpoints; and
- for legacy gateway mode: the gateway hostname and the Microsoft Entra
  authorize and token endpoints.

### Visual Studio Code

The repository client creates an isolated local VS Code profile and sets:

```json
{
  "extensions.supportNodeGlobalNavigator": true,
  "microsoft-authentication.implementation": "msal-no-broker"
}
```

`msal-no-broker` directs VS Code Microsoft authentication through the system
browser instead of the native account broker. It is relevant to VS Code and
Remote Tunnels sign-in; it does not configure Claude Apps Gateway OIDC.

The local and remote tunnel endpoints must use the same approved Microsoft or
GitHub identity.

### Start a remote environment

Command-line workflow:

```bash
npm run client -- \
  --region <region> \
  --profile <profile> \
  vscode <workspace-name>
```

Portal workflow:

1. open the private portal;
2. sign in through the Cognito hosted UI;
3. create a VS Code environment;
4. wait for the environment to reach `RUNNING`;
5. choose **Authenticate**;
6. complete the Microsoft or GitHub device flow; and
7. open the assigned tunnel in VS Code Desktop.

### Sign in to Claude Apps Gateway (legacy gateway mode)

The default Bedrock mode requires no Claude sign-in; Claude Code is ready
as soon as the environment is running. For legacy gateway mode, inside the
remote environment:

```bash
claude /login
```

Use the newly generated verification link. The browser must redirect to:

```text
https://login.microsoftonline.com/<tenant-id>/oauth2/v2.0/authorize
```

After Entra authentication, the browser returns to:

```text
https://<gateway-hostname>/oauth/callback
```

If a previous provider session is cached, sign out before initiating a fresh
login. Do not reuse an expired device code or old browser tab.

## User flow

### Portal and environment creation

1. The developer connects to the private network.
2. The browser opens the private portal.
3. The portal generates a PKCE verifier and redirects to the Cognito
   hosted UI.
4. Cognito authenticates the user and enforces the pool password policy.
5. The portal exchanges the authorization code without a secret.
6. The browser sends the Cognito ID token to the private API.
7. The API Gateway Cognito authorizer verifies the token and the control
   Lambda derives the owner from `sub`.
8. The control Lambda creates or resumes the developer's MicroVM.

### VS Code Remote Tunnels

1. The tunnel-login helper runs inside the MicroVM as the developer user.
2. The developer approves the Microsoft or GitHub device code.
3. VS Code Server and VS Code Desktop connect outbound to Microsoft dev
   tunnels.
4. Source, terminal, Git, and Claude extension execution remain inside the
   MicroVM.

### Inference (default Bedrock mode)

1. Claude Code sends a model request using the MicroVM execution role's
   temporary AWS credentials.
2. The request traverses the Network Connector ENIs to the Bedrock Runtime
   VPC endpoint.
3. Bedrock invokes the approved model or inference profile and streams the
   response back over the same private path.

### Claude gateway authentication (legacy gateway mode)

1. Claude Code requests a device code from the private gateway.
2. The gateway stores pending state in PostgreSQL.
3. The developer browser opens the private gateway verification URL.
4. The gateway redirects to the gateway Entra web application.
5. Entra authenticates the user and returns an authorization code to the
   gateway callback.
6. The gateway exchanges the code using its Secrets Manager client secret.
7. The gateway validates the email domain and identity claims.
8. Claude Code's device poll receives gateway access and refresh tokens.

### Inference (legacy gateway mode)

1. Claude Code sends a Messages API request to the internal gateway.
2. The ALB terminates TLS and forwards to a healthy Fargate task.
3. The gateway validates the session and managed policy.
4. The gateway invokes an approved Bedrock model or inference profile through
   the Bedrock Runtime VPC endpoint.
5. The response streams back over the same private path.

## Acceptance and verification

### Identity configuration

Confirm for the portal Cognito user pool:

- self-service sign-up is disabled;
- the app client has no secret and one exact callback URL (`PortalUrl`);
- the hosted UI domain resolves; and
- each approved developer has a pool user with a verified email.

Confirm for the gateway Entra application (legacy gateway mode):

- the app is single tenant;
- the service principal exists;
- the app has one exact web redirect and one active credential;
- the app emits the `email` ID-token claim; and
- assignment and Conditional Access match your identity policy.

### Gateway stack (legacy gateway mode)

```bash
aws cloudformation describe-stacks \
  --stack-name ClaudeGatewayStack \
  --region <region> \
  --profile <profile> \
  --query 'Stacks[0].StackStatus'

aws ecs describe-services \
  --cluster claude-gateway \
  --services claude-gateway \
  --region <region> \
  --profile <profile> \
  --query 'services[0].{desired:desiredCount,running:runningCount,pending:pendingCount,deployments:deployments}'
```

Expected:

- CloudFormation is `CREATE_COMPLETE` or `UPDATE_COMPLETE`;
- desired and running task counts are both two;
- pending count is zero; and
- the primary deployment is `COMPLETED`.

### HTTP endpoints (legacy gateway mode)

```bash
curl -fsS https://<gateway-hostname>/healthz
curl -fsS https://<gateway-hostname>/readyz
curl -fsS \
  https://<gateway-hostname>/.well-known/oauth-authorization-server |
  jq .
curl -fsS -X POST \
  https://<gateway-hostname>/oauth/device_authorization |
  jq '{verification_uri,expires_in,interval}'
```

Expected:

- `/healthz` returns HTTP 200;
- `/readyz` returns HTTP 200;
- discovery exposes the gateway device and token endpoints; and
- device authorization returns a new verification URI.

### Verify the live Entra redirect (legacy gateway mode)

Submit a fresh device code through the gateway page and inspect the first
redirect. It must use:

```text
host:         login.microsoftonline.com
tenant path:  /<tenant-id>/oauth2/v2.0/authorize
client_id:    <gateway-client-id>
redirect_uri: https://<gateway-hostname>/oauth/callback
response_type: code
scope:        openid profile email offline_access
```

There must be no Cognito hostname in this redirect.

### Gateway logs (legacy gateway mode)

The startup log for each current task should show:

```text
oidc issuer https://login.microsoftonline.com/<tenant-id>/v2.0
email domains <approved-domains>
claude gateway listening on http://0.0.0.0:8080
```

Review the gateway log group for unexpected `error`, `failed`, `panic`, or
`fatal` events.

### End-to-end acceptance

Record dated evidence for:

- portal Cognito sign-in;
- environment creation and ownership enforcement;
- Microsoft or GitHub tunnel authentication;
- VS Code connection to the Linux ARM64 environment;
- Claude gateway Entra sign-in (legacy gateway mode only);
- one successful Bedrock-backed prompt;
- one approved AgentCore tool call when enabled;
- suspend and resume;
- terminate and recreate with workspace restoration; and
- denial for an unassigned or disallowed user.

## Day-2 operations

### Rotate the gateway Entra secret (legacy gateway mode)

1. append a new Entra credential;
2. write it directly to the existing Secrets Manager secret;
3. force a new ECS deployment;
4. wait for both tasks to become healthy;
5. complete one interactive login and token refresh test; and
6. delete the old Entra credential only after acceptance.

Never place the credential in source control, build arguments, container
layers, task-definition environment variables, or support tickets.

### Change non-secret gateway configuration (legacy gateway mode)

The gateway YAML is baked into the image. Rebuild and deploy a new immutable
image when changing:

- Entra issuer;
- client ID;
- gateway URL;
- allowed email domains;
- Bedrock Region;
- model mapping;
- managed policy; or
- telemetry destination.

Use `cdk diff` before every deployment. A configuration-only rollout should
normally replace only the ECS task definition and update the ECS service.

### Offboard a user

1. disable or delete the user in the portal Cognito user pool
   (`aws cognito-idp admin-disable-user`);
2. for gateway mode, disable or remove the user from the Entra enterprise
   application and revoke Entra sessions when immediate revocation is
   required;
3. terminate active MicroVM environments owned by that user;
4. preserve or delete checkpoints according to retention policy; and
5. review gateway and portal audit events.

The sample gateway session TTL is one hour. A disabled user loses access no
later than the next failed refresh or token expiry, subject to identity
provider revocation behavior. Cognito ID tokens expire after one hour; the
portal holds no refresh token, so a disabled pool user cannot sign in
again.

### Certificate renewal (legacy gateway mode)

Monitor ACM renewal and publish the approved new leaf fingerprint when
certificate pinning is used. Validate the full chain from developer devices
and MicroVM routes before the previous certificate expires.

### Backup and recovery

Production operations must test:

- S3 checkpoint version recovery;
- KMS key access and recovery controls;
- restoration into a non-production environment; and
- for legacy gateway mode: RDS point-in-time recovery, ECS rollback to a
  previous immutable image, and Entra secret rotation with no user-visible
  outage.

## Troubleshooting

All modes:

| Symptom | Likely cause | Resolution |
| --- | --- | --- |
| Bedrock returns 403 | Model access is not enabled or IAM omits an ARN family | Enable model access and grant invoke actions on both inference-profile and underlying foundation-model ARNs. |
| Portal returns HTTP 401 | Token audience/issuer mismatch or malformed authorization header | Confirm the browser loaded `config.json` from the deployed portal URL and sends the raw Cognito ID token in the `authorization` header. |
| VS Code Microsoft sign-in repeatedly invokes a broken native broker | Account-broker behavior is unsuitable through the tunnel/VDI | Set `"microsoft-authentication.implementation": "msal-no-broker"` in the isolated VS Code profile and restart the extension host. |
| Remote Tunnel connects but extensions fail | Microsoft update/Marketplace/CDN egress is blocked | Allow the documented VS Code and dev-tunnel endpoints through your egress control. |

Legacy gateway mode:

| Symptom | Likely cause | Resolution |
| --- | --- | --- |
| Device login shows Cognito | Old gateway image/task or an old browser/device flow | Confirm current ECS image tag and task logs show the Entra issuer. Start a fresh `claude /login` and do not reuse an old tab. |
| `AADSTS50011` | Gateway redirect URI mismatch | Compare the URI character-for-character, including scheme, hostname, path, and trailing slash. The gateway uses a web redirect. |
| Gmail or another external account cannot sign in | Account is not a member/guest in the single tenant, is not assigned, or has no email claim | Invite and approve the user in Entra, assign the enterprise app, confirm `mail`/`email`, and allow the domain only if policy permits it. |
| Gateway reports email domain denied | `email` claim missing or domain not in `allowed_email_domains` | Confirm the gateway app's optional `email` ID-token claim and inspect the Entra user mail attribute. Rebuild the image if the domain list changes. |
| `/login` rejects the gateway as public | Gateway DNS returns a public A or AAAA address | Correct split-horizon/private DNS. Use an internal IPv4-only ALB and remove public or IPv6 answers. |
| Gateway hostname resolves but HTTPS times out | Missing VPN/peering route, wrong return route, NACL, or ALB source CIDR | Verify both route directions and determine the post-SNAT source CIDR observed by the ALB. |
| TLS trust or hostname error | Certificate name mismatch, missing private CA, or stale pinned certificate | Use a certificate for the exact hostname, distribute the CA chain, and follow the renewal/pinning process. |
| Entra callback returns invalid client secret | Secret value is wrong, expired, or ECS tasks still have the previous version | Store the credential value rather than its credential ID, then force a new ECS deployment. |
| OIDC discovery fails at gateway startup | Wrong tenant issuer, DNS failure, or no NAT path to Entra | Use the tenant-specific v2 issuer and validate outbound TCP 443, DNS, and proxy policy. |
| Entra returns `invalid_scope` | Provider-specific Cognito scope override remains in the image | Remove the explicit Cognito scopes block and retain Entra defaults including `offline_access`. |
| Gateway task cannot read `gateway.yaml` | File or parent directory permissions are too restrictive | Build with the staged config directory and mode `0644` for the file and executable parent directories. |
| Re-running `/login` shows a generic account picker after successful login | A valid gateway session already exists | Dismiss the picker and test a prompt. Confirm the status banner identifies the Cloud gateway. |
| CodeBuild image will not start on Fargate | Wrong image architecture or OCI manifest | Build `linux/amd64`, use the approved Dockerfile, and publish a standard runnable image manifest. |
| MicroVM cannot reach the gateway | Platform connector route, peering, DNS association, or gateway SG is missing | Verify the route policy in [CIDR planning](#cidr-planning) and test from the platform private network. |

## Rollback (legacy gateway mode)

Keep the previous immutable gateway image and previous Secrets Manager version
until the new Entra deployment passes acceptance.

To roll back:

1. deploy the previous image tag through CDK;
2. restore the previous OIDC secret version only if the previous identity
   provider requires it;
3. wait for ECS service stability;
4. verify discovery and device authorization; and
5. record the rollback in the change and incident records.

Do not delete the previous identity provider or application during the
initial migration window. Remove it only through a separate approved change
after the rollback period expires.

## Teardown

Destroy application stacks only after checkpoints, logs, database data, and
audit evidence have been retained according to your retention policy.

Gateway (legacy gateway mode):

```bash
cd claude-apps-gateway/cdk
npx cdk destroy ClaudeGatewayStack \
  --profile <profile> \
  -c region=<region> \
  -c publicUrl=https://<gateway-hostname> \
  -c imageTag=<current-image-tag> \
  -c certArn=<acm-certificate-arn> \
  -c zoneName=<private-zone-name> \
  -c zoneId=<private-zone-id> \
  -c ingressCidr=<effective-source-cidr> \
  -c imageReady=true
```

Platform:

```bash
npm run destroy:microvm -- \
  --region <region> \
  --profile <profile>

npx cdk destroy ClaudeMicrovmStack \
  --profile <profile>
```

Remove separately managed resources:

- VPC peering or Transit Gateway routes;
- private hosted-zone associations and Resolver rules;
- Client VPN attachments and certificates;
- ACM certificate and DNS validation records when no longer used;
- CodeBuild project and source bucket (legacy gateway mode);
- retained backup artifacts; and
- the gateway Entra service principal and app registration (legacy gateway
  mode).

The portal Cognito user pool, domain, and app client are deleted with the
platform stack. Delete the gateway confidential credential before deleting
its app registration.

## Diagram regeneration

The architecture diagram is maintained by hand in
[../images/architecture.drawio](../images/architecture.drawio). After
editing it in Draw.io Desktop, re-export the PNG:

```bash
DRAWIO='/Applications/draw.io.app/Contents/MacOS/draw.io'

"$DRAWIO" \
  --export \
  --format png \
  --page-index 0 \
  --border 20 \
  --scale 2 \
  --output images/architecture.png \
  images/architecture.drawio
```

After every change, inspect the PNG at full size and confirm no connectors
intersect, no label overlaps another element, and the MicroVM remains
outside the VPC.
