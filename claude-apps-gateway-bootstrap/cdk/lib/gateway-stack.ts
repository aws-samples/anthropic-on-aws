import { Stack, StackProps, Duration, CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { DeployConfig } from './config';
import { ackNag } from './nag';

interface GatewayStackProps extends StackProps {
  readonly config: DeployConfig;
  readonly vpc: ec2.Vpc;
  readonly albSg: ec2.SecurityGroup;
  readonly serviceSg: ec2.SecurityGroup;
  readonly gatewayRepo: ecr.Repository;
  readonly db: rds.DatabaseInstance;
  /** Image tag pushed to ECR by the builder (default 'latest'). */
  readonly imageTag?: string;
  /** ACM cert ARN for the private ALB hostnames (private CA or imported self-signed). */
  readonly albCertArn: string;
}

/**
 * The apps gateway: a Fargate service behind an internal, IPv4-only ALB. The ALB
 * is dualstack-free on purpose — `/login` rejects the public-range AAAA records a
 * dual-stack internal ALB would return. Host-based routing shares the ALB with the
 * bootstrap service (added by BootstrapStack via a separate listener rule).
 */
export class GatewayStack extends Stack {
  readonly alb: elbv2.ApplicationLoadBalancer;
  readonly httpsListener: elbv2.ApplicationListener;
  readonly cluster: ecs.Cluster;

  constructor(scope: Construct, id: string, props: GatewayStackProps) {
    super(scope, id, props);
    const { config, vpc, albSg, serviceSg, gatewayRepo, db } = props;
    const imageTag = props.imageTag ?? 'latest';

    this.cluster = new ecs.Cluster(this, 'Cluster', {
      vpc,
      containerInsightsV2: ecs.ContainerInsights.ENABLED,
    });
    const cluster = this.cluster;

    // --- Task role: Bedrock invoke on the region's au.* profiles + foundation models ---
    const taskRole = new iam.Role(this, 'GatewayTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });
    taskRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
        resources: [
          // Regional au.* profiles + GLOBAL profiles (Fable 5 is global-only) + the
          // underlying foundation models the profiles route to (any region).
          `arn:aws:bedrock:${config.bedrockRegion}:${config.account}:inference-profile/au.anthropic.*`,
          `arn:aws:bedrock:${config.bedrockRegion}:${config.account}:inference-profile/global.anthropic.*`,
          `arn:aws:bedrock:*::foundation-model/anthropic.*`,
        ],
      }),
    );
    const bedrockWildcardReason =
      'Provider-scoped, not open: Anthropic inference profiles in this account and the '
      + 'anthropic.* foundation models they route to (profile invocation requires the '
      + 'underlying model grant in every routed region).';
    ackNag(taskRole,
      {
        id: 'AwsSolutions-IAM5[Resource::arn:aws:bedrock:*::foundation-model/anthropic.*]',
        reason: bedrockWildcardReason,
      },
      {
        id: `AwsSolutions-IAM5[Resource::arn:aws:bedrock:${config.bedrockRegion}:${config.account}:inference-profile/au.anthropic.*]`,
        reason: bedrockWildcardReason,
      },
      {
        id: `AwsSolutions-IAM5[Resource::arn:aws:bedrock:${config.bedrockRegion}:${config.account}:inference-profile/global.anthropic.*]`,
        reason: bedrockWildcardReason,
      },
      {
        id: `AwsSolutions-IAM5[Resource::arn:aws:logs:${config.region}:${config.account}:log-group:/claude/otel/*]`,
        reason:
          'Scoped to the /claude/otel/* log-group prefix the ADOT sidecar writes; the '
          + 'exporter creates groups/streams at runtime so exact names are unknowable.',
      },
    );

    const taskDef = new ecs.FargateTaskDefinition(this, 'GatewayTask', {
      cpu: 512,
      memoryLimitMiB: 1024,
      taskRole,
      runtimePlatform: {
        cpuArchitecture: ecs.CpuArchitecture.ARM64,
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
      },
    });

    // Secrets: Entra client secret + gateway JWT secret + RDS-derived Postgres URL.
    // Reference by COMPLETE ARN — ECS fails to resolve the partial ARN fromSecretNameV2 emits.
    const entraSecret = secretsmanager.Secret.fromSecretCompleteArn(
      this, 'EntraSecret', config.secrets.entraClientSecretArn);
    const jwtSecret = secretsmanager.Secret.fromSecretCompleteArn(
      this, 'JwtSecret', config.secrets.gatewayJwtSecretArn);
    const pgUrlSecret = secretsmanager.Secret.fromSecretCompleteArn(
      this, 'PgUrlSecret', config.secrets.postgresUrlArn);
    const adminWriteKey = secretsmanager.Secret.fromSecretCompleteArn(
      this, 'AdminWriteKey', config.secrets.gatewayAdminWriteKeyArn);
    const adminReadKey = secretsmanager.Secret.fromSecretCompleteArn(
      this, 'AdminReadKey', config.secrets.gatewayAdminReadKeyArn);

    taskDef.addContainer('gateway', {
      image: ecs.ContainerImage.fromEcrRepository(gatewayRepo, imageTag),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'gateway',
        logRetention: logs.RetentionDays.ONE_MONTH,
      }),
      portMappings: [{ containerPort: 8080 }],
      environment: {
        CLAUDE_GATEWAY_LOG_LEVEL: 'info',
        // gateway.yaml carries no deployment identifiers — they arrive via ${ENV} expansion
        // from the gitignored deployment.config.json (see config.ts).
        GATEWAY_PUBLIC_URL: `https://${config.gatewayHost}`,
        OIDC_ISSUER: config.entraIssuer,
        OIDC_CLIENT_ID: config.entraClientId,
        GATEWAY_BLOCKED_MESSAGE: `You have hit your Claude usage quota for this period. ${config.blockedMessageContact ?? 'Contact your platform team.'}`,
      },
      secrets: {
        OIDC_CLIENT_SECRET: ecs.Secret.fromSecretsManager(entraSecret),
        GATEWAY_JWT_SECRET: ecs.Secret.fromSecretsManager(jwtSecret),
        GATEWAY_POSTGRES_URL: ecs.Secret.fromSecretsManager(pgUrlSecret),
        GATEWAY_ADMIN_WRITE_KEY: ecs.Secret.fromSecretsManager(adminWriteKey),
        GATEWAY_ADMIN_READ_KEY: ecs.Secret.fromSecretsManager(adminReadKey),
      },
    });

    // --- ADOT collector sidecar: OTLP ingest for Claude Code CLI + Desktop/Cowork ---
    // Both client families post OTLP http/protobuf to https://<gatewayHost>/v1/{metrics,logs,
    // traces}; an ALB path rule (below) sends those to this container on 4318, bypassing the
    // gateway process. Metrics land in CloudWatch as EMF (namespace ClaudeCode, per-user
    // dimensions from resource attributes); logs land in a CloudWatch log group.
    const otelConfig = {
      // health_check must bind 0.0.0.0 — its default (localhost:13133) is unreachable by
      // the ALB health probe, which leaves the OTLP target permanently unhealthy.
      extensions: { health_check: { endpoint: '0.0.0.0:13133' } },
      receivers: { otlp: { protocols: { http: { endpoint: '0.0.0.0:4318' } } } },
      processors: { batch: { timeout: '30s' } },
      exporters: {
        awsemf: {
          namespace: 'ClaudeCode',
          log_group_name: '/claude/otel/metrics',
          region: this.region,
          // Lift resource attributes (user.email, user.id, session.id...) onto datapoints
          // so they can be used as metric dimensions.
          resource_to_telemetry_conversion: { enabled: true },
          metric_declarations: [
            {
              dimensions: [['user.email'], ['user.email', 'model'], ['user.email', 'type']],
              metric_name_selectors: ['claude_code.*'],
            },
            { dimensions: [['user.email']], metric_name_selectors: ['.*'] },
          ],
        },
        awscloudwatchlogs: {
          log_group_name: '/claude/otel/app-logs',
          log_stream_name: 'otlp',
          region: this.region,
        },
      },
      service: {
        extensions: ['health_check'],
        pipelines: {
          metrics: { receivers: ['otlp'], processors: ['batch'], exporters: ['awsemf'] },
          logs: { receivers: ['otlp'], processors: ['batch'], exporters: ['awscloudwatchlogs'] },
        },
      },
    };
    taskDef.addContainer('otel-collector', {
      image: ecs.ContainerImage.fromRegistry('public.ecr.aws/aws-observability/aws-otel-collector:latest'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'otel',
        logRetention: logs.RetentionDays.ONE_MONTH,
      }),
      portMappings: [{ containerPort: 4318 }, { containerPort: 13133 }],
      environment: { AOT_CONFIG_CONTENT: JSON.stringify(otelConfig) },
      essential: false, // telemetry outage must not kill inference
    });
    // awsemf + awscloudwatchlogs write via CloudWatch Logs APIs.
    taskRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
          'logs:DescribeLogGroups',
          'logs:DescribeLogStreams',
          'logs:PutRetentionPolicy',
        ],
        resources: [`arn:aws:logs:${this.region}:${this.account}:log-group:/claude/otel/*`],
      }),
    );

    // fromSecretNameV2 grants a 6-char-wildcard ARN, but ECS resolves the container
    // secret to the suffix-less partial ARN, which the wildcard doesn't match -> AccessDenied
    // at task start. Grant the execution role read on the whole secret namespace explicitly.
    taskDef.addToExecutionRolePolicy(
      new iam.PolicyStatement({
        actions: ['secretsmanager:GetSecretValue', 'secretsmanager:DescribeSecret'],
        resources: [
          `arn:aws:secretsmanager:${this.region}:${this.account}:secret:claude-gateway/*`,
        ],
      }),
    );
    ackNag(taskDef,
      {
        id: `AwsSolutions-IAM5[Resource::arn:aws:secretsmanager:${config.region}:${config.account}:secret:claude-gateway/*]`,
        reason:
          'Execution-role read is prefix-scoped to the claude-gateway/* secret namespace: '
          + 'Secrets Manager appends a random 6-char suffix to secret ARNs, so exact-ARN '
          + 'grants break when a secret is recreated; the prefix is this deployment\'s '
          + 'dedicated namespace.',
      },
      {
        id: 'AwsSolutions-IAM5[Resource::*]',
        reason:
          'CDK-generated execution-role statement: ecr:GetAuthorizationToken (account-'
          + 'scoped, only valid on *) plus the log-group grant the awslogs driver emits.',
      },
      {
        id: 'AwsSolutions-ECS2',
        reason:
          'Plain environment variables carry only non-sensitive config (public URL, OIDC '
          + 'issuer/client-id, log level, user-facing quota message, collector config). All '
          + 'credentials (OIDC client secret, JWT secret, postgres URL, admin keys) are '
          + 'injected via ecs.Secret from Secrets Manager.',
      },
    );

    const service = new ecs.FargateService(this, 'GatewayService', {
      cluster,
      taskDefinition: taskDef,
      desiredCount: 1,
      securityGroups: [serviceSg],
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      assignPublicIp: false,
      minHealthyPercent: 0, // single-task deployment; allow full replace
      // Fail deployments fast instead of retrying a crashing task for hours.
      circuitBreaker: { rollback: true },
    });
    service.connections.allowTo(db, ec2.Port.tcp(5432), 'gateway -> postgres');

    // --- Internal, IPv4-only ALB ---
    this.alb = new elbv2.ApplicationLoadBalancer(this, 'Alb', {
      vpc,
      internetFacing: false,
      securityGroup: albSg,
      ipAddressType: elbv2.IpAddressType.IPV4, // NOT dual-stack: /login rejects public AAAA
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });
    // ALB access logs (AwsSolutions-ELB2): request-level audit trail alongside the
    // OTLP/app logs. logAccessLogs wires the ELB log-delivery bucket policy itself.
    const albLogBucket = new s3.Bucket(this, 'AlbAccessLogs', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      lifecycleRules: [{ expiration: Duration.days(90) }],
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
    this.alb.logAccessLogs(albLogBucket);
    ackNag(albLogBucket,{
      id: 'AwsSolutions-S1',
      reason:
        'This IS the access-log destination bucket; S3 server-access-logging on a '
        + 'log-delivery bucket would recurse. Writes are restricted to the ELB '
        + 'log-delivery principal by the policy logAccessLogs generates.',
    });

    const cert = acm.Certificate.fromCertificateArn(this, 'AlbCert', props.albCertArn);
    this.httpsListener = this.alb.addListener('Https', {
      port: 443,
      certificates: [cert],
      // open:false stops CDK adding a 0.0.0.0/0 ingress rule to the ALB SG. Ingress is
      // governed solely by albSg (VPN client CIDR + VPN SG), preserving no-public-ingress.
      open: false,
      // Default action: anything not matching a host rule -> 404.
      defaultAction: elbv2.ListenerAction.fixedResponse(404, {
        contentType: 'text/plain',
        messageBody: 'no route',
      }),
    });

    // OTLP ingest: clients post http/protobuf to https://<gatewayHost>/v1/{metrics,logs,
    // traces} (the endpoint the gateway pushes to CLI clients is its own public_url, and the
    // bootstrap response points Desktop/Cowork at the same origin). Route those three paths
    // to the ADOT sidecar on 4318 ahead of the gateway target (priority 7 < 10; bootstrap's
    // /user/bootstrap rule stays at 5).
    this.httpsListener.addTargets('OtlpTg', {
      priority: 7,
      conditions: [
        elbv2.ListenerCondition.hostHeaders([config.gatewayHost]),
        elbv2.ListenerCondition.pathPatterns(['/v1/metrics', '/v1/logs', '/v1/traces']),
      ],
      port: 4318,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [
        service.loadBalancerTarget({ containerName: 'otel-collector', containerPort: 4318 }),
      ],
      healthCheck: {
        port: '13133', // ADOT health_check extension
        path: '/',
        healthyHttpCodes: '200',
        interval: Duration.seconds(30),
      },
      deregistrationDelay: Duration.seconds(10),
    });

    this.httpsListener.addTargets('GatewayTg', {
      priority: 10,
      conditions: [elbv2.ListenerCondition.hostHeaders([config.gatewayHost])],
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [service],
      healthCheck: {
        path: '/healthz',
        healthyHttpCodes: '200',
        interval: Duration.seconds(30),
      },
      deregistrationDelay: Duration.seconds(10),
    });

    // Private DNS (gateway host -> ALB) is created in DnsStack, deployed last.

    new CfnOutput(this, 'GatewayUrl', { value: `https://${config.gatewayHost}` });
    new CfnOutput(this, 'AlbDnsName', { value: this.alb.loadBalancerDnsName });
  }
}
