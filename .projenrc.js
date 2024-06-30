const { NodeProject } = require('projen/lib/javascript');
const metapromptGenerator = require('./subprojects/metaprompt-generator');
const claudeToolsChatbot = require('./subprojects/claude-tools-chat-bot');
const complexSchemaToolUseNextJS = require('./subprojects/complex-schema-tool-use-nextjs');

const root = new NodeProject({
  name: 'anthropic-on-aws',
  defaultReleaseBranch: 'main',
  license: 'MIT-0',
  copyrightOwner: 'Amazon.com, Inc.',
  gitpod: true,
  authorAddress: 'https://aws.amazon.com',
});

metapromptGenerator(root);
claudeToolsChatbot(root);
complexSchemaToolUseNextJS(root);

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
  '.graphqlconfig.yml',
  '**/share/',
  '**/etc/',
  '.env',
];

root.gitignore.exclude(...common_exclude);
root.synth();
