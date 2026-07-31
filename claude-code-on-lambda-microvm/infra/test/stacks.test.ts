import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  isApprovedBedrockModelId,
  PlatformStack,
} from '../lib/platform-stack.js';

let gatewayTemplate: Template;
let bedrockTemplate: Template;
let bedrockProfileTemplate: Template;
let agentCoreTemplate: Template;
let portalTemplate: Template;
let claudeAiTemplate: Template;

beforeAll(() => {
  const env = {
    account: '111122223333',
    region: 'us-east-1',
  };
  gatewayTemplate = Template.fromStack(
    new PlatformStack(
      new cdk.App({
        context: {
          '@aws-cdk/aws-ec2:restrictDefaultSecurityGroup':
            true,
          inferenceMode: 'claude-gateway',
          vpcCidr: '10.42.0.0/16',
        },
      }),
      'GatewayPlatform',
      { env },
    ),
  );
  bedrockTemplate = Template.fromStack(
    new PlatformStack(
      new cdk.App({
        context: {
          '@aws-cdk/aws-ec2:restrictDefaultSecurityGroup':
            true,
          inferenceMode: 'bedrock',
          vpcCidr: '10.42.0.0/16',
        },
      }),
      'BedrockPlatform',
      { env },
    ),
  );
  bedrockProfileTemplate = Template.fromStack(
    new PlatformStack(
      new cdk.App({
        context: {
          '@aws-cdk/aws-ec2:restrictDefaultSecurityGroup':
            true,
          bedrockModelId:
            'eu.anthropic.claude-sonnet-5',
          inferenceMode: 'bedrock',
          vpcCidr: '10.42.0.0/16',
        },
      }),
      'BedrockProfilePlatform',
      { env },
    ),
  );
  agentCoreTemplate = Template.fromStack(
    new PlatformStack(
      new cdk.App({
        context: {
          '@aws-cdk/aws-ec2:restrictDefaultSecurityGroup':
            true,
          enableAgentCore: true,
          inferenceMode: 'claude-gateway',
          vpcCidr: '10.42.0.0/16',
        },
      }),
      'AgentCorePlatform',
      { env },
    ),
  );
  portalTemplate = Template.fromStack(
    new PlatformStack(
      new cdk.App({
        context: {
          '@aws-cdk/aws-ec2:restrictDefaultSecurityGroup':
            true,
          enablePortal: true,
          inferenceMode: 'claude-gateway',
          vpcCidr: '10.42.0.0/16',
        },
      }),
      'PortalPlatform',
      { env },
    ),
  );
  claudeAiTemplate = Template.fromStack(
    new PlatformStack(
      new cdk.App({
        context: {
          '@aws-cdk/aws-ec2:restrictDefaultSecurityGroup':
            true,
          allowClaudeAiSubscription: true,
          vpcCidr: '10.42.0.0/16',
        },
      }),
      'ClaudeAiPlatform',
      { env },
    ),
  );
}, 60_000);

describe('regional synthesis', () => {
  it('uses the stack region in CDK-Nag acknowledgement IDs', () => {
    const region = 'eu-west-1';
    const app = new cdk.App({
      context: {
        '@aws-cdk/aws-ec2:restrictDefaultSecurityGroup':
          true,
      },
    });
    const stack = new PlatformStack(app, 'RegionalPlatform', {
      env: {
        account: '111122223333',
        region,
      },
    });
    const acknowledgementIds: string[] = [];
    const collectAcknowledgements = (value: unknown): void => {
      if (Array.isArray(value)) {
        value.forEach(collectAcknowledgements);
        return;
      }
      if (!value || typeof value !== 'object') return;

      const record = value as Record<string, unknown>;
      const cdkNag = record.cdk_nag as
        | { rules_to_suppress?: unknown[] }
        | undefined;
      for (const rule of cdkNag?.rules_to_suppress ?? []) {
        if (!rule || typeof rule !== 'object') continue;
        const suppression = rule as {
          id?: unknown;
          applies_to?: unknown;
        };
        if (typeof suppression.id === 'string')
          acknowledgementIds.push(suppression.id);
        if (Array.isArray(suppression.applies_to)) {
          acknowledgementIds.push(
            ...suppression.applies_to.filter(
              (finding): finding is string =>
                typeof finding === 'string',
            ),
          );
        }
      }
      Object.values(record).forEach(collectAcknowledgements);
    };
    collectAcknowledgements(
      Template.fromStack(stack).toJSON(),
    );

    expect(
      acknowledgementIds.filter((id) =>
        id.includes(`:${region}:`),
      ),
    ).toHaveLength(5);
    expect(
      acknowledgementIds.some((id) =>
        id.includes(':us-east-1:'),
      ),
    ).toBe(false);
  }, 60_000);
});

describe('simplified architecture', () => {
  it.each([
    'AWS::ECS::Cluster',
    'AWS::ECS::Service',
    'AWS::ECS::TaskDefinition',
    'AWS::ElasticLoadBalancingV2::LoadBalancer',
    'AWS::ElasticLoadBalancingV2::Listener',
    'AWS::ElasticLoadBalancingV2::TargetGroup',
    'AWS::ECR::Repository',
    'AWS::CodeBuild::Project',
    'AWS::SQS::Queue',
    'AWS::Lambda::EventSourceMapping',
    'AWS::Route53::HostedZone',
    'AWS::Route53::RecordSet',
    'AWS::CertificateManager::Certificate',
    'AWS::EC2::ClientVpnAuthorizationRule',
    'AWS::EC2::ClientVpnEndpoint',
    'AWS::EC2::ClientVpnRoute',
    'AWS::EC2::ClientVpnTargetNetworkAssociation',
    'AWS::SecretsManager::Secret',
  ])('contains no %s resources', (resourceType) => {
    gatewayTemplate.resourceCountIs(resourceType, 0);
  });

  it('has no relay configuration or legacy queue outputs', () => {
    const serialized = JSON.stringify(
      gatewayTemplate.toJSON(),
    ).toLowerCase();
    expect(serialized).not.toContain('relay');
    expect(serialized).not.toContain('lifecyclequeue');
    expect(serialized).not.toContain('secretarn');
  });
});

describe('network boundaries', () => {
  it('routes private MicroVM subnets through one managed NAT gateway', () => {
    gatewayTemplate.resourceCountIs('AWS::EC2::Subnet', 4);
    const subnets = Object.values(
      gatewayTemplate.findResources('AWS::EC2::Subnet'),
    ) as CloudFormationResource[];
    expect(
      subnets.filter(
        (subnet) =>
          subnet.Properties?.MapPublicIpOnLaunch === false,
      ),
    ).toHaveLength(2);
    expect(
      subnets.filter(
        (subnet) =>
          subnet.Properties?.MapPublicIpOnLaunch === true,
      ),
    ).toHaveLength(2);
    gatewayTemplate.resourceCountIs(
      'AWS::EC2::InternetGateway',
      1,
    );
    gatewayTemplate.resourceCountIs(
      'AWS::EC2::VPCGatewayAttachment',
      1,
    );
    gatewayTemplate.resourceCountIs('AWS::EC2::NatGateway', 1);
    gatewayTemplate.hasResourceProperties(
      'AWS::EC2::Route',
      Match.objectLike({
        DestinationCidrBlock: '0.0.0.0/0',
        NatGatewayId: Match.anyValue(),
      }),
    );
    gatewayTemplate.resourceCountIs('AWS::EC2::Instance', 0);
    gatewayTemplate.resourceCountIs('AWS::EC2::LaunchTemplate', 0);
  });

  it('has no world-open security group ingress', () => {
    const resources = Object.values(
      gatewayTemplate.toJSON().Resources,
    ) as CloudFormationResource[];
    const ingressCidrs = resources.flatMap((resource) => {
      if (
        resource.Type ===
        'AWS::EC2::SecurityGroupIngress'
      ) {
        return [resource.Properties?.CidrIp];
      }
      if (resource.Type === 'AWS::EC2::SecurityGroup') {
        return (
          resource.Properties?.SecurityGroupIngress ?? []
        ).map((rule) => rule.CidrIp);
      }
      return [];
    });
    expect(ingressCidrs).not.toContain('0.0.0.0/0');
  });

  it('allows only outbound HTTPS to the internet and has no proxy appliance', () => {
    const resources = Object.entries(
      gatewayTemplate.toJSON().Resources,
    ) as [string, CloudFormationResource][];
    const worldEgress = resources.flatMap(([logicalId, resource]) => {
      if (
        resource.Type === 'AWS::EC2::SecurityGroupEgress'
      ) {
        return resource.Properties?.CidrIp === '0.0.0.0/0'
          ? [{ logicalId, rule: resource.Properties }]
          : [];
      }
      if (resource.Type === 'AWS::EC2::SecurityGroup') {
        return (
          resource.Properties?.SecurityGroupEgress ?? []
        )
          .filter((rule) => rule.CidrIp === '0.0.0.0/0')
          .map((rule) => ({ logicalId, rule }));
      }
      return [];
    });
    expect(worldEgress).toHaveLength(1);
    expect(worldEgress[0]?.logicalId).toContain(
      'MicrovmConnectorSecurityGroup',
    );
    expect(worldEgress[0]?.rule).toMatchObject({
      CidrIp: '0.0.0.0/0',
      FromPort: 443,
      IpProtocol: 'tcp',
      ToPort: 443,
    });
    const serialized = JSON.stringify(gatewayTemplate.toJSON());
    expect(serialized).not.toContain('EgressProxy');
    expect(serialized).not.toContain('EGRESS_PROXY_URL');
    expect(serialized).not.toContain('Squid');
  });

  it('scopes the S3 gateway endpoint to sample buckets', () => {
    gatewayTemplate.hasResourceProperties(
      'AWS::EC2::VPCEndpoint',
      Match.objectLike({
        VpcEndpointType: 'Gateway',
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: ['s3:GetObject', 's3:PutObject'],
              Effect: 'Allow',
            }),
          ]),
        }),
      }),
    );
    const s3Endpoint = Object.values(
      gatewayTemplate.findResources('AWS::EC2::VPCEndpoint'),
    ).find(
      (resource) =>
        resource.Properties?.VpcEndpointType === 'Gateway',
    );
    const endpointRouteTables = JSON.stringify(
      s3Endpoint?.Properties?.RouteTableIds,
    );
    expect(endpointRouteTables).toContain('isolated');
    expect(endpointRouteTables).not.toContain('publicegress');
  });

  it('allows a routed private client CIDR to reach the control API', () => {
    gatewayTemplate.hasParameter(
      'TrustedClientCidr',
      Match.objectLike({
        Default: '10.100.0.0/22',
        Type: 'String',
      }),
    );
    expect(
      JSON.stringify(gatewayTemplate.toJSON()),
    ).toContain('"Ref":"TrustedClientCidr"');
  });

  it('keeps only the endpoints required by each runtime mode', () => {
    gatewayTemplate.resourceCountIs(
      'AWS::EC2::VPCEndpoint',
      3,
    );
    gatewayTemplate.hasResourceProperties(
      'AWS::EC2::VPCEndpoint',
      {
        VpcEndpointType: 'Gateway',
      },
    );
    expect(
      JSON.stringify(gatewayTemplate.toJSON()),
    ).toContain('.s3');
    gatewayTemplate.hasResourceProperties(
      'AWS::EC2::VPCEndpoint',
      {
        ServiceName:
          'com.amazonaws.us-east-1.execute-api',
        VpcEndpointType: 'Interface',
      },
    );
    gatewayTemplate.hasResourceProperties(
      'AWS::EC2::VPCEndpoint',
      {
        ServiceName: 'com.amazonaws.us-east-1.logs',
        VpcEndpointType: 'Interface',
      },
    );

    bedrockTemplate.hasResourceProperties(
      'AWS::EC2::VPCEndpoint',
      {
        ServiceName:
          'com.amazonaws.us-east-1.bedrock-runtime',
        VpcEndpointType: 'Interface',
      },
    );
    bedrockTemplate.hasResourceProperties(
      'AWS::EC2::VPCEndpoint',
      {
        ServiceName:
          'com.amazonaws.us-east-1.bedrock-mantle',
        VpcEndpointType: 'Interface',
      },
    );
    expect(
      JSON.stringify(bedrockProfileTemplate.toJSON()),
    ).not.toContain('bedrock-mantle');
    agentCoreTemplate.hasResourceProperties(
      'AWS::EC2::VPCEndpoint',
      {
        ServiceName:
          'com.amazonaws.us-east-1.bedrock-agentcore.gateway',
        VpcEndpointType: 'Interface',
      },
    );
  });
});

describe('control and runtime permissions', () => {
  it('keeps the control API private and IAM-authorized', () => {
    gatewayTemplate.hasResourceProperties(
      'AWS::ApiGateway::RestApi',
      {
        EndpointConfiguration: Match.objectLike({
          Types: ['PRIVATE'],
        }),
      },
    );
    gatewayTemplate.allResourcesProperties(
      'AWS::ApiGateway::Method',
      Match.objectLike({ AuthorizationType: 'AWS_IAM' }),
    );
  });

  it('grants shell-token and native lifecycle actions to control', () => {
    const actions = iamActions(gatewayTemplate);
    expect(actions).toEqual(
      expect.arrayContaining([
        'lambda:CreateMicrovmShellAuthToken',
        'lambda:GetMicrovm',
        'lambda:RunMicrovm',
        'lambda:SuspendMicrovm',
        'lambda:ResumeMicrovm',
        'lambda:TerminateMicrovm',
      ]),
    );
    gatewayTemplate.hasResourceProperties(
      'AWS::Lambda::Function',
      Match.objectLike({
        Environment: {
          Variables: Match.objectLike({
            IDLE_AFTER_SECONDS: {
              Ref: 'IdleAfterSeconds',
            },
            SUSPENDED_RETENTION_SECONDS: {
              Ref: 'SuspendedRetentionSeconds',
            },
            ALLOW_CLAUDE_AI_SUBSCRIPTION: 'false',
            WORKSPACE_BUCKET_NAME: Match.anyValue(),
          }),
        },
      }),
    );
  });

  it('defaults to Bedrock and explicitly gates Claude.ai subscriptions', () => {
    claudeAiTemplate.hasResourceProperties(
      'AWS::Lambda::Function',
      Match.objectLike({
        Environment: {
          Variables: Match.objectLike({
            ALLOW_CLAUDE_AI_SUBSCRIPTION: 'true',
            INFERENCE_MODE: 'bedrock',
          }),
        },
      }),
    );
    bedrockTemplate.hasResourceProperties(
      'AWS::Lambda::Function',
      Match.objectLike({
        Environment: {
          Variables: Match.objectLike({
            BEDROCK_MODEL_ID: 'anthropic.claude-sonnet-5',
            INFERENCE_MODE: 'bedrock',
          }),
        },
      }),
    );
  });

  it('routes direct and inference-profile IDs to their required permissions', () => {
    const direct = JSON.stringify(bedrockTemplate.toJSON());
    expect(direct).toContain(
      ':bedrock:us-east-1::foundation-model/' +
        'anthropic.claude-sonnet-5',
    );
    expect(direct).toContain(
      ':bedrock-mantle:us-east-1:111122223333:' +
        'project/default',
    );
    expect(direct).toContain(
      'bedrock-mantle:CreateInference',
    );
    expect(direct).not.toContain(
      'inference-profile/anthropic.claude-sonnet-5',
    );

    const profile = JSON.stringify(
      bedrockProfileTemplate.toJSON(),
    );
    expect(profile).toContain(
      ':bedrock:us-east-1:111122223333:' +
        'inference-profile/eu.anthropic.claude-sonnet-5',
    );
    expect(profile).toContain(
      ':bedrock:*::foundation-model/' +
        'anthropic.claude-sonnet-5',
    );
    expect(profile).not.toContain(
      'bedrock-mantle:CreateInference',
    );
  });

  it.each([
    'anthropic.claude-sonnet-5',
    'us.anthropic.claude-sonnet-5',
    'eu.anthropic.claude-opus-5',
    'au.anthropic.claude-fable-5',
    'global.anthropic.claude-sonnet-5',
  ])('accepts supported Bedrock model ID %s', (modelId) => {
    expect(isApprovedBedrockModelId(modelId)).toBe(true);
  });

  it.each([
    'amazon.nova-pro',
    'apac.anthropic.claude-sonnet-5',
    'anthropic.not-claude-sonnet-5',
    'anthropic.claude-',
  ])('rejects unsupported Bedrock model ID %s', (modelId) => {
    expect(isApprovedBedrockModelId(modelId)).toBe(false);
  });

  it('keeps direct workspace S3 access out of the MicroVM role', () => {
    const policies = gatewayTemplate.findResources(
      'AWS::IAM::Policy',
    );
    const runtimeActions = Object.entries(policies)
      .filter(([logicalId]) =>
        logicalId.includes('MicrovmExecutionRole'),
      )
      .flatMap(([, policy]) =>
        policyActions(policy),
      );
    expect(
      runtimeActions.filter((action) =>
        action.startsWith('s3:'),
      ),
    ).toEqual([]);
    expect(
      runtimeActions.filter((action) =>
        action.startsWith('secretsmanager:'),
      ),
    ).toEqual([]);
  });

  it('uses documented session-tagging trust for MicroVM roles', () => {
    gatewayTemplate.hasResourceProperties(
      'AWS::IAM::Role',
      Match.objectLike({
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: ['sts:AssumeRole', 'sts:TagSession'],
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            }),
          ]),
        },
        Description:
          'Runtime role for Claude MicroVMs; deliberately has no workspace S3 access.',
      }),
    );
  });

  it('reconciles native state on an EventBridge schedule', () => {
    gatewayTemplate.hasResourceProperties(
      'AWS::Events::Rule',
      Match.objectLike({
        ScheduleExpression: 'rate(1 minute)',
        State: 'ENABLED',
        Targets: Match.arrayWith([
          Match.objectLike({
            Input:
              '{"source":"session-reconciler"}',
          }),
        ]),
      }),
    );
  });

  it('keeps only the two indexes used by the control service', () => {
    gatewayTemplate.hasResourceProperties(
      'AWS::DynamoDB::Table',
      {
        GlobalSecondaryIndexes: Match.arrayWith([
          Match.objectLike({
            IndexName: 'owner-updated-index',
          }),
          Match.objectLike({
            IndexName: 'state-updated-index',
          }),
        ]),
      },
    );
    const serialized = JSON.stringify(
      gatewayTemplate.toJSON(),
    );
    expect(serialized).not.toContain('state-activity-index');
    expect(serialized).not.toContain('state-expiry-index');
  });
});

describe('optional browser portal', () => {
  it('is absent unless enablePortal is set', () => {
    gatewayTemplate.resourceCountIs(
      'AWS::ApiGateway::Authorizer',
      0,
    );
    expect(
      JSON.stringify(gatewayTemplate.toJSON()),
    ).not.toContain('"portal"');
  });

  it('adds an uncached Cognito user pool authorizer', () => {
    portalTemplate.hasResourceProperties(
      'AWS::ApiGateway::Authorizer',
      Match.objectLike({
        Type: 'COGNITO_USER_POOLS',
        AuthorizerResultTtlInSeconds: 0,
        IdentitySource:
          'method.request.header.Authorization',
        ProviderARNs: Match.anyValue(),
      }),
    );
    portalTemplate.resourceCountIs(
      'AWS::Cognito::UserPool',
      1,
    );
  });

  it('creates a secretless browser PKCE client', () => {
    portalTemplate.hasResourceProperties(
      'AWS::Cognito::UserPool',
      Match.objectLike({
        AdminCreateUserConfig: Match.objectLike({
          AllowAdminCreateUserOnly: true,
        }),
        Policies: Match.objectLike({
          PasswordPolicy: Match.objectLike({
            MinimumLength: 12,
            RequireSymbols: true,
          }),
        }),
      }),
    );
    portalTemplate.hasResourceProperties(
      'AWS::Cognito::UserPoolClient',
      Match.objectLike({
        AllowedOAuthFlows: ['code'],
        AllowedOAuthFlowsUserPoolClient: true,
        AllowedOAuthScopes: Match.arrayWith([
          'openid',
          'email',
          'profile',
        ]),
        GenerateSecret: false,
        PreventUserExistenceErrors: 'ENABLED',
      }),
    );
    portalTemplate.resourceCountIs(
      'AWS::Cognito::UserPoolClient',
      1,
    );
    portalTemplate.resourceCountIs(
      'AWS::Cognito::UserPoolDomain',
      1,
    );
    portalTemplate.hasResourceProperties(
      'AWS::Lambda::Function',
      Match.objectLike({
        Environment: {
          Variables: Match.objectLike({
            PORTAL_CLIENT_ID: Match.anyValue(),
            PORTAL_USER_POOL_DOMAIN: Match.anyValue(),
          }),
        },
      }),
    );
  });

  it('serves portal routes with the expected authorization', () => {
    const resources = Object.values(
      portalTemplate.findResources(
        'AWS::ApiGateway::Resource',
      ),
    ) as { Properties?: { PathPart?: string } }[];
    const pathParts = resources.map(
      (resource) => resource.Properties?.PathPart,
    );
    for (const part of [
      'portal',
      'app.js',
      'terminal-vendor.js',
      'xterm.css',
      'config.json',
      'sessions',
      '{sessionId}',
      'connect',
      'suspend',
      'resume',
      'tunnel-login',
    ]) {
      expect(pathParts).toContain(part);
    }
    const methods = Object.values(
      portalTemplate.findResources('AWS::ApiGateway::Method'),
    ) as {
      Properties?: { AuthorizationType?: string };
    }[];
    const byAuthorization = methods.reduce<
      Record<string, number>
    >((counts, method) => {
      const type =
        method.Properties?.AuthorizationType ?? 'UNKNOWN';
      counts[type] = (counts[type] ?? 0) + 1;
      return counts;
    }, {});
    // Static portal assets are open; session routes require Cognito
    // user pool tokens.
    expect(byAuthorization['NONE']).toBe(5);
    expect(byAuthorization['COGNITO_USER_POOLS']).toBe(10);
  });

  it('adds an encrypted expiring job table and a bounded worker', () => {
    portalTemplate.hasResourceProperties(
      'AWS::DynamoDB::Table',
      Match.objectLike({
        BillingMode: 'PAY_PER_REQUEST',
        KeySchema: [
          {
            AttributeName: 'sessionId',
            KeyType: 'HASH',
          },
        ],
        SSESpecification: Match.objectLike({
          SSEEnabled: true,
          SSEType: 'KMS',
        }),
        TimeToLiveSpecification: {
          AttributeName: 'expiresAt',
          Enabled: true,
        },
      }),
    );
    portalTemplate.hasResourceProperties(
      'AWS::Lambda::Function',
      Match.objectLike({
        Timeout: 900,
        MemorySize: 256,
        Environment: {
          Variables: Match.objectLike({
            SESSION_TABLE_NAME: Match.anyValue(),
            TUNNEL_AUTH_TABLE_NAME: Match.anyValue(),
          }),
        },
      }),
    );
  });

  it('grants the worker shell access and control async invocation', () => {
    expect(iamActions(portalTemplate)).toEqual(
      expect.arrayContaining([
        'lambda:CreateMicrovmShellAuthToken',
        'lambda:GetMicrovm',
        'lambda:InvokeFunction',
      ]),
    );
    portalTemplate.hasResourceProperties(
      'AWS::Lambda::Function',
      Match.objectLike({
        Environment: {
          Variables: Match.objectLike({
            TUNNEL_AUTH_TABLE_NAME: Match.anyValue(),
            TUNNEL_AUTH_WORKER_ARN: Match.anyValue(),
          }),
        },
      }),
    );
  });

  it('keeps the IAM session routes unchanged', () => {
    const countIamMethods = (template: Template): number =>
      Object.values(
        template.findResources('AWS::ApiGateway::Method'),
      ).filter(
        (method) =>
          (method as CloudFormationResource & {
            Properties?: { AuthorizationType?: string };
          }).Properties?.AuthorizationType === 'AWS_IAM',
      ).length;
    expect(countIamMethods(portalTemplate)).toBe(
      countIamMethods(gatewayTemplate),
    );
    // checkpoint-urls stays IAM-only: exactly one resource, under
    // the IAM /sessions tree.
    const checkpointResources = Object.values(
      portalTemplate.findResources(
        'AWS::ApiGateway::Resource',
      ),
    ).filter(
      (resource) =>
        (resource as { Properties?: { PathPart?: string } })
          .Properties?.PathPart === 'checkpoint-urls',
    );
    expect(checkpointResources).toHaveLength(1);
  });
});

interface CloudFormationResource {
  Type?: string;
  Properties?: {
    CidrIp?: unknown;
    PolicyDocument?: {
      Statement?: {
        Action?: string | string[];
      }[];
    };
    SecurityGroupIngress?: {
      CidrIp?: unknown;
      Description?: string;
    }[];
    SecurityGroupEgress?: {
      CidrIp?: unknown;
      Description?: string;
      FromPort?: number;
      IpProtocol?: string;
      ToPort?: number;
    }[];
    MapPublicIpOnLaunch?: boolean;
    FromPort?: number;
    IpProtocol?: string;
    ToPort?: number;
  };
}

function iamActions(template: Template): string[] {
  return Object.values(
    template.findResources('AWS::IAM::Policy'),
  ).flatMap((policy) => policyActions(policy));
}

function policyActions(
  policy: CloudFormationResource,
): string[] {
  return (
    policy.Properties?.PolicyDocument?.Statement ?? []
  ).flatMap((statement) => {
    if (Array.isArray(statement.Action)) {
      return statement.Action;
    }
    return statement.Action ? [statement.Action] : [];
  });
}
