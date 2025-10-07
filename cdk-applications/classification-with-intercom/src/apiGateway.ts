import {
  RestApi,
  LambdaIntegration,
  EndpointType,
  MethodLoggingLevel,
} from 'aws-cdk-lib/aws-apigateway';
import {
  PolicyDocument,
  PolicyStatement,
  Effect,
  AnyPrincipal,
} from 'aws-cdk-lib/aws-iam';
import { Function } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

interface ApiGatewayResourcesProps {
  intercomLambda: Function;
}

export class ApiGatewayResources extends Construct {
  public restAPI: RestApi;

  constructor(scope: Construct, id: string, props: ApiGatewayResourcesProps) {
    super(scope, id);

    this.restAPI = new RestApi(this, 'intercomAPI', {
      defaultCorsPreflightOptions: {
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
        ],
        allowMethods: ['OPTIONS', 'POST'],
        allowCredentials: true,
        allowOrigins: ['*'],
      },
      policy: new PolicyDocument({
        statements: [
          new PolicyStatement({
            principals: [new AnyPrincipal()],
            actions: ['execute-api:Invoke'],
            resources: ['execute-api:/*/*/*'],
            effect: Effect.ALLOW,
          }),
          new PolicyStatement({
            principals: [new AnyPrincipal()],
            actions: ['execute-api:Invoke'],
            resources: ['execute-api:/*/*/*'],
            conditions: {
              NotIpAddress: {
                'aws:SourceIp': [
                  '34.231.68.152/32',
                  '34.197.76.213/32',
                  '35.171.78.91/32',
                  '35.169.138.21/32',
                  '52.70.27.159/32',
                  '52.44.63.161/32',
                ],
              },
            },
            effect: Effect.DENY,
          }),
        ],
      }),
      deployOptions: {
        loggingLevel: MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
      },
      endpointConfiguration: {
        types: [EndpointType.REGIONAL],
      },
    });

    const intercom = this.restAPI.root.addResource('intercom');

    const intercomIntegration = new LambdaIntegration(props.intercomLambda);

    intercom.addMethod('POST', intercomIntegration, {});
    intercom.addMethod('HEAD');
  }
}
