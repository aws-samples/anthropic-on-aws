// Static portal assets served by portal/handler.ts through the private API.
// This is a minimal placeholder for claude-code-on-agentcore-runtime-microvm:
// only the Terminal access mode is implemented in this sample (see
// docs/deployment-guide.md), so the page only needs session lifecycle
// controls and an xterm.js terminal dialog -- no VS Code tunnel UI.

export const PORTAL_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Claude AgentCore Runtime portal</title>
<link rel="icon" href="data:,">
<link rel="stylesheet" href="xterm.css">
<style>
  :root {
    color-scheme: light;
    font-family: -apple-system, "Segoe UI", Roboto, system-ui, sans-serif;
    --ink: #16211f;
    --sub: #5b6b68;
    --line: #dde4e2;
    --bg: #f6f8f7;
    --card: #ffffff;
    --brand: #cc785c;
    --brand-dark: #a85c42;
    --danger: #b42318;
    --danger-bg: #fdf1ef;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--ink);
    line-height: 1.5;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.75rem;
    border-bottom: 1px solid var(--line);
    background: var(--card);
  }
  header h1 {
    font-size: 1.15rem;
    font-weight: 600;
    margin: 0;
    letter-spacing: -0.01em;
  }
  header div { display: flex; align-items: center; gap: .75rem; font-size: .9rem; color: var(--sub); }
  main { padding: 2rem 1.75rem; max-width: 62rem; margin: 0 auto; }
  #app > div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.25rem;
  }
  #app > div > div { display: flex; gap: .6rem; }
  button {
    border: 1px solid var(--line);
    border-radius: 6px;
    background: var(--card);
    color: var(--ink);
    padding: .5rem .9rem;
    font-size: .875rem;
    font-weight: 500;
    cursor: pointer;
    transition: border-color .15s, background .15s;
  }
  button:hover { border-color: var(--brand); }
  button:disabled { opacity: .55; cursor: default; }
  button.primary {
    background: var(--brand);
    color: #fff;
    border-color: var(--brand);
  }
  button.primary:hover { background: var(--brand-dark); border-color: var(--brand-dark); }
  table {
    width: 100%;
    border-collapse: collapse;
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: 10px;
    overflow: hidden;
  }
  th, td { text-align: left; padding: .65rem .9rem; font-size: .875rem; }
  th {
    color: var(--sub);
    font-weight: 600;
    font-size: .78rem;
    text-transform: uppercase;
    letter-spacing: .04em;
    border-bottom: 1px solid var(--line);
  }
  td { border-bottom: 1px solid var(--line); }
  .storage-cell { font-size: .82rem; color: var(--sub); white-space: nowrap; }
  .storage-summary { color: var(--ink); margin-right: .6rem; }
  .storage-empty { color: var(--sub); font-style: italic; }
  .storage-download {
    color: var(--brand);
    text-decoration: none;
    font-weight: 600;
  }
  .storage-download:hover { text-decoration: underline; }
  tbody tr:last-child td { border-bottom: none; }
  tbody tr:hover { background: #fafbfa; }
  dialog {
    width: min(92vw, 64rem);
    border: none;
    border-radius: 10px;
    padding: 0;
    box-shadow: 0 20px 60px rgba(0,0,0,.25);
  }
  dialog::backdrop { background: rgba(15, 20, 19, .55); }
  #terminal-screen { height: 62vh; background: #141a1f; padding: .6rem; border-radius: 10px 10px 0 0; }
  #terminal-dialog button { border-radius: 0 0 10px 10px; width: 100%; border: none; background: #1c2429; color: #cfd8d6; padding: .6rem; }
  #terminal-dialog button:hover { background: #262f35; border-color: transparent; }
  #error {
    color: var(--danger);
    background: var(--danger-bg);
    border: 1px solid #f3d4d0;
    border-radius: 6px;
    padding: .6rem .9rem;
    margin-top: 1rem;
    font-size: .875rem;
  }
</style>
</head>
<body>
<header>
  <h1>Claude AgentCore Runtime</h1>
  <div>
    <span id="who"></span>
    <button id="sign-out" hidden>Sign out</button>
  </div>
</header>
<main>
  <button id="sign-in" class="primary">Sign in</button>
  <section id="app" hidden>
    <div>
      <div>
        <button id="start-session" class="primary">Create environment</button>
        <button id="refresh">Refresh</button>
      </div>
    </div>
    <table>
      <thead>
        <tr><th>Session</th><th>Workspace</th><th>State</th><th>Updated</th><th>Storage</th><th></th></tr>
      </thead>
      <tbody id="sessions"></tbody>
    </table>
    <p id="error" hidden></p>
  </section>
</main>
<dialog id="terminal-dialog">
  <div id="terminal-screen"></div>
  <button id="terminal-close">Close</button>
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

function renderSessions() {
  var body = el('sessions');
  body.replaceChildren();
  sessions.forEach(function (session) {
    var row = document.createElement('tr');
    var cells = [
      session.sessionId.slice(0, 8),
      session.workspaceId,
      session.state,
      new Date(session.updatedAt * 1000).toLocaleString()
    ];
    cells.forEach(function (text) {
      var cell = document.createElement('td');
      cell.textContent = text;
      row.appendChild(cell);
    });
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

function openTerminal(session) {
  clearError();
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
    fontFamily: '"SF Mono", "Cascadia Code", "Fira Code", Menlo, Consolas, monospace',
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
    // truecolor output renders.
    theme: {
      background: '#141a1f',
      foreground: '#e8ecee',
      cursor: '#e8664a',
      cursorAccent: '#141a1f',
      selectionBackground: '#2a3a42',
      black: '#141a1f',
      red: '#e8664a',
      green: '#4caf7d',
      yellow: '#e0b84a',
      blue: '#5b9bd5',
      magenta: '#b98cce',
      cyan: '#4dbfbf',
      white: '#e8ecee',
      brightBlack: '#5a6670',
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
var SHELL_CHANNEL_HEARTBEAT = 0x05;

function encodeStdinFrame(text) {
  var body = new TextEncoder().encode(text);
  var frame = new Uint8Array(body.length + 1);
  frame[0] = SHELL_CHANNEL_STDIN;
  frame.set(body, 1);
  return frame;
}

async function connectTerminal(session) {
  try {
    var connection = await api('POST', 'sessions/' + session.sessionId + '/connect', {});
    var socket = new WebSocket(connection.shellUrl);
    terminalSocket = socket;
    socket.binaryType = 'arraybuffer';
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
    socket.addEventListener('close', function () { clearInterval(heartbeatTimer); });
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
    showError(error);
  }
}

function closeTerminal() {
  el('terminal-dialog').close();
  if (terminalSocket) {
    terminalSocket.close(1000, 'Portal closing terminal');
    terminalSocket = undefined;
  }
  if (terminal) {
    terminal.dispose();
    terminal = undefined;
  }
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
el('sign-in').addEventListener('click', function () {
  login().catch(showError);
});
el('sign-out').addEventListener('click', signOut);

completeLogin()
  .then(render)
  .catch(showError);
`;
