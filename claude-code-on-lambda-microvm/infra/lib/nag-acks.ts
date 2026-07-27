import { IConstruct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import { ackNag } from './nag.js';

/**
 * cdk-nag acknowledgements for ClaudeMicrovmStack, kept in one file so the
 * full risk-acceptance record is reviewable at a glance. Each entry names the
 * offending construct by path and carries the evidence for why the finding is
 * accepted in this sample. Constructs that exist only when a feature is
 * enabled (portal, VPN) are looked up defensively.
 */
export function applyNagAcknowledgements(
  stack: cdk.Stack,
  options: { bedrockModelId: string },
): void {
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

  // --- Stack-wide rule classes -------------------------------------------

  ackNag(
    stack,
    {
      id: 'AwsSolutions::AwsSolutions-COG4',
      reason:
        'Portal routes (/portal/sessions*) do use the stack-created ' +
        'Cognito user pool authorizer. The /sessions* routes require ' +
        'AWS_IAM (SigV4) by design, and the three unauthenticated GET ' +
        'routes serve only the static portal shell and public OAuth ' +
        'client configuration; the API resource policy restricts all ' +
        'invokes to one VPC endpoint.',
    },
    {
      id: 'AwsSolutions::AwsSolutions-APIG4',
      reason:
        'Same evidence as COG4: only the static portal shell and public ' +
        'OAuth client configuration are served without an authorizer, ' +
        'behind a private API pinned to a single VPC endpoint.',
    },
    {
      id: 'AwsSolutions::AwsSolutions-L1',
      reason:
        'Runtime is intentionally pinned to NODEJS_22_X, the newest Node.js ' +
        'LTS runtime the used aws-cdk-lib release models; the sample pins ' +
        'versions deliberately for reproducibility.',
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
        'WorkspaceClaims and TunnelAuthJobs hold only short-TTL coordination ' +
        'records (session locks, 15-minute device-code jobs) that are ' +
        'valueless after expiry; the durable Sessions table has ' +
        'point-in-time recovery enabled.',
    },
  );

  // --- Portal Cognito user pool (only when enablePortal) --------------------

  ack('PortalUserPool/Resource', {
    id: 'AwsSolutions::AwsSolutions-COG2',
    reason:
      'MFA is left to customer policy in this sample: the pool is ' +
      'admin-create-only with a 12-character full-complexity password ' +
      'policy, the portal is reachable only over the private network, and ' +
      'the deployment guide lists MFA enforcement as production hardening.',
  });
  ack('PortalUserPool/Resource', {
    id: 'AwsSolutions::AwsSolutions-COG3',
    reason:
      'Advanced security features require the Cognito Plus feature plan; ' +
      'the sample keeps baseline cost low and the deployment guide lists ' +
      'threat protection as customer production hardening.',
  });
  ack('PortalUserPool/Resource', {
    id: 'AwsSolutions::AwsSolutions-COG8',
    reason:
      'The Plus feature plan (threat protection, compromised-credential ' +
      'detection) is deferred to customer production hardening to keep ' +
      'sample baseline cost low; the pool is admin-create-only with a ' +
      'full-complexity 12-character password policy behind a private ' +
      'portal.',
  });

  // --- Networking ---------------------------------------------------------

  ack('Vpc/Resource', {
    id: 'AwsSolutions::AwsSolutions-VPC7',
    reason:
      'Flow Logs are listed as customer production hardening in the ' +
      'deployment guide; the sample omits them to keep baseline cost low.',
  });
  ack('ApiEndpointSecurityGroup/Resource', {
    id: 'AwsSolutions::AwsSolutions-EC23',
    reason:
      'The rule cannot resolve the CfnParameter-driven VPN client CIDR. ' +
      'The ingress source is the deployment-scoped VPN client CIDR and the ' +
      'MicroVM connector security group, never 0.0.0.0/0.',
  });

  // --- S3 ------------------------------------------------------------------

  for (const bucket of ['WorkspaceBucket/Resource', 'ArtifactBucket/Resource'])
    ack(bucket, {
      id: 'AwsSolutions::AwsSolutions-S1',
      reason:
        'Server access logging is deferred to customer production ' +
        'hardening. Buckets are KMS-encrypted, SSL-enforced, private, and ' +
        'object access is only via short-lived presigned URLs minted by ' +
        'the control plane.',
    });

  // --- API Gateway ---------------------------------------------------------

  ack('ControlApi/Resource', {
    id: 'AwsSolutions::AwsSolutions-APIG2',
    reason:
      'Request bodies are validated in the handler (strict shape, length, ' +
      'and enum checks with unit tests) where richer validation than API ' +
      'Gateway basic validators is required anyway.',
  });
  ack('ControlApi/DeploymentStage.v1', {
    id: 'AwsSolutions::AwsSolutions-APIG3',
    reason:
      'WAF is not attachable to private REST APIs; exposure is bounded by ' +
      'the VPC-endpoint-pinned resource policy instead.',
  });
  ack('ControlApi/CloudWatchRole/Resource', {
    id: 'AwsSolutions-IAM4[Policy::arn:<AWS::Partition>:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs]',
    reason:
      'AWS-managed policy required by API Gateway account settings to ' +
      'deliver execution and access logs to CloudWatch.',
  });

  // --- MicroVM execution role ---------------------------------------------

  ack('MicrovmExecutionRole/DefaultPolicy/Resource', {
    id: 'AwsSolutions-IAM5[Resource::arn:<AWS::Partition>:logs:us-east-1:<AWS::AccountId>:log-group:/<ProjectName>/microvms:*]',
    reason:
      'Log-stream wildcard beneath the single dedicated MicroVM log group; ' +
      'stream names are runtime-generated.',
  });
  ack('MicrovmExecutionRole/DefaultPolicy/Resource', {
    id: 'AwsSolutions-IAM5[Resource::arn:<AWS::Partition>:execute-api:us-east-1:<AWS::AccountId>:<ControlApiAC3A38A3>/<ControlApiDeploymentStagev10C21D0B1>/POST/sessions/*/checkpoint-urls]',
    reason:
      'Session-id path wildcard on exactly one route (checkpoint URL ' +
      'refresh); the handler additionally verifies the caller is the ' +
      'execution role and owns the session.',
  });

  // Bedrock model wildcard: region segment wildcard for inference profiles
  // that fan out to per-region foundation-model ARNs. The model id itself is
  // pinned to the single approved model; grant is bedrock:InvokeModel* only.
  ack('MicrovmExecutionRole/DefaultPolicy/Resource', {
    id: `AwsSolutions-IAM5[Resource::arn:<AWS::Partition>:bedrock:*::foundation-model/${options.bedrockModelId.replace(/^(?:us|global)\./, '')}]`,
    reason:
      'Cross-region inference profiles require the foundation-model ARN in ' +
      'every fan-out region (region segment wildcard); the model identifier ' +
      'itself is pinned to the one approved Claude model and the grant is ' +
      'limited to bedrock:InvokeModel and InvokeModelWithResponseStream.',
  });

  // --- Image build role ----------------------------------------------------

  const grantReadReason =
    'CDK grantRead action expansion (GetObject*/GetBucket*/List*) scoped to ' +
    'the artifact bucket and the uploaded source ZIP objects.';
  ack(
    'MicrovmBuildRole/DefaultPolicy/Resource',
    { id: 'AwsSolutions-IAM5[Action::s3:GetObject*]', reason: grantReadReason },
    { id: 'AwsSolutions-IAM5[Action::s3:GetBucket*]', reason: grantReadReason },
    { id: 'AwsSolutions-IAM5[Action::s3:List*]', reason: grantReadReason },
    {
      id: 'AwsSolutions-IAM5[Resource::<ArtifactBucket7410C9EF.Arn>/*]',
      reason: grantReadReason,
    },
    {
      id: 'AwsSolutions-IAM5[Resource::arn:<AWS::Partition>:logs:us-east-1:<AWS::AccountId>:log-group:/<ProjectName>/microvms:*]',
      reason:
        'Log-stream wildcard beneath the dedicated MicroVM build log group.',
    },
    {
      id: 'AwsSolutions-IAM5[Resource::arn:<AWS::Partition>:logs:us-east-1:<AWS::AccountId>:log-group:/aws/lambda/microvms/*]',
      reason:
        'Log-stream wildcard beneath the AWS-managed MicroVM service build ' +
        'log prefix.',
    },
  );

  // --- Control function ----------------------------------------------------

  const grantRwReason =
    'CDK grantReadWrite action expansion on the workspace bucket, scoped to ' +
    'per-session checkpoint object keys.';
  const kmsGrantReason =
    'CDK grant API KMS action expansion (GenerateDataKey*/ReEncrypt*) ' +
    'scoped to the single customer-managed data key.';
  ack(
    'ControlFunction/ServiceRole/DefaultPolicy/Resource',
    { id: 'AwsSolutions-IAM5[Action::s3:GetObject*]', reason: grantRwReason },
    { id: 'AwsSolutions-IAM5[Action::s3:GetBucket*]', reason: grantRwReason },
    { id: 'AwsSolutions-IAM5[Action::s3:List*]', reason: grantRwReason },
    { id: 'AwsSolutions-IAM5[Action::s3:Abort*]', reason: grantRwReason },
    {
      id: 'AwsSolutions-IAM5[Action::s3:DeleteObject*]',
      reason: grantRwReason,
    },
    {
      id: 'AwsSolutions-IAM5[Resource::<WorkspaceBucket53E30B92.Arn>/*]',
      reason: grantRwReason,
    },
    {
      id: 'AwsSolutions-IAM5[Action::kms:GenerateDataKey*]',
      reason: kmsGrantReason,
    },
    { id: 'AwsSolutions-IAM5[Action::kms:ReEncrypt*]', reason: kmsGrantReason },
    {
      id: 'AwsSolutions-IAM5[Resource::<Sessions8896A56D.Arn>/index/*]',
      reason:
        'CDK grant wildcard over the Sessions table GSIs (owner-updated and ' +
        'state-updated indexes) used by list and reconcile queries.',
    },
    {
      id: 'AwsSolutions-IAM5[Resource::<TunnelAuthWorker59A3E527.Arn>:*]',
      reason:
        'Versioned-ARN wildcard from the CDK grantInvoke API on the single ' +
        'tunnel-auth worker function.',
    },
    {
      id: 'AwsSolutions-IAM5[Resource::*]',
      reason:
        'The Lambda MicroVM lifecycle APIs (RunMicrovm, GetMicrovm, ' +
        'ListMicrovms, Suspend/Resume/TerminateMicrovm, ' +
        'CreateMicrovmShellAuthToken, PassNetworkConnector) expose no ' +
        'resource-level ARNs; per-session ownership is enforced in ' +
        'application code with unit tests.',
    },
  );

  // --- Network connector operator role --------------------------------------

  ack(
    'NetworkConnectorOperatorRole/DefaultPolicy/Resource',
    {
      id: 'AwsSolutions-IAM5[Resource::*]',
      reason:
        'ec2:DescribeNetworkInterfaces supports no resource-level ARNs; the ' +
        'role is assumable only by the Lambda MicroVMs service principal.',
    },
    {
      id: 'AwsSolutions-IAM5[Resource::arn:<AWS::Partition>:ec2:us-east-1:<AWS::AccountId>:network-interface/*]',
      reason:
        'Connector ENI ids are service-generated; create/delete are ' +
        'constrained to network-interface/* with the managed-operator tag ' +
        'condition.',
    },
  );

  // --- Portal constructs (only when enablePortal) ---------------------------

  ack(
    'TunnelAuthWorker/ServiceRole/DefaultPolicy/Resource',
    {
      id: 'AwsSolutions-IAM5[Resource::*]',
      reason:
        'GetMicrovm/CreateMicrovmShellAuthToken expose no resource-level ' +
        'ARNs; the worker verifies session ownership before minting a ' +
        '5-minute shell token.',
    },
    {
      id: 'AwsSolutions-IAM5[Resource::<Sessions8896A56D.Arn>/index/*]',
      reason:
        'CDK grant wildcard over the Sessions table GSIs used for ' +
        'ownership verification.',
    },
    {
      id: 'AwsSolutions-IAM5[Action::kms:GenerateDataKey*]',
      reason: kmsGrantReason,
    },
    { id: 'AwsSolutions-IAM5[Action::kms:ReEncrypt*]', reason: kmsGrantReason },
  );
}
