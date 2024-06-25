const { web } = require('projen');
const addUpgradeProjectWorkflow = require('../workflows.ts');
const addBuildWorkflow = require('../workflows.ts');

module.exports = function (root) {
  const complexSchemaToolUseNextJS = new web.NextJsTypeScriptProject({
    defaultReleaseBranch: 'main',
    parent: root,
    name: 'nextjs-chatbot',
    outdir: 'complex-schema-tool-use/nextjs-typescript-example',
    tailwind: false,
    deps: [
      '@aws-sdk/client-bedrock-runtime',
      '@cloudscape-design/components',
      '@cloudscape-design/global-styles',
    ],
    devDeps: ['next-transpile-modules', 'next-compose-plugins'],
  });

  root.addUpgradeProjectWorkflow(
    'complex-schema-tool-use-nextjs',
    'complex-schema-tool-use/nextjs-typescript-example',
  );

  root.addBuildWorkflow(
    'complex-schema-tool-use-nextjs',
    'complex-schema-tool-use/nextjs-typescript-example',
  );

  complexSchemaToolUseNextJS.synth();
};
