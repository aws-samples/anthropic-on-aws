// Signing relay for the browser portal's interactive terminal.
//
// Browsers cannot open a SigV4-signed WebSocket upgrade, and cannot set
// custom headers on a WebSocket upgrade at all -- but
// InvokeAgentRuntimeCommandShell requires both (a SigV4 signature, and the
// runtime session id as a *signed header*, not a query param; see
// ../shared/shell-signing.ts). This relay is the server-side component
// that does the signing on the browser's behalf: it terminates a plain
// WebSocket connection from the browser (reached via the same private
// API's CloudFront + internal ALB path used for everything else), opens
// a second, properly signed WebSocket to the real AgentCore Runtime shell
// endpoint, and pipes bytes between the two verbatim. It does not
// interpret the shell-protocol channel framing at all -- that happens at
// the browser (site.ts) and CLI (terminal.ts) ends, same wire format for
// both.
//
// Auth model: the control-plane Lambda's /portal/sessions/{id}/connect
// route (already Cognito-authenticated, already ownership-checked) mints
// a random single-use token and writes {runtimeSessionId, shellId,
// agentRuntimeArn} to the RelayTokens DynamoDB table with a short TTL.
// The browser's WebSocket URL carries only that opaque token, never the
// real AgentCore identifiers or any AWS credentials. This relay's IAM
// task role is scoped to bedrock-agentcore:InvokeAgentRuntimeCommandShell
// on the one deployed AgentRuntime, plus GetItem/DeleteItem on
// RelayTokens -- it cannot reach any other AWS resource with those
// credentials.
import { createServer } from 'node:http';
import process from 'node:process';
import { WebSocketServer, WebSocket as ClientWebSocket } from 'ws';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  DeleteCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { signShellUpgrade } from '../../shared/shell-signing.js';

const PORT = Number(process.env.PORT ?? 8080);
const REGION = requiredEnvironment('AWS_REGION');
const RELAY_TOKENS_TABLE_NAME = requiredEnvironment('RELAY_TOKENS_TABLE_NAME');
const BOOTSTRAPPED_SESSIONS_TABLE_NAME = requiredEnvironment(
  'BOOTSTRAPPED_SESSIONS_TABLE_NAME',
);

// Shell-protocol channel-prefix framing (Kubernetes v5.channel.k8s.io wire
// format: [1-byte channel id][payload]; see client/src/shell-protocol.ts
// for the full channel table and the SDK confirmation). The relay is
// otherwise a dumb byte pipe with zero protocol awareness -- this one
// constant is the sole exception, needed to inject the developer-shell
// bootstrap command server-side. See the long comment on
// maybeBootstrapSession() below for why it has to live here and not in
// the browser or CLI clients.
const SHELL_CHANNEL_STDIN = 0x00;

const documentClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: REGION }),
);
const credentials = defaultProvider();

interface RelayTokenRecord {
  token: string;
  runtimeSessionId: string;
  shellId: string;
  agentRuntimeArn: string;
  ttl: number;
}

const httpServer = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'text/plain' }).end('ok');
    return;
  }
  res.writeHead(404).end();
});

const wss = new WebSocketServer({ noServer: true });

httpServer.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url ?? '/', 'http://relay.internal');
  if (url.pathname !== '/shell') {
    socket.destroy();
    return;
  }
  wss.handleUpgrade(request, socket, head, (browserSocket) => {
    handleBrowserConnection(browserSocket, url).catch((error) => {
      console.error('shell relay connection failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      try {
        browserSocket.close(1011, 'Relay error');
      } catch {
        // Socket may already be closed.
      }
    });
  });
});

async function handleBrowserConnection(
  browserSocket: ClientWebSocket,
  requestUrl: URL,
): Promise<void> {
  const token = requestUrl.searchParams.get('token');
  if (!token) {
    browserSocket.close(4400, 'Missing token');
    return;
  }

  const record = await consumeRelayToken(token);
  if (!record) {
    browserSocket.close(4401, 'Invalid or expired token');
    return;
  }

  const shellUrl = new URL(
    `wss://bedrock-agentcore.${REGION}.amazonaws.com/runtimes/` +
      `${encodeURIComponent(record.agentRuntimeArn)}/ws/shells?shellId=` +
      `${encodeURIComponent(record.shellId)}`,
  );
  const signed = await signShellUpgrade(
    shellUrl,
    record.runtimeSessionId,
    credentials,
  );

  const upstreamSocket = new ClientWebSocket(shellUrl, {
    headers: signed.headers,
    followRedirects: false,
    maxPayload: 1024 * 1024,
    perMessageDeflate: false,
  });

  const closeBoth = (code: number, reason: string): void => {
    for (const socket of [browserSocket, upstreamSocket]) {
      if (
        socket.readyState === ClientWebSocket.OPEN ||
        socket.readyState === ClientWebSocket.CONNECTING
      ) {
        try {
          socket.close(code, reason);
        } catch {
          // Already closing.
        }
      }
    }
  };

  upstreamSocket.once('open', () => {
    upstreamSocket.on('message', (data, isBinary) => {
      if (browserSocket.readyState === ClientWebSocket.OPEN) {
        browserSocket.send(data, { binary: isBinary });
      }
    });
    // See maybeBootstrapSession()'s own comment for why this has to run
    // here (server-side, in the relay, exactly once per AgentCore
    // session) rather than in the browser or CLI client. Fire-and-forget
    // deliberately: a failure here should not break the connection --
    // worst case the developer lands in an unconfigured root shell,
    // exactly like before this fix existed, not a broken one.
    maybeBootstrapSession(record.runtimeSessionId, upstreamSocket).catch(
      (error) => {
        console.error('bootstrap injection failed', {
          runtimeSessionId: record.runtimeSessionId,
          error: error instanceof Error ? error.message : String(error),
        });
      },
    );
  });
  upstreamSocket.once('error', (error) => {
    console.error('upstream AgentCore Runtime shell error', {
      error: error.message,
    });
    closeBoth(1011, 'Upstream shell error');
  });
  upstreamSocket.once('close', (code, reason) => {
    closeBoth(code, reason.toString());
  });

  browserSocket.on('message', (data, isBinary) => {
    if (upstreamSocket.readyState === ClientWebSocket.OPEN) {
      upstreamSocket.send(data, { binary: isBinary });
    }
  });
  browserSocket.once('error', () => {
    closeBoth(1011, 'Browser socket error');
  });
  browserSocket.once('close', (code, reason) => {
    closeBoth(code, reason.toString());
  });
}

async function maybeBootstrapSession(
  runtimeSessionId: string,
  upstreamSocket: ClientWebSocket,
): Promise<void> {
  // This is the fourth attempt at getting this specific bug right, and
  // it is worth recording exactly why the first three (all client-side)
  // did not work, confirmed by live re-test each time -- not just in
  // review, but by actually reconnecting and watching it break again:
  //   1. Gating the resend on the shell protocol's own STATUS-frame
  //      metadata.reconnected flag: stayed false even when reattaching
  //      to a session whose shell already had claude running.
  //   2. A sessionStorage flag keyed by AgentCore sessionId: only
  //      covers reconnects from the same browser tab; a fresh tab (or
  //      the CLI, or a different browser) reattaching to the same
  //      session still resent it.
  //   3. Comparing the session record's lastActivityAt to createdAt:
  //      lastActivityAt is a control-plane bookkeeping timestamp, only
  //      touched by control-plane API calls (connect, the reconciler
  //      poll). Real keystrokes never touch the control plane at all --
  //      they go browser -> this relay -> AgentCore directly -- so this
  //      field does not track what it looked like it should.
  //
  // The actual root cause underneath all three: AgentCore's shell
  // attach reattaches to one persistent PTY per session (like tmux
  // attach), not a fresh shell per connect. Sending the bootstrap
  // command into that PTY when something is already attached and
  // running (typically claude) sends it as literal keystrokes into
  // whatever currently has focus; claude treats it as pasted chat text,
  // drops into its own "manual mode", and swallows every further
  // keystroke into that chat prompt instead of a shell.
  //
  // The only component that is both authoritative and present for
  // every real connection to a given session's shell -- regardless of
  // browser tab, device, or client -- is this relay. So the fix has to
  // live here: durable, server-side state (DynamoDB, survives relay
  // task restarts/redeploys) recording whether this AgentCore session
  // has ever been bootstrapped, checked and claimed atomically before
  // the first byte is ever sent upstream for that session.
  //
  // Deliberately does not cover the CLI (client/src/terminal.ts), which
  // signs its own direct connection to AgentCore and never goes through
  // this relay -- but the CLI already sends this same bootstrap command
  // itself on every connect via developerShellBootstrapCommand(), so a
  // CLI connection and a portal connection racing to bootstrap the same
  // session is a real but separate, pre-existing, narrower gap that
  // would need its own fix in the control plane if it turns out to
  // matter in practice.
  const claimed = await claimFirstBootstrap(runtimeSessionId);
  if (!claimed) {
    return;
  }
  const command = Buffer.from(
    'exec setpriv --reuid=1000 --regid=1000 --init-groups ' +
      '/usr/local/bin/developer-shell\n',
    'utf8',
  );
  const frame = Buffer.concat([Buffer.from([SHELL_CHANNEL_STDIN]), command]);
  if (upstreamSocket.readyState === ClientWebSocket.OPEN) {
    upstreamSocket.send(frame);
  }
}

async function claimFirstBootstrap(runtimeSessionId: string): Promise<boolean> {
  try {
    await documentClient.send(
      new PutCommand({
        TableName: BOOTSTRAPPED_SESSIONS_TABLE_NAME,
        Item: {
          runtimeSessionId,
          bootstrappedAt: Math.floor(Date.now() / 1_000),
        },
        ConditionExpression: 'attribute_not_exists(runtimeSessionId)',
      }),
    );
    return true;
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === 'ConditionalCheckFailedException'
    ) {
      // Already bootstrapped by an earlier connection -- correct,
      // expected outcome on every reconnect, not an error.
      return false;
    }
    throw error;
  }
}

async function consumeRelayToken(
  token: string,
): Promise<RelayTokenRecord | undefined> {
  // DeleteCommand with ReturnValues makes lookup and single-use consumption
  // atomic: a token can only ever be redeemed once, closing the same class
  // of "caller-supplied identifier trusted without verification" gap this
  // sample's checkpoint-urls route has (see PR review). ConditionExpression
  // guards against redeeming a token that already expired but has not yet
  // been swept by DynamoDB TTL (TTL deletion is not instantaneous).
  const now = Math.floor(Date.now() / 1_000);
  try {
    const result = await documentClient.send(
      new DeleteCommand({
        TableName: RELAY_TOKENS_TABLE_NAME,
        Key: { token },
        ConditionExpression: '#ttl > :now',
        ExpressionAttributeNames: { '#ttl': 'ttl' },
        ExpressionAttributeValues: { ':now': now },
        ReturnValues: 'ALL_OLD',
      }),
    );
    const item = result.Attributes as RelayTokenRecord | undefined;
    if (
      !item ||
      typeof item.runtimeSessionId !== 'string' ||
      typeof item.shellId !== 'string' ||
      typeof item.agentRuntimeArn !== 'string'
    ) {
      return undefined;
    }
    return item;
  } catch (error) {
    if (error instanceof Error && error.name === 'ConditionalCheckFailedException') {
      return undefined;
    }
    throw error;
  }
}

function requiredEnvironment(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

httpServer.listen(PORT, () => {
  console.log(`shell relay listening on :${PORT}`);
});
