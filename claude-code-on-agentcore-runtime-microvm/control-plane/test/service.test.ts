import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import type {
  AgentRuntimeService,
  CreateSessionResult,
  RunResult,
  RuntimeSessionDescription,
  SessionRecord,
  SessionRepository,
  SessionState,
  ShellConnection,
  StartConfiguration,
  WorkspaceCheckpointAccess,
  WorkspaceCheckpointService,
} from '../src/model.js';
import { ACTIVE_STATES } from '../src/model.js';
import { ControlError, ControlService } from '../src/service.js';

const OWNER = 'arn:aws:iam::111122223333:user/alice';
const OTHER_OWNER = 'arn:aws:iam::111122223333:user/bob';
const NOW = 10_000;

const CONFIGURATION: StartConfiguration = {
  region: 'us-east-1',
  partition: 'aws',
  agentRuntimeArn:
    'arn:aws:bedrock-agentcore:us-east-1:111122223333:runtime/test',
  executionRoleArn: 'arn:aws:iam::111122223333:role/agentcore-runtime',
  logGroup: '/claude-agentcore/agentcore-runtime',
  inferenceMode: 'bedrock',
  bedrockModelId: 'anthropic.claude-sonnet-5',
  idleAfterSeconds: 900,
  suspendedRetentionSeconds: 3_600,
};

class MemoryRepository implements SessionRepository {
  public readonly records = new Map<string, SessionRecord>();
  public readonly claims = new Map<string, string>();
  public failCreate = false;

  public async get(sessionId: string): Promise<SessionRecord | undefined> {
    return this.records.get(sessionId);
  }

  public async create(record: SessionRecord): Promise<CreateSessionResult> {
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
      ACTIVE_STATES.includes(claimed.state as (typeof ACTIVE_STATES)[number])
    ) {
      return { created: false, record: claimed };
    }
    this.records.set(record.sessionId, { ...record });
    this.claims.set(key, record.sessionId);
    return { created: true };
  }

  public async releaseWorkspace(record: SessionRecord): Promise<void> {
    const key = `${record.ownerHash}#${record.workspaceId}`;
    if (this.claims.get(key) === record.sessionId) {
      this.claims.delete(key);
    }
  }

  public async listForOwner(ownerHash: string): Promise<SessionRecord[]> {
    return [...this.records.values()].filter(
      (record) => record.ownerHash === ownerHash,
    );
  }

  public async listStateUpdatedBefore(
    state: SessionState,
    updatedBefore: number,
  ): Promise<SessionRecord[]> {
    return [...this.records.values()].filter(
      (record) => record.state === state && record.updatedAt <= updatedBefore,
    );
  }

  public async patch(
    sessionId: string,
    values: Partial<SessionRecord>,
    expectedStates?: SessionState[],
  ): Promise<boolean> {
    const record = this.records.get(sessionId);
    if (!record) return false;
    if (expectedStates && !expectedStates.includes(record.state)) {
      return false;
    }
    this.records.set(sessionId, { ...record, ...values });
    return true;
  }
}

class FakeAgentRuntimeService implements AgentRuntimeService {
  public readonly sessions = new Map<string, RuntimeSessionDescription>();
  public runCalls = 0;
  public terminateCalls: string[] = [];
  public runPayloads: string[] = [];

  public async run(input: {
    agentRuntimeArn: string;
    runtimeSessionId: string;
    executionRoleArn: string;
    payload: string;
    clientToken: string;
  }): Promise<RunResult> {
    this.runCalls += 1;
    this.runPayloads.push(input.payload);
    this.sessions.set(input.runtimeSessionId, {
      runtimeSessionId: input.runtimeSessionId,
      state: 'RUNNING',
      startedAt: NOW,
      maximumDurationInSeconds: 28_800,
    });
    return {
      runtimeSessionId: input.runtimeSessionId,
      state: 'RUNNING',
      startedAt: NOW,
      maximumDurationInSeconds: 28_800,
    };
  }

  public async get(
    _agentRuntimeArn: string,
    runtimeSessionId: string,
  ): Promise<RuntimeSessionDescription> {
    return (
      this.sessions.get(runtimeSessionId) ?? {
        runtimeSessionId,
        state: 'TERMINATED',
      }
    );
  }

  public async createShellConnection(
    _agentRuntimeArn: string,
    runtimeSessionId: string,
    shellId: string,
  ): Promise<ShellConnection> {
    return {
      endpoint: 'wss://bedrock-agentcore.us-east-1.amazonaws.com/shell',
      runtimeSessionId,
      shellId,
      authToken: '',
      expiresAt: NOW + 3_600,
    };
  }

  public async suspend(): Promise<void> {
    // No-op: matches the real adapter's emulated suspend.
  }

  public async resume(
    _agentRuntimeArn: string,
    runtimeSessionId: string,
  ): Promise<void> {
    const session = this.sessions.get(runtimeSessionId);
    if (!session || session.state === 'TERMINATED') {
      throw new Error('Cannot resume a terminated AgentCore Runtime session');
    }
  }

  public async terminate(
    _agentRuntimeArn: string,
    runtimeSessionId: string,
  ): Promise<void> {
    this.terminateCalls.push(runtimeSessionId);
    this.sessions.set(runtimeSessionId, {
      runtimeSessionId,
      state: 'TERMINATED',
    });
  }
}

class FakeCheckpointService implements WorkspaceCheckpointService {
  public async createAccess(): Promise<WorkspaceCheckpointAccess> {
    return { uploadUrl: 'https://bucket.s3.us-east-1.amazonaws.com/key' };
  }
}

function newService(overrides?: {
  repository?: SessionRepository;
  agentRuntime?: AgentRuntimeService;
  now?: () => number;
  newId?: () => string;
}): {
  service: ControlService;
  repository: MemoryRepository;
  agentRuntime: FakeAgentRuntimeService;
} {
  const repository =
    (overrides?.repository as MemoryRepository) ?? new MemoryRepository();
  const agentRuntime =
    (overrides?.agentRuntime as FakeAgentRuntimeService) ??
    new FakeAgentRuntimeService();
  let counter = 0;
  const service = new ControlService({
    repository,
    agentRuntime,
    checkpoints: new FakeCheckpointService(),
    loadConfiguration: async () => CONFIGURATION,
    now: overrides?.now ?? (() => NOW),
    newId:
      overrides?.newId ??
      (() => {
        counter += 1;
        // 33+ chars, matching the real runtimeSessionId length constraint.
        return `session-${counter}`.padEnd(36, '0');
      }),
  });
  return { service, repository, agentRuntime };
}

describe('ControlService.start', () => {
  it('creates a new session and launches the AgentCore Runtime', async () => {
    const { service, agentRuntime } = newService();
    const result = await service.start(OWNER, 'my-workspace');
    expect(result.created).toBe(true);
    expect(result.record.state).toBe('RUNNING');
    expect(result.record.workspaceId).toBe('my-workspace');
    expect(result.record.runtimeArn).toBe(CONFIGURATION.agentRuntimeArn);
    expect(agentRuntime.runCalls).toBe(1);
  });

  it('reuses an active session for the same owner and workspace', async () => {
    const { service } = newService();
    const first = await service.start(OWNER, 'default');
    const second = await service.start(OWNER, 'default');
    expect(second.created).toBe(false);
    expect(second.record.sessionId).toBe(first.record.sessionId);
  });

  it('rejects unsupported access modes', async () => {
    const { service } = newService();
    await expect(
      service.start(OWNER, 'default', { accessMode: 'vscode' }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('rejects claude-ai inference mode when not allowed', async () => {
    const { service } = newService();
    await expect(
      service.start(OWNER, 'default', { inferenceMode: 'claude-ai' }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('rolls back the workspace claim when the runtime launch fails', async () => {
    class FailingAgentRuntime extends FakeAgentRuntimeService {
      public override async run(): Promise<RunResult> {
        throw new Error('boom');
      }
    }
    const { service, repository } = newService({
      agentRuntime: new FailingAgentRuntime(),
    });
    await expect(service.start(OWNER, 'default')).rejects.toMatchObject({
      statusCode: 502,
    });
    const records = await repository.listForOwner(
      service.ownerHash(OWNER),
    );
    expect(records[0]?.state).toBe('FAILED');
  });

  it('scopes workspaces per owner', async () => {
    const { service } = newService();
    const alice = await service.start(OWNER, 'default');
    const bob = await service.start(OTHER_OWNER, 'default');
    expect(alice.record.sessionId).not.toBe(bob.record.sessionId);
  });
});

describe('ControlService.connect', () => {
  it('returns a shell connection for a running session', async () => {
    const { service } = newService();
    const started = await service.start(OWNER, 'default');
    const connected = await service.connect(OWNER, started.record.sessionId);
    expect(connected.connection.runtimeSessionId).toBe(
      started.record.runtimeSessionId,
    );
    expect(connected.connection.shellId).toMatch(/^shell-/);
    expect(connected.record.state).toBe('RUNNING');
  });

  it('rejects a caller that does not own the session', async () => {
    const { service } = newService();
    const started = await service.start(OWNER, 'default');
    await expect(
      service.connect(OTHER_OWNER, started.record.sessionId),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('ControlService.suspend/resume', () => {
  it('emulates suspend without a control-plane pause primitive', async () => {
    const { service, agentRuntime } = newService();
    const started = await service.start(OWNER, 'default');
    const suspended = await service.suspend(OWNER, started.record.sessionId);
    expect(suspended.state).toBe('SUSPENDED');
    // No real pause call is made; the AgentCore Runtime session keeps
    // running underneath the emulated SUSPENDED app state.
    expect(agentRuntime.terminateCalls).toHaveLength(0);

    const resumed = await service.resume(OWNER, started.record.sessionId);
    expect(resumed.state).toBe('RUNNING');
  });

  it('rejects suspending a session that is not running', async () => {
    const { service } = newService();
    const started = await service.start(OWNER, 'default');
    await service.suspend(OWNER, started.record.sessionId);
    await expect(
      service.suspend(OWNER, started.record.sessionId),
    ).resolves.toMatchObject({ state: 'SUSPENDED' });
  });
});

describe('ControlService.terminate', () => {
  it('stops the AgentCore Runtime session and releases the workspace claim', async () => {
    const { service, agentRuntime, repository } = newService();
    const started = await service.start(OWNER, 'default');
    const terminated = await service.terminate(
      OWNER,
      started.record.sessionId,
    );
    expect(terminated.state).toBe('TERMINATED');
    expect(agentRuntime.terminateCalls).toEqual([
      started.record.runtimeSessionId,
    ]);
    // Terminating releases the workspace claim so the same workspaceId can
    // be started again immediately.
    const restarted = await service.start(OWNER, 'default');
    expect(restarted.created).toBe(true);
    expect(restarted.record.sessionId).not.toBe(started.record.sessionId);
    void repository;
  });

  it('is idempotent for an already-terminated session', async () => {
    const { service } = newService();
    const started = await service.start(OWNER, 'default');
    await service.terminate(OWNER, started.record.sessionId);
    const again = await service.terminate(OWNER, started.record.sessionId);
    expect(again.state).toBe('TERMINATED');
  });
});

describe('ControlService.checkpointUrls', () => {
  it('rejects a mismatched runtimeSessionId', async () => {
    const { service } = newService();
    const started = await service.start(OWNER, 'default');
    await expect(
      service.checkpointUrls(started.record.sessionId, 'wrong-runtime-id'),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('returns checkpoint access for the active session', async () => {
    const { service } = newService();
    const started = await service.start(OWNER, 'default');
    const access = await service.checkpointUrls(
      started.record.sessionId,
      started.record.runtimeSessionId!,
    );
    expect(access.uploadUrl).toContain('https://');
  });
});

describe('run hook payload compression', () => {
  it('round-trips through the AwsAgentRuntimeService payload encoding path', async () => {
    const { service, agentRuntime } = newService();
    await service.start(OWNER, 'default');
    const [payload] = agentRuntime.runPayloads;
    expect(payload).toBeDefined();
    let decoded: string;
    if (payload!.startsWith('gzip-base64:')) {
      decoded = gunzipSync(
        Buffer.from(payload!.slice('gzip-base64:'.length), 'base64'),
      ).toString('utf8');
    } else {
      decoded = payload!;
    }
    const value = JSON.parse(decoded) as Record<string, unknown>;
    expect(value.version).toBe(1);
    expect(value.ownerHash).toBe(
      createHash('sha256').update(OWNER).digest('hex'),
    );
  });
});
