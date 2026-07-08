#!/usr/bin/env bash
# Tests for setup.sh's sourceable helpers (SETUP_SH_LIB_ONLY=1 gate). Self-
# contained (no bats): plain bash assertions, stubbed aws_q, fake PATH bins.
# Run from anywhere:
#   ./test/setup-helpers.test.sh
#
# Covers the two live-deploy traps from LESSONS.md:
#   - container-tool resolution (docker/podman/finch + CONTAINER_TOOL override)
#     and the buildx-only --provenance=false flag gating,
#   - the phase-0 OIDC-secret preflight (fail fast, not after the ~9-min RDS wait).

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SETUP="${REPO_ROOT}/cdk/scripts/setup.sh"
PASS=0
FAIL=0

pass() { PASS=$((PASS + 1)); echo "  ok   - $1"; }
fail() { FAIL=$((FAIL + 1)); echo "  FAIL - $1"; [[ -n "${2:-}" ]] && echo "         $2"; }

TMP="$(mktemp -d)"
trap 'rm -rf "${TMP}"' EXIT

# Fake container-tool binaries for PATH-based detection tests.
mk_fake_bin() { mkdir -p "${TMP}/$1"; printf '#!/bin/sh\nexit 0\n' > "${TMP}/$1/$2"; chmod +x "${TMP}/$1/$2"; }
mk_fake_bin bin-docker  docker
mk_fake_bin bin-podman  podman
mk_fake_bin bin-both    docker
mk_fake_bin bin-both    podman

# Load only the helpers (the gate returns before config's required-env checks).
# shellcheck disable=SC1090
SETUP_SH_LIB_ONLY=1 source "${SETUP}" || { echo "FATAL: could not source ${SETUP}"; exit 1; }
# setup.sh sets -e when sourced; undo it so failed assertions don't abort the run.
set +e

echo "setup-helpers.test.sh"

# ── 1. resolve_container_tool ──────────────────────────────────────────────────
if [[ "$(PATH="${TMP}/bin-both" CONTAINER_TOOL='' resolve_container_tool)" == "docker" ]]; then
  pass "auto-detect prefers docker when both docker and podman exist"
else
  fail "auto-detect prefers docker when both docker and podman exist"
fi

if [[ "$(PATH="${TMP}/bin-podman" CONTAINER_TOOL='' resolve_container_tool)" == "podman" ]]; then
  pass "auto-detect falls back to podman when docker is absent"
else
  fail "auto-detect falls back to podman when docker is absent"
fi

if [[ "$(PATH="${TMP}/bin-both" CONTAINER_TOOL=podman resolve_container_tool)" == "podman" ]]; then
  pass "CONTAINER_TOOL override wins over auto-detect order"
else
  fail "CONTAINER_TOOL override wins over auto-detect order"
fi

if (PATH="${TMP}/bin-docker" CONTAINER_TOOL=nerdctl resolve_container_tool) >/dev/null 2>&1; then
  fail "CONTAINER_TOOL pointing at a missing binary fails" "expected non-zero exit"
else
  pass "CONTAINER_TOOL pointing at a missing binary fails"
fi

mkdir -p "${TMP}/bin-empty"
if (PATH="${TMP}/bin-empty" CONTAINER_TOOL='' resolve_container_tool) >/dev/null 2>&1; then
  fail "no container tool on PATH fails" "expected non-zero exit"
else
  pass "no container tool on PATH fails"
fi

# ── 2. container_build_extra_flags — --provenance=false is docker/buildx-only ──
if [[ "$(container_build_extra_flags docker)" == "--provenance=false" ]]; then
  pass "docker gets --provenance=false"
else
  fail "docker gets --provenance=false"
fi

for tool in podman finch; do
  if [[ -z "$(container_build_extra_flags "${tool}")" ]]; then
    pass "${tool} gets NO extra flags (rejects --provenance)"
  else
    fail "${tool} gets NO extra flags (rejects --provenance)" "got: $(container_build_extra_flags "${tool}")"
  fi
done

# ── 3. preflight_oidc_secret ───────────────────────────────────────────────────
# Stub the AWS wrapper: SECRET_VALUE empty simulates a missing secret.
# (Both vars are read inside preflight_oidc_secret / its die message.)
export AWS_REGION=us-east-1
export OIDC_SECRET_NAME=test-oidc-secret
aws_q() {
  [[ -n "${SECRET_VALUE:-}" ]] || return 1
  echo "${SECRET_VALUE}"
}

if (OIDC_CLIENT_SECRET='real-secret' SECRET_VALUE='' preflight_oidc_secret) >/dev/null 2>&1; then
  pass "OIDC_CLIENT_SECRET exported → preflight passes (secret need not exist yet)"
else
  fail "OIDC_CLIENT_SECRET exported → preflight passes (secret need not exist yet)"
fi

if (OIDC_CLIENT_SECRET='' SECRET_VALUE='already-set-for-real' preflight_oidc_secret) >/dev/null 2>&1; then
  pass "existing non-placeholder secret → preflight passes"
else
  fail "existing non-placeholder secret → preflight passes"
fi

if (OIDC_CLIENT_SECRET='' SECRET_VALUE='' preflight_oidc_secret) >/dev/null 2>&1; then
  fail "missing secret and no env → preflight dies" "expected non-zero exit"
else
  pass "missing secret and no env → preflight dies"
fi

if (OIDC_CLIENT_SECRET='' SECRET_VALUE='REPLACE_ME' preflight_oidc_secret) >/dev/null 2>&1; then
  fail "REPLACE_ME placeholder and no env → preflight dies" "expected non-zero exit"
else
  pass "REPLACE_ME placeholder and no env → preflight dies"
fi

# The missing-secret message must steer to create-secret (put-secret-value would
# fail on a nonexistent secret); the placeholder message to put-secret-value.
msg="$( (OIDC_CLIENT_SECRET='' SECRET_VALUE='' preflight_oidc_secret) 2>&1 )"
if grep -q 'create-secret' <<<"${msg}"; then
  pass "missing-secret error suggests create-secret"
else
  fail "missing-secret error suggests create-secret" "${msg}"
fi

msg="$( (OIDC_CLIENT_SECRET='' SECRET_VALUE='REPLACE_ME' preflight_oidc_secret) 2>&1 )"
if grep -q 'put-secret-value' <<<"${msg}"; then
  pass "placeholder error suggests put-secret-value"
else
  fail "placeholder error suggests put-secret-value" "${msg}"
fi

echo ""
echo "setup-helpers.test.sh: ${PASS} passed, ${FAIL} failed"
[[ "${FAIL}" -eq 0 ]]
