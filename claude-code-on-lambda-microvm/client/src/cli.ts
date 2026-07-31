#!/usr/bin/env node
import process from 'node:process';
import {
  ApiError,
  type ClaudeInferenceMode,
  type ControlApi,
  ControlApiClient,
  type SessionView,
} from './api.js';
import {
  attachTerminal,
  type TunnelIdentityProvider,
  vscodeTunnelLoginCommand,
} from './terminal.js';
import { restartSession } from './lifecycle.js';
import { launchVsCodeTunnel } from './vscode.js';
import { VSCODE_TUNNEL_READY_OUTPUT_PATTERN } from '../../shared/tunnel-output.js';

let region = 'us-east-1';
let profile = 'default';
let stackName = 'ClaudeMicrovmStack';
let apiUrl: string | undefined;
let jsonOutput = false;

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  region = takeOption(args, '--region') ?? 'us-east-1';
  profile = takeOption(args, '--profile') ?? 'default';
  stackName = takeOption(args, '--stack') ?? 'ClaudeMicrovmStack';
  apiUrl =
    takeOption(args, '--api-url') ??
    process.env.CLAUDE_MICROVM_API_URL;
  jsonOutput = takeFlag(args, '--json');
  const command = args.shift() ?? 'help';

  const client = new ControlApiClient({
    region,
    profile,
    stackName,
    apiUrl,
  });

  switch (command) {
    case 'start': {
      const noConnect = takeFlag(args, '--no-connect');
      const inferenceMode = takeClaudeProvider(args);
      const workspaceId = args.shift();
      assertNoArguments(args);
      const result = await client.start(workspaceId, {
        accessMode: 'terminal',
        inferenceMode,
      });
      printStartResult(result, 'terminal');
      if (!noConnect) {
        await attachTerminal(
          await client.connect(result.session.sessionId),
        );
      }
      break;
    }
    case 'vscode': {
      const noLaunch = takeFlag(args, '--no-launch');
      const noLogin = takeFlag(args, '--no-login');
      const inferenceMode = takeClaudeProvider(args);
      const tunnelProvider = takeTunnelProvider(args);
      const workspaceId = args.shift();
      assertNoArguments(args);
      const result = await client.start(workspaceId, {
        accessMode: 'vscode',
        inferenceMode,
        tunnelProvider,
      });
      const tunnelName = requireVsCodeTunnel(result.session);
      printStartResult(result, 'VS Code');
      if (!noLogin) {
        await loginToTunnel(
          client,
          result.session.sessionId,
          tunnelProvider,
        );
      }
      if (!noLaunch) {
        const launched = await launchVsCodeTunnel(tunnelName);
        process.stdout.write(
          `Opened ${launched.uri} with ${launched.cliPath}\n` +
            `Local VS Code state: ${launched.userDataDirectory}\n` +
            'If prompted in VS Code, run "Remote Tunnels: Sign in ' +
            'to Tunnel with a Different Account" and choose ' +
            `${tunnelProvider} with the same identity used for ` +
            'the MicroVM tunnel login.\n',
        );
      }
      break;
    }
    case 'tunnel-login': {
      const tunnelProvider = takeTunnelProvider(args);
      const sessionId = requiredArgument(args, 'session ID');
      assertNoArguments(args);
      requireVsCodeTunnel(await client.get(sessionId));
      await loginToTunnel(client, sessionId, tunnelProvider, true);
      break;
    }
    case 'connect': {
      const sessionId = requiredArgument(args, 'session ID');
      assertNoArguments(args);
      await attachTerminal(await client.connect(sessionId));
      break;
    }
    case 'restart': {
      const noConnect = takeFlag(args, '--no-connect');
      const sessionId = requiredArgument(args, 'session ID');
      assertNoArguments(args);
      const result = await restartSession(client, sessionId);
      printStartResult(
        result,
        result.session.accessMode === 'vscode'
          ? 'VS Code'
          : 'terminal',
      );
      if (
        !noConnect &&
        result.session.accessMode !== 'vscode'
      ) {
        await attachTerminal(
          await client.connect(result.session.sessionId),
        );
      }
      break;
    }
    case 'list': {
      assertNoArguments(args);
      const sessions = await client.list();
      if (jsonOutput) {
        printJson({ sessions });
      } else {
        printSessions(sessions);
      }
      break;
    }
    case 'status': {
      const session = await client.get(
        requiredArgument(args, 'session ID'),
      );
      assertNoArguments(args);
      if (jsonOutput) {
        printJson(session);
      } else {
        printSession(session);
      }
      break;
    }
    case 'suspend':
      await lifecycleCommand(args, client.suspend.bind(client));
      break;
    case 'resume':
      await lifecycleCommand(args, client.resume.bind(client));
      break;
    case 'terminate':
    case 'delete':
      await lifecycleCommand(args, client.terminate.bind(client));
      break;
    case 'help':
    case '--help':
    case '-h':
      printHelp();
      break;
    default:
      throw new Error(`Unknown command: ${command}`);
  }
}

main().catch((error: unknown) => {
  if (error instanceof ApiError) {
    process.stderr.write(
      `Control API error (${error.statusCode}): ${error.message}\n`,
    );
  } else {
    process.stderr.write(
      `${error instanceof Error ? error.message : 'Unknown error'}\n`,
    );
  }
  process.exitCode = 1;
});

async function lifecycleCommand(
  values: string[],
  operation: (sessionId: string) => Promise<SessionView>,
): Promise<void> {
  const sessionId = requiredArgument(values, 'session ID');
  assertNoArguments(values);
  const session = await operation(sessionId);
  if (jsonOutput) {
    printJson(session);
  } else {
    printSession(session);
  }
}

function printStartResult(
  result: { created: boolean; session: SessionView },
  label: string,
): void {
  if (jsonOutput) {
    printJson(result);
    return;
  }
  process.stdout.write(
    `${result.created ? 'Started' : 'Using'} ${label} session ` +
      `${result.session.sessionId} for workspace ` +
      `${result.session.workspaceId} (${result.session.state})\n`,
  );
}

function printSessions(sessions: SessionView[]): void {
  if (sessions.length === 0) {
    process.stdout.write('No sessions.\n');
    return;
  }
  process.stdout.write(
    'SESSION ID                            WORKSPACE       ACCESS    STATE         UPDATED\n',
  );
  for (const session of sessions) {
    process.stdout.write(
      `${session.sessionId.padEnd(37).slice(0, 37)} ` +
        `${session.workspaceId.padEnd(15).slice(0, 15)} ` +
        `${(session.accessMode ?? 'terminal').padEnd(9).slice(0, 9)} ` +
        `${session.state.padEnd(13).slice(0, 13)} ` +
        `${formatTimestamp(session.updatedAt)}\n`,
    );
  }
}

function printSession(session: SessionView): void {
  process.stdout.write(
    [
      `Session:       ${session.sessionId}`,
      `Workspace:     ${session.workspaceId}`,
      `State:         ${session.state}`,
      `Created:       ${formatTimestamp(session.createdAt)}`,
      `Updated:       ${formatTimestamp(session.updatedAt)}`,
      `Last activity: ${formatTimestamp(session.lastActivityAt)}`,
      `Access:        ${session.accessMode ?? 'terminal'}`,
      ...(session.inferenceMode
        ? [`Claude:        ${session.inferenceMode}`]
        : []),
      ...(session.tunnelName
        ? [`Tunnel:        ${session.tunnelName}`]
        : []),
      ...(session.tunnelProvider
        ? [`Tunnel login:  ${session.tunnelProvider}`]
        : []),
      ...(session.imageVersion
        ? [`Image version: ${session.imageVersion}`]
        : []),
      ...(session.microvmExpiresAt
        ? [`Expires:       ${formatTimestamp(session.microvmExpiresAt)}`]
        : []),
      ...(session.failureReason
        ? [`Failure:       ${session.failureReason}`]
        : []),
    ].join('\n') + '\n',
  );
}

function printHelp(): void {
  process.stdout.write(`Usage: npm run client -- [global options] <command>

Commands:
  start [workspace] [options]       Start or reuse a terminal session
  vscode [workspace] [options]      Start/reuse and open a VS Code tunnel
  tunnel-login <session-id>         Authenticate an existing VS Code tunnel
  connect <session-id>              Attach the local terminal
  restart <session-id>              Replace and reconnect a session
  list                              List sessions owned by this IAM principal
  status <session-id>               Show one session
  suspend <session-id>              Checkpoint and suspend
  resume <session-id>               Resume a suspended session
  terminate <session-id>            Checkpoint and terminate

Session options:
  --claude-provider <provider>      bedrock, claude-ai, or claude-gateway
  --no-connect                      Do not attach after terminal start

VS Code options:
  --tunnel-provider <provider>      microsoft (default) or github
  --no-login                        Skip remote tunnel device login
  --no-launch                       Do not launch local VS Code

Global options:
  --region <region>                 AWS Region (default: us-east-1)
  --profile <profile>               AWS profile (default: default)
  --stack <name>                    CloudFormation stack name
  --api-url <url>                   Skip stack-output discovery
  --json                            Emit JSON for non-terminal commands

This source-tree CLI is intended for IAM-authorized operator automation.
Developers use the browser portal for lifecycle and terminal access.
`);
}

async function loginToTunnel(
  client: ControlApi,
  sessionId: string,
  provider: TunnelIdentityProvider,
  force = false,
): Promise<void> {
  await attachTerminal(await client.connect(sessionId), {
    bootstrapCommand: vscodeTunnelLoginCommand(provider, force),
    completionPattern: VSCODE_TUNNEL_READY_OUTPUT_PATTERN,
    connectedMessage:
      `Connected to authenticate the VS Code tunnel with ${provider}.`,
  });
}

function requireVsCodeTunnel(session: SessionView): string {
  if (
    session.accessMode !== 'vscode' ||
    !session.tunnelName
  ) {
    throw new Error(
      `Session ${session.sessionId} is not a VS Code tunnel session`,
    );
  }
  return session.tunnelName;
}

function takeClaudeProvider(
  values: string[],
): ClaudeInferenceMode | undefined {
  const value = takeOption(values, '--claude-provider');
  if (value === undefined) {
    return undefined;
  }
  if (
    value !== 'bedrock' &&
    value !== 'claude-ai' &&
    value !== 'claude-gateway'
  ) {
    throw new Error(
      '--claude-provider must be bedrock, claude-ai, or claude-gateway',
    );
  }
  return value;
}

function takeTunnelProvider(
  values: string[],
): TunnelIdentityProvider {
  const value =
    takeOption(values, '--tunnel-provider') ?? 'microsoft';
  if (value !== 'microsoft' && value !== 'github') {
    throw new Error(
      '--tunnel-provider must be microsoft or github',
    );
  }
  return value;
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

function requiredArgument(values: string[], label: string): string {
  const value = values.shift();
  if (!value) {
    throw new Error(`Missing ${label}`);
  }
  return value;
}

function assertNoArguments(values: string[]): void {
  if (values.length > 0) {
    throw new Error(`Unexpected argument: ${values[0]}`);
  }
}

function formatTimestamp(value: number): string {
  return new Date(value * 1000).toISOString();
}

function printJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}
