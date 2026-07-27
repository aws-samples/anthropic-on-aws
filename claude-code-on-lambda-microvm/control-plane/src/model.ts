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
  microvmId?: string;
  microvmEndpoint?: string;
  imageArn?: string;
  imageVersion?: string;
  microvmStartedAt?: number;
  microvmExpiresAt?: number;
  failureReason?: string;
  inferenceMode?: InferenceMode;
  accessMode?: AccessMode;
  tunnelName?: string;
  tunnelProvider?: TunnelIdentityProvider;
}

export interface StartConfiguration {
  region: string;
  partition: string;
  imageArn: string;
  connectorArn: string;
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
  microvmId: string;
  state: string;
  endpoint: string;
  imageArn: string;
  imageVersion: string;
  maximumDurationInSeconds: number;
  startedAt: number;
}

export interface MicrovmDescription {
  microvmId: string;
  state: string;
  endpoint?: string;
  stateReason?: string;
  maximumDurationInSeconds?: number;
  startedAt?: number;
}

export interface MicrovmListItem {
  microvmId: string;
  state: string;
  startedAt?: number;
}

export interface ShellConnection {
  endpoint: string;
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

export interface MicrovmService {
  run(input: {
    imageArn: string;
    egressArns: string[];
    ingressArn: string;
    executionRoleArn: string;
    logGroup: string;
    payload: string;
    clientToken: string;
    idleAfterSeconds?: number;
    suspendedRetentionSeconds: number;
  }): Promise<RunResult>;
  get(microvmId: string): Promise<MicrovmDescription>;
  listForImage(imageArn: string): Promise<MicrovmListItem[]>;
  createShellConnection(
    microvmId: string,
    expirationInMinutes: number,
  ): Promise<ShellConnection>;
  suspend(microvmId: string): Promise<void>;
  resume(microvmId: string): Promise<void>;
  terminate(microvmId: string): Promise<void>;
}

export interface WorkspaceCheckpointService {
  createAccess(
    ownerHash: string,
    workspaceId: string,
  ): Promise<WorkspaceCheckpointAccess>;
}
