import { Sha256 } from '@aws-crypto/sha256-js';
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { HttpRequest } from '@smithy/protocol-http';
import { SignatureV4 } from '@smithy/signature-v4';

export interface SessionView {
  sessionId: string;
  workspaceId: string;
  state: string;
  createdAt: number;
  updatedAt: number;
  lastActivityAt: number;
  imageVersion?: string;
  microvmStartedAt?: number;
  microvmExpiresAt?: number;
  failureReason?: string;
  accessMode?: SessionAccessMode;
  inferenceMode?: ClaudeInferenceMode;
  tunnelName?: string;
  tunnelProvider?: TunnelIdentityProvider;
}

export type SessionAccessMode = 'terminal' | 'vscode';

export type TunnelIdentityProvider = 'microsoft' | 'github';

export type ClaudeInferenceMode =
  | 'bedrock'
  | 'claude-ai'
  | 'claude-gateway';

export interface StartSessionOptions {
  accessMode?: SessionAccessMode;
  inferenceMode?: ClaudeInferenceMode;
  tunnelProvider?: TunnelIdentityProvider;
}

export interface ConnectResponse {
  session: SessionView;
  shellUrl: string;
  shellToken: string;
  tokenExpiresAt: number;
}

export interface ControlApiOptions {
  region: string;
  profile: string;
  apiUrl?: string;
  stackName: string;
}

export interface ControlApi {
  start(
    workspaceId?: string,
    options?: StartSessionOptions,
  ): Promise<{ created: boolean; session: SessionView }>;
  list(): Promise<SessionView[]>;
  get(sessionId: string): Promise<SessionView>;
  connect(sessionId: string): Promise<ConnectResponse>;
  suspend(sessionId: string): Promise<SessionView>;
  resume(sessionId: string): Promise<SessionView>;
  terminate(sessionId: string): Promise<SessionView>;
}

export class ApiError extends Error {
  public constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

export class ControlApiClient implements ControlApi {
  private readonly credentials;
  private readonly signer;
  private apiUrl?: URL;

  public constructor(private readonly options: ControlApiOptions) {
    this.credentials = defaultProvider({ profile: options.profile });
    this.signer = new SignatureV4({
      credentials: this.credentials,
      region: options.region,
      service: 'execute-api',
      sha256: Sha256,
    });
    if (options.apiUrl) {
      this.apiUrl = validateApiUrl(options.apiUrl);
    }
  }

  public async start(
    workspaceId?: string,
    options: StartSessionOptions = {},
  ): Promise<{ created: boolean; session: SessionView }> {
    return this.request('POST', '/sessions', {
      ...(workspaceId ? { workspaceId } : {}),
      ...(options.accessMode
        ? { accessMode: options.accessMode }
        : {}),
      ...(options.inferenceMode
        ? { inferenceMode: options.inferenceMode }
        : {}),
      ...(options.tunnelProvider
        ? { tunnelProvider: options.tunnelProvider }
        : {}),
    });
  }

  public async list(): Promise<SessionView[]> {
    const result = await this.request<{ sessions: SessionView[] }>(
      'GET',
      '/sessions',
    );
    return result.sessions;
  }

  public async get(sessionId: string): Promise<SessionView> {
    return this.request('GET', `/sessions/${encodeSessionId(sessionId)}`);
  }

  public async connect(sessionId: string): Promise<ConnectResponse> {
    return this.request(
      'POST',
      `/sessions/${encodeSessionId(sessionId)}/connect`,
      {},
    );
  }

  public async suspend(sessionId: string): Promise<SessionView> {
    return this.request(
      'POST',
      `/sessions/${encodeSessionId(sessionId)}/suspend`,
      {},
    );
  }

  public async resume(sessionId: string): Promise<SessionView> {
    return this.request(
      'POST',
      `/sessions/${encodeSessionId(sessionId)}/resume`,
      {},
    );
  }

  public async terminate(sessionId: string): Promise<SessionView> {
    return this.request(
      'DELETE',
      `/sessions/${encodeSessionId(sessionId)}`,
    );
  }

  private async request<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    const base = await this.resolveApiUrl();
    const url = new URL(`${base.pathname.replace(/\/+$/, '')}${path}`, base);
    const encodedBody = body === undefined ? undefined : JSON.stringify(body);
    const headers: Record<string, string> = {
      accept: 'application/json',
      host: url.host,
    };
    if (encodedBody !== undefined) {
      headers['content-type'] = 'application/json';
    }
    const signed = await this.signer.sign(
      new HttpRequest({
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port ? Number.parseInt(url.port, 10) : undefined,
        method,
        path: url.pathname,
        headers,
        body: encodedBody,
      }),
    );
    const requestHeaders = new Headers(signed.headers);
    requestHeaders.delete('host');

    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: encodedBody,
      redirect: 'error',
    });
    return parseControlApiResponse<T>(response);
  }

  private async resolveApiUrl(): Promise<URL> {
    if (this.apiUrl) {
      return this.apiUrl;
    }
    const cloudFormation = new CloudFormationClient({
      region: this.options.region,
      credentials: this.credentials,
    });
    const result = await cloudFormation.send(
      new DescribeStacksCommand({ StackName: this.options.stackName }),
    );
    const output = result.Stacks?.[0]?.Outputs?.find(
      (candidate) => candidate.OutputKey === 'ControlApiUrl',
    )?.OutputValue;
    if (!output) {
      throw new Error(
        `Stack ${this.options.stackName} has no ControlApiUrl output`,
      );
    }
    this.apiUrl = validateApiUrl(output);
    return this.apiUrl;
  }
}

async function parseControlApiResponse<T>(response: Response): Promise<T> {
  const responseText = await response.text();
  let responseBody: unknown = {};
  if (responseText) {
    try {
      responseBody = JSON.parse(responseText);
    } catch {
      throw new ApiError(
        response.status,
        `Control API returned non-JSON HTTP ${response.status}`,
      );
    }
  }
  if (!response.ok) {
    const message =
      isRecord(responseBody) &&
      typeof responseBody.message === 'string'
        ? responseBody.message
        : `Control API returned HTTP ${response.status}`;
    throw new ApiError(response.status, message);
  }
  return responseBody as T;
}

function validateApiUrl(value: string): URL {
  const url = new URL(value);
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error('Control API URL must be a plain HTTPS URL');
  }
  return url;
}

function encodeSessionId(sessionId: string): string {
  if (!/^[A-Za-z0-9-]{1,128}$/.test(sessionId)) {
    throw new Error('Invalid session ID');
  }
  return encodeURIComponent(sessionId);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
