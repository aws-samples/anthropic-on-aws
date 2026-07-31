#!/usr/bin/env node
import { createHash } from 'node:crypto';
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import {
  CreateMicrovmShellAuthTokenCommand,
  GetMicrovmCommand,
  LambdaMicrovmsClient,
  RunMicrovmCommand,
  TerminateMicrovmCommand,
} from '@aws-sdk/client-lambda-microvms';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  GetParameterCommand,
  SSMClient,
} from '@aws-sdk/client-ssm';
import WebSocket from 'ws';

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  printHelp();
  process.exit(0);
}
const region = takeOption(args, '--region') ?? 'us-east-1';
const profile = takeOption(args, '--profile') ?? 'default';
const stackName =
  takeOption(args, '--stack') ?? 'ClaudeMicrovmStack';
assertNoArguments(args);

const credentials = defaultProvider({ profile });
const clientConfiguration = { region, credentials };
const cloudFormation = new CloudFormationClient(clientConfiguration);
const microvms = new LambdaMicrovmsClient(clientConfiguration);
const s3 = new S3Client(clientConfiguration);
const ssm = new SSMClient(clientConfiguration);

const stack = (
  await cloudFormation.send(
    new DescribeStacksCommand({ StackName: stackName }),
  )
).Stacks?.[0];
if (!stack) {
  throw new Error(`Stack not found: ${stackName}`);
}
const outputs = new Map(
  (stack.Outputs ?? []).flatMap((output) =>
    output.OutputKey && output.OutputValue
      ? [[output.OutputKey, output.OutputValue]]
      : [],
  ),
);
const parameters = new Map(
  (stack.Parameters ?? []).flatMap((parameter) =>
    parameter.ParameterKey && parameter.ParameterValue
      ? [[parameter.ParameterKey, parameter.ParameterValue]]
      : [],
  ),
);
const imageArn = await parameterValue(
  requiredOutput('ImageParameterName'),
);
const connectorArn = await parameterValue(
  requiredOutput('NetworkConnectorParameterName'),
);
const claudeGatewayUrl = requiredParameter('ClaudeGatewayUrl');
const agentCoreGatewayUrl = parameters.get('AgentCoreGatewayUrl');
const claudeDeviceUrl = new URL('/device', claudeGatewayUrl).toString();
const terminalInputPayload = Buffer.from(
  Array.from(
    { length: 1_024 },
    (_, index) => 'abcdefghijklmnopqrstuvwxyz'[index % 26],
  ).join(''),
);
const terminalInputSha256 = createHash('sha256')
  .update(terminalInputPayload)
  .digest('hex');
const executionRoleArn = requiredOutput('MicrovmExecutionRoleArn');
const logGroup = requiredOutput('MicrovmLogGroupName');
const bucket = requiredOutput('WorkspaceBucketName');
const partition = executionRoleArn.split(':')[1];
if (!partition) {
  throw new Error(`Invalid execution role ARN: ${executionRoleArn}`);
}
const managedConnectorArn = (type) =>
  `arn:${partition}:lambda:${region}:aws:network-connector:` +
  `aws-network-connector:${type}`;

const suffix = Date.now().toString(36);
const sessionId = `egress-${suffix}`;
const ownerHash = createHash('sha256')
  .update(`runtime-egress-validation:${sessionId}`)
  .digest('hex');
const checkpointKey =
  `workspaces/${ownerHash}/${sessionId}/checkpoint.tar.gz`;
const uploadUrl = await getSignedUrl(
  s3,
  new PutObjectCommand({
    Bucket: bucket,
    Key: checkpointKey,
    ContentType: 'application/gzip',
  }),
  { expiresIn: 3_600 },
);
const runHookPayload = JSON.stringify({
  version: 3,
  sessionId,
  ownerHash,
  workspaceId: sessionId,
  awsRegion: region,
  inferenceMode: 'claude-gateway',
  accessMode: 'terminal',
  claudeGatewayUrl,
  ...(agentCoreGatewayUrl ? { agentCoreGatewayUrl } : {}),
  checkpoint: { uploadUrl },
});

const run = await microvms.send(
  new RunMicrovmCommand({
    imageIdentifier: imageArn,
    ingressNetworkConnectors: [
      managedConnectorArn('SHELL_INGRESS'),
    ],
    egressNetworkConnectors: [connectorArn],
    executionRoleArn,
    idlePolicy: {
      autoResumeEnabled: true,
      maxIdleDurationSeconds: 900,
      suspendedDurationSeconds: 900,
    },
    logging: { cloudWatch: { logGroup } },
    runHookPayload,
    maximumDurationInSeconds: 1_800,
    clientToken: sessionId,
  }),
);
if (!run.microvmId) {
  throw new Error('RunMicrovm returned no MicroVM ID');
}

const microvmId = run.microvmId;
let endpoint = run.endpoint;
process.stdout.write(`Started validation MicroVM ${microvmId}.\n`);
try {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const description = await microvms.send(
      new GetMicrovmCommand({ microvmIdentifier: microvmId }),
    );
    endpoint = description.endpoint ?? endpoint;
    if (description.state === 'RUNNING') {
      break;
    }
    if (
      description.state === 'FAILED' ||
      description.state === 'TERMINATED'
    ) {
      throw new Error(
        `MicroVM entered ${description.state}: ` +
          `${description.stateReason ?? 'no reason returned'}`,
      );
    }
    if (attempt === 59) {
      throw new Error('Timed out waiting for the MicroVM to run');
    }
    await delay(5_000);
  }
  if (!endpoint) {
    throw new Error('Running MicroVM returned no endpoint');
  }

  const token = await microvms.send(
    new CreateMicrovmShellAuthTokenCommand({
      microvmIdentifier: microvmId,
      expirationInMinutes: 10,
    }),
  );
  const authToken = token.authToken?.['X-aws-proxy-auth'];
  if (!authToken) {
    throw new Error('Shell token response is missing X-aws-proxy-auth');
  }

  let transcript = await runProbe(endpoint, authToken);
  if (cleanTranscript(transcript).includes(claudeDeviceUrl)) {
    transcript += '\nCLAUDE_DEVICE_AUTHORIZATION\n';
  }
  if (/\x1b\[48(?:;|:)2(?:;|:)/.test(transcript)) {
    throw new Error(
      'Claude emitted a truecolor background on the ANSI terminal path',
    );
  }
  transcript += '\nANSI_RENDERING_SAFE\n';
  process.stdout.write(`${cleanTranscript(transcript)}\n`);
  for (const marker of [
    'NO_PROXY_ENV',
    'ANSI_TERMINAL_DEFAULTS',
    'ANSI_RENDERING_SAFE',
    'TERMINAL_INPUT_EXACT',
    'GATEWAY_HTTP 200',
    'PUBLIC_ANTHROPIC_REACHABLE',
    ...(agentCoreGatewayUrl
      ? [
          'AGENTCORE_MANAGED_MCP',
          'AGENTCORE_TOOLS_LIST',
          'AGENTCORE_WEBSEARCH_CALL',
        ]
      : []),
    'CLAUDE_DEVICE_AUTHORIZATION',
    '=== PROBE_DONE ===',
  ]) {
    if (!transcript.includes(marker)) {
      throw new Error(`Runtime validation marker is missing: ${marker}`);
    }
  }
  if (
    /Unable to connect to Anthropic services|ECONNREFUSED api\.anthropic\.com/i.test(
      transcript,
    )
  ) {
    throw new Error('Claude Code still failed its connectivity preflight');
  }
  process.stdout.write(
    'Runtime egress validation passed; Claude displayed the gateway device authorization URL.\n',
  );
} finally {
  process.stdout.write(`Terminating ${microvmId}...\n`);
  await microvms
    .send(
      new TerminateMicrovmCommand({
        microvmIdentifier: microvmId,
      }),
    )
    .catch(() => undefined);
}

async function runProbe(endpoint, authToken) {
  const endpointUrl = new URL(
    endpoint.startsWith('http') ? endpoint : `https://${endpoint}`,
  );
  const websocketUrl = `wss://${endpointUrl.host}/shell`;
  const script = probeScript();

  return new Promise((resolve, reject) => {
    const socket = new WebSocket(websocketUrl, {
      headers: { 'X-aws-proxy-auth': authToken },
    });
    let transcript = '';
    let initialized = false;
    let themeAccepted = false;
    let terminalInputSent = false;
    let gatewayConnectAccepted = false;
    let gatewayTrustAccepted = false;
    let loginInterruptSent = false;
    let loginExitConfirmationSent = false;
    let settled = false;
    const timeout = setTimeout(() => {
      finish(
        new Error(
          'Timed out waiting for the runtime probe\n' +
            cleanTranscript(transcript).slice(-4_000),
        ),
      );
    }, 150_000);

    const finish = (error) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeout);
      socket.close();
      if (error) {
        reject(error);
      } else {
        resolve(transcript);
      }
    };

    socket.on('message', (data, isBinary) => {
      const text = Buffer.from(data).toString('utf8');
      if (
        !isBinary &&
        !initialized &&
        text.includes('"type":"session_init"')
      ) {
        initialized = true;
        sendTextFrame(
          socket,
          JSON.stringify({ type: 'resize', rows: 40, cols: 120 }),
        )
          .then(() => sendProbeScript(socket, script))
          .catch(finish);
        return;
      }
      transcript += text;
      const cleaned = cleanTranscript(transcript);
      const compact = cleaned.replace(/\s+/g, '').toLowerCase();
      if (
        !terminalInputSent &&
        cleaned.includes('__TERMINAL_INPUT_READY__')
      ) {
        terminalInputSent = true;
        for (let index = 0; index < terminalInputPayload.length; index += 1) {
          socket.send(terminalInputPayload.subarray(index, index + 1), {
            binary: true,
          });
        }
      }
      if (
        !themeAccepted &&
        compact.includes('choosethetextstylethatlooksbest')
      ) {
        themeAccepted = true;
        socket.send(Buffer.from('\r'), { binary: true });
      }
      if (
        !gatewayConnectAccepted &&
        compact.includes('pressentertoconnect')
      ) {
        gatewayConnectAccepted = true;
        socket.send(Buffer.from('\r'), { binary: true });
      }
      if (
        gatewayConnectAccepted &&
        !gatewayTrustAccepted &&
        compact.includes('trustgateway') &&
        compact.includes('yes,trustthisgateway')
      ) {
        gatewayTrustAccepted = true;
        // "No, go back" is selected by default, so move to "Yes".
        sendBinaryFrame(socket, '\x1b[A')
          .then(() => delay(250))
          .then(() => sendBinaryFrame(socket, '\r'))
          .catch(finish);
      }
      if (
        !loginInterruptSent &&
        cleaned.includes(claudeDeviceUrl)
      ) {
        loginInterruptSent = true;
        socket.send(Buffer.from('\x03'), { binary: true });
      }
      if (
        loginInterruptSent &&
        !loginExitConfirmationSent &&
        compact.includes('pressctrl-cagaintoexit')
      ) {
        loginExitConfirmationSent = true;
        socket.send(Buffer.from('\x03'), { binary: true });
      }
      if (transcript.includes('=== PROBE_DONE ===')) {
        setTimeout(() => finish(), 1_000);
      }
    });
    socket.on('error', finish);
    socket.on('close', () => {
      if (!settled) {
        finish(new Error('Shell WebSocket closed before the probe completed'));
      }
    });
  });
}

async function sendProbeScript(socket, script) {
  const encoded = Buffer.from(script).toString('base64');
  await sendCommandAndWait(
    socket,
    "stty -echo; printf '__VALIDATE_INIT_%s__\\n' 'READY'\n",
    '__VALIDATE_INIT_READY__',
  );
  await sendCommandAndWait(
    socket,
    ": >/tmp/validate-egress.b64; printf '__VALIDATE_FILE_%s__\\n' 'READY'\n",
    '__VALIDATE_FILE_READY__',
  );
  // PTY canonical input lines are limited to roughly 4 KiB.
  for (let offset = 0; offset < encoded.length; offset += 512) {
    const chunk = encoded.slice(offset, offset + 512);
    const index = offset / 512;
    await sendCommandAndWait(
      socket,
      `printf '%s' '${chunk}' >>/tmp/validate-egress.b64; ` +
        `printf '__VALIDATE_CHUNK_%s__\\n' '${index}'\n`,
      `__VALIDATE_CHUNK_${index}__`,
    );
  }
  await sendCommandAndWait(
    socket,
    'base64 -d </tmp/validate-egress.b64 >/tmp/validate-egress.sh ' +
      '&& rm /tmp/validate-egress.b64 ' +
      '&& chmod 700 /tmp/validate-egress.sh ' +
      '&& bash -n /tmp/validate-egress.sh ' +
      "&& printf '__VALIDATE_SCRIPT_%s__\\n' 'READY'\n",
    '__VALIDATE_SCRIPT_READY__',
  );
  await sendBinaryFrame(socket, '/tmp/validate-egress.sh\n');
}

async function sendCommandAndWait(socket, command, marker) {
  await Promise.all([
    waitForSocketText(socket, marker),
    sendBinaryFrame(socket, command),
  ]);
}

function waitForSocketText(socket, marker) {
  return new Promise((resolve, reject) => {
    let received = '';
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out waiting for shell marker: ${marker}`));
    }, 15_000);
    const cleanup = () => {
      clearTimeout(timeout);
      socket.off('message', onMessage);
      socket.off('close', onClose);
    };
    const onMessage = (data) => {
      received =
        (received + Buffer.from(data).toString('utf8')).slice(
          -Math.max(256, marker.length * 2),
        );
      if (received.includes(marker)) {
        cleanup();
        resolve();
      }
    };
    const onClose = () => {
      cleanup();
      reject(new Error(`Shell closed before marker: ${marker}`));
    };
    socket.on('message', onMessage);
    socket.once('close', onClose);
  });
}

function sendBinaryFrame(socket, value) {
  return new Promise((resolve, reject) => {
    socket.send(Buffer.from(value), { binary: true }, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

function sendTextFrame(socket, value) {
  return new Promise((resolve, reject) => {
    socket.send(value, { binary: false }, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

function probeScript() {
  return `#!/bin/bash
set -euo pipefail
trap 'echo "PROBE_FAILED line=$LINENO"; echo "=== PROBE_DONE ==="' ERR

echo "=== SESSION_ENVIRONMENT ==="
python3.12 - <<'PY'
import json

configuration = json.load(open(
    "/var/lib/claude-microvm/session.json",
    encoding="utf-8",
))
environment = configuration["environment"]
proxy_keys = sorted(
    key for key in environment
    if key.upper() in {"ALL_PROXY", "HTTP_PROXY", "HTTPS_PROXY", "NO_PROXY"}
)
if proxy_keys:
    raise SystemExit("unexpected proxy environment: " + ",".join(proxy_keys))
if environment.get("TERM") != "xterm-256color":
    raise SystemExit("unexpected TERM: " + str(environment.get("TERM")))
if "COLORTERM" in environment:
    raise SystemExit("session must not advertise truecolor")
print("NO_PROXY_ENV")

settings = json.load(open(
    "/workspace/.claude-home/.claude/settings.json",
    encoding="utf-8",
))
expected_settings = {
    "theme": "dark-ansi",
    "tui": "fullscreen",
    "prefersReducedMotion": True,
}
for key, expected in expected_settings.items():
    if settings.get(key) != expected:
        raise SystemExit(
            f"unexpected terminal setting {key}: {settings.get(key)!r}"
        )
print("ANSI_TERMINAL_DEFAULTS")
PY

echo "=== TERMINAL_INPUT ==="
cat > /tmp/validate-terminal-input.py <<'PY'
import hashlib
import os
import termios
import tty

expected_length = ${terminalInputPayload.length}
expected_sha256 = "${terminalInputSha256}"
original = termios.tcgetattr(0)
data = bytearray()
try:
    tty.setraw(0)
    os.write(1, b"\\n__TERMINAL_INPUT_READY__\\n")
    while len(data) < expected_length:
        chunk = os.read(0, expected_length - len(data))
        if not chunk:
            break
        data.extend(chunk)
finally:
    termios.tcsetattr(0, termios.TCSADRAIN, original)

actual_sha256 = hashlib.sha256(data).hexdigest()
if len(data) != expected_length or actual_sha256 != expected_sha256:
    raise SystemExit(
        f"terminal input mismatch: bytes={len(data)} sha256={actual_sha256}"
    )
print("TERMINAL_INPUT_EXACT")
PY
python3.12 /tmp/validate-terminal-input.py

echo "=== PRIVATE_GATEWAY ==="
gateway_code=$(curl --noproxy '*' --silent --show-error \
  --output /dev/null --write-out '%{http_code}' --max-time 15 \
  '${claudeGatewayUrl}/')
echo "GATEWAY_HTTP $gateway_code"
test "$gateway_code" = "200"

echo "=== VPC_NAT_EGRESS ==="
anthropic_code=$(curl --noproxy '*' --silent --show-error \
  --output /dev/null --write-out '%{http_code}' --max-time 15 \
  https://api.anthropic.com/)
echo "ANTHROPIC_HTTP $anthropic_code"
test "$anthropic_code" != "000"
echo "PUBLIC_ANTHROPIC_REACHABLE"

${agentCoreProbeScript()}

cat > /tmp/run-claude.py <<'PY'
import json
import os
import pwd

configuration = json.load(open(
    "/var/lib/claude-microvm/session.json",
    encoding="utf-8",
))
environment = configuration["environment"]
developer = pwd.getpwnam("developer")
os.initgroups("developer", developer.pw_gid)
os.setgid(developer.pw_gid)
os.setuid(developer.pw_uid)
os.chdir("/workspace")
os.execve(
    "/usr/local/bin/claude",
    ["/usr/local/bin/claude"],
    environment,
)
PY
chmod 755 /tmp/run-claude.py

echo "=== CLAUDE_STARTUP ==="
if timeout --foreground --signal=INT 45 python3.12 /tmp/run-claude.py; then
  claude_status=0
else
  claude_status=$?
fi
echo "CLAUDE_EXIT_STATUS $claude_status"
echo "=== PROBE_DONE ==="
`;
}

function agentCoreProbeScript() {
  if (!agentCoreGatewayUrl) {
    return '';
  }
  return `echo "=== AGENTCORE_MCP ==="
cat > /tmp/validate-agentcore-mcp.py <<'PY'
import json
import os
import pwd
import select
import subprocess
import time

gateway_url = ${JSON.stringify(agentCoreGatewayUrl)}
bridge = "/opt/claude-microvm/bridge/dist/agentcore-mcp-bridge.js"
command = ["/usr/bin/node", bridge, gateway_url]

managed = json.load(open(
    "/etc/claude-code/managed-mcp.json",
    encoding="utf-8",
))
server = managed.get("mcpServers", {}).get("agentcore-governed-tools")
if not isinstance(server, dict):
    raise SystemExit("managed AgentCore MCP server is missing")
if server.get("command") != command[0] or server.get("args") != command[1:]:
    raise SystemExit("managed AgentCore MCP command is unexpected")

settings = json.load(open(
    "/etc/claude-code/managed-settings.json",
    encoding="utf-8",
))
if not settings.get("allowManagedMcpServersOnly"):
    raise SystemExit("managed-only MCP enforcement is disabled")
if {"serverCommand": command} not in settings.get("allowedMcpServers", []):
    raise SystemExit("AgentCore MCP command is not allowlisted")
print("AGENTCORE_MANAGED_MCP")

session = json.load(open(
    "/var/lib/claude-microvm/session.json",
    encoding="utf-8",
))
environment = session["environment"]
developer = pwd.getpwnam("developer")

def drop_privileges():
    os.initgroups("developer", developer.pw_gid)
    os.setgid(developer.pw_gid)
    os.setuid(developer.pw_uid)

process = subprocess.Popen(
    command,
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True,
    bufsize=1,
    cwd="/workspace",
    env=environment,
    preexec_fn=drop_privileges,
)

def send(message):
    process.stdin.write(json.dumps(message, separators=(",", ":")) + "\\n")
    process.stdin.flush()

def receive(expected_id, timeout_seconds):
    deadline = time.monotonic() + timeout_seconds
    while time.monotonic() < deadline:
        if process.poll() is not None:
            raise RuntimeError(
                "bridge exited early: " + process.stderr.read()[-2000:]
            )
        readable, _, _ = select.select(
            [process.stdout],
            [],
            [],
            min(1.0, deadline - time.monotonic()),
        )
        if not readable:
            continue
        line = process.stdout.readline()
        if not line:
            continue
        message = json.loads(line)
        if message.get("id") == expected_id:
            return message
    raise TimeoutError(f"timed out waiting for MCP response {expected_id}")

try:
    send({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {
            "protocolVersion": "2025-03-26",
            "capabilities": {},
            "clientInfo": {
                "name": "microvm-runtime-validator",
                "version": "1.0.0",
            },
        },
    })
    initialized = receive(1, 30)
    if "error" in initialized:
        raise RuntimeError(f"MCP initialization failed: {initialized['error']}")
    send({
        "jsonrpc": "2.0",
        "method": "notifications/initialized",
        "params": {},
    })
    send({
        "jsonrpc": "2.0",
        "id": 2,
        "method": "tools/list",
        "params": {},
    })
    listed = receive(2, 30)
    tools = listed.get("result", {}).get("tools", [])
    if len(tools) != 1 or not tools[0].get("name", "").endswith("___WebSearch"):
        raise RuntimeError(f"unexpected AgentCore tools: {tools!r}")
    tool_name = tools[0]["name"]
    print("AGENTCORE_TOOLS_LIST", tool_name)

    send({
        "jsonrpc": "2.0",
        "id": 3,
        "method": "tools/call",
        "params": {
            "name": tool_name,
            "arguments": {
                "query": "AWS Bedrock AgentCore Gateway official documentation",
                "maxResults": 1,
            },
        },
    })
    called = receive(3, 60)
    result = called.get("result", {})
    content = result.get("content", [])
    if "error" in called or result.get("isError") or not content:
        raise RuntimeError(f"AgentCore web search failed: {called!r}")
    print("AGENTCORE_WEBSEARCH_CALL")
finally:
    if process.poll() is None:
        process.terminate()
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait(timeout=5)
PY
chmod 755 /tmp/validate-agentcore-mcp.py
python3.12 /tmp/validate-agentcore-mcp.py`;
}

function cleanTranscript(value) {
  return value
    .replace(/\0/g, '')
    .replace(/\x1b\[[0-9;?]*[ -/]*[@-~]/g, '')
    .replace(/\r/g, '');
}

function requiredOutput(name) {
  const value = outputs.get(name);
  if (!value) {
    throw new Error(`Stack output is missing: ${name}`);
  }
  return value;
}

function requiredParameter(name) {
  const value = parameters.get(name);
  if (!value) {
    throw new Error(`Stack parameter is missing: ${name}`);
  }
  return value;
}

async function parameterValue(name) {
  const result = await ssm.send(
    new GetParameterCommand({ Name: name }),
  );
  if (!result.Parameter?.Value) {
    throw new Error(`SSM parameter has no value: ${name}`);
  }
  return result.Parameter.Value;
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function takeOption(values, name) {
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

function assertNoArguments(values) {
  if (values.length > 0) {
    throw new Error(`Unexpected argument: ${values[0]}`);
  }
}

function printHelp() {
  process.stdout.write(`Usage: npm run validate:runtime -- [options]

Launches a throwaway MicroVM, validates private routing and internet egress
through the VPC NAT gateway, the configured AgentCore MCP gateway, and Claude
Code login startup, then terminates the MicroVM.

Options:
  --region <region>                 AWS Region (default: us-east-1)
  --profile <profile>               AWS profile (default: default)
  --stack <name>                    CloudFormation stack name
  --help                            Show this help without calling AWS
`);
}
