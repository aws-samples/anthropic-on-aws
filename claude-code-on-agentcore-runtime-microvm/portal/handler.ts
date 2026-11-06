import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from 'aws-lambda';
import { PORTAL_HTML, PORTAL_JS } from './site.js';

let terminalVendorScript: string | undefined;
let terminalStylesheet: string | undefined;

// Serves the static portal page through the same private API Gateway as
// the control routes: no extra bucket, no CDN, unreachable outside the VPC
// endpoint. Mirrors claude-code-on-lambda-microvm/portal/handler.ts.
export async function handler(
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> {
  const resource = event.resource;
  if (event.httpMethod.toUpperCase() !== 'GET') {
    return response(405, 'text/plain', 'Method not allowed');
  }
  if (resource === '/portal') {
    return response(200, 'text/html; charset=utf-8', portalHtml(event));
  }
  if (resource === '/portal/app.js') {
    return response(200, 'application/javascript; charset=utf-8', PORTAL_JS);
  }
  if (resource === '/portal/terminal-vendor.js') {
    terminalVendorScript ??= [
      '/*! @xterm/xterm 6.0.0 and @xterm/addon-fit 0.11.0; MIT */',
      packageFile('@xterm/xterm/lib/xterm.js'),
      packageFile('@xterm/addon-fit/lib/addon-fit.js'),
    ].join('\n');
    return response(
      200,
      'application/javascript; charset=utf-8',
      terminalVendorScript,
      'public, max-age=31536000, immutable',
    );
  }
  if (resource === '/portal/xterm.css') {
    terminalStylesheet ??= packageFile('@xterm/xterm/css/xterm.css');
    return response(
      200,
      'text/css; charset=utf-8',
      terminalStylesheet,
      'public, max-age=31536000, immutable',
    );
  }
  if (resource === '/portal/config.json') {
    return response(
      200,
      'application/json',
      JSON.stringify({
        userPoolDomain: requiredEnvironment('PORTAL_USER_POOL_DOMAIN'),
        clientId: requiredEnvironment('PORTAL_CLIENT_ID'),
        redirectUri: portalUrl(event),
      }),
    );
  }
  return response(404, 'text/plain', 'Not found');
}

// Derived from the Host header the browser actually used, not from the
// API's own execute-api name: the OAuth redirect_uri has to match the
// origin the browser is on. Hitting the private API directly yields the
// same execute-api URL as before, but this also stays correct when the
// portal is fronted by a CDN or proxy (see README, "Public access").
function portalUrl(event: APIGatewayProxyEvent): string {
  const { stage } = event.requestContext;
  if (!stage) {
    throw new Error('Request context is missing stage');
  }
  const host = headerValue(event, 'host');
  if (!host) {
    throw new Error('Request is missing a Host header');
  }
  return `https://${host}/${stage}/portal`;
}

// Every asset/API reference in PORTAL_HTML/PORTAL_JS is a relative path
// ("app.js", "config.json", "sessions", ...). The browser resolves those
// against the *document's* URL, and "/v1/portal" (no trailing slash) is
// treated as a file, not a directory — relative resolution would otherwise
// land one level up, at "/v1/app.js" etc., which don't exist. A <base> tag
// with a trailing slash fixes every relative reference in one place,
// including fetch() calls, and stays correct regardless of stage name or
// whether the request came through the private API directly or a proxy/CDN
// in front of it (see README, "Public access").
function portalHtml(event: APIGatewayProxyEvent): string {
  const { stage } = event.requestContext;
  if (!stage) {
    throw new Error('Request context is missing stage');
  }
  return PORTAL_HTML.replace(
    '<head>',
    `<head>\n<base href="/${stage}/portal/">`,
  );
}

function headerValue(
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

function response(
  statusCode: number,
  contentType: string,
  body: string,
  cacheControl = 'no-store',
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'cache-control': cacheControl,
      'content-type': contentType,
      'referrer-policy': 'no-referrer',
      'strict-transport-security': 'max-age=31536000',
      'x-content-type-options': 'nosniff',
    },
    body,
  };
}

function packageFile(relativePath: string): string {
  return readFileSync(
    path.join(process.cwd(), 'node_modules', relativePath),
    'utf8',
  );
}

function requiredEnvironment(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
