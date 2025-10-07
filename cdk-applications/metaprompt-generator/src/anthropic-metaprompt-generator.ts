import { App, Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { config } from 'dotenv';
import {
  Site,
  Infrastructure,
  Cognito,
  DynamoDBResources,
  AppSyncResources,
  StateMachineResources,
} from '.';

config();

export interface AnthropicMetaPromptGeneratorProps extends StackProps {
  logLevel: string;
  allowedDomain: string;
  anthropicKey: string;
  anthropicModel: string;
}

export class AnthropicMetaPromptGenerator extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: AnthropicMetaPromptGeneratorProps,
  ) {
    super(scope, id, props);

    const cognitoResources = new Cognito(this, 'Cognito', {
      allowedDomain: props.allowedDomain,
    });

    const dynamoDbResources = new DynamoDBResources(this, 'DynamoDBResources');

    const infrastructure = new Infrastructure(this, 'Infrastructure', {
      userPool: cognitoResources.userPool,
      anthropicKey: props.anthropicKey,
      anthropicModel: props.anthropicModel,
    });

    const appSyncResources = new AppSyncResources(this, 'AppSyncResources', {
      promptsTable: dynamoDbResources.promptsTable,
      tasksTable: dynamoDbResources.tasksTable,
      promptGeneratorLambda: infrastructure.promptGeneratorLambda,
      taskDistillerLambda: infrastructure.taskDistillerLambda,
      authenticatedRole: cognitoResources.authenticatedRole,
      userPool: cognitoResources.userPool,
    });

    infrastructure.promptGeneratorLambda.addEnvironment(
      'APPSYNC_ENDPOINT',
      appSyncResources.graphQlApi.graphqlUrl,
    );
    infrastructure.promptGeneratorLambda.addEnvironment(
      'APPSYNC_API_KEY',
      appSyncResources.graphQlApi.apiKey!,
    );

    infrastructure.taskDistillerLambda.addEnvironment(
      'APPSYNC_ENDPOINT',
      appSyncResources.graphQlApi.graphqlUrl,
    );

    infrastructure.taskDistillerLambda.addEnvironment(
      'APPSYNC_API_KEY',
      appSyncResources.graphQlApi.apiKey!,
    );

    new StateMachineResources(this, 'StateMachineResources', {
      requestHandlerLambda: infrastructure.requestHandlerLambda,
      promptGeneratorLambda: infrastructure.promptGeneratorLambda,
      taskDistillerLambda: infrastructure.taskDistillerLambda,
    });

    const site = new Site(this, 'Site', {
      graphQlUrl: appSyncResources.graphQlApi.graphqlUrl,
      apiUrl: infrastructure.apiUrl,
      userPool: cognitoResources.userPool,
      userPoolClient: cognitoResources.userPoolClient,
      userPoolRegion: cognitoResources.userPoolRegion,
      identityPool: cognitoResources.identityPool,
      graphQlApiKey: appSyncResources.graphQlApi.apiKey!,
    });

    new CfnOutput(this, 'siteBucket', { value: site.siteBucket.bucketName });
    new CfnOutput(this, 'promptGeneratorSite', {
      value: site.distribution.distributionDomainName,
    });
  }
}

const props = {
  logLevel: process.env.LOG_LEVEL || '',
  allowedDomain: process.env.ALLOWED_DOMAIN || '',
  anthropicKey: process.env.ANTHROPIC_KEY || '',
  anthropicModel: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20240620',
};

const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: 'us-east-1',
};

const app = new App();

new AnthropicMetaPromptGenerator(app, 'AnthropicMetaPromptGenerator', {
  ...props,
  env: devEnv,
});

app.synth();
