# Module 1: Identity (SSO Authentication)

## What it is

The gateway authenticates developers using OpenID Connect (OIDC). Instead of holding AWS credentials or API keys, developers sign in once with their corporate identity provider (Okta, Entra, Google Workspace, etc.) via a browser. The gateway issues a short-lived bearer token that Claude Code uses for all subsequent requests.

## What the customer gets

- Developers never touch AWS credentials or API keys
- Onboarding: add a user to the IdP group, they can `claude /login` immediately
- Offboarding: remove from IdP, session expires within `ttl_hours` (default: 1 hour)
- Audit: every session mint and denial is logged with the user's identity

## How to configure it

```yaml
oidc:
  issuer: https://your-idp.example.com/        # Must serve /.well-known/openid-configuration
  client_id: your-client-id                     # From your OAuth app registration
  client_secret: ${OIDC_CLIENT_SECRET}          # Keep in env var, not in file
  allowed_email_domains: [yourcompany.com]      # Reject users from other domains
  userinfo_fallback: true                       # Enable for Okta org server

session:
  jwt_secret: ${GATEWAY_JWT_SECRET}             # openssl rand -base64 32
  ttl_hours: 1                                  # Token lifetime; bounds offboarding latency
```

### Configuration notes

- `issuer` must serve `/.well-known/openid-configuration` over HTTPS in production
- `allowed_email_domains` is case-insensitive and rejects id_tokens from other domains
- `userinfo_fallback: true` is needed when the IdP's id_token omits email/groups (Okta org server, Keycloak lightweight tokens)
- `ttl_hours` controls how quickly a deprovisioned user loses access

### IdP-specific notes

| IdP | Issuer format | Notes |
|-----|---------------|-------|
| Okta (org server) | `https://company.okta.com` | Set `userinfo_fallback: true` |
| Okta (custom auth server) | `https://company.okta.com/oauth2/default` | Emits email/groups directly |
| Microsoft Entra ID | `https://login.microsoftonline.com/<tenant-id>/v2.0` | Groups come as Object IDs; use `groups_claim: roles` for app roles |
| Google Workspace | `https://accounts.google.com` | No groups in id_token; use `google_groups` config or match on `email_domain` |
| Amazon Cognito | `https://cognito-idp.<region>.amazonaws.com/<pool-id>` | Standard OIDC |

## How to verify it

### 1. Check the gateway discovers the IdP

```bash
curl -s https://<gateway>/.well-known/oauth-authorization-server | python3 -m json.tool
```

Expected output:
```json
{
  "issuer": "https://<your-gateway-hostname>",
  "device_authorization_endpoint": "https://<gateway>/oauth/device_authorization",
  "token_endpoint": "https://<gateway>/oauth/token",
  "grant_types_supported": ["urn:ietf:params:oauth:grant-type:device_code", "refresh_token"]
}
```

### 2. Test the device authorization flow

```bash
curl -s -X POST https://<gateway>/oauth/device_authorization | python3 -m json.tool
```

Expected output:
```json
{
  "device_code": "...",
  "user_code": "ABCD-EFGH",
  "verification_uri": "https://<gateway>/device",
  "verification_uri_complete": "https://<gateway>/device?user_code=ABCD-EFGH",
  "expires_in": 600,
  "interval": 5
}
```

### 3. Complete the browser SSO

Open `verification_uri_complete` in a browser. You should see:
1. The gateway's "Approve sign-in?" page with the user code
2. After clicking "continue", redirect to your IdP login page
3. After signing in, redirect back to the gateway with "signed in" confirmation

### 4. Exchange the device code for a token

```bash
curl -s -X POST https://<gateway>/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=urn:ietf:params:oauth:grant-type:device_code&device_code=<device_code>"
```

Expected output:
```json
{
  "access_token": "eyJhbGci...",
  "refresh_token": "...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### 5. Verify an unauthenticated request is rejected

```bash
curl -s https://<gateway>/v1/messages \
  -H "Content-Type: application/json" \
  -H "anthropic-version: 2023-06-01" \
  -d '{"model":"claude-haiku-4-5","max_tokens":10,"messages":[{"role":"user","content":"Hi"}]}'
```

Expected output:
```json
{"type":"error","error":{"type":"authentication_error","message":"invalid token"}}
```

## Key takeaways

- The login experience is a single `claude /login` command followed by browser SSO
- Requests without a valid token are rejected with 401
- Gateway logs record `session.mint` events with email and client IP for audit
- Removing a user from the IdP revokes access within `ttl_hours` (default: 1 hour)

## Tested result

```
✅ Discovery document served
✅ Device authorization flow works (Postgres writable)
✅ Browser SSO completes (Auth0)
✅ Token minted with user identity
✅ Unauthenticated requests rejected with 401
```
