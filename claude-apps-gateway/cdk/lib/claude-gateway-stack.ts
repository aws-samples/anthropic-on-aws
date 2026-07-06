import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';

export interface GatewayStackProps extends cdk.StackProps {
  /** Internal ALB https origin, e.g. https://claude-gateway.example.com */
  readonly publicUrl?: string;
  /** ECR image tag (defaults to the pinned claude version). */
  readonly imageTag: string;
  /** ACM cert ARN for publicUrl's hostname — IMPORTED, not issued in-stack. */
  readonly certArn?: string;
  /** Route 53 hosted-zone name, e.g. example.com */
  readonly zoneName?: string;
  /** Route 53 hosted-zone id (optional; looked up from zoneName if omitted). */
  readonly zoneId?: string;
  /** VPN/corp CLIENT CIDR developers connect from — NOT the VPC CIDR. */
  readonly ingressCidr?: string;
  /** Import an existing VPC instead of creating one. */
  readonly vpcId?: string;
  /**
   * Create the interface + S3 VPC endpoints (default true). Set false ONLY when
   * reusing a VPC (`vpcId`) that ALREADY provides private egress to Bedrock,
   * Secrets Manager, ECR, CloudWatch Logs/Monitoring, and S3 — otherwise the
   * gateway loses its "AWS traffic never touches the internet" posture. AWS
   * permits only one private-DNS-enabled interface endpoint per service per VPC,
   * so recreating endpoints a reused VPC already has fails the deploy; this flag
   * is the opt-out for that case.
   */
  readonly createVpcEndpoints?: boolean;
  /** false = pass 1 (ECR repo only); true = pass 2 (full stack incl. service). */
  readonly imageReady: boolean;
}

const DB_NAME = 'claude_gateway';

/**
 * The same Fargate deployment setup.sh provisions, expressed in CDK L2 constructs.
 * A WORKED EXAMPLE — see the repo README "Productionising" before relying on it.
 */
export class GatewayStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: GatewayStackProps) {
    super(scope, id, props);

    // ── ECR repository (the pass-1 target) ────────────────────────────────────
    // Created first so the image can be built+pushed before the service exists.
    const repo = new ecr.Repository(this, 'Repo', {
      repositoryName: 'claude-gateway',
      imageScanOnPush: true,
      // Example posture: clean teardown. Harden for production (see README).
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: true,
    });

    new cdk.CfnOutput(this, 'EcrRepositoryUri', { value: repo.repositoryUri });

    // Pass 1 stops here: create just the repo, then build+push the image.
    if (!props.imageReady) {
      new cdk.CfnOutput(this, 'NextStep', {
        value:
          'Pass 1 complete. Build + push the image to the repo above, then ' +
          're-run: cdk deploy -c imageReady=true (with certArn/zoneName/ingressCidr/publicUrl).',
      });
      return;
    }

    // Pass-2 required inputs. We fail fast with a clear message rather than let
    // CDK synth a half-configured stack.
    const publicUrl = req(props.publicUrl, 'publicUrl');
    const certArn = req(props.certArn, 'certArn');
    const zoneName = req(props.zoneName, 'zoneName');
    const ingressCidr = req(props.ingressCidr, 'ingressCidr');
    // publicUrl is https://<host>; the record name is the host part.
    const recordHost = publicUrl.replace(/^https?:\/\//, '');

    // ── VPC (2 AZs, public + private-with-egress) ─────────────────────────────
    // NAT is retained for the IdP leg only (public OIDC issuer); all AWS-service
    // traffic uses the VPC endpoints below and never touches the internet.
    const vpc = props.vpcId
      ? (ec2.Vpc.fromLookup(this, 'Vpc', { vpcId: props.vpcId }) as ec2.IVpc)
      : new ec2.Vpc(this, 'Vpc', {
          maxAzs: 2,
          natGateways: 1,
          ipProtocol: ec2.IpProtocol.IPV4_ONLY,
          subnetConfiguration: [
            { name: 'public', subnetType: ec2.SubnetType.PUBLIC, cidrMask: 24 },
            { name: 'private', subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, cidrMask: 24 },
          ],
        });

    // ── Interface VPC endpoints (AWS backbone, no internet) + S3 gateway ──────
    // Always created for a fresh VPC. When reusing a VPC (`vpcId`), set
    // `createVpcEndpoints=false` IF that VPC already has these endpoints —
    // AWS allows only one private-DNS-enabled interface endpoint per service per
    // VPC, so recreating them fails the deploy. Skipping them is safe ONLY when
    // the reused VPC provides the same private egress; otherwise AWS traffic
    // silently falls back to the internet via NAT (see props doc).
    const createVpcEndpoints = props.createVpcEndpoints ?? true;
    const vpceSg = new ec2.SecurityGroup(this, 'VpceSg', {
      vpc,
      description: 'VPC endpoints: 443 from the gateway task SG',
      allowAllOutbound: true,
    });
    if (createVpcEndpoints) {
      const addIfaceEndpoint = (id: string, svc: ec2.InterfaceVpcEndpointAwsService) =>
        vpc.addInterfaceEndpoint(id, { service: svc, securityGroups: [vpceSg], privateDnsEnabled: true });
      addIfaceEndpoint('BedrockRuntimeEndpoint', ec2.InterfaceVpcEndpointAwsService.BEDROCK_RUNTIME);
      addIfaceEndpoint('SecretsManagerEndpoint', ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER);
      addIfaceEndpoint('EcrApiEndpoint', ec2.InterfaceVpcEndpointAwsService.ECR);
      addIfaceEndpoint('EcrDockerEndpoint', ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER);
      addIfaceEndpoint('CloudWatchLogsEndpoint', ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS);
      addIfaceEndpoint('CloudWatchMonitoringEndpoint', ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_MONITORING);
      vpc.addGatewayEndpoint('S3Endpoint', { service: ec2.GatewayVpcEndpointAwsService.S3 });
    }

    // ── Three-tier security groups ────────────────────────────────────────────
    // The ALB's own security group is created by the ApplicationLoadBalanced-
    // FargateService pattern below; we set openListener:false there and restrict
    // its 443 ingress to ingressCidr after construction (a standalone ALB SG here
    // would be dangling, since the pattern attaches its own).
    const taskSg = new ec2.SecurityGroup(this, 'TaskSg', {
      vpc,
      description: 'Gateway tasks: 8080 from the ALB only',
      allowAllOutbound: true,
    });
    // ALB -> task on 8080 is wired by the pattern; here we only add task -> endpoints.
    vpceSg.connections.allowFrom(taskSg, ec2.Port.tcp(443), 'tasks to VPC endpoints');

    // Collector is reached over the gateway ALB's HTTPS :4318 listener (the gateway
    // requires https:// for a non-loopback telemetry target, and there's no
    // custom-CA/skip-verify option for forward_to — so it must be a publicly-trusted
    // cert, which the ALB already has). Ingress rules for the ALB<->collector hop
    // are wired after the ALB exists, below.
    const otelSg = new ec2.SecurityGroup(this, 'OtelSg', {
      vpc,
      description: 'ADOT collector: 4318 (OTLP) + 13133 (health) from the ALB only',
      allowAllOutbound: true,
    });
    // The collector also needs the VPC endpoints (CloudWatch logs + metrics) — it
    // logs to the same group and exports metrics via the monitoring endpoint.
    vpceSg.connections.allowFrom(otelSg, ec2.Port.tcp(443), 'collector to VPC endpoints');

    // ── RDS PostgreSQL 16 (private, not public, encrypted, managed master secret)─
    // Example posture: easy teardown. See README "Productionising" to harden
    // (deletion protection, multi-AZ, longer backups, RETAIN) the moment you
    // enable spend limits, because then Postgres holds durable spend + PII.
    const db = new rds.DatabaseInstance(this, 'Db', {
      engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_16 }),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE4_GRAVITON, ec2.InstanceSize.MICRO),
      databaseName: DB_NAME,
      // RDS-managed master secret (JSON username/password). Gateway connects as
      // the master user, which has CREATE TABLE for the boot migrations.
      credentials: rds.Credentials.fromGeneratedSecret('gateway'),
      allocatedStorage: 20,
      storageType: rds.StorageType.GP3,
      storageEncrypted: true,
      multiAz: false,
      publiclyAccessible: false,
      backupRetention: cdk.Duration.days(1),
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    const dbSecret = db.secret!;
    // RDS SG: 5432 from the task SG ONLY (never a CIDR).
    db.connections.allowFrom(taskSg, ec2.Port.tcp(5432), 'gateway tasks to RDS');

    // ── Gateway-owned secrets (DB creds come from the RDS-managed secret) ─────
    const jwtSecret = new secretsmanager.Secret(this, 'JwtSecret', {
      secretName: 'claude-gateway-jwt-secret',
      description: 'Claude gateway JWT signing secret (>=32 bytes)',
      generateSecretString: {
        // >= 32 bytes of entropy; no JSON wrapper — the whole string is the secret.
        passwordLength: 44,
        excludePunctuation: false,
      },
    });
    const oidcSecret = new secretsmanager.Secret(this, 'OidcClientSecret', {
      secretName: 'claude-gateway-oidc-client-secret',
      description: 'Claude gateway OIDC client secret — set the real value after deploy',
      // Placeholder; replace with the real OIDC client secret:
      //   aws secretsmanager put-secret-value --secret-id claude-gateway-oidc-client-secret \
      //     --secret-string '<your-oidc-client-secret>'
      secretStringValue: cdk.SecretValue.unsafePlainText('REPLACE_ME'),
    });

    // ── Log group (gateway stderr: audit events + operational logs) ───────────
    const logGroup = new logs.LogGroup(this, 'GatewayLogGroup', {
      logGroupName: '/claude-gateway/gateway',
      retention: logs.RetentionDays.THREE_MONTHS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ── ECS cluster ───────────────────────────────────────────────────────────
    const cluster = new ecs.Cluster(this, 'Cluster', {
      vpc,
      clusterName: 'claude-gateway',
    });


    // ── ADOT collector — its own small Fargate service (metrics-only default) ─
    // A SEPARATE service, not a sidecar: the gateway's SSRF guard blocks loopback
    // by default, and a sidecar in the same awsvpc task is loopback. A separate
    // service on a private IP passes the guard with no CLAUDE_GATEWAY_ALLOW_LOOPBACK.
    // health_check extension on :13133 gives the ALB target group something to GET
    // (raw OTLP/:4318 doesn't answer GET). TLS is terminated at the ALB, so the
    // collector itself listens plain HTTP on 4318.
    const adotConfig = [
      'extensions:',
      '  health_check:',
      '    endpoint: 0.0.0.0:13133',
      'receivers:',
      '  otlp:',
      '    protocols:',
      '      http:',
      '        endpoint: 0.0.0.0:4318',
      'processors:',
      '  batch: {}',
      'exporters:',
      '  awsemf:',
      '    namespace: ClaudeGateway',
      '    log_group_name: /claude-gateway/otel-metrics',
      'service:',
      '  extensions: [health_check]',
      '  pipelines:',
      '    metrics:',
      '      receivers: [otlp]',
      '      processors: [batch]',
      '      exporters: [awsemf]',
    ].join('\n');

    const otelTaskDef = new ecs.FargateTaskDefinition(this, 'OtelTaskDef', {
      cpu: 256,
      memoryLimitMiB: 512,
    });
    otelTaskDef.taskRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: [
          'cloudwatch:PutMetricData',
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
          'logs:DescribeLogGroups',
          'logs:DescribeLogStreams',
        ],
        resources: ['*'],
      }),
    );
    otelTaskDef.addContainer('aws-otel-collector', {
      image: ecs.ContainerImage.fromRegistry('public.ecr.aws/aws-observability/aws-otel-collector:latest'),
      environment: { AOT_CONFIG_CONTENT: adotConfig },
      portMappings: [{ containerPort: 4318 }, { containerPort: 13133 }],
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'otel', logGroup }),
    });
    const otelService = new ecs.FargateService(this, 'OtelService', {
      cluster,
      taskDefinition: otelTaskDef,
      desiredCount: 1,
      minHealthyPercent: 0, // single fire-and-forget collector; fine to replace in place
      circuitBreaker: { rollback: true }, // fail a bad deploy fast instead of hanging for hours
      securityGroups: [otelSg],
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });
    // OTLP is fire-and-forget: if the collector is down, inference is unaffected.
    // The collector is registered to the gateway ALB's :4318 listener below.

    // ── Gateway task role: dual-ARN Bedrock policy ────────────────────────────
    // BOTH inference-profile (us.anthropic.*) AND foundation-model (anthropic.*)
    // ARNs — missing either yields 403 on invoke. auth: {} in gateway.yaml picks
    // this up via the ECS container-credentials endpoint (no IMDS, no hop-limit trap).
    const taskRole = new iam.Role(this, 'TaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'Claude gateway task role: Bedrock invoke',
    });
    taskRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
        resources: [
          `arn:aws:bedrock:${this.region}:${this.account}:inference-profile/us.anthropic.*`,
          'arn:aws:bedrock:*::foundation-model/anthropic.*',
        ],
      }),
    );

    // ── Gateway Fargate service behind an internal IPv4 ALB ───────────────────
    // IPv4-only on purpose: internal dual-stack ALBs return public-range AAAA
    // records that /login rejects.
    const image = ecs.ContainerImage.fromEcrRepository(repo, props.imageTag);
    const fargate = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'Gateway', {
      cluster,
      serviceName: 'claude-gateway',
      cpu: 512,
      memoryLimitMiB: 1024,
      desiredCount: 2, // zero-downtime rolling deploys + AZ resilience; Postgres is the shared layer
      minHealthyPercent: 100, // keep all replicas up during a rolling deploy (the gateway is stateless)
      circuitBreaker: { rollback: true }, // fail a bad deploy fast and roll back instead of hanging for hours
      publicLoadBalancer: false, // internal ALB → private IPs only (satisfies /login)
      ipAddressType: elbv2.IpAddressType.IPV4,
      openListener: false, // don't open 443 to 0.0.0.0/0; we restrict to ingressCidr below
      taskSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [taskSg],
      protocol: elbv2.ApplicationProtocol.HTTPS,
      certificate: acm.Certificate.fromCertificateArn(this, 'Cert', certArn),
      sslPolicy: elbv2.SslPolicy.TLS13_RES,
      idleTimeout: cdk.Duration.seconds(3600), // long streaming responses
      // Route 53 private record: claude-gateway.<zoneName> → the internal ALB.
      domainName: recordHost,
      domainZone: props.zoneId
        ? route53.HostedZone.fromHostedZoneAttributes(this, 'Zone', {
            hostedZoneId: props.zoneId,
            zoneName,
          })
        : route53.HostedZone.fromLookup(this, 'Zone', { domainName: zoneName, privateZone: true }),
      healthCheckGracePeriod: cdk.Duration.seconds(120),
      taskImageOptions: {
        image,
        containerPort: 8080,
        taskRole,
        // NO non-secret app config here — it's baked into the image (ADR 0001).
        // DB_HOST is the non-secret RDS endpoint (the RDS-managed secret holds
        // only username/password, not host).
        environment: {
          CLAUDE_GATEWAY_LOG_LEVEL: 'info',
          CLAUDE_CONFIG_DIR: '/tmp/.claude',
          DB_HOST: db.dbInstanceEndpointAddress,
        },
        secrets: {
          GATEWAY_JWT_SECRET: ecs.Secret.fromSecretsManager(jwtSecret),
          OIDC_CLIENT_SECRET: ecs.Secret.fromSecretsManager(oidcSecret),
          DB_USER: ecs.Secret.fromSecretsManager(dbSecret, 'username'),
          DB_PASSWORD: ecs.Secret.fromSecretsManager(dbSecret, 'password'),
        },
        logDriver: ecs.LogDrivers.awsLogs({ streamPrefix: 'gateway', logGroup }),
      },
    });

    // Restrict the ALB's 443 ingress to the VPN/corp client CIDR (not 0.0.0.0/0).
    // openListener:false above suppressed the pattern's default wide-open rule.
    fargate.loadBalancer.connections.allowFrom(
      ec2.Peer.ipv4(ingressCidr),
      ec2.Port.tcp(443),
      'developers to ALB (HTTPS)',
    );

    // Health check → /healthz (liveness). Keeps replicas in rotation during a
    // Postgres blip; pointing it at /readyz would drain all replicas at once.
    fargate.targetGroup.configureHealthCheck({
      path: '/healthz',
      healthyHttpCodes: '200',
    });

    // ── Telemetry: HTTPS :4318 listener on the gateway ALB → ADOT collector ────
    // The gateway requires https:// for a non-loopback forward_to and offers no
    // custom-CA/skip-verify for it, so the collector must sit behind the ALB's
    // publicly-trusted ACM cert. TLS terminates at the ALB; the collector speaks
    // plain OTLP/HTTP on 4318 behind it. The stamped gateway.yaml points
    // telemetry.forward_to at https://<public_url host>:4318.
    const otelListener = fargate.loadBalancer.addListener('OtelListener', {
      port: 4318,
      protocol: elbv2.ApplicationProtocol.HTTPS,
      certificates: [acm.Certificate.fromCertificateArn(this, 'OtelCert', certArn)],
      sslPolicy: elbv2.SslPolicy.TLS13_RES,
    });
    otelListener.addTargets('OtelTargets', {
      port: 4318,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [otelService.loadBalancerTarget({ containerName: 'aws-otel-collector', containerPort: 4318 })],
      healthCheck: { port: '13133', path: '/', healthyHttpCodes: '200' },
      deregistrationDelay: cdk.Duration.seconds(10),
    });
    // Only the gateway task SG may reach the ALB's :4318 listener (developers hit 443 only).
    fargate.loadBalancer.connections.allowFrom(taskSg, ec2.Port.tcp(4318), 'gateway to ALB (OTLP/HTTPS)');
    // ALB → collector on 4318 (OTLP) and 13133 (health).
    otelSg.connections.allowFrom(fargate.loadBalancer, ec2.Port.tcp(4318), 'ALB to collector (OTLP)');
    otelSg.connections.allowFrom(fargate.loadBalancer, ec2.Port.tcp(13133), 'ALB to collector (health)');

    new cdk.CfnOutput(this, 'OtelForwardTo', {
      value: `https://${recordHost}:4318`,
      description: 'gateway.yaml telemetry.forward_to (ADOT collector via the gateway ALB)',
    });

    // ── Outputs ───────────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'AlbDnsName', { value: fargate.loadBalancer.loadBalancerDnsName });
    new cdk.CfnOutput(this, 'PublicUrl', { value: publicUrl });
    new cdk.CfnOutput(this, 'OAuthRedirectUri', {
      value: `${publicUrl}/oauth/callback`,
      description: 'Register this redirect URI on your OIDC client',
    });
    new cdk.CfnOutput(this, 'TaskRoleArn', { value: taskRole.roleArn });
    new cdk.CfnOutput(this, 'RdsEndpoint', { value: db.dbInstanceEndpointAddress });
    new cdk.CfnOutput(this, 'CertFingerprintHint', {
      value: `openssl s_client -connect ${recordHost}:443 -servername ${recordHost} | openssl x509 -noout -fingerprint -sha256`,
      description: 'Run this to get the cert SHA-256 to publish to developers (the CLI pins it)',
    });
  }
}

/** Fail synth with a clear message when a pass-2 required input is missing. */
function req(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(
      `Missing required context "${name}". For pass 2 deploy with: ` +
        `-c publicUrl=... -c certArn=... -c zoneName=... -c ingressCidr=... ` +
        `(or set imageReady=false for the pass-1 ECR-repo-only deploy).`,
    );
  }
  return value;
}
