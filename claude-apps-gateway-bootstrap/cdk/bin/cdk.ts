#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AwsSolutionsChecks } from 'cdk-nag';
import { CONFIG } from '../lib/config';
import { NetworkStack } from '../lib/network-stack';
import { VpnStack } from '../lib/vpn-stack';
import { DataStack } from '../lib/data-stack';
import { GatewayStack } from '../lib/gateway-stack';
import { BootstrapStack } from '../lib/bootstrap-stack';
import { DnsStack } from '../lib/dns-stack';
import { MonitoringStack } from '../lib/monitoring-stack';
import { DashboardStack } from '../lib/dashboard-stack';
import { PrivateMcpUsEast1Stack, PrivateMcpDnsStack } from '../lib/private-mcp-stack';
import { DevBoxStack } from '../lib/devbox-stack';
import { WorkspaceStack } from '../lib/workspace-stack';
import { WindowsBoxStack } from '../lib/windows-box-stack';

const app = new cdk.App();
// cdk-nag AwsSolutions pack on every stack (v3 policy-validation plugin API);
// Error-level findings fail synth unless acknowledged with a justification at
// the offending construct.
cdk.Validations.of(app).addPlugins(new AwsSolutionsChecks(app, { verbose: true }));
const env = { account: CONFIG.account, region: CONFIG.region };

// Values supplied at deploy time (out-of-band artifacts, no secrets in source):
//   -c serverCertArn=<acm arn>   ACM cert for the Client VPN server (mutual TLS)
//   -c albCertArn=<acm arn>      ACM cert for the internal ALB private hostnames
//   -c imageTag=<tag>            ECR image tag built by the EC2 builder (default 'latest')
const serverCertArn = app.node.tryGetContext('serverCertArn');
const albCertArn = app.node.tryGetContext('albCertArn');
const imageTag = app.node.tryGetContext('imageTag') || 'latest';

const network = new NetworkStack(app, 'ClaudeGw-Network', { env, config: CONFIG });

const data = new DataStack(app, 'ClaudeGw-Data', {
  env,
  config: CONFIG,
  vpc: network.vpc,
  dbSg: network.dbSg,
  builderSg: network.builderSg,
});

if (serverCertArn) {
  new VpnStack(app, 'ClaudeGw-Vpn', {
    env,
    config: CONFIG,
    vpc: network.vpc,
    serverCertArn,
    clientCertArn: app.node.tryGetContext('clientCertArn'),
  });
}

// Gateway + bootstrap need the ALB cert; only synthesize them once it's provided.
if (albCertArn) {
  const gateway = new GatewayStack(app, 'ClaudeGw-Gateway', {
    env,
    config: CONFIG,
    vpc: network.vpc,
    albSg: network.albSg,
    serviceSg: network.serviceSg,
    gatewayRepo: data.gatewayRepo,
    db: data.db,
    imageTag,
    albCertArn,
  });

  new BootstrapStack(app, 'ClaudeGw-Bootstrap', {
    env,
    config: CONFIG,
    vpc: network.vpc,
    serviceSg: network.serviceSg,
    bootstrapRepo: data.bootstrapRepo,
    cluster: gateway.cluster,
    httpsListener: gateway.httpsListener,
    imageTag,
  });

  // Spend observability: VPC Lambda polls the gateway admin API -> CloudWatch metrics
  // (ClaudeGateway namespace) + 80%-of-cap alarm. Reaches the gateway via the same
  // private DNS as clients, so it depends only on Network (SG) + the DNS record.
  new MonitoringStack(app, 'ClaudeGw-Monitoring', {
    env,
    config: CONFIG,
    vpc: network.vpc,
    albSg: network.albSg,
  });

  // Single-pane CloudWatch dashboard: Bedrock ground truth + per-user OTLP usage +
  // gateway spend/caps. Widgets use SEARCH expressions, so new users/models appear
  // without redeploying. No dependencies on other stacks (reads metrics by name).
  new DashboardStack(app, 'ClaudeGw-Dashboard', { env, config: CONFIG });

  // Cross-region private MCP path: us-east-1 endpoint VPC (+ peering) and the home-region
  // PHZ/routes. Deployed via context values (peering/endpoint outputs) to avoid cross-region
  // stack references: deploy PrivateMcpUsEast1 first, then pass its outputs as -c values.
  //   -c usEast1PeeringId=pcx-…  -c usEast1EndpointDns=vpce-….vpce.amazonaws.com
  // Only synthesized when -c homeVpcId=vpc-… (the Network stack VPC) is provided.
  const homeVpcId = app.node.tryGetContext('homeVpcId');
  if (homeVpcId) {
    new PrivateMcpUsEast1Stack(app, 'ClaudeGw-PrivateMcpUsEast1', {
      env: { account: CONFIG.account, region: 'us-east-1' },
      config: CONFIG,
      homeVpcId,
      homeVpcCidr: CONFIG.vpcCidr,
    });
  }
  const usEast1PeeringId = app.node.tryGetContext('usEast1PeeringId');
  const usEast1EndpointDns = app.node.tryGetContext('usEast1EndpointDns');
  if (usEast1PeeringId && usEast1EndpointDns) {
    new PrivateMcpDnsStack(app, 'ClaudeGw-PrivateMcpDns', {
      env,
      config: CONFIG,
      vpc: network.vpc,
      peeringId: usEast1PeeringId,
      endpointDnsName: usEast1EndpointDns,
    });
  }

  // Remote Claude Code dev box: private EC2, SSM-only access (no public endpoint, no
  // SSH port), tmux for persistent sessions, gateway login forced via managed settings.
  new DevBoxStack(app, 'ClaudeGw-DevBox', {
    env,
    config: CONFIG,
    vpc: network.vpc,
    albSg: network.albSg,
  });

  // Windows WorkSpace running Claude Desktop: in-VPC (reaches the gateway privately, no
  // VPN on the desktop), user connects via the WorkSpaces streaming client. Optional —
  // only synthesized when -c workspace=1 (it provisions a paid directory + WorkSpace).
  if (app.node.tryGetContext('workspace')) {
    new WorkspaceStack(app, 'ClaudeGw-Workspace', {
      env,
      config: CONFIG,
      vpc: network.vpc,
      albSg: network.albSg,
    });
  }

  // Windows Server box for running / reproducing Claude Desktop on Windows. Simpler than
  // WorkSpaces (no directory). GUI via Fleet Manager RDP over SSM — no public port, no VPN.
  new WindowsBoxStack(app, 'ClaudeGw-WindowsBox', {
    env,
    config: CONFIG,
    vpc: network.vpc,
    albSg: network.albSg,
  });

  // Split-horizon private DNS, deployed last; nothing imports from it (avoids the
  // "export in use" deadlock that entangling the zone in NetworkStack caused).
  new DnsStack(app, 'ClaudeGw-Dns', {
    env,
    config: CONFIG,
    vpc: network.vpc,
    alb: gateway.alb,
  });
}

app.synth();
