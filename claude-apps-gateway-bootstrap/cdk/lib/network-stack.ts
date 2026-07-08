import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import { DeployConfig } from './config';
import { ackNag } from './nag';

interface NetworkStackProps extends StackProps {
  readonly config: DeployConfig;
}

/**
 * Isolated VPC with no public ingress. Public subnets exist only for the NAT
 * gateway and the Client VPN association; all workloads live in private subnets.
 * Interface/gateway VPC endpoints keep Bedrock, ECR, Secrets, Logs, and S3
 * traffic on the AWS backbone so NAT egress stays minimal.
 */
export class NetworkStack extends Stack {
  readonly vpc: ec2.Vpc;
  /** SG for the internal ALB: ingress only from the VPN client pool. */
  readonly albSg: ec2.SecurityGroup;
  /** SG for Fargate tasks: ingress only from the ALB SG. */
  readonly serviceSg: ec2.SecurityGroup;
  /** SG for RDS: ingress 5432 only from the service SG. */
  readonly dbSg: ec2.SecurityGroup;
  /** SG for the private EC2 image builder (SSM-managed, egress only). */
  readonly builderSg: ec2.SecurityGroup;
  /** AgentCore Gateway data-plane endpoint (private path for in-region MCP gateways). */
  agentcoreGatewayEndpoint!: ec2.InterfaceVpcEndpoint;

  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id, props);
    const { config } = props;

    this.vpc = new ec2.Vpc(this, 'Vpc', {
      ipAddresses: ec2.IpAddresses.cidr(config.vpcCidr),
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        { name: 'public', subnetType: ec2.SubnetType.PUBLIC, cidrMask: 24 },
        { name: 'private', subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, cidrMask: 22 },
        { name: 'isolated', subnetType: ec2.SubnetType.PRIVATE_ISOLATED, cidrMask: 24 },
      ],
    });

    // VPC Flow Logs -> CloudWatch (AwsSolutions-VPC7): network-level audit trail for the
    // no-public-ingress posture; REJECT-only keeps volume/cost down while still surfacing
    // blocked traffic (the interesting events in a private VPC).
    this.vpc.addFlowLog('FlowLog', {
      destination: ec2.FlowLogDestination.toCloudWatchLogs(
        new logs.LogGroup(this, 'VpcFlowLogs', {
          logGroupName: '/claude/vpc/flow-logs',
          retention: logs.RetentionDays.THREE_MONTHS,
        }),
      ),
      trafficType: ec2.FlowLogTrafficType.REJECT,
    });

    // Gateway endpoint for S3 (free). Interface endpoints for the rest.
    this.vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });
    const interfaceEndpoints: Record<string, ec2.InterfaceVpcEndpointAwsService> = {
      BedrockRuntime: ec2.InterfaceVpcEndpointAwsService.BEDROCK_RUNTIME,
      SecretsManager: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
      EcrApi: ec2.InterfaceVpcEndpointAwsService.ECR,
      EcrDkr: ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER,
      Logs: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
      Monitoring: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_MONITORING,
      Ssm: ec2.InterfaceVpcEndpointAwsService.SSM,
      SsmMessages: ec2.InterfaceVpcEndpointAwsService.SSM_MESSAGES,
      Ec2Messages: ec2.InterfaceVpcEndpointAwsService.EC2_MESSAGES,
    };
    for (const [name, service] of Object.entries(interfaceEndpoints)) {
      this.vpc.addInterfaceEndpoint(name, { service, privateDnsEnabled: true });
    }

    // AgentCore GATEWAY data plane (the *.gateway.bedrock-agentcore.<region> MCP URLs).
    // Private DNS makes those hostnames resolve to endpoint ENIs for everything using the
    // VPC resolver — including Client VPN sessions — so managed MCP traffic to in-region
    // AgentCore gateways never leaves the VPC. Pair with an aws:SourceVpce resource policy
    // on each gateway to CLOSE the public path (not just open the private one).
    this.agentcoreGatewayEndpoint = this.vpc.addInterfaceEndpoint('AgentCoreGateway', {
      service: new ec2.InterfaceVpcEndpointService(
        `com.amazonaws.${config.region}.bedrock-agentcore.gateway`,
        443,
      ),
      privateDnsEnabled: true,
    });

    // Private DNS lives in its own DnsStack (deployed last), so zone/record changes never
    // deadlock on a cross-stack "export in use" the way an entangled zone here did.

    // --- Security groups: least-privilege chain, no internet ingress anywhere ---
    this.albSg = new ec2.SecurityGroup(this, 'AlbSg', {
      vpc: this.vpc,
      description: 'Internal ALB - ingress only from Client VPN pool',
      allowAllOutbound: true,
    });
    this.albSg.addIngressRule(
      ec2.Peer.ipv4(config.vpnClientCidr),
      ec2.Port.tcp(443),
      'HTTPS from VPN clients',
    );

    this.serviceSg = new ec2.SecurityGroup(this, 'ServiceSg', {
      vpc: this.vpc,
      description: 'Fargate services - ingress only from ALB',
      allowAllOutbound: true,
    });
    // GatewayStack's allowTo(db) adds an egress rule that is a no-op under
    // allowAllOutbound:true; the annotation warning is expected and harmless.
    ackNag(this.serviceSg, {
      id: 'Construct-Annotations::@aws-cdk/aws-ec2:ipv4IgnoreEgressRule',
      reason:
        'ServiceSg intentionally allows all outbound (Bedrock/ECR/S3 via VPC endpoints, '
        + 'Entra JWKS over NAT); the explicit gateway->postgres egress rule is redundant '
        + 'documentation, not a control.',
    });
    this.serviceSg.addIngressRule(this.albSg, ec2.Port.tcp(8080), 'gateway from ALB');
    this.serviceSg.addIngressRule(this.albSg, ec2.Port.tcp(8081), 'bootstrap from ALB');
    this.serviceSg.addIngressRule(this.albSg, ec2.Port.tcp(4318), 'OTLP ingest from ALB');
    this.serviceSg.addIngressRule(this.albSg, ec2.Port.tcp(13133), 'ADOT health check from ALB');

    this.dbSg = new ec2.SecurityGroup(this, 'DbSg', {
      vpc: this.vpc,
      description: 'RDS Postgres - ingress 5432 only from services + builder',
      allowAllOutbound: false,
    });
    this.dbSg.addIngressRule(this.serviceSg, ec2.Port.tcp(5432), 'postgres from services');

    this.builderSg = new ec2.SecurityGroup(this, 'BuilderSg', {
      vpc: this.vpc,
      description: 'EC2 image builder - egress only, SSM-managed',
      allowAllOutbound: true,
    });

    // cdk-nag EC23 cannot evaluate the endpoint SGs' ingress peer because it is the
    // CDK-generated intrinsic {Fn::GetAtt: [Vpc, CidrBlock]} — i.e. 443 from the VPC
    // CIDR only, the standard least-privilege rule for interface VPC endpoints. The
    // rule errors on the unresolvable token rather than finding a violation.
    ackNag(this.vpc,{
      id: 'AwsSolutions-EC23',
      reason:
        'Interface-endpoint SGs allow 443 only from the VPC CIDR (CDK default, expressed '
        + 'as an unresolvable Fn::GetAtt token that the rule cannot evaluate). No SG in '
        + 'this VPC has 0.0.0.0/0 or ::/0 ingress.',
    });
  }
}
