// Claude Desktop / Cowork-3p bootstrap RESOURCE server (PKCE mode).
//
// Architecture (PKCE mode — bootstrapOidc set on the client):
//   The DESKTOP APP is a public client that runs its OWN authorization-code+PKCE flow against
//   Microsoft Entra, obtains an ACCESS TOKEN, and presents it as `Authorization: Bearer` when
//   fetching GET /user/bootstrap. This server is a pure OAuth RESOURCE SERVER: it validates that
//   Entra token (signature via Entra JWKS + iss + aud + exp) and returns the per-user config.
//
// Why PKCE (vs the earlier device-code single-origin design): device-code mode fences the
// bootstrap response — managedMcpServers whose URL is not same-origin as the bootstrap URL are
// DROPPED (observed: `bootstrap response contained cross-origin URL field(s); dropped`). That
// forced every managed MCP server to be reverse-proxied through our origin. PKCE mode DISABLES
// origin-pinning, so we deliver managed MCP servers with their REAL cross-origin URLs and their
// NATIVE auth (no proxy): a no-auth AgentCore search, an OAuth/Cognito SAPBW, a built-in M365,
// a future Databricks with its own inbound+outbound auth — each connects directly from the app.
//
// Inference is INDEPENDENT of bootstrap mode (per Anthropic docs): we keep
// inferenceProvider=gateway + inferenceCredentialKind=interactive, so the app does the Claude
// apps gateway's OWN device-code login for inference. The gateway is UNCHANGED — it does not
// (and cannot) validate the app's Entra token; it remains the device-code auth server for
// inference. Net: two sign-ins at launch (Entra PKCE for config/MCP + gateway device-code for
// inference), both against Entra, same identity.
//
// Org plugins/skills: network delivery (organizationPluginsUrl) is NOT available in PKCE mode.
// Plugins ship via the filesystem org-plugins/ directory instead. We therefore do NOT emit
// organizationPluginsUrl here.

import express from 'express';
import { jwtVerify, createRemoteJWKSet } from 'jose';
import { getConfig } from './config.js';

// ---- Config from environment ----
const PORT = parseInt(process.env.PORT || '8081', 10);
// Origin of the Claude apps gateway (unchanged) used for inferenceGatewayBaseUrl. In PKCE mode
// this need NOT be same-origin as the bootstrap server, but here they still share the gateway
// host — the app just authenticates to it via the gateway's own device-code login.
const PUBLIC_ORIGIN = required('PUBLIC_ORIGIN'); // e.g. https://claude-gw.example.com

// Entra token validation (resource-server). The app presents an Entra ACCESS TOKEN whose
// audience is the desktop app's client id (obtained via the `<clientId>/.default` scope).
const ENTRA_TENANT_ID = required('ENTRA_TENANT_ID');
const ENTRA_AUDIENCE = required('ENTRA_AUDIENCE'); // desktop public-client app id (the token's aud)

// Entra JWKS (same signing keys for v1 and v2 tokens). Cached + auto-refreshed by jose.
const ENTRA_JWKS = createRemoteJWKSet(
  new URL(`https://login.microsoftonline.com/${ENTRA_TENANT_ID}/discovery/v2.0/keys`),
);
// Entra issues ACCESS tokens as v1 (iss=sts.windows.net/<tid>/) or v2
// (iss=login.microsoftonline.com/<tid>/v2.0) depending on the app's requestedAccessTokenVersion.
// Accept BOTH so validation is robust regardless of that manifest setting.
const ENTRA_ISSUERS = [
  `https://login.microsoftonline.com/${ENTRA_TENANT_ID}/v2.0`,
  `https://sts.windows.net/${ENTRA_TENANT_ID}/`,
];

const app = express();
app.disable('x-powered-by');

// Log every request path (concise; helps trace client behaviour in CloudWatch).
app.use((req, _res, next) => {
  console.log(`[bootstrap] req ${req.method} ${req.originalUrl}`);
  next();
});

function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}
function noStore(res) {
  res.set('Cache-Control', 'no-store');
  res.set('Pragma', 'no-cache');
}

// Validate the Entra access token the app presents (PKCE mode). Checks signature against Entra
// JWKS + issuer (v1 or v2) + audience (the desktop client id) + expiry. Returns the claims, or
// null (and sends 401) on any failure. This is the doc-specified contract: "Verify the bearer
// token's signature against your identity provider's JWKS, and check iss, aud, and exp."
async function requireEntraToken(req, res) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) {
    console.log('[bootstrap] 401 no bearer token');
    res.status(401).json({ error: 'invalid_token' });
    return null;
  }
  try {
    const { payload } = await jwtVerify(token, ENTRA_JWKS, {
      issuer: ENTRA_ISSUERS,
      audience: ENTRA_AUDIENCE,
    });
    console.log(`[bootstrap] auth.ok sub=${payload.sub || '?'} oid=${payload.oid || '?'} email=${payload.email || payload.upn || '?'}`);
    return payload;
  } catch (e) {
    console.log(`[bootstrap] 401 token verify failed: ${e.message}`);
    res.status(401).json({ error: 'invalid_token' });
    return null;
  }
}

// ---- Liveness ----
app.get('/healthz', (_req, res) => res.status(200).send('ok'));

// ---- Per-user bootstrap config (v2). PKCE mode: origin-pinning is disabled. ----
app.get('/user/bootstrap', async (req, res) => {
  noStore(res);
  const claims = await requireEntraToken(req, res);
  if (!claims) return;

  const cfg = await getConfig();
  res.json({
    // Inference stays on the Claude apps gateway via its OWN device-code login (independent of
    // bootstrap mode). PKCE lifts origin-pinning, so this cross-origin gateway URL is allowed.
    inferenceProvider: 'gateway',
    inferenceGatewayBaseUrl: PUBLIC_ORIGIN,
    inferenceCredentialKind: 'interactive',
    inferenceModels: cfg.inferenceModels,
    // Governance: when false, BARS user-added (local/stdio) MCP servers so ONLY the managed
    // servers below are available. Omit in the S3 config to keep the client default (true).
    ...(cfg.allowUserAddedMcpServers === undefined
      ? {}
      : { isLocalDevMcpEnabled: cfg.allowUserAddedMcpServers }),
    // Surface toggles (bootstrap-config-v2 schema): chatTabEnabled / coworkTabEnabled /
    // isClaudeCodeForDesktopEnabled. Emitted only when set in the S3 config so an omitted
    // key keeps the client default.
    ...(cfg.chatTabEnabled === undefined ? {} : { chatTabEnabled: cfg.chatTabEnabled }),
    ...(cfg.coworkTabEnabled === undefined ? {} : { coworkTabEnabled: cfg.coworkTabEnabled }),
    ...(cfg.isClaudeCodeForDesktopEnabled === undefined
      ? {}
      : { isClaudeCodeForDesktopEnabled: cfg.isClaudeCodeForDesktopEnabled }),
    // Disable the app's BUILT-IN server-side web search (Anthropic web_search_20250305 tool,
    // executed by the inference provider). Bedrock rejects that tool type with a 400, so chat
    // burns two failed attempts before falling back to the managed web-search MCP. False =
    // go straight to the MCP. Mirrors the CLI-side `permissions.deny: [WebSearch]` in
    // gateway.yaml — same reason, different surface.
    ...(cfg.coworkWebSearchEnabled === undefined
      ? {}
      : { coworkWebSearchEnabled: cfg.coworkWebSearchEnabled }),
    // Governance knobs (schema v2), passed through verbatim when set in the S3 config so
    // future flips are config-only. banner: org banner bar. disableNonessentialTelemetry:
    // blocks Segment + event_logging (no message content either way). disableNonessential-
    // Services: ALSO kills artifact previews + connector icons — leave unset/false unless a
    // security review demands it. disabledBuiltinTools/builtinToolPolicy: remove or gate
    // built-in tools app-wide. Token-window keys: client-side token cap per rolling window.
    ...Object.fromEntries(
      [
        'banner',
        'disableNonessentialTelemetry',
        'disableNonessentialServices',
        'disabledBuiltinTools',
        'builtinToolPolicy',
        'isDesktopExtensionSignatureRequired',
        'inferenceMaxTokensPerWindow',
        'inferenceTokenWindowHours',
        'allowedWorkspaceFolders',
      ]
        .filter(k => cfg[k] !== undefined)
        .map(k => [k, cfg[k]]),
    ),
    // Org-wide managed MCP servers, emitted under the published bootstrap-config
    // schema's flat `managedMcpServers` key. Per the platform contract, the bootstrap
    // overlay's value REPLACES (never merges with) any static MDM-tier value, so this
    // response owns the whole fleet; omit `managedMcpServers` in the S3 config to
    // leave the key out entirely. Entry kinds:
    //   1. BUILT-IN (`server`): in-process connector (microsoft365, websearch) — verbatim.
    //   2. OAUTH remote (`oauth`): client runs its own OAuth code+loopback flow, connects
    //      directly to the real url with its own token.
    //   3. NO-AUTH remote: plain remote HTTP/SSE endpoint (PKCE mode = no origin-pinning).
    ...((cfg.managedMcpServers ?? cfg.mcpServers) === undefined ? {} : {
      managedMcpServers: (cfg.managedMcpServers ?? cfg.mcpServers).map(s => {
        if (s.server) {
          const { upstream, url, transport, ...builtin } = s;
          return builtin;
        }
        const out = {
          name: s.name,
          transport: s.transport || 'http',
          // Accept either `url` (native) or legacy `upstream` (proxy-era config) as the
          // real endpoint. No rewriting — the client connects here directly.
          url: s.url || s.upstream,
        };
        if (s.oauth) out.oauth = s.oauth;
        if (s.headers) out.headers = s.headers;
        if (s.toolPolicy) out.toolPolicy = s.toolPolicy;
        return out;
      }),
    }),
    coworkEgressAllowedHosts: cfg.coworkEgressAllowedHosts || ['*.internal.claude.local'],
    // OTLP export (Desktop/Cowork): pass through whatever collector endpoint the S3
    // config names. With claude-apps-gateway, point it at the gateway ALB's :4318 OTLP
    // listener (the stack's OtelForwardTo output) — the same ADOT collector the gateway
    // pushes CLI telemetry to.
    ...(cfg.otlpEndpoint === undefined ? {} : { otlpEndpoint: cfg.otlpEndpoint }),
    ...(cfg.otlpProtocol === undefined ? {} : { otlpProtocol: cfg.otlpProtocol }),
    ...(cfg.otlpHeaders === undefined ? {} : { otlpHeaders: cfg.otlpHeaders }),
    // Static attributes from S3 config merge under the per-user identity stamp.
    otlpResourceAttributes: {
      ...(cfg.otlpResourceAttributes || {}),
      'user.email': String(claims.email || claims.upn || ''),
    },
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
    // NOTE: organizationPluginsUrl intentionally omitted — network plugin delivery is not
    // available in PKCE mode. Org plugins/skills ship via the filesystem org-plugins/ directory
    // (/Library/Application Support/Claude/org-plugins/ on macOS).
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[bootstrap] PKCE resource server listening on 0.0.0.0:${PORT}, origin=${PUBLIC_ORIGIN}, aud=${ENTRA_AUDIENCE}`);
});
