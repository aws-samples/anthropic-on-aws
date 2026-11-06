import * as cdk from 'aws-cdk-lib';
import { ackNag } from './nag.js';

/**
 * cdk-nag acknowledgements for GithubGatewayStack. Mirrors the structure
 * of nag-acks.ts (ClaudeAgentCoreRuntimeStack); see that file's header
 * comment for the general approach.
 */
export function applyGithubGatewayNagAcknowledgements(
  stack: cdk.Stack,
  options: { projectName: string },
): void {
  const region = cdk.Stack.of(stack).region;
  ackNag(stack, {
    id: 'AwsSolutions::AwsSolutions-IAM5[Action::s3:GetObject*]',
    reason:
      'CDK-generated Gateway service-role permission to read the ' +
      'OpenAPI schema asset from the shared CDK bootstrap asset bucket ' +
      '-- content-hash-named objects, not a single predictable key, so ' +
      'the asset-prefix wildcard is how every CDK asset read grant in ' +
      'this account is scoped (same pattern as the Lambda assets ' +
      'elsewhere in this sample).',
  }, {
    id: 'AwsSolutions::AwsSolutions-IAM5[Action::s3:GetBucket*]',
    reason: 'Same CDK asset-bucket read grant as the finding above.',
  }, {
    id: 'AwsSolutions::AwsSolutions-IAM5[Action::s3:List*]',
    reason: 'Same CDK asset-bucket read grant as the finding above.',
  }, {
    id: `AwsSolutions-IAM5[Resource::arn:<AWS::Partition>:s3:::cdk-hnb659fds-assets-<AWS::AccountId>-${region}/*]`,
    reason: 'Same CDK asset-bucket read grant as the finding above.',
  }, {
    id: `AwsSolutions-IAM5[Resource::arn:<AWS::Partition>:bedrock-agentcore:${region}:<AWS::AccountId>:workload-identity-directory/default/workload-identity/${options.projectName}-github-*]`,
    reason:
      'Required by AgentCore Gateway OAuth outbound authorization: the ' +
      "gateway's own per-session workload identities are not known at " +
      "synth time. This is exactly the wildcard AWS's own gateway-" +
      'outbound-auth setup guide specifies for a custom gateway service ' +
      'role ("GatewayName-*"), scoped to this one gateway\'s name prefix.',
  });
}
