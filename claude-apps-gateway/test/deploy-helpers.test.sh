#!/usr/bin/env bash
# Tests for deploy.sh's pass-1 safety gate (DEPLOY_SH_LIB_ONLY=1 gate). Self-
# contained (no bats): plain bash assertions, no AWS account, no network.
# Run from anywhere:
#   ./test/deploy-helpers.test.sh
#
# Why this file exists: pass 1 (`-c imageReady=false`) deploys a template holding
# only the ECR repo, so running it over a stack that reached pass 2 tells
# CloudFormation to delete the ~50 resources absent from it — the RDS instance and
# the gateway's store included. The whole protection is two string→branch decisions,
# so they get asserted here rather than reasoned about:
#   - classify_stack_query: not-found means "first deploy"; ANY other failure aborts
#   - needs_pass_one:       the destructive branch's narrow allowlist

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY="${REPO_ROOT}/cdk/scripts/deploy.sh"
PASS=0
FAIL=0

pass() { PASS=$((PASS + 1)); echo "  ok   - $1"; }
fail() { FAIL=$((FAIL + 1)); echo "  FAIL - $1"; [[ -n "${2:-}" ]] && echo "         $2"; }

# Load only the helpers (the gate returns before the .env load and the required-env
# checks, so no AWS credentials or config are involved).
# shellcheck disable=SC1090
DEPLOY_SH_LIB_ONLY=1 source "${DEPLOY}" || { echo "FATAL: could not source ${DEPLOY}"; exit 1; }
# deploy.sh sets -e when sourced; undo it so a failed assertion doesn't abort the run.
set +e

echo "deploy-helpers.test.sh"

# ── 1. classify_stack_query — the query is a safety control, so it fails CLOSED ──
NOT_FOUND='An error occurred (ValidationError) when calling the DescribeStacks operation: Stack with id ClaudeGatewayStack does not exist'

out="$(classify_stack_query 0 'CREATE_COMPLETE' '')"
if [[ "$?" -eq 0 && "${out}" == "CREATE_COMPLETE" ]]; then
  pass "rc=0 yields the status verbatim"
else
  fail "rc=0 yields the status verbatim" "got '${out}'"
fi

out="$(classify_stack_query 255 '' "${NOT_FOUND}")"
if [[ "$?" -eq 0 && -z "${out}" ]]; then
  pass "ValidationError/does-not-exist yields an empty status (first deploy)"
else
  fail "ValidationError/does-not-exist yields an empty status (first deploy)" "got '${out}'"
fi

# Anything that is not an explicit not-found must abort. An empty status here would
# read as "no stack yet" and run the destructive pass against a live stack.
for err in \
  'An error occurred (ExpiredToken) when calling the DescribeStacks operation: The security token included in the request is expired' \
  'An error occurred (Throttling) when calling the DescribeStacks operation: Rate exceeded' \
  'An error occurred (AccessDenied) when calling the DescribeStacks operation: not authorized' \
  'Could not connect to the endpoint URL: "https://cloudformation.us-east-1.amazonaws.com/"' \
  ''
do
  label="${err:0:46}"; label="${label:-<empty stderr>}"
  if classify_stack_query 255 '' "${err}" >/dev/null 2>&1; then
    fail "query failure aborts: ${label}" "expected non-zero exit"
  else
    pass "query failure aborts: ${label}"
  fi
done

# A CLI that succeeds while warning on stderr (urllib3 NotOpenSSLWarning on some
# macOS Pythons) must not contaminate the status — this is why stdout and stderr are
# captured separately at the call site instead of with 2>&1.
out="$(classify_stack_query 0 'ROLLBACK_COMPLETE' 'urllib3/__init__.py:35: NotOpenSSLWarning: urllib3 v2 only supports OpenSSL 1.1.1+')"
if [[ "${out}" == "ROLLBACK_COMPLETE" ]] && needs_pass_one "${out}"; then
  pass "a stderr warning alongside a successful query leaves the status recoverable"
else
  fail "a stderr warning alongside a successful query leaves the status recoverable" "got '${out}'"
fi

# ── 2. needs_pass_one — the destructive branch's allowlist ─────────────────────
# RUN pass 1: no stack, or a stack provably holding no resources.
for status in "" ROLLBACK_COMPLETE REVIEW_IN_PROGRESS DELETE_COMPLETE; do
  if needs_pass_one "${status}"; then
    pass "runs pass 1 for '${status:-<absent>}'"
  else
    fail "runs pass 1 for '${status:-<absent>}'" "expected the pass-1 branch"
  fi
done

# SKIP pass 1: anything holding resources. UPDATE_FAILED is the --no-rollback
# recovery state; the invented status stands in for a future CloudFormation value,
# which must fail closed (skip) rather than fall into the destructive branch.
for status in CREATE_COMPLETE UPDATE_COMPLETE UPDATE_ROLLBACK_COMPLETE \
              UPDATE_FAILED IMPORT_COMPLETE IMPORT_ROLLBACK_COMPLETE \
              UPDATE_COMPLETE_CLEANUP_IN_PROGRESS DELETE_FAILED CREATE_FAILED \
              SOME_FUTURE_STATUS_CLOUDFORMATION_ADDS_LATER
do
  if needs_pass_one "${status}"; then
    fail "skips pass 1 for '${status}'" "would deploy the repo-only template over a live stack"
  else
    pass "skips pass 1 for '${status}'"
  fi
done

# ── 3. Statuses whose recovery is deliberately left to CDK ────────────────────
# deploy.sh does not re-implement CloudFormation's status list, so these must all
# take the SKIP branch rather than being special-cased. Checked against the pinned
# CDK's own handling (2.1129): it waits out *_IN_PROGRESS, deletes and recreates a
# failed first create, and asks before rolling a fail-paused stack forward.
for status in CREATE_IN_PROGRESS UPDATE_IN_PROGRESS DELETE_IN_PROGRESS \
              ROLLBACK_IN_PROGRESS UPDATE_ROLLBACK_IN_PROGRESS \
              UPDATE_COMPLETE_CLEANUP_IN_PROGRESS \
              ROLLBACK_FAILED UPDATE_ROLLBACK_FAILED DELETE_FAILED
do
  if needs_pass_one "${status}"; then
    fail "leaves '${status}' to CDK" "took the destructive pass-1 branch"
  else
    pass "leaves '${status}' to CDK"
  fi
done

echo ""
echo "deploy-helpers.test.sh: ${PASS} passed, ${FAIL} failed"
[[ "${FAIL}" -eq 0 ]]
