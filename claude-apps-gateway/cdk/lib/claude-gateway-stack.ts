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
  /** ACM cert ARN for publicUrl's hostname — IMPORTED. Required for pass 2. */
  readonly certArn?: string;
  /** Route 53 PRIVATE hosted-zone name, e.g. example.com (holds the A-record). */
  readonly zoneName?: string;
  /** Route 53 private hosted-zone id (optional; looked up from zoneName if omitted). */
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
  /**
   * Name prefix for the stack's named resources (ECR repo, cluster, service,
   * secrets, log group). Mirrors setup.sh's PROJECT. Defaults to 'claude-gateway'.
   * deploy.sh passes this through from the .env GATEWAY_NAME.
   */
  readonly gatewayName?: string;
  /**
   * Region of the Bedrock endpoint the gateway calls — used for the upstream and
   * for scoping the inference-profile IAM ARN. Defaults to the stack's own region.
   * The gateway uses GLOBAL cross-region inference profiles (global.anthropic.*),
   * which resolve from any Bedrock region, so any value works.
   */
  readonly bedrockRegion?: string;
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

    // Name prefix for the stack's named resources. Mirrors setup.sh's PROJECT so
    // the two tracks name resources identically; deploy.sh passes it from GATEWAY_NAME.
    const gatewayName = props.gatewayName ?? 'claude-gateway';
    // Region of the Bedrock endpoint; defaults to the deploy region. The gateway
    // uses global.anthropic.* inference profiles, which resolve from any region.
    const bedrockRegion = props.bedrockRegion ?? this.region;

    // ── ECR repository (the pass-1 target) ────────────────────────────────────
    // Created first so the image can be built+pushed before the service exists.
    const repo = new ecr.Repository(this, 'Repo', {
      repositoryName: gatewayName,
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
          'Pass 1 complete. Build + push the image to the repo above, then re-run: ' +
          'cdk deploy -c imageReady=true -c publicUrl=... -c zoneName=... -c ingressCidr=... ' +
          '-c certArn=... (imported ACM cert for the gateway hostname).',
      });
      return;
    }

    // Pass-2 required inputs. We fail fast with a clear message rather than let
    // CDK synth a half-configured stack.
    const publicUrl = req(props.publicUrl, 'publicUrl');
    const zoneName = req(props.zoneName, 'zoneName');
    const ingressCidr = req(props.ingressCidr, 'ingressCidr');
    const certArn = req(props.certArn, 'certArn');
    // publicUrl is https://<host>; the record name is the host part.
    const recordHost = publicUrl.replace(/^https?:\/\//, '');

    // Private zone: holds the gateway A-record → internal ALB.
    const privateZone = props.zoneId
      ? route53.HostedZone.fromHostedZoneAttributes(this, 'Zone', {
          hostedZoneId: props.zoneId,
          zoneName,
        })
      : route53.HostedZone.fromLookup(this, 'Zone', { domainName: zoneName, privateZone: true });

    // The one certificate both listeners share: an imported ACM cert for the
    // gateway hostname. The CLI pins its SHA-256 fingerprint on first /login
    // (the CertFingerprintHint output below prints how to read it). Want no
    // prompt? Import a public, browser-trusted ACM cert — DNS validation needs
    // no public endpoint, so the ALB can stay internal (see docs/deployment.md).
    const certificate = acm.Certificate.fromCertificateArn(this, 'Cert', certArn);

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
      secretName: `${gatewayName}-jwt-secret`,
      description: 'Claude gateway JWT signing secret (>=32 bytes)',
      generateSecretString: {
        // >= 32 bytes of entropy; no JSON wrapper — the whole string is the secret.
        passwordLength: 44,
        excludePunctuation: false,
      },
    });
    const oidcSecret = new secretsmanager.Secret(this, 'OidcClientSecret', {
      secretName: `${gatewayName}-oidc-client-secret`,
      description: 'Claude gateway OIDC client secret — seeded out-of-band after deploy',
      // Generated placeholder rather than a fixed value ON PURPOSE: `generateSecretString`
      // only sets the value at CREATE time and CloudFormation never overwrites it on
      // update, so seeding the real secret out-of-band survives future deploys. A fixed
      // `secretStringValue` would reset the real value to the placeholder on every deploy.
      // deploy.sh seeds it from .env OIDC_CLIENT_SECRET (see its Step 4b); with setup.sh
      // export OIDC_CLIENT_SECRET so it seeds the value directly. Either way:
      //   aws secretsmanager put-secret-value --secret-id <gatewayName>-oidc-client-secret \
      //     --secret-string '<your-oidc-client-secret>'
      generateSecretString: {
        // Placeholder entropy only — the real IdP client secret is seeded post-deploy.
        passwordLength: 32,
        excludePunctuation: true,
      },
    });
    // ── Log group (gateway stderr: audit events + operational logs) ───────────
    const logGroup = new logs.LogGroup(this, 'GatewayLogGroup', {
      logGroupName: `/${gatewayName}/gateway`,
      retention: logs.RetentionDays.THREE_MONTHS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ── ECS cluster ───────────────────────────────────────────────────────────
    const cluster = new ecs.Cluster(this, 'Cluster', {
      vpc,
      clusterName: gatewayName,
    });


    // ── Gateway task role: dual-ARN Bedrock policy ────────────────────────────
    // BOTH inference-profile (global.anthropic.*) AND foundation-model (anthropic.*)
    // ARNs — missing either yields 403 on invoke. auth: {} in gateway.yaml picks
    // this up via the ECS container-credentials endpoint (no IMDS, no hop-limit trap).
    const taskRole = new iam.Role(this, 'TaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'Claude gateway task role: Bedrock invoke + CloudWatch metrics',
    });
    taskRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
        resources: [
          // GLOBAL cross-region inference profiles (gateway.yaml uses global.anthropic.*).
          // The profile ARN is scoped to the source (bedrock) region; global profiles
          // resolve from any region, so any bedrockRegion works. The foundation-model
          // ARN is region-wildcarded (::) because global routes to any commercial region.
          `arn:aws:bedrock:${bedrockRegion}:${this.account}:inference-profile/global.anthropic.*`,
          'arn:aws:bedrock:*::foundation-model/anthropic.*',
        ],
      }),
    );
    taskRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['cloudwatch:PutMetricData'],
        resources: ['*'],
      }),
    );

    // ── Gateway Fargate service behind an internal IPv4 ALB ───────────────────
    // IPv4-only on purpose: internal dual-stack ALBs return public-range AAAA
    // records that /login rejects.
    const image = ecs.ContainerImage.fromEcrRepository(repo, props.imageTag);
    const fargate = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'Gateway', {
      cluster,
      serviceName: gatewayName,
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
      certificate,
      sslPolicy: elbv2.SslPolicy.TLS13_RES,
      idleTimeout: cdk.Duration.seconds(3600), // long streaming responses
      // Route 53 private record: claude-gateway.<zoneName> → the internal ALB.
      domainName: recordHost,
      domainZone: privateZone,
      healthCheckGracePeriod: cdk.Duration.seconds(120),
      taskImageOptions: {
        image,
        containerPort: 8080,
        taskRole,
        // NO non-secret app config here — it's baked into the image by design.
        // DB_HOST is the non-secret RDS endpoint (the RDS-managed secret holds
        // only username/password, not host).
        environment: {
          CLAUDE_GATEWAY_LOG_LEVEL: 'info',
          CLAUDE_CONFIG_DIR: '/tmp/.claude',
          DB_HOST: db.dbInstanceEndpointAddress,
          CLAUDE_GATEWAY_ALLOW_LOOPBACK: '1', // ADOT sidecar is on localhost
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

    // ── ADOT collector sidecar (OTLP receiver → CW native OTLP metrics) ─────
    // Receives OTLP from the gateway on localhost:4318 and forwards to CloudWatch's
    // native OTLP endpoint using SigV4 via the task role.
    // Runs as a sidecar in the same task (no ALB listener, no extra SG).
    const adotConfig = [
      'extensions:',
      '  sigv4auth:',
      '    service: monitoring',
      `    region: ${this.region}`,
      'receivers:',
      '  otlp:',
      '    protocols:',
      '      http:',
      '        endpoint: 127.0.0.1:4318',
      'processors:',
      '  batch:',
      '    send_batch_size: 200',
      '    timeout: 10s',
      'exporters:',
      '  otlphttp:',
      `    metrics_endpoint: https://monitoring.${this.region}.amazonaws.com/v1/metrics`,
      '    auth:',
      '      authenticator: sigv4auth',
      '    compression: gzip',
      'service:',
      '  extensions: [sigv4auth]',
      '  pipelines:',
      '    metrics:',
      '      receivers: [otlp]',
      '      processors: [batch]',
      '      exporters: [otlphttp]',
    ].join('\n');
    fargate.taskDefinition.addContainer('otel-collector', {
      image: ecs.ContainerImage.fromRegistry('public.ecr.aws/aws-observability/aws-otel-collector:latest'),
      essential: false, // gateway continues if the collector crashes; telemetry is non-critical
      environment: { AOT_CONFIG_CONTENT: adotConfig },
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'otel', logGroup }),
      memoryReservationMiB: 128,
    });

    // Health check → /healthz (liveness). Keeps replicas in rotation during a
    // Postgres blip; pointing it at /readyz would drain all replicas at once.
    fargate.targetGroup.configureHealthCheck({
      path: '/healthz',
      healthyHttpCodes: '200',
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
        `-c publicUrl=... -c zoneName=... -c ingressCidr=... -c certArn=... ` +
        `(imported ACM cert for the gateway hostname). ` +
        `Or set imageReady=false for the pass-1 ECR-repo-only deploy.`,
    );
  }
  return value;
}
