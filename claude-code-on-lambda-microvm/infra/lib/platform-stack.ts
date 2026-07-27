import { createRequire } from 'node:module';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as events from 'aws-cdk-lib/aws-events';
import * as eventTargets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { applyNagAcknowledgements } from './nag-acks.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(here, '../..');
const require = createRequire(import.meta.url);

export class PlatformStack extends cdk.Stack {
  public constructor(
    scope: Construct,
    id: string,
    props?: cdk.StackProps,
  ) {
    super(scope, id, props);
    assertLocalEsbuild();

    const projectName = new cdk.CfnParameter(this, 'ProjectName', {
      type: 'String',
      default: 'claude-microvm',
      allowedPattern: '[a-z][a-z0-9-]{2,30}',
      description: 'Lowercase prefix used for named resources.',
    });
    const vpcCidr =
      this.node.tryGetContext('vpcCidr') ?? '10.42.0.0/16';
    const inferenceMode =
      this.node.tryGetContext('inferenceMode') ?? 'bedrock';
    if (
      inferenceMode !== 'claude-gateway' &&
      inferenceMode !== 'bedrock'
    ) {
      throw new Error(
        'inferenceMode context must be claude-gateway or bedrock',
      );
    }
    const bedrockModelId =
      this.node.tryGetContext('bedrockModelId') ??
      'us.anthropic.claude-sonnet-4-6';
    if (
      inferenceMode === 'bedrock' &&
      !/^(?:us|global)\.anthropic\.claude-[A-Za-z0-9._:-]{1,180}$/.test(
        bedrockModelId,
      )
    ) {
      throw new Error('bedrockModelId is not an approved Claude model ID');
    }
    const createClientVpn = contextBoolean(
      this.node.tryGetContext('createClientVpn'),
      false,
    );
    const enableAgentCore = contextBoolean(
      this.node.tryGetContext('enableAgentCore'),
      false,
    );
    const enablePortal = contextBoolean(
      this.node.tryGetContext('enablePortal'),
      false,
    );
    const allowClaudeAiSubscription = contextBoolean(
      this.node.tryGetContext('allowClaudeAiSubscription'),
      false,
    );

    const vpnClientCidr = new cdk.CfnParameter(this, 'VpnClientCidr', {
      type: 'String',
      default: '10.100.0.0/22',
      description:
        'Client VPN address pool, or the trusted client CIDR when the sample VPN is disabled.',
    });
    const claudeGatewayUrl =
      inferenceMode === 'claude-gateway'
        ? new cdk.CfnParameter(this, 'ClaudeGatewayUrl', {
            type: 'String',
            description:
              'Private HTTPS origin of the separately deployed Claude Apps Gateway.',
          })
        : undefined;
    const claudeGatewayCidr =
      inferenceMode === 'claude-gateway'
        ? new cdk.CfnParameter(this, 'ClaudeGatewayCidr', {
            type: 'String',
            allowedPattern:
              '(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.' +
              '(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.' +
              '(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.' +
              '(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)/(3[0-2]|[12]?[0-9])',
            description:
              'Exact private destination CIDR containing the Claude Apps Gateway.',
          })
        : undefined;
    const clientVpnServerCertificateArn = createClientVpn
      ? new cdk.CfnParameter(this, 'ClientVpnServerCertificateArn', {
          type: 'String',
          description:
            'Imported ACM server certificate for the managed Client VPN endpoint.',
        })
      : undefined;
    const clientVpnRootCertificateArn = createClientVpn
      ? new cdk.CfnParameter(this, 'ClientVpnRootCertificateArn', {
          type: 'String',
          description:
            'Imported ACM client certificate whose chain authorizes mutual-TLS VPN clients.',
        })
      : undefined;
    const agentCoreGatewayUrl = enableAgentCore
      ? new cdk.CfnParameter(this, 'AgentCoreGatewayUrl', {
          type: 'String',
          description: 'IAM-authorized AgentCore Gateway MCP URL.',
        })
      : undefined;
    const agentCoreGatewayArn = enableAgentCore
      ? new cdk.CfnParameter(this, 'AgentCoreGatewayArn', {
          type: 'String',
          description:
            'AgentCore Gateway ARN used to scope the MicroVM execution role.',
        })
      : undefined;
    const idleAfterSeconds = new cdk.CfnParameter(
      this,
      'IdleAfterSeconds',
      {
        type: 'Number',
        default: 900,
        minValue: 60,
        maxValue: 7200,
        description:
          'Seconds without native shell traffic before Lambda suspends the MicroVM.',
      },
    );
    const suspendedRetentionSeconds = new cdk.CfnParameter(
      this,
      'SuspendedRetentionSeconds',
      {
        type: 'Number',
        default: 3600,
        minValue: 300,
        maxValue: 21600,
        description:
          'Seconds a suspended MicroVM is retained before Lambda terminates it.',
      },
    );

    const vpc = new ec2.Vpc(this, 'Vpc', {
      ipAddresses: ec2.IpAddresses.cidr(vpcCidr),
      maxAzs: 2,
      natGateways: 1,
      restrictDefaultSecurityGroup: true,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'isolated',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 28,
          name: 'public-egress',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    const dataKey = new kms.Key(this, 'DataKey', {
      alias: `alias/${projectName.valueAsString}-data`,
      description:
        'Encrypts Claude MicroVM workspace archives and session data.',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    const workspaceBucket = new s3.Bucket(this, 'WorkspaceBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      bucketKeyEnabled: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: dataKey,
      enforceSSL: true,
      versioned: true,
      lifecycleRules: [
        {
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(1),
          noncurrentVersionExpiration: cdk.Duration.days(90),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    const artifactBucket = new s3.Bucket(this, 'ArtifactBucket', {
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      bucketKeyEnabled: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: dataKey,
      enforceSSL: true,
      versioned: true,
      lifecycleRules: [
        {
          expiration: cdk.Duration.days(30),
          noncurrentVersionExpiration: cdk.Duration.days(7),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const sessions = new dynamodb.Table(this, 'Sessions', {
      partitionKey: {
        name: 'sessionId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: dataKey,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      timeToLiveAttribute: 'expiresAt',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    const workspaceClaims = new dynamodb.Table(this, 'WorkspaceClaims', {
      partitionKey: {
        name: 'workspaceKey',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: dataKey,
      timeToLiveAttribute: 'expiresAt',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    sessions.addGlobalSecondaryIndex({
      indexName: 'owner-updated-index',
      partitionKey: {
        name: 'ownerHash',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'updatedAt',
        type: dynamodb.AttributeType.NUMBER,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });
    sessions.addGlobalSecondaryIndex({
      indexName: 'state-updated-index',
      partitionKey: {
        name: 'state',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'updatedAt',
        type: dynamodb.AttributeType.NUMBER,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const microvmConnectorSg = new ec2.SecurityGroup(
      this,
      'MicrovmConnectorSecurityGroup',
      {
        vpc,
        allowAllOutbound: false,
        // GroupDescription is immutable. Keep the deployed value so adding
        // NAT egress does not replace the SG beneath an active connector.
        description:
          'Egress allowed from Lambda MicroVMs to approved private services.',
      },
    );
    const endpointSg = new ec2.SecurityGroup(
      this,
      'EndpointSecurityGroup',
      {
        vpc,
        allowAllOutbound: false,
        description:
          'Workload interface endpoints: TLS from approved AWS workloads.',
      },
    );
    const apiEndpointSg = new ec2.SecurityGroup(
      this,
      'ApiEndpointSecurityGroup',
      {
        vpc,
        allowAllOutbound: false,
        description:
          'Private execute-api endpoint: TLS from corporate VPN clients.',
      },
    );
    const clientVpnSg = createClientVpn
      ? new ec2.SecurityGroup(this, 'ClientVpnSecurityGroup', {
          vpc,
          allowAllOutbound: false,
          description:
            'Managed Client VPN: private TLS access to the control API.',
        })
      : undefined;
    const vpnClientPeer: ec2.IPeer =
      clientVpnSg ?? ec2.Peer.ipv4(vpnClientCidr.valueAsString);

    endpointSg.addIngressRule(
      microvmConnectorSg,
      ec2.Port.tcp(443),
      'Lambda MicroVMs',
    );
    apiEndpointSg.addIngressRule(
      vpnClientPeer,
      ec2.Port.tcp(443),
      'VPN clients calling the private control API',
    );
    apiEndpointSg.addIngressRule(
      microvmConnectorSg,
      ec2.Port.tcp(443),
      'MicroVM agents refreshing checkpoint URLs',
    );
    microvmConnectorSg.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS through private endpoints, peering, or the managed NAT gateway',
    );
    if (clientVpnSg) {
      clientVpnSg.addEgressRule(
        apiEndpointSg,
        ec2.Port.tcp(443),
        'Private lifecycle API',
      );
      const resolverPeer = ec2.Peer.ipv4(
        `${vpcResolverAddress(vpcCidr)}/32`,
      );
      clientVpnSg.addEgressRule(
        resolverPeer,
        ec2.Port.udp(53),
        'VPC DNS resolver',
      );
      clientVpnSg.addEgressRule(
        resolverPeer,
        ec2.Port.tcp(53),
        'VPC DNS resolver over TCP',
      );
      if (claudeGatewayCidr) {
        clientVpnSg.addEgressRule(
          ec2.Peer.ipv4(claudeGatewayCidr.valueAsString),
          ec2.Port.tcp(443),
          'Claude Apps Gateway sign-in',
        );
      }
    }

    const clientVpnEndpoint = clientVpnSg
      ? new ec2.ClientVpnEndpoint(this, 'ClientVpnEndpoint', {
          vpc,
          cidr: vpnClientCidr.valueAsString,
          clientCertificateArn:
            clientVpnRootCertificateArn!.valueAsString,
          serverCertificateArn:
            clientVpnServerCertificateArn!.valueAsString,
          authorizeAllUsersToVpcCidr: true,
          clientLoginBanner:
            'Private Claude Code MicroVM development environment',
          description:
            'Mutual-TLS access to the private Claude MicroVM control API',
          disconnectOnSessionTimeout: true,
          dnsServers: [vpcResolverAddress(vpcCidr)],
          logGroup: new logs.LogGroup(this, 'ClientVpnLogGroup', {
            logGroupName: `/${projectName.valueAsString}/client-vpn`,
            retention: logs.RetentionDays.THREE_MONTHS,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
          }),
          logging: true,
          port: ec2.VpnPort.HTTPS,
          securityGroups: [clientVpnSg],
          selfServicePortal: false,
          sessionTimeout: ec2.ClientVpnSessionTimeout.EIGHT_HOURS,
          splitTunnel: true,
          transportProtocol: ec2.TransportProtocol.UDP,
          vpcSubnets: {
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          },
        })
      : undefined;
    if (clientVpnEndpoint && claudeGatewayCidr) {
      // Split-tunnel clients only receive routes the endpoint
      // advertises; without these the browser cannot reach the
      // Claude Apps Gateway for SSO sign-in.
      clientVpnEndpoint.addAuthorizationRule('ClaudeGatewayAuth', {
        cidr: claudeGatewayCidr.valueAsString,
        description: 'Claude Apps Gateway sign-in',
      });
      vpc.privateSubnets.forEach((subnet, index) => {
        clientVpnEndpoint.addRoute(`ClaudeGatewayRoute${index}`, {
          cidr: claudeGatewayCidr.valueAsString,
          target: ec2.ClientVpnRouteTarget.subnet(subnet),
          description: 'Claude Apps Gateway sign-in',
        });
      });
    }

    const s3Endpoint = vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [
        {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });
    s3Endpoint.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:GetObject', 's3:PutObject'],
        resources: [
          workspaceBucket.arnForObjects('*'),
          artifactBucket.arnForObjects('*'),
        ],
      }),
    );
    const addInterfaceEndpoint = (
      id: string,
      service: ec2.IInterfaceVpcEndpointService,
      securityGroup = endpointSg,
    ): ec2.InterfaceVpcEndpoint =>
      vpc.addInterfaceEndpoint(id, {
        service,
        open: false,
        privateDnsEnabled: true,
        securityGroups: [securityGroup],
        subnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      });
    addInterfaceEndpoint(
      'LogsEndpoint',
      ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
    );
    const executeApiEndpoint = addInterfaceEndpoint(
      'ExecuteApiEndpoint',
      ec2.InterfaceVpcEndpointAwsService.APIGATEWAY,
      apiEndpointSg,
    );
    const bedrockRuntimeEndpoint =
      inferenceMode === 'bedrock'
        ? addInterfaceEndpoint(
            'BedrockRuntimeEndpoint',
            new ec2.InterfaceVpcEndpointService(
              `com.amazonaws.${this.region}.bedrock-runtime`,
              443,
            ),
          )
        : undefined;
    const agentCoreEndpoint = enableAgentCore
      ? addInterfaceEndpoint(
          'AgentCoreGatewayEndpoint',
          new ec2.InterfaceVpcEndpointService(
            `com.amazonaws.${this.region}.bedrock-agentcore.gateway`,
            443,
          ),
        )
      : undefined;

    const microvmExecutionRole = new iam.Role(
      this,
      'MicrovmExecutionRole',
      {
        assumedBy: new iam.ServicePrincipal(
          'lambda.amazonaws.com',
        ).withSessionTags(),
        description:
          'Runtime role for Claude MicroVMs; deliberately has no workspace S3 access.',
      },
    );
    microvmExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'logs:CreateLogStream',
          'logs:PutLogEvents',
          'logs:DescribeLogStreams',
        ],
        resources: [
          `arn:${this.partition}:logs:${this.region}:${this.account}:` +
            `log-group:/${projectName.valueAsString}/microvms:*`,
        ],
      }),
    );
    if (enableAgentCore) {
      const invokeAgentCore = new iam.PolicyStatement({
        actions: ['bedrock-agentcore:InvokeGateway'],
        resources: [agentCoreGatewayArn!.valueAsString],
      });
      microvmExecutionRole.addToPolicy(invokeAgentCore);
      agentCoreEndpoint!.addToPolicy(
        new iam.PolicyStatement({
          actions: ['bedrock-agentcore:InvokeGateway'],
          principals: [microvmExecutionRole],
          resources: [agentCoreGatewayArn!.valueAsString],
        }),
      );
    }
    if (inferenceMode === 'bedrock') {
      const bedrockResources = [
        this.formatArn({
          service: 'bedrock',
          resource: 'inference-profile',
          resourceName: bedrockModelId,
        }),
        `arn:${this.partition}:bedrock:*::foundation-model/` +
          bedrockModelId.replace(/^(?:us|global)\./, ''),
      ];
      const invokeBedrock = new iam.PolicyStatement({
        actions: [
          'bedrock:InvokeModel',
          'bedrock:InvokeModelWithResponseStream',
        ],
        resources: bedrockResources,
      });
      microvmExecutionRole.addToPolicy(invokeBedrock);
      bedrockRuntimeEndpoint!.addToPolicy(
        new iam.PolicyStatement({
          actions: [
            'bedrock:InvokeModel',
            'bedrock:InvokeModelWithResponseStream',
          ],
          principals: [microvmExecutionRole],
          resources: bedrockResources,
        }),
      );
    }

    const buildRole = new iam.Role(this, 'MicrovmBuildRole', {
      assumedBy: new iam.ServicePrincipal(
        'lambda.amazonaws.com',
      ).withSessionTags(),
      description: 'Build role for the Lambda MicroVM image.',
    });
    artifactBucket.grantRead(buildRole);
    dataKey.grantDecrypt(buildRole);
    buildRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
        resources: [
          `arn:${this.partition}:logs:${this.region}:${this.account}:` +
            'log-group:/aws/lambda/microvms/*',
          `arn:${this.partition}:logs:${this.region}:${this.account}:` +
            `log-group:/${projectName.valueAsString}/microvms`,
          `arn:${this.partition}:logs:${this.region}:${this.account}:` +
            `log-group:/${projectName.valueAsString}/microvms:*`,
        ],
      }),
    );

    const connectorOperatorRole = new iam.Role(
      this,
      'NetworkConnectorOperatorRole',
      {
        assumedBy: new iam.ServicePrincipal(
          'network-connectors.lambda.amazonaws.com',
        ),
        description:
          'Allows Lambda Network Connectors to manage connector ENIs.',
      },
    );
    connectorOperatorRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'ec2:CreateNetworkInterface',
          'ec2:DeleteNetworkInterface',
          'ec2:DescribeNetworkInterfaces',
          'ec2:DescribeSubnets',
          'ec2:DescribeSecurityGroups',
          'ec2:DescribeVpcs',
        ],
        resources: ['*'],
      }),
    );
    connectorOperatorRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['ec2:CreateTags'],
        resources: [
          `arn:${this.partition}:ec2:${this.region}:${this.account}:` +
            'network-interface/*',
        ],
        conditions: {
          StringEquals: {
            'ec2:ManagedResourceOperator':
              'network-connectors.lambda.amazonaws.com',
          },
        },
      }),
    );

    const microvmLogGroup = new logs.LogGroup(
      this,
      'MicrovmLogGroup',
      {
        logGroupName: `/${projectName.valueAsString}/microvms`,
        retention: logs.RetentionDays.THREE_MONTHS,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      },
    );
    const imageParameter = new ssm.StringParameter(
      this,
      'ImageParameter',
      {
        parameterName:
          `/${projectName.valueAsString}/microvm/image-arn`,
        simpleName: false,
        stringValue: 'UNPROVISIONED',
        description: 'Populated by scripts/provision-microvm.ts.',
      },
    );
    const connectorParameter = new ssm.StringParameter(
      this,
      'ConnectorParameter',
      {
        parameterName:
          `/${projectName.valueAsString}/microvm/network-connector-arn`,
        simpleName: false,
        stringValue: 'UNPROVISIONED',
        description: 'Populated by scripts/provision-microvm.ts.',
      },
    );

    const controlLogGroup = new logs.LogGroup(
      this,
      'ControlLogGroup',
      {
        logGroupName: `/${projectName.valueAsString}/control-plane`,
        retention: logs.RetentionDays.THREE_MONTHS,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      },
    );
    const controlFunction = new lambdaNode.NodejsFunction(
      this,
      'ControlFunction',
      {
        runtime: lambda.Runtime.NODEJS_22_X,
        architecture: lambda.Architecture.ARM_64,
        entry: path.join(
          repositoryRoot,
          'control-plane/src/handler.ts',
        ),
        handler: 'handler',
        timeout: cdk.Duration.seconds(30),
        memorySize: 512,
        logGroup: controlLogGroup,
        environment: {
          AGENTCORE_GATEWAY_URL:
            agentCoreGatewayUrl?.valueAsString ?? '',
          ALLOW_CLAUDE_AI_SUBSCRIPTION: String(
            allowClaudeAiSubscription,
          ),
          BEDROCK_MODEL_ID:
            inferenceMode === 'bedrock' ? bedrockModelId : '',
          CLAUDE_GATEWAY_URL:
            claudeGatewayUrl?.valueAsString ?? '',
          CONNECTOR_PARAMETER_NAME: connectorParameter.parameterName,
          IDLE_AFTER_SECONDS: idleAfterSeconds.valueAsString,
          IMAGE_PARAMETER_NAME: imageParameter.parameterName,
          INFERENCE_MODE: inferenceMode,
          MICROVM_EXECUTION_ROLE_ARN: microvmExecutionRole.roleArn,
          MICROVM_LOG_GROUP: microvmLogGroup.logGroupName,
          SESSION_TABLE_NAME: sessions.tableName,
          SUSPENDED_RETENTION_SECONDS:
            suspendedRetentionSeconds.valueAsString,
          WORKSPACE_BUCKET_NAME: workspaceBucket.bucketName,
          WORKSPACE_CLAIM_TABLE_NAME: workspaceClaims.tableName,
        },
        bundling: {
          minify: true,
          sourceMap: true,
          externalModules: [],
        },
      },
    );
    sessions.grantReadWriteData(controlFunction);
    workspaceClaims.grantReadWriteData(controlFunction);
    workspaceBucket.grantReadWrite(controlFunction);
    dataKey.grantEncryptDecrypt(controlFunction);
    controlFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['dynamodb:TransactWriteItems'],
        resources: [sessions.tableArn, workspaceClaims.tableArn],
      }),
    );
    imageParameter.grantRead(controlFunction);
    connectorParameter.grantRead(controlFunction);
    controlFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'lambda:CreateMicrovmShellAuthToken',
          'lambda:GetMicrovm',
          'lambda:ListMicrovms',
          'lambda:ResumeMicrovm',
          'lambda:RunMicrovm',
          'lambda:SuspendMicrovm',
          'lambda:TerminateMicrovm',
        ],
        resources: ['*'],
      }),
    );
    controlFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['lambda:PassNetworkConnector'],
        resources: ['*'],
      }),
    );
    controlFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['iam:PassRole'],
        resources: [microvmExecutionRole.roleArn],
      }),
    );

    new events.Rule(this, 'IdleReaperSchedule', {
      description:
        'Reconciles stored session state with native MicroVM lifecycle state.',
      schedule: events.Schedule.rate(cdk.Duration.minutes(1)),
      targets: [
        new eventTargets.LambdaFunction(controlFunction, {
          event: events.RuleTargetInput.fromObject({
            source: 'session-reconciler',
          }),
        }),
      ],
    });

    const api = new apigateway.RestApi(this, 'ControlApi', {
      restApiName: `${projectName.valueAsString}-control`,
      description:
        'Private IAM-authenticated lifecycle API for Claude MicroVM sessions.',
      endpointConfiguration: {
        types: [apigateway.EndpointType.PRIVATE],
        vpcEndpoints: [executeApiEndpoint],
      },
      cloudWatchRole: true,
      deployOptions: {
        stageName: 'v1',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: false,
        metricsEnabled: true,
        accessLogDestination:
          new apigateway.LogGroupLogDestination(
            new logs.LogGroup(this, 'ApiAccessLogGroup', {
              retention: logs.RetentionDays.THREE_MONTHS,
              removalPolicy: cdk.RemovalPolicy.DESTROY,
            }),
          ),
        accessLogFormat:
          apigateway.AccessLogFormat.jsonWithStandardFields({
            caller: true,
            httpMethod: true,
            ip: true,
            protocol: true,
            requestTime: true,
            resourcePath: true,
            responseLength: true,
            status: true,
            user: true,
          }),
      },
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['execute-api:Invoke'],
            principals: [new iam.AnyPrincipal()],
            resources: ['execute-api:/*'],
            conditions: {
              StringEquals: {
                'aws:SourceVpce': executeApiEndpoint.vpcEndpointId,
              },
            },
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.DENY,
            actions: ['execute-api:Invoke'],
            principals: [new iam.AnyPrincipal()],
            resources: ['execute-api:/*'],
            conditions: {
              StringNotEquals: {
                'aws:SourceVpce': executeApiEndpoint.vpcEndpointId,
              },
            },
          }),
        ],
      }),
    });
    const integration = new apigateway.LambdaIntegration(
      controlFunction,
      { proxy: true },
    );
    const methodOptions: apigateway.MethodOptions = {
      authorizationType: apigateway.AuthorizationType.IAM,
    };
    const sessionResource = api.root.addResource('sessions');
    sessionResource.addMethod('GET', integration, methodOptions);
    sessionResource.addMethod('POST', integration, methodOptions);
    const byId = sessionResource.addResource('{sessionId}');
    byId.addMethod('GET', integration, methodOptions);
    byId.addMethod('DELETE', integration, methodOptions);
    byId
      .addResource('connect')
      .addMethod('POST', integration, methodOptions);
    byId
      .addResource('suspend')
      .addMethod('POST', integration, methodOptions);
    byId
      .addResource('resume')
      .addMethod('POST', integration, methodOptions);
    byId
      .addResource('checkpoint-urls')
      .addMethod('POST', integration, methodOptions);
    microvmExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['execute-api:Invoke'],
        resources: [
          api.arnForExecuteApi(
            'POST',
            '/sessions/*/checkpoint-urls',
            api.deploymentStage.stageName,
          ),
        ],
      }),
    );

    if (enablePortal) {
      // The browser portal reuses the private API: static assets
      // come from a tiny dedicated Lambda (no bucket, no CDN), and
      // /portal/sessions* mirrors the IAM session routes behind a
      // Cognito user pool authorizer created by this stack.
      const tunnelAuthJobs = new dynamodb.Table(
        this,
        'TunnelAuthJobs',
        {
          partitionKey: {
            name: 'sessionId',
            type: dynamodb.AttributeType.STRING,
          },
          billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
          encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
          encryptionKey: dataKey,
          timeToLiveAttribute: 'expiresAt',
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        },
      );
      const tunnelAuthWorker = new lambdaNode.NodejsFunction(
        this,
        'TunnelAuthWorker',
        {
          runtime: lambda.Runtime.NODEJS_22_X,
          architecture: lambda.Architecture.ARM_64,
          entry: path.join(
            repositoryRoot,
            'control-plane/src/tunnel-auth-worker.ts',
          ),
          handler: 'handler',
          timeout: cdk.Duration.minutes(15),
          memorySize: 256,
          logGroup: new logs.LogGroup(
            this,
            'TunnelAuthWorkerLogGroup',
            {
              logGroupName:
                `/${projectName.valueAsString}/tunnel-auth-worker`,
              retention: logs.RetentionDays.ONE_MONTH,
              removalPolicy: cdk.RemovalPolicy.DESTROY,
            },
          ),
          environment: {
            SESSION_TABLE_NAME: sessions.tableName,
            TUNNEL_AUTH_TABLE_NAME: tunnelAuthJobs.tableName,
          },
          bundling: {
            minify: true,
            sourceMap: true,
            externalModules: [],
          },
        },
      );
      sessions.grantReadData(tunnelAuthWorker);
      tunnelAuthJobs.grantReadWriteData(tunnelAuthWorker);
      dataKey.grantEncryptDecrypt(tunnelAuthWorker);
      tunnelAuthWorker.addToRolePolicy(
        new iam.PolicyStatement({
          actions: [
            'lambda:CreateMicrovmShellAuthToken',
            'lambda:GetMicrovm',
          ],
          resources: ['*'],
        }),
      );
      tunnelAuthJobs.grantReadWriteData(controlFunction);
      dataKey.grantEncryptDecrypt(controlFunction);
      tunnelAuthWorker.grantInvoke(controlFunction);
      controlFunction.addEnvironment(
        'TUNNEL_AUTH_TABLE_NAME',
        tunnelAuthJobs.tableName,
      );
      controlFunction.addEnvironment(
        'TUNNEL_AUTH_WORKER_ARN',
        tunnelAuthWorker.functionArn,
      );

      // The portal is a public client using the Cognito hosted UI
      // with the authorization-code + PKCE flow, so the app client
      // has no secret. Sign-up stays admin-only: operators create
      // portal users in the pool after deployment.
      // Built from the static stage name: referencing the stage
      // token here would make the app client depend on the stage,
      // whose deployment depends on methods that reference the
      // client's ID, a cyclic template.
      const portalUrl =
        `https://${api.restApiId}.execute-api.${this.region}.` +
        `${this.urlSuffix}/v1/portal`;
      const portalUserPool = new cognito.UserPool(
        this,
        'PortalUserPool',
        {
          selfSignUpEnabled: false,
          signInAliases: { email: true },
          autoVerify: { email: true },
          accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
          passwordPolicy: {
            minLength: 12,
            requireLowercase: true,
            requireUppercase: true,
            requireDigits: true,
            requireSymbols: true,
          },
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        },
      );
      // Cognito hosted UI prefixes are region-global, so derive a
      // stable unique suffix from the CloudFormation stack GUID.
      const portalDomainSuffix = cdk.Fn.select(
        0,
        cdk.Fn.split(
          '-',
          cdk.Fn.select(2, cdk.Fn.split('/', this.stackId)),
        ),
      );
      const portalUserPoolDomain = portalUserPool.addDomain(
        'PortalUserPoolDomain',
        {
          cognitoDomain: {
            domainPrefix: `claude-portal-${portalDomainSuffix}`,
          },
        },
      );
      const portalUserPoolClient = portalUserPool.addClient(
        'PortalUserPoolClient',
        {
          generateSecret: false,
          authFlows: { userSrp: true },
          oAuth: {
            flows: { authorizationCodeGrant: true },
            scopes: [
              cognito.OAuthScope.OPENID,
              cognito.OAuthScope.EMAIL,
              cognito.OAuthScope.PROFILE,
            ],
            callbackUrls: [portalUrl],
            logoutUrls: [portalUrl],
          },
          preventUserExistenceErrors: true,
        },
      );
      const portalAuthorizer =
        new apigateway.CognitoUserPoolsAuthorizer(
          this,
          'PortalAuthorizer',
          {
            cognitoUserPools: [portalUserPool],
            resultsCacheTtl: cdk.Duration.seconds(0),
          },
        );
      const portalMethodOptions: apigateway.MethodOptions = {
        authorizationType: apigateway.AuthorizationType.COGNITO,
        authorizer: portalAuthorizer,
      };
      const portalSiteFunction = new lambdaNode.NodejsFunction(
        this,
        'PortalSiteFunction',
        {
          runtime: lambda.Runtime.NODEJS_22_X,
          architecture: lambda.Architecture.ARM_64,
          entry: path.join(repositoryRoot, 'portal/handler.ts'),
          handler: 'handler',
          timeout: cdk.Duration.seconds(10),
          memorySize: 128,
          logGroup: new logs.LogGroup(this, 'PortalLogGroup', {
            logGroupName: `/${projectName.valueAsString}/portal`,
            retention: logs.RetentionDays.THREE_MONTHS,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
          }),
          environment: {
            PORTAL_CLIENT_ID:
              portalUserPoolClient.userPoolClientId,
            PORTAL_USER_POOL_DOMAIN:
              `${portalUserPoolDomain.domainName}.auth.` +
              `${this.region}.amazoncognito.com`,
          },
          bundling: {
            minify: true,
            sourceMap: true,
            externalModules: [],
          },
        },
      );
      const portalSiteIntegration = new apigateway.LambdaIntegration(
        portalSiteFunction,
        { proxy: true },
      );
      const siteMethodOptions: apigateway.MethodOptions = {
        authorizationType: apigateway.AuthorizationType.NONE,
      };
      const portal = api.root.addResource('portal');
      portal.addMethod('GET', portalSiteIntegration, siteMethodOptions);
      portal
        .addResource('app.js')
        .addMethod('GET', portalSiteIntegration, siteMethodOptions);
      portal
        .addResource('config.json')
        .addMethod('GET', portalSiteIntegration, siteMethodOptions);
      const portalSessions = portal.addResource('sessions');
      portalSessions.addMethod('GET', integration, portalMethodOptions);
      portalSessions.addMethod('POST', integration, portalMethodOptions);
      const portalById = portalSessions.addResource('{sessionId}');
      portalById.addMethod('GET', integration, portalMethodOptions);
      portalById.addMethod('DELETE', integration, portalMethodOptions);
      for (const actionPath of [
        'connect',
        'suspend',
        'resume',
      ]) {
        portalById
          .addResource(actionPath)
          .addMethod('POST', integration, portalMethodOptions);
      }
      const tunnelLogin = portalById.addResource('tunnel-login');
      tunnelLogin.addMethod(
        'POST',
        integration,
        portalMethodOptions,
      );
      tunnelLogin.addMethod(
        'GET',
        integration,
        portalMethodOptions,
      );
      tunnelLogin.addMethod(
        'DELETE',
        integration,
        portalMethodOptions,
      );
      new cdk.CfnOutput(this, 'PortalUrl', {
        value: portalUrl,
      });
      new cdk.CfnOutput(this, 'PortalUserPoolId', {
        value: portalUserPool.userPoolId,
      });
    }

    new cdk.CfnOutput(this, 'ArtifactBucketName', {
      value: artifactBucket.bucketName,
    });
    const projectNameOutput = new cdk.CfnOutput(
      this,
      'ProjectNameOutput',
      { value: projectName.valueAsString },
    );
    projectNameOutput.overrideLogicalId('ProjectName');
    new cdk.CfnOutput(this, 'BuildRoleArn', {
      value: buildRole.roleArn,
    });
    new cdk.CfnOutput(this, 'ConnectorOperatorRoleArn', {
      value: connectorOperatorRole.roleArn,
    });
    if (clientVpnEndpoint) {
      new cdk.CfnOutput(this, 'ClientVpnEndpointId', {
        value: clientVpnEndpoint.endpointId,
      });
    }
    new cdk.CfnOutput(this, 'ControlApiUrl', {
      value:
        `https://${api.restApiId}.execute-api.${this.region}.` +
        `${this.urlSuffix}/${api.deploymentStage.stageName}`,
    });
    new cdk.CfnOutput(this, 'DataKeyArn', {
      value: dataKey.keyArn,
    });
    new cdk.CfnOutput(this, 'ImageParameterName', {
      value: imageParameter.parameterName,
    });
    new cdk.CfnOutput(this, 'IsolatedRouteTableIds', {
      value: vpc.privateSubnets
        .map((subnet) => subnet.routeTable.routeTableId)
        .join(','),
    });
    new cdk.CfnOutput(this, 'IsolatedSubnetIds', {
      value: vpc.privateSubnets
        .map((subnet) => subnet.subnetId)
        .join(','),
    });
    new cdk.CfnOutput(
      this,
      'MicrovmConnectorSecurityGroupId',
      { value: microvmConnectorSg.securityGroupId },
    );
    new cdk.CfnOutput(this, 'MicrovmExecutionRoleArn', {
      value: microvmExecutionRole.roleArn,
    });
    new cdk.CfnOutput(this, 'MicrovmLogGroupName', {
      value: microvmLogGroup.logGroupName,
    });
    new cdk.CfnOutput(this, 'NetworkConnectorParameterName', {
      value: connectorParameter.parameterName,
    });
    new cdk.CfnOutput(this, 'SessionsTableName', {
      value: sessions.tableName,
    });
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
    });
    new cdk.CfnOutput(this, 'WorkspaceBucketName', {
      value: workspaceBucket.bucketName,
    });
    new cdk.CfnOutput(this, 'WorkspaceClaimsTableName', {
      value: workspaceClaims.tableName,
    });

    applyNagAcknowledgements(this, { bedrockModelId });
  }
}

function assertLocalEsbuild(): void {
  try {
    require.resolve('esbuild');
  } catch {
    throw new Error(
      'Local esbuild is required for CDK synthesis. Run npm ci; ' +
        'Docker fallback is intentionally disabled for this repository.',
    );
  }
}

function contextBoolean(
  value: unknown,
  defaultValue: boolean,
): boolean {
  if (value === undefined) {
    return defaultValue;
  }
  if (value === true || value === 'true') {
    return true;
  }
  if (value === false || value === 'false') {
    return false;
  }
  throw new Error('Boolean CDK context values must be true or false');
}

function vpcResolverAddress(cidr: string): string {
  const [address, prefixText, extra] = cidr.split('/');
  const octets = address?.split('.').map(Number) ?? [];
  const prefix = Number(prefixText);
  if (
    extra !== undefined ||
    octets.length !== 4 ||
    octets.some(
      (octet) =>
        !Number.isInteger(octet) || octet < 0 || octet > 255,
    ) ||
    !Number.isInteger(prefix) ||
    prefix < 0 ||
    prefix > 30
  ) {
    throw new Error(
      'vpcCidr must be an IPv4 CIDR with at least four addresses',
    );
  }
  const numericAddress =
    (((octets[0]! * 256 + octets[1]!) * 256 + octets[2]!) *
      256 +
      octets[3]!) >>>
    0;
  const mask =
    prefix === 0 ? 0 : (0xffff_ffff << (32 - prefix)) >>> 0;
  const resolver = ((numericAddress & mask) + 2) >>> 0;
  return [
    (resolver >>> 24) & 255,
    (resolver >>> 16) & 255,
    (resolver >>> 8) & 255,
    resolver & 255,
  ].join('.');
}
