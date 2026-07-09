import { Stack, StackProps, Duration, CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as fs from 'fs';
import * as path from 'path';
import { ackNag } from './nag';

export interface BootstrapStackProps extends StackProps {
  /**
   * The gateway origin from the claude-apps-gateway deployment — the
   * ClaudeGatewayStack `PublicUrl` output, e.g. https://claude-gateway.example.com.
   * Used both to attach this service to the same hostname's listener rule and as
   * the inference origin in the served client configuration.
   */
  readonly publicUrl: string;
  /**
   * HTTPS listener ARN of the gateway ALB. ClaudeGatewayStack does not export
   * this directly; look it up once from the `AlbDnsName` output:
   *   aws elbv2 describe-listeners --load-balancer-arn $(aws elbv2 describe-load-balancers \
   *     --query "LoadBalancers[?DNSName=='<AlbDnsName>'].LoadBalancerArn" --output text) \
   *     --query "Listeners[?Port==\`443\`].ListenerArn" --output text
   */
  readonly listenerArn: string;
  /** Security group id of the gateway ALB (source for our service ingress). */
  readonly albSgId: string;
  /** VPC id the gateway stack deployed into (its created VPC or your imported one). */
  readonly vpcId: string;
  /** Entra tenant ID — issuer of the desktop app's PKCE access token. */
  readonly entraTenantId: string;
  /** Entra app (client) ID of the Claude Desktop PKCE public client (token audience). */
  readonly desktopClientId: string;
  /**
   * Authorization gate (optional but recommended beyond a single-tenant pilot).
   * When set, a caller's token must carry a matching value or the request is
   * refused with 403 — authentication proves who, authorization proves entitled.
   *   requiredGroups — Entra group object IDs matched against the `groups` claim
   *   requiredRoles  — app-role values matched against the `roles` claim
   * Both unset serves every valid tenant token (tenant membership is the boundary).
   */
  readonly requiredGroups?: string;
  readonly requiredRoles?: string;
  /** ECR image tag for the bootstrap image (default 'latest'). */
  readonly imageTag?: string;
  /**
   * Two-pass deploy, same convention as claude-apps-gateway: pass 1
   * (imageReady=false) creates only the ECR repo; build+push the image; pass 2
   * (imageReady=true, the default) deploys the service and listener rule.
   */
  readonly imageReady: boolean;
}

/**
 * Bootstrap add-on for the claude-apps-gateway sample: a PKCE-mode OAuth
 * RESOURCE SERVER that serves per-user Claude Desktop configuration from S3.
 *
 * Deploys BEHIND the gateway's existing internal ALB via one listener rule
 * (path /user/bootstrap on the same hostname) — the ClaudeGatewayStack itself
 * is consumed unmodified, coupled only through its deployed outputs.
 *
 * Claude Desktop authenticates to Entra directly (authorization-code + PKCE),
 * presents the access token here, and receives its configuration overlay:
 * models, surface toggles, egress allowlist, and the managed MCP server fleet
 * with native cross-origin URLs. The configuration itself is a JSON object in
 * S3, re-read on a 60s TTL — day-2 changes are an S3 push, never a redeploy.
 */
export class BootstrapStack extends Stack {
  constructor(scope: Construct, id: string, props: BootstrapStackProps) {
    super(scope, id, props);
    const imageTag = props.imageTag ?? 'latest';

    // ── ECR repository for the bootstrap image (built/pushed like the gateway's:
    // `docker build` + push, see README — no standing build infrastructure) ──
    // No fixed repositoryName: a generated name avoids collisions with any other
    // deployment in the account; consumers read the EcrRepositoryUri output.
    const repo = new ecr.Repository(this, 'Repo', {
      imageScanOnPush: true,
      // Example posture: clean teardown (mirrors claude-apps-gateway).
      removalPolicy: RemovalPolicy.DESTROY,
      emptyOnDelete: true,
    });
    new CfnOutput(this, 'EcrRepositoryUri', { value: repo.repositoryUri });

    // Pass 1: repo only. Return BEFORE any environment lookups (VPC/SG/listener)
    // or the gateway-output context values are read, so `cdk deploy -c imageReady=false`
    // synthesizes with an EMPTY context — nothing but the ECR repo. Build+push the
    // image, then re-deploy with imageReady=true (the default) supplying the gateway
    // outputs. This mirrors the claude-apps-gateway two-pass flow.
    if (!props.imageReady) {
      new CfnOutput(this, 'NextStep', {
        value:
          'Build+push the bootstrap image to the EcrRepositoryUri above, then '
          + 're-run: cdk deploy -c imageReady=true with the gateway-output context '
          + '(publicUrl/listenerArn/albSgId/vpcId/entraTenantId/desktopClientId).',
      });
      return;
    }

    // Pass 2 inputs — the deployed claude-apps-gateway outputs. Read only now, so
    // pass 1 never requires them (or a live VPC lookup).
    const gatewayHost = props.publicUrl.replace(/^https?:\/\//, '');
    const vpc = ec2.Vpc.fromLookup(this, 'Vpc', { vpcId: props.vpcId });
    const albSg = ec2.SecurityGroup.fromSecurityGroupId(this, 'AlbSg', props.albSgId);
    const listener = elbv2.ApplicationListener.fromApplicationListenerAttributes(
      this, 'HttpsListener', { listenerArn: props.listenerArn, securityGroup: albSg });

    // ── S3-backed client configuration: DATA, not code ──
    const configBucket = new s3.Bucket(this, 'ConfigBucket', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      versioned: true, // history of config edits
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
    ackNag(configBucket, {
      id: 'AwsSolutions-S1',
      reason:
        'Server access logging adds little for a single-object private config bucket: '
        + 'no public access, versioning records every change, reads come only from the '
        + 'bootstrap task role.',
    });
    const CONFIG_KEY = 'bootstrap-config.json';
    // Seed the LIVE key (not just the example): the service reads CONFIG_KEY and
    // silently falls back to its image-bundled default when the object is absent —
    // which would make later S3 edits appear to have no effect. Seeding the example
    // content under the real key means Step 3 (customize + push) is an edit, not a
    // create, and the config path is exercised from the first boot.
    new s3deploy.BucketDeployment(this, 'SeedConfig', {
      destinationBucket: configBucket,
      sources: [
        s3deploy.Source.data(
          CONFIG_KEY,
          fs.readFileSync(
            path.join(__dirname, '..', '..', 'bootstrap', 'config', 'bootstrap-config.example.json'),
            'utf8',
          ),
        ),
      ],
      // Seed once; later S3 edits are never overwritten (prune:false, hash-gated).
      prune: false,
    });
    new CfnOutput(this, 'ConfigBucketName', { value: configBucket.bucketName });
    new CfnOutput(this, 'ConfigObject', {
      value: `s3://${configBucket.bucketName}/${CONFIG_KEY}`,
    });

    // The BucketDeployment handler is a stack-scoped singleton Lambda owned by
    // aws-cdk-lib; its role wildcards and runtime are not overridable here.
    const cdkOwnedS3Wildcards =
      'CDK-generated by the aws-cdk-lib BucketDeployment construct (grantRead/grantWrite '
      + 'object wildcards), scoped to the CDK asset bucket and the config bucket only.';
    ackNag(this,
      {
        id: 'AwsSolutions-IAM4[Policy::arn:<AWS::Partition>:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole]',
        reason:
          'AWSLambdaBasicExecutionRole on the CDK-vended BucketDeployment singleton Lambda '
          + '(CloudWatch Logs write only); the function is owned by aws-cdk-lib.',
      },
      { id: 'AwsSolutions-IAM5[Action::s3:GetBucket*]', reason: cdkOwnedS3Wildcards },
      { id: 'AwsSolutions-IAM5[Action::s3:GetObject*]', reason: cdkOwnedS3Wildcards },
      { id: 'AwsSolutions-IAM5[Action::s3:List*]', reason: cdkOwnedS3Wildcards },
      { id: 'AwsSolutions-IAM5[Action::s3:Abort*]', reason: cdkOwnedS3Wildcards },
      { id: 'AwsSolutions-IAM5[Action::s3:DeleteObject*]', reason: cdkOwnedS3Wildcards },
      {
        id: `AwsSolutions-IAM5[Resource::arn:aws:s3:::cdk-hnb659fds-assets-${this.account}-${this.region}/*]`,
        reason: cdkOwnedS3Wildcards,
      },
      {
        id: `AwsSolutions-IAM5[Resource::<${this.getLogicalId(configBucket.node.defaultChild as s3.CfnBucket)}.Arn>/*]`,
        reason: cdkOwnedS3Wildcards,
      },
      {
        id: 'AwsSolutions-L1',
        reason:
          'The BucketDeployment handler runtime is pinned inside aws-cdk-lib and is not '
          + 'overridable here.',
      },
    );

    // ── Fargate service (own small cluster; the gateway cluster's name is a fixed
    // physical name inside ClaudeGatewayStack and is not exported) ──
    const cluster = new ecs.Cluster(this, 'Cluster', {
      vpc,
      containerInsightsV2: ecs.ContainerInsights.ENABLED,
    });

    const taskDef = new ecs.FargateTaskDefinition(this, 'BootstrapTask', {
      cpu: 256,
      memoryLimitMiB: 512,
    });

    // PKCE mode: the resource server validates the desktop app's Entra ACCESS
    // TOKEN (signature via the tenant JWKS + iss + aud + exp). Token validation
    // uses only the PUBLIC JWKS and the expected audience, so this task needs no
    // Secrets Manager entries at all.
    taskDef.addContainer('bootstrap', {
      image: ecs.ContainerImage.fromEcrRepository(repo, imageTag),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'bootstrap',
        logGroup: new logs.LogGroup(this, 'ServiceLogs', {
          retention: logs.RetentionDays.ONE_MONTH,
          removalPolicy: RemovalPolicy.DESTROY,
        }),
      }),
      portMappings: [{ containerPort: 8081 }],
      environment: {
        PORT: '8081',
        // The claude-apps-gateway origin: served as inferenceGatewayBaseUrl; the
        // app signs in to it with the gateway's own device-code flow, which is
        // independent of bootstrap mode.
        PUBLIC_ORIGIN: props.publicUrl,
        ENTRA_TENANT_ID: props.entraTenantId,
        ENTRA_AUDIENCE: props.desktopClientId,
        CONFIG_S3_URI: `s3://${configBucket.bucketName}/${CONFIG_KEY}`,
        // Authorization gate — passed through only when configured; empty = serve
        // every valid tenant token (single-tenant pilot boundary).
        ...(props.requiredGroups ? { ENTRA_REQUIRED_GROUPS: props.requiredGroups } : {}),
        ...(props.requiredRoles ? { ENTRA_REQUIRED_ROLES: props.requiredRoles } : {}),
      },
    });
    configBucket.grantRead(taskDef.taskRole);
    const grantReadReason =
      'grantRead object wildcard on the config bucket only; the task reads a single '
      + 'JSON object whose key is fixed but whose versions rotate.';
    ackNag(taskDef,
      { id: 'AwsSolutions-IAM5[Action::s3:GetBucket*]', reason: grantReadReason },
      { id: 'AwsSolutions-IAM5[Action::s3:GetObject*]', reason: grantReadReason },
      { id: 'AwsSolutions-IAM5[Action::s3:List*]', reason: grantReadReason },
      {
        id: `AwsSolutions-IAM5[Resource::<${this.getLogicalId(configBucket.node.defaultChild as s3.CfnBucket)}.Arn>/*]`,
        reason: grantReadReason,
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
          'All environment values are non-sensitive by design (PKCE mode): public origin, '
          + 'Entra tenant/audience IDs (public identifiers), S3 config URI. The task holds '
          + 'no secrets — token validation uses the public Entra JWKS.',
      },
    );

    const serviceSg = new ec2.SecurityGroup(this, 'ServiceSg', {
      vpc,
      description: 'Bootstrap service - ingress 8081 from the gateway ALB only',
      allowAllOutbound: true, // S3 config reads + Entra JWKS fetch
    });
    serviceSg.addIngressRule(albSg, ec2.Port.tcp(8081), 'bootstrap from gateway ALB');
    // The gateway sample's ALB SG uses RESTRICTED egress (only its own targets:
    // 8080/4318/13133), so health checks to this add-on's port are dropped unless
    // we author the matching egress rule. Owned by THIS stack; the gateway stack
    // remains unmodified.
    new ec2.CfnSecurityGroupEgress(this, 'AlbToBootstrap', {
      groupId: props.albSgId,
      destinationSecurityGroupId: serviceSg.securityGroupId,
      ipProtocol: 'tcp',
      fromPort: 8081,
      toPort: 8081,
      description: 'gateway ALB to bootstrap add-on targets',
    });

    const service = new ecs.FargateService(this, 'BootstrapService', {
      cluster,
      taskDefinition: taskDef,
      desiredCount: 1,
      securityGroups: [serviceSg],
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      assignPublicIp: false,
      minHealthyPercent: 0,
      circuitBreaker: { rollback: true },
    });

    // ── Attach to the gateway's existing HTTPS listener: one path rule ahead of
    // the listener's default forward to the gateway target group. ──
    const tg = new elbv2.ApplicationTargetGroup(this, 'BootstrapTg', {
      vpc,
      port: 8081,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [service],
      healthCheck: {
        path: '/healthz',
        healthyHttpCodes: '200',
        interval: Duration.seconds(30),
      },
      deregistrationDelay: Duration.seconds(10),
    });
    new elbv2.ApplicationListenerRule(this, 'BootstrapRule', {
      listener,
      priority: 5,
      conditions: [
        elbv2.ListenerCondition.hostHeaders([gatewayHost]),
        elbv2.ListenerCondition.pathPatterns(['/user/bootstrap']),
      ],
      action: elbv2.ListenerAction.forward([tg]),
    });

    new CfnOutput(this, 'BootstrapUrl', { value: `${props.publicUrl}/user/bootstrap` });
  }
}
