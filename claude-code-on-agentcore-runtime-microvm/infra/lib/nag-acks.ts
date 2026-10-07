import { IConstruct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import { ackNag } from './nag.js';

/**
 * cdk-nag acknowledgements for ClaudeAgentCoreRuntimeStack. Mirrors the
 * structure of claude-code-on-lambda-microvm/infra/lib/nag-acks.ts; see
 * that file's header comment for the general approach.
 */
export function applyNagAcknowledgements(
  stack: cdk.Stack,
  options: {
    bedrockFoundationModelId: string;
    bedrockUsesInferenceProfile: boolean;
    projectName: string;
  },
): void {
  const region = cdk.Stack.of(stack).region;
  const projectName = options.projectName;
  const at = (path: string): IConstruct | undefined => {
    let node: IConstruct | undefined = stack;
    for (const part of path.split('/')) {
      node = node?.node.tryFindChild(part);
      if (!node) return undefined;
    }
    return node;
  };
  const ack = (
    path: string,
    ...rules: Array<{ id: string; reason: string }>
  ): void => {
    const scope = at(path);
    if (scope) ackNag(scope, ...rules);
  };

  ackNag(
    stack,
    {
      id: 'AwsSolutions::AwsSolutions-COG4',
      reason:
        'The /sessions* routes require AWS_IAM (SigV4) by design for the ' +
        'IAM-authorized operator CLI path; when enablePortal is set, the ' +
        'portal mirrors these routes behind a Cognito user pool ' +
        'authorizer instead. The private API is additionally pinned to ' +
        'one VPC endpoint by resource policy.',
    },
    {
      id: 'AwsSolutions::AwsSolutions-L1',
      reason:
        'Runtime is intentionally pinned to NODEJS_22_X, the newest ' +
        'Node.js LTS runtime the used aws-cdk-lib release models; the ' +
        'sample pins versions deliberately for reproducibility.',
    },
    {
      id: 'AwsSolutions-IAM4[Policy::arn:<AWS::Partition>:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole]',
      reason:
        'AWS-managed basic execution role grants only CloudWatch Logs ' +
        'write for the function log group — the standard, minimal Lambda ' +
        'logging policy.',
    },
    {
      id: 'AwsSolutions::AwsSolutions-DDB3',
      reason:
        'WorkspaceClaims holds only short-TTL coordination records ' +
        '(session locks) that are valueless after expiry; the durable ' +
        'Sessions table has point-in-time recovery enabled.',
    },
  );

  ack('Vpc/Resource', {
    id: 'AwsSolutions::AwsSolutions-VPC7',
    reason:
      'Flow Logs are listed as customer production hardening in the ' +
      'deployment guide; the sample omits them to keep baseline cost low.',
  });
  ack('ApiEndpointSecurityGroup/Resource', {
    id: 'AwsSolutions::AwsSolutions-EC23',
    reason:
      'The rule cannot resolve the CfnParameter-driven trusted client ' +
      'CIDR. The ingress source is the deployment-scoped routed private ' +
      'CIDR and the runtime security group, never 0.0.0.0/0.',
  });

  ack('PortalUserPool/Resource', {
    id: 'AwsSolutions::AwsSolutions-COG8',
    reason:
      'Advanced security / plus tier is a paid Cognito feature deferred ' +
      'to customer production hardening, same as other cost-optional ' +
      'controls in this sample; the user pool otherwise enforces a ' +
      'strong password policy and email verification.',
  }, {
    id: 'AwsSolutions::AwsSolutions-COG2',
    reason:
      'MFA is deferred to customer production hardening, matching the ' +
      'baseline-cost posture of this sample; the portal is additionally ' +
      'gated behind admin-provisioned users (no self-signup) and the ' +
      'deployment-scoped TrustedClientCidr on the underlying API.',
  });

  for (const assetPath of [
    'portal/GET/Resource',
    'portal/app.js/GET/Resource',
    'portal/terminal-vendor.js/GET/Resource',
    'portal/xterm.css/GET/Resource',
    'portal/config.json/GET/Resource',
  ]) {
    ack(`ControlApi/Default/${assetPath}`, {
      id: 'AwsSolutions::AwsSolutions-APIG4',
      reason:
        'These GET routes serve only the static, unauthenticated portal ' +
        'SPA shell (HTML/CSS/JS) a browser must load before it can ' +
        'obtain a Cognito token — the standard public-bootstrap-asset ' +
        'pattern for a browser-based SPA. Every route that returns ' +
        'session data or control-plane access (/portal/sessions*) ' +
        'requires the Cognito user pool authorizer (PortalAuthorizer).',
    });
  }

  ack('WorkspaceBucket/Resource', {
    id: 'AwsSolutions::AwsSolutions-S1',
    reason:
      'Server access logging is deferred to customer production ' +
      'hardening. The bucket is KMS-encrypted, SSL-enforced, private, and ' +
      'object access is only via short-lived presigned URLs minted by ' +
      'the control plane.',
  });

  ack('ControlApi/Resource', {
    id: 'AwsSolutions::AwsSolutions-APIG2',
    reason:
      'Request bodies are validated in the handler (strict shape, ' +
      'length, and enum checks with unit tests) where richer validation ' +
      'than API Gateway basic validators is required anyway.',
  });
  ack('ControlApi/DeploymentStage.v1', {
    id: 'AwsSolutions::AwsSolutions-APIG3',
    reason:
      'WAF is not attachable to private REST APIs; exposure is bounded ' +
      'by the VPC-endpoint-pinned resource policy instead.',
  });
  ack('ControlApi/CloudWatchRole/Resource', {
    id: 'AwsSolutions-IAM4[Policy::arn:<AWS::Partition>:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs]',
    reason:
      'AWS-managed policy required by API Gateway account settings to ' +
      'deliver execution and access logs to CloudWatch.',
  });

  // The wildcard is on RuntimeExecutionRole (the AgentCore Runtime
  // microVM's role, which actually calls bedrock:InvokeModel), not
  // ControlFunction (the control-plane Lambda, which never calls
  // Bedrock directly). Scoped to all Bedrock foundation models and
  // inference profiles in this account/region -- rather than the one
  // model this deployment happens to be configured for -- because the
  // Claude Code CLI's model shorthands ("sonnet", "opus", etc.) and
  // users switching models at runtime need more than a single
  // allow-listed ARN; the previous single-ARN scoping caused a
  // confusing 403 the moment anything other than the exact configured
  // model was invoked (confirmed live). The grant is still limited to
  // bedrock:InvokeModel and InvokeModelWithResponseStream, and this
  // role has no other permissions of consequence (see its own doc
  // comment: deliberately no workspace S3 access).
  ack('RuntimeExecutionRole/DefaultPolicy/Resource', {
    id: 'AwsSolutions-IAM5[Resource::arn:<AWS::Partition>:bedrock:*::foundation-model/*]',
    reason:
      'Runtime role is intentionally allowed to invoke any Bedrock ' +
      'foundation model (see Claude Code model-shorthand note above); ' +
      'invocation is limited to InvokeModel/InvokeModelWithResponseStream.',
  });
  ack('RuntimeExecutionRole/DefaultPolicy/Resource', {
    id: 'AwsSolutions-IAM5[Resource::arn:<AWS::Partition>:bedrock:us-west-2:<AWS::AccountId>:inference-profile/*]',
    reason:
      'Same rationale as the foundation-model wildcard above, for ' +
      'cross-region inference profiles.',
  });

  ack('ControlFunction/ServiceRole/DefaultPolicy/Resource', {
    id: 'AwsSolutions-IAM5[Action::s3:GetObject*]',
    reason:
      'CDK grantReadWrite action expansion scoped to the workspace ' +
      'bucket, used only for per-session checkpoint object keys.',
  });
  ack('ControlFunction/ServiceRole/DefaultPolicy/Resource', {
    id: 'AwsSolutions-IAM5[Action::s3:GetBucket*]',
    reason:
      'CDK grantReadWrite action expansion scoped to the workspace ' +
      'bucket.',
  });
  ack('ControlFunction/ServiceRole/DefaultPolicy/Resource', {
    id: 'AwsSolutions-IAM5[Action::s3:List*]',
    reason:
      'CDK grantReadWrite action expansion scoped to the workspace ' +
      'bucket.',
  });
  ack('ControlFunction/ServiceRole/DefaultPolicy/Resource', {
    id: 'AwsSolutions-IAM5[Action::s3:DeleteObject*]',
    reason:
      'CDK grantReadWrite action expansion scoped to the workspace ' +
      'bucket.',
  });
  ack('ControlFunction/ServiceRole/DefaultPolicy/Resource', {
    id: 'AwsSolutions-IAM5[Action::s3:Abort*]',
    reason:
      'CDK grantReadWrite action expansion scoped to the workspace ' +
      'bucket.',
  });
  ack('ControlFunction/ServiceRole/DefaultPolicy/Resource', {
    id: 'AwsSolutions-IAM5[Resource::<WorkspaceBucket53E30B92.Arn>/*]',
    reason:
      'CDK grantReadWrite action expansion scoped to the workspace ' +
      'bucket object prefix.',
  });
  ack('ControlFunction/ServiceRole/DefaultPolicy/Resource', {
    id: 'AwsSolutions-IAM5[Action::kms:GenerateDataKey*]',
    reason:
      'CDK grant API KMS action expansion scoped to the single ' +
      'customer-managed data key.',
  });
  ack('ControlFunction/ServiceRole/DefaultPolicy/Resource', {
    id: 'AwsSolutions-IAM5[Action::kms:ReEncrypt*]',
    reason:
      'CDK grant API KMS action expansion scoped to the single ' +
      'customer-managed data key.',
  });
  ack('ControlFunction/ServiceRole/DefaultPolicy/Resource', {
    id: 'AwsSolutions-IAM5[Resource::<Sessions8896A56D.Arn>/index/*]',
    reason:
      'CDK grant wildcard over the Sessions table GSIs (owner-updated ' +
      'and state-updated indexes) used by list and reconcile queries.',
  });
  ack('ControlFunction/ServiceRole/DefaultPolicy/Resource', {
    id: 'AwsSolutions-IAM5[Resource::*]',
    reason:
      'AgentCore Runtime data-plane APIs (InvokeAgentRuntime*, ' +
      'ListSessions, StopRuntimeSession) require the agentRuntimeArn ' +
      'wildcard suffix for session-scoped calls; per-session ownership ' +
      'is enforced in application code with unit tests.',
  });
  ack('ControlFunction/ServiceRole/DefaultPolicy/Resource', {
    id: 'AwsSolutions-IAM5[Resource::<AgentRuntime.AgentRuntimeArn>/*]',
    reason:
      'AgentCore Runtime data-plane APIs require the agentRuntimeArn ' +
      'wildcard suffix for session-scoped calls; per-session ownership ' +
      'is enforced in application code with unit tests.',
  });

  ack('RuntimeExecutionRole/DefaultPolicy/Resource', {
    id: 'AwsSolutions-IAM5[Resource::*]',
    reason:
      'ecr:GetAuthorizationToken supports no resource-level ARNs; image ' +
      'pull access itself is scoped to the one agent image repository.',
  });
  ack('RuntimeExecutionRole/DefaultPolicy/Resource', {
    id: `AwsSolutions-IAM5[Resource::arn:<AWS::Partition>:execute-api:${region}:<AWS::AccountId>:<ControlApiAC3A38A3>/<ControlApiDeploymentStagev10C21D0B1>/POST/sessions/*/checkpoint-urls]`,
    reason:
      'Session-id path wildcard on exactly one route (checkpoint URL ' +
      'refresh); the handler additionally verifies the caller is the ' +
      'execution role and owns the session.',
  });
  ack('RuntimeExecutionRole/DefaultPolicy/Resource', {
    id: `AwsSolutions-IAM5[Resource::arn:<AWS::Partition>:logs:${region}:<AWS::AccountId>:log-group:/${projectName}/agentcore-runtime:*]`,
    reason:
      'Log-stream wildcard beneath the single dedicated AgentCore ' +
      'Runtime log group; stream names are runtime-generated.',
  });
  ack('RuntimeExecutionRole/DefaultPolicy/Resource', {
    id: `AwsSolutions-IAM5[Resource::arn:<AWS::Partition>:logs:${region}:<AWS::AccountId>:log-group:/aws/bedrock-agentcore/runtimes/*]`,
    reason:
      'AgentCore Runtime writes container output to a service-managed ' +
      'log group named after the generated agent runtime ID and ' +
      'endpoint, which is not known until deploy time; the wildcard is ' +
      'scoped to the AWS-owned /aws/bedrock-agentcore/runtimes/ prefix, ' +
      'not customer resources.',
  });

  ack('ShellRelayCluster/Resource', {
    id: 'AwsSolutions-ECS4',
    reason:
      'Not applicable: Container Insights is explicitly enabled on this ' +
      'cluster (containerInsightsV2: ENABLED).',
  });
  ack('ShellRelayTaskDefinition/Resource', {
    id: 'AwsSolutions-ECS2',
    reason:
      'The two environment variables (AWS_REGION, RELAY_TOKENS_TABLE_NAME) ' +
      'are non-sensitive configuration, not secrets -- the relay never ' +
      'receives credentials, tokens, or session identifiers via its own ' +
      'environment; those arrive per-connection from the browser and are ' +
      'looked up in RelayTokens.',
  });
  ack('ShellRelayTaskDefinition/TaskRole/DefaultPolicy/Resource', {
    id: 'AwsSolutions-IAM5[Resource::<AgentRuntime.AgentRuntimeArn>/*]',
    reason:
      'Matches the identical, already-acknowledged wildcard on ' +
      'RuntimeExecutionRole: AgentCore Runtime data-plane APIs require ' +
      'the agentRuntimeArn wildcard suffix for session-scoped calls. The ' +
      'relay additionally only ever acts on a runtimeSessionId/shellId ' +
      'pair it received via a single-use RelayTokens token that the ' +
      'control plane minted after its own ownership check.',
  });
  ack('ShellRelayTaskDefinition/ExecutionRole/DefaultPolicy/Resource', {
    id: 'AwsSolutions-IAM5[Resource::*]',
    reason:
      'CDK-generated Fargate execution role policy for ' +
      'ecs.ContainerImage.fromAsset (ECR image pull authorization token, ' +
      'which supports no resource-level ARN) and the CloudWatch Logs ' +
      'stream this task writes to.',
  });
}
