# Web search OAuth proxy (Entra ID → AgentCore Gateway)

A tiny **resource-stripping OAuth proxy** that lets Claude Desktop / Cowork use an
Amazon Bedrock **AgentCore Gateway** MCP server (for example the AgentCore web
search tool) when your identity provider is **Microsoft Entra ID**.

It exists to work around a concrete incompatibility between the MCP OAuth spec and
Entra. If your IdP is Amazon Cognito (or another provider that implements RFC 8707),
you do **not** need this — point the managed MCP entry straight at the gateway.

---

## The problem: `AADSTS9010010`

An AgentCore Gateway presents itself as an MCP **resource server**. A spec-compliant
MCP client (Claude Desktop's managed-MCP `oauth` flow, `mcp-remote`, Claude Code on
the 2025-06-18 auth spec) does this on first connect:

1. `POST /mcp` with no token → the gateway answers `401` with a `WWW-Authenticate`
   header pointing at its **Protected Resource Metadata** (PRM, [RFC 9728]).
2. The client reads the PRM, learns the authorization server, and — because the MCP
   auth spec mandates **Resource Indicators** ([RFC 8707]) — adds a `resource`
   parameter equal to the gateway URL on the `/authorize` and `/token` requests.

Microsoft Entra ID does **not** implement RFC 8707. When it sees that `resource`
parameter it rejects the token exchange:

```
AADSTS9010010: The resource parameter provided in the request doesn't match with
the requested scopes.  (error=invalid_target, HTTP 400 at the token endpoint)
```

The scope (`api://<clientId>/mcp.invoke`) already identifies the target API, so the
`resource` parameter is redundant here — but the client sends it and Entra refuses.

### Why you can't just fix it on the client

There is **no configuration knob** to suppress the `resource` parameter:

- Claude Desktop's managed-MCP `oauth` block (`clientId` / `tenantId` /
  `authorizationServer` / `scope`) always drives the PRM flow and emits `resource`.
- `mcp-remote` builds the same `resource` parameter from the server URL (verified:
  it appears verbatim in the `/authorize` URL it opens).
- Claude Code has the same behaviour — tracked upstream in
  [anthropics/claude-code#73460][issue-73460] ("allow overriding or omitting the
  RFC 8707 resource parameter").

So the mismatch is structural: fix it **in front of the resource server**, not in
the client.

---

## The fix: an OAuth proxy that strips `resource`

This is the pattern Microsoft and the community document for "Entra + MCP": put a
small proxy in front of the MCP server that mediates the OAuth handshake and removes
the `resource` parameter before relaying to Entra. See
[Building Claude-Ready Entra ID-Protected MCP Servers with Azure API Management][ms-apim]
and the write-up [10 Azure Entra ID incompatibilities with MCP server auth][groff]
(incompatibility #3 is exactly `AADSTS9010010`; the fix is to strip `resource`).
AWS's own [auth-code walkthrough for AgentCore Gateway + MCP clients][aws-authcode]
likewise inserts an "MCP OAuth proxy" to bridge these spec gaps.

For **Claude Desktop specifically**, the proxy can be minimal: Desktop uses a static
`clientId` and does not attempt Dynamic Client Registration, so the only real
incompatibility to neutralise is the `resource` parameter (#3). The other items in
the write-up — mock DCR, RFC 8414 metadata, issuer/audience quirks — are handled for
completeness but are not the blocker here.

Claude talks **only** to the proxy; the proxy relays to Entra (minus `resource`) and
reverse-proxies `/mcp` to the gateway. The **AgentCore Gateway is unchanged** — its
`CUSTOM_JWT` authorizer still validates the Entra token it receives
([inbound JWT authorizer][agentcore-jwt]).

### Endpoints

| Endpoint | Role |
|---|---|
| `GET /.well-known/oauth-protected-resource` | PRM — advertises **this proxy** as the authorization server |
| `GET /.well-known/oauth-authorization-server`, `/.well-known/openid-configuration` | Entra's OIDC metadata, but with `authorize`/`token`/`register` rewritten to the proxy |
| `GET /oauth/authorize` | **strips `resource`**, 302 to Entra's real authorize endpoint |
| `POST /oauth/token` | **strips `resource`**, forwards the form to Entra's real token endpoint |
| `POST /oauth/register` | mock DCR ([RFC 7591]) — Desktop skips it; kept for other clients |
| `ALL /mcp` | streaming reverse-proxy to the AgentCore gateway, forwarding `Authorization`; on a missing/invalid token returns `401` with the proxy's own PRM pointer |
| `GET /healthz` | health check (served at root, for the ALB target group) |

### Flow

```
Claude Desktop ──POST /mcp (no token)──▶ PROXY ──401 WWW-Authenticate: resource_metadata=PROXY PRM
   ─GET PRM─▶ PROXY  (authorization_servers = [PROXY])
   ─GET AS metadata─▶ PROXY  (authorize/token = PROXY)
   ─browser /oauth/authorize (…&resource=…)─▶ PROXY ─(strip resource)─▶ Entra ─▶ user login
   Entra ─▶ redirect to http://127.0.0.1:<port>/callback?code=…   (client loopback, unchanged)
   ─POST /oauth/token (code+PKCE+resource)─▶ PROXY ─(strip resource)─▶ Entra ─▶ access token
   ─POST /mcp  Authorization: Bearer <token>─▶ PROXY ─▶ AgentCore Gateway ─▶ web search tool
```

The `redirect_uri` stays the client's own loopback and is passed through untouched,
so **no new Entra redirect registration is required** beyond the loopback the client
already uses.

---

## Configuration (env)

| Var | Required | Meaning |
|---|---|---|
| `PORT` | no (8082) | listen port |
| `PUBLIC_ORIGIN` | yes | externally visible origin of the fronting ALB, e.g. `https://claude-gateway.example.com` |
| `BASE_PATH` | no (`""`) | path prefix the ALB routes here (not stripped by the ALB), e.g. `/websearch` |
| `UPSTREAM_MCP_URL` | yes | AgentCore gateway MCP URL, e.g. `https://<id>.gateway.bedrock-agentcore.<region>.amazonaws.com/mcp` |
| `ENTRA_TENANT_ID` | yes | Entra tenant whose OIDC metadata/authorize/token are relayed |
| `ENTRA_DISCOVERY_URL` | no | override the OIDC discovery URL (defaults from tenant) |
| `MCP_CLIENT_ID` | no | static client id returned by the mock DCR endpoint |

Self-referential metadata is built from `PUBLIC_ORIGIN + BASE_PATH`.

---

## Deploy (CDK, two-pass)

Hosted behind the **existing internal gateway ALB** (same pattern as the bootstrap
add-on): a path-prefix listener rule routes `<basePath>/*` to a Fargate service in a
private subnet; the service reaches the public AgentCore gateway and Entra via NAT.
The gateway stack is consumed unmodified through its outputs. The stack is opt-in via
`-c enableWebsearchProxy=true`, so the default bootstrap deploy is unaffected.

First collect the gateway outputs (see the bootstrap README for the same lookups):
`publicUrl`, the ALB `:443` `listenerArn`, `albSgId`, `vpcId`.

```bash
# Pass 1 — create the ECR repo only
cd cdk
cdk deploy ClaudeWebsearchProxyStack -c enableWebsearchProxy=true -c imageReady=false

# Build + push the image to the EcrRepositoryUri from pass 1 (Fargate = linux/amd64)
cd ../websearch-proxy
REPO=<EcrRepositoryUri>
aws ecr get-login-password --region <region> | finch login --username AWS --password-stdin "${REPO%%/*}"
finch build --platform linux/amd64 -t "${REPO}:latest" .
finch push "${REPO}:latest"

# Pass 2 — deploy the service + listener rule
cd ../cdk
cdk deploy ClaudeWebsearchProxyStack -c enableWebsearchProxy=true \
  -c publicUrl=https://claude-gateway.example.com \
  -c listenerArn=<gateway ALB :443 listener ARN> \
  -c albSgId=<gateway ALB SG id> -c vpcId=<gateway VPC id> \
  -c entraTenantId=<tenant> \
  -c upstreamMcpUrl=https://<id>.gateway.bedrock-agentcore.<region>.amazonaws.com/mcp \
  -c mcpClientId=<entra public client id> -c basePath=/websearch
```

Stack outputs `WebsearchMcpUrl` — the URL to put in the bootstrap config.

## Wire the bootstrap config

Add a normal remote `http` + `oauth` entry to `managedMcpServers` pointing at the
proxy (not the gateway). No change to the bootstrap server is needed — it passes the
`oauth` block through:

```json
{
  "name": "agentcore-websearch",
  "transport": "http",
  "url": "https://claude-gateway.example.com/websearch/mcp",
  "oauth": {
    "clientId": "<entra public client id>",
    "authorizationServer": ["https://claude-gateway.example.com/websearch"],
    "scope": "openid offline_access api://<entra public client id>/mcp.invoke",
    "callbackHost": "localhost",
    "callbackPort": 8990
  }
}
```

Also add the gateway host to `coworkEgressAllowedHosts`. The Entra app needs the
loopback `http://localhost:<callbackPort>/callback` registered under *Mobile and
desktop applications* and the `api://<clientId>/mcp.invoke` scope exposed
(`requestedAccessTokenVersion: 2`); the gateway authorizer's `allowedAudience` stays
the client id.

---

## Security

- Deploy the proxy **internal-only** (behind the VPN'd gateway ALB). It mediates
  OAuth and relays tokens in transit; it must not be exposed publicly.
- It holds **no secrets** (public client + PKCE); it never persists tokens and must
  not log them. TLS end-to-end.
- It is in the hot path for all web-search MCP traffic — monitor health/availability.

## Local smoke test

`local-test/` (gitignored, throwaway) has a `smoke.sh` that validates the
resource-stripping and discovery chain without a real Entra login. See the comments
at the top of that script.

---

## References

- [RFC 8707 — Resource Indicators for OAuth 2.0][RFC 8707]
- [RFC 9728 — OAuth 2.0 Protected Resource Metadata][RFC 9728]
- [RFC 8414 — OAuth 2.0 Authorization Server Metadata][RFC 8414]
- [RFC 7591 — OAuth 2.0 Dynamic Client Registration][RFC 7591]
- [AgentCore Gateway — inbound JWT authorizer][agentcore-jwt]
- [Building Claude-Ready Entra ID-Protected MCP Servers with Azure API Management][ms-apim]
- [10 Azure Entra ID incompatibilities with MCP server authentication][groff]
- [AWS — secure auth-code flow with AgentCore Gateway and MCP clients][aws-authcode]
- [anthropics/claude-code#73460 — omit/override the RFC 8707 resource parameter][issue-73460]

Content from external sources above was paraphrased; see each link for the original.

[RFC 8707]: https://datatracker.ietf.org/doc/html/rfc8707
[RFC 9728]: https://datatracker.ietf.org/doc/html/rfc9728
[RFC 8414]: https://datatracker.ietf.org/doc/html/rfc8414
[RFC 7591]: https://datatracker.ietf.org/doc/html/rfc7591
[agentcore-jwt]: https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/inbound-jwt-authorizer.html
[ms-apim]: https://developer.microsoft.com/blog/claude-ready-secure-mcp-apim
[groff]: https://www.groff.dev/blog/azure-entra-id-mcp-server-authentication-incompatibilities
[aws-authcode]: https://aws.amazon.com/blogs/machine-learning/building-a-secure-auth-code-flow-setup-using-agentcore-gateway-with-mcp-clients/
[issue-73460]: https://github.com/anthropics/claude-code/issues/73460
