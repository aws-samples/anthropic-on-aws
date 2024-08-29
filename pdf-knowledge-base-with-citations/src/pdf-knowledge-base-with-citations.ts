import { App, CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { config } from 'dotenv';
import { LambdaResources, BedrockResources, AppRunnerResources } from '.';
config();

interface PDFKnolwedgeBaseWithCitationsProps extends StackProps {
  logLevel: string;
  modelArn: string;
}

export class PDFKnolwedgeBaseWithCitations extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: PDFKnolwedgeBaseWithCitationsProps,
  ) {
    super(scope, id, props);

    const bedrockResources = new BedrockResources(this, 'BedrockResources', {});

    new LambdaResources(this, 'LambdaResources', {
      logLevel: props.logLevel,
      dataSourceBucket: bedrockResources.dataSourceBucket,
      knowledgeBase: bedrockResources.knowledgeBase,
      dataSourceId: bedrockResources.dataSource.dataSourceId,
    });

    const appRunner = new AppRunnerResources(this, 'AppRunner', {
      knowledgeBase: bedrockResources.knowledgeBase,
      modelArn: props.modelArn,
      dataSourceBucket: bedrockResources.dataSourceBucket,
    });

    new CfnOutput(this, 'AppRunnerUrl', {
      value: `https://${appRunner.appRunnerService.attrServiceUrl}`,
    });

    new CfnOutput(this, 'KnowledgeBaseId', {
      value: bedrockResources.knowledgeBase.knowledgeBaseId,
    });

    new CfnOutput(this, 'DataSourceBucketArn', {
      value: bedrockResources.dataSourceBucket.bucketArn,
    });
  }
}

const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: 'us-east-1',
};

const stackProps = {
  logLevel: process.env.LOG_LEVEL || 'INFO',
  modelArn:
    process.env.MODEL_ARN ||
    'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0',
};

const app = new App();

new PDFKnolwedgeBaseWithCitations(app, 'PDFKnolwedgeBaseWithCitations', {
  ...stackProps,
  env: devEnv,
});

app.synth();
