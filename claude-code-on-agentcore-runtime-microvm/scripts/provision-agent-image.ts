#!/usr/bin/env node
// Builds the agent-runtime container image and pushes it to an ECR
// repository, creating the repository first if needed. This runs BEFORE
// `cdk deploy` for a first-time deployment, because `CfnRuntime.
// agentRuntimeArtifact.containerConfiguration.containerUri` must resolve to
// an existing image at stack-create time (see infra/lib/platform-stack.ts).
// It is also the day-2 image-rebuild entry point: rerun this script and
// restart the runtime's sessions (there is no CDK deploy required) to pick
// up a new image, mirroring claude-code-on-lambda-microvm's
// scripts/provision-microvm.ts image-swap workflow.
import { spawn } from 'node:child_process';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CreateRepositoryCommand,
  DescribeRepositoriesCommand,
  ECRClient,
  GetAuthorizationTokenCommand,
} from '@aws-sdk/client-ecr';
import { defaultProvider } from '@aws-sdk/credential-provider-node';

const here = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(here, '..');
const agentRuntimeDirectory = path.join(repositoryRoot, 'agent-runtime');

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  printHelp();
  process.exit(0);
}
const region = takeOption(args, '--region') ?? 'us-east-1';
const profile = takeOption(args, '--profile') ?? 'default';
const projectName = takeOption(args, '--project-name') ?? 'claude-agentcore';
assertNoArguments(args);

const repositoryName = `${projectName}-agent`;
const credentials = defaultProvider({ profile });
const ecr = new ECRClient({ region, credentials });

const repositoryUri = await ensureRepository();
await buildAndPush(repositoryUri);

process.stdout.write(
  `Pushed ${repositoryUri}:latest. This is the image the AgentCore ` +
    `Runtime (agentRuntimeName ${projectName.replace(/-/g, '_')}_agent) ` +
    'will pull for new sessions.\n',
);

async function ensureRepository(): Promise<string> {
  try {
    const described = await ecr.send(
      new DescribeRepositoriesCommand({ repositoryNames: [repositoryName] }),
    );
    const uri = described.repositories?.[0]?.repositoryUri;
    if (uri) {
      return uri;
    }
  } catch (error) {
    if (!isNotFound(error)) {
      throw error;
    }
  }
  process.stdout.write(`Creating ECR repository ${repositoryName}...\n`);
  const created = await ecr.send(
    new CreateRepositoryCommand({
      repositoryName,
      imageScanningConfiguration: { scanOnPush: true },
      imageTagMutability: 'MUTABLE',
    }),
  );
  const uri = created.repository?.repositoryUri;
  if (!uri) {
    throw new Error('CreateRepository returned no repositoryUri');
  }
  return uri;
}

async function buildAndPush(repositoryUri: string): Promise<void> {
  const auth = await ecr.send(new GetAuthorizationTokenCommand({}));
  const authData = auth.authorizationData?.[0];
  if (!authData?.authorizationToken || !authData.proxyEndpoint) {
    throw new Error('GetAuthorizationToken returned no credentials');
  }
  const decoded = Buffer.from(
    authData.authorizationToken,
    'base64',
  ).toString('utf8');
  const password = decoded.split(':').slice(1).join(':');
  const registryHost = authData.proxyEndpoint.replace(/^https?:\/\//, '');

  await run(
    'docker',
    ['login', '--username', 'AWS', '--password-stdin', registryHost],
    password,
  );
  await run('docker', [
    'buildx',
    'build',
    '--platform',
    'linux/arm64',
    '--tag',
    `${repositoryUri}:latest`,
    '--push',
    agentRuntimeDirectory,
  ]);
}

async function run(
  command: string,
  commandArgs: string[],
  stdin?: string,
): Promise<void> {
  process.stdout.write(`\n$ ${command} ${commandArgs.join(' ')}\n`);
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      cwd: repositoryRoot,
      stdio: [stdin ? 'pipe' : 'ignore', 'inherit', 'inherit'],
    });
    if (stdin) {
      child.stdin?.end(stdin);
    }
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            `${command} exited with ${code ?? `signal ${signal ?? 'unknown'}`}`,
          ),
        );
      }
    });
  });
}

function isNotFound(error: unknown): boolean {
  return (
    error instanceof Error && error.name === 'RepositoryNotFoundException'
  );
}

function takeOption(values: string[], name: string): string | undefined {
  const index = values.indexOf(name);
  if (index < 0) {
    return undefined;
  }
  const value = values[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`${name} requires a value`);
  }
  values.splice(index, 2);
  return value;
}

function assertNoArguments(values: string[]): void {
  if (values.length > 0) {
    throw new Error(`Unexpected argument: ${values[0]}`);
  }
}

function printHelp(): void {
  process.stdout.write(`Usage: npm run provision-image -- [options]

Builds agent-runtime/ into a container image and pushes it to the
per-project ECR repository, creating the repository if it does not exist.
Run this before the first 'cdk deploy', and again for any day-2 image
rebuild.

Options:
  --region <region>          AWS Region (default: us-east-1)
  --profile <profile>        AWS profile (default: default)
  --project-name <name>      Must match the deployment.json projectName
                              (default: claude-agentcore)
  --help                     Show this help without calling AWS
`);
}
