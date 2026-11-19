import {
  BedrockAgentCoreClient,
  InvokeAgentRuntimeCommand,
  InvokeAgentRuntimeCommandCommand,
  StopRuntimeSessionCommand,
} from '@aws-sdk/client-bedrock-agentcore';
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  type S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
  TransactWriteCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import type {
  AgentRuntimeService,
  CreateSessionResult,
  RunResult,
  RuntimeSessionDescription,
  SessionRecord,
  SessionRepository,
  SessionState,
  ShellConnection,
  WorkspaceCheckpointAccess,
  WorkspaceCheckpointService,
  WorkspaceClaim,
  WorkspaceInfo,
} from './model.js';
import { ACTIVE_STATES } from './model.js';

const CLAIM_ATTEMPTS = 5;
const CHECKPOINT_URL_TTL_SECONDS = 10 * 60 * 60;
const RUNTIME_SESSION_MAX_DURATION_SECONDS = 28_800;
// InvokeAgentRuntimeCommandShell session IDs must be >= 33 characters (see
// AWS docs: "the session ID is less than 33 characters" is a documented
// ValidationException cause). A UUID (36 chars) already satisfies this, so
// we reuse the control-plane sessionId directly rather than minting a
// second identifier.
const MIN_RUNTIME_SESSION_ID_LENGTH = 33;

export class DynamoSessionRepository implements SessionRepository {
  public constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly tableName: string,
    private readonly claimTableName: string,
  ) {}

  public async get(sessionId: string): Promise<SessionRecord | undefined> {
    const response = await this.client.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { sessionId },
        ConsistentRead: true,
      }),
    );
    return response.Item as SessionRecord | undefined;
  }

  public async create(record: SessionRecord): Promise<CreateSessionResult> {
    const workspaceKey = claimKey(record.ownerHash, record.workspaceId);
    for (let attempt = 0; attempt < CLAIM_ATTEMPTS; attempt += 1) {
      const claim = await this.getClaim(workspaceKey);
      if (claim) {
        const existing = await this.get(claim.sessionId);
        if (
          existing &&
          existing.ownerHash === record.ownerHash &&
          existing.workspaceId === record.workspaceId &&
          ACTIVE_STATES.includes(
            existing.state as (typeof ACTIVE_STATES)[number],
          )
        ) {
          return { created: false, record: existing };
        }
      }

      try {
        await this.client.send(
          new TransactWriteCommand({
            TransactItems: [
              {
                Put: {
                  TableName: this.tableName,
                  Item: record,
                  ConditionExpression: 'attribute_not_exists(sessionId)',
                },
              },
              {
                Put: {
                  TableName: this.claimTableName,
                  Item: {
                    workspaceKey,
                    sessionId: record.sessionId,
                    ownerHash: record.ownerHash,
                    workspaceId: record.workspaceId,
                    expiresAt: record.expiresAt,
                  } satisfies WorkspaceClaim,
                  ConditionExpression: claim
                    ? 'sessionId = :claimedSessionId'
                    : 'attribute_not_exists(workspaceKey)',
                  ExpressionAttributeValues: claim
                    ? { ':claimedSessionId': claim.sessionId }
                    : undefined,
                },
              },
            ],
          }),
        );
        return { created: true };
      } catch (error) {
        if (!isTransactionConflict(error)) {
          throw error;
        }
      }
    }
    throw new Error(
      'Workspace is being started concurrently; retry the request',
    );
  }

  public async releaseWorkspace(record: SessionRecord): Promise<void> {
    try {
      await this.client.send(
        new DeleteCommand({
          TableName: this.claimTableName,
          Key: {
            workspaceKey: claimKey(record.ownerHash, record.workspaceId),
          },
          ConditionExpression: 'sessionId = :sessionId',
          ExpressionAttributeValues: { ':sessionId': record.sessionId },
        }),
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === 'ConditionalCheckFailedException'
      ) {
        return;
      }
      throw error;
    }
  }

  public async listForOwner(ownerHash: string): Promise<SessionRecord[]> {
    const items: SessionRecord[] = [];
    let exclusiveStartKey: Record<string, unknown> | undefined;
    do {
      const response = await this.client.send(
        new QueryCommand({
          TableName: this.tableName,
          IndexName: 'owner-updated-index',
          KeyConditionExpression: 'ownerHash = :owner',
          ExpressionAttributeValues: { ':owner': ownerHash },
          ScanIndexForward: false,
          ExclusiveStartKey: exclusiveStartKey,
        }),
      );
      items.push(...((response.Items ?? []) as SessionRecord[]));
      exclusiveStartKey = response.LastEvaluatedKey;
    } while (exclusiveStartKey);
    return items;
  }

  public async listStateUpdatedBefore(
    state: SessionState,
    updatedBefore: number,
  ): Promise<SessionRecord[]> {
    const items: SessionRecord[] = [];
    let exclusiveStartKey: Record<string, unknown> | undefined;
    do {
      const response = await this.client.send(
        new QueryCommand({
          TableName: this.tableName,
          IndexName: 'state-updated-index',
          KeyConditionExpression:
            '#state = :state AND updatedAt <= :updatedBefore',
          ExpressionAttributeNames: { '#state': 'state' },
          ExpressionAttributeValues: {
            ':state': state,
            ':updatedBefore': updatedBefore,
          },
          ExclusiveStartKey: exclusiveStartKey,
        }),
      );
      items.push(...((response.Items ?? []) as SessionRecord[]));
      exclusiveStartKey = response.LastEvaluatedKey;
    } while (exclusiveStartKey);
    return items;
  }

  public async patch(
    sessionId: string,
    values: Partial<SessionRecord>,
    expectedStates?: SessionState[],
  ): Promise<boolean> {
    const entries = Object.entries(values).filter(
      ([key, value]) => key !== 'sessionId' && value !== undefined,
    );
    if (entries.length === 0) {
      return true;
    }

    const names: Record<string, string> = {};
    const expressionValues: Record<string, unknown> = {};
    const assignments = entries.map(([key, value], index) => {
      const name = `#field${index}`;
      const valueName = `:value${index}`;
      names[name] = key;
      expressionValues[valueName] = value;
      return `${name} = ${valueName}`;
    });

    let conditionExpression: string | undefined;
    if (expectedStates && expectedStates.length > 0) {
      names['#currentState'] = 'state';
      const stateNames = expectedStates.map((state, index) => {
        const valueName = `:expectedState${index}`;
        expressionValues[valueName] = state;
        return valueName;
      });
      conditionExpression = `#currentState IN (${stateNames.join(', ')})`;
    }

    try {
      await this.client.send(
        new UpdateCommand({
          TableName: this.tableName,
          Key: { sessionId },
          UpdateExpression: `SET ${assignments.join(', ')}`,
          ConditionExpression: conditionExpression,
          ExpressionAttributeNames: names,
          ExpressionAttributeValues: expressionValues,
        }),
      );
      return true;
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === 'ConditionalCheckFailedException'
      ) {
        return false;
      }
      throw error;
    }
  }

  private async getClaim(
    workspaceKey: string,
  ): Promise<WorkspaceClaim | undefined> {
    const response = await this.client.send(
      new GetCommand({
        TableName: this.claimTableName,
        Key: { workspaceKey },
        ConsistentRead: true,
      }),
    );
    return response.Item as WorkspaceClaim | undefined;
  }
}

/**
 * Adapter over the AgentCore Runtime data-plane SDK (`InvokeAgentRuntime*`).
 *
 * Unlike Lambda MicroVMs, AgentCore Runtime has no `RunMicrovm`/
 * `GetMicrovm`/`SuspendMicrovm` control-plane API per session, and no
 * `ListSessions`/`GetSession` data-plane API either (`ListSessions` in the
 * SDK is an AgentCore *Memory* API, unrelated to runtime sessions). This
 * adapter emulates the richer Lambda MicroVM lifecycle (`run`/`suspend`/
 * `resume`/`terminate`) on top of that narrower surface:
 *
 * - `run` performs a lightweight `InvokeAgentRuntimeCommand` (a fast no-op
 *   shell command) against a fresh `runtimeSessionId` to force the
 *   AgentCore Runtime service to provision a microVM for that session, and
 *   records session metadata for later shell connections.
 * - `get` has no direct "describe session" API to call; it re-probes
 *   liveness with another fast `InvokeAgentRuntimeCommand` and maps a
 *   `ResourceNotFoundException`/`ValidationException` response to
 *   `TERMINATED`. This does issue a real (cheap) command invocation on
 *   every reconciler tick -- documented as a known cost trade-off in
 *   docs/deployment-guide.md pending a first-class AgentCore Runtime
 *   session-describe API.
 * - `suspend` has no direct AgentCore Runtime equivalent; the container's
 *   own agent (agent-runtime/agent.py) checkpoints the workspace to S3 when
 *   it receives a `suspend` command through `/invocations`, and the control
 *   service tracks `SUSPENDED` purely as in-app state. The underlying
 *   session keeps running until `terminate` or the 8h max lifetime elapses.
 * - `resume` re-validates the session is still reachable via `get`.
 * - `terminate` calls `StopRuntimeSession`.
 */
export class AwsAgentRuntimeService implements AgentRuntimeService {
  public constructor(private readonly client: BedrockAgentCoreClient) {}

  public async run(input: {
    agentRuntimeArn: string;
    runtimeSessionId: string;
    executionRoleArn: string;
    payload: string;
    clientToken: string;
  }): Promise<RunResult> {
    if (input.runtimeSessionId.length < MIN_RUNTIME_SESSION_ID_LENGTH) {
      throw new Error(
        `runtimeSessionId must be at least ${MIN_RUNTIME_SESSION_ID_LENGTH} characters`,
      );
    }
    const startedAt = Math.floor(Date.now() / 1_000);
    // This must be a real /invocations POST (InvokeAgentRuntimeCommand,
    // the *data-plane* "invoke the agent" API) carrying the
    // `{"command":"bootstrap","payload":...}` JSON body that
    // agent.py's HookHandler.do_POST expects. It is easy to confuse this
    // with InvokeAgentRuntimeCommandCommand (the *shell-exec* API used by
    // `get()` below for liveness probing, which runs an arbitrary shell
    // command via a PTY-less exec channel and never reaches the
    // /invocations HTTP handler at all). Sending the bootstrap payload
    // through the shell-exec API -- as this code previously did, via a
    // fictional `/opt/claude-agentcore/session-bootstrap.sh` script that
    // the Dockerfile never installs -- means `Runtime.bootstrap()` in
    // agent.py never runs: /workspace is never restored and
    // /var/lib/claude-agentcore/session.json is never written, so every
    // later shell connection fails with "Session configuration is
    // unavailable".
    await invokeLifecycleCommand(this.client, {
      agentRuntimeArn: input.agentRuntimeArn,
      runtimeSessionId: input.runtimeSessionId,
      command: 'bootstrap',
      payload: input.payload,
    });
    return {
      runtimeSessionId: input.runtimeSessionId,
      state: 'RUNNING',
      startedAt,
      maximumDurationInSeconds: RUNTIME_SESSION_MAX_DURATION_SECONDS,
    };
  }

  public async get(
    agentRuntimeArn: string,
    runtimeSessionId: string,
  ): Promise<RuntimeSessionDescription> {
    try {
      await this.client.send(
        new InvokeAgentRuntimeCommandCommand({
          agentRuntimeArn,
          runtimeSessionId,
          contentType: 'application/json',
          accept: 'application/json',
          body: { command: 'true', timeout: 5 },
        }),
      );
      return {
        runtimeSessionId,
        state: 'RUNNING',
        maximumDurationInSeconds: RUNTIME_SESSION_MAX_DURATION_SECONDS,
      };
    } catch (error) {
      if (isNotFound(error)) {
        return { runtimeSessionId, state: 'TERMINATED' };
      }
      throw error;
    }
  }

  public async createShellConnection(
    agentRuntimeArn: string,
    runtimeSessionId: string,
    shellId: string,
  ): Promise<ShellConnection> {
    // Real AgentCore Runtime interactive-shell WebSocket contract (verified
    // against the bedrock-agentcore Python SDK's AgentCoreRuntimeClient.
    // connect_shell / _build_shell_url):
    //   host: bedrock-agentcore.<region>.amazonaws.com
    //   path: /runtimes/<url-encoded-arn>/ws/shells
    //   query: shellId=<shellId>
    //   the runtime session id is NOT a query param -- it is sent as the
    //   signed header X-Amzn-Bedrock-AgentCore-Runtime-Session-Id on the
    //   WebSocket upgrade request (see client/src/terminal.ts, which signs
    //   the request with SigV4 including that header).
    const region = this.regionOf(agentRuntimeArn);
    const endpoint =
      `wss://bedrock-agentcore.${region}.amazonaws.com/runtimes/` +
      `${encodeURIComponent(agentRuntimeArn)}/ws/shells?shellId=` +
      `${encodeURIComponent(shellId)}`;
    return {
      endpoint,
      runtimeSessionId,
      shellId,
      authToken: '',
      expiresAt: Math.floor(Date.now() / 1_000) + 60 * 60,
    };
  }

  public async suspend(
    agentRuntimeArn: string,
    runtimeSessionId: string,
  ): Promise<void> {
    // No control-plane suspend primitive; see class doc comment. What we
    // *can* do -- and previously did not -- is tell the in-container
    // agent to checkpoint the workspace to S3 right now, via the same
    // `/invocations` "suspend" command `Runtime.checkpoint()` in
    // agent.py already knows how to handle. Without this call `suspend`
    // was a pure no-op: the control service flipped its own DynamoDB
    // record to SUSPENDED while the container never wrote a checkpoint,
    // so a later `resume` had nothing real to resume into.
    await invokeLifecycleCommand(this.client, {
      agentRuntimeArn,
      runtimeSessionId,
      command: 'suspend',
    });
  }

  public async resume(
    agentRuntimeArn: string,
    runtimeSessionId: string,
  ): Promise<void> {
    const description = await this.get(agentRuntimeArn, runtimeSessionId);
    if (description.state === 'TERMINATED') {
      throw new Error('Cannot resume a terminated AgentCore Runtime session');
    }
  }

  public async terminate(
    agentRuntimeArn: string,
    runtimeSessionId: string,
  ): Promise<void> {
    // Checkpoint before stopping the runtime session, same rationale as
    // `suspend` above: previously this called StopRuntimeSession directly
    // with no prior checkpoint command, so the workspace was discarded on
    // every terminate. A checkpoint failure here (for example, the
    // container already gone, or a transient network error) must not
    // block termination -- the microVM still needs to be stopped so the
    // session does not keep running (and billing) until the 8h max
    // duration elapses. We log and continue rather than throw.
    try {
      await invokeLifecycleCommand(this.client, {
        agentRuntimeArn,
        runtimeSessionId,
        command: 'terminate',
      });
    } catch (error) {
      console.error('workspace checkpoint before termination failed', {
        runtimeSessionId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    try {
      await this.client.send(
        new StopRuntimeSessionCommand({ agentRuntimeArn, runtimeSessionId }),
      );
    } catch (error) {
      if (!isNotFound(error)) {
        throw error;
      }
    }
  }

  private regionOf(arn: string): string {
    const parts = arn.split(':');
    const region = parts[3];
    if (!region) {
      throw new Error(`Unable to parse region from ARN: ${arn}`);
    }
    return region;
  }
}

export class S3WorkspaceCheckpointService
  implements WorkspaceCheckpointService
{
  public constructor(
    private readonly client: S3Client,
    private readonly bucketName: string,
    private readonly expiresIn = CHECKPOINT_URL_TTL_SECONDS,
  ) {}

  public async createAccess(
    ownerHash: string,
    workspaceId: string,
  ): Promise<WorkspaceCheckpointAccess> {
    const key = workspaceCheckpointKey(ownerHash, workspaceId);
    const exists = await this.exists(key);
    const [downloadUrl, uploadUrl] = await Promise.all([
      exists
        ? getSignedUrl(
            this.client,
            new GetObjectCommand({ Bucket: this.bucketName, Key: key }),
            { expiresIn: this.expiresIn },
          )
        : undefined,
      getSignedUrl(
        this.client,
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          ContentType: 'application/gzip',
        }),
        { expiresIn: this.expiresIn },
      ),
    ]);
    return { downloadUrl, uploadUrl };
  }

  public async getInfo(
    ownerHash: string,
    workspaceId: string,
  ): Promise<WorkspaceInfo> {
    const key = workspaceCheckpointKey(ownerHash, workspaceId);
    const head = await this.head(key);
    if (!head) {
      return { exists: false };
    }
    const downloadUrl = await getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucketName, Key: key }),
      { expiresIn: this.expiresIn },
    );
    return {
      exists: true,
      sizeBytes: head.ContentLength,
      lastModifiedAt: head.LastModified
        ? Math.floor(head.LastModified.getTime() / 1000)
        : undefined,
      downloadUrl,
    };
  }

  private async exists(key: string): Promise<boolean> {
    return (await this.head(key)) !== undefined;
  }

  private async head(
    key: string,
  ): Promise<{ ContentLength?: number; LastModified?: Date } | undefined> {
    try {
      const result = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucketName, Key: key }),
      );
      return {
        ContentLength: result.ContentLength,
        LastModified: result.LastModified,
      };
    } catch (error) {
      if (
        isNotFound(error) ||
        (error instanceof Error && error.name === 'NotFound')
      ) {
        return undefined;
      }
      throw error;
    }
  }
}

export function workspaceCheckpointKey(
  ownerHash: string,
  workspaceId: string,
): string {
  return `workspaces/${ownerHash}/${encodeURIComponent(
    workspaceId,
  )}/checkpoint.tar.gz`;
}

function claimKey(ownerHash: string, workspaceId: string): string {
  return `${ownerHash}#${workspaceId}`;
}

/**
 * Sends a real AgentCore Runtime session-lifecycle command
 * (`bootstrap` | `suspend` | `terminate`) to the container's
 * `/invocations` HTTP endpoint via the `InvokeAgentRuntimeCommand`
 * data-plane API (not the shell-exec `InvokeAgentRuntimeCommandCommand`
 * API), matching the JSON contract `HookHandler.do_POST` implements in
 * agent-runtime/agent.py: request body `{"command": ..., "payload": ...}`,
 * response body `{"status": "success", "response": {...}}` on success or
 * `{"message": ...}` with a non-200 status on failure.
 */
async function invokeLifecycleCommand(
  client: BedrockAgentCoreClient,
  input: {
    agentRuntimeArn: string;
    runtimeSessionId: string;
    command: 'bootstrap' | 'suspend' | 'terminate';
    payload?: string;
  },
): Promise<void> {
  const body: Record<string, unknown> = { command: input.command };
  if (input.payload !== undefined) {
    body.payload = input.payload;
  }
  const response = await client.send(
    new InvokeAgentRuntimeCommand({
      agentRuntimeArn: input.agentRuntimeArn,
      runtimeSessionId: input.runtimeSessionId,
      contentType: 'application/json',
      accept: 'application/json',
      payload: Buffer.from(JSON.stringify(body), 'utf8'),
    }),
  );
  const rawResponse = await response.response?.transformToByteArray();
  const text = rawResponse ? Buffer.from(rawResponse).toString('utf8') : '';
  let parsed: { status?: string; message?: string } = {};
  if (text) {
    try {
      parsed = JSON.parse(text) as { status?: string; message?: string };
    } catch {
      // Leave `parsed` empty; the status/message checks below will treat
      // an unparseable body as a failure.
    }
  }
  if (response.statusCode !== 200 || parsed.status !== 'success') {
    throw new Error(
      `AgentCore Runtime "${input.command}" command failed` +
        (response.statusCode !== undefined
          ? ` (HTTP ${response.statusCode})`
          : '') +
        (parsed.message ? `: ${parsed.message}` : ''),
    );
  }
}

function isTransactionConflict(error: unknown): boolean {
  return (
    error instanceof Error &&
    [
      'TransactionCanceledException',
      'ConditionalCheckFailedException',
    ].includes(error.name)
  );
}

function isNotFound(error: unknown): boolean {
  return (
    error instanceof Error &&
    [
      'ResourceNotFoundException',
      'NoSuchKey',
      'NotFoundException',
    ].includes(error.name)
  );
}
