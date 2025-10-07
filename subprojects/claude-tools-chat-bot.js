const { AwsCdkTypeScriptApp } = require('projen/lib/awscdk');
const { UpgradeDependenciesSchedule } = require('projen/lib/javascript');
const addUpgradeProjectWorkflow = require('../workflows.ts');
const addBuildWorkflow = require('../workflows.ts');

module.exports = function (root) {
  const claudeToolsChatbot = new AwsCdkTypeScriptApp({
    parent: root,
    license: 'MIT-0',
    copyrightOwner: 'Amazon.com, Inc.',
    authorAddress: 'https://aws.amazon.com',
    cdkVersion: '2.130.0',
    defaultReleaseBranch: 'main',
    name: 'claude-tools-chatbot',
    appEntrypoint: 'claude-tools-chatbot.ts',
    outdir: 'cdk-applications/claude-tools-chatbot',
    devDeps: ['esbuild', 'cdk-nag'],
    jest: false,
    deps: [
      'dotenv',
      'fs-extra',
      '@types/fs-extra',
      '@types/aws-lambda',
      '@types/jest',
      '@types/mocha',
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

  claudeToolsChatbot.addTask('launch', {
    exec: 'yarn cdk bootstrap && yarn cdk deploy --require-approval never && yarn configLocal',
  });

  claudeToolsChatbot.addTask('getBucket', {
    exec: "aws cloudformation describe-stacks --stack-name ClaudeToolsChatbot --query 'Stacks[0].Outputs[?OutputKey==`siteBucket`].OutputValue' --output text",
  });

  claudeToolsChatbot.addTask('configLocal', {
    exec: 'aws s3 cp s3://$(yarn run --silent getBucket)/config.json claude-tools-chatbot-client/public/',
  });

  claudeToolsChatbot.tsconfigDev.file.addOverride('include', [
    'test/*.ts',
    'src/**/*.ts',
    'claude-tools-chatbot-client/src/**/*.tsx',
    './.projenrc.ts',
  ]);

  claudeToolsChatbot.eslint.addOverride({
    files: [
      'src/resources/**/*.ts',
      'src/*.ts',
      'claude-tools-chatbot-client/src/**/*.tsx',
      'test/*.ts',
    ],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'import/no-extraneous-dependencies': 'off',
      'import/no-unresolved': [
        'error',
        { ignore: ['source-map-support/register'] },
      ],
    },
  });

  claudeToolsChatbot.eslint.addOverride({
    files: ['src/cognito.ts'],
    rules: {
      'quote-props': 'off',
    },
  });

  root.addUpgradeProjectWorkflow(
    'claude-tools-chatbot',
    'cdk-applications/claude-tools-chatbot',
  );
  root.addUpgradeProjectWorkflow(
    'claude-tools-chatbot-client',
    'cdk-applications/claude-tools-chatbot/claude-tools-chatbot-client',
  );
  root.addBuildWorkflow('claude-tools-chatbot', 'cdk-applications/claude-tools-chatbot');

  claudeToolsChatbot.synth();

  return claudeToolsChatbot;
};
