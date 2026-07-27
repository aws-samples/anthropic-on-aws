import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import type {
  CreateSessionResult,
  MicrovmDescription,
  MicrovmListItem,
  MicrovmService,
  RunResult,
  SessionRecord,
  SessionRepository,
  SessionState,
  ShellConnection,
  StartConfiguration,
  WorkspaceCheckpointAccess,
  WorkspaceCheckpointService,
} from '../src/model.js';
import { ACTIVE_STATES } from '../src/model.js';
import {
  ControlError,
  ControlService,
  normalizeMicrovmState,
  sessionTunnelName,
} from '../src/service.js';

const OWNER = 'arn:aws:iam::111122223333:user/alice';
const OTHER_OWNER = 'arn:aws:iam::111122223333:user/bob';
const NOW = 10_000;

const CONFIGURATION: StartConfiguration = {
  region: 'us-east-1',
  partition: 'aws',
  imageArn:
    'arn:aws:lambda:us-east-1:111122223333:microvm-image:test',
  connectorArn:
    'arn:aws:lambda:us-east-1:111122223333:network-connector:test',
  executionRoleArn:
    'arn:aws:iam::111122223333:role/microvm',
  logGroup: '/claude-microvm/microvms',
  inferenceMode: 'bedrock',
  bedrockModelId: 'us.anthropic.claude-sonnet-4-6',
  idleAfterSeconds: 900,
  suspendedRetentionSeconds: 3_600,
};

class MemoryRepository implements SessionRepository {
  public readonly records = new Map<string, SessionRecord>();
  public readonly claims = new Map<string, string>();
  public failCreate = false;
  public failNextConditionalPatch = false;

  public async get(
    sessionId: string,
  ): Promise<SessionRecord | undefined> {
    return this.records.get(sessionId);
  }

  public async create(
    record: SessionRecord,
  ): Promise<CreateSessionResult> {
    if (this.failCreate) {
      throw new Error('storage unavailable');
    }
    const key = `${record.ownerHash}#${record.workspaceId}`;
    const claimedSessionId = this.claims.get(key);
    const claimed = claimedSessionId
      ? this.records.get(claimedSessionId)
      : undefined;
    if (
      claimed &&
      ACTIVE_STATES.includes(
        claimed.state as (typeof ACTIVE_STATES)[number],
      )
    ) {
      return { created: false, record: claimed };
    }
    this.records.set(record.sessionId, { ...record });
    this.claims.set(key, record.sessionId);
    return { created: true };
  }

  public async releaseWorkspace(
    record: SessionRecord,
  ): Promise<void> {
    const key = `${record.ownerHash}#${record.workspaceId}`;
    if (this.claims.get(key) === record.sessionId) {
      this.claims.delete(key);
    }
  }

  public async listForOwner(
    ownerHashValue: string,
  ): Promise<SessionRecord[]> {
    return [...this.records.values()].filter(
      (record) => record.ownerHash === ownerHashValue,
    );
  }

  public async listStateUpdatedBefore(
    state: SessionState,
    updatedBefore: number,
  ): Promise<SessionRecord[]> {
    return [...this.records.values()].filter(
      (record) =>
        record.state === state &&
        record.updatedAt <= updatedBefore,
    );
  }

  public async patch(
    sessionId: string,
    values: Partial<SessionRecord>,
    expectedStates?: SessionState[],
  ): Promise<boolean> {
    const record = this.records.get(sessionId);
    if (!record) {
      return false;
    }
    if (
      expectedStates &&
      (this.failNextConditionalPatch ||
        !expectedStates.includes(record.state))
    ) {
      this.failNextConditionalPatch = false;
      return false;
    }
    Object.assign(record, values);
    return true;
  }
}

class FakeMicrovms implements MicrovmService {
  public readonly runInputs:
    Parameters<MicrovmService['run']>[0][] = [];
  public readonly suspended: string[] = [];
  public readonly resumed: string[] = [];
  public readonly terminated: string[] = [];
  public readonly descriptions =
    new Map<string, MicrovmDescription>();
  public readonly descriptionSequences =
    new Map<string, MicrovmDescription[]>();
  public runError: Error | undefined;
  public lifecycleError: Error | undefined;
  public listedMicrovms: MicrovmListItem[] = [];
  public shellConnection: ShellConnection = {
    endpoint: 'microvm.example.aws',
    authToken: 'short-lived-shell-token',
    expiresAt: NOW + 300,
  };

  public async run(
    input: Parameters<MicrovmService['run']>[0],
  ): Promise<RunResult> {
    this.runInputs.push(input);
    if (this.runError) {
      throw this.runError;
    }
    return {
      microvmId: 'microvm-new',
      state: 'PENDING',
      endpoint: 'microvm.example.aws',
      imageArn: input.imageArn,
      imageVersion: '4.0',
      maximumDurationInSeconds: 28_800,
      startedAt: NOW,
    };
  }

  public async get(
    microvmId: string,
  ): Promise<MicrovmDescription> {
    const sequence = this.descriptionSequences.get(microvmId);
    const next = sequence?.shift();
    const description =
      next ?? this.descriptions.get(microvmId);
    if (!description) {
      throw new Error(`No description for ${microvmId}`);
    }
    return description;
  }

  public async listForImage(
    _imageArn: string,
  ): Promise<MicrovmListItem[]> {
    return this.listedMicrovms;
  }

  public async createShellConnection(
    _microvmId: string,
    _expirationInMinutes: number,
  ): Promise<ShellConnection> {
    return this.shellConnection;
  }

  public async suspend(microvmId: string): Promise<void> {
    if (this.lifecycleError) {
      throw this.lifecycleError;
    }
    this.suspended.push(microvmId);
  }

  public async resume(microvmId: string): Promise<void> {
    if (this.lifecycleError) {
      throw this.lifecycleError;
    }
    this.resumed.push(microvmId);
  }

  public async terminate(microvmId: string): Promise<void> {
    if (this.lifecycleError) {
      throw this.lifecycleError;
    }
    this.terminated.push(microvmId);
  }
}

class FakeCheckpoints implements WorkspaceCheckpointService {
  public readonly requests: {
    ownerHash: string;
    workspaceId: string;
  }[] = [];
  public access: WorkspaceCheckpointAccess = {
    downloadUrl:
      'https://bucket.s3.us-east-1.amazonaws.com/checkpoint?' +
      'X-Amz-Signature=download&X-Amz-Credential=credential',
    uploadUrl:
      'https://bucket.s3.us-east-1.amazonaws.com/checkpoint?' +
      'X-Amz-Signature=upload&X-Amz-Credential=credential',
  };

  public async createAccess(
    ownerHashValue: string,
    workspaceId: string,
  ): Promise<WorkspaceCheckpointAccess> {
    this.requests.push({
      ownerHash: ownerHashValue,
      workspaceId,
    });
    return this.access;
  }
}

function ownerHash(owner = OWNER): string {
  return createHash('sha256').update(owner).digest('hex');
}

function session(
  overrides: Partial<SessionRecord> = {},
): SessionRecord {
  return {
    sessionId: 'session-1',
    ownerHash: ownerHash(),
    workspaceId: 'default',
    state: 'RUNNING',
    createdAt: NOW - 100,
    updatedAt: NOW - 100,
    lastActivityAt: NOW - 100,
    expiresAt: NOW + 100_000,
    microvmId: 'microvm-1',
    ...overrides,
  };
}

function fixture(
  configuration: StartConfiguration = CONFIGURATION,
): {
  repository: MemoryRepository;
  microvms: FakeMicrovms;
  checkpoints: FakeCheckpoints;
  service: ControlService;
} {
  const repository = new MemoryRepository();
  const microvms = new FakeMicrovms();
  const checkpoints = new FakeCheckpoints();
  const service = new ControlService({
    repository,
    microvms,
    checkpoints,
    loadConfiguration: async () => configuration,
    now: () => NOW,
    newId: () => 'session-new',
    delay: async () => undefined,
  });
  return { repository, microvms, checkpoints, service };
}

describe('ControlService', () => {
  it('launches native shell ingress with scoped checkpoint URLs', async () => {
    const { repository, microvms, checkpoints, service } =
      fixture();

    const result = await service.start(OWNER, 'payments');

    expect(result.created).toBe(true);
    expect(checkpoints.requests).toEqual([
      {
        ownerHash: ownerHash(),
        workspaceId: 'payments',
      },
    ]);
    expect(microvms.runInputs).toHaveLength(1);
    const input = microvms.runInputs[0]!;
    expect(input.ingressArn).toBe(
      'arn:aws:lambda:us-east-1:aws:network-connector:' +
        'aws-network-connector:SHELL_INGRESS',
    );
    expect(input.egressArns).toEqual([
      'arn:aws:lambda:us-east-1:111122223333:network-connector:test',
    ]);
    expect(input).toMatchObject({
      idleAfterSeconds: 900,
      suspendedRetentionSeconds: 3_600,
    });
    const payload = JSON.parse(input.payload) as Record<
      string,
      unknown
    >;
    expect(payload).toMatchObject({
      version: 2,
      ownerHash: ownerHash(),
      workspaceId: 'payments',
      inferenceMode: 'bedrock',
      bedrockModelId:
        'us.anthropic.claude-sonnet-4-6',
      checkpoint: checkpoints.access,
    });
    expect(payload).not.toHaveProperty('accessMode');
    expect(payload).not.toHaveProperty('tunnelName');
    expect(input.payload).not.toContain(OWNER);
    expect(repository.records.get('session-new')).toMatchObject({
      state: 'STARTING',
      accessMode: 'terminal',
      inferenceMode: 'bedrock',
      imageVersion: '4.0',
      microvmExpiresAt: NOW + 28_800,
    });
  });

  it('launches a VS Code session with outbound tunnel metadata and no idle policy', async () => {
    const { repository, microvms, service } = fixture();

    const result = await service.start(OWNER, 'payments-ide', {
      accessMode: 'vscode',
    });

    const input = microvms.runInputs[0]!;
    expect(input.ingressArn).toContain('SHELL_INGRESS');
    expect(input.idleAfterSeconds).toBeUndefined();
    const payload = JSON.parse(input.payload) as Record<
      string,
      unknown
    >;
    const expectedTunnelName = sessionTunnelName(
      ownerHash(),
      'payments-ide',
      'session-new',
    );
    expect(expectedTunnelName).toMatch(/^cm-[a-f0-9]{17}$/);
    expect(payload).toMatchObject({
      version: 3,
      accessMode: 'vscode',
      inferenceMode: 'bedrock',
      tunnelName: expectedTunnelName,
    });
    expect(result.record).toMatchObject({
      accessMode: 'vscode',
      tunnelName: expectedTunnelName,
      tunnelProvider: 'github',
    });
    expect(repository.records.get('session-new')).toMatchObject({
      accessMode: 'vscode',
      tunnelName: expectedTunnelName,
      tunnelProvider: 'github',
    });

    const switched = await service.setTunnelProvider(
      OWNER,
      result.record.sessionId,
      'microsoft',
    );
    expect(switched.tunnelProvider).toBe('microsoft');
    expect(
      repository.records.get('session-new')?.tunnelProvider,
    ).toBe('microsoft');
  });

  it('records an explicit Microsoft tunnel provider at launch', async () => {
    const { service } = fixture();

    const result = await service.start(OWNER, 'payments-microsoft', {
      accessMode: 'vscode',
      tunnelProvider: 'microsoft',
    });

    expect(result.record.tunnelProvider).toBe('microsoft');
  });

  it('rejects a tunnel provider on terminal sessions', async () => {
    const { service } = fixture();

    await expect(
      service.start(OWNER, 'terminal-provider', {
        accessMode: 'terminal',
        tunnelProvider: 'github',
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: 'tunnelProvider is only valid for VS Code sessions',
    });
  });

  it('allows Claude.ai only when explicitly enabled and omits Bedrock routing', async () => {
    const disabled = fixture();
    await expect(
      disabled.service.start(OWNER, 'direct', {
        inferenceMode: 'claude-ai',
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(disabled.microvms.runInputs).toHaveLength(0);

    const enabled = fixture({
      ...CONFIGURATION,
      allowClaudeAiSubscription: true,
    });
    const result = await enabled.service.start(OWNER, 'direct', {
      inferenceMode: 'claude-ai',
    });
    const payload = JSON.parse(
      enabled.microvms.runInputs[0]!.payload,
    ) as Record<string, unknown>;
    expect(payload).toMatchObject({
      version: 3,
      inferenceMode: 'claude-ai',
      accessMode: 'terminal',
    });
    expect(payload).not.toHaveProperty('bedrockModelId');
    expect(payload).not.toHaveProperty('claudeGatewayUrl');
    expect(result.record.inferenceMode).toBe('claude-ai');
  });

  it('rejects access-mode and provider changes for an active workspace', async () => {
    const { repository, microvms, service } = fixture({
      ...CONFIGURATION,
      allowClaudeAiSubscription: true,
    });
    const active = session({
      workspaceId: 'payments',
      accessMode: 'terminal',
      inferenceMode: 'bedrock',
    });
    repository.records.set(active.sessionId, active);
    repository.claims.set(
      `${active.ownerHash}#${active.workspaceId}`,
      active.sessionId,
    );
    microvms.descriptions.set(active.microvmId!, {
      microvmId: active.microvmId!,
      state: 'RUNNING',
      endpoint: 'microvm.example.aws',
    });

    await expect(
      service.start(OWNER, 'payments', {
        accessMode: 'vscode',
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
    await expect(
      service.start(OWNER, 'payments', {
        inferenceMode: 'claude-ai',
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('rejects a mode mismatch when concurrent starts race on the workspace claim', async () => {
    const { microvms, service } = fixture();
    const results = await Promise.allSettled([
      service.start(OWNER, 'racing', {
        accessMode: 'terminal',
      }),
      service.start(OWNER, 'racing', {
        accessMode: 'vscode',
      }),
    ]);

    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    const rejected = results.find(
      (result) => result.status === 'rejected',
    );
    expect(
      rejected && rejected.status === 'rejected'
        ? rejected.reason
        : undefined,
    ).toMatchObject({ statusCode: 409 });
    expect(microvms.runInputs).toHaveLength(1);
  });

  it('uses a new opaque tunnel name for each replacement session', () => {
    const first = sessionTunnelName(
      ownerHash(),
      'payments',
      'session-1',
    );
    const second = sessionTunnelName(
      ownerHash(),
      'payments',
      'session-2',
    );

    expect(first).toHaveLength(20);
    expect(second).toHaveLength(20);
    expect(first).not.toBe(second);
    expect(first).not.toContain('payments');
  });

  it('returns the active session for idempotent starts', async () => {
    const { repository, microvms, checkpoints, service } =
      fixture();
    const active = session({
      sessionId: 'existing',
      workspaceId: 'payments',
      state: 'RUNNING',
    });
    repository.records.set(active.sessionId, active);
    repository.claims.set(
      `${active.ownerHash}#${active.workspaceId}`,
      active.sessionId,
    );
    microvms.descriptions.set(active.microvmId!, {
      microvmId: active.microvmId!,
      state: 'RUNNING',
      endpoint: 'existing.example.aws',
    });

    await expect(
      service.start(OWNER, 'payments'),
    ).resolves.toMatchObject({
      created: false,
      record: { sessionId: 'existing', state: 'RUNNING' },
    });
    expect(microvms.runInputs).toHaveLength(0);
    expect(checkpoints.requests).toHaveLength(0);
  });

  it('atomically converges concurrent starts on one session', async () => {
    const { repository, microvms, service } = fixture();
    let nextId = 0;
    const concurrent = new ControlService({
      repository,
      microvms,
      checkpoints: new FakeCheckpoints(),
      loadConfiguration: async () => CONFIGURATION,
      now: () => NOW,
      newId: () => `session-${++nextId}`,
      delay: async () => undefined,
    });

    const results = await Promise.all([
      concurrent.start(OWNER, 'payments'),
      concurrent.start(OWNER, 'payments'),
    ]);

    expect(results.filter((result) => result.created)).toHaveLength(1);
    expect(
      new Set(
        results.map((result) => result.record.sessionId),
      ).size,
    ).toBe(1);
    expect(microvms.runInputs).toHaveLength(1);
  });

  it('rejects invalid workspace IDs and conceals other owners', async () => {
    const { repository, service } = fixture();
    repository.records.set('session-1', session());

    await expect(
      service.start(OWNER, '../escape'),
    ).rejects.toMatchObject({ statusCode: 400 });
    await expect(
      service.get(OTHER_OWNER, 'session-1'),
    ).rejects.toMatchObject({
      statusCode: 404,
      message: 'Session not found',
    });
  });

  it('releases a workspace claim after a launch failure', async () => {
    const { repository, microvms, service } = fixture();
    microvms.runError = new Error('capacity unavailable');

    await expect(service.start(OWNER)).rejects.toMatchObject({
      statusCode: 502,
      message: expect.stringContaining('capacity unavailable'),
    });
    expect(repository.records.get('session-new')).toMatchObject({
      state: 'FAILED',
      failureReason: 'capacity unavailable',
    });
    expect(repository.claims.size).toBe(0);
  });

  it('resumes a suspended VM and returns a native shell token', async () => {
    const { repository, microvms, service } = fixture();
    repository.records.set(
      'session-1',
      session({ state: 'SUSPENDED' }),
    );
    microvms.descriptionSequences.set('microvm-1', [
      { microvmId: 'microvm-1', state: 'SUSPENDED' },
      {
        microvmId: 'microvm-1',
        state: 'RUNNING',
        endpoint: 'microvm.example.aws',
      },
    ]);

    await expect(
      service.connect(OWNER, 'session-1'),
    ).resolves.toMatchObject({
      record: {
        state: 'RUNNING',
        lastActivityAt: NOW,
      },
      connection: {
        authToken: 'short-lived-shell-token',
        expiresAt: NOW + 300,
      },
    });
    expect(microvms.resumed).toEqual(['microvm-1']);
  });

  it('uses direct native lifecycle operations idempotently', async () => {
    const { repository, microvms, service } = fixture();
    repository.records.set('session-1', session());
    microvms.descriptions.set('microvm-1', {
      microvmId: 'microvm-1',
      state: 'RUNNING',
    });

    await expect(
      service.suspend(OWNER, 'session-1'),
    ).resolves.toMatchObject({ state: 'SUSPENDING' });
    await service.suspend(OWNER, 'session-1');
    expect(microvms.suspended).toEqual(['microvm-1']);

    repository.records.get('session-1')!.state = 'SUSPENDED';
    microvms.descriptions.set('microvm-1', {
      microvmId: 'microvm-1',
      state: 'SUSPENDED',
    });
    await expect(
      service.resume(OWNER, 'session-1'),
    ).resolves.toMatchObject({ state: 'RESUMING' });
    await service.resume(OWNER, 'session-1');
    expect(microvms.resumed).toEqual(['microvm-1']);

    repository.records.get('session-1')!.state = 'RUNNING';
    await expect(
      service.terminate(OWNER, 'session-1'),
    ).resolves.toMatchObject({ state: 'TERMINATING' });
    await service.terminate(OWNER, 'session-1');
    expect(microvms.terminated).toEqual(['microvm-1']);
  });

  it('reconciles native termination and releases the claim', async () => {
    const { repository, microvms, service } = fixture();
    const active = session({
      state: 'RUNNING',
      updatedAt: NOW - 120,
    });
    repository.records.set(active.sessionId, active);
    repository.claims.set(
      `${active.ownerHash}#${active.workspaceId}`,
      active.sessionId,
    );
    microvms.descriptions.set('microvm-1', {
      microvmId: 'microvm-1',
      state: 'TERMINATED',
      stateReason: 'Suspended retention elapsed',
    });

    await expect(service.reconcile()).resolves.toEqual({
      reconciled: 1,
      failures: 0,
    });
    expect(repository.records.get('session-1')).toMatchObject({
      state: 'TERMINATED',
      failureReason: 'Suspended retention elapsed',
    });
    expect(repository.claims.size).toBe(0);
  });

  it('marks abandoned provisioning records failed', async () => {
    const { repository, service } = fixture();
    const pending = session({
      state: 'PROVISIONING',
      microvmId: undefined,
      updatedAt: NOW - 600,
    });
    repository.records.set(pending.sessionId, pending);
    repository.claims.set(
      `${pending.ownerHash}#${pending.workspaceId}`,
      pending.sessionId,
    );

    await expect(service.reconcile()).resolves.toEqual({
      reconciled: 1,
      failures: 0,
    });
    expect(repository.records.get('session-1')).toMatchObject({
      state: 'FAILED',
      failureReason: 'MicroVM provisioning timed out',
    });
    expect(repository.claims.size).toBe(0);
  });

  it('checkpoint-terminates sessions nearing the duration limit', async () => {
    const { repository, microvms, service } = fixture();
    const nearingExpiry = session({
      state: 'RUNNING',
      updatedAt: NOW - 120,
      microvmStartedAt: NOW - 28_000,
      microvmExpiresAt: NOW + 800,
    });
    repository.records.set(nearingExpiry.sessionId, nearingExpiry);
    microvms.descriptions.set('microvm-1', {
      microvmId: 'microvm-1',
      state: 'RUNNING',
      startedAt: NOW - 28_000,
      maximumDurationInSeconds: 28_800,
    });

    await expect(service.reconcile()).resolves.toEqual({
      reconciled: 1,
      failures: 0,
    });
    expect(microvms.terminated).toEqual(['microvm-1']);
    expect(repository.records.get('session-1')).toMatchObject({
      state: 'TERMINATING',
    });
  });

  it('leaves sessions alone before the expiration lead window', async () => {
    const { repository, microvms, service } = fixture();
    const healthy = session({
      state: 'RUNNING',
      updatedAt: NOW - 120,
      microvmStartedAt: NOW - 1_000,
      microvmExpiresAt: NOW + 27_800,
    });
    repository.records.set(healthy.sessionId, healthy);
    microvms.descriptions.set('microvm-1', {
      microvmId: 'microvm-1',
      state: 'RUNNING',
      startedAt: NOW - 1_000,
      maximumDurationInSeconds: 28_800,
    });

    await service.reconcile();
    expect(microvms.terminated).toEqual([]);
  });

  it('re-drives terminate for sessions stuck in TERMINATING', async () => {
    const { repository, microvms, service } = fixture();
    const stuck = session({
      state: 'TERMINATING',
      updatedAt: NOW - 300,
    });
    repository.records.set(stuck.sessionId, stuck);
    microvms.descriptions.set('microvm-1', {
      microvmId: 'microvm-1',
      state: 'RUNNING',
    });

    await expect(service.reconcile()).resolves.toEqual({
      reconciled: 1,
      failures: 0,
    });
    expect(microvms.terminated).toEqual(['microvm-1']);
  });

  it('re-drives suspend for sessions stuck in SUSPENDING', async () => {
    const { repository, microvms, service } = fixture();
    const stuck = session({
      state: 'SUSPENDING',
      updatedAt: NOW - 300,
    });
    repository.records.set(stuck.sessionId, stuck);
    microvms.descriptions.set('microvm-1', {
      microvmId: 'microvm-1',
      state: 'RUNNING',
    });

    await service.reconcile();
    expect(microvms.suspended).toEqual(['microvm-1']);
  });

  it('terminates orphaned MicroVMs no session tracks', async () => {
    const { repository, microvms, service } = fixture();
    const tracked = session({
      state: 'RUNNING',
      updatedAt: NOW - 120,
      microvmId: 'microvm-tracked',
    });
    repository.records.set(tracked.sessionId, tracked);
    microvms.descriptions.set('microvm-tracked', {
      microvmId: 'microvm-tracked',
      state: 'RUNNING',
    });
    microvms.listedMicrovms = [
      {
        microvmId: 'microvm-tracked',
        state: 'RUNNING',
        startedAt: NOW - 1_200,
      },
      {
        microvmId: 'microvm-orphan',
        state: 'RUNNING',
        startedAt: NOW - 1_200,
      },
      {
        microvmId: 'microvm-too-young',
        state: 'RUNNING',
        startedAt: NOW - 60,
      },
      {
        microvmId: 'microvm-gone',
        state: 'TERMINATED',
        startedAt: NOW - 1_200,
      },
    ];

    await service.reconcile();
    expect(microvms.terminated).toEqual(['microvm-orphan']);
  });

  it('returns checkpoint URLs only for the assigned MicroVM', async () => {
    const { repository, checkpoints, service } = fixture();
    const active = session({ state: 'RUNNING' });
    repository.records.set(active.sessionId, active);

    await expect(
      service.checkpointUrls('session-1', 'microvm-1'),
    ).resolves.toEqual(checkpoints.access);
    await expect(
      service.checkpointUrls('session-1', 'microvm-other'),
    ).rejects.toMatchObject({ statusCode: 404 });
    await expect(
      service.checkpointUrls('missing', 'microvm-1'),
    ).rejects.toMatchObject({ statusCode: 404 });

    repository.records.set(
      'session-1',
      session({ state: 'TERMINATED' }),
    );
    await expect(
      service.checkpointUrls('session-1', 'microvm-1'),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('rejects payloads above the service limit before launch', async () => {
    const { checkpoints, microvms, service } = fixture();
    checkpoints.access = {
      uploadUrl: `https://bucket.s3.us-east-1.amazonaws.com/x?${'a'.repeat(
        17_000,
      )}`,
    };

    await expect(service.start(OWNER)).rejects.toMatchObject({
      statusCode: 502,
      message: expect.stringContaining('16 KiB'),
    });
    expect(microvms.runInputs).toHaveLength(0);
  });

  it('compresses a gateway launch payload to the 4 KiB service limit', async () => {
    const { checkpoints, microvms, service } = fixture({
      ...CONFIGURATION,
      inferenceMode: 'claude-gateway',
      claudeGatewayUrl: 'https://claude.internal.example.com',
      agentCoreGatewayUrl:
        'https://gateway-id.gateway.bedrock-agentcore.' +
        'us-east-1.amazonaws.com/mcp',
      controlApiUrl:
        'https://control.execute-api.us-east-1.amazonaws.com/v1',
    });
    const securityToken = Array.from({ length: 32 }, (_, index) =>
      createHash('sha256')
        .update(`session-token-${index}`)
        .digest('hex'),
    )
      .join('')
      .slice(0, 2_000);
    const query =
      'X-Amz-Algorithm=AWS4-HMAC-SHA256&' +
      'X-Amz-Credential=credential&' +
      `X-Amz-Security-Token=${securityToken}&`;
    checkpoints.access = {
      downloadUrl:
        `https://bucket.s3.us-east-1.amazonaws.com/checkpoint?${query}` +
        'X-Amz-Signature=download',
      uploadUrl:
        `https://bucket.s3.us-east-1.amazonaws.com/checkpoint?${query}` +
        'X-Amz-Signature=upload',
    };

    await service.start(OWNER, 'gateway-ide', {
      accessMode: 'vscode',
    });

    const encoded = microvms.runInputs[0]!.payload;
    expect(encoded).toMatch(/^gzip-base64:/);
    expect(Buffer.byteLength(encoded, 'utf8')).toBeLessThanOrEqual(
      4_096,
    );
    const decoded = gunzipSync(
      Buffer.from(encoded.slice('gzip-base64:'.length), 'base64'),
    ).toString('utf8');
    expect(JSON.parse(decoded)).toMatchObject({
      version: 3,
      accessMode: 'vscode',
      inferenceMode: 'claude-gateway',
      claudeGatewayUrl: 'https://claude.internal.example.com',
      checkpoint: checkpoints.access,
    });
  });

  it('rejects an incompressible payload above the 4 KiB service limit', async () => {
    const { checkpoints, microvms, service } = fixture();
    const randomish = Array.from({ length: 110 }, (_, index) =>
      createHash('sha256').update(String(index)).digest('hex'),
    ).join('');
    checkpoints.access = {
      uploadUrl:
        'https://bucket.s3.us-east-1.amazonaws.com/x?' + randomish,
    };

    await expect(service.start(OWNER)).rejects.toMatchObject({
      statusCode: 502,
      message: expect.stringContaining('4 KiB'),
    });
    expect(microvms.runInputs).toHaveLength(0);
  });
});

describe('normalizeMicrovmState', () => {
  it.each([
    ['PENDING', 'STARTING'],
    ['RUNNING', 'RUNNING'],
    ['SUSPENDING', 'SUSPENDING'],
    ['SUSPENDED', 'SUSPENDED'],
    ['RESUMING', 'RESUMING'],
    ['TERMINATING', 'TERMINATING'],
    ['TERMINATED', 'TERMINATED'],
    ['FAILED', 'FAILED'],
  ] as const)('maps %s to %s', (input, expected) => {
    expect(normalizeMicrovmState(input)).toBe(expected);
  });

  it('rejects unknown service states', () => {
    expect(() => normalizeMicrovmState('MYSTERY')).toThrow(
      'Unsupported MicroVM state',
    );
  });
});
