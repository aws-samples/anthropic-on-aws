# Claude Code on AWS Lambda MicroVMs

Run private, per-developer Claude Code workspaces in AWS Lambda MicroVMs,
accessed through a browser terminal or Visual Studio Code Desktop.

Within `anthropic-on-aws`, this sample covers interactive remote development:
Claude Code and the project workspace run in an isolated AWS environment
instead of directly on the developer device.

## Overview

### What is a Lambda MicroVM?

An AWS Lambda MicroVM is a service-managed Linux ARM64 environment with a
lightweight virtual machine isolation boundary. It is disposable compute, not
an EC2 instance, and it is not launched into a customer-managed subnet.

This makes a MicroVM useful as a development sandbox:

- commands, tools, source code, and Claude Code run away from the developer
  laptop;
- the workload runs as an unprivileged Linux user with temporary execution-role
  credentials;
- network egress is routed through a scoped Lambda Network Connector into the
  platform VPC; and
- the environment can be suspended, resumed, terminated, and replaced through
  the Lambda MicroVM service APIs.

The sandbox still needs explicit IAM, network, and data controls. This sample
provides those controls but does not treat the MicroVM boundary as a substitute
for least privilege or egress policy.

### Typical access patterns

Lambda MicroVMs provide service APIs for lifecycle management and native shell
ingress for interactive terminal access. Applications can also establish
outbound connections when a graphical or application-specific interface is
needed.

This sample uses those patterns in two ways:

| Access mode | What runs in the MicroVM | Developer experience |
| --- | --- | --- |
| **Terminal** | Claude Code, shell, tools, and `/workspace` | A terminal dialog in the browser connects directly to native `SHELL_INGRESS` using a short-lived shell token |
| **VS Code** | Claude Code, VS Code Server, extensions, tools, and `/workspace` | VS Code Desktop connects through [VS Code Remote Tunnels](https://code.visualstudio.com/docs/remote/tunnels), using outbound connections to Microsoft's Azure-hosted service and a matching Microsoft or GitHub account |

Terminal mode does not start VS Code Server or a tunnel. VS Code mode requires
a separate Microsoft or GitHub tunnel identity.

### What this sample provides

The sample adds a control plane for creating and managing MicroVM workspaces:

- a private browser portal authenticated by Amazon Cognito;
- create, refresh, connect, suspend, resume, restart, and terminate actions;
- owner-scoped workspace and session state in DynamoDB;
- browser Terminal and VS Code access modes;
- Amazon Bedrock inference using the MicroVM execution role;
- one visible Claude Code model family mapped to the configured Bedrock model
  ID;
- encrypted `/workspace` checkpoint and restore through Amazon S3; and
- an IAM/SigV4 CLI for operators and automation.

Developers using Terminal mode need only the private portal and a supported
browser. They do not need this repository, Node.js, npm, a local Claude Code
installation, or a custom executable.

## Architecture

![Architecture](images/architecture.png)

| Flow | Description |
| --- | --- |
| Control | The browser signs in with Cognito and calls the private REST API. The control Lambda enforces ownership and invokes MicroVM lifecycle APIs. |
| Terminal | The portal obtains a five-minute shell token and opens the MicroVM's native shell WebSocket in the same browser tab. |
| VS Code | The MicroVM starts an outbound tunnel host; VS Code Desktop joins it after Microsoft or GitHub device authorization. |
| Inference | Claude Code uses temporary execution-role credentials and the private Bedrock Runtime or Messages API endpoint selected by the configured model ID. |
| Persistence | Lifecycle hooks archive `/workspace` to a versioned, KMS-encrypted S3 bucket and restore it into a replacement MicroVM. |

The MicroVM runs in the AWS-managed service plane. Its private AWS traffic and
public HTTPS egress enter the platform VPC through the Network Connector. The
VPC contains connector ENIs, VPC endpoints, and a NAT Gateway; control-plane
Lambdas, Cognito, DynamoDB, S3, and the MicroVM service are AWS managed
services outside those subnets.

## What gets deployed

`ClaudeMicrovmStack` creates:

- a VPC with private connector subnets, VPC endpoints, and one NAT Gateway;
- a private API Gateway REST API;
- control-plane, portal, and tunnel-auth Lambda functions;
- an optional Cognito user pool, hosted UI, and browser PKCE client;
- DynamoDB session, workspace-claim, and tunnel-auth tables;
- a versioned S3 checkpoint bucket encrypted with AWS KMS;
- CloudWatch logs, IAM roles, and SSM parameters; and
- optional private connectivity for an Amazon Bedrock AgentCore Gateway.

The deployment script then creates the Lambda Network Connector and builds the
MicroVM image from a source ZIP through the Lambda MicroVM service. Local
Docker is not required.

## Prerequisites

- An AWS account with Lambda MicroVM and Amazon Bedrock model access in the
  selected Region
- AWS CLI v2 and a deployment profile
- Node.js 20 or later
- Python 3.12 for the MicroVM agent tests
- CDK bootstrap resources in the target account and Region
- Organization-managed private routing and DNS from developer devices to the
  VPC's private `execute-api` endpoint
- A supported browser for Terminal access
- VS Code Desktop and enterprise approval for Microsoft dev tunnels when VS
  Code mode is used, including identity, relay, data-residency, proxy,
  allowlisting, and TLS-inspection policy

Private developer connectivity is a prerequisite. The stack does not create a
VPN, Direct Connect connection, transit routing, or corporate DNS.

## Quick start

Install and validate:

```bash
npm ci
npm --prefix microvm ci
npm test
npm run build
npm --prefix microvm run build
npm run synth -- --quiet
```

Copy and edit the deployment configuration:

```bash
cp deployment.example.json deployment.json
```

At minimum, review the Region, VPC CIDR, routed developer CIDR, model ID, and
portal setting. The default model is the direct Sonnet 5 ID
`anthropic.claude-sonnet-5`.

Deploy:

```bash
npm run deploy -- \
  --config deployment.json \
  --profile <profile> \
  --require-approval never
```

When `"enablePortal": true`, create a Cognito user after deployment:

```bash
aws cognito-idp admin-create-user \
  --user-pool-id <PortalUserPoolId> \
  --username '<user@example.com>' \
  --user-attributes \
    Name=email,Value='<user@example.com>' \
    Name=email_verified,Value=true \
  --region <region> \
  --profile <profile>
```

Cognito sends a temporary password and requires a new password at first
sign-in. Open the stack's `PortalUrl` through the approved private network.

See the [deployment guide](docs/deployment-guide.md) for network preparation,
model endpoint selection, identity configuration, acceptance, and teardown.

## Use a workspace

The image makes Claude Code available through two developer experiences:

1. **Terminal** opens the MicroVM's native shell in the browser. Run `claude`
   from `/workspace`.
2. **VS Code** connects VS Code Desktop to the remote Linux workspace. Claude
   Code, the remote extension host, integrated terminals, and project tools
   run inside the MicroVM.

### Terminal

1. Sign in to the portal.
2. Select **Terminal**, enter a workspace name, and choose
   **Create environment**.
3. Wait for `RUNNING`, then choose **Connect**.
4. At the `/workspace` prompt, run `claude`.

**Connect** opens a terminal dialog in the current portal tab. The shell token
remains in memory and is not downloaded or stored in browser storage. Closing
the dialog or running `exit` disconnects the shell without stopping the
MicroVM; use **Connect** or **Reconnect** to attach again.

### VS Code

1. Select **VS Code** and the approved Microsoft or GitHub tunnel identity.
2. Create the environment and wait for `RUNNING`.
3. Choose **Connect** and complete the displayed device authorization.
4. Open the assigned tunnel in VS Code Desktop.

The tunnel identity is separate from Cognito. Source, terminals, extensions,
language servers, and Claude Code continue to run inside the MicroVM.

## Lifecycle and checkpointing

Checkpointing is still provided. The MicroVM lifecycle agent archives
`/workspace` to versioned, KMS-encrypted S3 storage:

- before suspend, restart, and terminate;
- during the managed replacement before the eight-hour invocation limit; and
- when a clean shutdown requests a final checkpoint.

Starting the same workspace restores its latest checkpoint into a fresh
MicroVM. This is file checkpoint and restore, not live process migration.
Running processes, memory, open terminals, temporary credentials, VS Code
Server files, tunnel identity, and `/home/developer` are recreated.

Git remains the source of record. A hard failure can lose changes made after
the most recent successful checkpoint.

## Operator automation

The source-tree CLI uses IAM and SigV4:

```text
npm run client -- --region REGION --profile PROFILE list
npm run client -- --region REGION --profile PROFILE start WORKSPACE
npm run client -- --region REGION --profile PROFILE vscode WORKSPACE
```

Portal and IAM environments use separate owner namespaces. The CLI does not
attach to or migrate a Cognito-owned workspace.

## Day-2 MicroVM image rebuild

Rebuild the image after changing files under `microvm/`, including
`microvm/tool-versions.json`. Validate the source, then update the existing
image without redeploying the CDK stack:

```bash
npm ci
npm --prefix microvm ci
npm test
npm run build
npm --prefix microvm run build

npm run provision -- provision \
  --region <region> \
  --profile <profile> \
  --stack ClaudeMicrovmStack \
  --memory-mib 4096 \
  --timeout-minutes 60
```

The provisioner uploads a new source archive, waits for a new image version to
become active, and updates the image and connector SSM parameters. Existing
running or suspended environments remain on the version with which they
started. Use **Restart** in the portal to checkpoint a workspace and replace
it from the active image; new environments use the active version
automatically.

Use the full `npm run deploy -- --config deployment.json ...` workflow when
CDK, control-plane, portal, or deployment configuration also changes.

## Security and limitations

- There is no SSH daemon, public IP, bastion, or `ALL_INGRESS` application
  listener.
- The private API is restricted to the configured VPC endpoint and routed
  developer CIDR.
- Browser shell credentials expire after five minutes and remain in memory.
- NAT permits outbound IPv4 HTTPS; production hostname filtering requires AWS
  Network Firewall or centralized egress controls.
- VS Code source and editor protocol traffic traverse Microsoft's dev-tunnels
  relay and require organizational approval.
- Each MicroVM invocation has an eight-hour maximum duration. The reconciler
  checkpoint-terminates it early so a later start can restore the workspace.
- The shell WebSocket framing follows live Lambda MicroVM service behavior and
  should be revalidated when changing service or SDK versions.
- The sample is single-Region and does not deploy production alarms, quotas,
  multi-AZ NAT, or private developer connectivity.

## Documentation

- [Architecture and deployment guide](docs/deployment-guide.md)
- [Architecture source](images/architecture.drawio)
- [Optional private gateway deployment](../claude-apps-gateway/cdk/README.md)

## License

Licensed under the Apache License 2.0. See the repository
[LICENSE](../LICENSE).
