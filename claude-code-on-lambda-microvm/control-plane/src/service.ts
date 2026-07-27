import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import type {
  AccessMode,
  InferenceMode,
  MicrovmDescription,
  MicrovmService,
  SessionRecord,
  SessionRepository,
  SessionState,
  ShellConnection,
  StartConfiguration,
  TunnelIdentityProvider,
  WorkspaceCheckpointAccess,
  WorkspaceCheckpointService,
} from './model.js';
import { ACTIVE_STATES } from './model.js';

const WORKSPACE_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/;
const RECORD_TTL_SECONDS = 30 * 24 * 60 * 60;
const MAX_RUN_HOOK_PAYLOAD_BYTES = 4_096;
const MAX_DECODED_RUN_HOOK_PAYLOAD_BYTES = 16_384;
const COMPRESSED_RUN_HOOK_PAYLOAD_PREFIX = 'gzip-base64:';
const SHELL_TOKEN_TTL_MINUTES = 5;
const CONNECT_ATTEMPTS = 40;
const CONNECT_RETRY_MILLISECONDS = 250;
const RECONCILE_AFTER_SECONDS = 60;
const PROVISIONING_TIMEOUT_SECONDS = 5 * 60;
const REDRIVE_AFTER_SECONDS = 2 * 60;
const ORPHAN_GRACE_SECONDS = 10 * 60;
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
  microvms: MicrovmService;
  checkpoints: WorkspaceCheckpointService;
  loadConfiguration: () => Promise<StartConfiguration>;
  expirationLeadSeconds?: number;
  now?: () => number;
  newId?: () => string;
  delay?: (milliseconds: number) => Promise<void>;
}

export interface StartOptions {
  accessMode?: AccessMode;
  inferenceMode?: InferenceMode;
  tunnelProvider?: TunnelIdentityProvider;
}

export class ControlService {
  private readonly now: () => number;
  private readonly newId: () => string;
  private readonly delay: (milliseconds: number) => Promise<void>;
  private readonly expirationLeadSeconds: number;

  public constructor(private readonly options: ControlServiceOptions) {
    this.now = options.now ?? (() => Math.floor(Date.now() / 1_000));
    this.newId = options.newId ?? randomUUID;
    this.delay =
      options.delay ??
      ((milliseconds) =>
        new Promise((resolve) => setTimeout(resolve, milliseconds)));
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
    const tunnelProvider = options.tunnelProvider ?? 'github';
    if (!WORKSPACE_ID_PATTERN.test(workspaceId)) {
      throw new ControlError(
        400,
        'workspaceId must be 1-64 letters, numbers, dots, underscores, or hyphens',
      );
    }
    if (accessMode !== 'terminal' && accessMode !== 'vscode') {
      throw new ControlError(400, 'Unsupported access mode');
    }
    if (
      tunnelProvider !== 'github' &&
      tunnelProvider !== 'microsoft'
    ) {
      throw new ControlError(400, 'Unsupported tunnel provider');
    }
    if (accessMode !== 'vscode' && options.tunnelProvider) {
      throw new ControlError(
        400,
        'tunnelProvider is only valid for VS Code sessions',
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

    const existing = (await this.options.repository.listForOwner(ownerHash)).find(
      (record) =>
        record.workspaceId === workspaceId &&
        ACTIVE_STATES.includes(
          record.state as (typeof ACTIVE_STATES)[number],
        ),
    );
    if (existing) {
      const current = existing.microvmId
        ? await this.refreshFromMicrovm(existing)
        : existing;
      if (
        ACTIVE_STATES.includes(
          current.state as (typeof ACTIVE_STATES)[number],
        )
      ) {
        assertSessionOptions(
          current,
          accessMode,
          inferenceMode,
          config.inferenceMode,
        );
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
      tunnelName:
        accessMode === 'vscode'
          ? sessionTunnelName(ownerHash, workspaceId, sessionId)
          : undefined,
      tunnelProvider:
        accessMode === 'vscode' ? tunnelProvider : undefined,
    };

    let recordStored = false;
    let launchedMicrovmId: string | undefined;
    try {
      const createResult = await this.options.repository.create(record);
      if (!createResult.created) {
        assertSessionOptions(
          createResult.record,
          accessMode,
          inferenceMode,
          config.inferenceMode,
        );
        return { record: createResult.record, created: false };
      }
      recordStored = true;

      const checkpoint = await this.options.checkpoints.createAccess(
        ownerHash,
        workspaceId,
      );
      // Keep existing image-19 terminal sessions deployable while the feature
      // image is building. VS Code and Claude.ai require the v3 contract.
      const payloadVersion =
        accessMode === 'vscode' || inferenceMode === 'claude-ai'
          ? 3
          : 2;
      const runPayload = encodeRunHookPayload({
        version: payloadVersion,
        sessionId,
        ownerHash,
        workspaceId,
        awsRegion: config.region,
        inferenceMode,
        ...(payloadVersion === 3
          ? {
              accessMode,
              tunnelName: record.tunnelName,
            }
          : {}),
        claudeGatewayUrl:
          inferenceMode === 'claude-gateway'
            ? config.claudeGatewayUrl
            : undefined,
        bedrockModelId:
          inferenceMode === 'bedrock'
            ? config.bedrockModelId
            : undefined,
        agentCoreGatewayUrl: config.agentCoreGatewayUrl || undefined,
        controlApiUrl: config.controlApiUrl || undefined,
        checkpoint,
      });

      const run = await this.options.microvms.run({
        imageArn: config.imageArn,
        egressArns: [config.connectorArn],
        ingressArn:
          `arn:${config.partition}:lambda:${config.region}:aws:` +
          'network-connector:aws-network-connector:SHELL_INGRESS',
        executionRoleArn: config.executionRoleArn,
        logGroup: config.logGroup,
        payload: runPayload,
        clientToken: sessionId,
        idleAfterSeconds:
          accessMode === 'vscode'
            ? undefined
            : config.idleAfterSeconds,
        suspendedRetentionSeconds: config.suspendedRetentionSeconds,
      });
      launchedMicrovmId = run.microvmId;
      const updatedAt = this.now();
      const patch: Partial<SessionRecord> = {
        state: normalizeMicrovmState(run.state),
        updatedAt,
        microvmId: run.microvmId,
        microvmEndpoint: run.endpoint,
        imageArn: run.imageArn,
        imageVersion: run.imageVersion,
        microvmStartedAt: run.startedAt,
        microvmExpiresAt:
          run.startedAt + run.maximumDurationInSeconds,
      };
      const updated = await this.options.repository.patch(
        sessionId,
        patch,
        ['PROVISIONING'],
      );
      if (!updated) {
        throw new Error('Session changed state while the MicroVM was launching');
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
            {
              state: 'FAILED',
              updatedAt: this.now(),
              failureReason: reason,
            },
            ['PROVISIONING'],
          ),
          this.options.repository.releaseWorkspace(record),
          ...(launchedMicrovmId
            ? [this.options.microvms.terminate(launchedMicrovmId)]
            : []),
        ]);
      }
      throw new ControlError(502, `Unable to launch MicroVM: ${reason}`);
    }
  }

  public async list(ownerPrincipal: string): Promise<SessionRecord[]> {
    return this.options.repository.listForOwner(
      this.ownerHash(ownerPrincipal),
    );
  }

  public async get(
    ownerPrincipal: string,
    sessionId: string,
  ): Promise<SessionRecord> {
    const record = await this.getOwned(ownerPrincipal, sessionId);
    return record.microvmId && isActive(record.state)
      ? this.refreshFromMicrovm(record)
      : record;
  }

  public async setTunnelProvider(
    ownerPrincipal: string,
    sessionId: string,
    provider: TunnelIdentityProvider,
  ): Promise<SessionRecord> {
    const record = await this.getOwned(ownerPrincipal, sessionId);
    if (record.accessMode !== 'vscode' || !record.tunnelName) {
      throw new ControlError(
        409,
        'Tunnel provider is only available for VS Code sessions',
      );
    }
    if (provider !== 'github' && provider !== 'microsoft') {
      throw new ControlError(400, 'Unsupported tunnel provider');
    }
    if (record.tunnelProvider === provider) {
      return record;
    }
    const updatedAt = this.now();
    const updated = await this.options.repository.patch(
      sessionId,
      { tunnelProvider: provider, updatedAt },
      [record.state],
    );
    if (!updated) {
      throw new ControlError(
        409,
        'Session changed while updating the tunnel provider',
      );
    }
    return { ...record, tunnelProvider: provider, updatedAt };
  }

  public async connect(
    ownerPrincipal: string,
    sessionId: string,
  ): Promise<{ record: SessionRecord; connection: ShellConnection }> {
    let record = await this.getOwned(ownerPrincipal, sessionId);
    if (!record.microvmId) {
      throw new ControlError(409, 'Session has no MicroVM assigned');
    }
    if (record.state === 'TERMINATED' || record.state === 'FAILED') {
      throw new ControlError(
        409,
        'Session is no longer connectable; start the workspace again',
      );
    }

    const description = await this.waitForRunning(record);
    const connection = await this.options.microvms.createShellConnection(
      record.microvmId,
      SHELL_TOKEN_TTL_MINUTES,
    );
    const now = this.now();
    const patch: Partial<SessionRecord> = {
      state: 'RUNNING',
      microvmEndpoint: description.endpoint ?? connection.endpoint,
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

  public async suspend(
    ownerPrincipal: string,
    sessionId: string,
  ): Promise<SessionRecord> {
    const record = await this.get(ownerPrincipal, sessionId);
    if (!record.microvmId) {
      throw new ControlError(409, 'Session has no MicroVM assigned');
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
      { state: 'SUSPENDING', updatedAt },
      ['RUNNING'],
    );
    if (!claimed) {
      return (await this.options.repository.get(sessionId)) ?? record;
    }
    try {
      await this.options.microvms.suspend(record.microvmId);
      return { ...record, state: 'SUSPENDING', updatedAt };
    } catch (error) {
      await this.refreshFromMicrovm({
        ...record,
        state: 'SUSPENDING',
        updatedAt,
      });
      throw new ControlError(
        502,
        `Unable to suspend MicroVM: ${safeErrorMessage(error)}`,
      );
    }
  }

  public async resume(
    ownerPrincipal: string,
    sessionId: string,
  ): Promise<SessionRecord> {
    const record = await this.get(ownerPrincipal, sessionId);
    if (!record.microvmId) {
      throw new ControlError(409, 'Session has no MicroVM assigned');
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
      { state: 'RESUMING', updatedAt, lastActivityAt: updatedAt },
      ['SUSPENDED'],
    );
    if (!claimed) {
      return (await this.options.repository.get(sessionId)) ?? record;
    }
    try {
      await this.options.microvms.resume(record.microvmId);
      return {
        ...record,
        state: 'RESUMING',
        updatedAt,
        lastActivityAt: updatedAt,
      };
    } catch (error) {
      await this.refreshFromMicrovm({
        ...record,
        state: 'RESUMING',
        updatedAt,
      });
      throw new ControlError(
        502,
        `Unable to resume MicroVM: ${safeErrorMessage(error)}`,
      );
    }
  }

  public async terminate(
    ownerPrincipal: string,
    sessionId: string,
  ): Promise<SessionRecord> {
    const record = await this.getOwned(ownerPrincipal, sessionId);
    if (record.state === 'TERMINATED' || record.state === 'TERMINATING') {
      return record;
    }
    if (!record.microvmId) {
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
    try {
      await this.options.microvms.terminate(record.microvmId);
      return { ...record, state: 'TERMINATING', updatedAt };
    } catch (error) {
      await this.refreshFromMicrovm({
        ...record,
        state: 'TERMINATING',
        updatedAt,
      });
      throw new ControlError(
        502,
        `Unable to terminate MicroVM: ${safeErrorMessage(error)}`,
      );
    }
  }

  public async checkpointUrls(
    sessionId: string,
    microvmId: string,
  ): Promise<WorkspaceCheckpointAccess> {
    const record = await this.options.repository.get(sessionId);
    if (!record || !record.microvmId || record.microvmId !== microvmId) {
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

  public async reconcile(): Promise<{
    reconciled: number;
    failures: number;
  }> {
    const now = this.now();
    const result = { reconciled: 0, failures: 0 };
    const trackedMicrovmIds = new Set<string>();
    for (const state of ACTIVE_STATES) {
      const records = await this.options.repository.listStateUpdatedBefore(
        state,
        now,
      );
      for (const record of records) {
        if (record.microvmId) {
          trackedMicrovmIds.add(record.microvmId);
        }
        if (record.updatedAt > now - RECONCILE_AFTER_SECONDS) {
          continue;
        }
        try {
          if (!record.microvmId) {
            if (
              record.state === 'PROVISIONING' &&
              record.updatedAt <= now - PROVISIONING_TIMEOUT_SECONDS
            ) {
              await this.options.repository.patch(
                record.sessionId,
                {
                  state: 'FAILED',
                  updatedAt: now,
                  failureReason: 'MicroVM provisioning timed out',
                },
                ['PROVISIONING'],
              );
              await this.options.repository.releaseWorkspace(record);
              result.reconciled += 1;
            }
            continue;
          }
          const current = await this.refreshFromMicrovm(record);
          if (await this.redriveStuckTransition(current, now)) {
            result.reconciled += 1;
            continue;
          }
          if (await this.terminateBeforeExpiry(current, now)) {
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
    await this.sweepOrphanedMicrovms(trackedMicrovmIds, now, result);
    return result;
  }

  private async redriveStuckTransition(
    record: SessionRecord,
    now: number,
  ): Promise<boolean> {
    if (
      !record.microvmId ||
      record.updatedAt > now - REDRIVE_AFTER_SECONDS
    ) {
      return false;
    }
    if (record.state === 'TERMINATING') {
      await this.options.microvms.terminate(record.microvmId);
      return true;
    }
    if (record.state === 'SUSPENDING') {
      await this.options.microvms.suspend(record.microvmId);
      return true;
    }
    if (record.state === 'RESUMING') {
      await this.options.microvms.resume(record.microvmId);
      return true;
    }
    return false;
  }

  private async terminateBeforeExpiry(
    record: SessionRecord,
    now: number,
  ): Promise<boolean> {
    if (
      !record.microvmId ||
      !record.microvmExpiresAt ||
      !['RUNNING', 'SUSPENDED', 'STARTING'].includes(record.state) ||
      record.microvmExpiresAt - now > this.expirationLeadSeconds
    ) {
      return false;
    }
    const claimed = await this.options.repository.patch(
      record.sessionId,
      {
        state: 'TERMINATING',
        updatedAt: now,
        failureReason:
          'Checkpoint-terminated before the MicroVM duration limit',
      },
      [record.state],
    );
    if (!claimed) {
      return false;
    }
    await this.options.microvms.terminate(record.microvmId);
    return true;
  }

  private async sweepOrphanedMicrovms(
    trackedMicrovmIds: Set<string>,
    now: number,
    result: { reconciled: number; failures: number },
  ): Promise<void> {
    let imageArn: string;
    try {
      imageArn = (await this.options.loadConfiguration()).imageArn;
    } catch {
      return;
    }
    let microvms;
    try {
      microvms = await this.options.microvms.listForImage(imageArn);
    } catch (error) {
      result.failures += 1;
      console.error('orphaned MicroVM sweep failed', {
        error: safeErrorMessage(error),
      });
      return;
    }
    for (const microvm of microvms) {
      if (
        trackedMicrovmIds.has(microvm.microvmId) ||
        !['PENDING', 'RUNNING', 'SUSPENDING', 'SUSPENDED'].includes(
          microvm.state.toUpperCase(),
        ) ||
        microvm.startedAt === undefined ||
        microvm.startedAt > now - ORPHAN_GRACE_SECONDS
      ) {
        continue;
      }
      try {
        await this.options.microvms.terminate(microvm.microvmId);
        result.reconciled += 1;
        console.error('terminated orphaned MicroVM', {
          microvmId: microvm.microvmId,
        });
      } catch (error) {
        result.failures += 1;
        console.error('orphaned MicroVM termination failed', {
          microvmId: microvm.microvmId,
          error: safeErrorMessage(error),
        });
      }
    }
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

  private async waitForRunning(
    record: SessionRecord,
  ): Promise<MicrovmDescription> {
    if (!record.microvmId) {
      throw new ControlError(409, 'Session has no MicroVM assigned');
    }
    let resumeRequested = false;
    for (let attempt = 0; attempt < CONNECT_ATTEMPTS; attempt += 1) {
      const description = await this.options.microvms.get(record.microvmId);
      const state = normalizeMicrovmState(description.state);
      if (state === 'RUNNING') {
        return description;
      }
      if (state === 'SUSPENDED' && !resumeRequested) {
        await this.options.microvms.resume(record.microvmId);
        resumeRequested = true;
        await this.options.repository.patch(
          record.sessionId,
          {
            state: 'RESUMING',
            updatedAt: this.now(),
            lastActivityAt: this.now(),
          },
          ['SUSPENDED'],
        );
      } else if (
        !['STARTING', 'RESUMING', 'SUSPENDING', 'SUSPENDED'].includes(
          state,
        )
      ) {
        await this.refreshFromMicrovm(record);
        throw new ControlError(
          409,
          `Cannot connect to a session in ${state} state`,
        );
      }
      await this.delay(CONNECT_RETRY_MILLISECONDS);
    }
    throw new ControlError(
      503,
      'MicroVM is still starting; retry the connection',
    );
  }

  private async refreshFromMicrovm(
    record: SessionRecord,
  ): Promise<SessionRecord> {
    if (!record.microvmId) {
      return record;
    }
    const description = await this.options.microvms.get(record.microvmId);
    const state = normalizeMicrovmState(description.state);
    if (
      (record.state === 'SUSPENDING' && state === 'RUNNING') ||
      (record.state === 'RESUMING' &&
        ['SUSPENDED', 'STARTING'].includes(state)) ||
      (record.state === 'TERMINATING' &&
        ['RUNNING', 'SUSPENDING', 'SUSPENDED'].includes(state))
    ) {
      return record;
    }

    const patch: Partial<SessionRecord> = {
      state,
      updatedAt: this.now(),
      microvmEndpoint:
        description.endpoint ?? record.microvmEndpoint,
      failureReason: description.stateReason ?? '',
    };
    if (
      description.startedAt !== undefined &&
      description.maximumDurationInSeconds !== undefined
    ) {
      patch.microvmStartedAt = description.startedAt;
      patch.microvmExpiresAt =
        description.startedAt + description.maximumDurationInSeconds;
    }
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

  private assertOwner(
    record: SessionRecord,
    ownerPrincipal: string,
  ): void {
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

export function normalizeMicrovmState(state: string): SessionState {
  switch (state.toUpperCase()) {
    case 'PENDING':
      return 'STARTING';
    case 'RUNNING':
      return 'RUNNING';
    case 'SUSPENDING':
      return 'SUSPENDING';
    case 'SUSPENDED':
      return 'SUSPENDED';
    case 'RESUMING':
      return 'RESUMING';
    case 'TERMINATING':
      return 'TERMINATING';
    case 'TERMINATED':
      return 'TERMINATED';
    case 'FAILED':
      return 'FAILED';
    default:
      throw new Error(`Unsupported MicroVM state: ${state}`);
  }
}

function isActive(state: SessionState): boolean {
  return ACTIVE_STATES.includes(
    state as (typeof ACTIVE_STATES)[number],
  );
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
    gzipSync(Buffer.from(decoded, 'utf8'), { level: 9 }).toString(
      'base64',
    );
  if (
    Buffer.byteLength(encoded, 'utf8') >
    MAX_RUN_HOOK_PAYLOAD_BYTES
  ) {
    throw new Error(
      'Compressed run hook payload exceeds the 4 KiB service limit',
    );
  }
  return encoded;
}

export function sessionTunnelName(
  ownerHash: string,
  workspaceId: string,
  sessionId: string,
): string {
  const suffix = createHash('sha256')
    .update(`${ownerHash}:${workspaceId}:${sessionId}`)
    .digest('hex')
    .slice(0, 17);
  return `cm-${suffix}`;
}

function assertSessionOptions(
  record: SessionRecord,
  accessMode: AccessMode,
  inferenceMode: InferenceMode,
  deploymentInferenceMode: InferenceMode,
): void {
  const currentAccessMode = record.accessMode ?? 'terminal';
  const currentInferenceMode =
    record.inferenceMode ?? deploymentInferenceMode;
  if (
    currentAccessMode !== accessMode ||
    currentInferenceMode !== inferenceMode
  ) {
    throw new ControlError(
      409,
      'The workspace already has an active session with a different ' +
        'access mode or Claude provider; terminate it before switching',
    );
  }
}
