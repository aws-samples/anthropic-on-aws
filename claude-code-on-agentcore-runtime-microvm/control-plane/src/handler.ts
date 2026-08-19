import { BedrockAgentCoreClient } from '@aws-sdk/client-bedrock-agentcore';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  EventBridgeEvent,
} from 'aws-lambda';
import {
  AwsAgentRuntimeService,
  DynamoSessionRepository,
  S3WorkspaceCheckpointService,
} from './aws-adapters.js';
import type {
  AccessMode,
  InferenceMode,
  SessionRecord,
  StartConfiguration,
} from './model.js';
import { ControlError, ControlService } from './service.js';

type ControlEvent =
  | APIGatewayProxyEvent
  | EventBridgeEvent<string, unknown>;

const region = process.env.AWS_REGION ?? 'us-east-1';
const documentClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region }),
  { marshallOptions: { removeUndefinedValues: true } },
);
const repository = new DynamoSessionRepository(
  documentClient,
  requiredEnvironment('SESSION_TABLE_NAME'),
  requiredEnvironment('WORKSPACE_CLAIM_TABLE_NAME'),
);
const service = new ControlService({
  repository,
  agentRuntime: new AwsAgentRuntimeService(
    new BedrockAgentCoreClient({ region }),
  ),
  checkpoints: new S3WorkspaceCheckpointService(
    new S3Client({ region, requestChecksumCalculation: 'WHEN_REQUIRED' }),
    requiredEnvironment('WORKSPACE_BUCKET_NAME'),
  ),
  loadConfiguration,
});

let configurationCache:
  | { expiresAt: number; value: StartConfiguration }
  | undefined;
let observedApiUrl: string | undefined;

export async function handler(
  event: ControlEvent,
): Promise<APIGatewayProxyResult | Record<string, number>> {
  if (isReconcilerEvent(event)) {
    return service.reconcile();
  }
  if (!isApiGatewayEvent(event)) {
    return response(400, { message: 'Unsupported event' });
  }
  observeApiUrl(event);

  try {
    const ownerPrincipal = callerPrincipal(event);
    const method = event.httpMethod.toUpperCase();
    const path = event.resource;
    const sessionId = event.pathParameters?.sessionId;

    if (
      method === 'POST' &&
      path === '/sessions/{sessionId}/checkpoint-urls'
    ) {
      if (!sessionId) {
        throw new ControlError(404, 'Route not found');
      }
      assertRuntimeExecutionCaller(ownerPrincipal);
      const body = parseBody(event);
      const runtimeSessionId = optionalString(body.runtimeSessionId);
      if (!runtimeSessionId) {
        throw new ControlError(400, 'runtimeSessionId is required');
      }
      const access = await service.checkpointUrls(
        sessionId,
        runtimeSessionId,
      );
      return response(200, {
        downloadUrl: access.downloadUrl,
        uploadUrl: access.uploadUrl,
      });
    }

    if (method === 'GET' && path === '/sessions') {
      const sessions = await service.list(ownerPrincipal, true);
      return response(200, { sessions: sessions.map(publicSession) });
    }
    if (method === 'POST' && path === '/sessions') {
      const body = parseBody(event);
      const result = await service.start(
        ownerPrincipal,
        optionalString(body.workspaceId),
        {
          accessMode: optionalAccessMode(body.accessMode),
          inferenceMode: optionalInferenceMode(body.inferenceMode),
        },
      );
      return response(result.created ? 202 : 200, {
        created: result.created,
        session: publicSession(result.record),
      });
    }
    if (!sessionId) {
      throw new ControlError(404, 'Route not found');
    }
    if (method === 'GET' && path === '/sessions/{sessionId}') {
      return response(
        200,
        publicSession(await service.get(ownerPrincipal, sessionId)),
      );
    }
    if (method === 'POST' && path === '/sessions/{sessionId}/connect') {
      const result = await service.connect(ownerPrincipal, sessionId);
      return response(200, {
        session: publicSession(result.record),
        shellUrl: result.connection.endpoint,
        runtimeSessionId: result.connection.runtimeSessionId,
        shellId: result.connection.shellId,
        tokenExpiresAt: result.connection.expiresAt,
      });
    }
    if (method === 'POST' && path === '/sessions/{sessionId}/suspend') {
      return response(
        202,
        publicSession(await service.suspend(ownerPrincipal, sessionId)),
      );
    }
    if (method === 'POST' && path === '/sessions/{sessionId}/resume') {
      return response(
        202,
        publicSession(await service.resume(ownerPrincipal, sessionId)),
      );
    }
    if (method === 'DELETE' && path === '/sessions/{sessionId}') {
      return response(
        202,
        publicSession(await service.terminate(ownerPrincipal, sessionId)),
      );
    }
    throw new ControlError(404, 'Route not found');
  } catch (error) {
    if (error instanceof ControlError) {
      return response(error.statusCode, { message: error.message });
    }
    console.error('control request failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return response(500, { message: 'Internal server error' });
  }
}

async function loadConfiguration(): Promise<StartConfiguration> {
  const now = Date.now();
  if (configurationCache && configurationCache.expiresAt > now) {
    return configurationCache.value;
  }
  const value: StartConfiguration = {
    region,
    partition: process.env.AWS_PARTITION ?? 'aws',
    agentRuntimeArn: requiredEnvironment('AGENT_RUNTIME_ARN'),
    executionRoleArn: requiredEnvironment('RUNTIME_EXECUTION_ROLE_ARN'),
    logGroup: requiredEnvironment('RUNTIME_LOG_GROUP'),
    inferenceMode: 'bedrock',
    allowClaudeAiSubscription:
      process.env.ALLOW_CLAUDE_AI_SUBSCRIPTION === 'true',
    bedrockModelId: requiredEnvironment('BEDROCK_MODEL_ID'),
    controlApiUrl: process.env.CONTROL_API_URL || observedApiUrl,
    idleAfterSeconds: positiveInteger('IDLE_AFTER_SECONDS'),
    suspendedRetentionSeconds: 3_600,
  };
  configurationCache = { expiresAt: now + 60_000, value };
  return value;
}

function observeApiUrl(event: APIGatewayProxyEvent): void {
  const { apiId, stage } = event.requestContext;
  if (apiId && stage) {
    observedApiUrl = `https://${apiId}.execute-api.${region}.amazonaws.com/${stage}`;
    if (configurationCache) {
      configurationCache.value.controlApiUrl =
        process.env.CONTROL_API_URL || observedApiUrl;
    }
  }
}

function assertRuntimeExecutionCaller(principal: string): void {
  const executionRoleArn = requiredEnvironment('RUNTIME_EXECUTION_ROLE_ARN');
  const roleName = executionRoleArn.split('/').pop();
  const principalRoleName = principal.split('/').slice(-2, -1)[0];
  if (
    !roleName ||
    !principal.includes(':assumed-role/') ||
    principalRoleName !== roleName
  ) {
    throw new ControlError(
      403,
      'Caller is not the AgentCore Runtime execution role',
    );
  }
}

function callerPrincipal(event: APIGatewayProxyEvent): string {
  const principal =
    event.requestContext.identity.userArn ??
    event.requestContext.identity.caller;
  if (!principal || !principal.startsWith('arn:')) {
    throw new ControlError(403, 'An IAM-authenticated caller is required');
  }
  return principal;
}

function parseBody(event: APIGatewayProxyEvent): Record<string, unknown> {
  if (!event.body) {
    return {};
  }
  try {
    const parsed = JSON.parse(
      event.isBase64Encoded
        ? Buffer.from(event.body, 'base64').toString('utf8')
        : event.body,
    );
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('not an object');
    }
    return parsed as Record<string, unknown>;
  } catch {
    throw new ControlError(400, 'Request body must be a JSON object');
  }
}

function optionalString(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw new ControlError(400, 'Expected a string value');
  }
  return value;
}

function optionalAccessMode(value: unknown): AccessMode | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (value !== 'terminal' && value !== 'vscode') {
    throw new ControlError(400, 'accessMode must be terminal or vscode');
  }
  return value;
}

function optionalInferenceMode(value: unknown): InferenceMode | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (
    value !== 'bedrock' &&
    value !== 'claude-ai' &&
    value !== 'claude-gateway'
  ) {
    throw new ControlError(
      400,
      'inferenceMode must be bedrock, claude-ai, or claude-gateway',
    );
  }
  return value;
}

function publicSession(record: SessionRecord): Record<string, unknown> {
  return {
    sessionId: record.sessionId,
    workspaceId: record.workspaceId,
    state: record.state,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    lastActivityAt: record.lastActivityAt,
    runtimeStartedAt: record.runtimeStartedAt,
    runtimeExpiresAt: record.runtimeExpiresAt,
    failureReason: record.failureReason || undefined,
    inferenceMode: record.inferenceMode,
    accessMode: record.accessMode ?? 'terminal',
  };
}

function response(
  statusCode: number,
  body: Record<string, unknown>,
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'cache-control': 'no-store',
      'content-type': 'application/json',
      'strict-transport-security': 'max-age=31536000',
    },
    body: JSON.stringify(body),
  };
}

function requiredEnvironment(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function positiveInteger(name: string): number {
  const value = Number.parseInt(requiredEnvironment(name), 10);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
}

function isReconcilerEvent(
  event: ControlEvent,
): event is EventBridgeEvent<string, unknown> & {
  source: 'session-reconciler';
} {
  return 'source' in event && event.source === 'session-reconciler';
}

function isApiGatewayEvent(
  event: ControlEvent,
): event is APIGatewayProxyEvent {
  return 'httpMethod' in event && typeof event.httpMethod === 'string';
}
