#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AwsSolutionsChecks } from 'cdk-nag';
import { PlatformStack } from '../lib/platform-stack.js';

const app = new cdk.App();
// cdk-nag AwsSolutions pack: error-level findings fail synth unless
// acknowledged with a written justification at the offending construct
// (see lib/nag.ts).
cdk.Validations.of(app).addPlugins(new AwsSolutionsChecks(app, { verbose: true }));
const region =
  app.node.tryGetContext('region') ??
  'us-east-1';

new PlatformStack(app, 'ClaudeMicrovmStack', {
  env: { region },
  description:
    'Private Claude Code developer environments on AWS Lambda MicroVMs',
});
