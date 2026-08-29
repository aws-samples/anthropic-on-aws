#!/usr/bin/env bash
# update-config.sh — rebuild the gateway image from the current gateway.yaml.template
# and roll the ECS service to it. CloudFormation-free: never runs cdk, so the VPC,
# RDS, ALB, and secrets are never touched.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

# Load .env
if [ ! -f .env ]; then
  echo "❌ .env file not found. Run: cp .env.example .env and fill in your values."
  exit 1
fi
source .env

GATEWAY_NAME="${GATEWAY_NAME:-claude-gateway}"
DEPLOY_REGION="${DEPLOY_REGION:-${BEDROCK_REGION:-${AWS_REGION:-$(aws configure get region)}}}"
export AWS_REGION="$DEPLOY_REGION" AWS_DEFAULT_REGION="$DEPLOY_REGION"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
BUCKET="claude-gateway-build-${ACCOUNT_ID}"

echo "=== Claude Gateway Config Update ==="
echo "Gateway: https://$GATEWAY_HOSTNAME"
echo "Deploy region: $DEPLOY_REGION   Bedrock region: $BEDROCK_REGION"
echo ""

# Guard: refuse to run if the ECS service isn't up (e.g. mid-teardown). Re-run
# ./scripts/deploy.sh to rebuild the stack first.
if ! aws ecs describe-services --cluster "$GATEWAY_NAME" --services "$GATEWAY_NAME" \
      --query "services[0].status" --output text 2>/dev/null | grep -q ACTIVE; then
  echo "❌ ECS service $GATEWAY_NAME is not ACTIVE. Re-run ./scripts/deploy.sh to rebuild the stack first."
  exit 1
fi

# --- Step 1: Stamp config ---
# Stamp gateway.yaml from the committed template (AWS_REGION here = Bedrock region,
# inline for this command only so the parent deploy region is unchanged).
echo "Step 1/3: Stamping gateway.yaml from gateway.yaml.template..."
PUBLIC_URL="https://${GATEWAY_HOSTNAME}" \
AWS_REGION="${BEDROCK_REGION}" \
OIDC_ISSUER="${OIDC_ISSUER}" \
OIDC_CLIENT_ID="${OIDC_CLIENT_ID}" \
ALLOWED_EMAIL_DOMAINS="${ALLOWED_EMAIL_DOMAINS}" \
TEMPLATE="${PROJECT_DIR}/gateway.yaml.template" \
OUT="/tmp/gw-gateway.yaml" \
  "${SCRIPT_DIR}/stamp-config.sh"
echo "✅ Config stamped"
echo ""

# --- Step 2: Build and push image ---
echo "Step 2/3: Building and pushing gateway image..."

# Locate the linux binary (baked into the image alongside the config).
LINUX_BINARY=""
for p in ../linux-x64/claude ./linux-x64/claude ./claude ../claude; do
  [ -f "$p" ] && LINUX_BINARY="$p" && break
done
if [ -z "$LINUX_BINARY" ]; then
  echo "❌ claude binary not found (looked for linux-x64/claude and ./claude). Download it (see cdk/README.md step 5)."
  exit 1
fi

# Build + push :latest via the existing CodeBuild project.
ECR_URI=$(aws cloudformation describe-stacks --stack-name ClaudeGatewayStack \
  --query "Stacks[0].Outputs[?OutputKey=='EcrRepositoryUri'].OutputValue" --output text)
REPO_NAME="${ECR_URI##*/}"
echo "   ECR: $ECR_URI (repo: $REPO_NAME)"

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
aws s3 cp "${PROJECT_DIR}/Dockerfile"   "s3://$BUCKET/Dockerfile"   --quiet
aws s3 cp /tmp/gw-gateway.yaml          "s3://$BUCKET/gateway.yaml" --quiet
aws s3 cp "$LINUX_BINARY"               "s3://$BUCKET/claude"       --quiet

echo "   Starting build..."
BUILD_ID=$(aws codebuild start-build --project-name claude-gateway-build --query "build.id" --output text)

echo "   Waiting for build to complete..."
while true; do
  STATUS=$(aws codebuild batch-get-builds --ids "$BUILD_ID" --query "builds[0].buildStatus" --output text)
  if [ "$STATUS" = "SUCCEEDED" ]; then
    echo "✅ Image built and pushed to ECR"
    break
  elif [ "$STATUS" = "FAILED" ] || [ "$STATUS" = "STOPPED" ] || [ "$STATUS" = "FAULT" ] || [ "$STATUS" = "TIMED_OUT" ]; then
    echo "❌ Build failed: $STATUS"
    exit 1
  fi
  sleep 10
done
echo ""

# --- Step 3: Roll the service (this is the whole update — no CloudFormation) ---
echo "Step 3/3: Rolling the ECS service..."
aws ecs update-service --cluster "$GATEWAY_NAME" --service "$GATEWAY_NAME" \
  --force-new-deployment >/dev/null
echo "   Waiting for the service to redeploy with the new image..."
aws ecs wait services-stable --cluster "$GATEWAY_NAME" --services "$GATEWAY_NAME"
echo "✅ Config updated and service rolled — no CloudFormation touched"
echo ""

echo "=== Update Complete ==="
