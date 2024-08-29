import { KnowledgeBase } from '@cdklabs/generative-ai-cdk-constructs/lib/cdk-lib/bedrock';
import { Duration } from 'aws-cdk-lib';
import {
  ManagedPolicy,
  Role,
  ServicePrincipal,
  PolicyStatement,
  PolicyDocument,
} from 'aws-cdk-lib/aws-iam';
import { Function, Runtime, Architecture } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Bucket, EventType } from 'aws-cdk-lib/aws-s3';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';
import { Construct } from 'constructs';

interface LambdaResourcesProps {
  dataSourceBucket: Bucket;
  logLevel: string;
  dataSourceId: string;
  knowledgeBase: KnowledgeBase;
}
export class LambdaResources extends Construct {
  public readonly dataSyncLambda: Function;

  constructor(scope: Construct, id: string, props: LambdaResourcesProps) {
    super(scope, id);

    const dataSyncLambdaRole = new Role(this, 'dataSyncLambdaRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      inlinePolicies: {
        ['bedrockPolicy']: new PolicyDocument({
          statements: [
            new PolicyStatement({
              resources: ['*'],
              actions: ['bedrock:StartIngestionJob'],
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

    this.dataSyncLambda = new NodejsFunction(this, 'dataSyncLambda', {
      entry: './src/resources/dataSync/index.ts',
      runtime: Runtime.NODEJS_LATEST,
      architecture: Architecture.ARM_64,
      handler: 'handler',
      timeout: Duration.minutes(5),
      role: dataSyncLambdaRole,
      environment: {
        KNOWLEDGE_BASE_ID: props.knowledgeBase.knowledgeBaseId,
        DATA_SOURCE_ID: props.dataSourceId,
        LOG_LEVEL: props.logLevel,
      },
    });

    props.dataSourceBucket.grantRead(this.dataSyncLambda);

    props.dataSourceBucket.addEventNotification(
      EventType.OBJECT_CREATED,
      new LambdaDestination(this.dataSyncLambda),
    );
  }
}
