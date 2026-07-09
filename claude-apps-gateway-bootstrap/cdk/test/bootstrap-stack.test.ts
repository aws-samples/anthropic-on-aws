import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { BootstrapStack } from '../lib/bootstrap-stack';

/**
 * Synth-level regression tests, following the claude-apps-gateway sample's
 * test approach: assert on the CloudFormation template CDK produces — no AWS
 * account or credentials needed.
 *
 * Pass 2 performs a live VPC lookup (Vpc.fromLookup) against the deployed
 * gateway's VPC, so template assertions here cover pass 1 — the repo-only
 * deploy that must synthesize with an empty context. That property is what
 * `scripts/deploy.sh` relies on for its first step.
 */

function synthPass1(): Template {
  const app = new cdk.App();
  const stack = new BootstrapStack(app, 'TestStack', {
    env: { account: '111122223333', region: 'us-east-1' },
    imageReady: false,
    // Pass-2 inputs are intentionally empty: pass 1 must not require them.
    publicUrl: '',
    listenerArn: '',
    albSgId: '',
    vpcId: '',
    entraTenantId: '',
    desktopClientId: '',
  });
  return Template.fromStack(stack);
}

describe('pass 1 (imageReady: false) — ECR repo only, empty context', () => {
  const template = synthPass1();

  test('creates the ECR repository', () => {
    template.resourceCountIs('AWS::ECR::Repository', 1);
  });

  test('scans images on push', () => {
    template.hasResourceProperties('AWS::ECR::Repository', {
      ImageScanningConfiguration: { ScanOnPush: true },
    });
  });

  test('does not create the service, target group, listener rule, or config bucket', () => {
    template.resourceCountIs('AWS::ECS::Service', 0);
    template.resourceCountIs('AWS::ECS::Cluster', 0);
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::TargetGroup', 0);
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::ListenerRule', 0);
    template.resourceCountIs('AWS::S3::Bucket', 0);
  });

  test('emits the repository URI output for the build step', () => {
    template.hasOutput('EcrRepositoryUri', {});
  });
});
