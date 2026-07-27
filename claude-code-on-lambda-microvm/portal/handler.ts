import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from 'aws-lambda';
import { PORTAL_HTML, PORTAL_JS } from './site.js';

// Serves the static portal page through the same private API
// Gateway as the control routes: no extra bucket, no CloudFront,
// and the page stays unreachable outside the VPC endpoint.
export async function handler(
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> {
  const resource = event.resource;
  if (event.httpMethod.toUpperCase() !== 'GET') {
    return response(405, 'text/plain', 'Method not allowed');
  }
  if (resource === '/portal') {
    return response(200, 'text/html; charset=utf-8', PORTAL_HTML);
  }
  if (resource === '/portal/app.js') {
    return response(
      200,
      'application/javascript; charset=utf-8',
      PORTAL_JS,
    );
  }
  if (resource === '/portal/config.json') {
    return response(
      200,
      'application/json',
      JSON.stringify({
        userPoolDomain: requiredEnvironment(
          'PORTAL_USER_POOL_DOMAIN',
        ),
        clientId: requiredEnvironment('PORTAL_CLIENT_ID'),
        redirectUri: portalUrl(event),
      }),
    );
  }
  return response(404, 'text/plain', 'Not found');
}

function portalUrl(event: APIGatewayProxyEvent): string {
  const { apiId, stage } = event.requestContext;
  const region = process.env.AWS_REGION ?? 'us-east-1';
  if (!apiId || !stage) {
    throw new Error('Request context is missing apiId or stage');
  }
  return (
    `https://${apiId}.execute-api.${region}.amazonaws.com/` +
    `${stage}/portal`
  );
}

function response(
  statusCode: number,
  contentType: string,
  body: string,
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'cache-control': 'no-store',
      'content-type': contentType,
      'referrer-policy': 'no-referrer',
      'strict-transport-security': 'max-age=31536000',
      'x-content-type-options': 'nosniff',
    },
    body,
  };
}

function requiredEnvironment(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
