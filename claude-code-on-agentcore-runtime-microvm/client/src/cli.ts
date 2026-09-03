import process from 'node:process';
import {
  ApiError,
  type ClaudeInferenceMode,
  ControlApiClient,
  type SessionView,
} from './api.js';
import { attachTerminal } from './terminal.js';

let region = 'us-east-1';
let profile = 'default';
let stackName = 'ClaudeAgentCoreRuntimeStack';
let apiUrl: string | undefined;
let jsonOutput = false;

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  region = takeOption(args, '--region') ?? 'us-east-1';
  profile = takeOption(args, '--profile') ?? 'default';
  stackName = takeOption(args, '--stack') ?? 'ClaudeAgentCoreRuntimeStack';
  apiUrl =
    takeOption(args, '--api-url') ?? process.env.CLAUDE_AGENTCORE_API_URL;
  jsonOutput = takeFlag(args, '--json');
  const command = args.shift() ?? 'help';

  const client = new ControlApiClient({ region, profile, stackName, apiUrl });

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
      printStartResult(result);
      if (!noConnect) {
        await attachTerminal(await client.connect(result.session.sessionId));
      }
      break;
    }
    case 'connect': {
      const sessionId = requiredArgument(args, 'session ID');
      assertNoArguments(args);
      await attachTerminal(await client.connect(sessionId));
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
      const session = await client.get(requiredArgument(args, 'session ID'));
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

function printStartResult(result: {
  created: boolean;
  session: SessionView;
}): void {
  if (jsonOutput) {
    printJson(result);
    return;
  }
  process.stdout.write(
    `${result.created ? 'Started' : 'Using'} terminal session ` +
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
      ...(session.runtimeExpiresAt
        ? [`Expires:       ${formatTimestamp(session.runtimeExpiresAt)}`]
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
  connect <session-id>              Attach the local terminal
  list                              List sessions owned by this IAM principal
  status <session-id>               Show one session
  suspend <session-id>              Checkpoint (emulated suspend)
  resume <session-id>               Resume a session
  terminate <session-id>            Checkpoint and terminate

Session options:
  --claude-provider <provider>      bedrock, claude-ai, or claude-gateway
  --no-connect                      Do not attach after terminal start

Global options:
  --region <region>                 AWS Region (default: us-east-1)
  --profile <profile>               AWS profile (default: default)
  --stack <name>                    CloudFormation stack name
  --api-url <url>                   Skip stack-output discovery
  --json                            Emit JSON for non-terminal commands

This source-tree CLI is intended for IAM-authorized operator automation.
`);
}

function takeClaudeProvider(
  values: string[],
): ClaudeInferenceMode | undefined {
  const value = takeOption(values, '--claude-provider');
  if (value === undefined) {
    return undefined;
  }
  if (value !== 'bedrock' && value !== 'claude-ai' && value !== 'claude-gateway') {
    throw new Error(
      '--claude-provider must be bedrock, claude-ai, or claude-gateway',
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
