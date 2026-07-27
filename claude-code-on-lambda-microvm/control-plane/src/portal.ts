import type { APIGatewayProxyEvent } from 'aws-lambda';
import { ControlError } from './service.js';

// Portal-minted sessions are owned by the Cognito token subject.
// The oidc: prefix keeps that owner namespace disjoint from IAM
// caller ARNs (which always start with arn:), so a portal user and
// a CLI user can never hash to the same owner.
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
