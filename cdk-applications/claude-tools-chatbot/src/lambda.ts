import path from 'path';
import { Duration } from 'aws-cdk-lib';
import {
  InterfaceVpcEndpoint,
  SecurityGroup,
  SubnetType,
  Vpc,
} from 'aws-cdk-lib/aws-ec2';
import {
  Role,
  ServicePrincipal,
  ManagedPolicy,
  PolicyDocument,
  PolicyStatement,
} from 'aws-cdk-lib/aws-iam';
import { Runtime, Architecture, Function, Code } from 'aws-cdk-lib/aws-lambda';
import { DatabaseInstance } from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';

interface LambdaResourcesProps {
  vpc: Vpc;
  securityGroup: SecurityGroup;
  database: DatabaseInstance;
  bedrockInterfaceEndpoint: InterfaceVpcEndpoint;
}
export class LambdaResources extends Construct {
  resolverLambda: Function;

  constructor(scope: Construct, id: string, props: LambdaResourcesProps) {
    super(scope, id);

    const resolverLambdaRole = new Role(this, 'resolverLambdaRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      inlinePolicies: {
        ['secrets']: new PolicyDocument({
          statements: [
            new PolicyStatement({
              resources: [props.database.secret?.secretFullArn!],
              actions: ['secretsmanager:GetSecretValue'],
            }),
          ],
        }),
        ['bedrock']: new PolicyDocument({
          statements: [
            new PolicyStatement({
              resources: ['*'],
              actions: ['bedrock:InvokeModel'],
              conditions: {
                'ForAnyValue:StringEquals': {
                  'aws:sourceVpce': [
                    props.bedrockInterfaceEndpoint.vpcEndpointId,
                  ],
                },
              },
            }),
          ],
        }),
      },
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole',
        ),
        ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole',
        ),
      ],
    });

    this.resolverLambda = new Function(this, 'resolverLambda', {
      code: Code.fromAsset(path.join(__dirname, 'resources/resolverLambda'), {
        bundling: {
          image: Runtime.PYTHON_3_12.bundlingImage,
          command: [
            'bash',
            '-c',
            'pip install -r requirements.txt -t /asset-output && cp -au . /asset-output',
          ],
        },
      }),
      runtime: Runtime.PYTHON_3_12,
      vpc: props.vpc,
      vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
      architecture: Architecture.ARM_64,
      memorySize: 1024,
      handler: 'index.handler',
      timeout: Duration.minutes(5),
      role: resolverLambdaRole,
      environment: {
        RDS_SECRET_NAME: props.database.secret?.secretName!,
      },
    });

    this.resolverLambda.connections.allowToDefaultPort(props.database);
  }
}
