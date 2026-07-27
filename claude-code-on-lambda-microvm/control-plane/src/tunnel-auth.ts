import { randomUUID } from 'node:crypto';
import type {
  SessionRecord,
  TunnelIdentityProvider,
} from './model.js';
import { ControlError } from './service.js';

export const TUNNEL_AUTH_ACTIVE_STATUSES = [
  'QUEUED',
  'CONNECTING',
  'AWAITING_USER',
  'STARTING',
] as const;

export type TunnelAuthActiveStatus =
  (typeof TUNNEL_AUTH_ACTIVE_STATUSES)[number];

export type TunnelAuthStatus =
  | TunnelAuthActiveStatus
  | 'READY'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED';

export interface TunnelAuthJob {
  sessionId: string;
  jobId: string;
  ownerHash: string;
  provider: TunnelIdentityProvider;
  status: TunnelAuthStatus;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
  verificationUri?: string;
  userCode?: string;
  failureReason?: string;
}

export interface TunnelAuthWorkerEvent {
  sessionId: string;
  jobId: string;
  ownerHash: string;
  provider: TunnelIdentityProvider;
}

export interface TunnelAuthJobUpdate {
  status: TunnelAuthStatus;
  updatedAt: number;
  expiresAt?: number;
  verificationUri?: string;
  userCode?: string;
  failureReason?: string;
  clearDeviceCode?: boolean;
}

export interface TunnelAuthJobRepository {
  get(sessionId: string): Promise<TunnelAuthJob | undefined>;
  put(job: TunnelAuthJob): Promise<void>;
  update(
    sessionId: string,
    jobId: string,
    values: TunnelAuthJobUpdate,
    expectedStatuses: TunnelAuthStatus[],
  ): Promise<TunnelAuthJob | undefined>;
}

export interface TunnelAuthWorkerInvoker {
  invoke(event: TunnelAuthWorkerEvent): Promise<void>;
}

export interface TunnelAuthServiceOptions {
  jobs: TunnelAuthJobRepository;
  worker: TunnelAuthWorkerInvoker;
  now?: () => number;
  newId?: () => string;
}

const AUTHORIZATION_TTL_SECONDS = 15 * 60;

export class TunnelAuthService {
  private readonly now: () => number;
  private readonly newId: () => string;

  public constructor(private readonly options: TunnelAuthServiceOptions) {
    this.now = options.now ?? (() => Math.floor(Date.now() / 1_000));
    this.newId = options.newId ?? randomUUID;
  }

  public async start(
    session: SessionRecord,
    provider: TunnelIdentityProvider,
  ): Promise<TunnelAuthJob> {
    assertTunnelSession(session);
    if (provider !== 'microsoft' && provider !== 'github') {
      throw new ControlError(
        400,
        'provider must be microsoft or github',
      );
    }

    const now = this.now();
    const existing = await this.options.jobs.get(session.sessionId);
    if (existing) {
      assertJobOwner(session, existing);
      if (
        isActiveTunnelAuthStatus(existing.status) &&
        existing.expiresAt > now
      ) {
        if (existing.provider !== provider) {
          throw new ControlError(
            409,
            `Cancel the active ${existing.provider} authentication before switching providers`,
          );
        }
        return existing;
      }
    }
    const job: TunnelAuthJob = {
      sessionId: session.sessionId,
      jobId: this.newId(),
      ownerHash: session.ownerHash,
      provider,
      status: 'QUEUED',
      createdAt: now,
      updatedAt: now,
      expiresAt: now + AUTHORIZATION_TTL_SECONDS,
    };
    await this.options.jobs.put(job);

    try {
      await this.options.worker.invoke({
        sessionId: job.sessionId,
        jobId: job.jobId,
        ownerHash: job.ownerHash,
        provider: job.provider,
      });
    } catch {
      await this.options.jobs.update(
        job.sessionId,
        job.jobId,
        {
          status: 'FAILED',
          updatedAt: this.now(),
          failureReason: 'Unable to start tunnel authentication',
          clearDeviceCode: true,
        },
        ['QUEUED'],
      );
      throw new ControlError(
        502,
        'Unable to start tunnel authentication',
      );
    }
    return job;
  }

  public async get(session: SessionRecord): Promise<TunnelAuthJob> {
    const job = await this.options.jobs.get(session.sessionId);
    if (!job) {
      throw new ControlError(404, 'Tunnel authentication not found');
    }
    assertJobOwner(session, job);
    if (
      isActiveTunnelAuthStatus(job.status) &&
      job.expiresAt <= this.now()
    ) {
      const expired = await this.options.jobs.update(
        job.sessionId,
        job.jobId,
        {
          status: 'EXPIRED',
          updatedAt: this.now(),
          failureReason: 'The device authorization expired',
          clearDeviceCode: true,
        },
        [job.status],
      );
      if (expired) {
        return expired;
      }
      const current = await this.options.jobs.get(session.sessionId);
      if (current) {
        assertJobOwner(session, current);
        return current;
      }
    }
    return job;
  }

  public async cancel(session: SessionRecord): Promise<TunnelAuthJob> {
    const job = await this.get(session);
    if (!isActiveTunnelAuthStatus(job.status)) {
      return job;
    }
    const cancelled = await this.options.jobs.update(
      job.sessionId,
      job.jobId,
      {
        status: 'CANCELLED',
        updatedAt: this.now(),
        clearDeviceCode: true,
      },
      [job.status],
    );
    if (cancelled) {
      return cancelled;
    }
    return this.get(session);
  }
}

export function isActiveTunnelAuthStatus(
  status: TunnelAuthStatus,
): status is TunnelAuthActiveStatus {
  return TUNNEL_AUTH_ACTIVE_STATUSES.includes(
    status as TunnelAuthActiveStatus,
  );
}

export function publicTunnelAuthJob(
  job: TunnelAuthJob,
): Record<string, unknown> {
  return {
    sessionId: job.sessionId,
    jobId: job.jobId,
    provider: job.provider,
    status: job.status,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    expiresAt: job.expiresAt,
    verificationUri: job.verificationUri,
    userCode: job.userCode,
    failureReason: job.failureReason,
  };
}

function assertTunnelSession(session: SessionRecord): void {
  if (
    session.accessMode !== 'vscode' ||
    !session.tunnelName ||
    !session.microvmId
  ) {
    throw new ControlError(409, 'Session is not a VS Code tunnel');
  }
  if (session.state !== 'RUNNING') {
    throw new ControlError(
      409,
      `Tunnel authentication requires a running session; current state is ${session.state}`,
    );
  }
}

function assertJobOwner(
  session: SessionRecord,
  job: TunnelAuthJob,
): void {
  if (job.ownerHash !== session.ownerHash) {
    throw new ControlError(404, 'Tunnel authentication not found');
  }
}
