# Claude Cowork 3P on Amazon Bedrock

Reference implementations and setup guides for running **Claude Cowork** through **Amazon Bedrock**, keeping your conversations, prompts, and files inside your own AWS environment.

## What is Claude Cowork?

Claude Cowork is a desktop application from Anthropic that extends Claude's agentic capabilities to everyday knowledge work: reading documents, running multi-step research, processing files, drafting reports, and coordinating sub-agents. It brings the same pattern that made Claude Code popular with developers to analysts, lawyers, account executives, marketers, and other professionals.

**3P (third-party) mode** routes all model inference through the cloud provider you configure — Amazon Bedrock, Google Cloud Vertex AI, or Microsoft Foundry — instead of Anthropic's first-party infrastructure.

Learn more:
- AWS ML Blog: [From developer desks to the whole organization: Running Claude Cowork in Amazon Bedrock](https://aws.amazon.com/blogs/machine-learning/from-developer-desks-to-the-whole-organization-running-claude-cowork-in-amazon-bedrock/)
- Anthropic Docs: [Cowork on 3P — Overview](https://claude.com/docs/cowork/3p/overview)
- Anthropic Docs: [Deploy Cowork on 3P with Amazon Bedrock](https://claude.com/docs/cowork/3p/bedrock)
- Anthropic Docs: [Cowork 3P Configuration Reference](https://claude.com/docs/cowork/3p/configuration)

## Why run Cowork on Amazon Bedrock?

- **Your data stays in your AWS account.** Amazon Bedrock does not store prompts, files, tool inputs/outputs, or responses, and does not use them to train foundation models.
- **Regional data residency.** Claude models are hosted in AWS regions across the US, EU, APAC, and Canada. Pick the region that matches your compliance requirements.
- **Private networking.** Use VPC interface endpoints (AWS PrivateLink) to keep inference traffic off the public internet end to end.
- **Consumption-based pricing.** Billed through your existing AWS agreement — no seat licensing from Anthropic.
- **Native AWS integration.** Authenticate with AWS IAM, audit through AWS CloudTrail, observe with Amazon CloudWatch, and export OpenTelemetry telemetry to your own collectors.

## Architecture at a glance

```
┌────────────────────────┐        ┌──────────────────────────┐
│  User's Local Device   │        │     Your AWS Account     │
│                        │        │                          │
│  ┌──────────────────┐  │ HTTPS  │  ┌────────────────────┐  │
│  │  Claude Cowork   │◀─┼────────┼─▶│   Amazon Bedrock   │  │
│  │     Desktop      │  │        │  │  (Claude Models)   │  │
│  └──────────────────┘  │        │  └────────────────────┘  │
│                        │        │                          │
│  Conversations kept    │        │  CloudTrail · IAM ·      │
│  on local disk only    │        │  VPC endpoints · OTEL    │
└────────────────────────┘        └──────────────────────────┘
```

The desktop app runs entirely on the user's machine. Inference requests go directly to Amazon Bedrock in the AWS regions you configure. Conversations are stored only on local disk. Anthropic receives only aggregate telemetry (token counts, error codes, anonymous device ID), which can be disabled through managed configuration.

## Contents of this folder

| Subfolder | What's there |
|---|---|
| [`identity-federation/`](./identity-federation/) | Full example for setting up identity federation between your corporate IdP (Amazon Cognito, Microsoft Entra ID, Okta, Auth0, Google Workspace) and Amazon Bedrock for Cowork. Includes a ready-to-deploy AWS CDK app, an OIDC credential helper, live-tested setup instructions, and an end-to-end test script. Covers all three authentication paths supported by Cowork 3P: Direct IdP Federation, IAM Identity Center (SSO), and Bedrock API Keys. |

More examples will be added here over time — including VPC endpoint setup for private networking, OpenTelemetry observability with CloudWatch, and MDM deployment packages for Jamf and Intune.

## Prerequisites for any example

- An AWS account with permission to create IAM roles, policies, and (optionally) Cognito user pools
- [Claude models enabled](https://docs.aws.amazon.com/bedrock/latest/userguide/model-access.html) in the Amazon Bedrock console for the regions you plan to use
- Claude Desktop installed from [claude.com/download](https://claude.com/download) and launched once
- AWS CLI v2 for the Identity Center path; any AWS CLI version is fine for the other paths

## Getting started

For most organizations, start with [identity-federation/](./identity-federation/) — it walks through the three authentication options and helps you pick the right one for your environment.

## Security

This repository contains reference code only. No long-lived credentials, no account IDs, and no real issuer URLs are committed. Every example ships with placeholder values that you replace with your own before deploying.

If you find a security issue, please open a GitHub issue rather than a pull request.

## License

MIT-0. See the repository root for the full license text.
