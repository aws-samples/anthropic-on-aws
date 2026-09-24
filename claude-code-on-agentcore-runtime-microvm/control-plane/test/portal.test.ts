import { describe, expect, it } from 'vitest';
import type { APIGatewayProxyEvent } from 'aws-lambda';
import { isPortalRoute, portalCaller, portalRoutePath } from '../src/portal.js';
import { ControlError } from '../src/service.js';

describe('isPortalRoute', () => {
  it('matches the portal root and nested resources', () => {
    expect(isPortalRoute({ resource: '/portal' })).toBe(true);
    expect(isPortalRoute({ resource: '/portal/sessions' })).toBe(true);
    expect(
      isPortalRoute({ resource: '/portal/sessions/{sessionId}' }),
    ).toBe(true);
  });

  it('does not match the IAM-authorized operator routes', () => {
    expect(isPortalRoute({ resource: '/sessions' })).toBe(false);
    expect(isPortalRoute({ resource: '/sessions/{sessionId}' })).toBe(false);
  });
});

describe('portalRoutePath', () => {
  it('strips the /portal prefix so it matches the operator route table', () => {
    expect(portalRoutePath('/portal/sessions')).toBe('/sessions');
    expect(portalRoutePath('/portal/sessions/{sessionId}')).toBe(
      '/sessions/{sessionId}',
    );
  });
});

describe('portalCaller', () => {
  it('derives an oidc: owner from the Cognito authorizer claims', () => {
    const requestContext = {
      authorizer: { claims: { sub: 'user-123' } },
    } as unknown as APIGatewayProxyEvent['requestContext'];
    expect(portalCaller({ requestContext })).toBe('oidc:user-123');
  });

  it('rejects a request with no Cognito claims', () => {
    const requestContext =
      {} as unknown as APIGatewayProxyEvent['requestContext'];
    expect(() => portalCaller({ requestContext })).toThrow(ControlError);
    try {
      portalCaller({ requestContext });
    } catch (error) {
      expect((error as ControlError).statusCode).toBe(403);
    }
  });

  it('rejects a blank subject claim', () => {
    const requestContext = {
      authorizer: { claims: { sub: '   ' } },
    } as unknown as APIGatewayProxyEvent['requestContext'];
    expect(() => portalCaller({ requestContext })).toThrow(ControlError);
  });
});
