// Static portal assets served by portal/handler.ts through the private API.
// Plain template strings keep the portal free of CDN and build dependencies.

export const PORTAL_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Claude MicroVM portal</title>
<link rel="icon" href="data:,">
<style>
  :root {
    color-scheme: light;
    --bg: #f5f7f8;
    --surface: #ffffff;
    --surface-muted: #eef2f3;
    --text: #182126;
    --muted: #5c6970;
    --line: #d7dfe2;
    --accent: #006d77;
    --accent-dark: #00535b;
    --danger: #b42318;
    --success: #247a42;
    --warning: #96620a;
    --focus: #2b7de9;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-width: 20rem;
    background: var(--bg);
    color: var(--text);
    font: 14px/1.45 system-ui, -apple-system, BlinkMacSystemFont,
      "Segoe UI", sans-serif;
  }
  button, input, select { font: inherit; }
  button, .button-link {
    min-height: 2.25rem;
    border: 1px solid var(--line);
    border-radius: 4px;
    background: var(--surface);
    color: var(--text);
    cursor: pointer;
    padding: .45rem .75rem;
    text-decoration: none;
    white-space: nowrap;
  }
  button:hover, .button-link:hover { background: var(--surface-muted); }
  button:focus-visible, input:focus-visible, select:focus-visible,
  a:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--focus) 32%, transparent);
    outline-offset: 2px;
  }
  button:disabled { cursor: default; opacity: .55; }
  .primary {
    border-color: var(--accent);
    background: var(--accent);
    color: #fff;
  }
  .primary:hover { background: var(--accent-dark); }
  .danger { border-color: #e5aaa5; color: var(--danger); }
  .quiet { background: transparent; }
  .topbar {
    display: flex;
    min-height: 3.75rem;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    border-bottom: 1px solid var(--line);
    background: var(--surface);
    padding: .65rem clamp(1rem, 4vw, 2.5rem);
  }
  .brand { display: flex; align-items: center; gap: .7rem; min-width: 0; }
  .brand-mark {
    display: grid;
    width: 2rem;
    height: 2rem;
    flex: 0 0 auto;
    place-items: center;
    border-radius: 4px;
    background: var(--accent);
    color: #fff;
    font-size: .72rem;
    font-weight: 750;
  }
  h1, h2 { margin: 0; letter-spacing: 0; }
  h1 { font-size: 1rem; font-weight: 680; }
  h2 { font-size: 1rem; font-weight: 680; }
  .identity {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: .65rem;
  }
  #who {
    max-width: 18rem;
    overflow: hidden;
    color: var(--muted);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .shell { width: min(76rem, 100%); margin: 0 auto; padding: 1.4rem; }
  .error {
    margin: 0 0 1rem;
    border-left: 3px solid var(--danger);
    background: #fff1f0;
    color: #7a271a;
    padding: .65rem .8rem;
  }
  .signin-panel {
    width: min(30rem, 100%);
    margin-top: 3rem;
  }
  .signin-panel h2 { margin-bottom: .4rem; font-size: 1.15rem; }
  .signin-panel p { margin: 0 0 1.1rem; color: var(--muted); }
  .create-bar {
    border-bottom: 1px solid var(--line);
    padding-bottom: 1.15rem;
  }
  #new {
    display: grid;
    grid-template-columns: minmax(14rem, 1fr) auto auto auto;
    align-items: end;
    gap: .8rem;
  }
  #new.terminal-access {
    grid-template-columns: minmax(14rem, 1fr) auto auto;
  }
  .field { display: grid; gap: .32rem; min-width: 0; }
  .field-label, legend {
    color: var(--muted);
    font-size: .76rem;
    font-weight: 650;
  }
  input[type="text"] {
    width: 100%;
    min-height: 2.35rem;
    border: 1px solid #aebbc0;
    border-radius: 4px;
    background: var(--surface);
    color: var(--text);
    padding: .45rem .6rem;
  }
  fieldset { min-width: 0; margin: 0; border: 0; padding: 0; }
  fieldset:disabled { opacity: .55; }
  legend { margin-bottom: .32rem; padding: 0; }
  .segments {
    display: grid;
    grid-auto-columns: minmax(5.75rem, 1fr);
    grid-auto-flow: column;
    min-height: 2.35rem;
    overflow: hidden;
    border: 1px solid #aebbc0;
    border-radius: 4px;
    background: var(--surface);
  }
  .segments label {
    display: grid;
    place-items: center;
    cursor: pointer;
    padding: .4rem .65rem;
    white-space: nowrap;
  }
  .segments label + label { border-left: 1px solid var(--line); }
  .segments input { position: absolute; opacity: 0; pointer-events: none; }
  .segments label:has(input:checked) {
    background: #dceff0;
    color: #004d54;
    font-weight: 680;
  }
  .segments label:has(input:focus-visible) {
    outline: 3px solid color-mix(in srgb, var(--focus) 32%, transparent);
    outline-offset: -3px;
  }
  .sessions-section { padding-top: 1.3rem; }
  .section-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: .75rem;
    margin-bottom: .55rem;
  }
  .refresh-controls {
    display: flex;
    min-height: 2.25rem;
    align-items: center;
    gap: .65rem;
  }
  .refresh-controls button { min-width: 7rem; }
  .refresh-status {
    color: var(--muted);
    font-size: .78rem;
    text-align: right;
  }
  .table-scroll {
    overflow-x: auto;
    border-top: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
    background: var(--surface);
  }
  table {
    width: 100%;
    min-width: 64rem;
    border-collapse: collapse;
  }
  th, td {
    text-align: left;
    vertical-align: middle;
    padding: .75rem .8rem;
    border-bottom: 1px solid var(--line);
  }
  tbody tr:last-child td { border-bottom: 0; }
  th {
    background: #e9eef0;
    color: #435158;
    font-size: .72rem;
    font-weight: 700;
    text-transform: uppercase;
  }
  td:last-child, th:last-child { text-align: right; }
  .workspace-name { display: block; font-weight: 680; }
  .session-detail {
    display: block;
    max-width: 24rem;
    margin-top: .16rem;
    overflow: hidden;
    color: var(--muted);
    font: .75rem/1.3 ui-monospace, SFMono-Regular, Consolas, monospace;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .badge {
    display: inline-flex;
    min-height: 1.45rem;
    align-items: center;
    border-radius: 999px;
    background: var(--surface-muted);
    color: #425158;
    font-size: .72rem;
    font-weight: 700;
    padding: .15rem .55rem;
  }
  .badge.RUNNING { background: #e1f3e7; color: var(--success); }
  .badge.SUSPENDED, .badge.SUSPENDING {
    background: #fff2d5;
    color: var(--warning);
  }
  .badge.FAILED, .badge.TERMINATED, .badge.TERMINATING {
    background: #fde8e7;
    color: var(--danger);
  }
  .access-label { color: #3f4e54; text-transform: capitalize; }
  .image-version {
    color: #3f4e54;
    font: .78rem/1.3 ui-monospace, SFMono-Regular, Consolas, monospace;
    white-space: nowrap;
  }
  .provider-select {
    min-width: 7.5rem;
    min-height: 2rem;
    border: 1px solid #aebbc0;
    border-radius: 4px;
    background: var(--surface);
    color: var(--text);
    padding: .25rem 1.6rem .25rem .45rem;
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: .4rem;
  }
  .actions button { min-height: 2rem; padding: .3rem .55rem; }
  .empty { margin: 1rem 0; color: var(--muted); }
  dialog {
    width: min(31rem, calc(100% - 2rem));
    max-height: calc(100vh - 2rem);
    overflow: auto;
    border: 1px solid #aebbc0;
    border-radius: 6px;
    background: var(--surface);
    color: var(--text);
    padding: 0;
    box-shadow: 0 18px 50px #18212638;
  }
  dialog::backdrop { background: #18212680; }
  #terminal-dialog {
    width: min(72rem, calc(100% - 2rem));
    height: min(48rem, calc(100vh - 2rem));
    overflow: hidden;
  }
  #terminal-dialog[open] {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
  }
  .dialog-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    border-bottom: 1px solid var(--line);
    padding: .9rem 1rem;
  }
  .dialog-body { padding: 1rem; }
  .tunnel-summary { margin: 0 0 1rem; }
  .tunnel-summary strong { display: block; }
  .tunnel-summary code { color: var(--muted); }
  .dialog-head-actions {
    display: flex;
    align-items: center;
    gap: .55rem;
  }
  .terminal-status {
    display: flex;
    align-items: center;
    gap: .45rem;
    color: var(--muted);
    font-size: .78rem;
    white-space: nowrap;
  }
  .terminal-body {
    display: grid;
    min-height: 0;
    grid-template-rows: auto minmax(18rem, 1fr);
    gap: .65rem;
    padding: .75rem;
  }
  .terminal-context {
    display: flex;
    min-width: 0;
    align-items: baseline;
    gap: .55rem;
  }
  .terminal-context strong {
    flex: 0 0 auto;
  }
  .terminal-context code {
    display: block;
    min-width: 0;
    overflow: hidden;
    color: var(--muted);
    font-size: .75rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  #terminal-screen {
    min-width: 0;
    min-height: 18rem;
    overflow: hidden;
    border: 1px solid #354146;
    border-radius: 4px;
    background: #101416;
    padding: .55rem;
  }
  #terminal-screen .xterm {
    height: 100%;
  }
  #terminal-screen .xterm-viewport {
    scrollbar-color: #66777d #101416;
  }
  .auth-state {
    margin: 1rem -1rem;
    border-top: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
    background: var(--surface-muted);
    padding: .75rem 1rem;
  }
  .status-line { display: flex; align-items: center; gap: .55rem; }
  .status-dot {
    width: .55rem;
    height: .55rem;
    flex: 0 0 auto;
    border-radius: 50%;
    background: #87959b;
  }
  .status-dot.active {
    background: var(--accent);
    box-shadow: 0 0 0 4px #bde0e333;
  }
  .status-dot.ready { background: var(--success); }
  .status-dot.failed { background: var(--danger); }
  #tunnel-failure { margin: .35rem 0 0 1.1rem; color: var(--danger); }
  .device-fields {
    display: grid;
    gap: .8rem;
    margin-bottom: 1rem;
  }
  .device-fields a { color: var(--accent-dark); overflow-wrap: anywhere; }
  .code-line {
    display: flex;
    align-items: stretch;
    gap: .5rem;
  }
  #device-code {
    display: grid;
    min-height: 2.5rem;
    flex: 1;
    place-items: center;
    border: 1px solid #aebbc0;
    border-radius: 4px;
    background: #f8fafb;
    font: 700 1.15rem/1 ui-monospace, SFMono-Regular, Consolas, monospace;
    overflow-wrap: anywhere;
    padding: .55rem;
  }
  .dialog-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: .5rem;
    border-top: 1px solid var(--line);
    padding-top: 1rem;
  }
  [hidden] { display: none !important; }
  @media (max-width: 44rem) {
    .topbar { align-items: flex-start; padding: .7rem 1rem; }
    .identity { align-items: flex-end; flex-direction: column; gap: .35rem; }
    #who { max-width: 11rem; }
    .shell { padding: 1rem; }
    #new, #new.terminal-access {
      grid-template-columns: 1fr;
      align-items: stretch;
    }
    #new button { width: 100%; }
    .dialog-actions > * { flex: 1 1 auto; text-align: center; }
    #terminal-dialog {
      width: calc(100% - 1rem);
      height: calc(100vh - 1rem);
    }
    .dialog-head { align-items: flex-start; }
    .dialog-head-actions { flex-wrap: wrap; justify-content: flex-end; }
    .terminal-status { order: 3; width: 100%; justify-content: flex-end; }
    .terminal-context code { display: none; }
  }
</style>
</head>
<body>
<header class="topbar">
  <div class="brand">
    <span class="brand-mark" aria-hidden="true">CM</span>
    <h1>Claude MicroVM environments</h1>
  </div>
  <div class="identity">
    <span id="who"></span>
    <button id="signout" class="quiet" type="button" hidden>Sign out</button>
  </div>
</header>
<div class="shell">
  <p id="error" class="error" role="alert" hidden></p>
  <main id="signin" class="signin-panel" hidden>
    <h2>Private development environments</h2>
    <p>Sign in with your Amazon Cognito user to continue.</p>
    <button id="login" class="primary" type="button">Sign in</button>
  </main>
  <main id="app" hidden>
    <section class="create-bar" aria-label="Create environment">
      <form id="new">
        <label class="field" for="workspace">
          <span class="field-label">Workspace</span>
          <input id="workspace" name="workspace" type="text"
                 placeholder="payments-api"
                 pattern="[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}" required>
        </label>
        <fieldset>
          <legend>Access</legend>
          <div class="segments">
            <label>
              <input type="radio" name="access-mode" value="vscode" checked>
              VS Code
            </label>
            <label>
              <input type="radio" name="access-mode" value="terminal">
              Terminal
            </label>
          </div>
        </fieldset>
        <fieldset id="new-provider-field">
          <legend>Tunnel login</legend>
          <div class="segments">
            <label>
              <input type="radio" name="new-tunnel-provider"
                     value="github">
              GitHub
            </label>
            <label>
              <input type="radio" name="new-tunnel-provider"
                     value="microsoft" checked>
              Microsoft
            </label>
          </div>
        </fieldset>
        <button id="create" class="primary" type="submit">Create environment</button>
      </form>
    </section>
    <section class="sessions-section" aria-labelledby="environments-title">
      <div class="section-heading">
        <h2 id="environments-title">Environments</h2>
        <div class="refresh-controls">
          <span id="refresh-status" class="refresh-status"
                role="status" aria-live="polite"></span>
          <button id="refresh" class="quiet" type="button">Refresh</button>
        </div>
      </div>
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Workspace</th>
              <th>Access</th>
              <th>Image</th>
              <th>Tunnel login</th>
              <th>State</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="sessions"></tbody>
        </table>
      </div>
      <p id="empty" class="empty" hidden>No environments found.</p>
    </section>
  </main>
</div>

<dialog id="terminal-dialog" aria-labelledby="terminal-title">
  <div class="dialog-head">
    <h2 id="terminal-title">Terminal</h2>
    <div class="dialog-head-actions">
      <span class="terminal-status" role="status" aria-live="polite">
        <span id="terminal-status-dot" class="status-dot"
              aria-hidden="true"></span>
        <span id="terminal-status-text">Disconnected</span>
      </span>
      <button id="terminal-reconnect" type="button" hidden>Reconnect</button>
      <button id="terminal-close" class="quiet" type="button">Close</button>
    </div>
  </div>
  <div class="terminal-body">
    <div class="terminal-context">
      <strong id="terminal-workspace"></strong>
      <code id="terminal-session"></code>
    </div>
    <div id="terminal-screen" aria-label="MicroVM terminal"></div>
  </div>
</dialog>

<dialog id="tunnel-dialog" aria-labelledby="tunnel-title">
  <div class="dialog-head">
    <h2 id="tunnel-title">Connect with VS Code</h2>
    <button id="tunnel-close" class="quiet" type="button">Close</button>
  </div>
  <div class="dialog-body">
    <p class="tunnel-summary">
      <strong id="tunnel-workspace"></strong>
      <code id="tunnel-name"></code>
    </p>
    <fieldset id="provider-field">
      <legend>Identity provider</legend>
      <div class="segments">
        <label>
          <input type="radio" name="tunnel-provider" value="github">
          GitHub
        </label>
        <label>
          <input type="radio" name="tunnel-provider" value="microsoft" checked>
          Microsoft
        </label>
      </div>
    </fieldset>
    <div class="auth-state" aria-live="polite">
      <div class="status-line">
        <span id="status-dot" class="status-dot" aria-hidden="true"></span>
        <strong id="tunnel-status">Not started</strong>
      </div>
      <p id="tunnel-failure" hidden></p>
    </div>
    <div id="device-fields" class="device-fields" hidden>
      <div class="field">
        <span class="field-label">Verification page</span>
        <a id="verification-link" target="_blank" rel="noopener noreferrer"></a>
      </div>
      <div class="field">
        <span class="field-label">Device code</span>
        <div class="code-line">
          <code id="device-code"></code>
          <button id="copy-code" type="button">Copy</button>
        </div>
      </div>
    </div>
    <div class="dialog-actions">
      <button id="tunnel-cancel" class="danger" type="button" hidden>Cancel</button>
      <button id="tunnel-start" class="primary" type="button">Start authentication</button>
      <a id="open-vscode" class="button-link primary" hidden>Open in VS Code</a>
    </div>
  </div>
</dialog>
<link rel="stylesheet" href="portal/xterm.css?v=6.0.0">
<script src="portal/terminal-vendor.js?v=6.0.0"></script>
<script src="portal/app.js"></script>
</body>
</html>
`;

export const PORTAL_JS = `'use strict';

var pageUrl = location.origin +
  location.pathname.replace(/[/]+$/, '');
var configPromise;
var refreshPromise;
var refreshIsLive = false;
var terminalSession;
var terminal;
var terminalFitAddon;
var terminalSocket;
var terminalDataSubscription;
var terminalBinarySubscription;
var terminalResizeObserver;
var terminalStartTimer;
var terminalInitialized = false;
var terminalGeneration = 0;
var tunnelSession;
var tunnelJob;
var tunnelPollTimer;

function el(id) { return document.getElementById(id); }

function config() {
  configPromise = configPromise ||
    fetch(pageUrl + '/config.json').then(function (res) {
      if (!res.ok) { throw new Error('Unable to load portal config'); }
      return res.json();
    });
  return configPromise;
}

function base64Url(bytes) {
  var text = '';
  new Uint8Array(bytes).forEach(function (byte) {
    text += String.fromCharCode(byte);
  });
  return btoa(text)
    .replace(/[+]/g, '-').replace(/[/]/g, '_').replace(/=+$/, '');
}

function idToken() { return sessionStorage.getItem('portalIdToken'); }

function hostedUiUrl(cfg, endpoint) {
  return 'https://' + cfg.userPoolDomain + '/oauth2/' + endpoint;
}

function claims() {
  var token = idToken();
  if (!token) { return null; }
  try {
    var encoded = token.split('.')[1]
      .replace(/-/g, '+').replace(/_/g, '/');
    encoded += '='.repeat((4 - encoded.length % 4) % 4);
    return JSON.parse(atob(encoded));
  } catch (error) { return null; }
}

function signedIn() {
  var current = claims();
  return Boolean(current && current.exp * 1000 > Date.now());
}

function signOut() {
  stopTunnelPoll();
  if (el('terminal-dialog').open) { el('terminal-dialog').close(); }
  if (el('tunnel-dialog').open) { el('tunnel-dialog').close(); }
  sessionStorage.removeItem('portalIdToken');
  sessionStorage.removeItem('portalVerifier');
  sessionStorage.removeItem('portalState');
  render();
}

async function login() {
  var cfg = await config();
  var verifier = base64Url(crypto.getRandomValues(new Uint8Array(32)));
  var digest = await crypto.subtle.digest(
    'SHA-256', new TextEncoder().encode(verifier));
  var state = base64Url(crypto.getRandomValues(new Uint8Array(16)));
  sessionStorage.setItem('portalVerifier', verifier);
  sessionStorage.setItem('portalState', state);
  var authorize = {
      response_type: 'code',
      client_id: cfg.clientId,
      redirect_uri: cfg.redirectUri,
      scope: 'openid profile email',
      state: state,
      code_challenge_method: 'S256',
      code_challenge: base64Url(digest),
    };
  location.assign(
    hostedUiUrl(cfg, 'authorize') + '?' +
      new URLSearchParams(authorize));
}

async function completeLogin() {
  var params = new URLSearchParams(location.search);
  var code = params.get('code');
  var oauthError = params.get('error');
  if (!code && !oauthError) { return; }
  history.replaceState(null, '', location.pathname);
  var expectedState = sessionStorage.getItem('portalState');
  if (!expectedState || params.get('state') !== expectedState) {
    throw new Error('Sign-in state mismatch; try again');
  }
  if (oauthError) {
    throw new Error(
      'Sign-in failed: ' +
      (params.get('error_description') || oauthError));
  }
  var cfg = await config();
  var verifier = sessionStorage.getItem('portalVerifier');
  if (!verifier) {
    throw new Error('Sign-in session expired; try again');
  }
  var res = await fetch(
    hostedUiUrl(cfg, 'token'), {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: cfg.clientId,
        redirect_uri: cfg.redirectUri,
        code: code,
        code_verifier: verifier,
      }),
    });
  var tokens = await res.json();
  if (!res.ok || !tokens.id_token) {
    throw new Error('Token exchange failed: ' +
      (tokens.error || res.status));
  }
  sessionStorage.setItem('portalIdToken', tokens.id_token);
  sessionStorage.removeItem('portalVerifier');
  sessionStorage.removeItem('portalState');
}

async function api(method, path, body) {
  var res = await fetch(pageUrl + path, {
    method: method,
    headers: Object.assign(
      { authorization: idToken() },
      body ? { 'content-type': 'application/json' } : {}),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) {
    signOut();
    throw new Error('Session expired; sign in again');
  }
  var data = await res.json().catch(function () { return {}; });
  if (!res.ok) {
    var error = new Error(
      data.message || ('Request failed: ' + res.status));
    error.status = res.status;
    throw error;
  }
  return data;
}

function showError(error) {
  el('error').textContent = error && error.message
    ? error.message : String(error);
  el('error').hidden = false;
}

function clearError() {
  el('error').textContent = '';
  el('error').hidden = true;
}

async function action(method, path, body) {
  clearError();
  try {
    var result = await api(method, path, body);
    await refresh();
    return result;
  } catch (error) {
    showError(error);
    return undefined;
  }
}

async function restartEnvironment(session, button) {
  if (!confirm('Restart ' + session.workspaceId + '?')) { return; }
  clearError();
  button.disabled = true;
  button.textContent = 'Restarting...';
  try {
    await api('DELETE', '/sessions/' + session.sessionId);
    var deadline = Date.now() + 120000;
    var stopped = false;
    while (Date.now() < deadline) {
      var current = await api(
        'GET', '/sessions/' + session.sessionId);
      if (
        current.state === 'TERMINATED' ||
        current.state === 'FAILED'
      ) {
        stopped = true;
        break;
      }
      await new Promise(function (resolve) {
        setTimeout(resolve, 2000);
      });
    }
    if (!stopped) {
      throw new Error('Timed out waiting for the environment to stop');
    }
    await api('POST', '/sessions', {
      workspaceId: session.workspaceId,
      accessMode: session.accessMode || 'terminal',
      inferenceMode: session.inferenceMode,
      tunnelProvider: session.accessMode === 'vscode'
        ? session.tunnelProvider : undefined
    });
    await refresh(true);
  } catch (error) {
    showError(error);
  } finally {
    button.disabled = false;
    button.textContent = 'Restart';
  }
}

function sessionRow(session) {
  var row = document.createElement('tr');
  var workspaceCell = document.createElement('td');
  var name = document.createElement('span');
  name.className = 'workspace-name';
  name.textContent = session.workspaceId;
  var detail = document.createElement('span');
  detail.className = 'session-detail';
  detail.textContent = session.tunnelName || session.sessionId;
  detail.title = session.tunnelName || session.sessionId;
  workspaceCell.append(name, detail);
  row.append(workspaceCell);

  var accessCell = document.createElement('td');
  var access = document.createElement('span');
  access.className = 'access-label';
  access.textContent =
    session.accessMode === 'vscode' ? 'VS Code' : 'Terminal';
  accessCell.append(access);
  row.append(accessCell);

  var imageCell = document.createElement('td');
  var imageVersion = document.createElement('span');
  imageVersion.className = 'image-version';
  imageVersion.textContent = session.imageVersion
    ? 'Image ' + session.imageVersion
    : (session.state === 'PROVISIONING' || session.state === 'STARTING'
        ? 'Pending' : 'Not recorded');
  imageCell.append(imageVersion);
  row.append(imageCell);

  var providerCell = document.createElement('td');
  var providerSelect;
  if (session.accessMode === 'vscode') {
    providerSelect = document.createElement('select');
    providerSelect.className = 'provider-select';
    providerSelect.setAttribute(
      'aria-label', 'Tunnel login for ' + session.workspaceId);
    ['github', 'microsoft'].forEach(function (provider) {
      var option = document.createElement('option');
      option.value = provider;
      option.textContent =
        provider === 'github' ? 'GitHub' : 'Microsoft';
      providerSelect.append(option);
    });
    providerSelect.value = session.tunnelProvider || 'microsoft';
    providerSelect.disabled = session.state !== 'RUNNING';
    providerSelect.addEventListener('change', function () {
      var requestedProvider = providerSelect.value;
      providerSelect.value = session.tunnelProvider || 'microsoft';
      openTunnelDialog(session, requestedProvider);
    });
    providerCell.append(providerSelect);
  } else {
    providerCell.textContent = '-';
  }
  row.append(providerCell);

  var stateCell = document.createElement('td');
  stateCell.append(badge(session.state));
  row.append(stateCell);

  var updatedCell = document.createElement('td');
  updatedCell.textContent =
    new Date(session.updatedAt * 1000).toLocaleString();
  row.append(updatedCell);

  var actionCell = document.createElement('td');
  var actions = document.createElement('div');
  actions.className = 'actions';
  if (session.state === 'RUNNING') {
    if (session.accessMode === 'vscode' && session.tunnelName) {
      actions.append(actionButton('Connect', function () {
        openTunnelDialog(
          session,
          providerSelect ? providerSelect.value : undefined);
      }, 'primary'));
    } else if (session.accessMode !== 'vscode') {
      actions.append(actionButton('Connect', function () {
        openTerminalDialog(session);
      }, 'primary'));
    }
  }
  if (session.state === 'RUNNING') {
    actions.append(actionButton('Suspend', function () {
      action('POST', '/sessions/' + session.sessionId + '/suspend');
    }));
  }
  if (session.state === 'SUSPENDED') {
    actions.append(actionButton('Resume', function () {
      action('POST', '/sessions/' + session.sessionId + '/resume');
    }));
  }
  if (
    session.state === 'RUNNING' ||
    session.state === 'SUSPENDED' ||
    session.state === 'FAILED'
  ) {
    var restartButton = actionButton('Restart', function () {
      restartEnvironment(session, restartButton);
    });
    actions.append(restartButton);
  }
  if (session.state !== 'TERMINATED') {
    actions.append(actionButton('Terminate', function () {
      if (confirm('Terminate ' + session.workspaceId + '?')) {
        action('DELETE', '/sessions/' + session.sessionId);
      }
    }, 'danger'));
  }
  actionCell.append(actions);
  row.append(actionCell);
  return row;
}

function actionButton(label, listener, className) {
  var button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  if (className) { button.className = className; }
  button.addEventListener('click', listener);
  return button;
}

function badge(state) {
  var span = document.createElement('span');
  span.className = 'badge ' + state;
  span.textContent = state;
  return span;
}

async function refresh(live) {
  if (!signedIn()) { return; }
  var useLiveState = live === true;
  if (refreshPromise) {
    if (!useLiveState || refreshIsLive) { return refreshPromise; }
    return refreshPromise.then(function () { return refresh(true); });
  }
  refreshIsLive = useLiveState;
  refreshPromise = api(
    'GET',
    useLiveState ? '/sessions?refresh=true' : '/sessions')
    .then(function (data) {
      var body = el('sessions');
      body.replaceChildren();
      data.sessions.forEach(function (session) {
        body.append(sessionRow(session));
      });
      el('empty').hidden = data.sessions.length !== 0;
    })
    .finally(function () {
      refreshPromise = undefined;
      refreshIsLive = false;
    });
  return refreshPromise;
}

async function manualRefresh() {
  var button = el('refresh');
  var status = el('refresh-status');
  clearError();
  button.disabled = true;
  button.textContent = 'Refreshing...';
  status.textContent = 'Checking live state...';
  try {
    await refresh(true);
    status.textContent =
      'Updated ' + new Date().toLocaleTimeString();
  } catch (error) {
    status.textContent = 'Refresh failed';
    showError(error);
  } finally {
    button.disabled = false;
    button.textContent = 'Refresh';
  }
}

function render() {
  var authenticated = signedIn();
  el('signin').hidden = authenticated;
  el('app').hidden = !authenticated;
  el('signout').hidden = !authenticated;
  var current = claims();
  el('who').textContent =
    authenticated && current ? (current.email || current.sub) : '';
}

function activeTunnelStatus(status) {
  return ['QUEUED', 'CONNECTING', 'AWAITING_USER', 'STARTING']
    .indexOf(status) >= 0;
}

function setTerminalStatus(label, state) {
  el('terminal-status-text').textContent = label;
  el('terminal-status-dot').className = 'status-dot' +
    (state === 'connecting' ? ' active' : '') +
    (state === 'connected' ? ' ready' : '') +
    (state === 'failed' ? ' failed' : '');
  el('terminal-reconnect').hidden =
    state === 'connecting' || state === 'connected';
}

function fitTerminal() {
  if (
    !terminal ||
    !terminalFitAddon ||
    !el('terminal-dialog').open
  ) {
    return;
  }
  try {
    terminalFitAddon.fit();
    sendTerminalResize();
  } catch (error) {
    // The terminal can be between layout and disposal during dialog close.
  }
}

function sendTerminalResize() {
  if (
    !terminal ||
    !terminalInitialized ||
    !terminalSocket ||
    terminalSocket.readyState !== WebSocket.OPEN
  ) {
    return;
  }
  terminalSocket.send(JSON.stringify({
    type: 'resize',
    rows: Math.max(1, Math.min(1000, terminal.rows)),
    cols: Math.max(1, Math.min(1000, terminal.cols))
  }));
}

function ensureTerminal() {
  if (terminal) { return; }
  if (
    typeof Terminal !== 'function' ||
    !globalThis.FitAddon ||
    typeof globalThis.FitAddon.FitAddon !== 'function'
  ) {
    throw new Error('The browser terminal failed to load');
  }
  terminal = new Terminal({
    allowTransparency: false,
    convertEol: false,
    cursorBlink: true,
    cursorStyle: 'block',
    fontFamily:
      'ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace',
    fontSize: 14,
    lineHeight: 1.15,
    scrollback: 10000,
    screenReaderMode: true,
    theme: {
      background: '#101416',
      foreground: '#e8edef',
      cursor: '#6dd6dc',
      cursorAccent: '#101416',
      selectionBackground: '#2f6f74',
      black: '#101416',
      red: '#e06c75',
      green: '#8fcb88',
      yellow: '#e5c07b',
      blue: '#72a7d8',
      magenta: '#c792c7',
      cyan: '#68c9cf',
      white: '#d9e0e2',
      brightBlack: '#66777d',
      brightRed: '#ef8c94',
      brightGreen: '#a9d7a4',
      brightYellow: '#f0d292',
      brightBlue: '#8ebbe3',
      brightMagenta: '#d8a8d8',
      brightCyan: '#82d8dc',
      brightWhite: '#ffffff'
    }
  });
  terminalFitAddon = new globalThis.FitAddon.FitAddon();
  terminal.loadAddon(terminalFitAddon);
  terminal.open(el('terminal-screen'));
  terminalDataSubscription = terminal.onData(function (data) {
    if (
      terminalInitialized &&
      terminalSocket &&
      terminalSocket.readyState === WebSocket.OPEN
    ) {
      terminalSocket.send(new TextEncoder().encode(data));
    }
  });
  terminalBinarySubscription = terminal.onBinary(function (data) {
    if (
      terminalInitialized &&
      terminalSocket &&
      terminalSocket.readyState === WebSocket.OPEN
    ) {
      var bytes = new Uint8Array(data.length);
      for (var index = 0; index < data.length; index += 1) {
        bytes[index] = data.charCodeAt(index) & 255;
      }
      terminalSocket.send(bytes);
    }
  });
  terminalResizeObserver = new ResizeObserver(function () {
    fitTerminal();
  });
  terminalResizeObserver.observe(el('terminal-screen'));
  setTimeout(fitTerminal, 0);
}

function closeTerminalSocket() {
  terminalGeneration += 1;
  terminalInitialized = false;
  if (terminalStartTimer) {
    clearTimeout(terminalStartTimer);
    terminalStartTimer = undefined;
  }
  var socket = terminalSocket;
  terminalSocket = undefined;
  if (
    socket &&
    (socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING)
  ) {
    socket.close(1000, 'Browser terminal closing');
  }
}

function disposeTerminal() {
  closeTerminalSocket();
  if (terminalResizeObserver) {
    terminalResizeObserver.disconnect();
    terminalResizeObserver = undefined;
  }
  if (terminalDataSubscription) {
    terminalDataSubscription.dispose();
    terminalDataSubscription = undefined;
  }
  if (terminalBinarySubscription) {
    terminalBinarySubscription.dispose();
    terminalBinarySubscription = undefined;
  }
  if (terminal) {
    terminal.dispose();
    terminal = undefined;
  }
  terminalFitAddon = undefined;
  el('terminal-screen').replaceChildren();
}

function validShellUrl(value) {
  var url = new URL(value);
  if (
    url.protocol !== 'wss:' ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/shell'
  ) {
    throw new Error('The MicroVM returned an invalid shell endpoint');
  }
  return url.toString();
}

function isTerminalControlMessage(text) {
  if (!text.startsWith('{')) { return false; }
  try {
    var value = JSON.parse(text);
    return Boolean(
      value &&
      typeof value === 'object' &&
      typeof value.type === 'string');
  } catch (error) {
    return false;
  }
}

function initializeTerminalSession(generation) {
  if (
    generation !== terminalGeneration ||
    terminalInitialized ||
    !terminalSocket ||
    terminalSocket.readyState !== WebSocket.OPEN
  ) {
    return;
  }
  terminalInitialized = true;
  if (terminalStartTimer) {
    clearTimeout(terminalStartTimer);
    terminalStartTimer = undefined;
  }
  fitTerminal();
  terminalSocket.send(new TextEncoder().encode(
    'exec setpriv --reuid=1000 --regid=1000 --init-groups ' +
    '/usr/local/bin/developer-shell\\n'));
  setTerminalStatus('Connected', 'connected');
  terminal.focus();
}

function writeTerminalFrame(data, generation) {
  if (generation !== terminalGeneration || !terminal) { return; }
  initializeTerminalSession(generation);
  if (typeof data === 'string') {
    if (!isTerminalControlMessage(data)) {
      terminal.write(data);
    }
    return;
  }
  if (data instanceof ArrayBuffer) {
    terminal.write(new Uint8Array(data));
    return;
  }
  if (data instanceof Blob) {
    data.arrayBuffer().then(function (buffer) {
      if (generation === terminalGeneration && terminal) {
        terminal.write(new Uint8Array(buffer));
      }
    }).catch(function () {
      setTerminalStatus('Connection error', 'failed');
    });
  }
}

async function connectTerminal() {
  if (!terminalSession) { return; }
  closeTerminalSocket();
  var generation = terminalGeneration;
  terminal.reset();
  setTerminalStatus('Connecting', 'connecting');
  try {
    var connection = await api(
      'POST',
      '/sessions/' + terminalSession.sessionId + '/connect',
      {});
    if (
      generation !== terminalGeneration ||
      !terminalSession ||
      !el('terminal-dialog').open
    ) {
      return;
    }
    var shellUrl = validShellUrl(connection.shellUrl);
    if (!connection.shellToken) {
      throw new Error('The MicroVM returned no shell credential');
    }
    var socket = new WebSocket(shellUrl, [
      'lambda-microvms',
      'lambda-microvms.authentication.' + connection.shellToken
    ]);
    terminalSocket = socket;
    socket.binaryType = 'arraybuffer';
    socket.addEventListener('open', function () {
      if (generation !== terminalGeneration) {
        socket.close(1000, 'Stale browser terminal');
        return;
      }
      setTerminalStatus('Preparing shell', 'connecting');
      terminalStartTimer = setTimeout(function () {
        initializeTerminalSession(generation);
      }, 1500);
    });
    socket.addEventListener('message', function (event) {
      writeTerminalFrame(event.data, generation);
    });
    socket.addEventListener('error', function () {
      if (generation === terminalGeneration) {
        setTerminalStatus('Connection error', 'failed');
      }
    });
    socket.addEventListener('close', function (event) {
      if (generation !== terminalGeneration) { return; }
      terminalInitialized = false;
      terminalSocket = undefined;
      if (terminalStartTimer) {
        clearTimeout(terminalStartTimer);
        terminalStartTimer = undefined;
      }
      setTerminalStatus(
        event.code === 1000 ? 'Disconnected' : 'Connection lost',
        event.code === 1000 ? undefined : 'failed');
    });
  } catch (error) {
    if (generation !== terminalGeneration) { return; }
    setTerminalStatus('Connection failed', 'failed');
    showError(error);
  }
}

function openTerminalDialog(session) {
  clearError();
  terminalSession = session;
  el('terminal-workspace').textContent = session.workspaceId;
  el('terminal-session').textContent = session.sessionId;
  el('terminal-dialog').showModal();
  try {
    ensureTerminal();
    connectTerminal();
  } catch (error) {
    setTerminalStatus('Unavailable', 'failed');
    showError(error);
  }
}

function resetTunnelDialog(session, provider) {
  tunnelSession = session;
  tunnelJob = undefined;
  el('tunnel-workspace').textContent = session.workspaceId;
  el('tunnel-name').textContent = session.tunnelName;
  el('tunnel-status').textContent = 'Loading';
  el('status-dot').className = 'status-dot active';
  el('tunnel-failure').hidden = true;
  el('tunnel-failure').textContent = '';
  el('device-fields').hidden = true;
  el('verification-link').removeAttribute('href');
  el('verification-link').textContent = '';
  el('device-code').textContent = '';
  el('copy-code').textContent = 'Copy';
  el('tunnel-start').hidden = true;
  el('tunnel-cancel').hidden = true;
  el('open-vscode').hidden = true;
  setSelectedProvider(
    provider || session.tunnelProvider || 'microsoft');
  setProviderEnabled(true);
}

async function openTunnelDialog(session, provider) {
  clearError();
  stopTunnelPoll();
  var explicitProvider = Boolean(provider);
  resetTunnelDialog(session, provider);
  el('tunnel-dialog').showModal();
  try {
    var job = await api(
      'GET', '/sessions/' + session.sessionId + '/tunnel-login');
    if (
      !explicitProvider &&
      !session.tunnelProvider &&
      job.provider
    ) {
      setSelectedProvider(job.provider);
    }
    renderTunnelJob(job);
    scheduleTunnelPoll(job);
  } catch (error) {
    if (error.status === 404) {
      renderTunnelJob();
      return;
    }
    el('tunnel-dialog').close();
    showError(error);
  }
}

function renderTunnelJob(job) {
  tunnelJob = job;
  var labels = {
    QUEUED: 'Queued',
    CONNECTING: 'Connecting to MicroVM',
    AWAITING_USER: 'Awaiting device approval',
    STARTING: 'Starting tunnel',
    READY: 'Tunnel ready',
    FAILED: 'Authentication failed',
    CANCELLED: 'Authentication cancelled',
    EXPIRED: 'Device code expired'
  };
  var status = job ? job.status : undefined;
  var active = Boolean(status && activeTunnelStatus(status));
  if (active && job.provider) {
    setSelectedProvider(job.provider);
  }
  el('tunnel-status').textContent = status
    ? (labels[status] || status) +
      (job.provider ? ' (' + providerLabel(job.provider) + ')' : '')
    : 'Not started';
  el('status-dot').className = 'status-dot' +
    (active ? ' active' : '') +
    (status === 'READY' ? ' ready' : '') +
    (status === 'FAILED' || status === 'EXPIRED' ? ' failed' : '');
  setProviderEnabled(!active);
  var showDevice = Boolean(
    job && job.status === 'AWAITING_USER' &&
    job.verificationUri && job.userCode);
  el('device-fields').hidden = !showDevice;
  if (showDevice) {
    el('verification-link').href = job.verificationUri;
    el('verification-link').textContent = job.verificationUri;
    el('device-code').textContent = job.userCode;
  } else {
    el('verification-link').removeAttribute('href');
    el('verification-link').textContent = '';
    el('device-code').textContent = '';
  }
  var failed = Boolean(job && job.failureReason);
  el('tunnel-failure').hidden = !failed;
  el('tunnel-failure').textContent =
    failed ? job.failureReason : '';
  el('tunnel-cancel').hidden = !active;
  var desiredProvider = selectedProvider();
  var sameProvider = Boolean(
    job && job.provider === desiredProvider);
  el('tunnel-start').hidden =
    active || (status === 'READY' && sameProvider);
  el('tunnel-start').textContent =
    status === 'READY' && !sameProvider
      ? 'Switch to ' + providerLabel(desiredProvider)
      : (status
          ? 'Retry with ' + providerLabel(desiredProvider)
          : 'Authenticate with ' + providerLabel(desiredProvider));
  var ready =
    status === 'READY' && sameProvider && tunnelSession;
  el('open-vscode').hidden = !ready;
  if (ready) {
    el('open-vscode').href =
      'vscode-remote://tunnel+' + tunnelSession.tunnelName + '/workspace';
  } else {
    el('open-vscode').removeAttribute('href');
  }
}

function providerLabel(provider) {
  return provider === 'microsoft' ? 'Microsoft' : 'GitHub';
}

function setSelectedProvider(provider) {
  document.querySelectorAll('input[name="tunnel-provider"]')
    .forEach(function (input) {
      input.checked = input.value === provider;
    });
}

function selectedProvider() {
  var selected =
    document.querySelector('input[name="tunnel-provider"]:checked');
  return selected ? selected.value : 'microsoft';
}

function setProviderEnabled(enabled) {
  document.querySelectorAll('input[name="tunnel-provider"]')
    .forEach(function (input) { input.disabled = !enabled; });
}

function stopTunnelPoll() {
  if (tunnelPollTimer) {
    clearTimeout(tunnelPollTimer);
    tunnelPollTimer = undefined;
  }
}

function scheduleTunnelPoll(job) {
  stopTunnelPoll();
  if (!job || !activeTunnelStatus(job.status) || !tunnelSession) {
    return;
  }
  tunnelPollTimer = setTimeout(pollTunnelJob, 1800);
}

async function pollTunnelJob() {
  tunnelPollTimer = undefined;
  if (!tunnelSession || !el('tunnel-dialog').open) { return; }
  try {
    var job = await api(
      'GET',
      '/sessions/' + tunnelSession.sessionId + '/tunnel-login');
    renderTunnelJob(job);
    scheduleTunnelPoll(job);
  } catch (error) {
    showError(error);
    el('tunnel-dialog').close();
  }
}

async function startTunnelAuthentication() {
  if (!tunnelSession) { return; }
  clearError();
  el('tunnel-start').disabled = true;
  try {
    var job = await api(
      'POST',
      '/sessions/' + tunnelSession.sessionId + '/tunnel-login',
      { provider: selectedProvider() });
    tunnelSession.tunnelProvider = job.provider;
    renderTunnelJob(job);
    scheduleTunnelPoll(job);
    refresh().catch(showError);
  } catch (error) {
    showError(error);
  } finally {
    el('tunnel-start').disabled = false;
  }
}

async function cancelTunnelAuthentication() {
  if (!tunnelSession) { return; }
  clearError();
  el('tunnel-cancel').disabled = true;
  try {
    var job = await api(
      'DELETE',
      '/sessions/' + tunnelSession.sessionId + '/tunnel-login');
    renderTunnelJob(job);
    stopTunnelPoll();
  } catch (error) {
    showError(error);
  } finally {
    el('tunnel-cancel').disabled = false;
  }
}

async function copyDeviceCode() {
  var code = el('device-code').textContent;
  if (!code) { return; }
  try {
    await navigator.clipboard.writeText(code);
    el('copy-code').textContent = 'Copied';
    setTimeout(function () {
      el('copy-code').textContent = 'Copy';
    }, 1400);
  } catch (error) {
    showError(new Error('Unable to copy the device code'));
  }
}

el('login').addEventListener('click', function () {
  login().catch(showError);
});
el('signout').addEventListener('click', signOut);
el('refresh').addEventListener('click', function () {
  manualRefresh();
});
el('new').addEventListener('submit', function (event) {
  event.preventDefault();
  var submit = el('create');
  var selected =
    document.querySelector('input[name="access-mode"]:checked');
  var provider = document.querySelector(
    'input[name="new-tunnel-provider"]:checked');
  var accessMode = selected ? selected.value : 'vscode';
  submit.disabled = true;
  action('POST', '/sessions', {
    workspaceId: el('workspace').value,
    accessMode: accessMode,
    tunnelProvider:
      accessMode === 'vscode' && provider
        ? provider.value : undefined
  }).then(function (result) {
    if (result) { el('workspace').value = ''; }
  }).finally(function () { submit.disabled = false; });
});
el('terminal-close').addEventListener('click', function () {
  el('terminal-dialog').close();
});
el('terminal-dialog').addEventListener('close', function () {
  disposeTerminal();
  terminalSession = undefined;
  setTerminalStatus('Disconnected');
});
el('terminal-reconnect').addEventListener('click', function () {
  clearError();
  connectTerminal();
});
el('tunnel-close').addEventListener('click', function () {
  el('tunnel-dialog').close();
});
el('tunnel-dialog').addEventListener('close', function () {
  stopTunnelPoll();
  tunnelSession = undefined;
  tunnelJob = undefined;
  refresh().catch(showError);
});
document.querySelectorAll('input[name="access-mode"]')
  .forEach(function (input) {
    input.addEventListener('change', syncNewProviderField);
  });
document.querySelectorAll('input[name="tunnel-provider"]')
  .forEach(function (input) {
    input.addEventListener('change', function () {
      renderTunnelJob(tunnelJob);
    });
  });
el('tunnel-start').addEventListener('click', function () {
  startTunnelAuthentication();
});
el('tunnel-cancel').addEventListener('click', function () {
  cancelTunnelAuthentication();
});
el('copy-code').addEventListener('click', function () {
  copyDeviceCode();
});
function syncNewProviderField() {
  var access = document.querySelector(
    'input[name="access-mode"]:checked');
  var terminalAccess = Boolean(access && access.value !== 'vscode');
  el('new-provider-field').disabled = terminalAccess;
  el('new-provider-field').hidden = terminalAccess;
  el('new').classList.toggle('terminal-access', terminalAccess);
}
setInterval(function () {
  refresh().catch(showError);
}, 15000);

completeLogin()
  .then(function () {
    render();
    syncNewProviderField();
    return refresh();
  })
  .catch(showError);
`;
