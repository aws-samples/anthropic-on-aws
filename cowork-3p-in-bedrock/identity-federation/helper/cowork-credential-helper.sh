#!/usr/bin/env bash
# =============================================================================
# Cowork 3P Credential Helper Wrapper (macOS / Linux)
# =============================================================================
# This script is used as credential_process in an AWS named profile
# (~/.aws/config), which Cowork Desktop then references via the
# inferenceBedrockProfile configuration key.
#
# IMPORTANT: Do NOT set this as Cowork's inferenceCredentialHelper directly.
# That key expects a bearer token string, while this helper emits AWS SDK
# credential_process JSON (Version, AccessKeyId, SecretAccessKey,
# SessionToken, Expiration).
#
# Example ~/.aws/config:
#   [profile cowork-federation]
#   region = us-west-2
#   credential_process = /opt/cowork/cowork-credential-helper.sh
#
# Example claude_desktop_config.json enterpriseConfig block:
#   "inferenceBedrockProfile": "cowork-federation"
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration — fill these from your CDK stack outputs
# ---------------------------------------------------------------------------
export COWORK_OIDC_ISSUER_URL="${COWORK_OIDC_ISSUER_URL:-REPLACE_WITH_ISSUER_URL}"
export COWORK_OIDC_CLIENT_ID="${COWORK_OIDC_CLIENT_ID:-REPLACE_WITH_CLIENT_ID}"
export COWORK_ROLE_ARN="${COWORK_ROLE_ARN:-REPLACE_WITH_ROLE_ARN}"
export COWORK_AWS_REGION="${COWORK_AWS_REGION:-us-west-2}"
export COWORK_CALLBACK_PORT="${COWORK_CALLBACK_PORT:-8765}"
export COWORK_SESSION_DURATION="${COWORK_SESSION_DURATION:-3600}"

# ---------------------------------------------------------------------------
# Run the Python helper (same directory as this script)
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
exec python3 "$SCRIPT_DIR/cowork-oidc-helper.py"
