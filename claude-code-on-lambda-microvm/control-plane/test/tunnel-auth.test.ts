import { describe, expect, it, vi } from 'vitest';
import type { SessionRecord } from '../src/model.js';
import { ControlError } from '../src/service.js';
import {
  TunnelAuthService,
  type TunnelAuthJob,
  type TunnelAuthJobRepository,
  type TunnelAuthJobUpdate,
  type TunnelAuthStatus,
  type TunnelAuthWorkerEvent,
} from '../src/tunnel-auth.js';

const NOW = 10_000;
const SESSION: SessionRecord = {
  sessionId: 'session-1',
  ownerHash: 'a'.repeat(64),
  workspaceId: 'payments',
  state: 'RUNNING',
  createdAt: NOW - 100,
  updatedAt: NOW - 100,
  lastActivityAt: NOW - 100,
  expiresAt: NOW + 10_000,
  microvmId: 'microvm-1',
  accessMode: 'vscode',
  tunnelName: 'cm-0123456789abcdef0',
};

class MemoryJobs implements TunnelAuthJobRepository {
  public job: TunnelAuthJob | undefined;

  public async get(): Promise<TunnelAuthJob | undefined> {
    return this.job ? { ...this.job } : undefined;
  }

  public async put(job: TunnelAuthJob): Promise<void> {
    this.job = { ...job };
  }

  public async update(
    _sessionId: string,
    jobId: string,
    values: TunnelAuthJobUpdate,
    expectedStatuses: TunnelAuthStatus[],
  ): Promise<TunnelAuthJob | undefined> {
    if (
      !this.job ||
      this.job.jobId !== jobId ||
      !expectedStatuses.includes(this.job.status)
    ) {
      return undefined;
    }
    this.job = {
      ...this.job,
      ...values,
      ...(values.clearDeviceCode
        ? { verificationUri: undefined, userCode: undefined }
        : {}),
    };
    return { ...this.job };
  }
}

function service(
  jobs: MemoryJobs,
  invoke = vi.fn(async (_event: TunnelAuthWorkerEvent) => undefined),
  now = () => NOW,
): TunnelAuthService {
  return new TunnelAuthService({
    jobs,
    worker: { invoke },
    now,
    newId: () => 'job-1',
  });
}

describe('TunnelAuthService', () => {
  it('queues only the identifiers required by the worker', async () => {
    const jobs = new MemoryJobs();
    const invoke = vi.fn(
      async (_event: TunnelAuthWorkerEvent) => undefined,
    );

    await expect(
      service(jobs, invoke).start(SESSION, 'github'),
    ).resolves.toMatchObject({
      sessionId: SESSION.sessionId,
      jobId: 'job-1',
      ownerHash: SESSION.ownerHash,
      provider: 'github',
      status: 'QUEUED',
      expiresAt: NOW + 900,
    });
    expect(invoke).toHaveBeenCalledWith({
      sessionId: SESSION.sessionId,
      jobId: 'job-1',
      ownerHash: SESSION.ownerHash,
      provider: 'github',
    });
    expect(Object.keys(invoke.mock.calls[0]?.[0] ?? {}).sort()).toEqual([
      'jobId',
      'ownerHash',
      'provider',
      'sessionId',
    ]);
  });

  it('requires a running VS Code session', async () => {
    const jobs = new MemoryJobs();
    for (const session of [
      { ...SESSION, accessMode: 'terminal' as const },
      { ...SESSION, state: 'SUSPENDED' as const },
      { ...SESSION, microvmId: undefined },
    ]) {
      await expect(
        service(jobs).start(session, 'github'),
      ).rejects.toBeInstanceOf(ControlError);
    }
    expect(jobs.job).toBeUndefined();
  });

  it('reuses an active job for the same provider', async () => {
    const jobs = new MemoryJobs();
    const invoke = vi.fn(
      async (_event: TunnelAuthWorkerEvent) => undefined,
    );
    const tunnelAuth = service(jobs, invoke);

    const first = await tunnelAuth.start(SESSION, 'github');
    const second = await tunnelAuth.start(SESSION, 'github');

    expect(second).toEqual(first);
    expect(invoke).toHaveBeenCalledTimes(1);
  });

  it('requires cancellation before changing an active provider', async () => {
    const jobs = new MemoryJobs();
    const invoke = vi.fn(
      async (_event: TunnelAuthWorkerEvent) => undefined,
    );
    const tunnelAuth = service(jobs, invoke);

    await tunnelAuth.start(SESSION, 'github');

    await expect(
      tunnelAuth.start(SESSION, 'microsoft'),
    ).rejects.toMatchObject({
      statusCode: 409,
      message:
        'Cancel the active github authentication before switching providers',
    });
    expect(invoke).toHaveBeenCalledTimes(1);
  });

  it('expires an active code and removes it from the job', async () => {
    const jobs = new MemoryJobs();
    jobs.job = {
      sessionId: SESSION.sessionId,
      jobId: 'job-1',
      ownerHash: SESSION.ownerHash,
      provider: 'microsoft',
      status: 'AWAITING_USER',
      createdAt: NOW - 1_000,
      updatedAt: NOW - 1_000,
      expiresAt: NOW - 1,
      verificationUri: 'https://microsoft.com/devicelogin',
      userCode: 'ABC1-DEF2',
    };

    await expect(service(jobs).get(SESSION)).resolves.toMatchObject({
      status: 'EXPIRED',
      verificationUri: undefined,
      userCode: undefined,
    });
  });

  it('cancels active jobs without changing completed jobs', async () => {
    const jobs = new MemoryJobs();
    const tunnelAuth = service(jobs);
    await tunnelAuth.start(SESSION, 'github');
    jobs.job = {
      ...jobs.job!,
      status: 'AWAITING_USER',
      verificationUri: 'https://github.com/login/device',
      userCode: 'ABCD-EFGH',
    };

    await expect(tunnelAuth.cancel(SESSION)).resolves.toMatchObject({
      status: 'CANCELLED',
      verificationUri: undefined,
      userCode: undefined,
    });
    await expect(tunnelAuth.cancel(SESSION)).resolves.toMatchObject({
      status: 'CANCELLED',
    });
  });

  it('hides jobs belonging to another session owner', async () => {
    const jobs = new MemoryJobs();
    jobs.job = {
      sessionId: SESSION.sessionId,
      jobId: 'job-1',
      ownerHash: 'b'.repeat(64),
      provider: 'github',
      status: 'QUEUED',
      createdAt: NOW,
      updatedAt: NOW,
      expiresAt: NOW + 900,
    };

    await expect(service(jobs).get(SESSION)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('marks the job failed when async invocation is rejected', async () => {
    const jobs = new MemoryJobs();
    const invoke = vi.fn(async () => {
      throw new Error('invoke failed');
    });

    await expect(
      service(jobs, invoke).start(SESSION, 'github'),
    ).rejects.toMatchObject({ statusCode: 502 });
    expect(jobs.job).toMatchObject({
      status: 'FAILED',
      failureReason: 'Unable to start tunnel authentication',
    });
  });
});
