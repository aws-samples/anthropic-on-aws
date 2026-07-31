import { describe, expect, it } from 'vitest';
import type { APIGatewayProxyEvent } from 'aws-lambda';
import type {
  CreateSessionResult,
  MicrovmDescription,
  MicrovmListItem,
  MicrovmService,
  RunResult,
  SessionRecord,
  SessionRepository,
  SessionState,
  ShellConnection,
  StartConfiguration,
  WorkspaceCheckpointAccess,
  WorkspaceCheckpointService,
} from '../src/model.js';
import {
  isPortalRoute,
  portalCaller,
  portalRequestsLiveRefresh,
  portalRoutePath,
} from '../src/portal.js';
import { ControlError, ControlService } from '../src/service.js';

const OID = '9f8e7d6c-1234-4abc-9def-556677889900';

function portalEvent(
  authorizer: Record<string, unknown> | undefined,
  resource = '/portal/sessions',
): Pick<APIGatewayProxyEvent, 'resource' | 'requestContext'> {
  return {
    resource,
    requestContext: {
      authorizer,
    } as unknown as APIGatewayProxyEvent['requestContext'],
  };
}

describe('portal route detection', () => {
  it('matches /portal and nested portal resources', () => {
    expect(isPortalRoute({ resource: '/portal' })).toBe(true);
    expect(
      isPortalRoute({ resource: '/portal/sessions/{sessionId}/connect' }),
    ).toBe(true);
  });

  it('does not match IAM session routes', () => {
    expect(isPortalRoute({ resource: '/sessions' })).toBe(false);
    expect(
      isPortalRoute({
        resource: '/sessions/{sessionId}/checkpoint-urls',
      }),
    ).toBe(false);
    expect(isPortalRoute({ resource: '/portals' })).toBe(false);
  });

  it('maps portal resources onto the IAM route shapes', () => {
    expect(portalRoutePath('/portal/sessions')).toBe('/sessions');
    expect(
      portalRoutePath('/portal/sessions/{sessionId}/suspend'),
    ).toBe('/sessions/{sessionId}/suspend');
  });

  it('allows live list refresh only on an explicit portal request', () => {
    expect(
      portalRequestsLiveRefresh({
        resource: '/portal/sessions',
        queryStringParameters: { refresh: 'true' },
      }),
    ).toBe(true);
    for (const event of [
      {
        resource: '/portal/sessions',
        queryStringParameters: null,
      },
      {
        resource: '/portal/sessions',
        queryStringParameters: { refresh: 'false' },
      },
      {
        resource: '/sessions',
        queryStringParameters: { refresh: 'true' },
      },
    ]) {
      expect(portalRequestsLiveRefresh(event)).toBe(false);
    }
  });
});

describe('portal owner derivation', () => {
  it('derives an oidc-prefixed owner from Cognito claims', () => {
    const owner = portalCaller(
      portalEvent({ claims: { sub: OID } }),
    );
    expect(owner).toBe(`oidc:${OID}`);
    // Deliberately not an ARN: the oidc: namespace never collides
    // with IAM caller ARNs, which always start with arn:.
    expect(owner.startsWith('arn:')).toBe(false);
  });

  it('returns 403 when authorizer claims are missing', () => {
    for (const event of [
      portalEvent(undefined),
      portalEvent({}),
      portalEvent({ claims: {} }),
      portalEvent({ claims: { sub: 42 } }),
      portalEvent({ claims: { sub: '' } }),
      portalEvent({ claims: { sub: '   ' } }),
    ]) {
      let caught: unknown;
      try {
        portalCaller(event);
      } catch (error) {
        caught = error;
      }
      expect(caught).toBeInstanceOf(ControlError);
      expect((caught as ControlError).statusCode).toBe(403);
    }
  });
});

describe('portal start flow', () => {
  it('starts a session owned by the oidc principal', async () => {
    const service = new ControlService({
      repository: new MemoryRepository(),
      microvms: new StubMicrovms(),
      checkpoints: new StubCheckpoints(),
      loadConfiguration: async () => CONFIGURATION,
      now: () => 10_000,
    });
    const owner = portalCaller(
      portalEvent({ claims: { sub: OID } }),
    );
    const result = await service.start(owner, 'portal-workspace');
    expect(result.created).toBe(true);
    expect(result.record.workspaceId).toBe('portal-workspace');
    expect(result.record.ownerHash).toBe(service.ownerHash(owner));
    expect(result.record.state).toBe('RUNNING');
    // The portal owner cannot see or touch IAM-owned sessions.
    await expect(
      service.get(
        'arn:aws:iam::111122223333:user/alice',
        result.record.sessionId,
      ),
    ).rejects.toMatchObject({ statusCode: 404 });
    const listed = await service.list(owner);
    expect(listed.map((record) => record.sessionId)).toEqual([
      result.record.sessionId,
    ]);
  });
});

const CONFIGURATION: StartConfiguration = {
  region: 'us-east-1',
  partition: 'aws',
  imageArn:
    'arn:aws:lambda:us-east-1:111122223333:microvm-image:test',
  connectorArn:
    'arn:aws:lambda:us-east-1:111122223333:network-connector:test',
  executionRoleArn: 'arn:aws:iam::111122223333:role/microvm',
  logGroup: '/claude-microvm/microvms',
  inferenceMode: 'bedrock',
  bedrockModelId: 'anthropic.claude-sonnet-5',
  idleAfterSeconds: 900,
  suspendedRetentionSeconds: 3_600,
};

class MemoryRepository implements SessionRepository {
  private readonly records = new Map<string, SessionRecord>();

  public async get(
    sessionId: string,
  ): Promise<SessionRecord | undefined> {
    return this.records.get(sessionId);
  }

  public async create(
    record: SessionRecord,
  ): Promise<CreateSessionResult> {
    this.records.set(record.sessionId, { ...record });
    return { created: true };
  }

  public async releaseWorkspace(): Promise<void> {}

  public async listForOwner(
    ownerHash: string,
  ): Promise<SessionRecord[]> {
    return [...this.records.values()].filter(
      (record) => record.ownerHash === ownerHash,
    );
  }

  public async listStateUpdatedBefore(
    state: SessionState,
  ): Promise<SessionRecord[]> {
    return [...this.records.values()].filter(
      (record) => record.state === state,
    );
  }

  public async patch(
    sessionId: string,
    values: Partial<SessionRecord>,
    expectedStates?: SessionState[],
  ): Promise<boolean> {
    const record = this.records.get(sessionId);
    if (
      !record ||
      (expectedStates && !expectedStates.includes(record.state))
    ) {
      return false;
    }
    this.records.set(sessionId, { ...record, ...values });
    return true;
  }
}

class StubMicrovms implements MicrovmService {
  public async run(): Promise<RunResult> {
    return {
      microvmId: 'mvm-1',
      state: 'RUNNING',
      endpoint: 'mvm-1.microvm.us-east-1.on.aws',
      imageArn: CONFIGURATION.imageArn,
      imageVersion: '1',
      maximumDurationInSeconds: 28_800,
      startedAt: 10_000,
    };
  }

  public async get(): Promise<MicrovmDescription> {
    return {
      microvmId: 'mvm-1',
      state: 'RUNNING',
      endpoint: 'mvm-1.microvm.us-east-1.on.aws',
    };
  }

  public async listForImage(): Promise<MicrovmListItem[]> {
    return [];
  }

  public async createShellConnection(): Promise<ShellConnection> {
    throw new Error('not used');
  }

  public async suspend(): Promise<void> {}

  public async resume(): Promise<void> {}

  public async terminate(): Promise<void> {}
}

class StubCheckpoints implements WorkspaceCheckpointService {
  public async createAccess(): Promise<WorkspaceCheckpointAccess> {
    return { uploadUrl: 'https://example.com/upload' };
  }
}
