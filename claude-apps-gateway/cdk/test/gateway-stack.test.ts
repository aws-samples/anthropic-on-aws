import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { GatewayStack, GatewayStackProps } from '../lib/claude-gateway-stack';

/**
 * Synth-level regression tests for the Fargate stack. These assert on the
 * CloudFormation template CDK produces — no AWS account or credentials needed,
 * matching the repo's "verification is local/static" stance (see CLAUDE.md).
 *
 * The focus is the non-obvious wiring that breaks the gateway if it regresses:
 * the dual-ARN Bedrock policy, the IPv4-only internal ALB, the raised idle
 * timeout, the /healthz target-group check, the HTTPS :4318 telemetry listener,
 * and the createVpcEndpoints opt-out added for VPC reuse.
 */

const ACCOUNT = '111122223333';
const REGION = 'us-east-1';

// Pass-2 inputs. zoneId is supplied so the stack uses fromHostedZoneAttributes
// instead of fromLookup, which would otherwise require live account credentials.
const PASS2: GatewayStackProps = {
  env: { account: ACCOUNT, region: REGION },
  imageReady: true,
  imageTag: '2.1.197',
  publicUrl: 'https://claude-gateway.example.com',
  certArn: `arn:aws:acm:${REGION}:${ACCOUNT}:certificate/abc-123`,
  zoneName: 'example.com',
  zoneId: 'Z123456ABCDEFG',
  ingressCidr: '10.100.0.0/16',
};

function synth(props: GatewayStackProps): Template {
  const app = new cdk.App();
  const stack = new GatewayStack(app, 'TestStack', props);
  return Template.fromStack(stack);
}

describe('pass 1 (imageReady: false) — ECR repo only', () => {
  const template = synth({ env: PASS2.env, imageReady: false, imageTag: '2.1.197' });

  test('creates the ECR repository', () => {
    template.resourceCountIs('AWS::ECR::Repository', 1);
  });

  test('does not create the Fargate service, ALB, or RDS', () => {
    template.resourceCountIs('AWS::ECS::Service', 0);
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 0);
    template.resourceCountIs('AWS::RDS::DBInstance', 0);
  });
});

describe('pass 2 (imageReady: true) — full stack', () => {
  const template = synth(PASS2);

  test('creates all seven VPC endpoints by default (6 interface + 1 gateway)', () => {
    template.resourceCountIs('AWS::EC2::VPCEndpoint', 7);
  });

  test('Bedrock task role grants BOTH inference-profile and foundation-model ARNs', () => {
    // Missing either ARN family yields 403 on invoke — this is the trap CLAUDE.md
    // calls out, so pin both into the policy. Asserted as two single-element
    // arrayWith matches: mixing a literal and a stringLikeRegexp inside ONE
    // arrayWith doesn't match reliably, so check each ARN family separately.
    const invokeStatement = (resource: unknown) =>
      Match.objectLike({
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: [
                'bedrock:InvokeModel',
                'bedrock:InvokeModelWithResponseStream',
              ],
              Resource: Match.arrayWith([resource]),
            }),
          ]),
        },
      });

    // foundation-model ARN is region/account-agnostic (::), so it's a literal.
    template.hasResourceProperties(
      'AWS::IAM::Policy',
      invokeStatement('arn:aws:bedrock:*::foundation-model/anthropic.*'),
    );
    // inference-profile ARN embeds the resolved region/account, so match its suffix.
    template.hasResourceProperties(
      'AWS::IAM::Policy',
      invokeStatement(Match.stringLikeRegexp('inference-profile/us\\.anthropic\\.\\*')),
    );
  });

  test('ALB is internal and IPv4-only (dual-stack returns public AAAA that /login rejects)', () => {
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
      Scheme: 'internal',
      IpAddressType: 'ipv4',
    });
  });

  test('ALB idle timeout is raised to 3600s for long streaming responses', () => {
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
      LoadBalancerAttributes: Match.arrayWith([
        { Key: 'idle_timeout.timeout_seconds', Value: '3600' },
      ]),
    });
  });

  test('there is an HTTPS :4318 telemetry listener (TLS terminates at the ALB)', () => {
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
      Port: 4318,
      Protocol: 'HTTPS',
    });
  });

  test('gateway target group health check points at /healthz, not /readyz', () => {
    // /healthz (liveness) keeps replicas in rotation through a Postgres blip;
    // /readyz would drain every replica at once. Guard the probe target.
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
      HealthCheckPath: '/healthz',
    });
  });

  test('RDS is not publicly accessible', () => {
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      PubliclyAccessible: false,
    });
  });

  test('the OIDC client secret is a placeholder, not a real value baked into the template', () => {
    // Guards against the "read process.env at synth" anti-pattern — a real secret
    // must never land in the synthesized CloudFormation.
    template.hasResourceProperties('AWS::SecretsManager::Secret', {
      Name: 'claude-gateway-oidc-client-secret',
      SecretString: 'REPLACE_ME',
    });
  });
});

describe('TLS mode selection (imported vs managed public cert)', () => {
  test('certArn present → imported mode: no in-stack cert, fingerprint hint output', () => {
    const template = synth(PASS2);
    template.resourceCountIs('AWS::CertificateManager::Certificate', 0);
    template.hasOutput('CertFingerprintHint', {});
  });

  const MANAGED: GatewayStackProps = {
    ...PASS2,
    certArn: undefined,
    publicZoneId: 'Z0PUBLICEXAMPLE',
    publicZoneName: 'example.com',
  };

  test('certArn absent → managed mode: DNS-validated public cert for the gateway host', () => {
    const template = synth(MANAGED);
    template.hasResourceProperties('AWS::CertificateManager::Certificate', {
      DomainName: 'claude-gateway.example.com',
      DomainValidationOptions: [
        { DomainName: 'claude-gateway.example.com', HostedZoneId: 'Z0PUBLICEXAMPLE' },
      ],
      ValidationMethod: 'DNS',
    });
    // Managed certs are browser-trusted, so no fingerprint to publish.
    template.hasOutput('CertMode', {});
    expect(() => template.hasOutput('CertFingerprintHint', {})).toThrow();
  });

  test('managed mode fails fast without an explicit public zone', () => {
    expect(() => synth({ ...MANAGED, publicZoneId: undefined })).toThrow(/publicZoneId/);
  });
});

describe('CloudWatch dashboard + alarms (opt-in)', () => {
  test('off by default — existing deploys are unchanged', () => {
    const template = synth(PASS2);
    template.resourceCountIs('AWS::CloudWatch::Dashboard', 0);
    template.resourceCountIs('AWS::CloudWatch::Alarm', 0);
    template.resourceCountIs('AWS::SNS::Topic', 0);
  });

  test('enableDashboard: dashboard + ALB-5xx alarm; cost alarm only with a threshold', () => {
    const withoutThreshold = synth({ ...PASS2, enableDashboard: true });
    withoutThreshold.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
    withoutThreshold.resourceCountIs('AWS::CloudWatch::Alarm', 1);
    withoutThreshold.hasResourceProperties('AWS::CloudWatch::Alarm', {
      AlarmName: 'claude-gateway-alb-5xx',
    });

    const withThreshold = synth({ ...PASS2, enableDashboard: true, dailyCostThresholdUsd: 50 });
    withThreshold.resourceCountIs('AWS::CloudWatch::Alarm', 2);
    withThreshold.hasResourceProperties('AWS::CloudWatch::Alarm', {
      AlarmName: 'claude-gateway-daily-cost',
      Threshold: 50,
    });
  });

  test('alarmEmail wires an SNS topic + email subscription to the alarms', () => {
    const template = synth({ ...PASS2, enableDashboard: true, alarmEmail: 'ops@example.com' });
    template.resourceCountIs('AWS::SNS::Topic', 1);
    template.hasResourceProperties('AWS::SNS::Subscription', {
      Protocol: 'email',
      Endpoint: 'ops@example.com',
    });
  });
});

describe('createVpcEndpoints opt-out (VPC reuse)', () => {
  test('createVpcEndpoints: false synthesizes zero VPC endpoints', () => {
    const template = synth({ ...PASS2, vpcId: 'vpc-0123456789abcdef0', createVpcEndpoints: false });
    template.resourceCountIs('AWS::EC2::VPCEndpoint', 0);
  });

  test('omitting the flag defaults to creating the endpoints', () => {
    const template = synth(PASS2);
    template.resourceCountIs('AWS::EC2::VPCEndpoint', 7);
  });
});
