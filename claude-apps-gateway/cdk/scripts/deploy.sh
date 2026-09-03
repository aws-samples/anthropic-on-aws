#!/bin/bash
# Claude Gateway — Full Deploy Script
# Deploys CDK stack, builds container image, and starts the service.
#
# Prerequisites:
#   1. .env file configured (cp .env.example .env)
#   2. claude linux-x64 binary staged (see cdk/README.md step 5) as either
#      linux-x64/claude or ./claude — the latter is where the tracked CDK Dockerfile expects it
#   3. AWS CLI configured
#   4. npm install already run
#
# Usage:
#   ./scripts/deploy.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

# ──────────────────────────────────────────────────────────────────────────────
# Helpers for the pass-1 safety gate (Step 1). Defined up here, before any config
# or AWS call, so tests can source them in isolation — see the DEPLOY_SH_LIB_ONLY
# gate below and test/deploy-helpers.test.sh. The gate decides whether to run a
# deploy that DELETES a live data plane, so its string→branch logic is tested
# rather than reasoned about.
# ──────────────────────────────────────────────────────────────────────────────

# classify_stack_query — turn a `describe-stacks` result into a stack status.
# Prints the status on success, prints NOTHING when the stack is genuinely absent,
# and returns non-zero when the query failed for any OTHER reason — callers must
# abort on that. This query is itself a safety control, so it must not fail open: a
# throttle, an expired credential, or a network blip would otherwise look like "no
# stack yet" and run the destructive pass against a live stack.
#
# stdout and stderr are passed in SEPARATELY on purpose. The CLI can print a
# warning to stderr while still succeeding (urllib3's NotOpenSSLWarning on some
# macOS Pythons); folding stderr into stdout would prepend that text to the status,
# and a recoverable ROLLBACK_COMPLETE stack would then read as an unknown status and
# skip the pass 1 it needs.
classify_stack_query() {
  local rc="$1" out="$2" err="$3"
  if [ "$rc" -eq 0 ]; then
    printf '%s' "$out"
    return 0
  fi
  case "$err" in
    *ValidationError*"does not exist"*) return 0 ;;  # genuinely absent → first deploy
    *) return 1 ;;
  esac
}

# needs_pass_one — should the ECR-repo-only pass 1 run for this stack status?
# Running pass 1 is the DESTRUCTIVE branch, so it gets the narrow allowlist: only a
# stack that is absent or provably holds nothing. Every other status — including one
# neither this script nor today's CloudFormation knows about — skips to pass 2,
# which is always the safe default.
needs_pass_one() {
  case "$1" in
    # "" is no stack at all. ROLLBACK_COMPLETE is a failed FIRST create (nothing
    # provisioned); CDK deletes and recreates it. REVIEW_IN_PROGRESS is a
    # change-set-only stack. DELETE_COMPLETE is listed because it belongs in the
    # "holds nothing" set, but nothing relies on it: describe-stacks by NAME never
    # returns a deleted stack (that needs the stack ID), so the arm is unreachable
    # from the call site below.
    ""|ROLLBACK_COMPLETE|REVIEW_IN_PROGRESS|DELETE_COMPLETE) return 0 ;;
    *) return 1 ;;
  esac
}

# Test hook: `DEPLOY_SH_LIB_ONLY=1 source deploy.sh` loads only the helpers above
# (see test/deploy-helpers.test.sh) — no .env, no required env, no AWS calls.
# shellcheck disable=SC2317  # the exit is the executed-not-sourced fallback
if [ "${DEPLOY_SH_LIB_ONLY:-}" = "1" ]; then return 0 2>/dev/null || exit 0; fi

# Load .env
if [ ! -f .env ]; then
  echo "❌ .env file not found. Run: cp .env.example .env and fill in your values."
  exit 1
fi
source .env

echo "=== Claude Gateway Deploy ==="
echo "Gateway: https://$GATEWAY_HOSTNAME"
echo ""

# The stack is parameterized by CDK context (-c), not .env — deploy.sh bridges the
# two. These are required for the pass-2 (full) deploy; fail early with a clear
# message rather than letting `cdk synth` throw a cryptic "Missing required context".
: "${GATEWAY_HOSTNAME:?set GATEWAY_HOSTNAME in .env (e.g. claude-gateway.internal.company.com)}"
: "${HOSTED_ZONE_NAME:?set HOSTED_ZONE_NAME in .env (your Route53 hosted zone, public or private, e.g. internal.company.com)}"
: "${CERT_ARN:?set CERT_ARN in .env (imported ACM cert ARN for the GATEWAY_HOSTNAME)}"
: "${INGRESS_CIDR:?set INGRESS_CIDR in .env (VPN/corp CLIENT CIDR developers connect from — NOT the VPC CIDR)}"
: "${BEDROCK_REGION:?set BEDROCK_REGION in .env}"

# GATEWAY_NAME is the name prefix for the stack's resources (repo, cluster, service,
# secrets, log group). The stack honors it via -c gatewayName, so any value works —
# but it MUST match what CDK creates, hence we thread the same value everywhere below.
GATEWAY_NAME="${GATEWAY_NAME:-claude-gateway}"

# OIDC client secret preflight. deploy.sh seeds Secrets Manager from this AFTER
# pass 2 (see Step 4b) — but bail now, before the long CDK/CodeBuild run, if it's
# unset or still the .env.example placeholder. Otherwise the stack comes up with a
# REPLACE_ME secret and OIDC login fails at the IdP with no obvious cause.
: "${OIDC_CLIENT_SECRET:?set OIDC_CLIENT_SECRET in .env (the real OIDC client secret; it is seeded into Secrets Manager, never baked into the image)}"
if [ "${OIDC_CLIENT_SECRET}" = "your-oidc-client-secret" ]; then
  echo "❌ OIDC_CLIENT_SECRET is still the .env.example placeholder. Set the real value in .env."
  exit 1
fi

# Region resolution. DEPLOY_REGION is where the STACK and all its resources live
# (VPC, ALB, RDS, ECR, ECS, CodeBuild, S3); BEDROCK_REGION is only the upstream
# model endpoint (gateway.yaml `region:` + the inference-profile IAM ARN). They
# default to the same value — the common single-region case. Precedence for the
# deploy region: explicit DEPLOY_REGION → BEDROCK_REGION → shell AWS_REGION →
# profile default. Exporting AWS_REGION/AWS_DEFAULT_REGION pins EVERY bare `aws`
# call AND CDK to this one value, so a region-less call can't silently follow a
# different shell setting (the mismatch this replaces).
DEPLOY_REGION="${DEPLOY_REGION:-${BEDROCK_REGION:-${AWS_REGION:-$(aws configure get region 2>/dev/null || true)}}}"
: "${DEPLOY_REGION:?could not resolve a deploy region (set DEPLOY_REGION or BEDROCK_REGION in .env, or a default region in your AWS profile)}"
export AWS_REGION="$DEPLOY_REGION" AWS_DEFAULT_REGION="$DEPLOY_REGION"
echo "Deploy region: $DEPLOY_REGION   Bedrock region: $BEDROCK_REGION"
echo ""

# Map .env → CDK context. deploy.sh builds the image as :latest via CodeBuild, so
# we pin imageTag=latest to match — otherwise the stack defaults to the pinned
# claude version tag, which this convenience path never pushes.
CDK_CTX=(
  -c "region=${DEPLOY_REGION}"
  -c "bedrockRegion=${BEDROCK_REGION}"
  -c "gatewayName=${GATEWAY_NAME}"
  -c "publicUrl=https://${GATEWAY_HOSTNAME}"
  -c "zoneName=${HOSTED_ZONE_NAME}"
  -c "ingressCidr=${INGRESS_CIDR}"
  -c "certArn=${CERT_ARN}"
  -c "imageTag=latest"
)
# zoneId is optional (looked up from zoneName if omitted). Pass it only when the
# user set a real value, not the .env.example placeholder.
if [ -n "${HOSTED_ZONE_ID:-}" ] && [ "${HOSTED_ZONE_ID}" != "ZXXXXXXXXXXXXXXXXX" ]; then
  CDK_CTX+=(-c "zoneId=${HOSTED_ZONE_ID}")
fi
# Optional: reuse an existing VPC (e.g. to keep a Client VPN association intact).
# If that VPC already has the Bedrock/Secrets Manager/ECR/CloudWatch/S3 endpoints,
# also set CREATE_VPC_ENDPOINTS=false — the stack refuses to recreate them.
[ -n "${VPC_ID:-}" ] && CDK_CTX+=(-c "vpcId=${VPC_ID}")
[ -n "${CREATE_VPC_ENDPOINTS:-}" ] && CDK_CTX+=(-c "createVpcEndpoints=${CREATE_VPC_ENDPOINTS}")

# --- Step 1: CDK pass 1 — ECR repository only ---
# The ECS service can't start until its image exists, so the stack splits the
# deploy in two: pass 1 creates just the ECR repo; we build+push; pass 2 (below)
# brings up the full stack. See cdk/README.md "CDK context variables".
#
# Pass 1 is FIRST-DEPLOY ONLY. Its template holds exactly one resource (the ECR
# repo), so deploying it over a stack that already reached pass 2 makes
# CloudFormation delete the ~50 resources absent from it: the RDS instance
# (deletionProtection false + RemovalPolicy.DESTROY + 1-day backups, so the
# gateway's store is gone), the ALB, the ECS service, the secrets, the log group,
# the VPC. Re-running deploy.sh must therefore go straight to build + pass 2,
# which is also what preserves TaskSg and any 443 rules you authorized on reused
# interface endpoints (see NO_ROLLBACK below).
#
# Read the current status, keeping stderr out of the value (see classify_stack_query).
STACK_ERR_FILE="$(mktemp)"
set +e
STACK_OUT="$(aws cloudformation describe-stacks --stack-name ClaudeGatewayStack \
  --query 'Stacks[0].StackStatus' --output text 2>"$STACK_ERR_FILE")"
STACK_RC=$?
set -e
STACK_ERR="$(cat "$STACK_ERR_FILE")"
rm -f "$STACK_ERR_FILE"

STACK_STATUS="$(classify_stack_query "$STACK_RC" "$STACK_OUT" "$STACK_ERR")" || {
  echo "❌ Could not determine the ClaudeGatewayStack status, so deploy.sh cannot"
  echo "   tell a first deploy from an existing one — refusing to continue, because"
  echo "   guessing wrong runs a repo-only deploy that would delete the RDS instance"
  echo "   and the rest of the running stack. Fix the AWS call and re-run:"
  echo "   $STACK_ERR"
  exit 1
}

# Only the pass-1 decision is made here. Every other status is CDK's to report — this
# script does not re-implement CloudFormation's status list. What that means in
# practice, read off the pinned CDK (2.1129) rather than assumed:
#   * *_IN_PROGRESS — cdk WAITS for the operation to settle, then deploys. Bailing
#     here would turn a case that heals itself into a hard failure.
#   * ROLLBACK_COMPLETE / ROLLBACK_FAILED — a failed FIRST create, so cdk deletes the
#     stack and recreates it (StackStatus.isCreationFailure). ROLLBACK_COMPLETE is in
#     the pass-1 allowlist above; ROLLBACK_FAILED is not, deliberately — its rollback
#     failed, so resources may be orphaned, and it is rare enough not to justify
#     widening the destructive branch. It stops with a clear message at the
#     EcrRepositoryUri check in Step 2 instead.
#   * CREATE_FAILED / UPDATE_FAILED / UPDATE_ROLLBACK_FAILED — cdk calls these
#     "fail-paused" and ASKS to roll back before deploying. `--require-approval never`
#     does NOT cover that prompt (it only waives security-group/IAM approval); only
#     `--force` does. So an interactive run stops for a y/n and a non-TTY run fails
#     with TtyNotAttached — in both cases AFTER the ~10-minute image build. Roll back
#     first (`npx cdk rollback`) if you land there. NO_ROLLBACK=1 side-steps it for
#     UPDATE_FAILED, which is the state that flag's retry path exists for.
if needs_pass_one "$STACK_STATUS"; then
  echo "Step 1/5: Pass 1 — creating the ECR repository (CDK)..."
  npx cdk deploy --require-approval never -c imageReady=false "${CDK_CTX[@]}"
  echo "✅ ECR repository created"
else
  echo "Step 1/5: stack exists ($STACK_STATUS) — skipping pass 1 (a repo-only deploy would delete the ALB/RDS/service)."
fi
echo ""

# --- Step 2: Get outputs ---
echo "Step 2/5: Reading stack outputs..."
ECR_URI=$(aws cloudformation describe-stacks --stack-name ClaudeGatewayStack \
  --query "Stacks[0].Outputs[?OutputKey=='EcrRepositoryUri'].OutputValue" --output text)
# Now that pass 1 can be skipped, this can run against a stack that has no
# EcrRepositoryUri output at all — and `--output text` prints the literal string
# "None" for a query that matched nothing. Catch that here: left alone it flows into
# REPO_NAME and the rename guard below blames a GATEWAY_NAME change that never
# happened.
if [ -z "$ECR_URI" ] || [ "$ECR_URI" = "None" ]; then
  echo "❌ ClaudeGatewayStack has no EcrRepositoryUri output, so there is nowhere to"
  echo "   push the image. This is NOT a GATEWAY_NAME problem: either the stack predates"
  echo "   that output, or its pass 1 never completed. (Status before this run:"
  echo "   ${STACK_STATUS:-absent}.) Deploy pass 2 by hand (docs/deployment.md, Track B)"
  echo "   or tear down and deploy fresh (docs/teardown.md)."
  exit 1
fi
# The repo name the stack actually created, taken from the URI — this is what the
# CodeBuild IAM policy and docker tags must reference (never assume GATEWAY_NAME
# alone, so a name mismatch with the stack can't break the push).
REPO_NAME="${ECR_URI##*/}"
echo "   ECR: $ECR_URI (repo: $REPO_NAME)"

# Renaming a deployed gateway in place isn't supported: pass 2 would replace the ECR
# repo, leaving the service pulling from an empty one. Fail here rather than at a
# confusing ECS pull error. See cdk/README.md (GATEWAY_NAME).
if [ "$REPO_NAME" != "$GATEWAY_NAME" ]; then
  echo "❌ GATEWAY_NAME is '$GATEWAY_NAME' but this stack's repo is '$REPO_NAME'. Set it"
  echo "   back, or tear down (docs/teardown.md) and deploy fresh under the new name."
  exit 1
fi
echo ""

# --- Step 3: Build and push image ---
echo "Step 3/5: Building and pushing gateway image..."

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
# Region-suffixed: CodeBuild requires its S3 source bucket in the PROJECT's region,
# so the bucket name must vary by region (an account-global name would leave the
# bucket in the first region and fail a build in any other). See the single-region
# scope note below.
BUCKET="claude-gateway-build-${ACCOUNT_ID}-${DEPLOY_REGION}"
# Create the S3 build bucket BEFORE the CodeBuild project, which references it as
# its source location — create-project fails with "Bucket ... does not exist"
# otherwise (only bites a first-ever run, where the project doesn't yet exist).
aws s3 mb "s3://$BUCKET" --region "$DEPLOY_REGION" 2>/dev/null || true

# CodeBuild role + policy. The project has a FIXED name (CodeBuild projects are
# region-scoped, so the same name in another region is a separate project); the
# role has a FIXED name and IAM is global. The inline policy is scoped to THIS
# deploy's ECR repo + region, so re-assert it on EVERY run (idempotent overwrite)
# instead of only at first project creation — otherwise redeploying with a
# different gatewayName leaves the role authorized for the previous repo and the
# build fails with an opaque ECR AccessDenied.
#
# SCOPE: deploy.sh targets ONE active region per account. The shared global role
# means concurrent deployments in multiple regions (or under different gateway
# names) overwrite each other's policy — give the role + project per-region/-name
# suffixes if you truly need them side by side. See cdk/README.md (DEPLOY_REGION).
# A bare `|| true` here would also swallow "you may not create roles", which then
# resurfaces as a baffling put-role-policy failure below. Tolerate ONLY "the role is
# already there"; anything else aborts with the API's own message.
ROLE_ERR_FILE="$(mktemp)"
set +e
aws iam create-role --role-name claude-gateway-codebuild \
  --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"codebuild.amazonaws.com"},"Action":"sts:AssumeRole"}]}' \
  >/dev/null 2>"$ROLE_ERR_FILE"
ROLE_RC=$?
set -e
if [ "$ROLE_RC" -ne 0 ] && ! grep -q 'EntityAlreadyExists' "$ROLE_ERR_FILE"; then
  echo "❌ Could not create the CodeBuild role claude-gateway-codebuild:"
  sed 's/^/   /' "$ROLE_ERR_FILE"
  rm -f "$ROLE_ERR_FILE"
  exit 1
fi
rm -f "$ROLE_ERR_FILE"

# No 2>/dev/null: put-role-policy is quiet on success, and this now runs on EVERY
# deploy — silencing it would turn a real IAM failure into the script dying right
# after "Step 3/5" with nothing printed (set -e, no `|| true`).
aws iam put-role-policy --role-name claude-gateway-codebuild --policy-name build-perms \
  --policy-document "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Action\":[\"s3:GetObject\",\"s3:ListBucket\"],\"Resource\":[\"arn:aws:s3:::${BUCKET}\",\"arn:aws:s3:::${BUCKET}/*\"]},{\"Effect\":\"Allow\",\"Action\":[\"ecr:GetAuthorizationToken\"],\"Resource\":\"*\"},{\"Effect\":\"Allow\",\"Action\":[\"ecr:BatchCheckLayerAvailability\",\"ecr:GetDownloadUrlForLayer\",\"ecr:BatchGetImage\",\"ecr:PutImage\",\"ecr:InitiateLayerUpload\",\"ecr:UploadLayerPart\",\"ecr:CompleteLayerUpload\"],\"Resource\":\"arn:aws:ecr:${DEPLOY_REGION}:${ACCOUNT_ID}:repository/${REPO_NAME}\"},{ \"Effect\":\"Allow\",\"Action\":[\"logs:CreateLogGroup\",\"logs:CreateLogStream\",\"logs:PutLogEvents\"],\"Resource\":\"*\"}]}"

# IAM is eventually consistent, and the policy above is scoped to THIS deploy's ECR
# repo and region — so any repo/region change rewrites it, on a run where the project
# already exists. Wait after every (re)assertion, not only at project creation, or a
# build can start against a policy that hasn't propagated → ECR AccessDenied.
sleep 10  # IAM propagation for the (re)asserted role policy

# The project's S3 source must track $BUCKET, so assert it on EVERY run — create it
# on a first deploy, else UPDATE an existing project's source. A project created by
# an earlier version of this script points at the old unsuffixed
# claude-gateway-build-${ACCOUNT_ID} bucket; since we now upload to the
# region-suffixed bucket and the role policy above grants only that one, leaving the
# stale source in place makes start-build fail while downloading its source.
CB_SOURCE="{\"type\":\"S3\",\"location\":\"${BUCKET}/\",\"buildspec\":\"buildspec.yml\"}"
if ! aws codebuild batch-get-projects --names claude-gateway-build --query "projects[0].name" --output text 2>/dev/null | grep -q claude-gateway-build; then
  echo "   Creating CodeBuild project..."
  aws codebuild create-project --name claude-gateway-build \
    --source "$CB_SOURCE" \
    --artifacts '{"type":"NO_ARTIFACTS"}' \
    --environment '{"type":"LINUX_CONTAINER","image":"aws/codebuild/standard:7.0","computeType":"BUILD_GENERAL1_SMALL","privilegedMode":true}' \
    --service-role "arn:aws:iam::${ACCOUNT_ID}:role/claude-gateway-codebuild" >/dev/null
else
  aws codebuild update-project --name claude-gateway-build \
    --source "$CB_SOURCE" \
    --service-role "arn:aws:iam::${ACCOUNT_ID}:role/claude-gateway-codebuild" >/dev/null
fi

# Find the linux binary. Accept the README step 5 linux-x64/ layout OR the location
# the tracked CDK Dockerfile uses (cdk/claude, i.e. ./claude relative to cdk/), so the
# two documented build paths agree on where the binary lives.
LINUX_BINARY=""
if [ -f "../linux-x64/claude" ]; then
  LINUX_BINARY="../linux-x64/claude"
elif [ -f "./linux-x64/claude" ]; then
  LINUX_BINARY="./linux-x64/claude"
elif [ -f "./claude" ]; then
  LINUX_BINARY="./claude"
elif [ -f "../claude" ]; then
  LINUX_BINARY="../claude"
else
  echo "❌ claude binary not found (looked for linux-x64/claude and ./claude). Download it (see cdk/README.md step 5)."
  exit 1
fi

# Stamp gateway.yaml from the COMMITTED template via stamp-config.sh — the SAME
# path setup.sh uses (setup.sh Step 2a) — instead of maintaining a second inline
# copy of the config here. This is what wires telemetry: the template's
# `telemetry.forward_to: http://localhost:4318` block (the gateway's own ADOT
# collector sidecar, which relays to CloudWatch via SigV4 on the task role) only
# reaches the image through this stamp. The old inline heredoc omitted it, so
# telemetry forwarding was silently off even though the CDK task runs the sidecar.
# The sidecar + `CLAUDE_GATEWAY_ALLOW_LOOPBACK=1` (needed to push to localhost past
# the SSRF guard) come from the CDK stack this script deploys, so no extra wiring is
# needed here. Stamping also keeps the model catalog + store wiring in lockstep with
# the template, so a template change can't skip this convenience path.
# AWS_REGION here is the Bedrock endpoint region (the upstream `region:` the
# template bakes); DB_NAME defaults inside stamp-config.sh to match the stack.
echo "   Stamping gateway.yaml from gateway.yaml.template..."
PUBLIC_URL="https://${GATEWAY_HOSTNAME}" \
AWS_REGION="${BEDROCK_REGION}" \
OIDC_ISSUER="${OIDC_ISSUER}" \
OIDC_CLIENT_ID="${OIDC_CLIENT_ID}" \
ALLOWED_EMAIL_DOMAINS="${ALLOWED_EMAIL_DOMAINS}" \
TEMPLATE="${PROJECT_DIR}/gateway.yaml.template" \
OUT="/tmp/gw-gateway.yaml" \
  "${SCRIPT_DIR}/stamp-config.sh"

# Build via the COMMITTED distroless Dockerfile (cdk/Dockerfile), not a second
# inline copy. It expects ./claude and ./gateway.yaml in the build context and must
# be built --platform=linux/amd64 --provenance=false (the binary is linux/amd64;
# buildx OCI image indexes are rejected by some runtimes). Mirrors setup.sh's build.
cat > /tmp/gw-buildspec.yml <<EOF
version: 0.2
phases:
  pre_build:
    commands:
      - aws ecr get-login-password --region ${DEPLOY_REGION} | docker login --username AWS --password-stdin ${ECR_URI}
  build:
    commands:
      - docker build --platform=linux/amd64 --provenance=false -t ${REPO_NAME} .
      - docker tag ${REPO_NAME}:latest ${ECR_URI}:latest
  post_build:
    commands:
      - docker push ${ECR_URI}:latest
EOF

aws s3 cp /tmp/gw-buildspec.yml "s3://$BUCKET/buildspec.yml" --quiet
aws s3 cp "${PROJECT_DIR}/Dockerfile" "s3://$BUCKET/Dockerfile" --quiet
aws s3 cp /tmp/gw-gateway.yaml "s3://$BUCKET/gateway.yaml" --quiet
aws s3 cp "$LINUX_BINARY" "s3://$BUCKET/claude" --quiet

echo "   Starting build..."
BUILD_ID=$(aws codebuild start-build --project-name claude-gateway-build --query "build.id" --output text)

echo "   Waiting for build to complete..."
while true; do
  STATUS=$(aws codebuild batch-get-builds --ids "$BUILD_ID" --query "builds[0].buildStatus" --output text)
  if [ "$STATUS" = "SUCCEEDED" ]; then
    echo "✅ Image built and pushed to ECR"
    break
  elif [ "$STATUS" = "FAILED" ] || [ "$STATUS" = "STOPPED" ]; then
    echo "❌ Build failed: $STATUS"
    exit 1
  fi
  sleep 10
done
echo ""

# --- Step 4: CDK pass 2 — full stack incl. the Fargate service ---
# The image now exists in ECR, so pass 2 brings up the service (desiredCount 2)
# behind the internal ALB. cdk deploy blocks until the service is stable, so no
# manual `update-service` scale-up is needed.
#
# NO_ROLLBACK=1 adds --no-rollback (CloudFormation DisableRollback). Needed when
# reusing a VPC whose interface endpoints don't yet allow 443 from the task SG: the
# service can't stabilize, and the default rollback deletes the just-created TaskSg
# — the very SG you have to authorize on those endpoints. Retaining it makes the
# documented deploy → authorize → redeploy sequence possible. Off by default: the
# failure leaves the stack in UPDATE_FAILED, which you then have to either retry or
# abandon by hand (`npx cdk rollback` / `aws cloudformation rollback-stack` —
# continue-update-rollback does NOT apply, it only takes UPDATE_ROLLBACK_FAILED).
#
# Set it per-run (`NO_ROLLBACK=1 ./scripts/deploy.sh`), not exported in your shell or
# .env: CloudFormation REFUSES an update that requires replacing a resource while
# rollback is disabled, so a leftover NO_ROLLBACK=1 makes an unrelated later change
# fail for a reason that has nothing to do with the change.
CDK_DEPLOY_FLAGS=(--require-approval never)
[ "${NO_ROLLBACK:-0}" = "1" ] && CDK_DEPLOY_FLAGS+=(--no-rollback)
echo "Step 4/5: Pass 2 — deploying the full stack (CDK)..."
npx cdk deploy "${CDK_DEPLOY_FLAGS[@]}" -c imageReady=true "${CDK_CTX[@]}"
echo "✅ Full stack deployed"
echo ""

# --- Step 4b: Seed the OIDC client secret ---
# The stack creates <gatewayName>-oidc-client-secret with a CDK-generated
# placeholder (NOT a fixed value — so this seed survives future deploys instead of
# being reset). Inject the real secret from .env now that the secret exists (pass 1
# doesn't create it). The task reads it as the OIDC_CLIENT_SECRET env var; it is
# never baked into the image. This mirrors setup.sh's Secrets Manager seeding.
echo "Step 4b: Seeding the OIDC client secret into Secrets Manager..."
aws secretsmanager put-secret-value \
  --secret-id "${GATEWAY_NAME}-oidc-client-secret" \
  --secret-string "${OIDC_CLIENT_SECRET}" >/dev/null
# ECS resolves Secrets Manager values at task launch, so the tasks pass 2 already
# started still hold the old placeholder. Force a fresh deployment to pick up the
# seeded value, then block until the service is stable. (cluster + service are both
# named GATEWAY_NAME.)
aws ecs update-service --cluster "${GATEWAY_NAME}" --service "${GATEWAY_NAME}" \
  --force-new-deployment >/dev/null
echo "   Waiting for the service to redeploy with the seeded secret..."
aws ecs wait services-stable --cluster "${GATEWAY_NAME}" --services "${GATEWAY_NAME}"
echo "✅ OIDC client secret seeded and service redeployed"
echo ""

# --- Step 5: Verify ---
# The gateway sits behind an INTERNAL ALB (private IPs by design), so this probe
# only succeeds from a host with a private network path to the VPC (in-VPC, VPN,
# Direct Connect, peering, Transit Gateway, etc.). Bound the curl with an explicit
# --connect-timeout/--max-time: without them it hangs on the TCP connect when run
# from a host that can't route to the private ALB, making an already-finished
# deploy look stuck. A failure here is EXPECTED when there is no network path and
# does NOT mean the deploy failed — the stack/service are already up by this point.
echo "Step 5/5: Verifying the gateway..."
RESPONSE=$(curl -s --connect-timeout 5 --max-time 15 \
  "https://${GATEWAY_HOSTNAME}/.well-known/oauth-authorization-server" 2>/dev/null || echo "")
if echo "$RESPONSE" | grep -q "device_authorization_endpoint"; then
  echo "✅ Gateway is live at https://${GATEWAY_HOSTNAME}"
else
  echo "ℹ️  Could not reach the gateway from here within the timeout — this is EXPECTED"
  echo "    when this host has no private network path to the VPC (VPN, Direct Connect,"
  echo "    in-VPC, etc.); the ALB is internal (private IPs only). The deploy itself is"
  echo "    complete. Verify from a host with a network path to the VPC with:"
  echo "      curl https://${GATEWAY_HOSTNAME}/.well-known/oauth-authorization-server"
fi

echo ""
echo "=== Deploy Complete ==="
echo ""
echo "Next steps:"
echo "  1. Push managed settings to developer machines:"
echo "     {\"forceLoginMethod\":\"gateway\",\"forceLoginGatewayUrl\":\"https://${GATEWAY_HOSTNAME}\"}"
echo ""
echo "  2. Developers run: claude /login"
echo ""
echo "  To tear down: npx cdk destroy"
