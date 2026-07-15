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
 * timeout, the /healthz target-group check, and the createVpcEndpoints opt-out
 * added for VPC reuse.
 */

const ACCOUNT = '111122223333';
const REGION = 'us-east-1';

// Pass-2 inputs. zoneId is supplied so the stack uses fromHostedZoneAttributes
// instead of fromLookup, which would otherwise require live account credentials.
const PASS2: GatewayStackProps = {
  env: { account: ACCOUNT, region: REGION },
  imageReady: true,
  imageTag: '2.1.199',
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
  const template = synth({ env: PASS2.env, imageReady: false, imageTag: '2.1.199' });

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
    // inference-profile ARN uses the GLOBAL cross-region prefix (global.anthropic.*),
    // matching gateway.yaml's models: block — the us./eu./apac. prefixes would 403.
    template.hasResourceProperties(
      'AWS::IAM::Policy',
      invokeStatement(Match.stringLikeRegexp('inference-profile/global\\.anthropic\\.\\*')),
    );
  });

  test('inference-profile ARN is scoped to bedrockRegion, and any region works (global profiles)', () => {
    // Global profiles resolve from any Bedrock region, so a non-US bedrockRegion is
    // fully supported. The ARN embeds the source (bedrock) region; the global. prefix
    // is unchanged. Deploy in us-east-1 (PASS2) but call Bedrock in ap-southeast-2.
    const t = synth({ ...PASS2, bedrockRegion: 'ap-southeast-2' });
    t.hasResourceProperties(
      'AWS::IAM::Policy',
      Match.objectLike({
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Resource: Match.arrayWith([
                Match.stringLikeRegexp(
                  'arn:aws:bedrock:ap-southeast-2:.*inference-profile/global\\.anthropic\\.\\*',
                ),
              ]),
            }),
          ]),
        },
      }),
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

  test('telemetry forwards via ADOT collector sidecar — no separate service or :4318 ALB listener', () => {
    // The ADOT collector runs as a sidecar in the same task, receiving OTLP
    // on localhost:4318 and forwarding to CW via SigV4 (task role). No separate
    // collector service, no extra ALB listener needed.
    template.resourceCountIs('AWS::ECS::Service', 1);
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
      Port: 443,
    });
    const listeners = template.findResources('AWS::ElasticLoadBalancingV2::Listener', {
      Properties: { Port: 4318 },
    });
    expect(Object.keys(listeners)).toHaveLength(0);
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

  test('the OIDC client secret uses a generated placeholder — no static value, so deploys never clobber the seeded secret', () => {
    // Two guarantees at once:
    //  1. No real secret is baked into the template (the "read process.env at
    //     synth" anti-pattern) — there must be NO static SecretString.
    //  2. The value comes from GenerateSecretString, which CloudFormation sets
    //     only at create time. A fixed SecretString would reset the real,
    //     out-of-band-seeded secret to the placeholder on every deploy.
    template.hasResourceProperties('AWS::SecretsManager::Secret', {
      Name: 'claude-gateway-oidc-client-secret',
      GenerateSecretString: Match.objectLike({ PasswordLength: 32 }),
      SecretString: Match.absent(),
    });
  });
});

describe('TLS: imported ACM cert', () => {
  test('the cert is imported (no in-stack cert resource) and the fingerprint hint is output', () => {
    // fromCertificateArn imports an existing cert, so the stack synthesizes NO
    // AWS::CertificateManager::Certificate. The CLI pins the leaf by SHA-256 on
    // first /login, so the stack emits the command to read that fingerprint.
    const template = synth(PASS2);
    template.resourceCountIs('AWS::CertificateManager::Certificate', 0);
    template.hasOutput('CertFingerprintHint', {});
  });

  test('pass 2 fails fast without certArn', () => {
    expect(() => synth({ ...PASS2, certArn: undefined })).toThrow(/certArn/);
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

describe('gatewayName parameterization (must match setup.sh PROJECT / deploy.sh GATEWAY_NAME)', () => {
  test('a custom gatewayName renames the repo, cluster, service, secret, and log group', () => {
    // Guards the bug where deploy.sh honored GATEWAY_NAME but the stack hardcoded
    // 'claude-gateway', so a renamed gateway pushed to a repo the IAM policy didn't cover.
    const t = synth({ ...PASS2, gatewayName: 'claude-gateway2' });
    t.hasResourceProperties('AWS::ECR::Repository', { RepositoryName: 'claude-gateway2' });
    t.hasResourceProperties('AWS::ECS::Cluster', { ClusterName: 'claude-gateway2' });
    t.hasResourceProperties('AWS::ECS::Service', { ServiceName: 'claude-gateway2' });
    t.hasResourceProperties('AWS::SecretsManager::Secret', { Name: 'claude-gateway2-oidc-client-secret' });
    t.hasResourceProperties('AWS::Logs::LogGroup', { LogGroupName: '/claude-gateway2/gateway' });
  });

  test('defaults to claude-gateway when gatewayName is omitted', () => {
    const t = synth(PASS2);
    t.hasResourceProperties('AWS::ECR::Repository', { RepositoryName: 'claude-gateway' });
  });
});
