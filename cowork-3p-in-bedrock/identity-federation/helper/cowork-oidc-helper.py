#!/usr/bin/env python3
"""
Cowork 3P OIDC Credential Helper
=================================
A credential-process helper for Claude Cowork Desktop that:
  1. Checks for a cached, valid ID token (from a previous run)
  2. If missing/expired, runs an OAuth2 Authorization Code + PKCE flow
     (opens browser, listens on localhost for the callback)
  3. Exchanges the ID token for temporary AWS credentials via
     sts:AssumeRoleWithWebIdentity
  4. Prints the credentials to stdout in the format Cowork expects

Works with any OIDC-compliant IdP: Amazon Cognito, Microsoft Entra ID,
Okta, Auth0, Google Workspace, etc.

Configuration is via environment variables (set in the Cowork config's
inferenceCredentialHelper command line or in a wrapper script):

  COWORK_OIDC_ISSUER_URL   - OIDC issuer (e.g. https://cognito-idp.us-west-2.amazonaws.com/us-west-2_xxx)
  COWORK_OIDC_CLIENT_ID    - App client ID (the aud claim)
  COWORK_ROLE_ARN          - IAM role ARN to assume
  COWORK_AWS_REGION        - Region for STS calls (default: us-west-2)
  COWORK_CALLBACK_PORT     - Loopback port for OAuth callback (default: 8765)
  COWORK_SESSION_DURATION  - STS session duration in seconds (default: 3600)
  COWORK_SCOPES            - OAuth scopes, space-separated (default: openid email profile)
  COWORK_TOKEN_CACHE       - Path to cache file (default: ~/.cowork/token_cache.json)

Usage in claude_desktop_config.json:
  "inferenceCredentialHelper": "/path/to/cowork-oidc-helper.py",
  "inferenceCredentialHelperTtlSec": 3500

Or wrap it in a shell script that exports the env vars first.

Requirements: Python 3.9+ (no pip dependencies — uses only stdlib).
"""

import base64
import hashlib
import http.server
import json
import os
import secrets
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import webbrowser
from datetime import datetime, timezone
from pathlib import Path

# ---------------------------------------------------------------------------
# Configuration from environment
# ---------------------------------------------------------------------------
ISSUER_URL = os.environ.get("COWORK_OIDC_ISSUER_URL", "")
CLIENT_ID = os.environ.get("COWORK_OIDC_CLIENT_ID", "")
ROLE_ARN = os.environ.get("COWORK_ROLE_ARN", "")
AWS_REGION = os.environ.get("COWORK_AWS_REGION", "us-west-2")
CALLBACK_PORT = int(os.environ.get("COWORK_CALLBACK_PORT", "8765"))
SESSION_DURATION = int(os.environ.get("COWORK_SESSION_DURATION", "3600"))
SCOPES = os.environ.get("COWORK_SCOPES", "openid email profile")
TOKEN_CACHE_PATH = Path(
    os.environ.get("COWORK_TOKEN_CACHE", os.path.expanduser("~/.cowork/token_cache.json"))
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def die(msg: str) -> None:
    """Print error to stderr and exit non-zero."""
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(1)


def discover_oidc_config(issuer: str) -> dict:
    """Fetch the OIDC discovery document."""
    url = f"{issuer.rstrip('/')}/.well-known/openid-configuration"
    try:
        with urllib.request.urlopen(url, timeout=10) as resp:
            return json.loads(resp.read())
    except Exception as e:
        die(f"Failed to fetch OIDC discovery from {url}: {e}")


def generate_pkce() -> tuple:
    """Generate PKCE code_verifier and code_challenge (S256)."""
    verifier = secrets.token_urlsafe(64)[:128]
    digest = hashlib.sha256(verifier.encode("ascii")).digest()
    challenge = base64.urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")
    return verifier, challenge


def decode_jwt_payload(token: str) -> dict:
    """Decode JWT payload without verification (we trust STS to verify)."""
    parts = token.split(".")
    if len(parts) != 3:
        die("ID token is not a valid JWT")
    payload = parts[1]
    # Add padding
    payload += "=" * (4 - len(payload) % 4)
    return json.loads(base64.urlsafe_b64decode(payload))


def is_token_valid(cache: dict) -> bool:
    """Check if cached ID token is still valid (with 2-min margin)."""
    try:
        payload = decode_jwt_payload(cache["id_token"])
        exp = payload.get("exp", 0)
        return time.time() < (exp - 120)
    except Exception:
        return False


def load_cached_token() -> dict | None:
    """Load token cache from disk."""
    if not TOKEN_CACHE_PATH.exists():
        return None
    try:
        cache = json.loads(TOKEN_CACHE_PATH.read_text())
        if is_token_valid(cache):
            return cache
    except Exception:
        pass
    return None


def save_token_cache(data: dict) -> None:
    """Persist token cache to disk."""
    TOKEN_CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    TOKEN_CACHE_PATH.write_text(json.dumps(data, indent=2))
    # Restrict permissions (best-effort on macOS/Linux)
    try:
        TOKEN_CACHE_PATH.chmod(0o600)
    except Exception:
        pass


# ---------------------------------------------------------------------------
# OAuth2 Authorization Code + PKCE flow
# ---------------------------------------------------------------------------

class CallbackHandler(http.server.BaseHTTPRequestHandler):
    """HTTP handler that captures the OAuth callback."""

    auth_code: str | None = None
    error: str | None = None

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)

        if "code" in params:
            CallbackHandler.auth_code = params["code"][0]
            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            self.end_headers()
            self.wfile.write(
                b"<html><body><h2>Authentication successful</h2>"
                b"<p>You can close this tab and return to Claude.</p>"
                b"</body></html>"
            )
        elif "error" in params:
            CallbackHandler.error = params.get("error_description", params["error"])[0]
            self.send_response(400)
            self.send_header("Content-Type", "text/html")
            self.end_headers()
            self.wfile.write(f"<html><body><h2>Error: {CallbackHandler.error}</h2></body></html>".encode())
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        """Suppress HTTP server logs."""
        pass


def run_oidc_flow(oidc_config: dict) -> str:
    """Run the full OIDC auth code + PKCE flow. Returns the ID token."""
    auth_endpoint = oidc_config["authorization_endpoint"]
    token_endpoint = oidc_config["token_endpoint"]
    redirect_uri = f"http://localhost:{CALLBACK_PORT}/callback"

    verifier, challenge = generate_pkce()
    state = secrets.token_urlsafe(32)

    # Reset handler state
    CallbackHandler.auth_code = None
    CallbackHandler.error = None

    # Start local HTTP server
    server = http.server.HTTPServer(("127.0.0.1", CALLBACK_PORT), CallbackHandler)
    server_thread = threading.Thread(target=server.handle_request, daemon=True)
    server_thread.start()

    # Build authorization URL
    auth_params = {
        "client_id": CLIENT_ID,
        "response_type": "code",
        "scope": SCOPES,
        "redirect_uri": redirect_uri,
        "state": state,
        "code_challenge": challenge,
        "code_challenge_method": "S256",
    }
    auth_url = f"{auth_endpoint}?{urllib.parse.urlencode(auth_params)}"

    # Open browser
    print("Opening browser for sign-in...", file=sys.stderr)
    webbrowser.open(auth_url)

    # Wait for callback (up to 3 minutes)
    server_thread.join(timeout=180)
    server.server_close()

    if CallbackHandler.error:
        die(f"IdP returned error: {CallbackHandler.error}")
    if not CallbackHandler.auth_code:
        die("Timed out waiting for sign-in callback")

    # Exchange code for tokens
    token_data = urllib.parse.urlencode({
        "grant_type": "authorization_code",
        "client_id": CLIENT_ID,
        "code": CallbackHandler.auth_code,
        "redirect_uri": redirect_uri,
        "code_verifier": verifier,
    }).encode()

    req = urllib.request.Request(
        token_endpoint,
        data=token_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            tokens = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode() if e.fp else ""
        die(f"Token exchange failed ({e.code}): {body}")

    id_token = tokens.get("id_token")
    if not id_token:
        die("Token response did not include an id_token")

    # Cache the tokens
    save_token_cache({
        "id_token": id_token,
        "refresh_token": tokens.get("refresh_token"),
        "obtained_at": datetime.now(timezone.utc).isoformat(),
    })

    return id_token


# ---------------------------------------------------------------------------
# Refresh token flow (silent re-auth without browser)
# ---------------------------------------------------------------------------

def try_refresh_token(oidc_config: dict, refresh_token: str) -> str | None:
    """Attempt to use a refresh token to get a new ID token silently."""
    token_endpoint = oidc_config["token_endpoint"]
    token_data = urllib.parse.urlencode({
        "grant_type": "refresh_token",
        "client_id": CLIENT_ID,
        "refresh_token": refresh_token,
    }).encode()

    req = urllib.request.Request(
        token_endpoint,
        data=token_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            tokens = json.loads(resp.read())
        id_token = tokens.get("id_token")
        if id_token:
            save_token_cache({
                "id_token": id_token,
                "refresh_token": tokens.get("refresh_token", refresh_token),
                "obtained_at": datetime.now(timezone.utc).isoformat(),
            })
            return id_token
    except Exception:
        pass
    return None


# ---------------------------------------------------------------------------
# STS AssumeRoleWithWebIdentity
# ---------------------------------------------------------------------------

def assume_role_with_web_identity(id_token: str) -> dict:
    """Call STS to exchange the ID token for temporary AWS credentials."""
    # Extract email/sub for session name
    payload = decode_jwt_payload(id_token)
    session_name = (
        payload.get("email", payload.get("sub", "cowork-user"))
        .replace("@", "_at_")[:64]
    )

    # Use STS HTTPS endpoint directly (no boto3 dependency)
    sts_endpoint = f"https://sts.{AWS_REGION}.amazonaws.com/"
    params = {
        "Action": "AssumeRoleWithWebIdentity",
        "Version": "2011-06-15",
        "RoleArn": ROLE_ARN,
        "RoleSessionName": session_name,
        "WebIdentityToken": id_token,
        "DurationSeconds": str(SESSION_DURATION),
    }

    data = urllib.parse.urlencode(params).encode()
    req = urllib.request.Request(
        sts_endpoint,
        data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            body = resp.read().decode()
    except urllib.error.HTTPError as e:
        error_body = e.read().decode() if e.fp else ""
        die(f"STS AssumeRoleWithWebIdentity failed ({e.code}): {error_body}")

    # Parse XML response (minimal parsing, no lxml dependency)
    def extract_xml(tag: str, text: str) -> str:
        start = text.find(f"<{tag}>")
        end = text.find(f"</{tag}>")
        if start == -1 or end == -1:
            die(f"Could not find <{tag}> in STS response")
        return text[start + len(tag) + 2 : end]

    access_key = extract_xml("AccessKeyId", body)
    secret_key = extract_xml("SecretAccessKey", body)
    session_token = extract_xml("SessionToken", body)
    expiration = extract_xml("Expiration", body)

    return {
        "AccessKeyId": access_key,
        "SecretAccessKey": secret_key,
        "SessionToken": session_token,
        "Expiration": expiration,
    }


# ---------------------------------------------------------------------------
# Output format
# ---------------------------------------------------------------------------

def print_credentials(creds: dict) -> None:
    """Print credentials in the credential_process JSON format (AWS SDK v2+)."""
    output = {
        "Version": 1,
        "AccessKeyId": creds["AccessKeyId"],
        "SecretAccessKey": creds["SecretAccessKey"],
        "SessionToken": creds["SessionToken"],
        "Expiration": creds["Expiration"],
    }
    print(json.dumps(output))


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    # Validate configuration
    if not ISSUER_URL:
        die("COWORK_OIDC_ISSUER_URL is not set")
    if not CLIENT_ID:
        die("COWORK_OIDC_CLIENT_ID is not set")
    if not ROLE_ARN:
        die("COWORK_ROLE_ARN is not set")

    # Discover OIDC endpoints
    oidc_config = discover_oidc_config(ISSUER_URL)

    # Try cached token first
    cached = load_cached_token()
    if cached:
        id_token = cached["id_token"]
    else:
        # Try refresh token (silent re-auth)
        id_token = None
        if TOKEN_CACHE_PATH.exists():
            try:
                old_cache = json.loads(TOKEN_CACHE_PATH.read_text())
                refresh = old_cache.get("refresh_token")
                if refresh:
                    id_token = try_refresh_token(oidc_config, refresh)
                    if id_token:
                        print("Refreshed session silently.", file=sys.stderr)
            except Exception:
                pass

        # Fall back to full browser flow
        if not id_token:
            id_token = run_oidc_flow(oidc_config)

    # Exchange for AWS credentials
    creds = assume_role_with_web_identity(id_token)
    print_credentials(creds)


if __name__ == "__main__":
    main()
