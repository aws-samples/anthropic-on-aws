// Small, dependency-free HTTP helpers shared by the control-plane
// handler. Kept out of handler.ts (which constructs real AWS SDK
// clients and reads required environment variables at module load
// time) so these pure functions stay unit-testable without needing a
// full Lambda environment set up just to import them.
import type { APIGatewayProxyEvent } from 'aws-lambda';

export function headerValue(
  event: APIGatewayProxyEvent,
  name: string,
): string | undefined {
  for (const [key, value] of Object.entries(event.headers ?? {})) {
    if (key.toLowerCase() === name && value) {
      return value;
    }
  }
  return undefined;
}

// Strips the "Bearer " scheme prefix so the result is a bare JWT, not a
// full Authorization header value.
export function bearerToken(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const match = /^Bearer\s+(.+)$/i.exec(value.trim());
  return match ? match[1] : value;
}

// The caller's Cognito *access* token (not the ID token used for this
// request's own Authorization/Cognito-authorizer header) -- carries the
// non-empty OAuth `scope` claim AgentCore Gateway's Cognito authorizer
// requires. Confirmed live: a validly-signed Cognito ID token is
// accepted by Gateway's JWT validation layer but then rejected with
// HTTP 403 "insufficient_scope", because OIDC ID tokens never carry a
// scope claim at all. Sent by the portal (portal/site.ts) as a plain
// value in this header, not prefixed with "Bearer " the way
// Authorization is, so no stripping is needed here -- but accept either
// shape defensively.
export function accessIdToken(event: APIGatewayProxyEvent): string | undefined {
  return bearerToken(headerValue(event, 'x-cognito-access-token'));
}
