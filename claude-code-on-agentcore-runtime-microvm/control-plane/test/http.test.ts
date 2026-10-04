import { describe, expect, it } from 'vitest';
import type { APIGatewayProxyEvent } from 'aws-lambda';
import { accessIdToken, bearerToken } from '../src/http.js';

function eventWithHeaders(
  headers: Record<string, string>,
): APIGatewayProxyEvent {
  return { headers } as unknown as APIGatewayProxyEvent;
}

describe('bearerToken', () => {
  it('strips the Bearer scheme prefix', () => {
    expect(bearerToken('Bearer abc.def.ghi')).toBe('abc.def.ghi');
  });

  it('is case-insensitive on the scheme name', () => {
    expect(bearerToken('bearer abc.def.ghi')).toBe('abc.def.ghi');
  });

  it('returns the raw value unchanged if there is no Bearer prefix', () => {
    expect(bearerToken('abc.def.ghi')).toBe('abc.def.ghi');
  });

  it('returns undefined for an empty/undefined value', () => {
    expect(bearerToken(undefined)).toBeUndefined();
    expect(bearerToken('')).toBeUndefined();
  });
});

describe('accessIdToken', () => {
  // Caught live: AgentCore Gateway's Cognito authorizer accepts a
  // validly-signed Cognito *ID* token (same issuer/audience) but then
  // rejects it with HTTP 403 "insufficient_scope", because OIDC ID
  // tokens never carry an OAuth scope claim. The portal
  // (portal/site.ts) sends the *access* token in this separate header
  // instead of the "Authorization" header, which must stay the ID
  // token for API Gateway's own Cognito authorizer to accept the
  // request in the first place. This test pins reading the right
  // header.
  it('reads the x-cognito-access-token header, not Authorization', () => {
    const event = eventWithHeaders({
      Authorization: 'Bearer id-token-value',
      'x-cognito-access-token': 'access-token-value',
    });
    expect(accessIdToken(event)).toBe('access-token-value');
  });

  it('strips a Bearer prefix if present, defensively', () => {
    const event = eventWithHeaders({
      'x-cognito-access-token': 'Bearer access-token-value',
    });
    expect(accessIdToken(event)).toBe('access-token-value');
  });

  it('returns undefined when the header is absent', () => {
    expect(accessIdToken(eventWithHeaders({}))).toBeUndefined();
  });
});
