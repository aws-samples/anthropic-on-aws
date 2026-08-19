#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const PLATFORM_STACK = 'ClaudeAgentCoreRuntimeStack';
const here = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(here, '..');

interface DeploymentConfiguration {
  region?: string;
  vpcCidr?: string;
  projectName?: string;
  trustedClientCidr: string;
  bedrockModelId?: string;
  allowClaudeAiSubscription?: boolean;
  enablePortal?: boolean;
  idleAfterSeconds?: number;
}

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  printHelp();
  process.exit(0);
}

const configPath = path.resolve(
  takeOption(args, '--config') ?? 'deployment.json',
);
const profile = takeOption(args, '--profile') ?? 'default';
const approval = takeOption(args, '--require-approval') ?? 'broadening';
const skipImage = takeFlag(args, '--skip-image');
assertNoArguments(args);
if (!['never', 'any-change', 'broadening'].includes(approval)) {
  throw new Error('--require-approval must be never, any-change, or broadening');
}

const configuration = await loadConfiguration(configPath);
const region = configuration.region ?? 'us-east-1';
const vpcCidr = configuration.vpcCidr ?? '10.43.0.0/16';
const projectName = configuration.projectName ?? 'claude-agentcore';
const enablePortal = configuration.enablePortal ?? false;

if (!skipImage) {
  await run('npx', [
    'tsx',
    'scripts/provision-agent-image.ts',
    '--region',
    region,
    '--profile',
    profile,
    '--project-name',
    projectName,
  ]);
}

const contextArguments = [
  '-c',
  `region=${region}`,
  '-c',
  `vpcCidr=${vpcCidr}`,
  '-c',
  `enablePortal=${String(enablePortal)}`,
  '-c',
  `allowClaudeAiSubscription=${String(
    configuration.allowClaudeAiSubscription ?? false,
  )}`,
  ...(configuration.bedrockModelId
    ? ['-c', `bedrockModelId=${configuration.bedrockModelId}`]
    : []),
];
await run('npx', [
  'cdk',
  'deploy',
  PLATFORM_STACK,
  '--exclusively',
  '--profile',
  profile,
  '--require-approval',
  approval,
  ...contextArguments,
  ...platformParameterArguments(configuration, projectName),
]);

process.stdout.write(
  [
    `Deployment complete in ${region}.`,
    ...(enablePortal
      ? [
          'Developer access: open the PortalUrl stack output.',
          'Terminal environments connect directly in the browser.',
        ]
      : ['The browser portal is disabled for this deployment.']),
    'IAM operator CLI (from this source tree):',
    `npm run client -- --region ${region} --profile ${profile} list`,
    '',
  ].join('\n'),
);

async function loadConfiguration(
  filename: string,
): Promise<DeploymentConfiguration> {
  let value: unknown;
  try {
    value = JSON.parse(await readFile(filename, 'utf8'));
  } catch (error) {
    throw new Error(
      `Unable to read deployment configuration ${filename}: ` +
        `${error instanceof Error ? error.message : 'unknown error'}`,
    );
  }
  if (!isRecord(value)) {
    throw new Error('Deployment configuration must be a JSON object');
  }
  const configuration = value as unknown as DeploymentConfiguration;
  requiredConfiguredString(configuration.trustedClientCidr, 'trustedClientCidr');
  if (
    configuration.allowClaudeAiSubscription !== undefined &&
    typeof configuration.allowClaudeAiSubscription !== 'boolean'
  ) {
    throw new Error('allowClaudeAiSubscription must be a boolean');
  }
  if (
    configuration.enablePortal !== undefined &&
    typeof configuration.enablePortal !== 'boolean'
  ) {
    throw new Error('enablePortal must be a boolean');
  }
  for (const [name, item] of Object.entries(configuration)) {
    if (typeof item === 'string' && item.includes('REPLACE_ME')) {
      throw new Error(`${name} still contains REPLACE_ME`);
    }
  }
  if (
    configuration.idleAfterSeconds !== undefined &&
    (!Number.isSafeInteger(configuration.idleAfterSeconds) ||
      configuration.idleAfterSeconds <= 0)
  ) {
    throw new Error('idleAfterSeconds must be a positive integer');
  }
  return configuration;
}

function platformParameterArguments(
  configuration: DeploymentConfiguration,
  projectName: string,
): string[] {
  const parameters: Record<string, string | number | undefined> = {
    ProjectName: projectName,
    TrustedClientCidr: configuration.trustedClientCidr,
    IdleAfterSeconds: configuration.idleAfterSeconds,
  };
  return Object.entries(parameters).flatMap(([name, item]) =>
    item === undefined
      ? []
      : ['--parameters', `${PLATFORM_STACK}:${name}=${String(item)}`],
  );
}

async function run(command: string, commandArgs: string[]): Promise<void> {
  process.stdout.write(`\n$ ${command} ${commandArgs.join(' ')}\n`);
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      cwd: repositoryRoot,
      env: process.env,
      stdio: 'inherit',
    });
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

function requiredConfiguredString(value: unknown, name: string): void {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${name} must be a non-empty string`);
  }
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

function takeFlag(values: string[], name: string): boolean {
  const index = values.indexOf(name);
  if (index < 0) {
    return false;
  }
  values.splice(index, 1);
  return true;
}

function assertNoArguments(values: string[]): void {
  if (values.length > 0) {
    throw new Error(`Unexpected argument: ${values[0]}`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function printHelp(): void {
  process.stdout.write(`Usage: npm run deploy -- [options]

Builds and pushes the agent-runtime container image, then deploys the
platform stack.

Options:
  --config <file>                   JSON configuration (default: deployment.json)
  --profile <profile>                AWS profile (default: default)
  --require-approval <level>         broadening, any-change, or never
  --skip-image                       Skip the container image build/push
  --help                             Show this help without calling AWS
`);
}
