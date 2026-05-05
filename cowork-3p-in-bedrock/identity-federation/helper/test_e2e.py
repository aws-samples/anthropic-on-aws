#!/usr/bin/env python3
"""
End-to-end test for the Cowork OIDC federation flow.

Uses Cognito's InitiateAuth (USER_PASSWORD_AUTH) to get an ID token
without a browser, then exchanges it for AWS creds via STS
AssumeRoleWithWebIdentity, and finally calls Bedrock InvokeModel.

This is a TEST script — in production, the browser-based PKCE flow
(cowork-oidc-helper.py) is used instead.

Usage:
  export COGNITO_USER_POOL_ID=us-west-2_XXXXXXXXX
  export COGNITO_CLIENT_ID=<cognito-app-client-id>
  export COWORK_ROLE_ARN=arn:aws:iam::<ACCOUNT_ID>:role/CoworkBedrockUser
  export TEST_USERNAME=alice@example.com
  export TEST_PASSWORD='<your-test-user-password>'
  python3 test_e2e.py
"""

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
POOL_ID = os.environ.get("COGNITO_USER_POOL_ID", "")
CLIENT_ID = os.environ.get("COGNITO_CLIENT_ID", "")
ROLE_ARN = os.environ.get("COWORK_ROLE_ARN", "")
REGION = os.environ.get("COWORK_AWS_REGION", "us-west-2")
USERNAME = os.environ.get("TEST_USERNAME", "alice@example.com")
PASSWORD = os.environ.get("TEST_PASSWORD", "")

required = {
    "COGNITO_USER_POOL_ID": POOL_ID,
    "COGNITO_CLIENT_ID": CLIENT_ID,
    "COWORK_ROLE_ARN": ROLE_ARN,
    "TEST_USERNAME": USERNAME,
    "TEST_PASSWORD": PASSWORD,
}
missing = [k for k, v in required.items() if not v]
if missing:
    print(f"ERROR: Required env vars not set: {', '.join(missing)}", file=sys.stderr)
    print("See the docstring at the top of this file for a full list.", file=sys.stderr)
    sys.exit(1)


def step(msg):
    print(f"\n{'='*60}\n  {msg}\n{'='*60}")


def cognito_auth(pool_region, client_id, username, password):
    """Use Cognito InitiateAuth to get tokens (no browser needed)."""
    step("Step 1: Cognito InitiateAuth (USER_PASSWORD_AUTH)")

    endpoint = f"https://cognito-idp.{pool_region}.amazonaws.com/"
    payload = json.dumps({
        "AuthFlow": "USER_PASSWORD_AUTH",
        "ClientId": client_id,
        "AuthParameters": {
            "USERNAME": username,
            "PASSWORD": password,
        },
    })

    req = urllib.request.Request(
        endpoint,
        data=payload.encode(),
        headers={
            "Content-Type": "application/x-amz-json-1.1",
            "X-Amz-Target": "AWSCognitoIdentityProviderService.InitiateAuth",
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            result = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode() if e.fp else ""
        print(f"  FAILED ({e.code}): {body}", file=sys.stderr)
        sys.exit(1)

    tokens = result.get("AuthenticationResult", {})
    id_token = tokens.get("IdToken")
    if not id_token:
        print(f"  FAILED: No IdToken in response: {json.dumps(result, indent=2)}", file=sys.stderr)
        sys.exit(1)

    # Decode and show claims (without verification)
    import base64
    parts = id_token.split(".")
    payload_b64 = parts[1] + "=" * (4 - len(parts[1]) % 4)
    claims = json.loads(base64.urlsafe_b64decode(payload_b64))
    print(f"  ✅ Got ID token")
    print(f"     sub: {claims.get('sub')}")
    print(f"     email: {claims.get('email')}")
    print(f"     aud: {claims.get('aud')}")
    print(f"     iss: {claims.get('iss')}")
    print(f"     exp: {claims.get('exp')}")

    return id_token


def assume_role_with_web_identity(id_token, role_arn, region):
    """Exchange ID token for AWS temporary credentials."""
    step("Step 2: STS AssumeRoleWithWebIdentity")

    sts_endpoint = f"https://sts.{region}.amazonaws.com/"
    params = {
        "Action": "AssumeRoleWithWebIdentity",
        "Version": "2011-06-15",
        "RoleArn": role_arn,
        "RoleSessionName": "cowork-e2e-test",
        "WebIdentityToken": id_token,
        "DurationSeconds": "3600",
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
        print(f"  FAILED ({e.code}): {error_body}", file=sys.stderr)
        sys.exit(1)

    def extract(tag, text):
        s = text.find(f"<{tag}>")
        e = text.find(f"</{tag}>")
        return text[s + len(tag) + 2:e] if s != -1 and e != -1 else None

    access_key = extract("AccessKeyId", body)
    secret_key = extract("SecretAccessKey", body)
    session_token = extract("SessionToken", body)
    expiration = extract("Expiration", body)
    assumed_arn = extract("Arn", body)

    if not access_key:
        print(f"  FAILED: Could not parse STS response:\n{body[:500]}", file=sys.stderr)
        sys.exit(1)

    print(f"  ✅ Got temporary credentials")
    print(f"     AssumedRole: {assumed_arn}")
    print(f"     AccessKeyId: {access_key[:8]}...")
    print(f"     Expiration:  {expiration}")

    return access_key, secret_key, session_token


def test_bedrock_invoke(access_key, secret_key, session_token, region):
    """Call Bedrock InvokeModel with the federated credentials."""
    step("Step 3: Bedrock InvokeModel (Claude)")

    # Use AWS CLI with explicit credentials (simplest for a test)
    import subprocess
    env = os.environ.copy()
    env["AWS_ACCESS_KEY_ID"] = access_key
    env["AWS_SECRET_ACCESS_KEY"] = secret_key
    env["AWS_SESSION_TOKEN"] = session_token
    env["AWS_DEFAULT_REGION"] = region

    model_id = "us.anthropic.claude-sonnet-4-6"
    body = json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 50,
        "messages": [{"role": "user", "content": "Say 'Federation test successful!' in exactly those words."}],
    })

    result = subprocess.run(
        [
            "aws", "bedrock-runtime", "invoke-model",
            "--model-id", model_id,
            "--region", region,
            "--content-type", "application/json",
            "--accept", "application/json",
            "--body", body,
            "/tmp/cowork_federation_test.json",
        ],
        capture_output=True,
        text=True,
        env=env,
        timeout=30,
    )

    if result.returncode != 0:
        print(f"  FAILED: {result.stderr}", file=sys.stderr)
        sys.exit(1)

    try:
        response = json.loads(open("/tmp/cowork_federation_test.json").read())
        content = response.get("content", [{}])[0].get("text", "")
        print(f"  ✅ Bedrock responded!")
        print(f"     Model: {model_id}")
        print(f"     Response: {content[:200]}")
    except Exception as e:
        print(f"  FAILED to parse response: {e}", file=sys.stderr)
        sys.exit(1)


def main():
    print("=" * 60)
    print("  Cowork 3P Federation — End-to-End Test")
    print("=" * 60)
    print(f"  Pool:     {POOL_ID}")
    print(f"  Client:   {CLIENT_ID}")
    print(f"  Role:     {ROLE_ARN}")
    print(f"  Region:   {REGION}")
    print(f"  User:     {USERNAME}")

    pool_region = POOL_ID.split("_")[0]  # e.g. us-west-2

    # Step 1: Get ID token from Cognito
    id_token = cognito_auth(pool_region, CLIENT_ID, USERNAME, PASSWORD)

    # Step 2: Exchange for AWS creds
    access_key, secret_key, session_token = assume_role_with_web_identity(
        id_token, ROLE_ARN, REGION
    )

    # Step 3: Call Bedrock
    test_bedrock_invoke(access_key, secret_key, session_token, REGION)

    step("ALL TESTS PASSED ✅")
    print("  The full chain works:")
    print("    IdP (Cognito) → ID token → STS AssumeRoleWithWebIdentity → Bedrock InvokeModel")
    print("")
    print("  This same flow works with Entra ID, Okta, Auth0, or any OIDC provider.")
    print("  Just swap the issuer URL and client ID.")


if __name__ == "__main__":
    main()
