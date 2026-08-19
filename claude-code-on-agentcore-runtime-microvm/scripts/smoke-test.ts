#!/usr/bin/env node
// Documented smoke-test script for the deployed sample: opens an
// InvokeAgentRuntimeCommandShell session against the AgentRuntime output
// from `cdk deploy`, runs a couple of real commands, and prints the output.
// Use this after a fresh deploy to confirm the container image is healthy
// end to end, without needing the control-plane API or a portal user.
//
// Usage:
//   npm run smoke-test -- --region us-east-1 --profile default \
//     --runtime-arn arn:aws:bedrock-agentcore:us-east-1:ACCOUNT:runtime/NAME-ID
//
// If --runtime-arn is omitted, it is discovered from the
// ClaudeAgentCoreRuntimeStack CloudFormation output (--stack to override
// the stack name).
import { SignatureV4 } from '@smithy/signature-v4';
import { HttpRequest } from '@smithy/protocol-http';
import { Sha256 } from '@aws-crypto/sha256-js';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import WebSocket from 'ws';
import {
  decodeShellFrame,
  encodeStdin,
  parseShellStatus,
  ShellChannel,
} from '../client/src/shell-protocol.js';

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  printHelp();
  process.exit(0);
}
const region = takeOption(args, '--region') ?? 'us-east-1';
const profile = takeOption(args, '--profile') ?? 'default';
const stackName = takeOption(args, '--stack') ?? 'ClaudeAgentCoreRuntimeStack';
let runtimeArn = takeOption(args, '--runtime-arn');
assertNoArguments(args);

if (!runtimeArn) {
  runtimeArn = await discoverRuntimeArn();
}

process.stdout.write(`Opening shell against ${runtimeArn}\n`);
const sessionId = `smoke-test-${Date.now()}-${Math.random().toString(36).slice(2)}`.padEnd(
  40,
  '0',
);
const shellId = `smoke-${Date.now()}`;
const url = buildShellUrl(runtimeArn, region, shellId);
const headers = await signShellUpgrade(url, region, sessionId);

const socket = new WebSocket(url, { headers });
let output = '';
let connected = false;

await new Promise<void>((resolve, reject) => {
  const timeout = setTimeout(() => {
    reject(new Error('Timed out waiting for the shell to respond'));
  }, 20_000);

  socket.on('message', (data) => {
    const frame = decodeShellFrame(Buffer.from(data as Buffer));
    if (frame.channel === ShellChannel.Status) {
      const status = parseShellStatus(frame.payload);
      if (status.metadata?.shellId && !connected) {
        connected = true;
        setTimeout(() => {
          socket.send(encodeStdin('echo smoke-test-ok\n'));
          socket.send(encodeStdin('python3 --version\n'));
          setTimeout(() => {
            clearTimeout(timeout);
            resolve();
          }, 3_000);
        }, 1_500);
      }
      return;
    }
    if (frame.channel === ShellChannel.Stdout || frame.channel === ShellChannel.Stderr) {
      output += frame.payload.toString('utf8');
    }
  });
  socket.once('error', (error) => {
    clearTimeout(timeout);
    reject(error);
  });
});

socket.close(1000, 'smoke test complete');
process.stdout.write('--- shell output ---\n');
process.stdout.write(output + '\n');

if (!output.includes('smoke-test-ok')) {
  process.stderr.write('Smoke test FAILED: expected output not observed\n');
  process.exitCode = 1;
} else {
  process.stdout.write('Smoke test PASSED\n');
}

function buildShellUrl(arn: string, awsRegion: string, id: string): URL {
  const url = new URL(
    `wss://bedrock-agentcore.${awsRegion}.amazonaws.com/runtimes/` +
      `${encodeURIComponent(arn)}/ws/shells`,
  );
  url.searchParams.set('shellId', id);
  return url;
}

async function signShellUpgrade(
  url: URL,
  awsRegion: string,
  sessionId: string,
): Promise<Record<string, string>> {
  const credentials = await defaultProvider({ profile })();
  const signer = new SignatureV4({
    credentials,
    region: awsRegion,
    service: 'bedrock-agentcore',
    sha256: Sha256,
  });
  const signed = await signer.sign(
    new HttpRequest({
      protocol: url.protocol,
      hostname: url.hostname,
      method: 'GET',
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      headers: {
        host: url.hostname,
        'X-Amzn-Bedrock-AgentCore-Runtime-Session-Id': sessionId,
      },
    }),
  );
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(signed.headers)) {
    if (key.toLowerCase() === 'host') continue;
    headers[key] = value;
  }
  return headers;
}

async function discoverRuntimeArn(): Promise<string> {
  const cloudFormation = new CloudFormationClient({
    region,
    credentials: defaultProvider({ profile }),
  });
  const result = await cloudFormation.send(
    new DescribeStacksCommand({ StackName: stackName }),
  );
  const output = result.Stacks?.[0]?.Outputs?.find(
    (candidate) => candidate.OutputKey === 'AgentRuntimeArn',
  )?.OutputValue;
  if (!output) {
    throw new Error(
      `Stack ${stackName} has no AgentRuntimeArn output; pass --runtime-arn`,
    );
  }
  return output;
}

function takeOption(values: string[], name: string): string | undefined {
  const index = values.indexOf(name);
  if (index < 0) return undefined;
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
  process.stdout.write(`Usage: npm run smoke-test -- [options]

Opens an InvokeAgentRuntimeCommandShell session against a deployed
AgentCore Runtime and runs a couple of real commands to confirm the
container image is healthy.

Options:
  --region <region>        AWS Region (default: us-east-1)
  --profile <profile>      AWS profile (default: default)
  --stack <name>            CloudFormation stack name (default:
                            ClaudeAgentCoreRuntimeStack)
  --runtime-arn <arn>       Skip stack-output discovery
  --help                    Show this help without calling AWS
`);
}
