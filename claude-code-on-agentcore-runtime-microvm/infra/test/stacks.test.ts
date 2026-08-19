import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  AgentCoreRuntimeStack,
  isApprovedBedrockModelId,
} from '../lib/platform-stack.js';

let template: Template;
let portalTemplate: Template;
let bedrockProfileTemplate: Template;

beforeAll(() => {
  const env = { account: '111122223333', region: 'us-east-1' };
  template = Template.fromStack(
    new AgentCoreRuntimeStack(
      new cdk.App({
        context: {
          '@aws-cdk/aws-ec2:restrictDefaultSecurityGroup': true,
          vpcCidr: '10.43.0.0/16',
        },
      }),
      'DefaultPlatform',
      { env },
    ),
  );
  portalTemplate = Template.fromStack(
    new AgentCoreRuntimeStack(
      new cdk.App({
        context: {
          '@aws-cdk/aws-ec2:restrictDefaultSecurityGroup': true,
          enablePortal: true,
          vpcCidr: '10.43.0.0/16',
        },
      }),
      'PortalPlatform',
      { env },
    ),
  );
  bedrockProfileTemplate = Template.fromStack(
    new AgentCoreRuntimeStack(
      new cdk.App({
        context: {
          '@aws-cdk/aws-ec2:restrictDefaultSecurityGroup': true,
          bedrockModelId: 'eu.anthropic.claude-sonnet-5',
          vpcCidr: '10.43.0.0/16',
        },
      }),
      'BedrockProfilePlatform',
      { env },
    ),
  );
}, 60_000);

describe('AgentCore Runtime resource', () => {
  it('creates exactly one BedrockAgentCore Runtime with a container artifact', () => {
    template.resourceCountIs('AWS::BedrockAgentCore::Runtime', 1);
    template.hasResourceProperties('AWS::BedrockAgentCore::Runtime', {
      AgentRuntimeArtifact: Match.objectLike({
        ContainerConfiguration: Match.objectLike({
          ContainerUri: Match.anyValue(),
        }),
      }),
      NetworkConfiguration: Match.objectLike({
        NetworkMode: 'VPC',
        NetworkModeConfig: Match.objectLike({
          SecurityGroups: Match.anyValue(),
          Subnets: Match.anyValue(),
        }),
      }),
      ProtocolConfiguration: 'HTTP',
      LifecycleConfiguration: Match.objectLike({
        MaxLifetime: 28_800,
      }),
    });
  });

  it('references the agent image repository by name without CDK owning it', () => {
    // The ECR repository is provisioned by scripts/provision-agent-image.ts
    // *before* cdk deploy (see infra/lib/platform-stack.ts for why: CfnRuntime
    // needs an existing image at stack-create time). CDK must not also try
    // to create the repository.
    template.resourceCountIs('AWS::ECR::Repository', 0);
    template.hasOutput('AgentImageRepositoryUri', {});
  });

  it('has no Lambda MicroVM service resources or network-connector infrastructure', () => {
    const serialized = JSON.stringify(template.toJSON()).toLowerCase();
    // AgentCore Runtime's compute type is itself called "microVM", so the
    // word legitimately appears in this stack's own resource descriptions.
    // What must NOT appear is anything from the Lambda MicroVM *service*
    // (client-lambda-microvms resource types / network connectors) that
    // claude-code-on-lambda-microvm depends on.
    expect(serialized).not.toContain('networkconnector');
    expect(serialized).not.toContain('lambda::microvmimage');
    expect(serialized).not.toContain('microvm-image');
  });

  it('has no ECS, ALB, or relay infrastructure', () => {
    for (const resourceType of [
      'AWS::ECS::Cluster',
      'AWS::ECS::Service',
      'AWS::ElasticLoadBalancingV2::LoadBalancer',
      'AWS::CertificateManager::Certificate',
      'AWS::SecretsManager::Secret',
    ]) {
      template.resourceCountIs(resourceType, 0);
    }
  });
});

describe('network boundaries', () => {
  it('routes private subnets through one managed NAT gateway', () => {
    template.resourceCountIs('AWS::EC2::NatGateway', 1);
    template.resourceCountIs('AWS::EC2::Instance', 0);
  });

  it('has no world-open security group ingress', () => {
    const resources = Object.values(
      template.toJSON().Resources,
    ) as CloudFormationResource[];
    const ingressCidrs = resources.flatMap((resource) => {
      if (resource.Type === 'AWS::EC2::SecurityGroupIngress') {
        return [resource.Properties?.CidrIp];
      }
      if (resource.Type === 'AWS::EC2::SecurityGroup') {
        return (resource.Properties?.SecurityGroupIngress ?? []).map(
          (rule) => rule.CidrIp,
        );
      }
      return [];
    });
    expect(ingressCidrs).not.toContain('0.0.0.0/0');
  });

  it('keeps the bedrock-agentcore data-plane VPC endpoint', () => {
    template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
      ServiceName: 'com.amazonaws.us-east-1.bedrock-agentcore',
      VpcEndpointType: 'Interface',
    });
    template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
      ServiceName: 'com.amazonaws.us-east-1.bedrock-runtime',
      VpcEndpointType: 'Interface',
    });
  });
});

describe('control and runtime permissions', () => {
  it('keeps the control API private and IAM-authorized', () => {
    template.hasResourceProperties('AWS::ApiGateway::RestApi', {
      EndpointConfiguration: Match.objectLike({ Types: ['PRIVATE'] }),
    });
    template.allResourcesProperties(
      'AWS::ApiGateway::Method',
      Match.objectLike({ AuthorizationType: 'AWS_IAM' }),
    );
  });

  it('grants the control function the AgentCore Runtime data-plane actions', () => {
    const actions = iamActions(template);
    expect(actions).toEqual(
      expect.arrayContaining([
        'bedrock-agentcore:InvokeAgentRuntime',
        'bedrock-agentcore:InvokeAgentRuntimeCommand',
        'bedrock-agentcore:InvokeAgentRuntimeCommandShell',
        'bedrock-agentcore:StopRuntimeSession',
        'bedrock-agentcore:ListSessions',
      ]),
    );
  });

  it('routes direct and inference-profile Bedrock model IDs to their required permissions', () => {
    const direct = JSON.stringify(template.toJSON());
    expect(direct).toContain(
      ':bedrock:us-east-1::foundation-model/anthropic.claude-sonnet-5',
    );
    const profile = JSON.stringify(bedrockProfileTemplate.toJSON());
    expect(profile).toContain(
      ':bedrock:us-east-1:111122223333:' +
        'inference-profile/eu.anthropic.claude-sonnet-5',
    );
  });

  it.each([
    'anthropic.claude-sonnet-5',
    'us.anthropic.claude-sonnet-5',
    'eu.anthropic.claude-opus-5',
    'global.anthropic.claude-sonnet-5',
  ])('accepts supported Bedrock model ID %s', (modelId) => {
    expect(isApprovedBedrockModelId(modelId)).toBe(true);
  });

  it.each([
    'amazon.nova-pro',
    'apac.anthropic.claude-sonnet-5',
    'anthropic.not-claude-sonnet-5',
  ])('rejects unsupported Bedrock model ID %s', (modelId) => {
    expect(isApprovedBedrockModelId(modelId)).toBe(false);
  });

  it('keeps direct workspace S3 access out of the runtime execution role', () => {
    const policies = template.findResources('AWS::IAM::Policy');
    const runtimeActions = Object.entries(policies)
      .filter(([logicalId]) => logicalId.includes('RuntimeExecutionRole'))
      .flatMap(([, policy]) => policyActions(policy));
    expect(runtimeActions.filter((action) => action.startsWith('s3:'))).toEqual(
      [],
    );
  });

  it('reconciles session state on an EventBridge schedule', () => {
    template.hasResourceProperties('AWS::Events::Rule', {
      ScheduleExpression: 'rate(1 minute)',
      State: 'ENABLED',
      Targets: Match.arrayWith([
        Match.objectLike({
          Input: '{"source":"session-reconciler"}',
        }),
      ]),
    });
  });
});

describe('optional browser portal', () => {
  it('is absent unless enablePortal is set', () => {
    template.resourceCountIs('AWS::ApiGateway::Authorizer', 0);
  });

  it('adds an uncached Cognito user pool authorizer when enabled', () => {
    portalTemplate.hasResourceProperties('AWS::ApiGateway::Authorizer', {
      Type: 'COGNITO_USER_POOLS',
      AuthorizerResultTtlInSeconds: 0,
    });
    portalTemplate.resourceCountIs('AWS::Cognito::UserPool', 1);
  });
});

interface CloudFormationResource {
  Type?: string;
  Properties?: {
    CidrIp?: unknown;
    SecurityGroupIngress?: { CidrIp?: unknown }[];
    PolicyDocument?: { Statement?: { Action?: string | string[] }[] };
  };
}

function iamActions(value: Template): string[] {
  return Object.values(value.findResources('AWS::IAM::Policy')).flatMap(
    (policy) => policyActions(policy),
  );
}

function policyActions(policy: CloudFormationResource): string[] {
  return (policy.Properties?.PolicyDocument?.Statement ?? []).flatMap(
    (statement) => {
      if (Array.isArray(statement.Action)) return statement.Action;
      return statement.Action ? [statement.Action] : [];
    },
  );
}
