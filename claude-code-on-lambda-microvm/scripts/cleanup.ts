#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CloudFormationClient,
  DeleteStackCommand,
  DescribeStacksCommand,
  type Stack,
} from '@aws-sdk/client-cloudformation';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  GetMicrovmCommand,
  LambdaMicrovmsClient,
  TerminateMicrovmCommand,
} from '@aws-sdk/client-lambda-microvms';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import {
  DynamoDBDocumentClient,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import type { SessionRecord } from '../control-plane/src/model.js';

const BUILD_STACK = 'ClaudeMicrovmRuntimeBuildStack';
const PLATFORM_STACK = 'ClaudeMicrovmStack';
const here = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(here, '..');

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  printHelp();
  process.exit(0);
}

const confirmed = takeFlag(args, '--yes');
const profile = takeOption(args, '--profile') ?? 'default';
const configPath = takeOption(args, '--config');
const configured = configPath
  ? await loadDeploymentDefaults(path.resolve(configPath))
  : {};
const region =
  takeOption(args, '--region') ??
  configured.region ??
  'us-east-1';
const timeoutMinutes = positiveInteger(
  takeOption(args, '--timeout-minutes') ?? '20',
  '--timeout-minutes',
);
assertNoArguments(args);
if (!confirmed) {
  throw new Error(
    'Cleanup terminates all project sessions and deletes the stacks; rerun with --yes',
  );
}

const credentials = defaultProvider({ profile });
const clientConfiguration = { region, credentials };
const cloudFormation = new CloudFormationClient(clientConfiguration);
const microvms = new LambdaMicrovmsClient(clientConfiguration);
const dynamo = DynamoDBDocumentClient.from(
  new DynamoDBClient(clientConfiguration),
  { marshallOptions: { removeUndefinedValues: true } },
);
const platformStack = await optionalStack(PLATFORM_STACK);

if (platformStack) {
  const tableName = requiredOutput(
    platformStack,
    'SessionsTableName',
  );
  const sessions = await loadSessions(tableName);
  process.stdout.write(
    `Terminating ${sessions.length} recorded sessions...\n`,
  );
  for (const session of sessions) {
    await terminateSession(tableName, session);
  }

  await run('npx', [
    'tsx',
    'scripts/provision-microvm.ts',
    'delete',
    '--region',
    region,
    '--profile',
    profile,
    '--stack',
    PLATFORM_STACK,
    '--timeout-minutes',
    String(timeoutMinutes),
  ]);
  await deleteStack(PLATFORM_STACK);
} else {
  process.stdout.write(
    `${PLATFORM_STACK} does not exist; skipping it.\n`,
  );
}

if (await optionalStack(BUILD_STACK)) {
  process.stdout.write(
    `Deleting legacy stack ${BUILD_STACK}...\n`,
  );
  await deleteStack(BUILD_STACK);
}

process.stdout.write(
  'Cleanup complete. Retained workspace data, session records, and the KMS key were not deleted.\n',
);

async function terminateSession(
  tableName: string,
  session: SessionRecord,
): Promise<void> {
  if (
    session.microvmId &&
    session.state !== 'TERMINATED'
  ) {
    process.stdout.write(
      `Terminating ${session.sessionId} (${session.microvmId})...\n`,
    );
    try {
      await microvms.send(
        new TerminateMicrovmCommand({
          microvmIdentifier: session.microvmId,
        }),
      );
      await waitForTermination(session.microvmId);
    } catch (error) {
      if (!isNotFound(error)) {
        throw error;
      }
    }
  }

  await dynamo.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { sessionId: session.sessionId },
      UpdateExpression:
        'SET #state = :terminated, updatedAt = :now',
      ExpressionAttributeNames: { '#state': 'state' },
      ExpressionAttributeValues: {
        ':terminated': 'TERMINATED',
        ':now': Math.floor(Date.now() / 1_000),
      },
    }),
  );
}

async function waitForTermination(
  microvmId: string,
): Promise<void> {
  const deadline = Date.now() + timeoutMinutes * 60_000;
  while (Date.now() < deadline) {
    try {
      const result = await microvms.send(
        new GetMicrovmCommand({
          microvmIdentifier: microvmId,
        }),
      );
      if (result.state === 'TERMINATED') {
        return;
      }
    } catch (error) {
      if (isNotFound(error)) {
        return;
      }
      throw error;
    }
    await delay(5_000);
  }
  throw new Error(
    `Timed out waiting for MicroVM ${microvmId} to terminate`,
  );
}

async function loadSessions(
  tableName: string,
): Promise<SessionRecord[]> {
  const sessions: SessionRecord[] = [];
  let exclusiveStartKey:
    | Record<string, unknown>
    | undefined;
  do {
    const result = await dynamo.send(
      new ScanCommand({
        TableName: tableName,
        ConsistentRead: true,
        ExclusiveStartKey: exclusiveStartKey,
      }),
    );
    sessions.push(...((result.Items ?? []) as SessionRecord[]));
    exclusiveStartKey = result.LastEvaluatedKey;
  } while (exclusiveStartKey);
  return sessions;
}

async function optionalStack(
  name: string,
): Promise<Stack | undefined> {
  try {
    const result = await cloudFormation.send(
      new DescribeStacksCommand({ StackName: name }),
    );
    return result.Stacks?.[0];
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === 'ValidationError' &&
      error.message.includes('does not exist')
    ) {
      return undefined;
    }
    throw error;
  }
}

function requiredOutput(stack: Stack, name: string): string {
  const value = stack.Outputs?.find(
    (output) => output.OutputKey === name,
  )?.OutputValue;
  if (!value) {
    throw new Error(`Stack output is missing: ${name}`);
  }
  return value;
}

async function deleteStack(name: string): Promise<void> {
  await cloudFormation.send(
    new DeleteStackCommand({ StackName: name }),
  );
  const deadline = Date.now() + timeoutMinutes * 60_000;
  while (Date.now() < deadline) {
    const stack = await optionalStack(name);
    if (!stack) {
      return;
    }
    if (stack.StackStatus?.endsWith('_FAILED')) {
      throw new Error(
        `Stack ${name} entered ${stack.StackStatus}: ` +
          `${stack.StackStatusReason ?? 'no reason returned'}`,
      );
    }
    await delay(10_000);
  }
  throw new Error(`Timed out deleting stack ${name}`);
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

async function loadDeploymentDefaults(
  filename: string,
): Promise<{ region?: string }> {
  const value = JSON.parse(
    await readFile(filename, 'utf8'),
  ) as unknown;
  if (!isRecord(value)) {
    throw new Error(
      'Deployment configuration must be a JSON object',
    );
  }
  return {
    region: optionalString(value.region, 'region'),
  };
}

function optionalString(
  value: unknown,
  name: string,
): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== 'string' || !value) {
    throw new Error(`${name} must be a non-empty string`);
  }
  return value;
}

function isNotFound(error: unknown): boolean {
  return (
    error instanceof Error &&
    [
      'ResourceNotFoundException',
      'NotFoundException',
    ].includes(error.name)
  );
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

function positiveInteger(
  value: string,
  name: string,
): number {
  const parsed = Number.parseInt(value, 10);
  if (
    !Number.isSafeInteger(parsed) ||
    parsed <= 0 ||
    String(parsed) !== value
  ) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

function assertNoArguments(values: string[]): void {
  if (values.length > 0) {
    throw new Error(`Unexpected argument: ${values[0]}`);
  }
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) =>
    setTimeout(resolve, milliseconds),
  );
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
  process.stdout.write(`Usage: npm run cleanup -- --yes [options]

Terminates project sessions, deletes the MicroVM image and connector, then
deletes the platform and any legacy runtime-build stack. Retained workspace
data, session records, and the KMS key are not deleted.

Options:
  --yes                             Confirm destructive cleanup
  --config <file>                   Read Region from deployment JSON
  --region <region>                 AWS Region (default: us-east-1)
  --profile <profile>               AWS profile (default: default)
  --timeout-minutes <minutes>       Per-resource polling deadline
  --help                            Show this help without calling AWS
`);
}
