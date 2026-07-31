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
  it('ships syntactically valid browser JavaScript', () => {
    expect(() => new Function(PORTAL_JS)).not.toThrow();
  });

  it('defaults new environments to VS Code access', () => {
    expect(PORTAL_HTML).toContain(
      'name="access-mode" value="vscode" checked',
    );
    expect(PORTAL_JS).toContain(
      "var accessMode = selected ? selected.value : 'vscode'",
    );
    expect(PORTAL_HTML).toContain(
      'name="new-tunnel-provider"\n                     value="microsoft" checked',
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
      "providerSelect.value = session.tunnelProvider || 'microsoft'",
    );
  });

  it('provides a mode-aware Connect action for running environments', () => {
    for (const id of [
      'terminal-dialog',
      'terminal-workspace',
      'terminal-session',
      'terminal-screen',
      'terminal-status-text',
      'terminal-reconnect',
    ]) {
      expect(PORTAL_HTML).toContain(`id="${id}"`);
    }
    expect(PORTAL_HTML).toContain('value="terminal"');
    expect(PORTAL_JS).toContain(
      "actions.append(actionButton('Connect'",
    );
    expect(PORTAL_JS).not.toContain(
      "actions.append(actionButton('Authenticate'",
    );
    expect(PORTAL_JS).toContain('openTerminalDialog(session)');
    expect(PORTAL_JS).toContain(
      "'/sessions/' + terminalSession.sessionId + '/connect'",
    );
    expect(PORTAL_JS).toContain(
      "'lambda-microvms.authentication.' + connection.shellToken",
    );
    expect(PORTAL_JS).toContain(
      '/usr/local/bin/developer-shell',
    );
    expect(PORTAL_JS).toContain('new ResizeObserver');
    expect(PORTAL_HTML).toContain(
      'src="portal/terminal-vendor.js?v=6.0.0"',
    );
    expect(PORTAL_HTML).toContain(
      'href="portal/xterm.css?v=6.0.0"',
    );
    expect(PORTAL_HTML).not.toContain('microvm connect');
    expect(PORTAL_JS).not.toContain('microvm connect');
    expect(PORTAL_JS).not.toMatch(
      /(?:sessionStorage|localStorage)\.setItem\([^)]*shellToken/,
    );
  });

  it('serves pinned terminal assets from the portal origin', async () => {
    const requestContext = { apiId: 'api-123', stage: 'v1' };
    const script = await handler({
      httpMethod: 'GET',
      resource: '/portal/terminal-vendor.js',
      requestContext,
    } as APIGatewayProxyEvent);
    const stylesheet = await handler({
      httpMethod: 'GET',
      resource: '/portal/xterm.css',
      requestContext,
    } as APIGatewayProxyEvent);

    expect(script.statusCode).toBe(200);
    expect(script.body).toContain('@xterm/xterm 6.0.0');
    expect(script.body).toContain('FitAddon');
    expect(script.headers).toMatchObject({
      'cache-control': 'public, max-age=31536000, immutable',
      'content-type': 'application/javascript; charset=utf-8',
    });
    expect(stylesheet.statusCode).toBe(200);
    expect(stylesheet.body).toContain('.xterm');
    expect(stylesheet.headers).toMatchObject({
      'cache-control': 'public, max-age=31536000, immutable',
      'content-type': 'text/css; charset=utf-8',
    });
  });

  it('provides an in-place restart workflow', () => {
    expect(PORTAL_JS).toContain(
      "actionButton('Restart'",
    );
    expect(PORTAL_JS).toContain(
      "await api('DELETE', '/sessions/' + session.sessionId)",
    );
    expect(PORTAL_JS).toContain(
      "await api('POST', '/sessions'",
    );
    expect(PORTAL_JS).toContain(
      "button.textContent = 'Restarting...'",
    );
  });

  it('performs explicit live refresh with visible progress', () => {
    expect(PORTAL_HTML).toContain('id="refresh-status"');
    expect(PORTAL_HTML).toContain('aria-live="polite"');
    expect(PORTAL_JS).toContain(
      "useLiveState ? '/sessions?refresh=true' : '/sessions'",
    );
    expect(PORTAL_JS).toContain(
      "button.textContent = 'Refreshing...'",
    );
    expect(PORTAL_JS).toContain(
      "'Updated ' + new Date().toLocaleTimeString()",
    );
  });

  it('hides tunnel identity controls for Terminal creation', () => {
    expect(PORTAL_JS).toContain(
      "el('new-provider-field').hidden = terminalAccess",
    );
    expect(PORTAL_JS).toContain(
      "el('new').classList.toggle('terminal-access', terminalAccess)",
    );
    expect(PORTAL_HTML).toContain(
      '#new, #new.terminal-access {\n' +
        '      grid-template-columns: 1fr;',
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
