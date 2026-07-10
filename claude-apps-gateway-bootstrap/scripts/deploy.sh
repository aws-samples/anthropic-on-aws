#!/bin/bash
# Claude bootstrap add-on — full deploy script.
# Deploys the CDK stack, builds the container image on AWS CodeBuild (no local
# Docker needed), and starts the service. Same deployment pattern as the
# claude-apps-gateway sample's scripts/deploy.sh.
#
# Prerequisites:
#   1. A deployed ../claude-apps-gateway ClaudeGatewayStack (see README)
#   2. .env configured (cp .env.example .env) with that stack's outputs
#   3. AWS CLI configured; npm install already run in cdk/
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

: "${AWS_REGION:?set AWS_REGION in .env}"
: "${PUBLIC_URL:?set PUBLIC_URL in .env (ClaudeGatewayStack PublicUrl output)}"
: "${LISTENER_ARN:?set LISTENER_ARN in .env (see README prerequisites)}"
: "${ALB_SG_ID:?set ALB_SG_ID in .env}"
: "${VPC_ID:?set VPC_ID in .env}"
: "${ENTRA_TENANT_ID:?set ENTRA_TENANT_ID in .env}"
: "${DESKTOP_CLIENT_ID:?set DESKTOP_CLIENT_ID in .env}"

CTX=(-c "region=${AWS_REGION}" -c "publicUrl=${PUBLIC_URL}" -c "listenerArn=${LISTENER_ARN}"
     -c "albSgId=${ALB_SG_ID}" -c "vpcId=${VPC_ID}" -c "entraTenantId=${ENTRA_TENANT_ID}"
     -c "desktopClientId=${DESKTOP_CLIENT_ID}")
# Optional authorization gate (see README "Restricting who receives configuration").
[ -n "${REQUIRED_GROUPS:-}" ] && CTX+=(-c "requiredGroups=${REQUIRED_GROUPS}")
[ -n "${REQUIRED_ROLES:-}" ] && CTX+=(-c "requiredRoles=${REQUIRED_ROLES}")

echo "=== Claude bootstrap add-on deploy ==="
echo "Gateway: ${PUBLIC_URL}"
echo ""

# --- Step 1: ECR repository (CDK, repo-only pass) ---
echo "Step 1/4: Creating the ECR repository (CDK)..."
(cd cdk && npx cdk deploy ClaudeBootstrapStack --require-approval never \
  -c imageReady=false -c "region=${AWS_REGION}" >/dev/null)
ECR_URI=$(aws cloudformation describe-stacks --stack-name ClaudeBootstrapStack \
  --region "${AWS_REGION}" \
  --query "Stacks[0].Outputs[?OutputKey=='EcrRepositoryUri'].OutputValue" --output text)
REPO_NAME="${ECR_URI##*/}"
echo "   ECR: ${ECR_URI}"
echo ""

# --- Step 2: Build the image on CodeBuild (no local Docker) ---
echo "Step 2/4: Building the image on CodeBuild..."
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
BUCKET="claude-bootstrap-build-${ACCOUNT_ID}"
PROJECT="claude-bootstrap-build"

if [ "${AWS_REGION}" = "us-east-1" ]; then
  aws s3api create-bucket --bucket "$BUCKET" 2>/dev/null || true
else
  aws s3api create-bucket --bucket "$BUCKET" --region "${AWS_REGION}" \
    --create-bucket-configuration "LocationConstraint=${AWS_REGION}" 2>/dev/null || true
fi

if ! aws codebuild batch-get-projects --names "$PROJECT" --region "${AWS_REGION}" \
    --query "projects[0].name" --output text 2>/dev/null | grep -q "$PROJECT"; then
  echo "   Creating CodeBuild project..."
  aws iam create-role --role-name claude-bootstrap-codebuild \
    --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"codebuild.amazonaws.com"},"Action":"sts:AssumeRole"}]}' >/dev/null 2>&1 || true
  aws iam put-role-policy --role-name claude-bootstrap-codebuild --policy-name build-perms \
    --policy-document "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Action\":[\"s3:GetObject\",\"s3:GetObjectVersion\",\"s3:ListBucket\"],\"Resource\":[\"arn:aws:s3:::${BUCKET}\",\"arn:aws:s3:::${BUCKET}/*\"]},{\"Effect\":\"Allow\",\"Action\":\"ecr:GetAuthorizationToken\",\"Resource\":\"*\"},{\"Effect\":\"Allow\",\"Action\":[\"ecr:BatchCheckLayerAvailability\",\"ecr:GetDownloadUrlForLayer\",\"ecr:BatchGetImage\",\"ecr:PutImage\",\"ecr:InitiateLayerUpload\",\"ecr:UploadLayerPart\",\"ecr:CompleteLayerUpload\"],\"Resource\":\"arn:aws:ecr:${AWS_REGION}:${ACCOUNT_ID}:repository/${REPO_NAME}\"},{\"Effect\":\"Allow\",\"Action\":[\"logs:CreateLogGroup\",\"logs:CreateLogStream\",\"logs:PutLogEvents\"],\"Resource\":\"arn:aws:logs:${AWS_REGION}:${ACCOUNT_ID}:log-group:/aws/codebuild/${PROJECT}*\"}]}"
  sleep 10  # IAM propagation
  aws codebuild create-project --name "$PROJECT" --region "${AWS_REGION}" \
    --source "{\"type\":\"S3\",\"location\":\"${BUCKET}/source.zip\",\"buildspec\":\"buildspec.yml\"}" \
    --artifacts '{"type":"NO_ARTIFACTS"}' \
    --environment '{"type":"LINUX_CONTAINER","image":"aws/codebuild/standard:7.0","computeType":"BUILD_GENERAL1_SMALL","privilegedMode":true}' \
    --service-role "arn:aws:iam::${ACCOUNT_ID}:role/claude-bootstrap-codebuild" >/dev/null
else
  # The ECR repo name is stack-generated; keep the role's grant pointed at the current one.
  aws iam put-role-policy --role-name claude-bootstrap-codebuild --policy-name build-perms \
    --policy-document "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Action\":[\"s3:GetObject\",\"s3:GetObjectVersion\",\"s3:ListBucket\"],\"Resource\":[\"arn:aws:s3:::${BUCKET}\",\"arn:aws:s3:::${BUCKET}/*\"]},{\"Effect\":\"Allow\",\"Action\":\"ecr:GetAuthorizationToken\",\"Resource\":\"*\"},{\"Effect\":\"Allow\",\"Action\":[\"ecr:BatchCheckLayerAvailability\",\"ecr:GetDownloadUrlForLayer\",\"ecr:BatchGetImage\",\"ecr:PutImage\",\"ecr:InitiateLayerUpload\",\"ecr:UploadLayerPart\",\"ecr:CompleteLayerUpload\"],\"Resource\":\"arn:aws:ecr:${AWS_REGION}:${ACCOUNT_ID}:repository/${REPO_NAME}\"},{\"Effect\":\"Allow\",\"Action\":[\"logs:CreateLogGroup\",\"logs:CreateLogStream\",\"logs:PutLogEvents\"],\"Resource\":\"arn:aws:logs:${AWS_REGION}:${ACCOUNT_ID}:log-group:/aws/codebuild/${PROJECT}*\"}]}"
fi

# Stage the build context: the bootstrap/ sources plus a generated buildspec.
STAGE=$(mktemp -d)
cp -r bootstrap/* "$STAGE/"
cat > "$STAGE/buildspec.yml" <<EOF
version: 0.2
phases:
  pre_build:
    commands:
      - aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_URI}
  build:
    commands:
      - export DOCKER_BUILDKIT=1
      - docker build --platform linux/amd64 -t bootstrap:latest .
      - docker tag bootstrap:latest ${ECR_URI}:latest
  post_build:
    commands:
      - docker push ${ECR_URI}:latest
EOF
(cd "$STAGE" && zip -qr source.zip .)
aws s3 cp "$STAGE/source.zip" "s3://${BUCKET}/source.zip" --quiet
rm -rf "$STAGE"

echo "   Starting build..."
BUILD_ID=$(aws codebuild start-build --project-name "$PROJECT" --region "${AWS_REGION}" \
  --query "build.id" --output text)
echo "   Waiting for build to complete..."
while true; do
  STATUS=$(aws codebuild batch-get-builds --ids "$BUILD_ID" --region "${AWS_REGION}" \
    --query "builds[0].buildStatus" --output text)
  if [ "$STATUS" = "SUCCEEDED" ]; then
    echo "✅ Image built and pushed to ECR"
    break
  elif [ "$STATUS" = "FAILED" ] || [ "$STATUS" = "STOPPED" ] || [ "$STATUS" = "FAULT" ] || [ "$STATUS" = "TIMED_OUT" ]; then
    echo "❌ Build ${STATUS}. Logs: aws logs tail /aws/codebuild/${PROJECT} --region ${AWS_REGION}"
    exit 1
  fi
  sleep 10
done
echo ""

# --- Step 3: Deploy the service (CDK, full pass) ---
echo "Step 3/4: Deploying the service (CDK)..."
(cd cdk && npx cdk deploy ClaudeBootstrapStack --require-approval never "${CTX[@]}")
echo ""

# --- Step 4: Verify ---
echo "Step 4/4: Verifying..."
BOOTSTRAP_URL="${PUBLIC_URL}/user/bootstrap"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$BOOTSTRAP_URL" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "401" ]; then
  echo "✅ Bootstrap endpoint is live at ${BOOTSTRAP_URL} (401 without a token, as expected)"
else
  echo "⚠️  Endpoint returned HTTP ${HTTP_CODE}. If your network requires a VPN to reach the"
  echo "   gateway host, connect it and check:  curl -i ${BOOTSTRAP_URL}"
fi

echo ""
echo "=== Deploy complete ==="
echo ""
echo "Next steps:"
echo "  1. Publish your client configuration (README Step 3):"
echo "     aws s3 cp bootstrap-config.json s3://<ConfigBucketName output>/bootstrap-config.json"
echo "  2. Wire a client (README Step 4):"
echo "     ./scripts/wire-client.sh <gateway-host> ${ENTRA_TENANT_ID} ${DESKTOP_CLIENT_ID}"
echo ""
echo "  To tear down: npx cdk destroy (the build bucket/project are separate; see README)"
