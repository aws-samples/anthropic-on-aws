import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import { DeployConfig } from './config';

interface VpnStackProps extends StackProps {
  readonly config: DeployConfig;
  readonly vpc: ec2.Vpc;
  /**
   * ACM ARN of the server certificate for mutual-TLS Client VPN. Generated with
   * easy-rsa and imported to ACM out-of-band (only public certs leave the Mac).
   * Passed via `cdk deploy -c serverCertArn=...`. With mutual TLS the client
   * cert can share the same CA, so a separate client ARN is optional.
   */
  readonly serverCertArn: string;
  readonly clientCertArn?: string;
}

/**
 * AWS Client VPN endpoint — the single-laptop equivalent of a corporate VPN.
 * Gives the Mac a private VPC IP so the gateway's private-IP `/login` check
 * passes, and pushes the VPC resolver so private Route 53 names resolve.
 */
export class VpnStack extends Stack {
  constructor(scope: Construct, id: string, props: VpnStackProps) {
    super(scope, id, props);
    const { config, vpc, serverCertArn, clientCertArn } = props;

    const logGroup = new logs.LogGroup(this, 'VpnLogs', {
      retention: logs.RetentionDays.ONE_MONTH,
    });
    const logStream = logGroup.addStream('connections');

    // VPC resolver = network base + 2 (e.g. 10.60.0.0/16 -> 10.60.0.2). vpcCidr is a
    // known literal, so compute in plain JS rather than with Fn intrinsics.
    const [a, b] = config.vpcCidr.split('/')[0].split('.');
    const vpcResolver = `${a}.${b}.0.2`;

    // Dedicated SG for the Client VPN ENI. MUST allow egress into the VPC — the default SG
    // AWS would otherwise attach has NO egress, which silently blackholes all tunnel traffic
    // to VPC resources (DNS to the .2 resolver still works, masking the problem).
    const vpnSg = new ec2.SecurityGroup(this, 'VpnSg', {
      vpc,
      description: 'Client VPN ENI - egress into the VPC',
      allowAllOutbound: false,
    });
    vpnSg.addEgressRule(ec2.Peer.ipv4(config.vpcCidr), ec2.Port.allTraffic(), 'VPN clients into VPC');

    const endpoint = new ec2.CfnClientVpnEndpoint(this, 'Endpoint', {
      description: 'Claude gateway Client VPN',
      clientCidrBlock: config.vpnClientCidr,
      serverCertificateArn: serverCertArn,
      authenticationOptions: [
        {
          type: 'certificate-authentication',
          mutualAuthentication: { clientRootCertificateChainArn: clientCertArn ?? serverCertArn },
        },
      ],
      connectionLogOptions: {
        enabled: true,
        cloudwatchLogGroup: logGroup.logGroupName,
        cloudwatchLogStream: logStream.logStreamName,
      },
      // Push the VPC resolver so private Route 53 names resolve over the tunnel.
      dnsServers: [vpcResolver],
      splitTunnel: true,
      transportProtocol: 'udp',
      vpnPort: 443,
      securityGroupIds: [vpnSg.securityGroupId],
      vpcId: vpc.vpcId,
    });

    // Associate with the first private subnet; authorize the whole VPC.
    const targetSubnet = vpc.privateSubnets[0];
    new ec2.CfnClientVpnTargetNetworkAssociation(this, 'Assoc', {
      clientVpnEndpointId: endpoint.ref,
      subnetId: targetSubnet.subnetId,
    });
    new ec2.CfnClientVpnAuthorizationRule(this, 'AuthRule', {
      clientVpnEndpointId: endpoint.ref,
      targetNetworkCidr: config.vpcCidr,
      authorizeAllGroups: true,
      description: 'Allow VPN clients into the VPC',
    });

    new CfnOutput(this, 'ClientVpnEndpointId', { value: endpoint.ref });
    new CfnOutput(this, 'ExportConfigHint', {
      value: `aws ec2 export-client-vpn-client-configuration --client-vpn-endpoint-id ${endpoint.ref} --region ${config.region} --output text > client.ovpn`,
    });
  }
}
