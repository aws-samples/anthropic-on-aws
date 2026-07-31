import type { APIGatewayProxyEvent } from 'aws-lambda';
import { ControlError } from './service.js';

// Cognito-authenticated sessions are owned by the token subject.
// The oidc: prefix keeps that namespace disjoint from IAM caller
// ARNs used by the source-tree operator CLI.
export const PORTAL_OWNER_PREFIX = 'oidc:';

export function isPortalRoute(
  event: Pick<APIGatewayProxyEvent, 'resource'>,
): boolean {
  return (
    event.resource === '/portal' ||
    event.resource.startsWith('/portal/')
  );
}

export function portalRoutePath(resource: string): string {
  return resource.slice('/portal'.length);
}

export function portalRequestsLiveRefresh(
  event: Pick<
    APIGatewayProxyEvent,
    'resource' | 'queryStringParameters'
  >,
): boolean {
  return (
    isPortalRoute(event) &&
    event.queryStringParameters?.refresh === 'true'
  );
}

export function portalCaller(
  event: Pick<APIGatewayProxyEvent, 'requestContext'>,
): string {
  const claims: unknown =
    event.requestContext.authorizer?.claims;
  const rawSub =
    claims !== null &&
    typeof claims === 'object' &&
    'sub' in claims &&
    typeof (claims as Record<string, unknown>).sub === 'string'
      ? ((claims as Record<string, unknown>).sub as string)
      : undefined;
  const sub = rawSub?.trim();
  if (!sub) {
    throw new ControlError(
      403,
      'A Cognito-authenticated caller is required',
    );
  }
  return `${PORTAL_OWNER_PREFIX}${sub}`;
}
