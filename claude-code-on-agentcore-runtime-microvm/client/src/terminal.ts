import process from 'node:process';
import WebSocket, { type RawData } from 'ws';
import { SignatureV4 } from '@smithy/signature-v4';
import { HttpRequest } from '@smithy/protocol-http';
import { Sha256 } from '@aws-crypto/sha256-js';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import type { ConnectResponse } from './api.js';

const DETACH_BYTE = 0x1d;
const PING_INTERVAL_MILLISECONDS = 1_000;
const PONG_TIMEOUT_MILLISECONDS = 5_000;
// InvokeAgentRuntimeCommandShell connections have a documented 1-hour
// maximum duration (close code 1008); the client must reconnect with the
// same runtimeSessionId/shellId to continue. See docs/deployment-guide.md
// ("Interactive shell reconnect") for the full behavior this implements.
const SHELL_CONNECTION_TTL_MILLISECONDS = 60 * 60 * 1_000;
const RECONNECT_GRACE_MILLISECONDS = 5_000;

export interface AttachTerminalOptions {
  bootstrapCommand?: Buffer;
}

// Reproduce Claude Code's terminal cleanup, same as
// claude-code-on-lambda-microvm/client/src/terminal.ts.
export const TERMINAL_RESTORE_SEQUENCE = [
  '\x1b[?1006l',
  '\x1b[?1003l',
  '\x1b[?1002l',
  '\x1b[?1000l',
  '\x1b[?1005l',
  '\x1b[?1015l',
  '\x1b[?1016l',
  '\x1b[>4m',
  '\x1b[<u',
  '\x1b[?1004l',
  '\x1b[?2031l',
  '\x1b[?2004l',
  '\x1b[?1049l',
  '\x1b(B\x0f',
  '\x1b[0m',
  '\x1b7\x1b[r\x1b8',
  '\x1b[?25h',
].join('');

interface TerminalWritable {
  write(chunk: string | Uint8Array): boolean;
  once(event: 'drain', listener: () => void): unknown;
  off(event: 'drain', listener: () => void): unknown;
}

interface PausableTerminalSource {
  pause(): unknown;
  resume(): unknown;
}

export function createTerminalModeRestorer(output: {
  readonly isTTY: boolean | undefined;
  write(chunk: string): unknown;
}): () => void {
  let restored = false;
  return (): void => {
    if (restored) return;
    restored = true;
    if (!output.isTTY) return;
    try {
      output.write(TERMINAL_RESTORE_SEQUENCE);
    } catch {
      // A closed terminal must not prevent the remaining local cleanup.
    }
  };
}

export class BackpressuredTerminalOutput {
  private waitingForDrain = false;

  public constructor(
    private readonly output: TerminalWritable,
    private readonly source: PausableTerminalSource,
  ) {}

  public write(chunk: string | Uint8Array): void {
    if (this.output.write(chunk) || this.waitingForDrain) return;
    this.waitingForDrain = true;
    this.source.pause();
    this.output.once('drain', this.onDrain);
  }

  public dispose(): void {
    if (!this.waitingForDrain) return;
    this.output.off('drain', this.onDrain);
    this.waitingForDrain = false;
  }

  private readonly onDrain = (): void => {
    this.waitingForDrain = false;
    this.source.resume();
  };
}

/**
 * Attach a local terminal to an AgentCore Runtime interactive shell
 * (`InvokeAgentRuntimeCommandShell`), transparently reconnecting on the
 * documented 1-hour connection-duration limit using the same
 * `runtimeSessionId`/`shellId` pair. Session identity, not the WebSocket
 * connection, is the unit of continuity here -- see the AgentCore Runtime
 * "Interactive Shells (Terminals)" docs.
 */
export async function attachTerminal(
  connection: ConnectResponse,
  options: AttachTerminalOptions = {},
): Promise<void> {
  const inputWasRaw = process.stdin.isRaw;
  const restoreTerminalModes = createTerminalModeRestorer(process.stdout);
  let bootstrapSent = false;

  const detachRequested = { value: false };
  process.stdin.resume();
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }

  try {
    let attempt = 0;
    let shouldReconnect = true;
    while (shouldReconnect) {
      attempt += 1;
      shouldReconnect = await runOneConnection(connection, {
        bootstrapCommand:
          attempt === 1 ? options.bootstrapCommand : undefined,
        alreadyBootstrapped: bootstrapSent,
        detachRequested,
        onBootstrapSent: () => {
          bootstrapSent = true;
        },
      });
    }
  } finally {
    restoreTerminalModes();
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(Boolean(inputWasRaw));
    }
    process.stdin.pause();
  }
}

interface RunConnectionOptions {
  bootstrapCommand?: Buffer;
  alreadyBootstrapped: boolean;
  detachRequested: { value: boolean };
  onBootstrapSent: () => void;
}

/**
 * Runs one WebSocket connection to completion. Returns `true` when the
 * caller should reconnect (TTL expiry / abnormal drop) and `false` when the
 * session ended normally or the user detached.
 */
async function runOneConnection(
  connection: ConnectResponse,
  options: RunConnectionOptions,
): Promise<boolean> {
  const shellUrl = validateShellUrl(connection.shellUrl);
  const signedRequest = await signShellUpgrade(
    shellUrl,
    connection.runtimeSessionId,
  );

  const socket = new WebSocket(shellUrl, {
    headers: signedRequest.headers,
    followRedirects: false,
    maxPayload: 1024 * 1024,
    perMessageDeflate: false,
  });
  const terminalOutput = new BackpressuredTerminalOutput(
    process.stdout,
    socket,
  );

  let inputListener: ((data: Buffer) => void) | undefined;
  let resizeListener: (() => void) | undefined;
  let outputListener:
    | ((data: RawData, isBinary: boolean) => void)
    | undefined;
  let pingTimer: NodeJS.Timeout | undefined;
  let ttlTimer: NodeJS.Timeout | undefined;
  let lastReadAt = Date.now();
  let terminalError: Error | undefined;
  let closeCode = 1006;
  let closeReason = Buffer.alloc(0);
  let localCloseRequested = false;
  let ttlReconnectScheduled = false;

  const closed = new Promise<void>((resolve) => {
    socket.on('error', (error: Error) => {
      terminalError = error;
    });
    socket.once('close', (code: number, reason: Buffer) => {
      closeCode = code;
      closeReason = reason;
      resolve();
    });
  });

  outputListener = (data, isBinary): void => {
    lastReadAt = Date.now();
    const buffer = asBuffer(data);
    if (isBinary) {
      terminalOutput.write(buffer);
      return;
    }
    const text = buffer.toString('utf8');
    if (!isControlMessage(text)) {
      terminalOutput.write(text);
    }
  };
  socket.on('message', outputListener);
  const stopTerminalOutput = (): void => {
    if (outputListener) socket.off('message', outputListener);
    terminalOutput.dispose();
  };
  const exitListener = (): void => stopTerminalOutput();
  process.once('exit', exitListener);

  try {
    await waitForSessionInitialization(socket);

    resizeListener = (): void => {
      if (socket.readyState !== WebSocket.OPEN) return;
      socket.send(
        JSON.stringify({
          type: 'resize',
          rows: clampDimension(process.stdout.rows ?? 24),
          cols: clampDimension(process.stdout.columns ?? 80),
        }),
      );
    };
    process.stdout.on('resize', resizeListener);
    resizeListener();

    inputListener = (data: Buffer): void => {
      const detachAt = data.indexOf(DETACH_BYTE);
      if (detachAt >= 0) {
        if (detachAt > 0 && socket.readyState === WebSocket.OPEN) {
          socket.send(data.subarray(0, detachAt), { binary: true });
        }
        localCloseRequested = true;
        options.detachRequested.value = true;
        socket.close(1000, 'Client detached');
        return;
      }
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(data, { binary: true });
      }
    };
    process.stdin.on('data', inputListener);

    socket.on('pong', () => {
      lastReadAt = Date.now();
    });
    pingTimer = setInterval(() => {
      if (socket.readyState !== WebSocket.OPEN) return;
      if (Date.now() - lastReadAt > PONG_TIMEOUT_MILLISECONDS) {
        socket.terminate();
        return;
      }
      socket.ping();
    }, PING_INTERVAL_MILLISECONDS);
    pingTimer.unref();

    // Proactively reconnect slightly before the documented 1-hour TTL so
    // the client controls the cutover instead of racing close code 1008.
    ttlTimer = setTimeout(() => {
      ttlReconnectScheduled = true;
      socket.close(1000, 'Proactive TTL reconnect');
    }, SHELL_CONNECTION_TTL_MILLISECONDS - RECONNECT_GRACE_MILLISECONDS);
    ttlTimer.unref();

    if (options.bootstrapCommand && !options.alreadyBootstrapped) {
      socket.send(options.bootstrapCommand, { binary: true });
      options.onBootstrapSent();
    }
    process.stderr.write(
      '\r\n' +
        `Connected to the AgentCore Runtime shell (session ` +
        `${connection.runtimeSessionId}, shell ${connection.shellId}). ` +
        'Press Ctrl-] to detach.\r\n',
    );

    await closed;
    if (terminalError && !localCloseRequested && !ttlReconnectScheduled) {
      throw terminalError;
    }
  } finally {
    stopTerminalOutput();
    if (pingTimer) clearInterval(pingTimer);
    if (ttlTimer) clearTimeout(ttlTimer);
    if (inputListener) process.stdin.off('data', inputListener);
    if (resizeListener) process.stdout.off('resize', resizeListener);
    process.off('exit', exitListener);
    if (
      socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING
    ) {
      socket.close(1000, 'Client closing');
    }
  }

  if (options.detachRequested.value) {
    return false;
  }
  // Close codes that mean "reconnect with the same shellId": normal TTL
  // expiry (1008), our own proactive reconnect (1000 after ttlReconnectScheduled),
  // and abnormal closure (1006).
  if (ttlReconnectScheduled || closeCode === 1008 || closeCode === 1006) {
    return true;
  }
  if (closeCode === 1000 || closeCode === 1001) {
    return false;
  }
  throw new Error(
    `AgentCore Runtime shell disconnected (${closeCode}): ${closeReason.toString()}`,
  );
}

async function signShellUpgrade(
  url: URL,
  runtimeSessionId: string,
): Promise<{ headers: Record<string, string> }> {
  // Matches the real interactive-shell WebSocket contract (verified against
  // the bedrock-agentcore Python SDK's AgentCoreRuntimeClient.connect_shell):
  // the runtime session id travels as a signed header, not a query param.
  const credentials = await defaultProvider()();
  const signer = new SignatureV4({
    credentials,
    region: regionFromHost(url.hostname),
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
        'X-Amzn-Bedrock-AgentCore-Runtime-Session-Id': runtimeSessionId,
      },
    }),
  );
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(signed.headers)) {
    if (key.toLowerCase() === 'host') continue;
    headers[key] = value;
  }
  return { headers };
}

function regionFromHost(hostname: string): string {
  const match = /^bedrock-agentcore\.([a-z0-9-]+)\.amazonaws\.com$/.exec(
    hostname,
  );
  if (!match?.[1]) {
    throw new Error(`Unable to derive region from shell host: ${hostname}`);
  }
  return match[1];
}

function waitForSessionInitialization(socket: WebSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Timed out waiting for the AgentCore Runtime shell'));
    }, 30_000);
    timeout.unref();

    let graceTimer: NodeJS.Timeout | undefined;
    const onOpen = (): void => {
      graceTimer = setTimeout(() => {
        cleanup();
        resolve();
      }, 1_500);
      graceTimer.unref();
    };
    const onMessage = (data: RawData, isBinary: boolean): void => {
      if (isBinary) {
        cleanup();
        resolve();
        return;
      }
      cleanup();
      resolve();
    };
    const onClose = (): void => {
      cleanup();
      reject(new Error('AgentCore Runtime shell closed before initialization'));
    };
    const onError = (error: Error): void => {
      cleanup();
      reject(error);
    };
    const onUnexpectedResponse = (
      _request: unknown,
      response: { statusCode?: number },
    ): void => {
      cleanup();
      reject(
        new Error(
          'AgentCore Runtime shell rejected the WebSocket with HTTP ' +
            `${response.statusCode ?? 'unknown'}`,
        ),
      );
    };
    const cleanup = (): void => {
      clearTimeout(timeout);
      if (graceTimer) clearTimeout(graceTimer);
      socket.off('open', onOpen);
      socket.off('message', onMessage);
      socket.off('close', onClose);
      socket.off('error', onError);
      socket.off('unexpected-response', onUnexpectedResponse);
    };

    socket.once('open', onOpen);
    socket.on('message', onMessage);
    socket.once('close', onClose);
    socket.once('error', onError);
    socket.once('unexpected-response', onUnexpectedResponse);
  });
}

function isControlMessage(text: string): boolean {
  if (!text.startsWith('{')) return false;
  try {
    const value = JSON.parse(text) as unknown;
    return isRecord(value) && typeof value.type === 'string';
  } catch {
    return false;
  }
}

export function developerShellBootstrapCommand(): Buffer {
  const command =
    'exec setpriv --reuid=1000 --regid=1000 --init-groups ' +
    '/usr/local/bin/developer-shell\n';
  return Buffer.from(command, 'utf8');
}

export function validateShellUrl(value: string): URL {
  const url = new URL(value);
  if (url.protocol !== 'wss:' || url.username || url.password) {
    throw new Error('AgentCore Runtime shell URL is invalid');
  }
  return url;
}

function asBuffer(data: RawData): Buffer {
  if (Buffer.isBuffer(data)) return data;
  if (data instanceof ArrayBuffer) return Buffer.from(data);
  if (Array.isArray(data)) return Buffer.concat(data);
  throw new Error('Unsupported WebSocket frame type');
}

function clampDimension(value: number): number {
  return Math.max(1, Math.min(1000, value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
