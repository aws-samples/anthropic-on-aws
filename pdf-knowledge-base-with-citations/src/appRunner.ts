import * as path from 'path';
import { KnowledgeBase } from '@cdklabs/generative-ai-cdk-constructs/lib/cdk-lib/bedrock';
import * as apprunner from 'aws-cdk-lib/aws-apprunner';
import { DockerImageAsset, Platform } from 'aws-cdk-lib/aws-ecr-assets';
import { Role, ServicePrincipal, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface AppRunnerResourcesProps {
  knowledgeBase: KnowledgeBase;
  dataSourceBucket: Bucket;
  modelArn: string;
}

export class AppRunnerResources extends Construct {
  appRunnerService: apprunner.CfnService;

  constructor(scope: Construct, id: string, props: AppRunnerResourcesProps) {
    super(scope, id);

    const imageAsset = new DockerImageAsset(this, 'NextJsAppImage', {
      directory: path.join(__dirname, './resources/app'),
      file: 'Dockerfile',
      platform: Platform.LINUX_AMD64,
    });

    const appRunnerRole = new Role(this, 'AppRunnerECRAccessRole', {
      assumedBy: new ServicePrincipal('build.apprunner.amazonaws.com'),
    });
    imageAsset.repository.grantPull(appRunnerRole);

    const instanceRole = new Role(this, 'AppRunnerInstanceRole', {
      assumedBy: new ServicePrincipal('tasks.apprunner.amazonaws.com'),
    });

    instanceRole.addToPolicy(
      new PolicyStatement({
        actions: [
          'bedrock:InvokeModel',
          'bedrock:RetrieveAndGenerate',
          'bedrock:Retrieve',
        ],
        resources: [`${props.knowledgeBase.knowledgeBaseArn}`, '*'],
      }),
    );

    props.dataSourceBucket.grantRead(instanceRole);

    this.appRunnerService = new apprunner.CfnService(
      this,
      'NextJsAppRunnerService',
      {
        sourceConfiguration: {
          imageRepository: {
            imageIdentifier: imageAsset.imageUri,
            imageRepositoryType: 'ECR',
            imageConfiguration: {
              port: '3000',
              runtimeEnvironmentVariables: [
                {
                  name: 'KNOWLEDGE_BASE_ID',
                  value: props.knowledgeBase.knowledgeBaseId,
                },
                {
                  name: 'MODEL_ARN',
                  value: props.modelArn,
                },
              ],
            },
          },
          autoDeploymentsEnabled: true,
          authenticationConfiguration: {
            accessRoleArn: appRunnerRole.roleArn,
          },
        },
        instanceConfiguration: {
          instanceRoleArn: instanceRole.roleArn,
        },
      },
    );
  }
}
