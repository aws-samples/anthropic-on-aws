import { createRequire } from 'node:module';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cdk from 'aws-cdk-lib';
import { AwsSolutionsChecks } from 'cdk-nag';
import { AgentCoreRuntimeStack } from '../lib/platform-stack.js';

const app = new cdk.App();
cdk.Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }));
const region = app.node.tryGetContext('region') ?? 'us-east-1';

new AgentCoreRuntimeStack(app, 'ClaudeAgentCoreRuntimeStack', {
  env: { region },
  description:
    'Private Claude Code developer environments on Amazon Bedrock ' +
    'AgentCore Runtime',
});
