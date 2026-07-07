#!/usr/bin/env bash
# stamp-config.sh — produce gateway.yaml from gateway.yaml.template by substituting
# the build-time @@TOKEN@@ placeholders with real literal deploy values.
#
# Shared by both deploy tracks: setup.sh and the CDK build step call this before
# `docker build` so the stamped gateway.yaml is COPYed into the image (see ADR 0001).
#
# It substitutes ONLY the @@TOKEN@@ placeholders. The gateway's own ${VAR} runtime
# expansions (secrets + deploy-created DB facts) are left untouched on purpose.
#
# Inputs (env vars, all required unless noted):
#   PUBLIC_URL             externally visible https origin (the internal ALB name)
#   AWS_REGION             Bedrock endpoint region
#   OIDC_ISSUER            OIDC discovery base
#   OIDC_CLIENT_ID         OAuth client id
#   ALLOWED_EMAIL_DOMAINS  comma-separated, e.g. "example.com,corp.example.com"
#   DB_NAME                Postgres database name (default: claude_gateway)
#   TEMPLATE               input template path  (default: ./gateway.yaml.template)
#   OUT                    output config path    (default: ./gateway.yaml)
#
# Usage:
#   PUBLIC_URL=https://claude-gateway.example.com AWS_REGION=us-east-1 \
#   OIDC_ISSUER=https://example.okta.com OIDC_CLIENT_ID=0oa1example2 \
#   ALLOWED_EMAIL_DOMAINS=example.com ./stamp-config.sh

set -euo pipefail

TEMPLATE="${TEMPLATE:-./gateway.yaml.template}"
OUT="${OUT:-./gateway.yaml}"
DB_NAME="${DB_NAME:-claude_gateway}"

die() { echo "stamp-config: ERROR: $*" >&2; exit 1; }

[[ -f "${TEMPLATE}" ]] || die "template not found: ${TEMPLATE}"

# Required, no defaults — fail loudly rather than bake an empty value into the image.
: "${PUBLIC_URL:?set PUBLIC_URL (the internal ALB https origin)}"
: "${AWS_REGION:?set AWS_REGION (Bedrock endpoint region)}"
: "${OIDC_ISSUER:?set OIDC_ISSUER (OIDC discovery base)}"
: "${OIDC_CLIENT_ID:?set OIDC_CLIENT_ID (OAuth client id)}"
: "${ALLOWED_EMAIL_DOMAINS:?set ALLOWED_EMAIL_DOMAINS (comma-separated)}"

# allowed_email_domains is rendered as a YAML flow sequence: example.com,corp.com
# -> "example.com, corp.com" so the template's [@@ALLOWED_EMAIL_DOMAINS@@] is valid.
domains_yaml="$(printf '%s' "${ALLOWED_EMAIL_DOMAINS}" | sed 's/[[:space:]]*,[[:space:]]*/, /g')"

# Google Workspace ignores the default `offline_access` scope and rejects it with
# invalid_scope. When the issuer is accounts.google.com, stamp in the scopes +
# extra_auth_params that yield a refresh token instead. Any other issuer stamps to
# nothing, leaving the gateway's default scopes untouched. (Match http(s) and an
# optional trailing slash so a copy-pasted issuer still triggers it.)
# The \n sequences below are literal backslash-n on purpose: the awk `subst`
# helper expands escapes in its -v value, so this becomes a real multi-line block.
# (A value with actual newlines would break awk's command-line -v assignment.)
if printf '%s' "${OIDC_ISSUER}" | grep -qiE '^https?://accounts\.google\.com/?$'; then
  google_block='  # Google Workspace: offline_access is rejected; refresh token comes\n  # from access_type=offline + prompt=consent (auto-stamped by stamp-config.sh).\n  scopes: [openid, profile, email]\n  extra_auth_params: { access_type: offline, prompt: consent }'
  echo "stamp-config: detected Google issuer — stamping Google scope block" >&2
else
  google_block=''
fi

# Substitute with awk using literal string replacement (no regex interpretation of
# the values — URLs/issuers contain '/', '.', etc. that would break sed s///).
subst() {
  awk -v k="$1" -v v="$2" '
    { while ((i = index($0, k)) > 0) {
        $0 = substr($0, 1, i-1) v substr($0, i+length(k))
      }
      print }
  '
}

tmp="$(mktemp "${OUT}.XXXXXX")"
# Clean the temp file on any failure so we never leave a half-stamped artifact.
trap 'rm -f "${tmp}"' EXIT INT TERM

subst '@@PUBLIC_URL@@'            "${PUBLIC_URL}"            < "${TEMPLATE}" \
  | subst '@@AWS_REGION@@'            "${AWS_REGION}" \
  | subst '@@OIDC_ISSUER@@'           "${OIDC_ISSUER}" \
  | subst '@@OIDC_CLIENT_ID@@'        "${OIDC_CLIENT_ID}" \
  | subst '@@ALLOWED_EMAIL_DOMAINS@@' "${domains_yaml}" \
  | subst '@@OIDC_GOOGLE_BLOCK@@'     "${google_block}" \
  | subst '@@DB_NAME@@'               "${DB_NAME}" \
  > "${tmp}"

# Guard: refuse to emit a config that still has an unstamped @@...@@ placeholder —
# that would bake a literal placeholder into the image. (The runtime ${VAR}
# expansions are expected to remain and are NOT checked here.)
if grep -nE '@@[A-Z_]+@@' "${tmp}"; then
  die "unstamped @@PLACEHOLDER@@ remains in output (see lines above) — missing input?"
fi

mv "${tmp}" "${OUT}"
trap - EXIT INT TERM
echo "stamp-config: wrote ${OUT} (public_url=${PUBLIC_URL}, region=${AWS_REGION})"
