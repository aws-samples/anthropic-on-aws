#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ensureClientVpnPki,
  exportClientVpnProfile,
  type ClientVpnPki,
} from './client-vpn.js';

const PLATFORM_STACK = 'ClaudeMicrovmStack';
const here = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(here, '..');

interface DeploymentConfiguration {
  region?: string;
  vpcCidr?: string;
  projectName?: string;
  vpnClientCidr: string;
  createClientVpn?: boolean;
  vpnClientName?: string;
  inferenceMode?: 'claude-gateway' | 'bedrock';
  allowClaudeAiSubscription?: boolean;
  claudeGatewayUrl?: string;
  claudeGatewayCidr?: string;
  bedrockModelId?: string;
  agentCoreGatewayUrl?: string;
  agentCoreGatewayArn?: string;
  enablePortal?: boolean;
  idleAfterSeconds?: number;
  suspendedRetentionSeconds?: number;
  microvmMemoryMib?: number;
  provisionTimeoutMinutes?: number;
  baseImageArn?: string;
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
const approval =
  takeOption(args, '--require-approval') ?? 'broadening';
const skipMicrovm = takeFlag(args, '--skip-microvm');
assertNoArguments(args);
if (!['never', 'any-change', 'broadening'].includes(approval)) {
  throw new Error(
    '--require-approval must be never, any-change, or broadening',
  );
}

const configuration = await loadConfiguration(configPath);
const region = configuration.region ?? 'us-east-1';
const vpcCidr = configuration.vpcCidr ?? '10.42.0.0/16';
const inferenceMode =
  configuration.inferenceMode ?? 'bedrock';
const createClientVpn = configuration.createClientVpn ?? false;
const enableAgentCore = Boolean(configuration.agentCoreGatewayUrl);
const enablePortal = configuration.enablePortal ?? false;
const contextArguments = [
  '-c',
  `region=${region}`,
  '-c',
  `vpcCidr=${vpcCidr}`,
  '-c',
  `inferenceMode=${inferenceMode}`,
  '-c',
  `createClientVpn=${String(createClientVpn)}`,
  '-c',
  `enableAgentCore=${String(enableAgentCore)}`,
  '-c',
  `enablePortal=${String(enablePortal)}`,
  '-c',
  `allowClaudeAiSubscription=${String(
    configuration.allowClaudeAiSubscription ?? false
  )}`,
  ...(configuration.bedrockModelId
    ? ['-c', `bedrockModelId=${configuration.bedrockModelId}`]
    : []),
];
const clientVpnPki = createClientVpn
  ? await ensureClientVpnPki({
      region,
      profile,
      projectName:
        configuration.projectName ?? 'claude-microvm',
      clientName: configuration.vpnClientName ?? 'developer',
      repositoryRoot,
    })
  : undefined;

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
  ...platformParameterArguments(configuration, clientVpnPki),
]);

if (!skipMicrovm) {
  const provisionArguments = [
    'tsx',
    'scripts/provision-microvm.ts',
    'provision',
    '--region',
    region,
    '--profile',
    profile,
    '--stack',
    PLATFORM_STACK,
    '--memory-mib',
    String(configuration.microvmMemoryMib ?? 4_096),
    '--timeout-minutes',
    String(configuration.provisionTimeoutMinutes ?? 60),
  ];
  if (configuration.baseImageArn) {
    provisionArguments.push(
      '--base-image-arn',
      configuration.baseImageArn,
    );
  }
  await run('npx', provisionArguments);
}

const vpnProfile = clientVpnPki
  ? await exportClientVpnProfile({
      region,
      profile,
      projectName:
        configuration.projectName ?? 'claude-microvm',
      stackName: PLATFORM_STACK,
      pki: clientVpnPki,
    })
  : undefined;
process.stdout.write(
  [
    `Deployment complete in ${region}.`,
    ...(vpnProfile
      ? [`AWS Client VPN profile: ${vpnProfile}`]
      : []),
    `Run from ${repositoryRoot}:`,
    `npm run client -- --region ${region} --profile ${profile} start my-workspace`,
    `npm run client -- --region ${region} --profile ${profile} vscode my-workspace`,
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
  const configuration =
    value as unknown as DeploymentConfiguration;
  requiredConfiguredString(
    configuration.vpnClientCidr,
    'vpnClientCidr',
  );
  const inferenceMode =
    configuration.inferenceMode ?? 'bedrock';
  if (
    inferenceMode !== 'claude-gateway' &&
    inferenceMode !== 'bedrock'
  ) {
    throw new Error(
      'inferenceMode must be claude-gateway or bedrock',
    );
  }
  if (inferenceMode === 'claude-gateway') {
    requiredConfiguredString(
      configuration.claudeGatewayUrl,
      'claudeGatewayUrl',
    );
    requiredConfiguredString(
      configuration.claudeGatewayCidr,
      'claudeGatewayCidr',
    );
  } else if (configuration.bedrockModelId !== undefined) {
    requiredConfiguredString(
      configuration.bedrockModelId,
      'bedrockModelId',
    );
  }
  if (
    configuration.createClientVpn !== undefined &&
    typeof configuration.createClientVpn !== 'boolean'
  ) {
    throw new Error('createClientVpn must be a boolean');
  }
  if (
    configuration.allowClaudeAiSubscription !== undefined &&
    typeof configuration.allowClaudeAiSubscription !== 'boolean'
  ) {
    throw new Error(
      'allowClaudeAiSubscription must be a boolean',
    );
  }
  if (configuration.createClientVpn) {
    const prefix = Number(
      configuration.vpnClientCidr.split('/')[1],
    );
    if (!Number.isInteger(prefix) || prefix < 12 || prefix > 22) {
      throw new Error(
        'vpnClientCidr must use a /12 through /22 prefix for AWS Client VPN',
      );
    }
    if (configuration.vpnClientName !== undefined) {
      requiredConfiguredString(
        configuration.vpnClientName,
        'vpnClientName',
      );
    }
  }
  if (
    Boolean(configuration.agentCoreGatewayUrl) !==
    Boolean(configuration.agentCoreGatewayArn)
  ) {
    throw new Error(
      'agentCoreGatewayUrl and agentCoreGatewayArn must be set together',
    );
  }
  if (
    configuration.enablePortal !== undefined &&
    typeof configuration.enablePortal !== 'boolean'
  ) {
    throw new Error('enablePortal must be a boolean');
  }
  for (const [name, item] of Object.entries(configuration)) {
    if (
      typeof item === 'string' &&
      item.includes('REPLACE_ME')
    ) {
      throw new Error(`${name} still contains REPLACE_ME`);
    }
  }
  for (const [name, item] of [
    ['idleAfterSeconds', configuration.idleAfterSeconds],
    [
      'suspendedRetentionSeconds',
      configuration.suspendedRetentionSeconds,
    ],
    ['microvmMemoryMib', configuration.microvmMemoryMib],
    [
      'provisionTimeoutMinutes',
      configuration.provisionTimeoutMinutes,
    ],
  ] as const) {
    if (
      item !== undefined &&
      (!Number.isSafeInteger(item) || item <= 0)
    ) {
      throw new Error(`${name} must be a positive integer`);
    }
  }
  if (
    configuration.microvmMemoryMib !== undefined &&
    ![512, 1_024, 2_048, 4_096, 8_192].includes(
      configuration.microvmMemoryMib,
    )
  ) {
    throw new Error(
      'microvmMemoryMib must be 512, 1024, 2048, 4096, or 8192',
    );
  }
  return configuration;
}

function platformParameterArguments(
  configuration: DeploymentConfiguration,
  clientVpnPki?: ClientVpnPki,
): string[] {
  const gatewayMode =
    configuration.inferenceMode === 'claude-gateway';
  const parameters: Record<
    string,
    string | number | undefined
  > = {
    ProjectName: configuration.projectName,
    VpnClientCidr: configuration.vpnClientCidr,
    ClaudeGatewayUrl: gatewayMode
      ? configuration.claudeGatewayUrl
      : undefined,
    ClaudeGatewayCidr: gatewayMode
      ? configuration.claudeGatewayCidr
      : undefined,
    ClientVpnServerCertificateArn:
      clientVpnPki?.serverCertificateArn,
    ClientVpnRootCertificateArn:
      clientVpnPki?.clientRootCertificateArn,
    AgentCoreGatewayUrl: configuration.agentCoreGatewayUrl,
    AgentCoreGatewayArn: configuration.agentCoreGatewayArn,
    IdleAfterSeconds: configuration.idleAfterSeconds,
    SuspendedRetentionSeconds:
      configuration.suspendedRetentionSeconds,
  };
  return Object.entries(parameters).flatMap(([name, item]) =>
    item === undefined
      ? []
      : [
          '--parameters',
          `${PLATFORM_STACK}:${name}=${String(item)}`,
        ],
  );
}

async function run(
  command: string,
  commandArgs: string[],
): Promise<void> {
  process.stdout.write(
    `\n$ ${command} ${commandArgs.join(' ')}\n`,
  );
  // npm and npx are .cmd shims on Windows, which Node refuses to
  // spawn directly; run through the shell there and quote arguments
  // ourselves because spawn does not quote when shell is enabled.
  const windows = process.platform === 'win32';
  await new Promise<void>((resolve, reject) => {
    const child = spawn(
      command,
      windows ? commandArgs.map(quoteForCmd) : commandArgs,
      {
        cwd: repositoryRoot,
        env: process.env,
        stdio: 'inherit',
        shell: windows,
      },
    );
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            `${command} exited with ` +
              `${code ?? `signal ${signal ?? 'unknown'}`}`,
          ),
        );
      }
    });
  });
}

function quoteForCmd(value: string): string {
  if (/^[A-Za-z0-9_@+=:,./\\-]+$/.test(value)) {
    return value;
  }
  if (/["\r\n%]/.test(value)) {
    throw new Error(
      `Argument cannot be passed through cmd.exe safely: ${value}`,
    );
  }
  return `"${value}"`;
}

function requiredConfiguredString(
  value: unknown,
  name: string,
): void {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${name} must be a non-empty string`);
  }
}

function takeOption(
  values: string[],
  name: string,
): string | undefined {
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

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    !Array.isArray(value)
  );
}

function printHelp(): void {
  process.stdout.write(`Usage: npm run deploy -- [options]

Deploys the private platform stack and creates or updates the Lambda MicroVM
image and VPC egress connector. No ECS/Fargate relay is created.

Options:
  --config <file>                   JSON configuration (default: deployment.json)
  --profile <profile>               AWS profile (default: default)
  --require-approval <level>        broadening, any-change, or never
  --skip-microvm                    Skip MicroVM connector/image provisioning
  --help                            Show this help without calling AWS
`);
}
