import { Stack, StackProps, Duration, CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import { ackNag } from './nag';

export interface WebsearchProxyStackProps extends StackProps {
  /**
   * The gateway origin — the ClaudeGatewayStack `PublicUrl` output, e.g.
   * https://claude-gateway.example.com. The proxy attaches to this hostname's
   * listener and every self-referential OAuth metadata URL is built from it.
   */
  readonly publicUrl: string;
  /** HTTPS :443 listener ARN of the gateway ALB (same lookup as the bootstrap add-on). */
  readonly listenerArn: string;
  /** Security group id of the gateway ALB (ingress source for the proxy service). */
  readonly albSgId: string;
  /** VPC id the gateway stack deployed into. */
  readonly vpcId: string;
  /**
   * Upstream AgentCore gateway MCP endpoint the proxy reverse-proxies to, e.g.
   * https://<id>.gateway.bedrock-agentcore.us-east-1.amazonaws.com/mcp
   */
  readonly upstreamMcpUrl: string;
  /** Entra tenant ID — issuer whose OIDC metadata/authorize/token the proxy relays. */
  readonly entraTenantId: string;
  /**
   * Path prefix the ALB routes to the proxy (NOT stripped by the ALB). The proxy
   * mounts its routes under this and advertises `<publicUrl><basePath>/...`.
   * Default '/websearch'.
   */
  readonly basePath?: string;
  /**
   * Optional static client_id returned by the proxy's mock DCR endpoint. Claude
   * Desktop supplies a static clientId and skips DCR, so this is only for other
   * MCP clients; safe to omit.
   */
  readonly mcpClientId?: string;
  /** ECR image tag for the proxy image (default 'latest'). */
  readonly imageTag?: string;
  /**
   * Two-pass deploy, same convention as the gateway/bootstrap: pass 1
   * (imageReady=false) creates only the ECR repo; build+push the image; pass 2
   * (imageReady=true, the default) deploys the service and listener rule.
   */
  readonly imageReady: boolean;
}

/**
 * Resource-stripping OAuth proxy add-on: fronts an Amazon Bedrock AgentCore
 * gateway so Claude Desktop's MCP OAuth flow works with Microsoft Entra ID.
 *
 * Entra rejects the RFC 8707 `resource` parameter that spec-compliant MCP clients
 * send (AADSTS9010010) and there is no client-side knob to suppress it. This proxy
 * (the documented Microsoft workaround) mediates the OAuth handshake and strips the
 * parameter before relaying to Entra, then reverse-proxies /mcp to the gateway.
 *
 * Deploys BEHIND the gateway's existing internal ALB via one listener rule
 * (path `<basePath>/*` on the gateway hostname) — the ClaudeGatewayStack is consumed
 * unmodified, coupled only through its deployed outputs. The gateway's CUSTOM_JWT
 * authorizer is left as-is: it still validates the Entra token it receives.
 */
export class WebsearchProxyStack extends Stack {
  constructor(scope: Construct, id: string, props: WebsearchProxyStackProps) {
    super(scope, id, props);
    const imageTag = props.imageTag ?? 'latest';
    const basePath = (props.basePath ?? '/websearch').replace(/\/+$/, '');
    const PORT = 8082;

    // ── ECR repository for the proxy image (built/pushed like the gateway's) ──
    const repo = new ecr.Repository(this, 'Repo', {
      imageScanOnPush: true,
      removalPolicy: RemovalPolicy.DESTROY,
      emptyOnDelete: true,
    });
    new CfnOutput(this, 'EcrRepositoryUri', { value: repo.repositoryUri });

    // Pass 1: repo only. Return BEFORE any environment lookups so
    // `cdk deploy -c imageReady=false` synthesizes with EMPTY context.
    if (!props.imageReady) {
      new CfnOutput(this, 'NextStep', {
        value:
          'Build+push the websearch-proxy image to the EcrRepositoryUri above, then '
          + 're-run: cdk deploy -c imageReady=true with the gateway-output context '
          + '(publicUrl/listenerArn/albSgId/vpcId/entraTenantId/upstreamMcpUrl).',
      });
      return;
    }

    // Pass 2 inputs — the deployed claude-apps-gateway outputs.
    const gatewayHost = props.publicUrl.replace(/^https?:\/\//, '');
    const vpc = ec2.Vpc.fromLookup(this, 'Vpc', { vpcId: props.vpcId });
    const albSg = ec2.SecurityGroup.fromSecurityGroupId(this, 'AlbSg', props.albSgId);
    const listener = elbv2.ApplicationListener.fromApplicationListenerAttributes(
      this, 'HttpsListener', { listenerArn: props.listenerArn, securityGroup: albSg });

    // ── Fargate service (own small cluster; the gateway cluster name is a fixed
    // physical name inside ClaudeGatewayStack and is not exported) ──
    const cluster = new ecs.Cluster(this, 'Cluster', {
      vpc,
      containerInsightsV2: ecs.ContainerInsights.ENABLED,
    });

    const taskDef = new ecs.FargateTaskDefinition(this, 'ProxyTask', {
      cpu: 256,
      memoryLimitMiB: 512,
    });

    // The proxy holds NO secrets: token validation is the gateway's job, and the
    // proxy only relays the public OAuth dance (strip resource) + streams /mcp.
    taskDef.addContainer('proxy', {
      image: ecs.ContainerImage.fromEcrRepository(repo, imageTag),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'websearch-proxy',
        logGroup: new logs.LogGroup(this, 'ServiceLogs', {
          retention: logs.RetentionDays.ONE_MONTH,
          removalPolicy: RemovalPolicy.DESTROY,
        }),
      }),
      portMappings: [{ containerPort: PORT }],
      environment: {
        PORT: String(PORT),
        // Externally visible origin (the gateway ALB hostname) + the path prefix the
        // listener rule routes here; all OAuth metadata is self-referential to these.
        PUBLIC_ORIGIN: props.publicUrl,
        BASE_PATH: basePath,
        UPSTREAM_MCP_URL: props.upstreamMcpUrl,
        ENTRA_TENANT_ID: props.entraTenantId,
        ...(props.mcpClientId ? { MCP_CLIENT_ID: props.mcpClientId } : {}),
      },
    });
    ackNag(taskDef,
      {
        id: 'AwsSolutions-ECS2',
        reason:
          'All environment values are non-sensitive public identifiers by design: gateway '
          + 'origin/base path, the upstream AgentCore gateway URL, the Entra tenant id, and '
          + '(optionally) the public client id. The proxy holds no secrets — it relays the '
          + 'public OAuth dance and validation is done by the gateway authorizer.',
      },
      {
        id: 'AwsSolutions-IAM5[Resource::*]',
        reason:
          'CDK-generated execution-role statement: ecr:GetAuthorizationToken (account-scoped, '
          + 'only valid on *) plus the log-group grant the awslogs driver emits.',
      },
    );

    const serviceSg = new ec2.SecurityGroup(this, 'ServiceSg', {
      vpc,
      description: `Websearch proxy - ingress ${PORT} from the gateway ALB only`,
      allowAllOutbound: true, // Entra OIDC/token fetch + upstream AgentCore gateway (via NAT)
    });
    serviceSg.addIngressRule(albSg, ec2.Port.tcp(PORT), 'websearch proxy from gateway ALB');
    // The gateway sample's ALB SG uses RESTRICTED egress, so ALB->target health checks
    // are dropped unless we author the matching egress rule (owned by THIS stack).
    new ec2.CfnSecurityGroupEgress(this, 'AlbToProxy', {
      groupId: props.albSgId,
      destinationSecurityGroupId: serviceSg.securityGroupId,
      ipProtocol: 'tcp',
      fromPort: PORT,
      toPort: PORT,
      description: 'gateway ALB to websearch proxy targets',
    });

    const service = new ecs.FargateService(this, 'ProxyService', {
      cluster,
      taskDefinition: taskDef,
      desiredCount: 1,
      securityGroups: [serviceSg],
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      assignPublicIp: false,
      minHealthyPercent: 0,
      circuitBreaker: { rollback: true },
    });

    // ── Attach to the gateway's existing HTTPS listener: one path-prefix rule. ──
    const tg = new elbv2.ApplicationTargetGroup(this, 'ProxyTg', {
      vpc,
      port: PORT,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [service],
      healthCheck: {
        path: '/healthz', // served at root by the container, independent of basePath
        healthyHttpCodes: '200',
        interval: Duration.seconds(30),
      },
      deregistrationDelay: Duration.seconds(10),
    });
    new elbv2.ApplicationListenerRule(this, 'ProxyRule', {
      listener,
      priority: 6, // bootstrap uses 5; keep distinct
      conditions: [
        elbv2.ListenerCondition.hostHeaders([gatewayHost]),
        elbv2.ListenerCondition.pathPatterns([`${basePath}/*`]),
      ],
      action: elbv2.ListenerAction.forward([tg]),
    });

    // The MCP server URL to put in the bootstrap managedMcpServers entry.
    new CfnOutput(this, 'WebsearchMcpUrl', { value: `${props.publicUrl}${basePath}/mcp` });
    new CfnOutput(this, 'WebsearchProxyBaseUrl', { value: `${props.publicUrl}${basePath}` });
  }
}
