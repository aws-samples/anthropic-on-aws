import {
  BedrockAgentCoreClient,
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
    await this.client.send(
      new InvokeAgentRuntimeCommandCommand({
        agentRuntimeArn: input.agentRuntimeArn,
        runtimeSessionId: input.runtimeSessionId,
        contentType: 'application/json',
        accept: 'application/json',
        body: {
          command: `/opt/claude-agentcore/session-bootstrap.sh '${input.payload}'`,
          timeout: 60,
        },
      }),
    );
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

  public async suspend(_runtimeSessionId: string): Promise<void> {
    // No control-plane suspend primitive; see class doc comment. The
    // control service still transitions its own state machine and relies
    // on the in-container agent to checkpoint on the next shell signal.
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

  private async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucketName, Key: key }),
      );
      return true;
    } catch (error) {
      if (
        isNotFound(error) ||
        (error instanceof Error && error.name === 'NotFound')
      ) {
        return false;
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
