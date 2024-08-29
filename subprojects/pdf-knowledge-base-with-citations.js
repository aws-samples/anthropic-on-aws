const { AwsCdkTypeScriptApp } = require('projen/lib/awscdk');
const {
  UpgradeDependenciesSchedule,
  NodePackageManager,
} = require('projen/lib/javascript');
const addUpgradeProjectWorkflow = require('../workflows.ts');
const addBuildWorkflow = require('../workflows.ts');
const { off } = require('process');

module.exports = function (root) {
  const pdfKnowledgeBaseWithCitations = new AwsCdkTypeScriptApp({
    cdkVersion: '2.130.0',
    license: 'MIT-0',
    appEntrypoint: 'pdf-knowledge-base-with-citations.ts',
    jest: false,
    projenrcTs: true,
    depsUpgradeOptions: {
      ignoreProjen: false,
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
    projenUpgradeSecret: 'PROJEN_GITHUB_TOKEN',
    defaultReleaseBranch: 'main',
    name: 'pdf-knowledge-base-with-citations',
    deps: [
      'dotenv',
      '@cdklabs/generative-ai-cdk-constructs',
      '@aws-sdk/client-bedrock-agent',
      '@types/aws-lambda',
      '@aws-sdk/client-bedrock-agent-runtime',
      '@aws-sdk/client-bedrock-runtime',
      '@aws-sdk/client-s3',
      '@aws-sdk/client-cloudformation',
      '@cloudscape-design/components',
      'react-pdf',
      '@types/react-pdf',
    ],
  });

  pdfKnowledgeBaseWithCitations.addTask('launch', {
    exec: 'yarn cdk deploy --require-approval never',
  });

  pdfKnowledgeBaseWithCitations.addTask('update-env', {
    exec: 'ts-node scripts/update-env.ts',
    description:
      'Update .env.local with the latest KnowledgeBaseId from CloudFormation',
  });

  pdfKnowledgeBaseWithCitations.tsconfigDev.file.addOverride('include', [
    'src/**/*.ts',
    'src/**/*.tsx',
    './.projenrc.ts',
    'scripts/*.ts',
  ]);

  pdfKnowledgeBaseWithCitations.eslint.addOverride({
    files: ['src/resources/**/*.ts'],
    rules: {
      'indent': 'off',
      '@typescript-eslint/indent': 'off',
    },
  });

  // Add this new override
  pdfKnowledgeBaseWithCitations.eslint.addOverride({
    files: ['src/resources/app/**/*.ts', 'src/resources/app/**/*.tsx'],
    rules: {
      'indent': 'off',
      '@typescript-eslint/indent': 'off',
    },
  });

  pdfKnowledgeBaseWithCitations.eslint.addOverride({
    files: [
      'src/resources/**/*.ts',
      'src/resources/**/*.tsx',
      'src/*.ts',
      'scripts/*.ts',
    ],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'import/no-extraneous-dependencies': 'off',
    },
  });

  root.addUpgradeProjectWorkflow(
    'pdf-knowledge-base-with-citations',
    'pdf-knowledge-base-with-citations',
  );

  root.addUpgradeProjectWorkflow(
    'pdf-knowledge-base-with-citations',
    'pdf-knowledge-base-with-citations/src/resources/app',
  );

  root.addBuildWorkflow(
    'pdf-knowledge-base-with-citations',
    'pdf-knowledge-base-with-citations',
  );

  pdfKnowledgeBaseWithCitations.synth();
  return pdfKnowledgeBaseWithCitations;
};
