import {
  InvokeCommand,
  type LambdaClient,
} from '@aws-sdk/client-lambda';
import {
  GetCommand,
  PutCommand,
  UpdateCommand,
  type DynamoDBDocumentClient,
} from '@aws-sdk/lib-dynamodb';
import { describe, expect, it, vi } from 'vitest';
import {
  DynamoTunnelAuthJobRepository,
  LambdaTunnelAuthWorkerInvoker,
} from '../src/tunnel-auth-aws.js';
import type { TunnelAuthJob } from '../src/tunnel-auth.js';

const JOB: TunnelAuthJob = {
  sessionId: 'session-1',
  jobId: 'job-1',
  ownerHash: 'a'.repeat(64),
  provider: 'github',
  status: 'QUEUED',
  createdAt: 1_000,
  updatedAt: 1_000,
  expiresAt: 1_900,
};

describe('DynamoTunnelAuthJobRepository', () => {
  it('uses consistent reads and stores an expiring job', async () => {
    const send = vi.fn(async (command: unknown) => {
      if (command instanceof GetCommand) {
        return { Item: JOB };
      }
      if (command instanceof PutCommand) {
        return {};
      }
      throw new Error('Unexpected command');
    });
    const jobs = new DynamoTunnelAuthJobRepository(
      { send } as unknown as DynamoDBDocumentClient,
      'tunnel-auth-jobs',
    );

    await jobs.put(JOB);
    await expect(jobs.get(JOB.sessionId)).resolves.toEqual(JOB);
    expect((send.mock.calls[0]?.[0] as PutCommand).input).toEqual({
      TableName: 'tunnel-auth-jobs',
      Item: JOB,
    });
    expect((send.mock.calls[1]?.[0] as GetCommand).input).toEqual({
      TableName: 'tunnel-auth-jobs',
      Key: { sessionId: JOB.sessionId },
      ConsistentRead: true,
    });
  });

  it('conditions transitions on job ID and status and clears codes', async () => {
    const updated = {
      ...JOB,
      status: 'READY' as const,
      updatedAt: 1_200,
    };
    const send = vi.fn(async (command: unknown) => {
      expect(command).toBeInstanceOf(UpdateCommand);
      return { Attributes: updated };
    });
    const jobs = new DynamoTunnelAuthJobRepository(
      { send } as unknown as DynamoDBDocumentClient,
      'tunnel-auth-jobs',
    );

    await expect(
      jobs.update(
        JOB.sessionId,
        JOB.jobId,
        {
          status: 'READY',
          updatedAt: 1_200,
          expiresAt: 30_000,
          clearDeviceCode: true,
        },
        ['STARTING', 'AWAITING_USER'],
      ),
    ).resolves.toEqual(updated);
    const command = send.mock.calls[0]?.[0] as UpdateCommand;
    expect(command.input.ConditionExpression).toBe(
      '#jobId = :jobId AND #status IN (:expectedStatus0, :expectedStatus1)',
    );
    expect(command.input.UpdateExpression).toContain(
      'REMOVE #removeverificationUri, #removeuserCode',
    );
    expect(command.input.ExpressionAttributeValues).toMatchObject({
      ':jobId': JOB.jobId,
      ':expectedStatus0': 'STARTING',
      ':expectedStatus1': 'AWAITING_USER',
      ':expiresAt': 30_000,
    });
  });
});

describe('LambdaTunnelAuthWorkerInvoker', () => {
  it('invokes asynchronously with no shell token or device code', async () => {
    const send = vi.fn(async (command: unknown) => {
      expect(command).toBeInstanceOf(InvokeCommand);
      return { StatusCode: 202 };
    });
    const invoker = new LambdaTunnelAuthWorkerInvoker(
      { send } as unknown as LambdaClient,
      'arn:aws:lambda:us-east-1:111122223333:function:tunnel-auth',
    );
    const event = {
      sessionId: JOB.sessionId,
      jobId: JOB.jobId,
      ownerHash: JOB.ownerHash,
      provider: JOB.provider,
    };

    await invoker.invoke(event);
    const command = send.mock.calls[0]?.[0] as InvokeCommand;
    expect(command.input.InvocationType).toBe('Event');
    expect(command.input.Payload).toBeInstanceOf(Uint8Array);
    expect(
      JSON.parse(
        Buffer.from(
          command.input.Payload as Uint8Array,
        ).toString('utf8'),
      ),
    ).toEqual(event);
  });
});
