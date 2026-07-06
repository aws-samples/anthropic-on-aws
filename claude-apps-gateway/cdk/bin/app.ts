#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { GatewayStack } from '../lib/claude-gateway-stack';

/**
 * CDK entry point for the Claude apps gateway on ECS Fargate (Bedrock upstream).
 *
 * This is a WORKED EXAMPLE, not a supported production artifact. It provisions
 * the SAME Fargate deployment as setup.sh; the two are kept in sync.
 *
 * Two-pass deploy (the only forced ordering is image-must-exist-before-service):
 *   Pass 1:  cdk deploy --context imageReady=false   # creates the ECR repo only
 *   build + push the image (binary download + SHA-verify happens OUTSIDE CDK)
 *   Pass 2:  cdk deploy --context imageReady=true    # full stack incl. the service
 *
 * Context vars (pass with -c key=value, or set in cdk.json / cdk.context.json):
 *   RUNTIME / INFRA (consumed by the stack):
 *     region          AWS region (default: CDK_DEFAULT_REGION or us-east-1)
 *     publicUrl       internal ALB https origin, e.g. https://claude-gateway.example.com   (required)
 *     imageTag        ECR image tag (default: the claudeVersion below)
 *     certArn         ACM cert ARN for publicUrl's hostname — IMPORTED, not issued   (required for pass 2)
 *     zoneName        Route 53 hosted-zone name, e.g. example.com   (required for pass 2)
 *     zoneId          Route 53 hosted-zone id (optional; looked up from zoneName if omitted)
 *     ingressCidr     VPN/corp CLIENT CIDR developers connect from — NOT the VPC CIDR   (required for pass 2)
 *     vpcId           import an existing VPC instead of creating one (optional)
 *     createVpcEndpoints  "false" to skip VPC endpoint creation when reusing a VPC
 *                     (`vpcId`) that already has them; default true (optional)
 *     imageReady      "false" for pass 1 (repo only), "true"/unset for pass 2
 *   BUILD-TIME (stamped into the image by stamp-config.sh; shown here for parity,
 *   not passed to the running task — changing them means a new image, ADR 0001):
 *     claudeVersion   default 2.1.197
 *     oidcIssuer, oidcClientId, allowedEmailDomains
 */
const app = new cdk.App();

const ctx = (k: string): string | undefined => app.node.tryGetContext(k);
const region = ctx('region') ?? process.env.CDK_DEFAULT_REGION ?? 'us-east-1';
const claudeVersion = ctx('claudeVersion') ?? '2.1.197';

new GatewayStack(app, 'ClaudeGatewayStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region },
  description: 'Claude apps gateway on ECS Fargate with Amazon Bedrock (worked example)',
  publicUrl: ctx('publicUrl'),
  imageTag: ctx('imageTag') ?? claudeVersion,
  certArn: ctx('certArn'),
  zoneName: ctx('zoneName'),
  zoneId: ctx('zoneId'),
  ingressCidr: ctx('ingressCidr'),
  vpcId: ctx('vpcId'),
  // Default true; only 'false' opts out (for a reused VPC that already has endpoints).
  createVpcEndpoints: ctx('createVpcEndpoints') !== 'false',
  // Pass 1 sets imageReady=false to create just the ECR repo; pass 2 (default)
  // deploys the full stack including the Fargate service.
  imageReady: ctx('imageReady') !== 'false',
});

app.synth();
