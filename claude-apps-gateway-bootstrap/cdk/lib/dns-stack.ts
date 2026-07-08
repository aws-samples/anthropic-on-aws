import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { DeployConfig } from './config';

interface DnsStackProps extends StackProps {
  readonly config: DeployConfig;
  readonly vpc: ec2.Vpc;
  readonly alb: elbv2.ApplicationLoadBalancer;
}

/**
 * Split-horizon private DNS, isolated in its own stack. It depends on both the VPC and the
 * ALB and is deployed LAST, and nothing imports from it — so renaming the zone or changing
 * records never triggers a cross-stack "export in use" deadlock (the trap that entangling
 * DNS with the network stack caused).
 *
 * The zone name intentionally matches your PUBLIC zone (same apex). Associated to
 * the VPC, it answers <gatewayHost> -> internal ALB (private IP) for VPN clients,
 * while the public zone never publishes that name. Combined with the public ACM cert on the
 * ALB, users get a browser-trusted https:// origin that still satisfies the gateway's
 * private-IP /login check.
 */
export class DnsStack extends Stack {
  constructor(scope: Construct, id: string, props: DnsStackProps) {
    super(scope, id, props);
    const { config, vpc, alb } = props;

    const zone = new route53.PrivateHostedZone(this, 'PrivateZone', {
      zoneName: config.privateZoneName,
      vpc,
    });

    new route53.ARecord(this, 'GatewayAlias', {
      zone,
      recordName: config.gatewayHost.replace(`.${config.privateZoneName}`, ''),
      target: route53.RecordTarget.fromAlias(new targets.LoadBalancerTarget(alb)),
    });

    new CfnOutput(this, 'GatewayUrl', { value: `https://${config.gatewayHost}` });
  }
}
