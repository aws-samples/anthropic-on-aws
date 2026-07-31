import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { LambdaClient } from '@aws-sdk/client-lambda';
import { LambdaMicrovmsClient } from '@aws-sdk/client-lambda-microvms';
import { S3Client } from '@aws-sdk/client-s3';
import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  EventBridgeEvent,
} from 'aws-lambda';
import {
  AwsMicrovmService,
  DynamoSessionRepository,
  S3WorkspaceCheckpointService,
} from './aws-adapters.js';
import type {
  InferenceMode,
  SessionRecord,
  StartConfiguration,
  TunnelIdentityProvider,
} from './model.js';
import {
  isPortalRoute,
  portalCaller,
  portalRequestsLiveRefresh,
  portalRoutePath,
} from './portal.js';
import { ControlError, ControlService } from './service.js';
import {
  DynamoTunnelAuthJobRepository,
  LambdaTunnelAuthWorkerInvoker,
} from './tunnel-auth-aws.js';
import {
  publicTunnelAuthJob,
  TunnelAuthService,
} from './tunnel-auth.js';

type ControlEvent =
  | APIGatewayProxyEvent
  | EventBridgeEvent<string, unknown>;

const region = process.env.AWS_REGION ?? 'us-east-1';
const ssm = new SSMClient({ region });
const documentClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region }),
  {
    marshallOptions: { removeUndefinedValues: true },
  },
);
const repository = new DynamoSessionRepository(
  documentClient,
  requiredEnvironment('SESSION_TABLE_NAME'),
  requiredEnvironment('WORKSPACE_CLAIM_TABLE_NAME'),
);
const service = new ControlService({
  repository,
  microvms: new AwsMicrovmService(new LambdaMicrovmsClient({ region })),
  checkpoints: new S3WorkspaceCheckpointService(
    new S3Client({
      region,
      requestChecksumCalculation: 'WHEN_REQUIRED',
    }),
    requiredEnvironment('WORKSPACE_BUCKET_NAME'),
  ),
  loadConfiguration,
});
const tunnelAuth = optionalTunnelAuthService();

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
    // Portal routes accept Cognito browser tokens. Their owner is
    // oidc:<sub> rather than an IAM caller ARN, so the two identity
    // namespaces never collide.
    const portal = isPortalRoute(event);
    const ownerPrincipal = portal
      ? portalCaller(event)
      : callerPrincipal(event);
    const method = event.httpMethod.toUpperCase();
    const path = portal
      ? portalRoutePath(event.resource)
      : event.resource;
    const sessionId = event.pathParameters?.sessionId;

    if (
      method === 'POST' &&
      !portal &&
      path === '/sessions/{sessionId}/checkpoint-urls'
    ) {
      if (!sessionId) {
        throw new ControlError(404, 'Route not found');
      }
      assertMicrovmExecutionCaller(ownerPrincipal);
      const body = parseBody(event);
      const microvmId = optionalString(body.microvmId);
      if (!microvmId) {
        throw new ControlError(400, 'microvmId is required');
      }
      const access = await service.checkpointUrls(sessionId, microvmId);
      return response(200, {
        downloadUrl: access.downloadUrl,
        uploadUrl: access.uploadUrl,
      });
    }

    if (method === 'GET' && path === '/sessions') {
      const sessions = await service.list(
        ownerPrincipal,
        portalRequestsLiveRefresh(event),
      );
      return response(200, {
        sessions: sessions.map(publicSession),
      });
    }
    if (method === 'POST' && path === '/sessions') {
      const body = parseBody(event);
      const result = await service.start(
        ownerPrincipal,
        optionalString(body.workspaceId),
        {
          accessMode: optionalAccessMode(body.accessMode),
          inferenceMode: optionalInferenceMode(body.inferenceMode),
          tunnelProvider: optionalTunnelIdentityProvider(
            body.tunnelProvider,
          ),
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
    if (path === '/sessions/{sessionId}/tunnel-login') {
      if (!portal) {
        throw new ControlError(404, 'Route not found');
      }
      const tunnelAuthService = requiredTunnelAuthService();
      const session = await service.get(ownerPrincipal, sessionId);
      if (method === 'POST') {
        const body = parseBody(event);
        const provider =
          optionalTunnelIdentityProvider(body.provider) ??
          session.tunnelProvider ??
          'microsoft';
        const job = await tunnelAuthService.start(
          session,
          provider,
        );
        await service.setTunnelProvider(
          ownerPrincipal,
          sessionId,
          job.provider,
        );
        return response(202, publicTunnelAuthJob(job));
      }
      if (method === 'GET') {
        return response(
          200,
          publicTunnelAuthJob(await tunnelAuthService.get(session)),
        );
      }
      if (method === 'DELETE') {
        return response(
          202,
          publicTunnelAuthJob(await tunnelAuthService.cancel(session)),
        );
      }
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
        shellUrl: shellUrl(result.connection.endpoint),
        shellToken: result.connection.authToken,
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
  const [imageArn, connectorArn] = await Promise.all([
    parameterValue(requiredEnvironment('IMAGE_PARAMETER_NAME')),
    parameterValue(requiredEnvironment('CONNECTOR_PARAMETER_NAME')),
  ]);
  if (imageArn === 'UNPROVISIONED' || connectorArn === 'UNPROVISIONED') {
    throw new ControlError(
      503,
      'MicroVM image or network connector has not been provisioned',
    );
  }
  const inferenceMode = requiredInferenceMode();
  const value: StartConfiguration = {
    region,
    partition: process.env.AWS_PARTITION ?? 'aws',
    imageArn,
    connectorArn,
    executionRoleArn: requiredEnvironment('MICROVM_EXECUTION_ROLE_ARN'),
    logGroup: requiredEnvironment('MICROVM_LOG_GROUP'),
    inferenceMode,
    allowClaudeAiSubscription:
      process.env.ALLOW_CLAUDE_AI_SUBSCRIPTION === 'true',
    claudeGatewayUrl:
      inferenceMode === 'claude-gateway'
        ? requiredEnvironment('CLAUDE_GATEWAY_URL')
        : undefined,
    bedrockModelId:
      inferenceMode === 'bedrock'
        ? requiredEnvironment('BEDROCK_MODEL_ID')
        : undefined,
    agentCoreGatewayUrl: process.env.AGENTCORE_GATEWAY_URL || undefined,
    controlApiUrl:
      process.env.CONTROL_API_URL || observedApiUrl,
    idleAfterSeconds: positiveInteger('IDLE_AFTER_SECONDS'),
    suspendedRetentionSeconds: positiveInteger(
      'SUSPENDED_RETENTION_SECONDS',
    ),
  };
  configurationCache = {
    expiresAt: now + 60_000,
    value,
  };
  return value;
}

function observeApiUrl(event: APIGatewayProxyEvent): void {
  const { apiId, stage } = event.requestContext;
  if (apiId && stage) {
    observedApiUrl =
      `https://${apiId}.execute-api.${region}.amazonaws.com/${stage}`;
    if (configurationCache) {
      configurationCache.value.controlApiUrl =
        process.env.CONTROL_API_URL || observedApiUrl;
    }
  }
}

async function parameterValue(name: string): Promise<string> {
  const result = await ssm.send(new GetParameterCommand({ Name: name }));
  if (!result.Parameter?.Value) {
    throw new Error(`SSM parameter ${name} has no value`);
  }
  return result.Parameter.Value;
}

function assertMicrovmExecutionCaller(principal: string): void {
  const executionRoleArn = requiredEnvironment(
    'MICROVM_EXECUTION_ROLE_ARN',
  );
  const roleName = executionRoleArn.split('/').pop();
  const principalRoleName = principal.split('/').slice(-2, -1)[0];
  if (
    !roleName ||
    !principal.includes(':assumed-role/') ||
    principalRoleName !== roleName
  ) {
    throw new ControlError(403, 'Caller is not a MicroVM execution role');
  }
}

function callerPrincipal(event: APIGatewayProxyEvent): string {
  const principal =
    event.requestContext.identity.userArn ??
    event.requestContext.identity.caller;
  if (!principal || !principal.startsWith('arn:')) {
    throw new ControlError(403, 'An IAM-authenticated caller is required');
  }
  // Assumed-role ARNs embed the session name. IAM Identity Center and
  // most corporate federation set it to the stable per-user identity,
  // which keeps workspace ownership stable across logins. Ad-hoc
  // sts:AssumeRole calls with varying session names create distinct
  // owners; developers must use a consistent session name.
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
    throw new ControlError(400, 'workspaceId must be a string');
  }
  return value;
}

function optionalAccessMode(
  value: unknown,
): 'terminal' | 'vscode' | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (value !== 'terminal' && value !== 'vscode') {
    throw new ControlError(
      400,
      'accessMode must be terminal or vscode',
    );
  }
  return value;
}

function optionalInferenceMode(
  value: unknown,
): InferenceMode | undefined {
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

function optionalTunnelIdentityProvider(
  value: unknown,
): TunnelIdentityProvider | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (value !== 'microsoft' && value !== 'github') {
    throw new ControlError(
      400,
      'provider must be microsoft or github',
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
    imageVersion: record.imageVersion,
    microvmStartedAt: record.microvmStartedAt,
    microvmExpiresAt: record.microvmExpiresAt,
    failureReason: record.failureReason || undefined,
    inferenceMode: record.inferenceMode,
    accessMode: record.accessMode ?? 'terminal',
    tunnelName: record.tunnelName,
    tunnelProvider: record.tunnelProvider,
  };
}

function shellUrl(endpoint: string): string {
  const url = new URL(
    endpoint.includes('://') ? endpoint : `https://${endpoint}`,
  );
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error('MicroVM returned an invalid shell endpoint');
  }
  url.protocol = 'wss:';
  url.pathname = '/shell';
  return url.toString();
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

function requiredInferenceMode(): InferenceMode {
  const value = requiredEnvironment('INFERENCE_MODE');
  if (value !== 'claude-gateway' && value !== 'bedrock') {
    throw new Error(
      'INFERENCE_MODE must be claude-gateway or bedrock',
    );
  }
  return value;
}

function optionalTunnelAuthService(): TunnelAuthService | undefined {
  const tableName = process.env.TUNNEL_AUTH_TABLE_NAME;
  const workerArn = process.env.TUNNEL_AUTH_WORKER_ARN;
  if (!tableName && !workerArn) {
    return undefined;
  }
  if (!tableName || !workerArn) {
    throw new Error(
      'TUNNEL_AUTH_TABLE_NAME and TUNNEL_AUTH_WORKER_ARN must be set together',
    );
  }
  return new TunnelAuthService({
    jobs: new DynamoTunnelAuthJobRepository(
      documentClient,
      tableName,
    ),
    worker: new LambdaTunnelAuthWorkerInvoker(
      new LambdaClient({ region }),
      workerArn,
    ),
  });
}

function requiredTunnelAuthService(): TunnelAuthService {
  if (!tunnelAuth) {
    throw new ControlError(
      503,
      'Tunnel authentication is not enabled',
    );
  }
  return tunnelAuth;
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
