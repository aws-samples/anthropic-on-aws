const { AwsCdkTypeScriptApp } = require('projen/lib/awscdk');
const { UpgradeDependenciesSchedule } = require('projen/lib/javascript');
const addUpgradeProjectWorkflow = require('../workflows.ts');
const addBuildWorkflow = require('../workflows.ts');

module.exports = function (root) {
  const classificationWithIntercom = new AwsCdkTypeScriptApp({
    parent: root,
    license: 'MIT-0',
    copyrightOwner: 'Amazon.com, Inc.',
    authorAddress: 'https://aws.amazon.com',
    cdkVersion: '2.130.0',
    defaultReleaseBranch: 'main',
    name: 'classification-with-intercom',
    appEntrypoint: 'classification-with-intercom.ts',
    outdir: 'classification-with-intercom',
    jest: false,
    deps: [
      'dotenv',
      '@types/aws-lambda',
      '@aws-sdk/client-secrets-manager',
      '@aws-sdk/client-bedrock-runtime',
      'node-fetch',
      '@types/node-fetch',
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

  classificationWithIntercom.addTask('launch', {
    exec: 'yarn cdk deploy --require-approval never && ./update-intercom-secret.sh',
  });

  classificationWithIntercom.tsconfigDev.file.addOverride('include', [
    'src/**/*.ts',
    './.projenrc.ts',
  ]);

  classificationWithIntercom.eslint.addOverride({
    files: ['src/resources/**/*.ts'],
    rules: {
      'indent': 'off',
      '@typescript-eslint/indent': 'off',
    },
  });

  classificationWithIntercom.eslint.addOverride({
    files: ['./*.ts', './test/*.ts', 'src/**/*.ts', 'src/*.ts'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'import/no-extraneous-dependencies': 'off',
      'import/no-unresolved': 'off',
    },
  });

  root.addUpgradeProjectWorkflow(
    'classification-with-intercom',
    'classification-with-intercom',
  );
  root.addUpgradeProjectWorkflow(
    'classification-with-intercom-client',
    'classification-with-intercom/intercom-client',
  );
  root.addBuildWorkflow(
    'classification-with-intercom',
    'classification-with-intercom',
  );

  classificationWithIntercom.synth();

  return classificationWithIntercom;
};
