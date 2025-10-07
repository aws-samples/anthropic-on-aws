import { Duration } from 'aws-cdk-lib';
import {
  RestApi,
  LambdaIntegration,
  EndpointType,
  MethodLoggingLevel,
  CognitoUserPoolsAuthorizer,
  AuthorizationType,
} from 'aws-cdk-lib/aws-apigateway';
import { IUserPool } from 'aws-cdk-lib/aws-cognito';
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Runtime, Architecture, Function } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

interface InfrastructureProps {
  readonly userPool: IUserPool;
  anthropicKey: string;
  anthropicModel: string;
}

export class Infrastructure extends Construct {
  public apiUrl: string;
  public promptGeneratorLambda: Function;
  public taskDistillerLambda: Function;
  public requestHandlerLambda: Function;

  constructor(scope: Construct, id: string, props: InfrastructureProps) {
    super(scope, id);

    const requestHandlerRole = new Role(this, 'requestHandlerRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole',
        ),
      ],
    });

    const generatorRole = new Role(this, 'promptGeneratorRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole',
        ),
      ],
    });

    this.promptGeneratorLambda = new NodejsFunction(
      this,
      'promptGeneratorLambda',
      {
        entry: './src/resources/promptGenerator/index.ts',
        runtime: Runtime.NODEJS_LATEST,
        architecture: Architecture.ARM_64,
        handler: 'lambdaHandler',
        timeout: Duration.minutes(5),
        role: generatorRole,
        environment: {
          ANTHROPIC_API_KEY: props.anthropicKey,
          ANTHROPIC_MODEL: props.anthropicModel,
        },
      },
    );

    this.taskDistillerLambda = new NodejsFunction(this, 'taskDistillerLambda', {
      entry: './src/resources/taskGenerator/index.ts',
      runtime: Runtime.NODEJS_LATEST,
      architecture: Architecture.ARM_64,
      handler: 'lambdaHandler',
      timeout: Duration.minutes(5),
      role: generatorRole,
      environment: {
        ANTHROPIC_API_KEY: props.anthropicKey,
        ANTHROPIC_MODEL: props.anthropicModel,
      },
    });

    this.requestHandlerLambda = new NodejsFunction(
      this,
      'requestHandlerLambda',
      {
        entry: './src/resources/requestHandler/index.ts',
        runtime: Runtime.NODEJS_LATEST,
        architecture: Architecture.ARM_64,
        handler: 'lambdaHandler',
        timeout: Duration.minutes(5),
        role: requestHandlerRole,
      },
    );

    const api = new RestApi(this, 'metaPromptGeneratorAPI', {
      defaultCorsPreflightOptions: {
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'x-amz-security-token',
        ],
        allowMethods: ['OPTIONS', 'POST', 'GET'],
        allowCredentials: true,
        allowOrigins: ['*'],
      },
      restApiName: 'metaPromptGeneratorAPI',
      deployOptions: {
        loggingLevel: MethodLoggingLevel.OFF,
        dataTraceEnabled: false,
      },
      endpointConfiguration: {
        types: [EndpointType.REGIONAL],
      },
    });

    const auth = new CognitoUserPoolsAuthorizer(this, 'auth', {
      cognitoUserPools: [props.userPool],
    });

    const metaPromptIntegration = new LambdaIntegration(
      this.requestHandlerLambda,
    );

    const createPrompt = api.root.addResource('createPrompt');
    const createTask = api.root.addResource('createTask');

    createPrompt.addMethod('POST', metaPromptIntegration, {
      authorizer: auth,
      authorizationType: AuthorizationType.COGNITO,
    });

    createTask.addMethod('POST', metaPromptIntegration, {
      authorizer: auth,
      authorizationType: AuthorizationType.COGNITO,
    });

    this.apiUrl = api.url;
  }
}
