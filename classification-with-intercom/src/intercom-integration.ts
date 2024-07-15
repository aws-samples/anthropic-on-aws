import { App, CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { config } from 'dotenv';
import { LambdaResources, ApiGatewayResources } from './';
config();

interface HostedWhisperStreamingProps extends StackProps {
  logLevel: string;
  intercomToken: string;
}

export class IntercomIntegration extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: HostedWhisperStreamingProps,
  ) {
    super(scope, id, props);

    const lambdaResources = new LambdaResources(this, 'LambdaResources');

    const apiGatewayResources = new ApiGatewayResources(
      this,
      'apiGatewayResources',
      {
        intercomLambda: lambdaResources.intercomLambda,
      },
    );

    new CfnOutput(this, 'APIGatewayURL', {
      value: `${apiGatewayResources.restAPI.url}intercom`,
    });
  }
}

const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: 'us-east-1',
};

const stackProps = {
  logLevel: process.env.LOG_LEVEL || 'INFO',
  intercomToken: process.env.INTERCOM_TOKEN || '',
};

const app = new App();

new IntercomIntegration(app, 'IntercomIntegration', {
  ...stackProps,
  env: devEnv,
});

app.synth();
