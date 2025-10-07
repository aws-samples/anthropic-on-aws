const { AwsCdkTypeScriptApp } = require('projen/lib/awscdk');
const {
  UpgradeDependenciesSchedule,
  NodePackageManager,
} = require('projen/lib/javascript');
const addUpgradeProjectWorkflow = require('../workflows.ts');
const addBuildWorkflow = require('../workflows.ts');
const { off } = require('process');

module.exports = function (root) {
  const metapromptGenerator = new AwsCdkTypeScriptApp({
    parent: root,
    cdkVersion: '2.130.0',
    defaultReleaseBranch: 'main',
    name: 'anthropic-metaprompt-generator',
    appEntrypoint: 'anthropic-metaprompt-generator.ts',
    packageManager: NodePackageManager.YARN_CLASSIC,
    outdir: 'cdk-applications/metaprompt-generator',
    devDeps: ['esbuild'],
    jest: false,
    deps: [
      'fs-extra',
      '@types/fs-extra',
      '@types/aws-lambda',
      '@anthropic-ai/sdk',
      '@apollo/client',
      'graphql',
      'react',
      '@aws-sdk/client-sfn',
      '@types/uuid',
      'esbuild',
      'dotenv',
      'cdk-nag',
    ],
    depsUpgradeOptions: {
      workflow: true,
      workflowOptions: {
        labels: ['auto-approve', 'auto-merge'],
        schedule: UpgradeDependenciesSchedule.WEEKLY,
      },
    },
    autoApproveOptions: {
      secret: 'GITHUB_TOKEN',
      allowedUsernames: ['schuettc'],
    },
    autoApproveUpgrades: true,
    depsUpgrade: true,
  });

  metapromptGenerator.addTask('launch', {
    exec: 'yarn cdk bootstrap && yarn cdk deploy --require-approval never && yarn configLocal',
  });

  metapromptGenerator.addTask('getBucket', {
    exec: "aws cloudformation describe-stacks --stack-name AnthropicMetaPromptGenerator --region us-east-1 --query 'Stacks[0].Outputs[?OutputKey==`siteBucket`].OutputValue' --output text",
  });

  metapromptGenerator.addTask('configLocal', {
    exec: 'aws s3 cp s3://$(yarn run --silent getBucket)/config.json metaprompt-generator-client/public/',
  });

  metapromptGenerator.tsconfigDev.file.addOverride('include', [
    'src/*.ts',
    'src/**/*.ts',
    'test/*.ts',
  ]);
  metapromptGenerator.eslint.addOverride({
    files: ['./*.ts', './test/*.ts'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'import/no-extraneous-dependencies': 'off',
      'import/no-unresolved': 'off',
    },
  });

  root.addUpgradeProjectWorkflow(
    'metaprompt-generator',
    'cdk-applications/metaprompt-generator',
  );
  root.addUpgradeProjectWorkflow(
    'metaprompt-generator-client',
    'cdk-applications/metaprompt-generator/metaprompt-generator-client',
  );
  root.addBuildWorkflow('metaprompt-generator', 'cdk-applications/metaprompt-generator');

  metapromptGenerator.synth();

  return metapromptGenerator;
};
