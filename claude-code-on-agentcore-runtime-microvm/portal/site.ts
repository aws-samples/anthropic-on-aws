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
  :root { color-scheme: light; font-family: system-ui, sans-serif; }
  body { margin: 0; background: #f5f7f8; color: #182126; }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: .75rem 1.5rem;
    border-bottom: 1px solid #d7dfe2;
    background: #fff;
  }
  main { padding: 1.5rem; max-width: 60rem; margin: 0 auto; }
  button {
    border: 1px solid #d7dfe2;
    border-radius: 4px;
    background: #fff;
    padding: .45rem .75rem;
    cursor: pointer;
  }
  button.primary { background: #006d77; color: #fff; border-color: #006d77; }
  table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
  th, td { text-align: left; padding: .5rem; border-bottom: 1px solid #eef2f3; }
  dialog { width: min(90vw, 60rem); border: none; border-radius: 6px; padding: 0; }
  #terminal-screen { height: 60vh; background: #101418; padding: .5rem; }
  #error { color: #b42318; margin-top: .5rem; }
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
    <button id="start-session" class="primary">Create environment</button>
    <button id="refresh">Refresh</button>
    <table>
      <thead>
        <tr><th>Session</th><th>Workspace</th><th>State</th><th>Updated</th><th></th></tr>
      </thead>
      <tbody id="sessions"></tbody>
    </table>
    <p id="error"></p>
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
  var response = await fetch('config.json');
  config = await response.json();
}

function api(method, path, body) {
  return fetch(path, {
    method: method,
    headers: body ? { 'content-type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include'
  }).then(function (response) {
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
}

function clearError() { el('error').textContent = ''; }

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
  try {
    await api('POST', 'sessions', { accessMode: 'terminal' });
    await refresh();
  } catch (error) {
    showError(error);
  }
}

var terminal;
var terminalSocket;

function openTerminal(session) {
  clearError();
  el('terminal-dialog').showModal();
  terminal = new window.Terminal({ convertEol: true });
  terminal.open(el('terminal-screen'));
  connectTerminal(session);
}

async function connectTerminal(session) {
  try {
    var connection = await api('POST', 'sessions/' + session.sessionId + '/connect', {});
    var socket = new WebSocket(connection.shellUrl);
    terminalSocket = socket;
    socket.binaryType = 'arraybuffer';
    socket.addEventListener('message', function (event) {
      if (typeof event.data === 'string') {
        terminal.write(event.data);
      } else {
        terminal.write(new Uint8Array(event.data));
      }
    });
    terminal.onData(function (data) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(new TextEncoder().encode(data));
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

el('start-session').addEventListener('click', startSession);
el('refresh').addEventListener('click', refresh);
el('terminal-close').addEventListener('click', closeTerminal);
el('sign-in').addEventListener('click', function () {
  loadConfig().then(function () {
    window.location.href =
      'https://' + config.userPoolDomain + '/login?client_id=' +
      config.clientId + '&response_type=code&redirect_uri=' +
      encodeURIComponent(config.redirectUri);
  });
});

el('app').hidden = false;
el('sign-in').hidden = true;
refresh();
`;
