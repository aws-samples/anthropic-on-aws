#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AwsSolutionsChecks } from 'cdk-nag';
import { BootstrapStack } from '../lib/bootstrap-stack';

/**
 * CDK entry point for the BOOTSTRAP ADD-ON to the claude-apps-gateway sample.
 *
 * Prerequisite: a deployed ../claude-apps-gateway ClaudeGatewayStack. This app
 * consumes that deployment through its CloudFormation outputs — the gateway
 * stack itself is never modified. See the README for the one-time output
 * lookups.
 *
 * Two-pass deploy (same convention as claude-apps-gateway):
 *   Pass 1:  cdk deploy -c imageReady=false        # ECR repo only — NO other context needed
 *   build + push the bootstrap image to the repo (see README Step 2)
 *   Pass 2:  cdk deploy -c imageReady=true ...      # service + listener rule (the default)
 *
 * Context vars (pass with -c key=value, or set in cdk.json / cdk.context.json):
 *   imageReady       'false' for pass 1 (repo only); 'true'/unset for pass 2
 *   region           AWS region (default: CDK_DEFAULT_REGION)
 *   --- required in PASS 2 only (the deployed ClaudeGatewayStack outputs) ---
 *   publicUrl        the gateway origin — ClaudeGatewayStack `PublicUrl` output
 *   listenerArn      HTTPS :443 listener ARN of the gateway ALB (README lookup)
 *   albSgId          security-group id of the gateway ALB
 *   vpcId            VPC id the gateway deployed into
 *   entraTenantId    Entra tenant ID (PKCE token issuer)
 *   desktopClientId  Entra app id of the Claude Desktop PKCE public client
 *   imageTag         ECR image tag for the bootstrap image (default 'latest')
 */
const app = new cdk.App();
// cdk-nag AwsSolutions pack: error-level findings fail synth unless acknowledged
// with a written justification at the offending construct (see lib/nag.ts).
cdk.Validations.of(app).addPlugins(new AwsSolutionsChecks(app, { verbose: true }));

const ctx = (k: string): string | undefined => app.node.tryGetContext(k);
const imageReady = ctx('imageReady') !== 'false';
// Pass-2 inputs are required only when imageReady=true. In pass 1 they are read
// as undefined (never demanded), so the repo-only pass runs with empty context.
const req = (k: string): string | undefined => {
  const v = ctx(k);
  if (imageReady && !v) {
    throw new Error(`Missing required pass-2 context: -c ${k}=...  (see cdk/bin/app.ts header)`);
  }
  return v;
};

new BootstrapStack(app, 'ClaudeBootstrapStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: ctx('region') ?? process.env.CDK_DEFAULT_REGION,
  },
  description:
    'Bootstrap add-on for the Claude apps gateway: per-user Claude Desktop configuration '
    + 'from S3 behind the existing gateway ALB (worked example)',
  imageReady,
  // Pass-2 values (undefined in pass 1; the stack reads them only when imageReady).
  publicUrl: req('publicUrl') ?? '',
  listenerArn: req('listenerArn') ?? '',
  albSgId: req('albSgId') ?? '',
  vpcId: req('vpcId') ?? '',
  entraTenantId: req('entraTenantId') ?? '',
  desktopClientId: req('desktopClientId') ?? '',
  // Optional authorization gate (comma-separated). Omit for a single-tenant pilot.
  requiredGroups: ctx('requiredGroups'),
  requiredRoles: ctx('requiredRoles'),
  imageTag: ctx('imageTag'),
});

app.synth();
