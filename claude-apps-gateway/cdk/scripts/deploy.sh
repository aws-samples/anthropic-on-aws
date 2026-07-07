#!/bin/bash
# Claude Gateway — Full Deploy Script
# Deploys CDK stack, builds container image, and starts the service.
#
# Prerequisites:
#   1. .env file configured (cp .env.example .env)
#   2. linux-x64/claude binary available (from the gateway tarball)
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

# --- Step 1: CDK Deploy ---
echo "Step 1/4: Deploying infrastructure (CDK)..."
npx cdk deploy --require-approval never
echo "✅ Infrastructure deployed"
echo ""

# --- Step 2: Get outputs ---
echo "Step 2/4: Reading stack outputs..."
ECR_URI=$(aws cloudformation describe-stacks --stack-name ClaudeGatewayStack \
  --query "Stacks[0].Outputs[?OutputKey=='EcrRepositoryUri'].OutputValue" --output text)
echo "   ECR: $ECR_URI"
echo ""

# --- Step 3: Build and push image ---
echo "Step 3/4: Building and pushing gateway image..."

# Check if CodeBuild project exists, create if not
if ! aws codebuild batch-get-projects --names claude-gateway-build --query "projects[0].name" --output text 2>/dev/null | grep -q claude-gateway-build; then
  echo "   Creating CodeBuild project..."

  # Create IAM role for CodeBuild
  aws iam create-role --role-name claude-gateway-codebuild \
    --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"codebuild.amazonaws.com"},"Action":"sts:AssumeRole"}]}' 2>/dev/null || true

  ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

  aws iam put-role-policy --role-name claude-gateway-codebuild --policy-name build-perms \
    --policy-document "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Action\":[\"s3:GetObject\",\"s3:ListBucket\"],\"Resource\":[\"arn:aws:s3:::claude-gateway-build-${ACCOUNT_ID}\",\"arn:aws:s3:::claude-gateway-build-${ACCOUNT_ID}/*\"]},{\"Effect\":\"Allow\",\"Action\":[\"ecr:GetAuthorizationToken\"],\"Resource\":\"*\"},{\"Effect\":\"Allow\",\"Action\":[\"ecr:BatchCheckLayerAvailability\",\"ecr:GetDownloadUrlForLayer\",\"ecr:BatchGetImage\",\"ecr:PutImage\",\"ecr:InitiateLayerUpload\",\"ecr:UploadLayerPart\",\"ecr:CompleteLayerUpload\"],\"Resource\":\"arn:aws:ecr:${BEDROCK_REGION}:${ACCOUNT_ID}:repository/${GATEWAY_NAME}\"},{ \"Effect\":\"Allow\",\"Action\":[\"logs:CreateLogGroup\",\"logs:CreateLogStream\",\"logs:PutLogEvents\"],\"Resource\":\"*\"}]}" 2>/dev/null

  sleep 10  # Wait for IAM propagation

  aws codebuild create-project --name claude-gateway-build \
    --source "{\"type\":\"S3\",\"location\":\"claude-gateway-build-${ACCOUNT_ID}/\",\"buildspec\":\"buildspec.yml\"}" \
    --artifacts '{"type":"NO_ARTIFACTS"}' \
    --environment '{"type":"LINUX_CONTAINER","image":"aws/codebuild/standard:7.0","computeType":"BUILD_GENERAL1_SMALL","privilegedMode":true}' \
    --service-role "arn:aws:iam::${ACCOUNT_ID}:role/claude-gateway-codebuild" >/dev/null
fi

# Upload build artifacts to S3
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
BUCKET="claude-gateway-build-${ACCOUNT_ID}"
aws s3 mb "s3://$BUCKET" 2>/dev/null || true

# Find the linux binary
LINUX_BINARY=""
if [ -f "../linux-x64/claude" ]; then
  LINUX_BINARY="../linux-x64/claude"
elif [ -f "./linux-x64/claude" ]; then
  LINUX_BINARY="./linux-x64/claude"
else
  echo "❌ linux-x64/claude binary not found. Extract it from the gateway tarball."
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
      - docker build -t ${GATEWAY_NAME} .
      - docker tag ${GATEWAY_NAME}:latest ${ECR_URI}:latest
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
  postgres_url: \${GATEWAY_POSTGRES_URL}
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

# --- Step 4: Start the service ---
echo "Step 4/4: Starting ECS service..."
aws ecs update-service --cluster "$GATEWAY_NAME" --service "${GATEWAY_NAME}-svc" \
  --desired-count 1 --force-new-deployment --query "service.desiredCount" --output text >/dev/null

echo "   Waiting for service to stabilize..."
sleep 60

# Verify
RESPONSE=$(curl -s "https://${GATEWAY_HOSTNAME}/.well-known/oauth-authorization-server" 2>/dev/null || echo "")
if echo "$RESPONSE" | grep -q "device_authorization_endpoint"; then
  echo "✅ Gateway is live at https://${GATEWAY_HOSTNAME}"
else
  echo "⚠️  Gateway may still be starting. Check in a minute with:"
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
