import {
  InvokeCommand,
  type LambdaClient,
} from '@aws-sdk/client-lambda';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import type {
  TunnelAuthJob,
  TunnelAuthJobRepository,
  TunnelAuthJobUpdate,
  TunnelAuthStatus,
  TunnelAuthWorkerEvent,
  TunnelAuthWorkerInvoker,
} from './tunnel-auth.js';

export class DynamoTunnelAuthJobRepository
  implements TunnelAuthJobRepository
{
  public constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly tableName: string,
  ) {}

  public async get(
    sessionId: string,
  ): Promise<TunnelAuthJob | undefined> {
    const result = await this.client.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { sessionId },
        ConsistentRead: true,
      }),
    );
    return result.Item as TunnelAuthJob | undefined;
  }

  public async put(job: TunnelAuthJob): Promise<void> {
    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: job,
      }),
    );
  }

  public async update(
    sessionId: string,
    jobId: string,
    values: TunnelAuthJobUpdate,
    expectedStatuses: TunnelAuthStatus[],
  ): Promise<TunnelAuthJob | undefined> {
    if (expectedStatuses.length === 0) {
      throw new Error('Tunnel auth update requires an expected status');
    }

    const names: Record<string, string> = {
      '#jobId': 'jobId',
      '#status': 'status',
      '#updatedAt': 'updatedAt',
    };
    const expressionValues: Record<string, unknown> = {
      ':jobId': jobId,
      ':status': values.status,
      ':updatedAt': values.updatedAt,
    };
    const assignments = [
      '#status = :status',
      '#updatedAt = :updatedAt',
    ];
    for (const [field, value] of [
      ['expiresAt', values.expiresAt],
      ['verificationUri', values.verificationUri],
      ['userCode', values.userCode],
      ['failureReason', values.failureReason],
    ] as const) {
      if (
        value === undefined ||
        (values.clearDeviceCode &&
          (field === 'verificationUri' || field === 'userCode'))
      ) {
        continue;
      }
      names[`#${field}`] = field;
      expressionValues[`:${field}`] = value;
      assignments.push(`#${field} = :${field}`);
    }
    const expected = expectedStatuses.map((status, index) => {
      const key = `:expectedStatus${index}`;
      expressionValues[key] = status;
      return key;
    });
    const removals = values.clearDeviceCode
      ? ['verificationUri', 'userCode'].map((field) => {
          names[`#remove${field}`] = field;
          return `#remove${field}`;
        })
      : [];

    try {
      const result = await this.client.send(
        new UpdateCommand({
          TableName: this.tableName,
          Key: { sessionId },
          UpdateExpression:
            `SET ${assignments.join(', ')}` +
            (removals.length > 0
              ? ` REMOVE ${removals.join(', ')}`
              : ''),
          ConditionExpression:
            `#jobId = :jobId AND #status IN (${expected.join(', ')})`,
          ExpressionAttributeNames: names,
          ExpressionAttributeValues: expressionValues,
          ReturnValues: 'ALL_NEW',
        }),
      );
      return result.Attributes as TunnelAuthJob | undefined;
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === 'ConditionalCheckFailedException'
      ) {
        return undefined;
      }
      throw error;
    }
  }
}

export class LambdaTunnelAuthWorkerInvoker
  implements TunnelAuthWorkerInvoker
{
  public constructor(
    private readonly client: LambdaClient,
    private readonly functionArn: string,
  ) {}

  public async invoke(event: TunnelAuthWorkerEvent): Promise<void> {
    const result = await this.client.send(
      new InvokeCommand({
        FunctionName: this.functionArn,
        InvocationType: 'Event',
        Payload: Buffer.from(JSON.stringify(event)),
      }),
    );
    if (result.StatusCode !== 202) {
      throw new Error('Tunnel auth worker invocation was not accepted');
    }
  }
}
