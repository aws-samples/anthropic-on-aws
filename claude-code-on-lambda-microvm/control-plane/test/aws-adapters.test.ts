import {
  CreateMicrovmShellAuthTokenCommand,
  GetMicrovmCommand,
  type LambdaMicrovmsClient,
  RunMicrovmCommand,
} from '@aws-sdk/client-lambda-microvms';
import {
  HeadObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  DeleteCommand,
  GetCommand,
  QueryCommand,
  TransactWriteCommand,
  UpdateCommand,
  type DynamoDBDocumentClient,
} from '@aws-sdk/lib-dynamodb';
import { describe, expect, it, vi } from 'vitest';
import type { SessionRecord } from '../src/model.js';
import {
  AwsMicrovmService,
  DynamoSessionRepository,
  S3WorkspaceCheckpointService,
  workspaceCheckpointKey,
} from '../src/aws-adapters.js';

const RECORD: SessionRecord = {
  sessionId: 'session-new',
  ownerHash: 'a'.repeat(64),
  workspaceId: 'payments',
  state: 'PROVISIONING',
  createdAt: 1_000,
  updatedAt: 1_000,
  lastActivityAt: 1_000,
  expiresAt: 2_593_000,
};

function repository(
  send: ReturnType<typeof vi.fn>,
): DynamoSessionRepository {
  return new DynamoSessionRepository(
    { send } as unknown as DynamoDBDocumentClient,
    'sessions',
    'workspace-claims',
  );
}

describe('DynamoSessionRepository', () => {
  it('creates the session and workspace claim atomically', async () => {
    const send = vi.fn(async (command: unknown) => {
      if (command instanceof GetCommand) {
        return {};
      }
      if (command instanceof TransactWriteCommand) {
        return {};
      }
      throw new Error('Unexpected command');
    });

    await expect(
      repository(send).create(RECORD),
    ).resolves.toEqual({ created: true });

    const transaction = send.mock.calls
      .map(([command]) => command)
      .find(
        (command) => command instanceof TransactWriteCommand,
      );
    expect(transaction?.input.TransactItems).toEqual([
      {
        Put: expect.objectContaining({
          TableName: 'sessions',
          Item: RECORD,
          ConditionExpression:
            'attribute_not_exists(sessionId)',
        }),
      },
      {
        Put: expect.objectContaining({
          TableName: 'workspace-claims',
          Item: expect.objectContaining({
            sessionId: RECORD.sessionId,
            ownerHash: RECORD.ownerHash,
            workspaceId: RECORD.workspaceId,
          }),
          ConditionExpression:
            'attribute_not_exists(workspaceKey)',
        }),
      },
    ]);
  });

  it('returns the winning active session after a race', async () => {
    let claimReads = 0;
    const existing = {
      ...RECORD,
      sessionId: 'session-existing',
      state: 'STARTING' as const,
    };
    const send = vi.fn(async (command: unknown) => {
      if (command instanceof GetCommand) {
        if (
          command.input.TableName === 'workspace-claims'
        ) {
          claimReads += 1;
          return claimReads === 1
            ? {}
            : {
                Item: {
                  workspaceKey:
                    `${RECORD.ownerHash}#${RECORD.workspaceId}`,
                  sessionId: existing.sessionId,
                  ownerHash: existing.ownerHash,
                  workspaceId: existing.workspaceId,
                  expiresAt: existing.expiresAt,
                },
              };
        }
        return { Item: existing };
      }
      if (command instanceof TransactWriteCommand) {
        const conflict = new Error('transaction lost');
        conflict.name = 'TransactionCanceledException';
        throw conflict;
      }
      throw new Error('Unexpected command');
    });

    await expect(
      repository(send).create(RECORD),
    ).resolves.toEqual({
      created: false,
      record: existing,
    });
  });

  it('queries every page of the owner index in newest-first order', async () => {
    const older = {
      ...RECORD,
      sessionId: 'session-older',
      updatedAt: 900,
    };
    const pageKey = {
      ownerHash: RECORD.ownerHash,
      updatedAt: RECORD.updatedAt,
      sessionId: RECORD.sessionId,
    };
    let page = 0;
    const send = vi.fn(async (command: unknown) => {
      expect(command).toBeInstanceOf(QueryCommand);
      page += 1;
      return page === 1
        ? { Items: [RECORD], LastEvaluatedKey: pageKey }
        : { Items: [older] };
    });

    await expect(
      repository(send).listForOwner(RECORD.ownerHash),
    ).resolves.toEqual([RECORD, older]);

    expect(send).toHaveBeenCalledTimes(2);
    const queries = send.mock.calls.map(
      ([command]) => command as QueryCommand,
    );
    expect(queries[0]?.input).toMatchObject({
      TableName: 'sessions',
      IndexName: 'owner-updated-index',
      KeyConditionExpression: 'ownerHash = :owner',
      ExpressionAttributeValues: {
        ':owner': RECORD.ownerHash,
      },
      ScanIndexForward: false,
    });
    expect(queries[0]?.input.ExclusiveStartKey).toBeUndefined();
    expect(queries[1]?.input.ExclusiveStartKey).toEqual(pageKey);
  });

  it('queries stale state and releases only its claim', async () => {
    const send = vi.fn(async (command: unknown) => {
      if (command instanceof QueryCommand) {
        return { Items: [RECORD] };
      }
      if (command instanceof DeleteCommand) {
        return {};
      }
      throw new Error('Unexpected command');
    });
    const sessions = repository(send);

    await expect(
      sessions.listStateUpdatedBefore('RUNNING', 12_700),
    ).resolves.toEqual([RECORD]);
    await sessions.releaseWorkspace(RECORD);

    const query = send.mock.calls
      .map(([command]) => command)
      .find((command) => command instanceof QueryCommand);
    expect(query?.input).toMatchObject({
      IndexName: 'state-updated-index',
      ExpressionAttributeValues: {
        ':state': 'RUNNING',
        ':updatedBefore': 12_700,
      },
    });
    const deletion = send.mock.calls
      .map(([command]) => command)
      .find((command) => command instanceof DeleteCommand);
    expect(deletion?.input).toMatchObject({
      TableName: 'workspace-claims',
      ConditionExpression: 'sessionId = :sessionId',
      ExpressionAttributeValues: {
        ':sessionId': RECORD.sessionId,
      },
    });
  });

  it('conditions patches on the accepted states', async () => {
    const send = vi.fn(async (command: unknown) => {
      if (command instanceof UpdateCommand) {
        return {};
      }
      throw new Error('Unexpected command');
    });

    await repository(send).patch(
      RECORD.sessionId,
      { state: 'RUNNING' },
      ['STARTING', 'RESUMING'],
    );

    const update = send.mock.calls[0]?.[0] as UpdateCommand;
    expect(update.input).toMatchObject({
      ConditionExpression:
        '#currentState IN (:expectedState0, :expectedState1)',
      ExpressionAttributeValues: expect.objectContaining({
        ':expectedState0': 'STARTING',
        ':expectedState1': 'RESUMING',
      }),
    });
  });
});

describe('AwsMicrovmService', () => {
  it('runs with shell ingress and native idle policy', async () => {
    const send = vi.fn(async (command: unknown) => {
      expect(command).toBeInstanceOf(RunMicrovmCommand);
      return {
        microvmId: 'microvm-1',
        state: 'PENDING',
        endpoint: 'microvm.example.aws',
        imageArn: 'arn:image',
        imageVersion: '4.0',
        maximumDurationInSeconds: 28_800,
        startedAt: new Date('2026-07-17T00:00:00Z'),
      };
    });
    const service = new AwsMicrovmService({
      send,
    } as unknown as LambdaMicrovmsClient);

    const startedAt = new Date('2026-07-17T00:00:00Z');
    await expect(
      service.run({
        imageArn: 'arn:image',
        egressArns: ['arn:vpc-egress', 'arn:internet-egress'],
        ingressArn: 'arn:ingress',
        executionRoleArn: 'arn:role',
        logGroup: '/microvms',
        payload: '{"version":3,"accessMode":"terminal"}',
        clientToken: 'session-1',
        idleAfterSeconds: 900,
        suspendedRetentionSeconds: 3_600,
      }),
    ).resolves.toMatchObject({
      microvmId: 'microvm-1',
      startedAt: Math.floor(startedAt.getTime() / 1_000),
    });

    const command = send.mock.calls[0]?.[0] as RunMicrovmCommand;
    expect(command.input).toMatchObject({
      ingressNetworkConnectors: ['arn:ingress'],
      egressNetworkConnectors: [
        'arn:vpc-egress',
        'arn:internet-egress',
      ],
      idlePolicy: {
        autoResumeEnabled: true,
        maxIdleDurationSeconds: 900,
        suspendedDurationSeconds: 3_600,
      },
      maximumDurationInSeconds: 28_800,
      runHookPayload: '{"version":3,"accessMode":"terminal"}',
    });
  });

  it('omits idle policy for an actively supervised VS Code session', async () => {
    const send = vi.fn(async (_command: unknown) => ({
      microvmId: 'microvm-vscode',
      state: 'PENDING',
      endpoint: 'microvm.example.aws',
      imageArn: 'arn:image',
      imageVersion: '5.0',
      maximumDurationInSeconds: 28_800,
      startedAt: new Date('2026-07-17T00:00:00Z'),
    }));
    const service = new AwsMicrovmService({
      send,
    } as unknown as LambdaMicrovmsClient);

    await service.run({
      imageArn: 'arn:image',
      egressArns: ['arn:vpc-egress'],
      ingressArn: 'arn:shell-ingress',
      executionRoleArn: 'arn:role',
      logGroup: '/microvms',
      payload: '{"version":3,"accessMode":"vscode"}',
      clientToken: 'session-vscode',
      suspendedRetentionSeconds: 3_600,
    });

    const command = send.mock.calls[0]?.[0] as RunMicrovmCommand;
    expect(command.input.ingressNetworkConnectors).toEqual([
      'arn:shell-ingress',
    ]);
    expect(command.input.idlePolicy).toBeUndefined();
  });

  it('creates the documented shell token', async () => {
    const send = vi.fn(async (command: unknown) => {
      if (command instanceof GetMicrovmCommand) {
        return {
          microvmId: 'microvm-1',
          state: 'RUNNING',
          endpoint: 'microvm.example.aws',
        };
      }
      if (
        command instanceof
        CreateMicrovmShellAuthTokenCommand
      ) {
        return {
          authToken: {
            'X-aws-proxy-auth': 'native-shell-token',
          },
        };
      }
      throw new Error('Unexpected command');
    });
    vi.spyOn(Date, 'now').mockReturnValue(2_000_000);
    const service = new AwsMicrovmService({
      send,
    } as unknown as LambdaMicrovmsClient);

    await expect(
      service.createShellConnection('microvm-1', 5),
    ).resolves.toEqual({
      endpoint: 'microvm.example.aws',
      authToken: 'native-shell-token',
      expiresAt: 2_300,
    });
    const tokenCommand = send.mock.calls[1]?.[0] as
      CreateMicrovmShellAuthTokenCommand;
    expect(tokenCommand.input).toEqual({
      microvmIdentifier: 'microvm-1',
      expirationInMinutes: 5,
    });
    vi.restoreAllMocks();
  });
});

describe('S3WorkspaceCheckpointService', () => {
  it('issues GET and PUT URLs for the owner-scoped key', async () => {
    const client = new S3Client({
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'AKID',
        secretAccessKey: 'secret',
      },
      requestChecksumCalculation: 'WHEN_REQUIRED',
    });
    const send = vi.fn(async (command: unknown) => {
      expect(command).toBeInstanceOf(HeadObjectCommand);
      return {};
    });
    client.send = send as typeof client.send;
    const checkpoints = new S3WorkspaceCheckpointService(
      client,
      'workspace-bucket',
      600,
    );

    const access = await checkpoints.createAccess(
      'a'.repeat(64),
      'payments',
    );

    expect(send).toHaveBeenCalledOnce();
    const head = send.mock.calls[0]?.[0] as HeadObjectCommand;
    expect(head.input).toEqual({
      Bucket: 'workspace-bucket',
      Key:
        `workspaces/${'a'.repeat(64)}/payments/` +
        'checkpoint.tar.gz',
    });
    expect(access.downloadUrl).toContain(
      'X-Amz-Signature=',
    );
    expect(access.uploadUrl).toContain('X-Amz-Signature=');
    expect(access.uploadUrl).not.toContain(
      'x-amz-checksum-crc32',
    );
  });

  it('omits the download URL when no checkpoint exists', async () => {
    const client = new S3Client({
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'AKID',
        secretAccessKey: 'secret',
      },
      requestChecksumCalculation: 'WHEN_REQUIRED',
    });
    const notFound = new Error('missing');
    notFound.name = 'NotFound';
    client.send = vi.fn(async () => {
      throw notFound;
    }) as typeof client.send;
    const checkpoints = new S3WorkspaceCheckpointService(
      client,
      'workspace-bucket',
      600,
    );

    await expect(
      checkpoints.createAccess('a'.repeat(64), 'new'),
    ).resolves.toMatchObject({
      downloadUrl: undefined,
      uploadUrl: expect.stringContaining('X-Amz-Signature='),
    });
  });

  it('builds deterministic owner-scoped keys', () => {
    expect(
      workspaceCheckpointKey('a'.repeat(64), 'payments.dev'),
    ).toBe(
      `workspaces/${'a'.repeat(64)}/payments.dev/` +
        'checkpoint.tar.gz',
    );
  });
});
