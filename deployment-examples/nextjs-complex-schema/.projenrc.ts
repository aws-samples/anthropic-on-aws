import { web } from 'projen';
const project = new web.NextJsTypeScriptProject({
  defaultReleaseBranch: 'main',
  name: 'nextjs-chatbot',
  projenrcTs: true,
  tailwind: false,
  deps: [
    '@aws-sdk/client-bedrock-runtime',
    '@cloudscape-design/components',
    '@cloudscape-design/global-styles',
  ],
  devDeps: ['next-transpile-modules', 'next-compose-plugins'],
});
project.synth();
