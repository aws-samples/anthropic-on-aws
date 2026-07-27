import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { LambdaMicrovmsClient } from '@aws-sdk/client-lambda-microvms';
import {
  DynamoDBDocumentClient,
  GetCommand,
} from '@aws-sdk/lib-dynamodb';
import WebSocket, { type RawData } from 'ws';
import { AwsMicrovmService } from './aws-adapters.js';
import type {
  SessionRecord,
  ShellConnection,
  TunnelIdentityProvider,
} from './model.js';
import { DynamoTunnelAuthJobRepository } from './tunnel-auth-aws.js';
import {
  isActiveTunnelAuthStatus,
  type TunnelAuthActiveStatus,
  type TunnelAuthJob,
  type TunnelAuthJobRepository,
  type TunnelAuthStatus,
  type TunnelAuthWorkerEvent,
} from './tunnel-auth.js';

const SHELL_TOKEN_TTL_MINUTES = 5;
const WORKER_WAIT_LIMIT_MILLISECONDS = 13 * 60 * 1_000;
const JOB_POLL_MILLISECONDS = 2_000;
const PING_INTERVAL_MILLISECONDS = 1_000;
const PONG_TIMEOUT_MILLISECONDS = 10_000;
const READY_RETENTION_SECONDS = 8 * 60 * 60;
const MAX_OUTPUT_TAIL_LENGTH = 8_192;
const WORKER_EVENT_ID_PATTERN = /^[A-Za-z0-9-]{1,128}$/;
const OWNER_HASH_PATTERN = /^[a-f0-9]{64}$/;

const VERIFICATION_URLS: Record<
  TunnelIdentityProvider,
  ReadonlySet<string>
> = {
  github: new Set(['https://github.com/login/device']),
  microsoft: new Set([
    'https://login.microsoft.com/device',
    'https://microsoft.com/devicelogin',
    'https://www.microsoft.com/devicelogin',
    'https://microsoft.com/link',
    'https://www.microsoft.com/link',
    'https://aka.ms/devicelogin',
  ]),
};

export interface TunnelOutputObservation {
  device?: {
    verificationUri: string;
    userCode: string;
  };
  starting: boolean;
  ready: boolean;
  exitCode?: number;
}

export class TunnelOutputParser {
  private tail = '';
  private readonly readyPattern: RegExp;

  public constructor(
    private readonly provider: TunnelIdentityProvider,
    tunnelName: string,
  ) {
    if (!/^[A-Za-z0-9-]{1,20}$/.test(tunnelName)) {
      throw new Error('Invalid VS Code tunnel name');
    }
    this.readyPattern = new RegExp(
      `VS Code tunnel ${escapeRegularExpression(tunnelName)} is ready[.]`,
    );
  }

  public observe(chunk: Uint8Array): TunnelOutputObservation {
    this.tail = (
      this.tail + stripTerminalControls(Buffer.from(chunk).toString('utf8'))
    ).slice(-MAX_OUTPUT_TAIL_LENGTH);
    const verificationUri = findVerificationUri(
      this.tail,
      this.provider,
    );
    const codeMatch = this.tail.match(
      /(?:use|enter)(?:\s+the)?\s+code\s+([A-Z0-9](?:[A-Z0-9-]{4,22}[A-Z0-9]))/i,
    );
    const exitMatch = this.tail.match(
      /__CM_TUNNEL_LOGIN_EXIT_([0-9]{1,3})__/,
    );
    return {
      device:
        verificationUri && codeMatch?.[1]
          ? {
              verificationUri,
              userCode: codeMatch[1].toUpperCase(),
            }
          : undefined,
      starting: /Starting VS Code tunnel [A-Za-z0-9-]+[.]{3}/.test(
        this.tail,
      ),
      ready: this.readyPattern.test(this.tail),
      exitCode: exitMatch?.[1]
        ? Number.parseInt(exitMatch[1], 10)
        : undefined,
    };
  }
}

interface WorkerDependencies {
  jobs: TunnelAuthJobRepository;
  getSession: (sessionId: string) => Promise<SessionRecord | undefined>;
  createShellConnection: (
    microvmId: string,
    expirationInMinutes: number,
  ) => Promise<ShellConnection>;
  now?: () => number;
}

export async function handler(
  event: TunnelAuthWorkerEvent,
): Promise<void> {
  const region = process.env.AWS_REGION ?? 'us-east-1';
  const documentClient = DynamoDBDocumentClient.from(
    new DynamoDBClient({ region }),
    { marshallOptions: { removeUndefinedValues: true } },
  );
  const sessionsTableName = requiredEnvironment('SESSION_TABLE_NAME');
  const jobs = new DynamoTunnelAuthJobRepository(
    documentClient,
    requiredEnvironment('TUNNEL_AUTH_TABLE_NAME'),
  );
  const microvms = new AwsMicrovmService(
    new LambdaMicrovmsClient({ region }),
  );
  await runTunnelAuthWorker(event, {
    jobs,
    getSession: async (sessionId) => {
      const result = await documentClient.send(
        new GetCommand({
          TableName: sessionsTableName,
          Key: { sessionId },
          ConsistentRead: true,
        }),
      );
      return result.Item as SessionRecord | undefined;
    },
    createShellConnection:
      microvms.createShellConnection.bind(microvms),
  });
}

export async function runTunnelAuthWorker(
  event: TunnelAuthWorkerEvent,
  dependencies: WorkerDependencies,
): Promise<void> {
  assertWorkerEvent(event);
  const now =
    dependencies.now ?? (() => Math.floor(Date.now() / 1_000));
  const [job, session] = await Promise.all([
    dependencies.jobs.get(event.sessionId),
    dependencies.getSession(event.sessionId),
  ]);
  if (!isCurrentQueuedJob(job, event)) {
    return;
  }

  let currentStatus: TunnelAuthActiveStatus = 'QUEUED';
  const transition = async (
    status: TunnelAuthStatus,
    values: {
      verificationUri?: string;
      userCode?: string;
      failureReason?: string;
      clearDeviceCode?: boolean;
      expiresAt?: number;
    } = {},
  ): Promise<boolean> => {
    const updated = await dependencies.jobs.update(
      event.sessionId,
      event.jobId,
      {
        status,
        updatedAt: now(),
        ...values,
      },
      [currentStatus],
    );
    if (!updated) {
      return false;
    }
    if (isActiveTunnelAuthStatus(updated.status)) {
      currentStatus = updated.status;
    }
    return true;
  };

  if (
    !session ||
    session.ownerHash !== event.ownerHash ||
    session.accessMode !== 'vscode' ||
    session.state !== 'RUNNING' ||
    !session.microvmId ||
    !session.tunnelName
  ) {
    await transition('FAILED', {
      failureReason: 'The VS Code session is not available',
      clearDeviceCode: true,
    });
    return;
  }
  if (job.expiresAt <= now()) {
    await transition('EXPIRED', {
      failureReason: 'The device authorization expired',
      clearDeviceCode: true,
    });
    return;
  }
  if (!(await transition('CONNECTING'))) {
    return;
  }

  try {
    const connection = await dependencies.createShellConnection(
      session.microvmId,
      SHELL_TOKEN_TTL_MINUTES,
    );
    const result = await runShellLogin({
      connection,
      provider: event.provider,
      tunnelName: session.tunnelName,
      maxWaitMilliseconds: Math.max(
        1,
        Math.min(
          WORKER_WAIT_LIMIT_MILLISECONDS,
          (job.expiresAt - now()) * 1_000,
        ),
      ),
      isCurrent: async () => {
        const current = await dependencies.jobs.get(event.sessionId);
        return Boolean(
          current &&
            current.jobId === event.jobId &&
            current.ownerHash === event.ownerHash &&
            isActiveTunnelAuthStatus(current.status),
        );
      },
      onDevice: async (verificationUri, userCode) => {
        if (currentStatus === 'AWAITING_USER') {
          return true;
        }
        return transition('AWAITING_USER', {
          verificationUri,
          userCode,
        });
      },
      onStarting: async () => {
        if (currentStatus === 'STARTING') {
          return true;
        }
        return transition('STARTING', {
          clearDeviceCode: true,
        });
      },
      onReady: async () =>
        transition('READY', {
          clearDeviceCode: true,
          expiresAt: now() + READY_RETENTION_SECONDS,
        }),
    });

    if (result === 'expired') {
      await transition('EXPIRED', {
        failureReason: 'The device authorization expired',
        clearDeviceCode: true,
      });
    } else if (result === 'failed') {
      await transition('FAILED', {
        failureReason: 'Tunnel authentication ended before completion',
        clearDeviceCode: true,
      });
    }
  } catch {
    await transition('FAILED', {
      failureReason: 'Unable to authenticate the VS Code tunnel',
      clearDeviceCode: true,
    });
    console.error('tunnel authentication worker failed', {
      sessionId: event.sessionId,
      jobId: event.jobId,
    });
  }
}

type ShellLoginResult = 'ready' | 'stopped' | 'expired' | 'failed';

interface ShellLoginOptions {
  connection: ShellConnection;
  provider: TunnelIdentityProvider;
  tunnelName: string;
  maxWaitMilliseconds: number;
  isCurrent: () => Promise<boolean>;
  onDevice: (
    verificationUri: string,
    userCode: string,
  ) => Promise<boolean>;
  onStarting: () => Promise<boolean>;
  onReady: () => Promise<boolean>;
}

async function runShellLogin(
  options: ShellLoginOptions,
): Promise<ShellLoginResult> {
  const socket = new WebSocket(shellUrl(options.connection.endpoint), {
    headers: {
      'X-aws-proxy-auth': options.connection.authToken,
    },
    followRedirects: false,
    maxPayload: 1024 * 1024,
    perMessageDeflate: false,
  });
  await waitForShellInitialization(socket);
  socket.send(
    JSON.stringify({ type: 'resize', rows: 40, cols: 120 }),
  );
  socket.send(tunnelLoginCommand(options.provider), { binary: true });
  return monitorShellLogin(socket, options);
}

function monitorShellLogin(
  socket: WebSocket,
  options: ShellLoginOptions,
): Promise<ShellLoginResult> {
  const parser = new TunnelOutputParser(
    options.provider,
    options.tunnelName,
  );
  return new Promise((resolve, reject) => {
    let settled = false;
    let devicePublished = false;
    let startingPublished = false;
    let lastReadAt = Date.now();
    let queue = Promise.resolve();

    const finish = (result: ShellLoginResult): void => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      socket.terminate();
      resolve(result);
    };
    const fail = (error: unknown): void => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      socket.terminate();
      reject(
        error instanceof Error
          ? error
          : new Error('MicroVM shell failed'),
      );
    };
    const enqueue = (
      operation: () => Promise<ShellLoginResult | undefined>,
    ): void => {
      queue = queue
        .then(async () => {
          if (settled) {
            return;
          }
          const result = await operation();
          if (result) {
            finish(result);
          }
        })
        .catch(fail);
    };
    const onMessage = (data: RawData, isBinary: boolean): void => {
      lastReadAt = Date.now();
      const buffer = asBuffer(data);
      if (!isBinary && isControlMessage(buffer.toString('utf8'))) {
        return;
      }
      const observation = parser.observe(buffer);
      enqueue(async () => {
        if (observation.device && !devicePublished) {
          const accepted = await options.onDevice(
            observation.device.verificationUri,
            observation.device.userCode,
          );
          if (!accepted) {
            return 'stopped';
          }
          devicePublished = true;
        }
        if (observation.starting && !startingPublished) {
          if (!(await options.onStarting())) {
            return 'stopped';
          }
          startingPublished = true;
        }
        if (observation.ready) {
          return (await options.onReady()) ? 'ready' : 'stopped';
        }
        if (observation.exitCode !== undefined) {
          return 'failed';
        }
        return undefined;
      });
    };
    const onClose = (): void => {
      enqueue(async () => 'failed');
    };
    const onError = (): void => {
      fail(new Error('MicroVM shell connection failed'));
    };
    const onPong = (): void => {
      lastReadAt = Date.now();
    };
    const pollTimer = setInterval(() => {
      enqueue(async () =>
        (await options.isCurrent()) ? undefined : 'stopped',
      );
    }, JOB_POLL_MILLISECONDS);
    const pingTimer = setInterval(() => {
      if (Date.now() - lastReadAt > PONG_TIMEOUT_MILLISECONDS) {
        fail(new Error('MicroVM shell stopped responding'));
        return;
      }
      if (socket.readyState === WebSocket.OPEN) {
        socket.ping();
      }
    }, PING_INTERVAL_MILLISECONDS);
    const expiryTimer = setTimeout(() => {
      enqueue(async () => 'expired');
    }, options.maxWaitMilliseconds);

    const cleanup = (): void => {
      clearInterval(pollTimer);
      clearInterval(pingTimer);
      clearTimeout(expiryTimer);
      socket.off('message', onMessage);
      socket.off('close', onClose);
      socket.off('error', onError);
      socket.off('pong', onPong);
    };

    socket.on('message', onMessage);
    socket.once('close', onClose);
    socket.once('error', onError);
    socket.on('pong', onPong);
  });
}

function waitForShellInitialization(socket: WebSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Timed out waiting for the MicroVM shell'));
    }, 30_000);
    let graceTimer: NodeJS.Timeout | undefined;
    const onOpen = (): void => {
      graceTimer = setTimeout(() => {
        cleanup();
        resolve();
      }, 1_500);
    };
    const onMessage = (): void => {
      cleanup();
      resolve();
    };
    const onClose = (): void => {
      cleanup();
      reject(new Error('MicroVM shell closed before initialization'));
    };
    const onError = (): void => {
      cleanup();
      reject(new Error('MicroVM shell connection failed'));
    };
    const onUnexpectedResponse = (): void => {
      cleanup();
      reject(new Error('MicroVM shell rejected the connection'));
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
    socket.once('message', onMessage);
    socket.once('close', onClose);
    socket.once('error', onError);
    socket.once('unexpected-response', onUnexpectedResponse);
  });
}

function tunnelLoginCommand(
  provider: TunnelIdentityProvider,
): Buffer {
  return Buffer.from(
    'setpriv --reuid=1000 --regid=1000 --init-groups ' +
      '/usr/local/bin/vscode-tunnel login ' +
      `--provider ${provider} --force; ` +
      'printf "\\n__CM_TUNNEL_LOGIN_EXIT_%s__\\n" "$?"\n',
    'utf8',
  );
}

function shellUrl(endpoint: string): string {
  const url = new URL(
    endpoint.includes('://') ? endpoint : `https://${endpoint}`,
  );
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error('MicroVM returned an invalid shell endpoint');
  }
  url.protocol = 'wss:';
  url.pathname = '/shell';
  return url.toString();
}

function findVerificationUri(
  text: string,
  provider: TunnelIdentityProvider,
): string | undefined {
  // The native PTY can hard-wrap a long login instruction in the middle of
  // its URL. Try the exact output first, then a no-newline view; every
  // candidate still has to match the provider-specific allowlist exactly.
  const variants = text.includes('\n')
    ? [text, text.replace(/\n/g, '')]
    : [text];
  for (const variant of variants) {
    for (const match of variant.matchAll(/https:\/\/[^\s<>"']+/g)) {
      const candidate = match[0].replace(/[),.;]+$/, '');
      if (candidate.includes('?') || candidate.includes('#')) {
        continue;
      }
      let url: URL;
      try {
        url = new URL(candidate);
      } catch {
        continue;
      }
      if (
        url.protocol !== 'https:' ||
        url.username ||
        url.password ||
        url.port ||
        url.search ||
        url.hash
      ) {
        continue;
      }
      const normalized =
        `${url.origin}${url.pathname.replace(/\/+$/, '')}`;
      if (VERIFICATION_URLS[provider].has(normalized)) {
        return normalized;
      }
    }
  }
  return undefined;
}

function stripTerminalControls(value: string): string {
  return value
    .replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, '')
    .replace(/\r/g, '');
}

function isControlMessage(value: string): boolean {
  if (!value.startsWith('{')) {
    return false;
  }
  try {
    const parsed = JSON.parse(value) as unknown;
    return Boolean(
      parsed &&
        typeof parsed === 'object' &&
        !Array.isArray(parsed) &&
        'type' in parsed &&
        typeof (parsed as { type?: unknown }).type === 'string',
    );
  } catch {
    return false;
  }
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

function isCurrentQueuedJob(
  job: TunnelAuthJob | undefined,
  event: TunnelAuthWorkerEvent,
): job is TunnelAuthJob & { status: 'QUEUED' } {
  return Boolean(
    job &&
      job.jobId === event.jobId &&
      job.ownerHash === event.ownerHash &&
      job.provider === event.provider &&
      job.status === 'QUEUED',
  );
}

function assertWorkerEvent(
  event: TunnelAuthWorkerEvent,
): void {
  if (
    !event ||
    !WORKER_EVENT_ID_PATTERN.test(event.sessionId) ||
    !WORKER_EVENT_ID_PATTERN.test(event.jobId) ||
    !OWNER_HASH_PATTERN.test(event.ownerHash) ||
    (event.provider !== 'microsoft' && event.provider !== 'github')
  ) {
    throw new Error('Invalid tunnel authentication worker event');
  }
}

function escapeRegularExpression(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function requiredEnvironment(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
