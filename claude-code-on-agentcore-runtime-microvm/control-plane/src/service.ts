import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import type {
  AccessMode,
  AgentRuntimeService,
  InferenceMode,
  RuntimeSessionDescription,
  SessionRecord,
  SessionRepository,
  SessionState,
  ShellConnection,
  StartConfiguration,
  WorkspaceCheckpointAccess,
  WorkspaceCheckpointService,
} from './model.js';
import { ACTIVE_STATES } from './model.js';

const WORKSPACE_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/;
const RECORD_TTL_SECONDS = 30 * 24 * 60 * 60;
const MAX_RUN_HOOK_PAYLOAD_BYTES = 4_096;
const MAX_DECODED_RUN_HOOK_PAYLOAD_BYTES = 16_384;
const COMPRESSED_RUN_HOOK_PAYLOAD_PREFIX = 'gzip-base64:';
const RECONCILE_AFTER_SECONDS = 60;
const PROVISIONING_TIMEOUT_SECONDS = 5 * 60;
const DEFAULT_EXPIRATION_LEAD_SECONDS = 45 * 60;

export class ControlError extends Error {
  public constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

export interface ControlServiceOptions {
  repository: SessionRepository;
  agentRuntime: AgentRuntimeService;
  checkpoints: WorkspaceCheckpointService;
  loadConfiguration: () => Promise<StartConfiguration>;
  expirationLeadSeconds?: number;
  now?: () => number;
  newId?: () => string;
}

export interface StartOptions {
  accessMode?: AccessMode;
  inferenceMode?: InferenceMode;
}

/**
 * Session-lifecycle service for the AgentCore Runtime sample. This mirrors
 * `ControlService` from `claude-code-on-lambda-microvm/control-plane/src/
 * service.ts` closely, but only the `terminal` access mode is implemented
 * -- see docs/deployment-guide.md ("What is different") for VS Code tunnel
 * parity status.
 */
export class ControlService {
  private readonly now: () => number;
  private readonly newId: () => string;
  private readonly expirationLeadSeconds: number;

  public constructor(private readonly options: ControlServiceOptions) {
    this.now = options.now ?? (() => Math.floor(Date.now() / 1_000));
    this.newId = options.newId ?? randomUUID;
    this.expirationLeadSeconds =
      options.expirationLeadSeconds ?? DEFAULT_EXPIRATION_LEAD_SECONDS;
  }

  public ownerHash(ownerPrincipal: string): string {
    return createHash('sha256').update(ownerPrincipal).digest('hex');
  }

  public async start(
    ownerPrincipal: string,
    requestedWorkspaceId?: string,
    options: StartOptions = {},
  ): Promise<{ record: SessionRecord; created: boolean }> {
    const config = await this.options.loadConfiguration();
    const ownerHash = this.ownerHash(ownerPrincipal);
    const workspaceId = requestedWorkspaceId ?? 'default';
    const accessMode = options.accessMode ?? 'terminal';
    const inferenceMode = options.inferenceMode ?? config.inferenceMode;
    if (!WORKSPACE_ID_PATTERN.test(workspaceId)) {
      throw new ControlError(
        400,
        'workspaceId must be 1-64 letters, numbers, dots, underscores, or hyphens',
      );
    }
    if (accessMode !== 'terminal') {
      throw new ControlError(
        400,
        'Only the terminal access mode is implemented in this sample',
      );
    }
    if (inferenceMode === 'claude-ai') {
      if (!config.allowClaudeAiSubscription) {
        throw new ControlError(
          403,
          'Claude.ai subscription access is not enabled for this deployment',
        );
      }
    } else if (inferenceMode !== config.inferenceMode) {
      throw new ControlError(
        400,
        `This deployment is configured for ${config.inferenceMode}`,
      );
    }

    const existing = (
      await this.options.repository.listForOwner(ownerHash)
    ).find(
      (record) =>
        record.workspaceId === workspaceId &&
        ACTIVE_STATES.includes(
          record.state as (typeof ACTIVE_STATES)[number],
        ),
    );
    if (existing) {
      const current = existing.runtimeSessionId
        ? await this.refreshFromRuntime(existing)
        : existing;
      if (
        ACTIVE_STATES.includes(
          current.state as (typeof ACTIVE_STATES)[number],
        )
      ) {
        return { record: current, created: false };
      }
    }

    const now = this.now();
    const sessionId = this.newId();
    const record: SessionRecord = {
      sessionId,
      ownerHash,
      workspaceId,
      state: 'PROVISIONING',
      createdAt: now,
      updatedAt: now,
      lastActivityAt: now,
      expiresAt: now + RECORD_TTL_SECONDS,
      inferenceMode,
      accessMode,
    };

    let recordStored = false;
    try {
      const createResult = await this.options.repository.create(record);
      if (!createResult.created) {
        return { record: createResult.record, created: false };
      }
      recordStored = true;

      const checkpoint = await this.options.checkpoints.createAccess(
        ownerHash,
        workspaceId,
      );
      const runPayload = encodeRunHookPayload({
        version: 1,
        sessionId,
        ownerHash,
        workspaceId,
        awsRegion: config.region,
        inferenceMode,
        accessMode,
        bedrockModelId:
          inferenceMode === 'bedrock' ? config.bedrockModelId : undefined,
        controlApiUrl: config.controlApiUrl || undefined,
        checkpoint,
      });

      const run = await this.options.agentRuntime.run({
        agentRuntimeArn: config.agentRuntimeArn,
        runtimeSessionId: sessionId,
        executionRoleArn: config.executionRoleArn,
        payload: runPayload,
        clientToken: sessionId,
      });
      const updatedAt = this.now();
      const patch: Partial<SessionRecord> = {
        state: normalizeRuntimeState(run.state),
        updatedAt,
        runtimeArn: config.agentRuntimeArn,
        runtimeSessionId: run.runtimeSessionId,
        runtimeStartedAt: run.startedAt,
        runtimeExpiresAt: run.startedAt + run.maximumDurationInSeconds,
      };
      const updated = await this.options.repository.patch(
        sessionId,
        patch,
        ['PROVISIONING'],
      );
      if (!updated) {
        throw new Error(
          'Session changed state while the runtime was launching',
        );
      }
      return { record: { ...record, ...patch }, created: true };
    } catch (error) {
      if (error instanceof ControlError && !recordStored) {
        throw error;
      }
      const reason = safeErrorMessage(error);
      if (recordStored) {
        await Promise.allSettled([
          this.options.repository.patch(
            sessionId,
            { state: 'FAILED', updatedAt: this.now(), failureReason: reason },
            ['PROVISIONING'],
          ),
          this.options.repository.releaseWorkspace(record),
        ]);
      }
      throw new ControlError(502, `Unable to launch AgentCore Runtime session: ${reason}`);
    }
  }

  public async list(
    ownerPrincipal: string,
    refreshActive = false,
  ): Promise<SessionRecord[]> {
    const records = await this.options.repository.listForOwner(
      this.ownerHash(ownerPrincipal),
    );
    if (!refreshActive) {
      return records;
    }
    return Promise.all(
      records.map((record) =>
        record.runtimeSessionId && isActive(record.state)
          ? this.refreshFromRuntime(record)
          : record,
      ),
    );
  }

  public async get(
    ownerPrincipal: string,
    sessionId: string,
  ): Promise<SessionRecord> {
    const record = await this.getOwned(ownerPrincipal, sessionId);
    return record.runtimeSessionId && isActive(record.state)
      ? this.refreshFromRuntime(record)
      : record;
  }

  public async connect(
    ownerPrincipal: string,
    sessionId: string,
  ): Promise<{ record: SessionRecord; connection: ShellConnection }> {
    let record = await this.getOwned(ownerPrincipal, sessionId);
    if (!record.runtimeSessionId) {
      throw new ControlError(409, 'Session has no runtime assigned');
    }
    if (record.state === 'TERMINATED' || record.state === 'FAILED') {
      throw new ControlError(
        409,
        'Session is no longer connectable; start the workspace again',
      );
    }
    const config = await this.options.loadConfiguration();
    const shellId = `shell-${record.sessionId.slice(0, 24)}`;
    const connection = await this.options.agentRuntime.createShellConnection(
      config.agentRuntimeArn,
      record.runtimeSessionId,
      shellId,
    );
    const now = this.now();
    const patch: Partial<SessionRecord> = {
      state: 'RUNNING',
      shellId,
      lastActivityAt: now,
      updatedAt: now,
      failureReason: '',
    };
    await this.options.repository.patch(sessionId, patch, [
      'STARTING',
      'RUNNING',
      'RESUMING',
    ]);
    record = { ...record, ...patch };
    return { record, connection };
  }

  /**
   * Emulated suspend: AgentCore Runtime has no per-session pause
   * primitive, so this only checkpoints application state; the microVM
   * keeps running until `terminate` or the 8h max lifetime. See
   * `AwsAgentRuntimeService` for the full rationale.
   */
  public async suspend(
    ownerPrincipal: string,
    sessionId: string,
  ): Promise<SessionRecord> {
    const record = await this.get(ownerPrincipal, sessionId);
    if (!record.runtimeSessionId) {
      throw new ControlError(409, 'Session has no runtime assigned');
    }
    if (record.state === 'SUSPENDED' || record.state === 'SUSPENDING') {
      return record;
    }
    if (record.state !== 'RUNNING') {
      throw new ControlError(
        409,
        `Cannot suspend a session in ${record.state} state`,
      );
    }
    const updatedAt = this.now();
    const claimed = await this.options.repository.patch(
      sessionId,
      { state: 'SUSPENDED', updatedAt },
      ['RUNNING'],
    );
    if (!claimed) {
      return (await this.options.repository.get(sessionId)) ?? record;
    }
    await this.options.agentRuntime.suspend(record.runtimeSessionId);
    return { ...record, state: 'SUSPENDED', updatedAt };
  }

  public async resume(
    ownerPrincipal: string,
    sessionId: string,
  ): Promise<SessionRecord> {
    const record = await this.get(ownerPrincipal, sessionId);
    if (!record.runtimeSessionId) {
      throw new ControlError(409, 'Session has no runtime assigned');
    }
    if (record.state === 'RUNNING' || record.state === 'RESUMING') {
      return record;
    }
    if (record.state !== 'SUSPENDED') {
      throw new ControlError(
        409,
        `Cannot resume a session in ${record.state} state`,
      );
    }
    const updatedAt = this.now();
    const claimed = await this.options.repository.patch(
      sessionId,
      { state: 'RUNNING', updatedAt, lastActivityAt: updatedAt },
      ['SUSPENDED'],
    );
    if (!claimed) {
      return (await this.options.repository.get(sessionId)) ?? record;
    }
    const config = await this.options.loadConfiguration();
    await this.options.agentRuntime.resume(
      config.agentRuntimeArn,
      record.runtimeSessionId,
    );
    return { ...record, state: 'RUNNING', updatedAt, lastActivityAt: updatedAt };
  }

  public async terminate(
    ownerPrincipal: string,
    sessionId: string,
  ): Promise<SessionRecord> {
    const record = await this.getOwned(ownerPrincipal, sessionId);
    if (record.state === 'TERMINATED' || record.state === 'TERMINATING') {
      return record;
    }
    if (!record.runtimeSessionId) {
      const updatedAt = this.now();
      await this.options.repository.patch(
        sessionId,
        { state: 'TERMINATED', updatedAt },
        [record.state],
      );
      await this.options.repository.releaseWorkspace(record);
      return { ...record, state: 'TERMINATED', updatedAt };
    }

    const updatedAt = this.now();
    const claimed = await this.options.repository.patch(
      sessionId,
      { state: 'TERMINATING', updatedAt },
      [
        'PROVISIONING',
        'STARTING',
        'RUNNING',
        'SUSPENDING',
        'SUSPENDED',
        'RESUMING',
        'FAILED',
      ],
    );
    if (!claimed) {
      return (await this.options.repository.get(sessionId)) ?? record;
    }
    const config = await this.options.loadConfiguration();
    await this.options.agentRuntime.terminate(
      config.agentRuntimeArn,
      record.runtimeSessionId,
    );
    const finalUpdatedAt = this.now();
    await this.options.repository.patch(
      sessionId,
      { state: 'TERMINATED', updatedAt: finalUpdatedAt },
      ['TERMINATING'],
    );
    await this.options.repository.releaseWorkspace(record);
    return { ...record, state: 'TERMINATED', updatedAt: finalUpdatedAt };
  }

  public async checkpointUrls(
    sessionId: string,
    runtimeSessionId: string,
  ): Promise<WorkspaceCheckpointAccess> {
    const record = await this.options.repository.get(sessionId);
    if (
      !record ||
      !record.runtimeSessionId ||
      record.runtimeSessionId !== runtimeSessionId
    ) {
      throw new ControlError(404, 'Session not found');
    }
    if (!isActive(record.state)) {
      throw new ControlError(409, 'Session is no longer active');
    }
    return this.options.checkpoints.createAccess(
      record.ownerHash,
      record.workspaceId,
    );
  }

  public async reconcile(): Promise<{ reconciled: number; failures: number }> {
    const now = this.now();
    const result = { reconciled: 0, failures: 0 };
    for (const state of ACTIVE_STATES) {
      const records = await this.options.repository.listStateUpdatedBefore(
        state,
        now,
      );
      for (const record of records) {
        if (record.updatedAt > now - RECONCILE_AFTER_SECONDS) {
          continue;
        }
        try {
          if (!record.runtimeSessionId) {
            if (
              record.state === 'PROVISIONING' &&
              record.updatedAt <= now - PROVISIONING_TIMEOUT_SECONDS
            ) {
              await this.options.repository.patch(
                record.sessionId,
                {
                  state: 'FAILED',
                  updatedAt: now,
                  failureReason: 'AgentCore Runtime provisioning timed out',
                },
                ['PROVISIONING'],
              );
              await this.options.repository.releaseWorkspace(record);
              result.reconciled += 1;
            }
            continue;
          }
          await this.refreshFromRuntime(record);
          if (await this.terminateBeforeExpiry(record, now)) {
            result.reconciled += 1;
            continue;
          }
          result.reconciled += 1;
        } catch (error) {
          result.failures += 1;
          console.error('state reconciliation failed', {
            sessionId: record.sessionId,
            error: safeErrorMessage(error),
          });
        }
      }
    }
    return result;
  }

  private async terminateBeforeExpiry(
    record: SessionRecord,
    now: number,
  ): Promise<boolean> {
    if (
      !record.runtimeSessionId ||
      !record.runtimeExpiresAt ||
      !['RUNNING', 'SUSPENDED', 'STARTING'].includes(record.state) ||
      record.runtimeExpiresAt - now > this.expirationLeadSeconds
    ) {
      return false;
    }
    const claimed = await this.options.repository.patch(
      record.sessionId,
      {
        state: 'TERMINATING',
        updatedAt: now,
        failureReason:
          'Checkpoint-terminated before the AgentCore Runtime session ' +
          'duration limit',
      },
      [record.state],
    );
    if (!claimed) {
      return false;
    }
    const config = await this.options.loadConfiguration();
    await this.options.agentRuntime.terminate(
      config.agentRuntimeArn,
      record.runtimeSessionId,
    );
    return true;
  }

  private async getOwned(
    ownerPrincipal: string,
    sessionId: string,
  ): Promise<SessionRecord> {
    const record = await this.options.repository.get(sessionId);
    if (!record) {
      throw new ControlError(404, 'Session not found');
    }
    this.assertOwner(record, ownerPrincipal);
    return record;
  }

  private async refreshFromRuntime(
    record: SessionRecord,
  ): Promise<SessionRecord> {
    if (!record.runtimeSessionId) {
      return record;
    }
    let description: RuntimeSessionDescription;
    try {
      description = await this.options.agentRuntime.get(
        record.runtimeArn ?? (await this.options.loadConfiguration()).agentRuntimeArn,
        record.runtimeSessionId,
      );
    } catch (error) {
      console.error('runtime session lookup failed', {
        sessionId: record.sessionId,
        error: safeErrorMessage(error),
      });
      return record;
    }
    const state = normalizeRuntimeState(description.state);
    if (
      (record.state === 'SUSPENDED' && state === 'TERMINATED') ||
      (record.state === 'TERMINATING' && state !== 'TERMINATED')
    ) {
      return record;
    }
    // Do not let a stale/looked-up "not found" state override an
    // in-app-managed SUSPENDED record: AgentCore Runtime has no real
    // suspend, so ListSessions may still report RUNNING or nothing at all
    // depending on service-side idle handling.
    if (record.state === 'SUSPENDED') {
      return record;
    }
    const patch: Partial<SessionRecord> = {
      state,
      updatedAt: this.now(),
      failureReason: description.stateReason ?? '',
    };
    const updated = await this.options.repository.patch(
      record.sessionId,
      patch,
      [record.state],
    );
    const current = updated ? { ...record, ...patch } : record;
    if (updated && (state === 'TERMINATED' || state === 'FAILED')) {
      await this.options.repository.releaseWorkspace(current);
    }
    return current;
  }

  private assertOwner(record: SessionRecord, ownerPrincipal: string): void {
    const expected = Buffer.from(record.ownerHash, 'hex');
    const actual = Buffer.from(this.ownerHash(ownerPrincipal), 'hex');
    if (
      expected.length !== actual.length ||
      !timingSafeEqual(expected, actual)
    ) {
      throw new ControlError(404, 'Session not found');
    }
  }
}

export function normalizeRuntimeState(state: string): SessionState {
  switch (state.toUpperCase()) {
    case 'PENDING':
    case 'STARTING':
      return 'STARTING';
    case 'RUNNING':
    case 'ACTIVE':
      return 'RUNNING';
    case 'STOPPING':
    case 'TERMINATING':
      return 'TERMINATING';
    case 'STOPPED':
    case 'TERMINATED':
      return 'TERMINATED';
    case 'FAILED':
      return 'FAILED';
    default:
      return 'RUNNING';
  }
}

function isActive(state: SessionState): boolean {
  return ACTIVE_STATES.includes(state as (typeof ACTIVE_STATES)[number]);
}

function safeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.slice(0, 500);
  }
  return 'Unknown error';
}

function encodeRunHookPayload(value: Record<string, unknown>): string {
  const decoded = JSON.stringify(value);
  const decodedBytes = Buffer.byteLength(decoded, 'utf8');
  if (decodedBytes > MAX_DECODED_RUN_HOOK_PAYLOAD_BYTES) {
    throw new Error('Run hook payload exceeds the 16 KiB decoded limit');
  }
  if (decodedBytes <= MAX_RUN_HOOK_PAYLOAD_BYTES) {
    return decoded;
  }
  const encoded =
    COMPRESSED_RUN_HOOK_PAYLOAD_PREFIX +
    gzipSync(Buffer.from(decoded, 'utf8'), { level: 9 }).toString('base64');
  if (Buffer.byteLength(encoded, 'utf8') > MAX_RUN_HOOK_PAYLOAD_BYTES) {
    throw new Error(
      'Compressed run hook payload exceeds the 4 KiB service limit',
    );
  }
  return encoded;
}
