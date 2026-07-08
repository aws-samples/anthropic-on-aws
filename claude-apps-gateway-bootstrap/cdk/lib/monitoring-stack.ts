import { Stack, StackProps, Duration, CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as path from 'path';
import { DeployConfig } from './config';
import { ackNag } from './nag';

interface MonitoringStackProps extends StackProps {
  readonly config: DeployConfig;
  readonly vpc: ec2.Vpc;
  /** ALB SG — the Lambda needs 443 ingress permitted into it. */
  readonly albSg: ec2.SecurityGroup;
}

/**
 * Spend observability: a VPC-resident Lambda polls the gateway's admin API
 * (/v1/organizations/spend_limits/effective, read-only key) every 5 minutes and
 * republishes per-user spend as CloudWatch metrics (namespace ClaudeGateway):
 * SpendToDate + CapUtilization by UserEmail/Period. An alarm fires when anyone
 * crosses 80% of a cap — BEFORE the gateway starts hard-blocking with 429s.
 *
 * Security posture: private subnets only, no public IP; egress to the internal
 * ALB over 443 (split-horizon DNS resolves the gateway host to the ALB's private
 * IP from inside the VPC); read-only admin key fetched from Secrets Manager at
 * invoke time via the VPC endpoint; CloudWatch calls via the monitoring VPC
 * endpoint. Nothing traverses the internet.
 */
export class MonitoringStack extends Stack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);
    const { config, vpc, albSg } = props;

    const fnSg = new ec2.SecurityGroup(this, 'SpendMetricsSg', {
      vpc,
      description: 'Spend-metrics Lambda - egress only',
      allowAllOutbound: true,
    });
    // The ingress rule must be authored HERE (CfnSecurityGroupIngress), not via
    // albSg.addIngressRule — that would place the rule in NetworkStack and make
    // Network depend on Monitoring while Monitoring depends on Network (cycle).
    new ec2.CfnSecurityGroupIngress(this, 'AlbFromSpendMetrics', {
      groupId: albSg.securityGroupId,
      sourceSecurityGroupId: fnSg.securityGroupId,
      ipProtocol: 'tcp',
      fromPort: 443,
      toPort: 443,
      description: 'spend-metrics lambda to internal ALB', // EC2 forbids '>' in descriptions
    });

    const readKey = secretsmanager.Secret.fromSecretCompleteArn(
      this, 'AdminReadKey', config.secrets.gatewayAdminReadKeyArn);

    const fn = new lambda.Function(this, 'SpendMetricsFn', {
      runtime: lambda.Runtime.NODEJS_24_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '..', '..', 'lambda', 'spend-metrics')),
      timeout: Duration.seconds(60),
      memorySize: 128,
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [fnSg],
      logGroup: new logs.LogGroup(this, 'SpendMetricsLogs', {
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: RemovalPolicy.DESTROY,
      }),
      environment: {
        GATEWAY_ORIGIN: `https://${config.gatewayHost}`,
        READ_KEY_ARN: config.secrets.gatewayAdminReadKeyArn,
      },
    });
    readKey.grantRead(fn);
    fn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['cloudwatch:PutMetricData'],
        resources: ['*'],
        conditions: { StringEquals: { 'cloudwatch:namespace': 'ClaudeGateway' } },
      }),
    );
    ackNag(fn,
      {
        id: 'AwsSolutions-IAM4[Policy::arn:<AWS::Partition>:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole]',
        reason:
          'AWS baseline execution policy (CloudWatch Logs write only), attached by the '
          + 'aws-cdk-lib Function construct.',
      },
      {
        id: 'AwsSolutions-IAM4[Policy::arn:<AWS::Partition>:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole]',
        reason:
          'AWSLambdaVPCAccessExecutionRole is the AWS baseline for VPC-attached Lambdas '
          + '(ENI lifecycle + CloudWatch Logs); no narrower managed policy exists and the '
          + 'inline equivalent would be identical.',
      },
      {
        id: 'AwsSolutions-IAM5[Resource::*]',
        reason:
          'cloudwatch:PutMetricData does not support resource-level scoping (resource must '
          + 'be *); the grant is instead condition-scoped to the ClaudeGateway namespace.',
      },
    );

    // --- Spend-admin MCP tools Lambda (AgentCore Gateway target) ---
    // Same network posture as the metrics poller (same SG -> same ALB ingress rule).
    // Invoked by the AgentCore gateway (CUSTOM_JWT: Entra tenant, spend-admin app
    // audience, assignment-required = admin-only). Read-only by construction.
    const adminFn = new lambda.Function(this, 'SpendAdminMcpFn', {
      runtime: lambda.Runtime.NODEJS_24_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '..', '..', 'lambda', 'spend-admin-mcp')),
      timeout: Duration.seconds(30),
      memorySize: 128,
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [fnSg],
      logGroup: new logs.LogGroup(this, 'SpendAdminLogs', {
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: RemovalPolicy.DESTROY,
      }),
      environment: {
        GATEWAY_ORIGIN: `https://${config.gatewayHost}`,
        READ_KEY_ARN: config.secrets.gatewayAdminReadKeyArn,
      },
    });
    readKey.grantRead(adminFn);
    ackNag(adminFn,
      {
        id: 'AwsSolutions-IAM4[Policy::arn:<AWS::Partition>:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole]',
        reason:
          'AWS baseline execution policy (CloudWatch Logs write only), attached by the '
          + 'aws-cdk-lib Function construct.',
      },
      {
        id: 'AwsSolutions-IAM4[Policy::arn:<AWS::Partition>:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole]',
        reason:
          'AWSLambdaVPCAccessExecutionRole is the AWS baseline for VPC-attached Lambdas '
          + '(ENI lifecycle + CloudWatch Logs); no narrower managed policy exists.',
      },
    );
    adminFn.addPermission('AgentCoreInvoke', {
      principal: new iam.ServicePrincipal('bedrock-agentcore.amazonaws.com'),
      action: 'lambda:InvokeFunction',
      sourceAccount: this.account,
    });
    new CfnOutput(this, 'SpendAdminMcpFnArn', { value: adminFn.functionArn });

    // --- web-search MCP relay Lambda (AgentCore Gateway target, in-region) ---
    // Client-facing search moves to an ap-southeast-2 gateway (OAuth + VPC endpoint);
    // this relays tools/call to the upstream us-east-1 web-search gateway server-side.
    const searchFn = new lambda.Function(this, 'WebSearchMcpFn', {
      runtime: lambda.Runtime.NODEJS_24_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '..', '..', 'lambda', 'websearch-mcp')),
      timeout: Duration.seconds(30),
      memorySize: 128,
      // NOT in the VPC: it needs internet egress to the us-east-1 gateway, and it reads no
      // VPC-internal data. Keeping it out avoids NAT hops for every search.
      logGroup: new logs.LogGroup(this, 'WebSearchLogs', {
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: RemovalPolicy.DESTROY,
      }),
      environment: {
        // Upstream web-search MCP gateway (deployment-specific; see deployment.config.json)
        UPSTREAM_MCP_URL: config.webSearchUpstreamUrl ?? '',
        UPSTREAM_TOOL_NAME: config.webSearchUpstreamTool ?? '',
      },
    });
    ackNag(searchFn,{
      id: 'AwsSolutions-IAM4[Policy::arn:<AWS::Partition>:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole]',
      reason:
        'AWSLambdaBasicExecutionRole (CloudWatch Logs write only) on a non-VPC relay '
        + 'Lambda holding no credentials; the upstream MCP URL/tool are plain config.',
    });
    searchFn.addPermission('AgentCoreInvoke', {
      principal: new iam.ServicePrincipal('bedrock-agentcore.amazonaws.com'),
      action: 'lambda:InvokeFunction',
      sourceAccount: this.account,
    });
    new CfnOutput(this, 'WebSearchMcpFnArn', { value: searchFn.functionArn });

    new events.Rule(this, 'Every5Min', {
      schedule: events.Schedule.rate(Duration.minutes(5)),
      targets: [new targets.LambdaFunction(fn, { retryAttempts: 1 })],
    });

    // Alarm when ANY user crosses 80% of any cap. MathExpression over a metric-insights
    // query aggregates across all UserEmail/Period dimension combinations.
    const maxUtilization = new cloudwatch.MathExpression({
      // "Period" is a reserved keyword in Metrics Insights — must be double-quoted.
      expression: 'SELECT MAX(CapUtilization) FROM SCHEMA(ClaudeGateway, UserEmail, "Period")',
      period: Duration.minutes(5),
      label: 'max cap utilization (any user, any period)',
    });
    new cloudwatch.Alarm(this, 'CapNearlyReached', {
      alarmName: 'claude-gateway-spend-cap-80pct',
      alarmDescription:
        'A user is over 80% of their Claude gateway spend cap and will be 429-blocked at 100%. '
        + 'Check scripts/07-quota.sh spend.',
      metric: maxUtilization,
      threshold: 80,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
  }
}
