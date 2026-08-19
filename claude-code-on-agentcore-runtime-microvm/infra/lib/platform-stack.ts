import { createRequire } from 'node:module';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as bedrockagentcore from 'aws-cdk-lib/aws-bedrockagentcore';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as events from 'aws-cdk-lib/aws-events';
import * as eventTargets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { applyNagAcknowledgements } from './nag-acks.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(here, '../..');
const require = createRequire(import.meta.url);
const BEDROCK_INFERENCE_PROFILE_PREFIX = /^(?:us|eu|au|global)\./;
const BEDROCK_MODEL_ID_PATTERN =
  /^(?:(?:us|eu|au|global)\.)?anthropic\.claude-[A-Za-z0-9._:-]{1,180}$/;

/**
 * AgentCore-Runtime-native platform stack.
 *
 * This is the AgentCore Runtime equivalent of `ClaudeMicrovmStack` from the
 * `claude-code-on-lambda-microvm` sample: same VPC/KMS/S3/DynamoDB/Cognito
 * shape, but the developer sandbox compute is one `AWS::BedrockAgentCore::
 * Runtime` (microVM compute type, container artifact) instead of a Lambda
 * MicroVM image + Network Connector. See docs/deployment-guide.md for the
 * full comparison and the reasons a few lifecycle operations are emulated
 * rather than mapped 1:1 onto an AgentCore Runtime control-plane API.
 */
export class AgentCoreRuntimeStack extends cdk.Stack {
  public constructor(
    scope: Construct,
    id: string,
    props?: cdk.StackProps,
  ) {
    super(scope, id, props);
    assertLocalEsbuild();

    const projectName: string =
      this.node.tryGetContext('projectName') ?? 'claude-agentcore';
    if (!/^[a-z][a-z0-9-]{2,30}$/.test(projectName)) {
      throw new Error(
        'projectName context must be lowercase letters, numbers, or ' +
          'hyphens, 3-31 characters, starting with a letter',
      );
    }
    const vpcCidr =
      this.node.tryGetContext('vpcCidr') ?? '10.43.0.0/16';
    const bedrockModelId =
      this.node.tryGetContext('bedrockModelId') ??
      'anthropic.claude-sonnet-5';
    if (!isApprovedBedrockModelId(bedrockModelId)) {
      throw new Error('bedrockModelId is not an approved Claude model ID');
    }
    const bedrockUsesInferenceProfile =
      BEDROCK_INFERENCE_PROFILE_PREFIX.test(bedrockModelId);
    const bedrockFoundationModelId = bedrockModelId.replace(
      BEDROCK_INFERENCE_PROFILE_PREFIX,
      '',
    );
    const enablePortal = contextBoolean(
      this.node.tryGetContext('enablePortal'),
      false,
    );
    const idleAfterSeconds = new cdk.CfnParameter(
      this,
      'IdleAfterSeconds',
      {
        type: 'Number',
        default: 900,
        minValue: 60,
        maxValue: 7200,
        description:
          'Seconds without shell traffic before a runtime session is ' +
          'checkpoint-terminated by the reconciler.',
      },
    );
    const trustedClientCidr = new cdk.CfnParameter(
      this,
      'TrustedClientCidr',
      {
        type: 'String',
        default: '10.101.0.0/22',
        description:
          'Routed private CIDR allowed to call the control API from ' +
          'developer devices.',
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
      alias: `alias/${projectName}-data`,
      description:
        'Encrypts Claude AgentCore Runtime workspace archives and session ' +
        'data.',
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
      sortKey: { name: 'updatedAt', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });
    sessions.addGlobalSecondaryIndex({
      indexName: 'state-updated-index',
      partitionKey: { name: 'state', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'updatedAt', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // --- AgentCore Runtime container image ---------------------------------
    // Container-based deployment (custom tooling: Claude Code + VS Code
    // Server) instead of the direct-code deployment path. Unlike most CDK
    // resources in this stack, the ECR repository and its image are NOT
    // created by CDK: `CfnRuntime.agentRuntimeArtifact.containerConfiguration
    // .containerUri` must resolve to an existing image at stack-create time,
    // so there is a bootstrap ordering problem if CDK also owns the (empty)
    // repository. `scripts/provision-agent-image.ts` creates the repository
    // and pushes the first image *before* `cdk deploy` runs (mirroring how
    // claude-code-on-lambda-microvm's scripts/provision-microvm.ts owns the
    // MicroVM image outside CDK). CDK only references the repository by
    // name here; day-2 image rebuilds use the same provisioning script and
    // do not require a CDK deploy.
    const repositoryName = `${projectName}-agent`;
    const repository = ecr.Repository.fromRepositoryName(
      this,
      'AgentImageRepository',
      repositoryName,
    );

    const runtimeSecurityGroup = new ec2.SecurityGroup(
      this,
      'RuntimeSecurityGroup',
      {
        vpc,
        allowAllOutbound: false,
        description:
          'Egress allowed from the AgentCore Runtime microVM to approved ' +
          'private services.',
      },
    );
    const endpointSg = new ec2.SecurityGroup(this, 'EndpointSecurityGroup', {
      vpc,
      allowAllOutbound: false,
      description:
        'Workload interface endpoints: TLS from the AgentCore Runtime.',
    });
    const apiEndpointSg = new ec2.SecurityGroup(
      this,
      'ApiEndpointSecurityGroup',
      {
        vpc,
        allowAllOutbound: false,
        description:
          'Private execute-api endpoint: TLS from trusted private clients.',
      },
    );
    endpointSg.addIngressRule(
      runtimeSecurityGroup,
      ec2.Port.tcp(443),
      'AgentCore Runtime sessions',
    );
    apiEndpointSg.addIngressRule(
      ec2.Peer.ipv4(trustedClientCidr.valueAsString),
      ec2.Port.tcp(443),
      'Trusted private clients calling the control API',
    );
    apiEndpointSg.addIngressRule(
      runtimeSecurityGroup,
      ec2.Port.tcp(443),
      'AgentCore Runtime refreshing checkpoint URLs',
    );
    runtimeSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS through private endpoints, peering, or the managed NAT gateway',
    );

    const s3Endpoint = vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }],
    });
    s3Endpoint.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:GetObject', 's3:PutObject'],
        resources: [workspaceBucket.arnForObjects('*')],
      }),
    );
    // ECR image layers are stored in an AWS-managed S3 bucket and fetched
    // over this same gateway endpoint when pulling through a VPC (see AWS's
    // ECR-in-a-VPC docs); without this statement, private ECR image pulls
    // fail even though the ecr.api/ecr.dkr interface endpoints below are
    // reachable.
    s3Endpoint.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:GetObject'],
        resources: [
          `arn:${this.partition}:s3:::prod-${this.region}-starport-layer-bucket/*`,
        ],
      }),
    );
    const addInterfaceEndpoint = (
      idName: string,
      service: ec2.IInterfaceVpcEndpointService,
      securityGroup = endpointSg,
    ): ec2.InterfaceVpcEndpoint =>
      vpc.addInterfaceEndpoint(idName, {
        service,
        open: false,
        privateDnsEnabled: true,
        securityGroups: [securityGroup],
        subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      });
    addInterfaceEndpoint(
      'LogsEndpoint',
      ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
    );
    addInterfaceEndpoint(
      'EcrApiEndpoint',
      ec2.InterfaceVpcEndpointAwsService.ECR,
    );
    addInterfaceEndpoint(
      'EcrDkrEndpoint',
      ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER,
    );
    const executeApiEndpoint = addInterfaceEndpoint(
      'ExecuteApiEndpoint',
      ec2.InterfaceVpcEndpointAwsService.APIGATEWAY,
      apiEndpointSg,
    );
    const bedrockRuntimeEndpoint = addInterfaceEndpoint(
      'BedrockRuntimeEndpoint',
      new ec2.InterfaceVpcEndpointService(
        `com.amazonaws.${this.region}.bedrock-runtime`,
        443,
      ),
    );
    const bedrockAgentCoreDataEndpoint = addInterfaceEndpoint(
      'BedrockAgentCoreDataEndpoint',
      new ec2.InterfaceVpcEndpointService(
        `com.amazonaws.${this.region}.bedrock-agentcore`,
        443,
      ),
    );

    // Execution role assumed by the AgentCore Runtime microVM. Deliberately
    // has no direct workspace S3 access -- the control plane mints
    // short-lived presigned URLs, mirroring the Lambda MicroVM sample.
    const runtimeExecutionRole = new iam.Role(
      this,
      'RuntimeExecutionRole',
      {
        assumedBy: new iam.ServicePrincipal(
          'bedrock-agentcore.amazonaws.com',
        ),
        description:
          'Runtime role assumed by AgentCore Runtime sessions; ' +
          'deliberately has no workspace S3 access.',
      },
    );
    runtimeExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'logs:CreateLogStream',
          'logs:PutLogEvents',
          'logs:DescribeLogStreams',
          'logs:CreateLogGroup',
        ],
        resources: [
          `arn:${this.partition}:logs:${this.region}:${this.account}:` +
            `log-group:/${projectName}/agentcore-runtime:*`,
          // AgentCore Runtime writes container stdout/stderr to its own
          // service-managed log group (/aws/bedrock-agentcore/runtimes/
          // <agentRuntimeId>-<endpoint>), not the custom log group above.
          // Without this grant the container's own crash/error output never
          // reaches CloudWatch, which makes InvokeAgentRuntime 400s
          // undiagnosable from the client side.
          `arn:${this.partition}:logs:${this.region}:${this.account}:` +
            'log-group:/aws/bedrock-agentcore/runtimes/*',
        ],
      }),
    );
    runtimeExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['ecr:GetAuthorizationToken'],
        resources: ['*'],
      }),
    );
    repository.grantPull(runtimeExecutionRole);

    const bedrockResources = [
      `arn:${this.partition}:bedrock:*::foundation-model/${bedrockFoundationModelId}`,
    ];
    if (bedrockUsesInferenceProfile) {
      bedrockResources.unshift(
        this.formatArn({
          service: 'bedrock',
          resource: 'inference-profile',
          resourceName: bedrockModelId,
        }),
      );
    } else {
      bedrockResources[0] =
        `arn:${this.partition}:bedrock:${this.region}::` +
        `foundation-model/${bedrockFoundationModelId}`;
    }
    const invokeBedrock = new iam.PolicyStatement({
      actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
      resources: bedrockResources,
    });
    runtimeExecutionRole.addToPolicy(invokeBedrock);
    bedrockRuntimeEndpoint.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'bedrock:InvokeModel',
          'bedrock:InvokeModelWithResponseStream',
        ],
        principals: [runtimeExecutionRole],
        resources: bedrockResources,
      }),
    );

    const runtimeLogGroup = new logs.LogGroup(this, 'RuntimeLogGroup', {
      logGroupName: `/${projectName}/agentcore-runtime`,
      retention: logs.RetentionDays.THREE_MONTHS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // The AgentCore Runtime resource itself. `containerUri` must resolve
    // to an image already pushed to `repository`; scripts/deploy.ts builds
    // and pushes the image *before* `cdk deploy` runs for a first-time
    // deployment, and CfnRuntime.agentRuntimeArtifact tracks the `:latest`
    // tag so day-2 image rebuilds (scripts/provision-agent-image.ts) do not
    // require a CDK deploy -- see docs/deployment-guide.md.
    const agentRuntime = new bedrockagentcore.CfnRuntime(
      this,
      'AgentRuntime',
      {
        agentRuntimeName: `${projectName.replace(/-/g, '_')}_agent`,
        agentRuntimeArtifact: {
          containerConfiguration: {
            containerUri: `${repository.repositoryUri}:latest`,
          },
        },
        roleArn: runtimeExecutionRole.roleArn,
        description:
          'Private Claude Code developer environments on Amazon Bedrock ' +
          'AgentCore Runtime',
        networkConfiguration: {
          networkMode: 'VPC',
          networkModeConfig: {
            securityGroups: [runtimeSecurityGroup.securityGroupId],
            subnets: vpc.privateSubnets.map((subnet) => subnet.subnetId),
          },
        },
        protocolConfiguration: 'HTTP',
        environmentVariables: {
          BEDROCK_MODEL_ID: bedrockModelId,
          WORKSPACE_BUCKET_NAME: workspaceBucket.bucketName,
        },
        lifecycleConfiguration: {
          // AgentCore Runtime microVM sessions cap at 8h, matching the
          // Lambda MicroVM sample's maximumDurationInSeconds.
          maxLifetime: 28_800,
          idleRuntimeSessionTimeout: idleAfterSeconds.valueAsNumber,
        },
      },
    );
    // No node dependency on `repository` -- it is not a CDK-managed
    // resource (see the comment above), so CDK cannot express "wait for the
    // image to exist" as a dependency. `scripts/deploy.ts` runs
    // provision-agent-image.ts before `cdk deploy` to guarantee ordering.

    const controlLogGroup = new logs.LogGroup(this, 'ControlLogGroup', {
      logGroupName: `/${projectName}/control-plane`,
      retention: logs.RetentionDays.THREE_MONTHS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    const controlFunction = new lambdaNode.NodejsFunction(
      this,
      'ControlFunction',
      {
        runtime: lambda.Runtime.NODEJS_22_X,
        architecture: lambda.Architecture.ARM_64,
        entry: path.join(repositoryRoot, 'control-plane/src/handler.ts'),
        handler: 'handler',
        timeout: cdk.Duration.seconds(30),
        memorySize: 512,
        logGroup: controlLogGroup,
        environment: {
          AGENT_RUNTIME_ARN: agentRuntime.attrAgentRuntimeArn,
          BEDROCK_MODEL_ID: bedrockModelId,
          IDLE_AFTER_SECONDS: idleAfterSeconds.valueAsString,
          RUNTIME_EXECUTION_ROLE_ARN: runtimeExecutionRole.roleArn,
          RUNTIME_LOG_GROUP: runtimeLogGroup.logGroupName,
          SESSION_TABLE_NAME: sessions.tableName,
          WORKSPACE_BUCKET_NAME: workspaceBucket.bucketName,
          WORKSPACE_CLAIM_TABLE_NAME: workspaceClaims.tableName,
        },
        bundling: { minify: true, sourceMap: true, externalModules: [] },
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
    controlFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'bedrock-agentcore:InvokeAgentRuntime',
          'bedrock-agentcore:InvokeAgentRuntimeCommand',
          'bedrock-agentcore:InvokeAgentRuntimeCommandShell',
          'bedrock-agentcore:StopRuntimeSession',
          'bedrock-agentcore:ListSessions',
        ],
        resources: [agentRuntime.attrAgentRuntimeArn, `${agentRuntime.attrAgentRuntimeArn}/*`],
      }),
    );
    controlFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['iam:PassRole'],
        resources: [runtimeExecutionRole.roleArn],
      }),
    );
    bedrockAgentCoreDataEndpoint.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'bedrock-agentcore:InvokeAgentRuntime',
          'bedrock-agentcore:InvokeAgentRuntimeCommand',
          'bedrock-agentcore:InvokeAgentRuntimeCommandShell',
          'bedrock-agentcore:StopRuntimeSession',
          'bedrock-agentcore:ListSessions',
        ],
        principals: [controlFunction.grantPrincipal],
        resources: [agentRuntime.attrAgentRuntimeArn, `${agentRuntime.attrAgentRuntimeArn}/*`],
      }),
    );

    new events.Rule(this, 'IdleReaperSchedule', {
      description:
        'Reconciles stored session state with AgentCore Runtime session ' +
        'state.',
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
      restApiName: `${projectName}-control`,
      description:
        'Private IAM-authenticated lifecycle API for Claude AgentCore ' +
        'Runtime sessions.',
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
        accessLogDestination: new apigateway.LogGroupLogDestination(
          new logs.LogGroup(this, 'ApiAccessLogGroup', {
            retention: logs.RetentionDays.THREE_MONTHS,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
          }),
        ),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
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
    const integration = new apigateway.LambdaIntegration(controlFunction, {
      proxy: true,
    });
    const methodOptions: apigateway.MethodOptions = {
      authorizationType: apigateway.AuthorizationType.IAM,
    };
    const sessionResource = api.root.addResource('sessions');
    sessionResource.addMethod('GET', integration, methodOptions);
    sessionResource.addMethod('POST', integration, methodOptions);
    const byId = sessionResource.addResource('{sessionId}');
    byId.addMethod('GET', integration, methodOptions);
    byId.addMethod('DELETE', integration, methodOptions);
    byId.addResource('connect').addMethod('POST', integration, methodOptions);
    byId.addResource('suspend').addMethod('POST', integration, methodOptions);
    byId.addResource('resume').addMethod('POST', integration, methodOptions);
    byId
      .addResource('checkpoint-urls')
      .addMethod('POST', integration, methodOptions);
    runtimeExecutionRole.addToPolicy(
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
      const portalUrl =
        `https://${api.restApiId}.execute-api.${this.region}.` +
        `${this.urlSuffix}/v1/portal`;
      const portalUserPool = new cognito.UserPool(this, 'PortalUserPool', {
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
      });
      const portalDomainSuffix = cdk.Fn.select(
        0,
        cdk.Fn.split('-', cdk.Fn.select(2, cdk.Fn.split('/', this.stackId))),
      );
      const portalUserPoolDomain = portalUserPool.addDomain(
        'PortalUserPoolDomain',
        {
          cognitoDomain: {
            domainPrefix: `claude-agentcore-${portalDomainSuffix}`,
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
      const portalAuthorizer = new apigateway.CognitoUserPoolsAuthorizer(
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
            logGroupName: `/${projectName}/portal`,
            retention: logs.RetentionDays.THREE_MONTHS,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
          }),
          environment: {
            PORTAL_CLIENT_ID: portalUserPoolClient.userPoolClientId,
            PORTAL_USER_POOL_DOMAIN:
              `${portalUserPoolDomain.domainName}.auth.` +
              `${this.region}.amazoncognito.com`,
          },
          bundling: {
            minify: true,
            sourceMap: true,
            externalModules: [],
            nodeModules: ['@xterm/addon-fit', '@xterm/xterm'],
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
        .addResource('terminal-vendor.js')
        .addMethod('GET', portalSiteIntegration, siteMethodOptions);
      portal
        .addResource('xterm.css')
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
      for (const actionPath of ['connect', 'suspend', 'resume']) {
        portalById
          .addResource(actionPath)
          .addMethod('POST', integration, portalMethodOptions);
      }
      new cdk.CfnOutput(this, 'PortalUrl', { value: portalUrl });
      new cdk.CfnOutput(this, 'PortalUserPoolId', {
        value: portalUserPool.userPoolId,
      });
    }

    new cdk.CfnOutput(this, 'AgentRuntimeArn', {
      value: agentRuntime.attrAgentRuntimeArn,
    });
    new cdk.CfnOutput(this, 'AgentImageRepositoryUri', {
      value: repository.repositoryUri,
    });
    new cdk.CfnOutput(this, 'ProjectNameOutput', { value: projectName })
      .overrideLogicalId('ProjectName');
    new cdk.CfnOutput(this, 'ControlApiUrl', {
      value:
        `https://${api.restApiId}.execute-api.${this.region}.` +
        `${this.urlSuffix}/${api.deploymentStage.stageName}`,
    });
    new cdk.CfnOutput(this, 'DataKeyArn', { value: dataKey.keyArn });
    new cdk.CfnOutput(this, 'IsolatedSubnetIds', {
      value: vpc.privateSubnets.map((subnet) => subnet.subnetId).join(','),
    });
    new cdk.CfnOutput(this, 'RuntimeExecutionRoleArn', {
      value: runtimeExecutionRole.roleArn,
    });
    new cdk.CfnOutput(this, 'RuntimeLogGroupName', {
      value: runtimeLogGroup.logGroupName,
    });
    new cdk.CfnOutput(this, 'SessionsTableName', {
      value: sessions.tableName,
    });
    new cdk.CfnOutput(this, 'VpcId', { value: vpc.vpcId });
    new cdk.CfnOutput(this, 'WorkspaceBucketName', {
      value: workspaceBucket.bucketName,
    });
    new cdk.CfnOutput(this, 'WorkspaceClaimsTableName', {
      value: workspaceClaims.tableName,
    });

    applyNagAcknowledgements(this, {
      bedrockFoundationModelId,
      bedrockUsesInferenceProfile,
      projectName,
    });
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

function contextBoolean(value: unknown, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  throw new Error('Boolean CDK context values must be true or false');
}

export function isApprovedBedrockModelId(value: unknown): value is string {
  return typeof value === 'string' && BEDROCK_MODEL_ID_PATTERN.test(value);
}
