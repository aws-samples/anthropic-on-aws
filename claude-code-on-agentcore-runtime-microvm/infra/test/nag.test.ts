import * as cdk from 'aws-cdk-lib';
import { Annotations, Match } from 'aws-cdk-lib/assertions';
import { AwsSolutionsChecks } from 'cdk-nag';
import { describe, expect, it } from 'vitest';
import { AgentCoreRuntimeStack } from '../lib/platform-stack.js';

// cdk-nag runs as an Aspect in infra/bin/app.ts, so a suppression that only
// matches one region (for example a hardcoded region in an IAM5 resource
// string) fails `cdk synth` everywhere else. Synthesize in several regions,
// with and without the portal, and require zero unsuppressed findings.
describe.each([
  ['us-east-1', false],
  ['us-west-2', false],
  ['ap-southeast-2', false],
  ['us-east-1', true],
])('cdk-nag in %s (portal=%s)', (region, enablePortal) => {
  it('has no unsuppressed AwsSolutions errors', () => {
    const app = new cdk.App({
      context: {
        '@aws-cdk/aws-ec2:restrictDefaultSecurityGroup': true,
        vpcCidr: '10.43.0.0/16',
        enablePortal,
      },
    });
    cdk.Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }));
    // Region only, no account: matches infra/bin/app.ts, so the account
    // stays the <AWS::AccountId> token the suppressions are written for.
    const stack = new AgentCoreRuntimeStack(app, 'NagPlatform', {
      env: { region },
    });
    const errors = Annotations.fromStack(stack).findError(
      '*',
      Match.stringLikeRegexp('AwsSolutions-.*'),
    );
    expect(errors.map((error) => error.entry.data)).toEqual([]);
  });
});
