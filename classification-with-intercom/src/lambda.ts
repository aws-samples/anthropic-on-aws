import { Duration } from 'aws-cdk-lib';
import {
  Role,
  ServicePrincipal,
  ManagedPolicy,
  PolicyDocument,
  PolicyStatement,
} from 'aws-cdk-lib/aws-iam';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export class LambdaResources extends Construct {
  public intercomLambda: NodejsFunction;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const lambdaRole = new Role(this, 'lambdaRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      inlinePolicies: {
        ['bedrock']: new PolicyDocument({
          statements: [
            new PolicyStatement({
              resources: ['*'],
              actions: ['bedrock:InvokeModel'],
            }),
          ],
        }),
      },
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole',
        ),
      ],
    });

    const intercomApiTokenSecret = new Secret(this, 'intercomApiToken', {
      secretName: 'intercomApiToken',
    });

    this.intercomLambda = new NodejsFunction(this, 'intercomLambda', {
      entry: './src/resources/intercomLambda/index.ts',
      handler: 'lambdaHandler',
      runtime: Runtime.NODEJS_LATEST,
      architecture: Architecture.ARM_64,
      role: lambdaRole,
      timeout: Duration.seconds(60),
      environment: {
        INTERCOM_API_SECRET_NAME: 'intercomApiToken',
        BEDROCK_MODEL_ID: 'anthropic.claude-3-haiku-20240307-v1:0',
      },
    });

    intercomApiTokenSecret.grantRead(this.intercomLambda);
  }
}
