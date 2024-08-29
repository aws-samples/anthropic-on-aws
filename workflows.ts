const { JobPermission } = require('projen/lib/github/workflows-model');
const { NodeProject } = require('projen/lib/javascript');
const AUTOMATION_TOKEN = 'PROJEN_GITHUB_TOKEN';

NodeProject.prototype.addUpgradeProjectWorkflow = function (
  projectName,
  directory,
) {
  const upgradeProject = this.github.addWorkflow('upgrade-' + projectName);
  upgradeProject.on({
    schedule: [{ cron: '0 0 * * 1' }],
    workflowDispatch: {},
  });

  upgradeProject.addJobs({
    [`upgrade-${projectName}`]: {
      runsOn: ['ubuntu-latest'],
      name: `upgrade-${projectName}`,
      permissions: {
        actions: JobPermission.WRITE,
        contents: JobPermission.READ,
        idToken: JobPermission.WRITE,
      },
      steps: [
        { uses: 'actions/checkout@v3' },
        {
          name: 'Setup Node.js',
          uses: 'actions/setup-node@v3',
          with: {
            'node-version': '20',
          },
        },
        {
          run: 'yarn install --check-files --frozen-lockfile',
          workingDirectory: directory,
        },
        { run: 'yarn upgrade', workingDirectory: directory },
        {
          name: 'Create Pull Request',
          uses: 'peter-evans/create-pull-request@v4',
          with: {
            'token': '${{ secrets.' + AUTOMATION_TOKEN + ' }}',
            'commit-message': `chore: upgrade ${projectName}`,
            'branch': `auto/projen-upgrade-${projectName}`,
            'title': `chore: upgrade ${projectName}`,
            'body': `This PR upgrades ${projectName}`,
            'labels': 'auto-merge, auto-approve',
            'author': 'github-actions <github-actions@github.com>',
            'committer': 'github-actions <github-actions@github.com>',
            'signoff': true,
          },
        },
      ],
    },
  });
};

NodeProject.prototype.addBuildWorkflow = function (projectName, directory) {
  const buildWorkflow = this.github.addWorkflow('build-' + projectName);
  buildWorkflow.on({ pullRequest: {}, workflowDispatch: {} });

  buildWorkflow.addJobs({
    'build': {
      runsOn: 'ubuntu-latest',
      permissions: {
        contents: JobPermission.WRITE,
      },
      env: {
        CI: 'true',
      },
      steps: [
        {
          name: 'Checkout',
          uses: 'actions/checkout@v4',
          with: {
            ref: '${{ github.event.pull_request.head.ref }}',
            repository: '${{ github.event.pull_request.head.repo.full_name }}',
          },
        },
        {
          name: 'Install dependencies',
          run: 'yarn install --check-files',
          workingDirectory: directory,
        },
        {
          name: 'Build',
          run: 'npx projen build',
          workingDirectory: directory,
        },
        {
          name: 'Find mutations',
          id: 'self_mutation',
          run: `
            git add .
            git diff --staged --patch --exit-code > .repo.patch || echo "self_mutation_happened=true" >> $GITHUB_OUTPUT
          `,
          workingDirectory: directory,
        },
        {
          name: 'Upload patch',
          if: 'steps.self_mutation.outputs.self_mutation_happened',
          uses: 'actions/upload-artifact@v4',
          with: {
            name: '.repo.patch',
            path: '.repo.patch',
            overwrite: true,
          },
        },
        {
          name: 'Fail build on mutation',
          if: 'steps.self_mutation.outputs.self_mutation_happened',
          run: `
            echo "::error::Files were changed during build (see build log). If this was triggered from a fork, you will need to update your branch."
            cat .repo.patch
            exit 1
          `,
        },
      ],
    },
    'self-mutation': {
      needs: 'build',
      runsOn: 'ubuntu-latest',
      permissions: {
        contents: JobPermission.WRITE,
      },
      if: 'always() && needs.build.outputs.self_mutation_happened && !(github.event.pull_request.head.repo.full_name != github.repository)',
      steps: [
        {
          name: 'Checkout',
          uses: 'actions/checkout@v4',
          with: {
            token: '${{ secrets.' + AUTOMATION_TOKEN + ' }}',
            ref: '${{ github.event.pull_request.head.ref }}',
            repository: '${{ github.event.pull_request.head.repo.full_name }}',
          },
        },
        {
          name: 'Download patch',
          uses: 'actions/download-artifact@v4',
          with: {
            name: '.repo.patch',
            path: '${{ runner.temp }}',
          },
        },
        {
          name: 'Apply patch',
          run: '[ -s ${{ runner.temp }}/.repo.patch ] && git apply ${{ runner.temp }}/.repo.patch || echo "Empty patch. Skipping."',
        },
        {
          name: 'Set git identity',
          run: `
            git config user.name "github-actions"
            git config user.email "github-actions@github.com"
          `,
        },
        {
          name: 'Push changes',
          env: {
            PULL_REQUEST_REF: '${{ github.event.pull_request.head.ref }}',
          },
          run: `
            git add .
            git commit -s -m "chore: self mutation"
            git push origin HEAD:$PULL_REQUEST_REF
          `,
        },
      ],
    },
  });
};

NodeProject.prototype.addUpgradeSubmodulesWorkflow = function (projectName) {
  const upgradeSubmodules = this.github.addWorkflow(
    'upgrade-submodules-' + projectName,
  );
  upgradeSubmodules.on({
    schedule: [{ cron: '0 0 * * 0' }], // Run every Sunday at midnight
    workflowDispatch: {},
  });

  upgradeSubmodules.addJobs({
    [`upgrade-submodules-${projectName}`]: {
      runsOn: ['ubuntu-latest'],
      name: `upgrade-submodules-${projectName}`,
      permissions: {
        contents: JobPermission.WRITE,
      },
      steps: [
        {
          uses: 'actions/checkout@v3',
          with: {
            'fetch-depth': 0,
            'submodules': 'recursive',
            'token': '${{ secrets.' + AUTOMATION_TOKEN + ' }}',
          },
        },
        {
          name: 'Update submodules',
          run: 'git submodule update --remote --merge',
        },
        {
          name: 'Create Pull Request',
          uses: 'peter-evans/create-pull-request@v4',
          with: {
            'token': '${{ secrets.' + AUTOMATION_TOKEN + ' }}',
            'commit-message': `chore: update submodules for ${projectName}`,
            'branch': `auto/submodules-update-${projectName}`,
            'title': `chore: update submodules for ${projectName}`,
            'body': `This PR updates submodules for ${projectName}`,
            'labels': 'auto-merge, auto-approve',
            'author': 'github-actions <github-actions@github.com>',
            'committer': 'github-actions <github-actions@github.com>',
            'signoff': true,
          },
        },
      ],
    },
  });
};
