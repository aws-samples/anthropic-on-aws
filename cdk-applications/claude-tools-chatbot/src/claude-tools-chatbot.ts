import { App, Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { config } from 'dotenv';
import {
  LambdaResources,
  CognitoResources,
  AppSyncResources,
  DynamoDBResources,
  SiteResources,
  VPCResources,
  RDSResources,
} from '.';

config();

export interface ClaudeToolsChatbotProps extends StackProps {
  logLevel: string;
  allowedDomain: string;
}

export class ClaudeToolsChatbot extends Stack {
  constructor(scope: Construct, id: string, props: ClaudeToolsChatbotProps) {
    super(scope, id, props);
    const vPCResources = new VPCResources(this, 'VPC');
    const rDSResources = new RDSResources(this, 'RDS', {
      vpc: vPCResources.vpc,
      securityGroup: vPCResources.securityGroup,
    });
    const lambdaResources = new LambdaResources(this, 'Lambda', {
      vpc: vPCResources.vpc,
      securityGroup: vPCResources.securityGroup,
      database: rDSResources.database,
      bedrockInterfaceEndpoint: vPCResources.bedrockInterfaceEndpoint,
    });
    const dynamoDbResources = new DynamoDBResources(this, 'DynamoDB');
    const cognitoResources = new CognitoResources(this, 'Cognito', {
      allowedDomain: props.allowedDomain,
    });
    const appSyncResources = new AppSyncResources(this, 'AppSync', {
      messageProcessorLambda: lambdaResources.resolverLambda,
      userPool: cognitoResources.userPool,
      conversationTable: dynamoDbResources.conversationTable,
    });

    const siteResources = new SiteResources(this, 'Site', {
      graphqlApi: appSyncResources.graphqlApi,
      userPool: cognitoResources.userPool,
      userPoolClient: cognitoResources.userPoolClient,
      userPoolRegion: cognitoResources.userPoolRegion,
      identityPool: cognitoResources.identityPool,
    });

    new CfnOutput(this, 'siteBucket', {
      value: siteResources.siteBucket.bucketName,
    });
    new CfnOutput(this, 'claudeToolsChatBotSite', {
      value: siteResources.distribution.distributionDomainName,
    });
  }
}

const app = new App();

const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const props = {
  logLevel: process.env.LOG_LEVEL || 'INFO',
  allowedDomain: process.env.ALLOWED_DOMAIN || '',
};

new ClaudeToolsChatbot(app, 'ClaudeToolsChatbot', { ...props, env: devEnv });

app.synth();
