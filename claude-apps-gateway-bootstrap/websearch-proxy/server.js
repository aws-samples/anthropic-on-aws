// Resource-stripping OAuth proxy for Claude Desktop + Microsoft Entra ID + AgentCore Gateway.
//
// WHY THIS EXISTS
// ---------------
// Amazon Bedrock AgentCore Gateway advertises itself as an MCP resource server. A spec-
// compliant MCP client (Claude Desktop, mcp-remote, Claude Code >= the 2025-06-18 auth spec)
// discovers the gateway's Protected Resource Metadata (RFC 9728) and then includes an RFC 8707
// `resource` parameter (= the gateway URL) in its /authorize and /token requests. Microsoft
// Entra ID does NOT implement RFC 8707 and rejects that parameter:
//
//     AADSTS9010010: The resource parameter provided in the request doesn't match with the
//     requested scopes.
//
// There is no client-side config knob to suppress the parameter (confirmed against Claude
// Desktop's managed-MCP `oauth` block and mcp-remote). The documented fix (Microsoft / the
// widely-cited "10 Entra + MCP incompatibilities" write-up) is an OAuth proxy that sits in
// front of the resource server and STRIPS the `resource` parameter before relaying to Entra.
// The scope (api://<clientId>/mcp.invoke) already encodes the target, so stripping is safe.
//
// WHAT IT DOES
// ------------
// Claude talks ONLY to this proxy. The proxy:
//   * /.well-known/oauth-protected-resource  -> points the client at THIS proxy as the AS
//   * /.well-known/oauth-authorization-server -> Entra's OIDC metadata, but with authorize/
//                                                token endpoints rewritten to this proxy
//   * /oauth/authorize                        -> strip `resource`, 302 to Entra authorize
//   * /oauth/token                            -> strip `resource`, forward to Entra token
//   * /oauth/register                         -> mock DCR (Desktop uses a static clientId and
//                                                normally skips this; kept for other clients)
//   * /mcp                                    -> reverse-proxy (streaming) to the AgentCore
//                                                gateway, forwarding the Authorization header
//
// The AgentCore gateway is left unchanged: it still validates the Entra JWT it receives
// (discoveryUrl = Entra, allowedAudience = the client id). The redirect_uri stays the client's
// own loopback (the proxy passes it through), so Entra redirect registration is unchanged.
//
// DEPLOYMENT SHAPE
// ----------------
// Hosted internally behind the claude-apps-gateway ALB (same pattern as the bootstrap add-on),
// reached by the laptop over the VPN and reaching the public AgentCore gateway via NAT egress.
// The ALB routes a path prefix (e.g. /websearch/*) here WITHOUT stripping it, so the functional
// routes are mounted under BASE_PATH and every self-referencing URL uses PUBLIC_BASE_URL.

import express from 'express';
import https from 'node:https';
import http from 'node:http';

const PORT = parseInt(process.env.PORT || '8082', 10);

// Externally visible origin of the fronting ALB, e.g. https://claude-gateway.example.com
const PUBLIC_ORIGIN = (process.env.PUBLIC_ORIGIN || '').replace(/\/+$/, '');
// Path prefix the ALB forwards to this service (NOT stripped by the ALB), e.g. /websearch.
// Empty string mounts at root (dedicated-host deployments).
const BASE_PATH = (process.env.BASE_PATH || '').replace(/\/+$/, '');
// The full externally visible base URL of this proxy; all metadata is self-referential to it.
const PUBLIC_BASE_URL = `${PUBLIC_ORIGIN}${BASE_PATH}`;

// Upstream AgentCore gateway MCP endpoint, e.g.
// https://<id>.gateway.bedrock-agentcore.us-east-1.amazonaws.com/mcp
const UPSTREAM_MCP_URL = process.env.UPSTREAM_MCP_URL || '';

// Entra tenant issuer discovery.
const ENTRA_TENANT_ID = process.env.ENTRA_TENANT_ID || '';
const ENTRA_DISCOVERY_URL =
  process.env.ENTRA_DISCOVERY_URL ||
  `https://login.microsoftonline.com/${ENTRA_TENANT_ID}/v2.0/.well-known/openid-configuration`;

// Optional static client_id returned by the mock DCR endpoint (only for clients that attempt
// RFC 7591 dynamic registration; Claude Desktop supplies a static clientId and skips it).
const MCP_CLIENT_ID = process.env.MCP_CLIENT_ID || '';

if (!PUBLIC_ORIGIN || !UPSTREAM_MCP_URL || !ENTRA_TENANT_ID) {
  console.error(
    '[websearch-proxy] required env missing: PUBLIC_ORIGIN, UPSTREAM_MCP_URL, ENTRA_TENANT_ID',
  );
  process.exit(1);
}

const upstream = new URL(UPSTREAM_MCP_URL);
const PRM_URL = `${PUBLIC_BASE_URL}/.well-known/oauth-protected-resource`;

// ── Entra OIDC metadata (cached 1h) ──────────────────────────────────────────
let oidcMeta = null;
let oidcMetaAt = 0;
async function getEntraMeta() {
  if (oidcMeta && Date.now() - oidcMetaAt < 3600_000) return oidcMeta;
  const r = await fetch(ENTRA_DISCOVERY_URL);
  if (!r.ok) throw new Error(`OIDC discovery ${r.status}`);
  oidcMeta = await r.json();
  oidcMetaAt = Date.now();
  return oidcMeta;
}

const app = express();
app.disable('x-powered-by');

// Root health check — the ALB target group probes the container directly (independent of the
// listener path rule), so this stays at root regardless of BASE_PATH.
app.get('/healthz', (_req, res) => res.status(200).send('ok'));

// Everything functional is mounted under BASE_PATH because the ALB does not strip the prefix.
const r = express.Router();

// Health check under the prefix too (lets the TG health check path match the listener rule).
r.get('/healthz', (_req, res) => res.status(200).send('ok'));

// RFC 9728 Protected Resource Metadata: advertise THIS proxy as the authorization server so
// the client drives the OAuth dance through us (where the resource parameter is stripped).
r.get('/.well-known/oauth-protected-resource', (_req, res) => {
  res.json({
    resource: `${PUBLIC_BASE_URL}/mcp`,
    authorization_servers: [PUBLIC_BASE_URL],
    bearer_methods_supported: ['header'],
  });
});

// RFC 8414 Authorization Server Metadata: relay Entra's real metadata but override the
// endpoints the client will call so authorize/token/register route through this proxy.
async function authServerMetadata(_req, res) {
  try {
    const m = await getEntraMeta();
    res.json({
      ...m,
      issuer: PUBLIC_BASE_URL,
      authorization_endpoint: `${PUBLIC_BASE_URL}/oauth/authorize`,
      token_endpoint: `${PUBLIC_BASE_URL}/oauth/token`,
      registration_endpoint: `${PUBLIC_BASE_URL}/oauth/register`,
      code_challenge_methods_supported: ['S256'],
    });
  } catch (e) {
    res.status(502).json({ error: 'metadata_unavailable', detail: String(e.message) });
  }
}
r.get('/.well-known/oauth-authorization-server', authServerMetadata);
// Some clients probe the OIDC discovery path directly; serve the same shape.
r.get('/.well-known/openid-configuration', authServerMetadata);

// Authorize: strip `resource`, 302 to Entra's real authorization endpoint with all other
// params (client_id, redirect_uri, scope, state, PKCE challenge, prompt, ...) untouched.
r.get('/oauth/authorize', async (req, res) => {
  try {
    const m = await getEntraMeta();
    const url = new URL(m.authorization_endpoint);
    for (const [k, v] of Object.entries(req.query)) {
      if (k === 'resource') continue; // ← the whole point
      url.searchParams.set(k, Array.isArray(v) ? String(v[0]) : String(v));
    }
    res.redirect(302, url.toString());
  } catch (e) {
    res.status(502).send(`authorize proxy error: ${e.message}`);
  }
});

// Token: strip `resource`, forward the form-encoded body to Entra's real token endpoint,
// return the token response verbatim. Public client + PKCE → no client secret to add.
r.post('/oauth/token', express.urlencoded({ extended: false }), async (req, res) => {
  try {
    const m = await getEntraMeta();
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(req.body || {})) {
      if (k === 'resource') continue; // ← the whole point
      params.set(k, String(v));
    }
    const upstreamResp = await fetch(m.token_endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: params.toString(),
    });
    const body = await upstreamResp.text();
    res
      .status(upstreamResp.status)
      .set('Content-Type', upstreamResp.headers.get('content-type') || 'application/json')
      .send(body);
  } catch (e) {
    res.status(502).json({ error: 'token_proxy_error', detail: String(e.message) });
  }
});

// Mock Dynamic Client Registration (RFC 7591). Entra has no DCR; Claude Desktop supplies a
// static clientId and does not call this. Kept for spec-completeness / other MCP clients.
r.post('/oauth/register', express.json(), (req, res) => {
  const requested = req.body || {};
  res.status(201).json({
    client_id: MCP_CLIENT_ID || requested.client_id || '',
    client_id_issued_at: Math.floor(Date.now() / 1000),
    client_secret_expires_at: 0,
    token_endpoint_auth_method: 'none',
    grant_types: Array.isArray(requested.grant_types)
      ? requested.grant_types
      : ['authorization_code', 'refresh_token'],
    response_types: Array.isArray(requested.response_types) ? requested.response_types : ['code'],
    redirect_uris: Array.isArray(requested.redirect_uris)
      ? requested.redirect_uris
      : ['http://127.0.0.1/callback'],
    scope: requested.scope,
  });
});

// Reverse-proxy /mcp to the upstream AgentCore gateway, streaming both directions (MCP uses
// Streamable HTTP: a POST may return JSON or a long-lived SSE stream). No body parsing here —
// the raw request is piped straight through.
r.all('/mcp', (req, res) => {
  // No token yet → return OUR 401 so the client discovers THIS proxy's PRM (not the gateway's).
  if (!req.headers.authorization) {
    res.set('WWW-Authenticate', `Bearer resource_metadata="${PRM_URL}"`);
    return res
      .status(401)
      .json({ jsonrpc: '2.0', id: 0, error: { code: -32001, message: 'Missing Bearer token' } });
  }
  const mod = upstream.protocol === 'https:' ? https : http;
  const headers = { ...req.headers, host: upstream.host };
  delete headers['content-length']; // recomputed by the pipe / chunked
  const proxyReq = mod.request(
    {
      method: req.method,
      hostname: upstream.hostname,
      port: upstream.port || (upstream.protocol === 'https:' ? 443 : 80),
      path: upstream.pathname + (upstream.search || ''),
      headers,
    },
    (proxyRes) => {
      // If the gateway itself challenges, rewrite its resource_metadata pointer to ours so the
      // client re-discovers through the proxy rather than hitting the gateway's PRM directly.
      const wa = proxyRes.headers['www-authenticate'];
      if (wa) {
        proxyRes.headers['www-authenticate'] = wa.replace(
          /resource_metadata="[^"]*"/,
          `resource_metadata="${PRM_URL}"`,
        );
      }
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(res);
    },
  );
  proxyReq.on('error', (e) => {
    if (!res.headersSent) {
      res.status(502).json({ error: 'upstream_error', detail: String(e.message) });
    } else {
      res.end();
    }
  });
  req.pipe(proxyReq);
});

app.use(BASE_PATH || '/', r);

app.listen(PORT, '0.0.0.0', () => {
  console.log(
    `[websearch-proxy] listening on 0.0.0.0:${PORT} — base=${PUBLIC_BASE_URL || '(root)'} upstream=${UPSTREAM_MCP_URL}`,
  );
});
