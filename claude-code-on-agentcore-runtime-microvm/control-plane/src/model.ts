export const ACTIVE_STATES = [
  'PROVISIONING',
  'STARTING',
  'RUNNING',
  'SUSPENDING',
  'SUSPENDED',
  'RESUMING',
  'TERMINATING',
] as const;

export type SessionState =
  | (typeof ACTIVE_STATES)[number]
  | 'TERMINATED'
  | 'FAILED';

export type InferenceMode =
  | 'claude-gateway'
  | 'bedrock'
  | 'claude-ai';

export type AccessMode = 'terminal' | 'vscode';

export type TunnelIdentityProvider = 'microsoft' | 'github';

export interface SessionRecord {
  sessionId: string;
  ownerHash: string;
  workspaceId: string;
  state: SessionState;
  createdAt: number;
  updatedAt: number;
  lastActivityAt: number;
  expiresAt: number;
  // AgentCore Runtime identifiers. `runtimeSessionId` is the data-plane
  // session id passed to InvokeAgentRuntime* calls; it must be >= 33
  // characters, so it is distinct from our own `sessionId` (a UUID we
  // control end to end for DynamoDB keys and ownership checks).
  runtimeArn?: string;
  runtimeSessionId?: string;
  shellId?: string;
  agentRuntimeEndpoint?: string;
  runtimeVersion?: string;
  runtimeStartedAt?: number;
  runtimeExpiresAt?: number;
  failureReason?: string;
  inferenceMode?: InferenceMode;
  accessMode?: AccessMode;
  tunnelName?: string;
  tunnelProvider?: TunnelIdentityProvider;
}

export interface StartConfiguration {
  region: string;
  partition: string;
  agentRuntimeArn: string;
  executionRoleArn: string;
  logGroup: string;
  inferenceMode: InferenceMode;
  allowClaudeAiSubscription?: boolean;
  claudeGatewayUrl?: string;
  bedrockModelId?: string;
  agentCoreGatewayUrl?: string;
  controlApiUrl?: string;
  idleAfterSeconds: number;
  suspendedRetentionSeconds: number;
}

export interface RunResult {
  runtimeSessionId: string;
  state: string;
  startedAt: number;
  maximumDurationInSeconds: number;
  runtimeVersion?: string;
}

export interface RuntimeSessionDescription {
  runtimeSessionId: string;
  state: string;
  stateReason?: string;
  maximumDurationInSeconds?: number;
  startedAt?: number;
}

export interface ShellConnection {
  /**
   * The InvokeAgentRuntimeCommandShell WebSocket endpoint. The client
   * must reconnect with the same `runtimeSessionId`/`shellId` pair
   * before the 1-hour connection-duration limit expires (see the
   * AgentCore Runtime interactive-shell quotas).
   */
  endpoint: string;
  runtimeSessionId: string;
  shellId: string;
  authToken: string;
  expiresAt: number;
}

export interface WorkspaceCheckpointAccess {
  downloadUrl?: string;
  uploadUrl: string;
}

export type CreateSessionResult =
  | { created: true }
  | { created: false; record: SessionRecord };

export interface WorkspaceClaim {
  workspaceKey: string;
  sessionId: string;
  ownerHash: string;
  workspaceId: string;
  expiresAt: number;
}

export interface SessionRepository {
  get(sessionId: string): Promise<SessionRecord | undefined>;
  create(record: SessionRecord): Promise<CreateSessionResult>;
  releaseWorkspace(record: SessionRecord): Promise<void>;
  listForOwner(ownerHash: string): Promise<SessionRecord[]>;
  listStateUpdatedBefore(
    state: SessionState,
    updatedBefore: number,
  ): Promise<SessionRecord[]>;
  patch(
    sessionId: string,
    values: Partial<SessionRecord>,
    expectedStates?: SessionState[],
  ): Promise<boolean>;
}

/**
 * Adapter over the AgentCore Runtime control- and data-plane APIs.
 * `run` starts a new runtime *session* against the already-deployed
 * agent runtime (the CfnRuntime resource created once by CDK); it does
 * not create a new runtime per developer. Session lifecycle
 * (suspend/resume/terminate) is emulated with lifecycle signals sent
 * over the shell channel plus session bookkeeping, because AgentCore
 * Runtime microVM sessions do not have first-class suspend/resume
 * control-plane APIs the way Lambda MicroVMs do -- see
 * docs/deployment-guide.md for the mapping this sample uses.
 */
export interface AgentRuntimeService {
  run(input: {
    agentRuntimeArn: string;
    runtimeSessionId: string;
    executionRoleArn: string;
    payload: string;
    clientToken: string;
  }): Promise<RunResult>;
  get(
    agentRuntimeArn: string,
    runtimeSessionId: string,
  ): Promise<RuntimeSessionDescription>;
  createShellConnection(
    agentRuntimeArn: string,
    runtimeSessionId: string,
    shellId: string,
  ): Promise<ShellConnection>;
  suspend(runtimeSessionId: string): Promise<void>;
  resume(agentRuntimeArn: string, runtimeSessionId: string): Promise<void>;
  terminate(agentRuntimeArn: string, runtimeSessionId: string): Promise<void>;
}

export interface WorkspaceCheckpointService {
  createAccess(
    ownerHash: string,
    workspaceId: string,
  ): Promise<WorkspaceCheckpointAccess>;
}
