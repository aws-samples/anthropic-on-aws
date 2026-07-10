#!/bin/bash
# Claude Gateway — Full Deploy Script
# Deploys CDK stack, builds container image, and starts the service.
#
# Prerequisites:
#   1. .env file configured (cp .env.example .env)
#   2. claude linux-x64 binary staged (from the gateway tarball) as either
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

# Map .env → CDK context. deploy.sh builds the image as :latest via CodeBuild, so
# we pin imageTag=latest to match — otherwise the stack defaults to the pinned
# claude version tag, which this convenience path never pushes.
CDK_CTX=(
  -c "region=${BEDROCK_REGION}"
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
echo "Step 1/5: Pass 1 — creating the ECR repository (CDK)..."
npx cdk deploy --require-approval never -c imageReady=false "${CDK_CTX[@]}"
echo "✅ ECR repository created"
echo ""

# --- Step 2: Get outputs ---
echo "Step 2/5: Reading stack outputs..."
ECR_URI=$(aws cloudformation describe-stacks --stack-name ClaudeGatewayStack \
  --query "Stacks[0].Outputs[?OutputKey=='EcrRepositoryUri'].OutputValue" --output text)
# The repo name the stack actually created, taken from the URI — this is what the
# CodeBuild IAM policy and docker tags must reference (never assume GATEWAY_NAME
# alone, so a name mismatch with the stack can't break the push).
REPO_NAME="${ECR_URI##*/}"
echo "   ECR: $ECR_URI (repo: $REPO_NAME)"
echo ""

# --- Step 3: Build and push image ---
echo "Step 3/5: Building and pushing gateway image..."

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
BUCKET="claude-gateway-build-${ACCOUNT_ID}"
# Create the S3 build bucket BEFORE the CodeBuild project, which references it as
# its source location — create-project fails with "Bucket ... does not exist"
# otherwise (only bites a first-ever run, where the project doesn't yet exist).
aws s3 mb "s3://$BUCKET" 2>/dev/null || true

# Check if CodeBuild project exists, create if not
if ! aws codebuild batch-get-projects --names claude-gateway-build --query "projects[0].name" --output text 2>/dev/null | grep -q claude-gateway-build; then
  echo "   Creating CodeBuild project..."

  # Create IAM role for CodeBuild
  aws iam create-role --role-name claude-gateway-codebuild \
    --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"codebuild.amazonaws.com"},"Action":"sts:AssumeRole"}]}' 2>/dev/null || true

  aws iam put-role-policy --role-name claude-gateway-codebuild --policy-name build-perms \
    --policy-document "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Action\":[\"s3:GetObject\",\"s3:ListBucket\"],\"Resource\":[\"arn:aws:s3:::claude-gateway-build-${ACCOUNT_ID}\",\"arn:aws:s3:::claude-gateway-build-${ACCOUNT_ID}/*\"]},{\"Effect\":\"Allow\",\"Action\":[\"ecr:GetAuthorizationToken\"],\"Resource\":\"*\"},{\"Effect\":\"Allow\",\"Action\":[\"ecr:BatchCheckLayerAvailability\",\"ecr:GetDownloadUrlForLayer\",\"ecr:BatchGetImage\",\"ecr:PutImage\",\"ecr:InitiateLayerUpload\",\"ecr:UploadLayerPart\",\"ecr:CompleteLayerUpload\"],\"Resource\":\"arn:aws:ecr:${BEDROCK_REGION}:${ACCOUNT_ID}:repository/${REPO_NAME}\"},{ \"Effect\":\"Allow\",\"Action\":[\"logs:CreateLogGroup\",\"logs:CreateLogStream\",\"logs:PutLogEvents\"],\"Resource\":\"*\"}]}" 2>/dev/null

  sleep 10  # Wait for IAM propagation

  aws codebuild create-project --name claude-gateway-build \
    --source "{\"type\":\"S3\",\"location\":\"${BUCKET}/\",\"buildspec\":\"buildspec.yml\"}" \
    --artifacts '{"type":"NO_ARTIFACTS"}' \
    --environment '{"type":"LINUX_CONTAINER","image":"aws/codebuild/standard:7.0","computeType":"BUILD_GENERAL1_SMALL","privilegedMode":true}' \
    --service-role "arn:aws:iam::${ACCOUNT_ID}:role/claude-gateway-codebuild" >/dev/null
fi

# Find the linux binary. Accept the tarball's linux-x64/ layout OR the location the
# tracked CDK Dockerfile uses (cdk/claude, i.e. ./claude relative to cdk/), so the
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
  echo "❌ claude binary not found (looked for linux-x64/claude and ./claude). Extract it from the gateway tarball."
  exit 1
fi

# Create build files
cat > /tmp/gw-buildspec.yml <<EOF
version: 0.2
phases:
  pre_build:
    commands:
      - aws ecr get-login-password --region ${BEDROCK_REGION} | docker login --username AWS --password-stdin ${ECR_URI}
  build:
    commands:
      - chmod +x claude
      - docker build -t ${REPO_NAME} .
      - docker tag ${REPO_NAME}:latest ${ECR_URI}:latest
  post_build:
    commands:
      - docker push ${ECR_URI}:latest
EOF

cat > /tmp/gw-Dockerfile <<EOF
FROM public.ecr.aws/debian/debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
COPY claude /usr/local/bin/claude
COPY gateway.yaml /etc/claude/gateway.yaml
RUN chmod +x /usr/local/bin/claude
ENV CLAUDE_CONFIG_DIR=/tmp/.claude
EXPOSE 8080
ENTRYPOINT ["claude", "gateway", "--config", "/etc/claude/gateway.yaml"]
EOF

cat > /tmp/gw-gateway.yaml <<EOF
listen:
  host: 0.0.0.0
  port: 8080
  public_url: https://${GATEWAY_HOSTNAME}

oidc:
  issuer: ${OIDC_ISSUER}
  client_id: ${OIDC_CLIENT_ID}
  client_secret: \${OIDC_CLIENT_SECRET}
  allowed_email_domains: [$(echo $ALLOWED_EMAIL_DOMAINS | tr ',' ', ')]
  userinfo_fallback: true

session:
  jwt_secret: \${GATEWAY_JWT_SECRET}
  ttl_hours: 1

store:
  # Compose the URL from the env vars the CDK task def actually injects (DB_HOST,
  # DB_USER, DB_PASSWORD) — matches gateway.yaml.template. The CDK task def never
  # sets GATEWAY_POSTGRES_URL, so referencing it here left the store unconfigured.
  postgres_url: postgres://\${DB_HOST}:5432/claude_gateway?sslmode=require
  username: \${DB_USER}
  password: \${DB_PASSWORD}

upstreams:
  - provider: bedrock
    region: ${BEDROCK_REGION}
    auth: {}

auto_include_builtin_models: true
EOF

aws s3 cp /tmp/gw-buildspec.yml "s3://$BUCKET/buildspec.yml" --quiet
aws s3 cp /tmp/gw-Dockerfile "s3://$BUCKET/Dockerfile" --quiet
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
echo "Step 4/5: Pass 2 — deploying the full stack (CDK)..."
npx cdk deploy --require-approval never -c imageReady=true "${CDK_CTX[@]}"
echo "✅ Full stack deployed"
echo ""

# --- Step 5: Verify ---
echo "Step 5/5: Verifying the gateway..."
RESPONSE=$(curl -s "https://${GATEWAY_HOSTNAME}/.well-known/oauth-authorization-server" 2>/dev/null || echo "")
if echo "$RESPONSE" | grep -q "device_authorization_endpoint"; then
  echo "✅ Gateway is live at https://${GATEWAY_HOSTNAME}"
else
  echo "⚠️  Gateway may still be starting (or unreachable without VPN). Check with:"
  echo "   curl https://${GATEWAY_HOSTNAME}/.well-known/oauth-authorization-server"
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
