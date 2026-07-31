import process from 'node:process';
import WebSocket, { type RawData } from 'ws';
import type { ConnectResponse } from './api.js';

const DETACH_BYTE = 0x1d;
const PING_INTERVAL_MILLISECONDS = 1_000;
const PONG_TIMEOUT_MILLISECONDS = 5_000;

export type TunnelIdentityProvider = 'microsoft' | 'github';

export interface AttachTerminalOptions {
  bootstrapCommand?: Buffer;
  completionPattern?: RegExp;
  connectedMessage?: string;
}

// Claude Code enables these terminal-emulator modes while its TUI is active.
// Reproduce its normal cleanup when the remote PTY disappears unexpectedly.
export const TERMINAL_RESTORE_SEQUENCE = [
  // Mouse reporting: SGR, motion, button, normal, and legacy encodings.
  '\x1b[?1006l',
  '\x1b[?1003l',
  '\x1b[?1002l',
  '\x1b[?1000l',
  '\x1b[?1005l',
  '\x1b[?1015l',
  '\x1b[?1016l',
  // Keyboard, focus, theme, paste, and fullscreen modes.
  '\x1b[>4m',
  '\x1b[<u',
  '\x1b[?1004l',
  '\x1b[?2031l',
  '\x1b[?2004l',
  '\x1b[?1049l',
  // Character set, attributes, scroll region, and cursor visibility.
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

interface TerminalModeOutput {
  readonly isTTY: boolean | undefined;
  write(chunk: string): unknown;
}

interface PausableTerminalSource {
  pause(): unknown;
  resume(): unknown;
}

export class TerminalOutputMatcher {
  private tail = '';

  public constructor(private readonly pattern: RegExp) {
    if (pattern.global || pattern.sticky) {
      throw new Error('Terminal completion pattern must not be stateful');
    }
  }

  public observe(chunk: Uint8Array): boolean {
    this.tail = (
      this.tail + Buffer.from(chunk).toString('utf8')
    ).slice(-4096);
    return this.pattern.test(this.tail);
  }
}

export function createTerminalModeRestorer(
  output: TerminalModeOutput,
): () => void {
  let restored = false;
  return (): void => {
    if (restored) {
      return;
    }
    restored = true;
    if (!output.isTTY) {
      return;
    }
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
    if (this.output.write(chunk) || this.waitingForDrain) {
      return;
    }
    this.waitingForDrain = true;
    this.source.pause();
    this.output.once('drain', this.onDrain);
  }

  public dispose(): void {
    if (!this.waitingForDrain) {
      return;
    }
    this.output.off('drain', this.onDrain);
    this.waitingForDrain = false;
  }

  private readonly onDrain = (): void => {
    this.waitingForDrain = false;
    this.source.resume();
  };
}

export async function attachTerminal(
  connection: ConnectResponse,
  options: AttachTerminalOptions = {},
): Promise<void> {
  const shellUrl = validateShellUrl(connection.shellUrl);
  if (!connection.shellToken) {
    throw new Error('MicroVM shell token is missing');
  }
  const socket = new WebSocket(shellUrl, {
    headers: {
      'X-aws-proxy-auth': connection.shellToken,
    },
    followRedirects: false,
    maxPayload: 1024 * 1024,
    perMessageDeflate: false,
  });
  const terminalOutput = new BackpressuredTerminalOutput(
    process.stdout,
    socket,
  );

  const inputWasRaw = process.stdin.isRaw;
  let inputListener: ((data: Buffer) => void) | undefined;
  let resizeListener: (() => void) | undefined;
  let signalListener: (() => void) | undefined;
  let outputListener:
    | ((data: RawData, isBinary: boolean) => void)
    | undefined;
  let pingTimer: NodeJS.Timeout | undefined;
  let lastReadAt = Date.now();
  let terminalError: Error | undefined;
  let closeCode = 1006;
  let closeReason = Buffer.alloc(0);
  let completionObserved = false;
  let localCloseRequested = false;
  const completionMatcher = options.completionPattern
    ? new TerminalOutputMatcher(options.completionPattern)
    : undefined;

  const closed = new Promise<void>((resolve) => {
    socket.on('error', (error) => {
      terminalError = error;
    });
    socket.once('close', (code, reason) => {
      closeCode = code;
      closeReason = reason;
      resolve();
    });
  });
  outputListener = (data, isBinary): void => {
    lastReadAt = Date.now();
    const buffer = asBuffer(data);
    if (
      completionMatcher?.observe(buffer) &&
      !completionObserved
    ) {
      completionObserved = true;
      localCloseRequested = true;
      socket.terminate();
    }
    if (isBinary) {
      terminalOutput.write(buffer);
      return;
    }
    // Some shell services frame terminal output as text; forward
    // anything that is not a recognized JSON control message.
    const text = buffer.toString('utf8');
    if (!isControlMessage(text)) {
      terminalOutput.write(text);
    }
  };
  socket.on('message', outputListener);
  const restoreTerminalModes = createTerminalModeRestorer(process.stdout);
  const stopTerminalOutput = (): void => {
    if (outputListener) {
      socket.off('message', outputListener);
    }
    terminalOutput.dispose();
    restoreTerminalModes();
  };
  const exitListener = (): void => {
    stopTerminalOutput();
  };
  process.once('exit', exitListener);

  try {
    await waitForSessionInitialization(socket);

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    process.stdin.resume();

    resizeListener = (): void => {
      if (socket.readyState !== WebSocket.OPEN) {
        return;
      }
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
        socket.close(1000, 'Client detached');
        return;
      }
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(data, { binary: true });
      }
    };
    process.stdin.on('data', inputListener);

    signalListener = (): void => {
      stopTerminalOutput();
      localCloseRequested = true;
      socket.close(1001, 'Local terminal closing');
    };
    process.once('SIGINT', signalListener);
    process.once('SIGTERM', signalListener);
    process.once('SIGHUP', signalListener);

    socket.on('pong', () => {
      lastReadAt = Date.now();
    });
    pingTimer = setInterval(() => {
      if (socket.readyState !== WebSocket.OPEN) {
        return;
      }
      if (Date.now() - lastReadAt > PONG_TIMEOUT_MILLISECONDS) {
        socket.terminate();
        return;
      }
      socket.ping();
    }, PING_INTERVAL_MILLISECONDS);
    pingTimer.unref();

    socket.send(
      options.bootstrapCommand ?? developerShellBootstrapCommand(),
      { binary: true },
    );
    process.stderr.write(
      '\r\n' +
        (options.connectedMessage ??
          'Connected to the Lambda MicroVM shell.') +
        ' Press Ctrl-] to detach.\r\n',
    );

    await closed;
    if (terminalError && !localCloseRequested) {
      throw terminalError;
    }
    if (
      !localCloseRequested &&
      closeCode !== 1000 &&
      closeCode !== 1001
    ) {
      throw new Error(
        `MicroVM shell disconnected (${closeCode}): ` +
          `${closeReason.toString()}`,
      );
    }
  } finally {
    stopTerminalOutput();
    if (pingTimer) {
      clearInterval(pingTimer);
    }
    if (inputListener) {
      process.stdin.off('data', inputListener);
    }
    if (resizeListener) {
      process.stdout.off('resize', resizeListener);
    }
    if (signalListener) {
      process.off('SIGINT', signalListener);
      process.off('SIGTERM', signalListener);
      process.off('SIGHUP', signalListener);
    }
    process.off('exit', exitListener);
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(Boolean(inputWasRaw));
    }
    process.stdin.pause();
    if (
      socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING
    ) {
      socket.close(1000, 'Client closing');
    }
  }
}

function waitForSessionInitialization(socket: WebSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Timed out waiting for the MicroVM shell'));
    }, 30_000);
    timeout.unref();

    // The exact shell readiness signal is service-defined; accept a
    // session_init control message, any output frame, or an open
    // socket that stays quiet briefly.
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
      const text = asBuffer(data).toString('utf8');
      try {
        const value = JSON.parse(text) as unknown;
        if (
          isRecord(value) &&
          value.type === 'session_init' &&
          typeof value.session_id === 'string' &&
          value.session_id
        ) {
          cleanup();
          resolve();
        }
      } catch {
        cleanup();
        resolve();
      }
    };
    const onClose = (): void => {
      cleanup();
      reject(new Error('MicroVM shell closed before initialization'));
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
          'MicroVM shell rejected the WebSocket with HTTP ' +
            `${response.statusCode ?? 'unknown'}`,
        ),
      );
    };
    const cleanup = (): void => {
      clearTimeout(timeout);
      if (graceTimer) {
        clearTimeout(graceTimer);
      }
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
  if (!text.startsWith('{')) {
    return false;
  }
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

export function vscodeTunnelLoginCommand(
  provider: TunnelIdentityProvider,
  force = false,
): Buffer {
  if (provider !== 'microsoft' && provider !== 'github') {
    throw new Error('Unsupported VS Code tunnel identity provider');
  }
  const command =
    'setpriv --reuid=1000 --regid=1000 --init-groups ' +
    '/usr/local/bin/vscode-tunnel login ' +
    `--provider ${provider}${force ? ' --force' : ''}\n`;
  return Buffer.from(command, 'utf8');
}

export function validateShellUrl(value: string): URL {
  const url = new URL(value);
  if (
    url.protocol !== 'wss:' ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/shell'
  ) {
    throw new Error('MicroVM shell URL is invalid');
  }
  return url;
}

function asBuffer(data: RawData): Buffer {
  if (Buffer.isBuffer(data)) {
    return data;
  }
  if (data instanceof ArrayBuffer) {
    return Buffer.from(data);
  }
  if (Array.isArray(data)) {
    return Buffer.concat(data);
  }
  throw new Error('Unsupported WebSocket frame type');
}

function clampDimension(value: number): number {
  return Math.max(1, Math.min(1000, value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
