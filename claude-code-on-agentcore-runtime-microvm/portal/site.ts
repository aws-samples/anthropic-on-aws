// Static portal assets served by portal/handler.ts through the private API.
// This is a minimal placeholder for claude-code-on-agentcore-runtime-microvm:
// only the Terminal access mode is implemented in this sample (see
// docs/deployment-guide.md), so the page only needs session lifecycle
// controls and an xterm.js terminal dialog -- no VS Code tunnel UI.
//
// Visual direction ("field terminal / technical dossier"): a dark,
// blueprint-adjacent workspace built for the people who actually use this
// thing -- engineers spinning up governed shells, not a marketing page.
// IBM Plex Mono carries data/labels (session ids, state, timestamps) so the
// table reads like a manifest; IBM Plex Sans carries prose. Claude's own
// rust/orange (#cc785c) is promoted from "a button color" to the one true
// accent, and reused verbatim for the terminal's own ANSI theme below so
// the chrome and the terminal it wraps feel like one designed object
// instead of two unrelated layers.

export const PORTAL_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Claude AgentCore Runtime portal</title>
<link rel="icon" href="data:,">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="xterm.css">
<style>
  :root {
    color-scheme: dark;
    --mono: "IBM Plex Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    --sans: "IBM Plex Sans", -apple-system, "Segoe UI", sans-serif;
    --bg: #100e0b;
    --panel: #17130f;
    --panel-raised: #1d1712;
    --grid-line: rgba(239, 232, 223, .05);
    --line: #2b241d;
    --ink: #efe7dd;
    --sub: #9c9186;
    --faint: #6c6459;
    --brand: #cc785c;
    --brand-bright: #e8664a;
    --brand-dim: #5a3324;
    --good: #4caf7d;
    --warn: #e0b84a;
    --danger: #e8664a;
    --danger-bg: rgba(232, 102, 74, .12);
  }
  * { box-sizing: border-box; }
  @keyframes fade-up {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: none; }
  }
  @keyframes dialog-in {
    from { opacity: 0; transform: scale(.96) translateY(6px); }
    to { opacity: 1; transform: none; }
  }
  @keyframes backdrop-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes dialog-out {
    from { opacity: 1; transform: none; }
    to { opacity: 0; transform: scale(.97) translateY(4px); }
  }
  @keyframes backdrop-out {
    from { opacity: 1; }
    to { opacity: 0; }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: .3; }
  }
  body {
    margin: 0;
    min-height: 100vh;
    color: var(--ink);
    font-family: var(--sans);
    font-size: 15px;
    line-height: 1.55;
    background-color: var(--bg);
    background-image:
      radial-gradient(ellipse 900px 460px at 12% -12%, rgba(204, 120, 92, .12), transparent 60%),
      linear-gradient(var(--grid-line) 1px, transparent 1px),
      linear-gradient(90deg, var(--grid-line) 1px, transparent 1px);
    background-size: auto, 42px 42px, 42px 42px;
  }
  header {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.1rem 2rem;
    border-bottom: 1px solid var(--line);
    background: linear-gradient(180deg, var(--panel), rgba(23, 19, 15, .35));
    animation: fade-up .5s cubic-bezier(.16, 1, .3, 1) both;
  }
  header::after {
    content: "";
    position: absolute;
    left: 0; right: 0; bottom: -1px; height: 1px;
    background: linear-gradient(90deg, transparent, var(--brand-dim), transparent);
  }
  .brand { display: flex; align-items: baseline; gap: .7rem; }
  .brand-mark {
    font-family: var(--mono);
    font-size: .68rem;
    letter-spacing: .14em;
    text-transform: uppercase;
    color: var(--brand);
    border: 1px solid var(--brand-dim);
    border-radius: 2px;
    padding: .2rem .45rem;
  }
  header h1 {
    font-family: var(--mono);
    font-size: 1rem;
    font-weight: 500;
    margin: 0;
    letter-spacing: -.01em;
    color: var(--ink);
  }
  header h1 .accent { color: var(--brand); }
  .session-meta {
    display: flex;
    align-items: center;
    gap: 1rem;
    font-size: .82rem;
    color: var(--sub);
    font-family: var(--mono);
  }
  main { max-width: 66rem; margin: 0 auto; padding: 2.5rem 2rem 4rem; }
  #sign-in { display: block; margin: 20vh auto 0; padding: .85rem 2.1rem; font-size: .92rem; }
  /* render() below toggles this button's visibility by setting the
     \`hidden\` IDL property, which the browser normally honors via its own
     [hidden] { display: none } UA rule -- but an ID selector like the one
     above beats that attribute selector on specificity, so \`display: block\`
     kept winning even after the hidden attribute was correctly applied to
     the DOM. Concretely: a signed-in user with real sessions loaded still
     had this coral "Sign in" button floating in the middle of the page,
     on top of their own environment table, on every single visit -- found
     by rendering the signed-in state and inspecting it directly, not by
     reading the JS in isolation. Restating the rule at matching specificity
     (ID selector + attribute selector) here is what actually makes hidden
     stick. */
  #sign-in[hidden] { display: none; }
  .panel-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1.5rem;
    flex-wrap: wrap;
    margin-bottom: 1.4rem;
    animation: fade-up .5s cubic-bezier(.16, 1, .3, 1) .05s both;
  }
  .eyebrow {
    display: block;
    font-family: var(--mono);
    font-size: .68rem;
    letter-spacing: .16em;
    text-transform: uppercase;
    color: var(--brand);
  }
  .panel-sub { margin: .35rem 0 0; color: var(--sub); font-size: .85rem; max-width: 34rem; }
  .toolbar { display: flex; gap: .6rem; }
  button {
    font-family: var(--sans);
    border: 1px solid var(--line);
    border-radius: 3px;
    background: var(--panel-raised);
    color: var(--ink);
    padding: .55rem 1.05rem;
    font-size: .82rem;
    font-weight: 500;
    letter-spacing: .01em;
    cursor: pointer;
    transition: border-color .15s ease, background-color .15s ease, transform .1s ease, box-shadow .15s ease;
  }
  button:hover { border-color: var(--brand); transform: translateY(-1px); }
  button:active { transform: translateY(0); }
  button:disabled { opacity: .5; cursor: default; transform: none; }
  button:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(204, 120, 92, .35), 0 0 0 1px var(--brand);
  }
  button.primary {
    background: var(--brand);
    border-color: var(--brand);
    color: #1a0f0a;
    font-weight: 600;
  }
  button.primary:hover {
    background: var(--brand-bright);
    border-color: var(--brand-bright);
    box-shadow: 0 0 0 3px rgba(204, 120, 92, .18);
  }
  .bracketed { position: relative; }
  .bracketed::before, .bracketed::after {
    content: "";
    position: absolute;
    width: 15px;
    height: 15px;
    pointer-events: none;
    z-index: 2;
  }
  .bracketed::before { top: 0; left: 0; border-top: 2px solid var(--brand); border-left: 2px solid var(--brand); }
  .bracketed::after { bottom: 0; right: 0; border-bottom: 2px solid var(--brand); border-right: 2px solid var(--brand); }
  .manifest {
    border: 1px solid var(--line);
    background: var(--panel);
    animation: fade-up .5s cubic-bezier(.16, 1, .3, 1) .1s both;
    /* A manifest with 20 running environments should still feel like one
       intentional panel, not an infinite page-scroll -- the panel itself
       scrolls past a height budget, with its own header pinned, rather
       than pushing the toolbar above it off-screen. overflow-x covers the
       six-column table on narrow viewports without breaking layout. */
    max-height: 64vh;
    overflow-y: auto;
    overflow-x: auto;
  }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: .7rem 1rem; font-size: .84rem; }
  th {
    font-family: var(--mono);
    font-size: .66rem;
    font-weight: 500;
    letter-spacing: .09em;
    text-transform: uppercase;
    color: var(--sub);
    background-color: var(--panel);
    background-image: linear-gradient(rgba(255, 255, 255, .015), rgba(255, 255, 255, .015));
    border-bottom: 1px solid var(--line);
    position: sticky;
    top: 0;
    z-index: 1;
  }
  td { border-bottom: 1px solid var(--line); color: var(--ink); }
  #sessions td:nth-child(1), #sessions td:nth-child(2) {
    font-family: var(--mono);
    font-size: .8rem;
    color: var(--sub);
  }
  tbody tr {
    position: relative;
    transition: background-color .15s ease;
    animation: fade-up .35s ease both;
  }
  tbody tr:nth-child(1) { animation-delay: .02s; }
  tbody tr:nth-child(2) { animation-delay: .05s; }
  tbody tr:nth-child(3) { animation-delay: .08s; }
  tbody tr:nth-child(4) { animation-delay: .11s; }
  tbody tr:nth-child(5) { animation-delay: .14s; }
  tbody tr:nth-child(6) { animation-delay: .17s; }
  tbody tr:nth-child(n+7) { animation-delay: .2s; }
  tbody tr::before {
    content: "";
    position: absolute;
    left: 0; top: 0; bottom: 0; width: 2px;
    background: transparent;
    transition: background-color .15s ease;
  }
  tbody tr:hover { background: rgba(204, 120, 92, .06); }
  tbody tr:hover::before { background: var(--brand); }
  tbody tr:last-child td { border-bottom: none; }
  .manifest td button {
    padding: .35rem .8rem;
    font-size: .78rem;
    background: transparent;
    border-color: var(--line);
  }
  .manifest td button:hover { border-color: var(--brand); color: var(--brand); background: rgba(204, 120, 92, .08); }
  .state-pill {
    display: inline-flex;
    align-items: center;
    gap: .45em;
    font-family: var(--mono);
    font-size: .7rem;
    letter-spacing: .04em;
    text-transform: uppercase;
    padding: .18rem .55rem;
    border-radius: 2px;
    border: 1px solid var(--line);
  }
  .state-pill::before { content: ""; width: .4em; height: .4em; border-radius: 50%; background: currentColor; flex: none; }
  .state-tone-good { color: var(--good); background: rgba(76, 175, 125, .12); border-color: rgba(76, 175, 125, .32); }
  .state-tone-warn { color: var(--warn); background: rgba(224, 184, 74, .12); border-color: rgba(224, 184, 74, .32); }
  .state-tone-bad { color: var(--danger); background: var(--danger-bg); border-color: rgba(232, 102, 74, .35); }
  .state-tone-neutral { color: var(--sub); background: rgba(255, 255, 255, .04); border-color: var(--line); }
  .storage-cell { font-family: var(--mono); font-size: .78rem; color: var(--sub); white-space: nowrap; }
  .storage-summary { color: var(--ink); margin-right: .7rem; }
  .storage-empty { color: var(--faint); }
  .storage-download {
    display: inline-block;
    color: var(--brand);
    text-decoration: none;
    font-weight: 600;
    border: 1px solid var(--brand-dim);
    border-radius: 2px;
    padding: .15rem .55rem;
    transition: background-color .15s ease, color .15s ease;
  }
  .storage-download::before { content: "\\2193 "; }
  .storage-download:hover { background: var(--brand); color: #1a0f0a; }
  .storage-download:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(204, 120, 92, .35);
  }
  .manifest-empty {
    text-align: center;
    font-family: var(--mono);
    font-size: .74rem;
    letter-spacing: .04em;
    color: var(--faint);
    padding: 2.4rem 1rem;
  }
  #error {
    font-family: var(--mono);
    font-size: .82rem;
    color: var(--danger);
    background: var(--danger-bg);
    border: 1px solid rgba(232, 102, 74, .3);
    border-radius: 3px;
    padding: .65rem 1rem;
    margin-top: 1.2rem;
  }
  dialog {
    width: min(94vw, 68rem);
    border: none;
    border-radius: 3px;
    padding: 0;
    background: var(--panel);
    color: var(--ink);
    box-shadow: 0 30px 80px rgba(0, 0, 0, .55), 0 0 0 1px var(--line);
  }
  dialog[open] { animation: dialog-in .3s cubic-bezier(.16, 1, .3, 1); }
  dialog::backdrop {
    background: radial-gradient(circle at 50% 35%, rgba(204, 120, 92, .1), rgba(8, 7, 6, .85));
    animation: backdrop-in .3s ease both;
  }
  /* Closing plays the reverse of the open moment instead of vanishing
     instantly -- see closeTerminal()/teardownTerminal() in the script,
     which add this class, wait out the animation, then call the dialog's
     own native close(). Declared after dialog[open] so it wins the tie on
     equal selector specificity once both are true mid-close. */
  dialog.closing { animation: dialog-out .16s cubic-bezier(.4, 0, 1, 1) forwards; }
  dialog.closing::backdrop { animation: backdrop-out .16s ease forwards; }
  .terminal-chrome { position: relative; display: flex; flex-direction: column; }
  .terminal-chrome-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: .6rem 1rem;
    border-bottom: 1px solid var(--line);
    font-family: var(--mono);
    font-size: .7rem;
    letter-spacing: .08em;
    text-transform: uppercase;
    color: var(--sub);
  }
  .terminal-chrome-label { display: flex; align-items: center; }
  .terminal-chrome-label .dot {
    width: .5em; height: .5em; border-radius: 50%;
    background: var(--good);
    box-shadow: 0 0 8px var(--good);
    margin-right: .55em;
    display: inline-block;
    transition: background-color .2s ease, box-shadow .2s ease;
  }
  /* Reflects the actual WebSocket lifecycle (see setTerminalStatus() in
     the script) instead of a dot that was previously hard-coded green
     the instant the dialog opened -- true even while the /connect
     request and socket handshake were still in flight, and even if they
     failed outright. */
  .terminal-chrome-label .dot.connecting {
    background: var(--warn);
    box-shadow: 0 0 8px var(--warn);
    animation: pulse 1.1s ease-in-out infinite;
  }
  .terminal-chrome-label .dot.error {
    background: var(--danger);
    box-shadow: 0 0 8px var(--danger);
  }
  #terminal-close {
    border: 1px solid transparent;
    background: transparent;
    color: var(--sub);
    font-family: var(--mono);
    font-size: .78rem;
    letter-spacing: .04em;
    padding: .25rem .6rem;
  }
  #terminal-close:hover {
    color: var(--danger);
    background: var(--danger-bg);
    border-color: transparent;
    transform: none;
  }
  #terminal-screen { flex: 1 1 auto; min-height: 62vh; background: #0c0a08; padding: .75rem; }
</style>
</head>
<body>
<header>
  <div class="brand">
    <span class="brand-mark">AgentCore</span>
    <h1>Claude Runtime <span class="accent">Portal</span></h1>
  </div>
  <div class="session-meta">
    <span id="who"></span>
    <button id="sign-out" hidden>Sign out</button>
  </div>
</header>
<main>
  <button id="sign-in" class="primary">Sign in</button>
  <section id="app" hidden>
    <div class="panel-head">
      <div>
        <span class="eyebrow">Environments</span>
        <p class="panel-sub">Ephemeral Claude Code microVMs, provisioned on demand and torn down when idle.</p>
      </div>
      <div class="toolbar">
        <button id="start-session" class="primary">Create environment</button>
        <button id="refresh">Refresh</button>
      </div>
    </div>
    <div class="manifest bracketed">
      <table>
        <thead>
          <tr><th>Session</th><th>Workspace</th><th>State</th><th>Updated</th><th>Storage</th><th></th></tr>
        </thead>
        <tbody id="sessions"></tbody>
      </table>
    </div>
    <p id="error" hidden></p>
  </section>
</main>
<dialog id="terminal-dialog">
  <div class="terminal-chrome bracketed">
    <div class="terminal-chrome-bar">
      <span class="terminal-chrome-label"><span id="terminal-status-dot" class="dot connecting"></span><span id="terminal-status-text">Connecting\u2026</span></span>
      <button id="terminal-close">Close</button>
    </div>
    <div id="terminal-screen"></div>
  </div>
</dialog>
<script src="terminal-vendor.js"></script>
<script src="app.js"></script>
</body>
</html>`;

export const PORTAL_JS = `
'use strict';
var config;
var sessions = [];

function el(id) { return document.getElementById(id); }

async function loadConfig() {
  if (!config) {
    var response = await fetch('config.json');
    config = await response.json();
  }
  return config;
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
  sessionStorage.removeItem('portalIdToken');
  sessionStorage.removeItem('portalVerifier');
  sessionStorage.removeItem('portalState');
  render();
}

// Authorization Code + PKCE against the Cognito Hosted UI. There is no
// client secret (public client), so PKCE is what stops a stolen
// authorization code from being redeemed by anyone but the browser that
// requested it.
async function login() {
  var cfg = await loadConfig();
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
    hostedUiUrl(cfg, 'authorize') + '?' + new URLSearchParams(authorize));
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
      'Sign-in failed: ' + (params.get('error_description') || oauthError));
  }
  var cfg = await loadConfig();
  var verifier = sessionStorage.getItem('portalVerifier');
  if (!verifier) {
    throw new Error('Sign-in session expired; try again');
  }
  var res = await fetch(hostedUiUrl(cfg, 'token'), {
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
    throw new Error('Token exchange failed: ' + (tokens.error || res.status));
  }
  sessionStorage.setItem('portalIdToken', tokens.id_token);
  sessionStorage.removeItem('portalVerifier');
  sessionStorage.removeItem('portalState');
}

function api(method, path, body) {
  return fetch(path, {
    method: method,
    headers: Object.assign(
      { authorization: idToken() },
      body ? { 'content-type': 'application/json' } : {}),
    body: body ? JSON.stringify(body) : undefined
  }).then(function (response) {
    if (response.status === 401) {
      signOut();
      throw new Error('Session expired; sign in again');
    }
    if (!response.ok) {
      return response.json().catch(function () { return {}; }).then(function (value) {
        var error = new Error(value.message || 'Request failed');
        error.status = response.status;
        throw error;
      });
    }
    return response.status === 204 ? undefined : response.json();
  });
}

function showError(error) {
  el('error').textContent = error && error.message ? error.message : String(error);
  el('error').hidden = false;
}

function clearError() {
  el('error').textContent = '';
  el('error').hidden = true;
}

// Maps backend session states (see control-plane/src/model.ts's
// ACTIVE_STATES) to one of four visual tones for the state pill. Ties the
// portal chrome's palette back to the exact ANSI colors the terminal
// itself uses (openTerminal() below), so "healthy/transitional/failed"
// reads the same way in the table as it does inside a shell.
function stateToneClass(state) {
  if (state === 'RUNNING') { return 'state-tone-good'; }
  if (state === 'FAILED') { return 'state-tone-bad'; }
  if (state === 'TERMINATED') { return 'state-tone-neutral'; }
  return 'state-tone-warn';
}

function renderSessions() {
  var body = el('sessions');
  body.replaceChildren();
  // Round 1 left this table with no opinion about having zero rows -- an
  // empty <tbody> under a full header row reads as broken/loading, not
  // as "you have no environments", especially the very first time anyone
  // signs in. Give the zero-session state the same considered voice as
  // the rest of the manifest instead of silence.
  if (sessions.length === 0) {
    var emptyRow = document.createElement('tr');
    var emptyCell = document.createElement('td');
    emptyCell.colSpan = 6;
    emptyCell.className = 'manifest-empty';
    emptyCell.textContent = '// no environments yet -- create one above to get started';
    emptyRow.appendChild(emptyCell);
    body.appendChild(emptyRow);
    return;
  }
  sessions.forEach(function (session) {
    var row = document.createElement('tr');

    var idCell = document.createElement('td');
    idCell.textContent = session.sessionId.slice(0, 8);
    row.appendChild(idCell);

    var workspaceCell = document.createElement('td');
    workspaceCell.textContent = session.workspaceId;
    row.appendChild(workspaceCell);

    var stateCell = document.createElement('td');
    var statePill = document.createElement('span');
    statePill.className = 'state-pill ' + stateToneClass(session.state);
    statePill.textContent = session.state;
    stateCell.appendChild(statePill);
    row.appendChild(stateCell);

    var updatedCell = document.createElement('td');
    updatedCell.textContent = new Date(session.updatedAt * 1000).toLocaleString();
    row.appendChild(updatedCell);

    // Persistent-storage cell: filled in async below once the workspace
    // route resolves, since it is a separate request per row rather than
    // part of the sessions list payload (that payload is shared with the
    // CLI's /sessions route, which has no reason to carry S3 metadata).
    var storageCell = document.createElement('td');
    storageCell.className = 'storage-cell';
    storageCell.textContent = 'Checking\u2026';
    row.appendChild(storageCell);
    loadWorkspaceInfo(session, storageCell);

    var actions = document.createElement('td');
    var connectButton = document.createElement('button');
    connectButton.textContent = 'Connect';
    connectButton.addEventListener('click', function () {
      openTerminal(session);
    });
    actions.appendChild(connectButton);
    row.appendChild(actions);

    body.appendChild(row);
  });
}

function formatBytes(bytes) {
  if (bytes < 1024) { return bytes + ' B'; }
  var units = ['KB', 'MB', 'GB'];
  var value = bytes;
  var unitIndex = -1;
  do {
    value = value / 1024;
    unitIndex += 1;
  } while (value >= 1024 && unitIndex < units.length - 1);
  return value.toFixed(1) + ' ' + units[unitIndex];
}

function formatRelativeTime(unixSeconds) {
  var deltaSeconds = Math.max(0, Math.floor(Date.now() / 1000) - unixSeconds);
  if (deltaSeconds < 60) { return 'just now'; }
  var minutes = Math.floor(deltaSeconds / 60);
  if (minutes < 60) { return minutes + 'm ago'; }
  var hours = Math.floor(minutes / 60);
  if (hours < 24) { return hours + 'h ago'; }
  return Math.floor(hours / 24) + 'd ago';
}

// Phase 1 of surfacing persistent per-workspace storage in the portal:
// a read-only view of the same checkpoint archive the runtime itself
// checkpoints to/from on suspend and terminate (see agent-runtime/agent.py
// and control-plane/src/service.ts's workspaceInfo()). This route never
// returns an upload URL -- only the runtime's own IAM role can write a
// checkpoint -- so a portal user can see and download what has been
// saved for a workspace, but never overwrite it from here.
function loadWorkspaceInfo(session, cell) {
  api('GET', 'sessions/' + session.sessionId + '/workspace')
    .then(function (info) {
      cell.textContent = '';
      if (!info.exists) {
        var none = document.createElement('span');
        none.className = 'storage-empty';
        none.textContent = 'No files saved yet';
        cell.appendChild(none);
        return;
      }
      var summary = document.createElement('span');
      summary.className = 'storage-summary';
      summary.textContent =
        formatBytes(info.sizeBytes || 0) +
        (info.lastModifiedAt
          ? ' \u00b7 saved ' + formatRelativeTime(info.lastModifiedAt)
          : '');
      cell.appendChild(summary);
      if (info.downloadUrl) {
        var link = document.createElement('a');
        link.className = 'storage-download';
        link.href = info.downloadUrl;
        link.textContent = 'Download';
        link.setAttribute('download', session.workspaceId + '.tar.gz');
        cell.appendChild(link);
      }
    })
    .catch(function () {
      cell.textContent = '';
      var errorLabel = document.createElement('span');
      errorLabel.className = 'storage-empty';
      errorLabel.textContent = 'Unavailable';
      cell.appendChild(errorLabel);
    });
}

async function refresh() {
  clearError();
  try {
    var result = await api('GET', 'sessions');
    sessions = result.sessions;
    renderSessions();
  } catch (error) {
    showError(error);
  }
}

async function startSession() {
  clearError();
  var button = el('start-session');
  button.disabled = true;
  var originalText = button.textContent;
  button.textContent = 'Starting...';
  try {
    var result = await api('POST', 'sessions', { accessMode: 'terminal' });
    await refresh();
    // POST /sessions returns 200 (not 201/202) when it silently reused an
    // already-active session for this workspace instead of creating a new
    // one -- with no visible change to the table, clicking the button
    // looked like it did nothing. Surface which one actually happened.
    el('error').textContent = result && result.created === false
      ? 'Reusing the existing environment for this workspace (already running).'
      : 'Environment created.';
    el('error').hidden = false;
    setTimeout(clearError, 4000);
  } catch (error) {
    showError(error);
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

var terminal;
var terminalSocket;
var fitAddon;
var terminalResizeObserver;

// Drives the chrome-bar dot + label through the connection's real
// lifecycle (connecting -> live, or connecting -> error) instead of the
// dot round 1 shipped: a plain <span class="dot"> hard-coded to the
// "good" color in markup, so it showed green the instant the dialog
// opened whether or not a shell was actually attached yet -- including
// while the /connect request and socket handshake were still in flight,
// and even if they failed outright, which left the dot glowing green
// over a terminal that never connected.
function setTerminalStatus(state, label) {
  var dot = el('terminal-status-dot');
  var text = el('terminal-status-text');
  if (!dot || !text) { return; }
  dot.className = 'dot' + (state ? ' ' + state : '');
  text.textContent = label;
}

function openTerminal(session) {
  clearError();
  setTerminalStatus('connecting', 'Connecting\u2026');
  // Native <dialog> exposes an implicit ARIA dialog role, but it does not
  // derive an accessible name from whatever happens to be visible inside
  // it -- without this, a screen reader user gets only "dialog", with no
  // indication this is a remote terminal or which workspace it is for.
  // Set once per open, from the same session data the chrome bar/table
  // already use, rather than pointing at #terminal-status-text (which
  // changes every time the connection state changes, and would make the
  // dialog's own name flicker instead of staying a stable description of
  // what it is).
  el('terminal-dialog').setAttribute(
    'aria-label', 'Remote shell terminal for workspace ' + session.workspaceId);
  el('terminal-dialog').showModal();
  // Whether this session has ever had real activity before this connect,
  // used by connectTerminal() below to decide whether it's safe to send
  // the developer-shell bootstrap. Computed once, from data the backend
  // already returned with the session list/create/connect response --
  // not from anything client-local (sessionStorage) or wire-protocol-
  // derived (the shell STATUS frame's reconnected flag), both of which
  // were tried and confirmed live, by direct re-test, not to track what
  // this actually needs. See connectTerminal() for the full story.
  var sessionHadPriorActivity =
    Number(session.lastActivityAt) > Number(session.createdAt) + 5;
  terminal = new window.Terminal({
    convertEol: true,
    fontFamily: '"IBM Plex Mono", "SF Mono", "Cascadia Code", "Fira Code", Menlo, Consolas, monospace',
    fontSize: 13,
    lineHeight: 1.35,
    cursorBlink: true,
    scrollback: 5000,
    // Explicit theme, not xterm.js's stock defaults: this file's own
    // history flagged the terminal rendering an accent as red where the
    // Claude Code CLI's own branding is orange. TERM=xterm-256color and
    // COLORTERM=truecolor are both set server-side (agent-runtime/agent.py)
    // so the CLI emits true 24-bit color for its own UI rather than
    // falling back to the nearest ANSI-16 slot -- but xterm.js's ANSI
    // palette is still consulted for anything the app sends as a plain
    // named color, and its stock "red" (ansi 1/9) is a plain red with no
    // orange undertone, so any 16-color fallback path still looked red
    // instead of on-brand. Nudging ansi red toward Claude's actual brand
    // rust/orange (#CC785C-ish) fixes that without touching how genuine
    // truecolor output renders. These same hexes drive the portal
    // chrome's own state-pill colors (see stateToneClass above), so the
    // dialog and the table it's launched from share one palette.
    theme: {
      background: '#0c0a08',
      foreground: '#efe7dd',
      cursor: '#e8664a',
      cursorAccent: '#0c0a08',
      selectionBackground: '#3a2a20',
      black: '#0c0a08',
      red: '#e8664a',
      green: '#4caf7d',
      yellow: '#e0b84a',
      blue: '#5b9bd5',
      magenta: '#b98cce',
      cyan: '#4dbfbf',
      white: '#efe7dd',
      brightBlack: '#6c6459',
      brightRed: '#f08a70',
      brightGreen: '#6fce9c',
      brightYellow: '#efc96b',
      brightBlue: '#7cb3e0',
      brightMagenta: '#caa4dc',
      brightCyan: '#71d4d4',
      brightWhite: '#ffffff',
    },
  });
  terminal.open(el('terminal-screen'));
  // xterm.js renders at a fixed default grid (its own hard-coded cols/rows)
  // unless something actively measures the container and calls resize() --
  // it does not observe its own container's size on its own. FitAddon is
  // that "something": it reads #terminal-screen's real box and resizes the
  // buffer to match, both right after open() and on every window resize
  // (see fitTerminal() below), and the browser-side RESIZE frame lets the
  // shell on the other end match the same cols/rows via the same
  // channel-prefixed wire format client/src/shell-protocol.ts already uses.
  fitAddon = new window.FitAddon.FitAddon();
  terminal.loadAddon(fitAddon);
  fitAddon.fit();
  // Belt-and-suspenders alongside the window 'resize' listener further
  // below: that listener only fires for changes to the *window's* size,
  // but #terminal-screen's own box can change for reasons that never fire
  // a window resize at all (a browser zoom step that some engines don't
  // dispatch resize for, a devtools device-toolbar toggle, a dialog width
  // that is itself a min(94vw, 68rem) viewport calculation settling one
  // frame after showModal()). ResizeObserver watches the actual element
  // FitAddon measures, so the dialog keeps fitting correctly no matter
  // which of those triggers the change.
  if (window.ResizeObserver) {
    terminalResizeObserver = new ResizeObserver(function () { fitTerminal(); });
    terminalResizeObserver.observe(el('terminal-screen'));
  }
  connectTerminal(session);
}

// Shell-protocol channel-prefix framing (Kubernetes v5.channel.k8s.io wire
// format: [1-byte channel id][payload]), matching client/src/shell-
// protocol.ts exactly -- see that file for the full channel table. The
// portal previously wrote every incoming frame straight to the terminal
// (including the leading channel byte as a garbage character) and never
// prefixed outgoing keystrokes with the STDIN channel byte at all, so even
// with a working signed connection the terminal would have been unusable.
var SHELL_CHANNEL_STDIN = 0x00;
var SHELL_CHANNEL_STDOUT = 0x01;
var SHELL_CHANNEL_STDERR = 0x02;
var SHELL_CHANNEL_STATUS = 0x03;
var SHELL_CHANNEL_RESIZE = 0x04;
var SHELL_CHANNEL_HEARTBEAT = 0x05;

function encodeStdinFrame(text) {
  var body = new TextEncoder().encode(text);
  var frame = new Uint8Array(body.length + 1);
  frame[0] = SHELL_CHANNEL_STDIN;
  frame.set(body, 1);
  return frame;
}

// Mirrors client/src/shell-protocol.ts's encodeResize() exactly (same
// channel byte, same {width, height} JSON shape) so the shell side needs
// no protocol changes to accept resizes from the browser terminal too.
function encodeResizeFrame(cols, rows) {
  var body = new TextEncoder().encode(JSON.stringify({ width: cols, height: rows }));
  var frame = new Uint8Array(body.length + 1);
  frame[0] = SHELL_CHANNEL_RESIZE;
  frame.set(body, 1);
  return frame;
}

// Re-fits the terminal to its (possibly just-resized) container and, if
// the shell connection is live, tells the far end the new size. Called
// once right after open (openTerminal), again once the socket actually
// reaches OPEN (connectTerminal -- fit() before connect can under-measure
// if webfonts/layout haven't settled), and on every window resize while
// the dialog is showing (see the resize listener below).
function fitTerminal() {
  if (!fitAddon || !terminal) { return; }
  fitAddon.fit();
  if (terminalSocket && terminalSocket.readyState === WebSocket.OPEN) {
    terminalSocket.send(encodeResizeFrame(terminal.cols, terminal.rows));
  }
}

async function connectTerminal(session) {
  try {
    var connection = await api('POST', 'sessions/' + session.sessionId + '/connect', {});
    var socket = new WebSocket(connection.shellUrl);
    terminalSocket = socket;
    socket.binaryType = 'arraybuffer';
    socket.addEventListener('open', function () {
      fitTerminal();
      setTerminalStatus('', 'Remote shell');
    });
    socket.addEventListener('error', function () {
      setTerminalStatus('error', 'Connection error');
    });
    // The developer-shell privilege-drop bootstrap used to be sent from
    // here, gated on various client-visible signals (a shell-protocol
    // reconnected flag, then a sessionStorage flag, then a
    // lastActivityAt/createdAt comparison) -- three separate attempts,
    // each confirmed broken by live re-testing. Root cause: AgentCore's
    // shell attach reattaches to one persistent PTY per session (like
    // tmux attach), not a fresh shell per connect, and none of those
    // client-visible signals actually tracked "does that PTY already
    // have claude running in it" -- the one thing that matters. Sending
    // the bootstrap command into a PTY that already has claude attached
    // sends it as literal keystrokes into claude's own input, which
    // drops into its own "manual mode" and swallows every further
    // keystroke -- the exact shape of the "terminal won't let me type"
    // bug reported live, repeatedly.
    //
    // The bootstrap is now injected server-side, exactly once per
    // AgentCore session, by the relay itself (relay/src/index.ts's
    // maybeBootstrapSession()) -- the one component present for every
    // real connection to a given session's shell, tracked durably in
    // DynamoDB so it survives relay restarts/redeploys and works across
    // browser tabs, devices, and reconnects alike. This file only pipes
    // bytes now.
    var heartbeatTimer = setInterval(function () {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(new Uint8Array([SHELL_CHANNEL_HEARTBEAT]));
      }
    }, 20000);
    socket.addEventListener('close', function () {
      clearInterval(heartbeatTimer);
      // Only worth announcing if the dialog is still open -- if the user
      // closed it themselves, teardownTerminal() already called this
      // same socket.close(), and the dialog (and this status label) are
      // already gone by the time this event actually fires.
      if (el('terminal-dialog').open) {
        setTerminalStatus('error', 'Disconnected');
      }
    });
    socket.addEventListener('message', function (event) {
      var frame = new Uint8Array(event.data);
      if (frame.length === 0) { return; }
      var channel = frame[0];
      var payload = frame.subarray(1);
      if (channel === SHELL_CHANNEL_STDOUT || channel === SHELL_CHANNEL_STDERR) {
        terminal.write(payload);
      } else if (channel === SHELL_CHANNEL_STATUS) {
        try {
          var status = JSON.parse(new TextDecoder().decode(payload));
          if (status.status === 'Failure') {
            showError(new Error(status.message || status.reason || 'Shell error'));
          }
        } catch (error) {
          // Non-JSON status payload; ignore.
        }
      } else if (channel === SHELL_CHANNEL_HEARTBEAT) {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(frame);
        }
      }
    });
    terminal.onData(function (data) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(encodeStdinFrame(data));
      }
    });
  } catch (error) {
    setTerminalStatus('error', 'Connection failed');
    showError(error);
  }
}

// Closing used to be one function that called the dialog's native
// close() and tore down the socket/terminal in the same breath, bound
// only to the Close button's click handler. That missed the dialog's own
// "cancel" event -- what actually fires when someone presses Escape --
// so Escape closed the dialog visually while leaving the WebSocket
// connected and the xterm.js instance alive underneath it: still
// receiving output, still sending a heartbeat every 20s, invisible and
// unbounded for as long as the tab stayed open. Splitting this into two
// steps fixes that for every current and future way the dialog can
// close, not just the button: closeTerminal() (bound to the Close button
// and, below, to "cancel") plays the dialog-out/backdrop-out animation
// and then calls the dialog's own close(); teardownTerminal() -- bound to
// the dialog's "close" event, which the browser fires no matter how the
// dialog got closed -- does the actual cleanup exactly once.
function closeTerminal() {
  var dialog = el('terminal-dialog');
  if (!dialog.open || dialog.classList.contains('closing')) { return; }
  dialog.classList.add('closing');
  setTimeout(function () {
    dialog.classList.remove('closing');
    dialog.close();
  }, 160);
}

function teardownTerminal() {
  if (terminalResizeObserver) {
    terminalResizeObserver.disconnect();
    terminalResizeObserver = undefined;
  }
  if (terminalSocket) {
    terminalSocket.close(1000, 'Portal closing terminal');
    terminalSocket = undefined;
  }
  if (terminal) {
    terminal.dispose();
    terminal = undefined;
  }
  fitAddon = undefined;
}

function render() {
  var authenticated = signedIn();
  el('sign-in').hidden = authenticated;
  el('app').hidden = !authenticated;
  el('sign-out').hidden = !authenticated;
  var current = claims();
  el('who').textContent = authenticated && current ? (current.email || current.sub) : '';
  if (authenticated) { refresh(); }
}

el('start-session').addEventListener('click', startSession);
el('refresh').addEventListener('click', refresh);
el('terminal-close').addEventListener('click', closeTerminal);
el('terminal-dialog').addEventListener('close', teardownTerminal);
el('terminal-dialog').addEventListener('cancel', function (event) {
  // Default behavior for Escape on <dialog> is an instant, unanimated
  // close -- redirect it through the same animated closeTerminal() path
  // the Close button uses, so Escape is not a jarring exception to the
  // one considered close moment the rest of this dialog now has.
  event.preventDefault();
  closeTerminal();
});
el('sign-in').addEventListener('click', function () {
  login().catch(showError);
});
el('sign-out').addEventListener('click', signOut);

// The terminal only re-fits on its own open() call and on connect --
// without this, resizing the browser window (or rotating a tablet) leaves
// the xterm.js grid at whatever size it was created with, inside a
// container that has since changed shape.
window.addEventListener('resize', function () {
  if (el('terminal-dialog').open) { fitTerminal(); }
});

completeLogin()
  .then(render)
  .catch(showError);
`;
