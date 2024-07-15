const { NodeProject } = require('projen/lib/javascript');
const { UpgradeDependenciesSchedule } = require('projen/lib/javascript');
const metapromptGenerator = require('./subprojects/metaprompt-generator');
const claudeToolsChatbot = require('./subprojects/claude-tools-chat-bot');
const complexSchemaToolUseNextJS = require('./subprojects/complex-schema-tool-use-nextjs');
const classificationWithIntercom = require('./subprojects/classification-with-intercom');

const root = new NodeProject({
  name: 'anthropic-on-aws',
  defaultReleaseBranch: 'main',
  license: 'MIT-0',
  copyrightOwner: 'Amazon.com, Inc.',
  gitpod: true,
  jest: false,
  authorAddress: 'https://aws.amazon.com',
  depsUpgradeOptions: {
    ignoreProjen: false,
    workflowOptions: {
      labels: ['auto-approve', 'auto-merge'],
      schedule: UpgradeDependenciesSchedule.WEEKLY,
    },
  },
  workflowNodeVersion: '18.x',
  autoApproveOptions: {
    secret: 'GITHUB_TOKEN',
    allowedUsernames: ['schuettc'],
  },
  autoApproveUpgrades: true,
  projenUpgradeSecret: 'PROJEN_GITHUB_TOKEN',
  defaultReleaseBranch: 'main',
  prettierOptions: {
    overrides: {
      quoteProps: 'consistent',
    },
  },
});

metapromptGenerator(root);
claudeToolsChatbot(root);
complexSchemaToolUseNextJS(root);
classificationWithIntercom(root);

const common_exclude = [
  '.yalc',
  'cdk.out',
  'cdk.context.json',
  'yarn-error.log',
  'dependabot.yml',
  '.DS_Store',
  '.venv',
  'cdk-nag-output.txt',
  '**/bin/',
  '**/lib/',
  '**/node_modules/',
  '**/test/',
  '**/.next/',
  '**/__pycache__/',
  'mkdocs-env/*',
  '.graphqlconfig.yml',
  '**/share/',
  '**/etc/',
  '.env',
  'docs/**/images/',
  '!docs/images/',
];

root.gitignore.exclude(...common_exclude);
root.synth();
