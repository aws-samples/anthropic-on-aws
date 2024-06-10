import path from 'path';
import { Duration, CustomResource } from 'aws-cdk-lib';
import {
  Vpc,
  SubnetType,
  InstanceType,
  InstanceClass,
  InstanceSize,
  SecurityGroup,
} from 'aws-cdk-lib/aws-ec2';
import {
  PolicyDocument,
  PolicyStatement,
  Role,
  ServicePrincipal,
  ManagedPolicy,
} from 'aws-cdk-lib/aws-iam';
import { Function, Code, Runtime, Architecture } from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { DatabaseInstance, DatabaseInstanceEngine } from 'aws-cdk-lib/aws-rds';
import { Provider } from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';

interface RDSResourceProps {
  vpc: Vpc;
  securityGroup: SecurityGroup;
}
export class RDSResources extends Construct {
  public database: DatabaseInstance;

  constructor(scope: Construct, id: string, props: RDSResourceProps) {
    super(scope, id);

    this.database = new DatabaseInstance(this, 'database', {
      engine: DatabaseInstanceEngine.POSTGRES,
      vpc: props.vpc,
      vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
      instanceType: InstanceType.of(
        InstanceClass.BURSTABLE4_GRAVITON,
        InstanceSize.MEDIUM,
      ),
      multiAz: false,
      allowMajorVersionUpgrade: true,
      autoMinorVersionUpgrade: true,
      backupRetention: Duration.days(0),
      securityGroups: [props.securityGroup],
    });

    this.database.connections.allowInternally;

    const initializerLambdaRole = new Role(this, 'initializerLambdaRole', {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      inlinePolicies: {
        ['secrets']: new PolicyDocument({
          statements: [
            new PolicyStatement({
              resources: [this.database.secret?.secretFullArn!],
              actions: ['secretsmanager:GetSecretValue'],
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

    const initializerLambda = new Function(this, 'InitializeTableLambda', {
      code: Code.fromAsset(
        path.join(__dirname, 'resources/initializerLambda'),
        {
          bundling: {
            image: Runtime.PYTHON_3_12.bundlingImage,
            command: [
              'bash',
              '-c',
              'pip install -r requirements.txt -t /asset-output && cp -au . /asset-output',
            ],
          },
        },
      ),
      runtime: Runtime.PYTHON_3_12,
      role: initializerLambdaRole,
      vpc: props.vpc,
      vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
      architecture: Architecture.ARM_64,
      handler: 'index.handler',
      timeout: Duration.minutes(5),
      environment: {
        RDS_SECRET_NAME: this.database.secret?.secretName!,
      },
    });

    initializerLambda.connections.allowToDefaultPort(this.database);

    const provider = new Provider(this, 'CustomResourceProvider', {
      onEventHandler: initializerLambda,
      logRetention: RetentionDays.ONE_WEEK,
    });

    new CustomResource(this, 'customResourceResult', {
      serviceToken: provider.serviceToken,
    });
  }
}
