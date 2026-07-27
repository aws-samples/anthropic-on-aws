import {
  CreateMicrovmShellAuthTokenCommand,
  GetMicrovmCommand,
  LambdaMicrovmsClient,
  ListMicrovmsCommand,
  ResumeMicrovmCommand,
  RunMicrovmCommand,
  SuspendMicrovmCommand,
  TerminateMicrovmCommand,
} from '@aws-sdk/client-lambda-microvms';
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
  CreateSessionResult,
  MicrovmDescription,
  MicrovmListItem,
  MicrovmService,
  RunResult,
  SessionRecord,
  SessionRepository,
  SessionState,
  WorkspaceCheckpointAccess,
  WorkspaceCheckpointService,
  WorkspaceClaim,
} from './model.js';
import { ACTIVE_STATES } from './model.js';

const CLAIM_ATTEMPTS = 5;
const CHECKPOINT_URL_TTL_SECONDS = 10 * 60 * 60;

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
    throw new Error('Workspace is being started concurrently; retry the request');
  }

  public async releaseWorkspace(record: SessionRecord): Promise<void> {
    try {
      await this.client.send(
        new DeleteCommand({
          TableName: this.claimTableName,
          Key: { workspaceKey: claimKey(record.ownerHash, record.workspaceId) },
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

export class AwsMicrovmService implements MicrovmService {
  public constructor(private readonly client: LambdaMicrovmsClient) {}

  public async run(input: {
    imageArn: string;
    egressArns: string[];
    ingressArn: string;
    executionRoleArn: string;
    logGroup: string;
    payload: string;
    clientToken: string;
    idleAfterSeconds?: number;
    suspendedRetentionSeconds: number;
  }): Promise<RunResult> {
    const response = await this.client.send(
      new RunMicrovmCommand({
        imageIdentifier: input.imageArn,
        ingressNetworkConnectors: [input.ingressArn],
        egressNetworkConnectors: input.egressArns,
        executionRoleArn: input.executionRoleArn,
        ...(input.idleAfterSeconds === undefined
          ? {}
          : {
              idlePolicy: {
                autoResumeEnabled: true,
                maxIdleDurationSeconds: input.idleAfterSeconds,
                suspendedDurationSeconds:
                  input.suspendedRetentionSeconds,
              },
            }),
        logging: {
          cloudWatch: {
            logGroup: input.logGroup,
          },
        },
        runHookPayload: input.payload,
        maximumDurationInSeconds: 28_800,
        clientToken: input.clientToken,
      }),
    );
    if (
      !response.microvmId ||
      !response.state ||
      !response.endpoint ||
      !response.imageArn ||
      !response.imageVersion ||
      !response.startedAt ||
      !response.maximumDurationInSeconds
    ) {
      throw new Error('RunMicrovm returned an incomplete response');
    }
    return {
      microvmId: response.microvmId,
      state: response.state,
      endpoint: response.endpoint,
      imageArn: response.imageArn,
      imageVersion: response.imageVersion,
      maximumDurationInSeconds: response.maximumDurationInSeconds,
      startedAt: epochSeconds(response.startedAt),
    };
  }

  public async get(microvmId: string): Promise<MicrovmDescription> {
    let response;
    try {
      response = await this.client.send(
        new GetMicrovmCommand({ microvmIdentifier: microvmId }),
      );
    } catch (error) {
      if (isNotFound(error)) {
        return {
          microvmId,
          state: 'TERMINATED',
          stateReason: 'MicroVM no longer exists',
        };
      }
      throw error;
    }
    if (!response.microvmId || !response.state) {
      throw new Error('GetMicrovm returned an incomplete response');
    }
    return {
      microvmId: response.microvmId,
      state: response.state,
      endpoint: response.endpoint,
      stateReason: response.stateReason,
      maximumDurationInSeconds: response.maximumDurationInSeconds,
      startedAt: response.startedAt
        ? epochSeconds(response.startedAt)
        : undefined,
    };
  }

  public async listForImage(
    imageArn: string,
  ): Promise<MicrovmListItem[]> {
    const items: MicrovmListItem[] = [];
    let nextToken: string | undefined;
    do {
      const response = await this.client.send(
        new ListMicrovmsCommand({
          imageIdentifier: imageArn,
          nextToken,
        }),
      );
      for (const item of response.items ?? []) {
        if (!item.microvmId || !item.state) {
          continue;
        }
        items.push({
          microvmId: item.microvmId,
          state: item.state,
          startedAt: item.startedAt
            ? epochSeconds(item.startedAt)
            : undefined,
        });
      }
      nextToken = response.nextToken;
    } while (nextToken);
    return items;
  }

  public async createShellConnection(
    microvmId: string,
    expirationInMinutes: number,
  ): Promise<{
    endpoint: string;
    authToken: string;
    expiresAt: number;
  }> {
    const description = await this.get(microvmId);
    if (!description.endpoint) {
      throw new Error('MicroVM has no shell endpoint');
    }
    const response = await this.client.send(
      new CreateMicrovmShellAuthTokenCommand({
        microvmIdentifier: microvmId,
        expirationInMinutes,
      }),
    );
    const authToken = response.authToken?.['X-aws-proxy-auth'];
    if (!authToken) {
      throw new Error(
        'CreateMicrovmShellAuthToken returned no X-aws-proxy-auth token',
      );
    }
    return {
      endpoint: description.endpoint,
      authToken,
      expiresAt:
        Math.floor(Date.now() / 1_000) + expirationInMinutes * 60,
    };
  }

  public async suspend(microvmId: string): Promise<void> {
    await this.client.send(
      new SuspendMicrovmCommand({ microvmIdentifier: microvmId }),
    );
  }

  public async resume(microvmId: string): Promise<void> {
    await this.client.send(
      new ResumeMicrovmCommand({ microvmIdentifier: microvmId }),
    );
  }

  public async terminate(microvmId: string): Promise<void> {
    await this.client.send(
      new TerminateMicrovmCommand({ microvmIdentifier: microvmId }),
    );
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
            new GetObjectCommand({
              Bucket: this.bucketName,
              Key: key,
            }),
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
        new HeadObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
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
    ['TransactionCanceledException', 'ConditionalCheckFailedException'].includes(
      error.name,
    )
  );
}

function isNotFound(error: unknown): boolean {
  return (
    error instanceof Error &&
    ['ResourceNotFoundException', 'NoSuchKey', 'NotFoundException'].includes(
      error.name,
    )
  );
}

function epochSeconds(value: Date): number {
  const milliseconds = value.getTime();
  if (!Number.isFinite(milliseconds)) {
    throw new Error('MicroVM service returned an invalid timestamp');
  }
  return Math.floor(milliseconds / 1_000);
}
