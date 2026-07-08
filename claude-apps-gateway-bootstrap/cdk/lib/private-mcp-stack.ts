import { Stack, StackProps, CfnOutput, Fn } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { DeployConfig } from './config';

/**
 * Cross-region private path for us-east-1 AgentCore MCP gateways (ClaudeGw-PrivateMcpUsEast1):
 * a minimal "endpoint VPC" in us-east-1 — two isolated subnets, NO internet gateway, NO NAT —
 * whose only tenant is the bedrock-agentcore.gateway interface endpoint, peered back to the
 * home VPC over inter-region VPC peering (AWS backbone, encrypted, never the public internet).
 *
 * PrivateLink interface endpoints are reachable across VPC peering: the endpoint must live in
 * the service's region, but the CLIENT can be anywhere with a private route to the endpoint
 * ENIs. The companion stack (PrivateMcpDnsStack, home region) publishes a private hosted zone
 * for gateway.bedrock-agentcore.us-east-1.amazonaws.com so VPN clients resolve EVERY us-east-1
 * MCP gateway hostname — ours or a partner's (cross-account) — to the endpoint's private IPs.
 */
export class PrivateMcpUsEast1Stack extends Stack {
  /** Peering connection id — the home-region stack adds return routes + PHZ. */
  readonly peeringId: string;
  readonly endpointDnsName: string;

  constructor(
    scope: Construct,
    id: string,
    props: StackProps & { config: DeployConfig; homeVpcId: string; homeVpcCidr: string },
  ) {
    super(scope, id, props);
    const { config, homeVpcId, homeVpcCidr } = props;

    const vpc = new ec2.Vpc(this, 'EndpointVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.61.0.0/24'),
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        { name: 'endpoint', subnetType: ec2.SubnetType.PRIVATE_ISOLATED, cidrMask: 26 },
      ],
    });

    const endpointSg = new ec2.SecurityGroup(this, 'EndpointSg', {
      vpc,
      description: 'AgentCore gateway endpoint - 443 from the home VPC + VPN pool only',
      allowAllOutbound: false,
    });
    endpointSg.addIngressRule(ec2.Peer.ipv4(homeVpcCidr), ec2.Port.tcp(443), 'home VPC via peering');
    endpointSg.addIngressRule(
      ec2.Peer.ipv4(config.vpnClientCidr),
      ec2.Port.tcp(443),
      'VPN clients via peering',
    );

    const endpoint = new ec2.InterfaceVpcEndpoint(this, 'AgentCoreGatewayUsEast1', {
      vpc,
      service: new ec2.InterfaceVpcEndpointService(
        'com.amazonaws.us-east-1.bedrock-agentcore.gateway',
        443,
      ),
      // Private DNS OFF: it would only answer inside THIS VPC. Cross-VPC resolution is done
      // by the home-region PHZ (PrivateMcpDnsStack) pointing at the endpoint's DNS name.
      privateDnsEnabled: false,
      securityGroups: [endpointSg],
    });

    // Inter-region peering, requester side (auto-accepts within one account).
    const peering = new ec2.CfnVPCPeeringConnection(this, 'PeerToHome', {
      vpcId: vpc.vpcId,
      peerVpcId: homeVpcId,
      peerRegion: config.region,
    });
    this.peeringId = peering.ref;

    // Routes from the endpoint subnets back to the home VPC + VPN pool.
    vpc.isolatedSubnets.forEach((s, i) => {
      new ec2.CfnRoute(this, `RouteHome${i}`, {
        routeTableId: (s as ec2.Subnet).routeTable.routeTableId,
        destinationCidrBlock: homeVpcCidr,
        vpcPeeringConnectionId: peering.ref,
      });
      new ec2.CfnRoute(this, `RouteVpn${i}`, {
        routeTableId: (s as ec2.Subnet).routeTable.routeTableId,
        destinationCidrBlock: config.vpnClientCidr,
        vpcPeeringConnectionId: peering.ref,
      });
    });

    // First (regional) DNS entry, e.g. vpce-xxx-yyy.gateway.bedrock-agentcore.us-east-1.vpce.amazonaws.com
    this.endpointDnsName = Fn.select(1, Fn.split(':', Fn.select(0, endpoint.vpcEndpointDnsEntries)));

    new CfnOutput(this, 'PeeringId', { value: peering.ref });
    new CfnOutput(this, 'EndpointVpcId', { value: vpc.vpcId });
    new CfnOutput(this, 'EndpointDns', { value: this.endpointDnsName });
    new CfnOutput(this, 'EndpointVpceId', { value: endpoint.vpcEndpointId });
  }
}

/**
 * Home-region companion (ClaudeGw-PrivateMcpDns): return routes through the peering, and a
 * private hosted zone that makes EVERY *.gateway.bedrock-agentcore.us-east-1.amazonaws.com
 * hostname resolve — for the whole home VPC and its VPN clients — to the us-east-1 endpoint.
 * The vpce-… DNS name resolves (publicly) to the endpoint's PRIVATE IPs, so a wildcard CNAME
 * is sufficient and survives ENI IP changes.
 */
export class PrivateMcpDnsStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: StackProps & {
      config: DeployConfig;
      vpc: ec2.Vpc;
      peeringId: string;
      endpointDnsName: string;
    },
  ) {
    super(scope, id, props);
    const { vpc, peeringId, endpointDnsName } = props;

    // Return routes: home private subnets -> endpoint VPC via peering.
    [...vpc.privateSubnets, ...vpc.publicSubnets].forEach((s, i) => {
      new ec2.CfnRoute(this, `RouteToEndpointVpc${i}`, {
        routeTableId: (s as ec2.Subnet).routeTable.routeTableId,
        destinationCidrBlock: '10.61.0.0/24',
        vpcPeeringConnectionId: peeringId,
      });
    });

    // PHZ + wildcard CNAME. Route53 is global; associate to the home VPC so the VPC resolver
    // (10.60.0.2 — also pushed to VPN clients) answers for us-east-1 gateway hostnames.
    const r53 = require('aws-cdk-lib/aws-route53') as typeof import('aws-cdk-lib/aws-route53');
    const zone = new r53.PrivateHostedZone(this, 'AgentCoreUsEast1Zone', {
      zoneName: 'gateway.bedrock-agentcore.us-east-1.amazonaws.com',
      vpc,
    });
    new r53.CnameRecord(this, 'WildcardToEndpoint', {
      zone,
      recordName: '*',
      domainName: endpointDnsName,
    });

    new CfnOutput(this, 'ZoneId', { value: zone.hostedZoneId });
  }
}
