import type { APIGatewayProxyEvent } from 'aws-lambda';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { handler } from './handler.js';
import { PORTAL_HTML, PORTAL_JS } from './site.js';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('portal configuration', () => {
  it('returns the Cognito hosted UI SPA configuration', async () => {
    vi.stubEnv('AWS_REGION', 'us-east-1');
    vi.stubEnv(
      'PORTAL_USER_POOL_DOMAIN',
      'example-pool.auth.us-east-1.amazoncognito.com',
    );
    vi.stubEnv('PORTAL_CLIENT_ID', 'client-123');

    const result = await handler({
      httpMethod: 'GET',
      resource: '/portal/config.json',
      requestContext: {
        apiId: 'api-123',
        stage: 'v1',
      },
    } as APIGatewayProxyEvent);

    expect(JSON.parse(result.body)).toEqual({
      userPoolDomain:
        'example-pool.auth.us-east-1.amazoncognito.com',
      clientId: 'client-123',
      redirectUri:
        'https://api-123.execute-api.us-east-1.amazonaws.com/v1/portal',
    });
    expect(result.headers).toMatchObject({
      'cache-control': 'no-store',
      'referrer-policy': 'no-referrer',
    });
  });
});

describe('portal tunnel authentication UI', () => {
  it('defaults new environments to VS Code access', () => {
    expect(PORTAL_HTML).toContain(
      'name="access-mode" value="vscode" checked',
    );
    expect(PORTAL_JS).toContain(
      "var accessMode = selected ? selected.value : 'vscode'",
    );
    expect(PORTAL_HTML).toContain(
      'name="new-tunnel-provider"\n                     value="github" checked',
    );
  });

  it('includes device approval controls without external scripts', () => {
    for (const id of [
      'tunnel-dialog',
      'verification-link',
      'device-code',
      'copy-code',
      'open-vscode',
    ]) {
      expect(PORTAL_HTML).toContain(`id="${id}"`);
    }
    expect(PORTAL_HTML).not.toMatch(
      /<script[^>]+src=["']https?:/i,
    );
    expect(PORTAL_JS).toContain("'/tunnel-login'");
    expect(PORTAL_JS).toContain(
      "status === 'READY' && !sameProvider",
    );
    expect(PORTAL_JS).toContain(
      "'Switch to ' + providerLabel(desiredProvider)",
    );
  });

  it('renders the MicroVM image and provider on each session row', () => {
    expect(PORTAL_HTML).toContain('<th>Image</th>');
    expect(PORTAL_HTML).toContain('<th>Tunnel login</th>');
    expect(PORTAL_JS).toContain(
      "'Image ' + session.imageVersion",
    );
    expect(PORTAL_JS).toContain(
      "providerSelect.value = session.tunnelProvider || 'github'",
    );
  });

  it('uses the Cognito hosted UI authorization code flow with PKCE', () => {
    expect(PORTAL_JS).toContain(
      "'https://' + cfg.userPoolDomain + '/oauth2/'",
    );
    expect(PORTAL_JS).toContain(
      "hostedUiUrl(cfg, 'authorize')",
    );
    expect(PORTAL_JS).toContain(
      "hostedUiUrl(cfg, 'token')",
    );
    expect(PORTAL_JS).toContain(
      "scope: 'openid profile email'",
    );
    expect(PORTAL_JS).toContain(
      '{ authorization: idToken() }',
    );
    expect(PORTAL_JS).toContain(
      "if (!expectedState || params.get('state') !== expectedState)",
    );
    expect(PORTAL_JS).toContain(
      "if (!verifier) {",
    );
    expect(PORTAL_HTML).toContain(
      'Sign in with your Amazon Cognito user',
    );
    expect(PORTAL_JS).not.toContain('identity_provider');
    expect(PORTAL_JS).not.toContain('login.microsoftonline.com');
  });

  it('never persists tunnel device codes in browser storage', () => {
    expect(PORTAL_JS).not.toMatch(
      /(?:sessionStorage|localStorage)\.[^(]+\([^)]*(?:device|userCode)/i,
    );
    expect(PORTAL_JS).not.toContain(
      "sessionStorage.setItem('device",
    );
  });
});
