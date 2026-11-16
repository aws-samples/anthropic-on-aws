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
# It also covers ensure_build_bucket, which keeps Step 3 from uploading build input
# to a same-named bucket in someone else's account.

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

# SKIP pass 1: anything holding resources. The invented status stands in for a future
# CloudFormation value, which must fail closed (skip) rather than fall into the
# destructive branch.
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
# CDK's own handling (2.1133.0): it waits out *_IN_PROGRESS, deletes and recreates a
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

# ── 4. find_linux_binary — the Step 3 prerequisite, checked before any AWS call ─
# #262: the binary used to be located in Step 3, after the ECR repo, S3 bucket,
# and IAM role already existed. It is now resolved by the preflight up front,
# so these assert the locator itself against scratch dirs (the script's own cwd
# layout: cdk/ with an optional linux-x64/ beside it).
SCRATCH="$(mktemp -d)"
trap 'rm -rf "${SCRATCH}"' EXIT
mkdir -p "${SCRATCH}/cdk/linux-x64" "${SCRATCH}/linux-x64"
touch "${SCRATCH}/cdk/linux-x64/claude" "${SCRATCH}/linux-x64/claude"
touch "${SCRATCH}/cdk/claude" "${SCRATCH}/claude"

# Every accepted layout resolves (first match wins, mirroring the call site).
# Paths keep their ../ form — identical file, same as the script always used.
out="$(find_linux_binary "${SCRATCH}/cdk")"
if [[ "$?" -eq 0 && "${out}" == "${SCRATCH}/cdk/../linux-x64/claude" ]]; then
  pass "prefers the README step 5 linux-x64/ layout beside cdk/"
else
  fail "prefers the README step 5 linux-x64/ layout beside cdk/" "got '${out}'"
fi
rm "${SCRATCH}/linux-x64/claude"
out="$(find_linux_binary "${SCRATCH}/cdk")"
if [[ "$?" -eq 0 && "${out}" == "${SCRATCH}/cdk/linux-x64/claude" ]]; then
  pass "falls back to linux-x64/ inside cdk/"
else
  fail "falls back to linux-x64/ inside cdk/" "got '${out}'"
fi
rm "${SCRATCH}/cdk/linux-x64/claude"
out="$(find_linux_binary "${SCRATCH}/cdk")"
if [[ "$?" -eq 0 && "${out}" == "${SCRATCH}/cdk/claude" ]]; then
  pass "falls back to ./claude (the tracked Dockerfile's location)"
else
  fail "falls back to ./claude (the tracked Dockerfile's location)" "got '${out}'"
fi
rm "${SCRATCH}/cdk/claude"
out="$(find_linux_binary "${SCRATCH}/cdk")"
if [[ "$?" -eq 0 && "${out}" == "${SCRATCH}/cdk/../claude" ]]; then
  pass "falls back to ../claude"
else
  fail "falls back to ../claude" "got '${out}'"
fi

# Absent everywhere: silent, non-zero — the caller prints the fix, not this.
rm "${SCRATCH}/claude"
out="$(find_linux_binary "${SCRATCH}/cdk")"
if [[ "$?" -ne 0 && -z "${out}" ]]; then
  pass "missing binary fails silently for the caller to report"
else
  fail "missing binary fails silently for the caller to report" "got '${out}'"
fi

# ── 5. ensure_build_bucket — never build from a bucket another account owns ──
# The bucket name is derived from the account ID and region, so another account can
# create it first. `aws` is stubbed: head-bucket prints HEAD_ERR to stderr and returns
# HEAD_RC (0 = ours); `s3 mb` returns MB_RC. CALLS records whether the create ran
# (head-bucket runs inside $(...), so its own call isn't recorded here).
NOT_FOUND_ERR='An error occurred (404) when calling the HeadBucket operation: Not Found'
FORBIDDEN_ERR='An error occurred (403) when calling the HeadBucket operation: Forbidden'
CALLS=""
# shellcheck disable=SC2329  # invoked indirectly, by ensure_build_bucket
aws() {
  CALLS+="$1:$2 "
  case "$1 $2" in
    "s3api head-bucket") [[ -n "${HEAD_ERR}" ]] && echo "${HEAD_ERR}" >&2; return "${HEAD_RC}" ;;
    "s3 mb")             return "${MB_RC}" ;;
    *)                   return 99 ;;
  esac
}

HEAD_RC=0 HEAD_ERR="" MB_RC=0 CALLS=""
if ensure_build_bucket b 123456789012 us-east-1 >/dev/null && [[ "${CALLS}" != *"s3:mb"* ]]; then
  pass "a bucket we already own is reused without a create"
else
  fail "a bucket we already own is reused without a create" "calls: ${CALLS}"
fi

HEAD_RC=254 HEAD_ERR="${NOT_FOUND_ERR}" MB_RC=0 CALLS=""
if ensure_build_bucket b 123456789012 us-east-1 >/dev/null && [[ "${CALLS}" == *"s3:mb"* ]]; then
  pass "an absent bucket (404) is created"
else
  fail "an absent bucket (404) is created" "calls: ${CALLS}"
fi

# Another account holds the name, so head-bucket with the expected owner gets 403.
# Abort without trying to create.
HEAD_RC=254 HEAD_ERR="${FORBIDDEN_ERR}" MB_RC=0 CALLS=""
if ensure_build_bucket b 123456789012 us-east-1 >/dev/null 2>&1; then
  fail "a bucket owned by another account (403) aborts the deploy" "expected non-zero exit"
elif [[ "${CALLS}" == *"s3:mb"* ]]; then
  fail "a bucket owned by another account (403) aborts the deploy" "create was attempted: ${CALLS}"
else
  pass "a bucket owned by another account (403) aborts the deploy"
fi

# Any other head-bucket failure (expired credentials, throttling) also aborts.
HEAD_RC=254 HEAD_ERR='An error occurred (400) when calling the HeadBucket operation: Bad Request' MB_RC=0 CALLS=""
if ! ensure_build_bucket b 123456789012 us-east-1 >/dev/null 2>&1 && [[ "${CALLS}" != *"s3:mb"* ]]; then
  pass "a non-404 head-bucket failure aborts without a create"
else
  fail "a non-404 head-bucket failure aborts without a create" "calls: ${CALLS}"
fi

# Someone takes the name between the 404 and our create: BucketAlreadyExists aborts.
HEAD_RC=254 HEAD_ERR="${NOT_FOUND_ERR}" MB_RC=1 CALLS=""
if ensure_build_bucket b 123456789012 us-east-1 >/dev/null 2>&1; then
  fail "a failed create after a 404 aborts the deploy" "expected non-zero exit"
else
  pass "a failed create after a 404 aborts the deploy"
fi

# The ownership check must actually pass the expected owner, or S3 never refuses.
# head-bucket runs inside $(...), so log to a file rather than a variable.
CALLS_FILE="$(mktemp)"
# shellcheck disable=SC2329  # invoked indirectly, by ensure_build_bucket
aws() { echo "$*" >>"${CALLS_FILE}"; return 0; }
ensure_build_bucket b 123456789012 us-east-1 >/dev/null
CALLS="$(cat "${CALLS_FILE}")"; rm -f "${CALLS_FILE}"
if [[ "${CALLS}" == *"head-bucket --bucket b --expected-bucket-owner 123456789012"* ]]; then
  pass "head-bucket is called with --expected-bucket-owner"
else
  fail "head-bucket is called with --expected-bucket-owner" "calls: ${CALLS}"
fi

# Uploads repeat the check on every write.
CALLS=""
# shellcheck disable=SC2329  # invoked indirectly, by put_build_input
aws() { CALLS+="$* "; return 0; }
put_build_input b claude /tmp/x 123456789012 us-east-1
if [[ "${CALLS}" == *"put-object"*"--expected-bucket-owner 123456789012"* ]]; then
  pass "put_build_input sends --expected-bucket-owner"
else
  fail "put_build_input sends --expected-bucket-owner" "calls: ${CALLS}"
fi
unset -f aws

# The CodeBuild role may read source only from a bucket in this account, so a
# same-named bucket created after teardown can't feed a build.
# shellcheck disable=SC2016  # ${ACCOUNT_ID} is matched literally, as deploy.sh spells it
if grep 'put-role-policy --role-name claude-gateway-codebuild' -A1 "${DEPLOY}" \
    | grep -q '\\"s3:GetObject\\".*\\"Condition\\":{\\"StringEquals\\":{\\"aws:ResourceAccount\\":\\"${ACCOUNT_ID}\\"}}'; then
  pass "CodeBuild role's S3 grant is conditioned on aws:ResourceAccount"
else
  fail "CodeBuild role's S3 grant is conditioned on aws:ResourceAccount"
fi

# The helpers only help if Step 3 uses them. Check the call sites, so restoring the
# old `aws s3 mb ... || true` or `aws s3 cp ... s3://$BUCKET` fails here.
BODY="$(sed -n '/^if \[ "\${DEPLOY_SH_LIB_ONLY:-}" = "1" \]/,$p' "${DEPLOY}" | grep -v '^[[:space:]]*#')"
# shellcheck disable=SC2016  # the \$ names are matched literally
if grep -qx 'ensure_build_bucket "\$BUCKET" "\$ACCOUNT_ID" "\$DEPLOY_REGION" || exit 1' <<<"${BODY}"; then
  pass "Step 3 gates on ensure_build_bucket"
else
  fail "Step 3 gates on ensure_build_bucket"
fi
missing=""
for key in buildspec.yml Dockerfile gateway.yaml claude; do
  grep -qE "^put_build_input \"\\\$BUCKET\" ${key} .* \"\\\$ACCOUNT_ID\" \"\\\$DEPLOY_REGION\"$" <<<"${BODY}" || missing+="${key} "
done
if [[ -z "${missing}" ]]; then
  pass "all four build inputs upload through put_build_input"
else
  fail "all four build inputs upload through put_build_input" "missing: ${missing}"
fi
if grep -qE 'aws s3 (mb|cp|sync|mv)\b' <<<"${BODY}"; then
  fail "no unchecked aws s3 mb/cp/sync/mv after the helpers" "$(grep -nE 'aws s3 (mb|cp|sync|mv)\b' <<<"${BODY}")"
else
  pass "no unchecked aws s3 mb/cp/sync/mv after the helpers"
fi

echo ""
echo "deploy-helpers.test.sh: ${PASS} passed, ${FAIL} failed"
[[ "${FAIL}" -eq 0 ]]
