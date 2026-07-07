#!/usr/bin/env bash
# Tests for stamp-config.sh — the template-stamping step shared by setup.sh and
# the CDK build. Self-contained (no bats / no pip): plain bash assertions plus a
# tiny Python YAML parse. Run from anywhere:
#   ./test/stamp-config.test.sh
#
# Covers: placeholder substitution, the REPLACE_ME/unstamped-placeholder guard,
# and the Google-issuer scope-block auto-injection (and its absence for others).

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STAMP="${REPO_ROOT}/stamp-config.sh"
PASS=0
FAIL=0

pass() { PASS=$((PASS + 1)); echo "  ok   - $1"; }
fail() { FAIL=$((FAIL + 1)); echo "  FAIL - $1"; [[ -n "${2:-}" ]] && echo "         $2"; }

# Run stamp-config.sh with a given issuer; echo the output path (or empty on fail).
# Usage: run_stamp <issuer> <out>
run_stamp() {
  local issuer="$1" out="$2"
  PUBLIC_URL=https://gw.example.com AWS_REGION=us-east-1 OIDC_ISSUER="${issuer}" \
    OIDC_CLIENT_ID=abc OIDC_CLIENT_SECRET=x ALLOWED_EMAIL_DOMAINS=example.com \
    OUT="${out}" "${STAMP}" >/dev/null 2>&1
}

TMP="$(mktemp -d)"
trap 'rm -rf "${TMP}"' EXIT

echo "stamp-config.test.sh"

# ── 1. A non-Google issuer stamps cleanly, valid YAML, no scopes key ──────────
if run_stamp "https://example.okta.com" "${TMP}/okta.yaml"; then
  pass "okta issuer stamps successfully"
else
  fail "okta issuer stamps successfully" "stamp-config exited non-zero"
fi

if grep -q '@@' "${TMP}/okta.yaml" 2>/dev/null; then
  fail "no unstamped placeholder remains (okta)" "$(grep -n '@@' "${TMP}/okta.yaml")"
else
  pass "no unstamped placeholder remains (okta)"
fi

if python3 -c 'import yaml,sys; yaml.safe_load(open(sys.argv[1]))' "${TMP}/okta.yaml" 2>/dev/null; then
  pass "okta output is valid YAML"
else
  fail "okta output is valid YAML"
fi

if python3 -c 'import yaml,sys; d=yaml.safe_load(open(sys.argv[1])); sys.exit(0 if "scopes" not in d["oidc"] else 1)' "${TMP}/okta.yaml" 2>/dev/null; then
  pass "okta output has NO scopes key (keeps gateway defaults)"
else
  fail "okta output has NO scopes key (keeps gateway defaults)"
fi

# ── 2. Google issuer injects the scope + extra_auth_params block ──────────────
if run_stamp "https://accounts.google.com" "${TMP}/google.yaml"; then
  pass "google issuer stamps successfully"
else
  fail "google issuer stamps successfully" "stamp-config exited non-zero"
fi

if python3 - "${TMP}/google.yaml" <<'PY' 2>/dev/null
import yaml, sys
d = yaml.safe_load(open(sys.argv[1]))
o = d["oidc"]
assert o.get("scopes") == ["openid", "profile", "email"], o.get("scopes")
assert o.get("extra_auth_params") == {"access_type": "offline", "prompt": "consent"}, o.get("extra_auth_params")
PY
then
  pass "google output has correct scopes + extra_auth_params"
else
  fail "google output has correct scopes + extra_auth_params"
fi

# ── 3. Google detection matches a trailing-slash issuer too ───────────────────
if run_stamp "https://accounts.google.com/" "${TMP}/google2.yaml" \
  && python3 -c 'import yaml,sys; d=yaml.safe_load(open(sys.argv[1])); sys.exit(0 if d["oidc"].get("scopes")==["openid","profile","email"] else 1)' "${TMP}/google2.yaml" 2>/dev/null; then
  pass "google issuer with trailing slash still injects the block"
else
  fail "google issuer with trailing slash still injects the block"
fi

# ── 4. A Google-substring-but-not-Google issuer does NOT trigger injection ────
# (guards the anchored regex — e.g. a self-hosted host containing the string)
if run_stamp "https://accounts.google.com.evil.example" "${TMP}/notgoogle.yaml" \
  && python3 -c 'import yaml,sys; d=yaml.safe_load(open(sys.argv[1])); sys.exit(0 if "scopes" not in d["oidc"] else 1)' "${TMP}/notgoogle.yaml" 2>/dev/null; then
  pass "look-alike issuer does NOT trigger Google injection"
else
  fail "look-alike issuer does NOT trigger Google injection"
fi

# ── 5. The REPLACE_ME / missing-input guard: a missing required var fails ─────
if PUBLIC_URL=https://gw.example.com AWS_REGION=us-east-1 \
   OIDC_CLIENT_ID=abc ALLOWED_EMAIL_DOMAINS=example.com \
   OUT="${TMP}/nope.yaml" "${STAMP}" >/dev/null 2>&1; then
  fail "missing OIDC_ISSUER fails loudly" "expected non-zero exit"
else
  pass "missing OIDC_ISSUER fails loudly"
fi

echo ""
echo "stamp-config.test.sh: ${PASS} passed, ${FAIL} failed"
[[ "${FAIL}" -eq 0 ]]
