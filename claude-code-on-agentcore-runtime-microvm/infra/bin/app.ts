import { createRequire } from 'node:module';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cdk from 'aws-cdk-lib';
import { AwsSolutionsChecks } from 'cdk-nag';
import { AgentCoreRuntimeStack } from '../lib/platform-stack.js';
import { GithubGatewayStack } from '../lib/github-gateway-stack.js';

const app = new cdk.App();
cdk.Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }));
const region = app.node.tryGetContext('region') ?? 'us-east-1';

new AgentCoreRuntimeStack(app, 'ClaudeAgentCoreRuntimeStack', {
  env: { region },
  description:
    'Private Claude Code developer environments on Amazon Bedrock ' +
    'AgentCore Runtime',
});

// Optional, independently-deployed stack -- see
// scripts/setup-github-gateway.ts and github-gateway-stack.ts's own doc
// comment for why this is not a child of AgentCoreRuntimeStack. Only
// instantiated when explicitly requested, so a plain `cdk synth`/`cdk
// deploy` of this app is unaffected unless a reader has actually run the
// GitHub setup script.
if (contextBoolean(app.node.tryGetContext('enableGithubGateway'), false)) {
  new GithubGatewayStack(app, 'GithubGatewayStack', {
    env: { region },
    description:
      'Per-user GitHub tools for Claude Code sessions, via AgentCore ' +
      'Gateway and Identity',
  });
}

function contextBoolean(value: unknown, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  throw new Error('Boolean CDK context values must be true or false');
}
