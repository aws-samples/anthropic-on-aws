#!/usr/bin/env bash
# Build + push the gateway and bootstrap images ON THE PRIVATE EC2 BUILDER via SSM.
# No Docker runs on the local Mac. Source is shipped to the builder over SSM/S3.
#
# Prereqs: `cdk deploy ClaudeGw-Data` done (builder + ECR exist); builder registered in SSM.
set -euo pipefail
export AWS_PROFILE=${AWS_PROFILE:-default}
export AWS_REGION=${AWS_REGION:-ap-southeast-2}

ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
REGISTRY="${ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com"
TAG=${TAG:-latest}
REPO_ROOT=$(cd "$(dirname "$0")/.." && pwd)

BUILDER_ID=$(aws cloudformation describe-stacks --stack-name ClaudeGw-Data \
  --query "Stacks[0].Outputs[?OutputKey=='BuilderInstanceId'].OutputValue" --output text)
echo "Builder: $BUILDER_ID"

# Ship source to the builder via an S3 staging bucket (SSM has no file push).
STAGING="claude-gw-build-${ACCOUNT}"
aws s3 mb "s3://${STAGING}" 2>/dev/null || true
tar -czf /tmp/gateway-src.tgz -C "$REPO_ROOT" gateway
tar -czf /tmp/bootstrap-src.tgz -C "$REPO_ROOT" bootstrap
aws s3 cp /tmp/gateway-src.tgz "s3://${STAGING}/gateway-src.tgz"
aws s3 cp /tmp/bootstrap-src.tgz "s3://${STAGING}/bootstrap-src.tgz"

# Build the SSM parameters as a proper JSON array of command LINES. Do NOT pass a single
# multi-line heredoc string — SSM collapses newlines, which mangles `set -eux` and pipes.
PARAMS=$(python3 - "$REGISTRY" "$AWS_REGION" "$STAGING" "$TAG" <<'PY'
import json, sys
reg, region, staging, tag = sys.argv[1:5]
cmds = [
  "set -eux",
  f"aws ecr get-login-password --region {region} | docker login --username AWS --password-stdin {reg}",
  "cd /tmp && rm -rf build && mkdir build && cd build",
  f"aws s3 cp s3://{staging}/gateway-src.tgz . && tar -xzf gateway-src.tgz",
  f"aws s3 cp s3://{staging}/bootstrap-src.tgz . && tar -xzf bootstrap-src.tgz",
  f"docker build -t {reg}/claude-gateway:{tag} gateway",
  f"docker push {reg}/claude-gateway:{tag}",
  f"docker build -t {reg}/claude-bootstrap:{tag} bootstrap",
  f"docker push {reg}/claude-bootstrap:{tag}",
]
print(json.dumps({"commands": cmds}))
PY
)

CMD_ID=$(aws ssm send-command --instance-ids "$BUILDER_ID" \
  --document-name "AWS-RunShellScript" \
  --comment "build+push claude gateway/bootstrap images" \
  --parameters "$PARAMS" \
  --query "Command.CommandId" --output text)
echo "SSM command: $CMD_ID — tailing..."
aws ssm wait command-executed --command-id "$CMD_ID" --instance-id "$BUILDER_ID" || true
aws ssm get-command-invocation --command-id "$CMD_ID" --instance-id "$BUILDER_ID" \
  --query "{Status:Status,Out:StandardOutputContent,Err:StandardErrorContent}" --output json
