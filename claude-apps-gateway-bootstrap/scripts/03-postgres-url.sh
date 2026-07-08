#!/usr/bin/env bash
# Build the gateway's GATEWAY_POSTGRES_URL secret from the RDS master credential secret
# that CDK generated. Run AFTER `cdk deploy ClaudeGw-Data`.
set -euo pipefail
export AWS_PROFILE=${AWS_PROFILE:-default}
export AWS_REGION=${AWS_REGION:-ap-southeast-2}

MASTER=$(aws secretsmanager get-secret-value --secret-id claude-gateway/rds-master \
  --query SecretString --output text)
HOST=$(echo "$MASTER" | python3 -c "import json,sys;print(json.load(sys.stdin)['host'])")
PORT=$(echo "$MASTER" | python3 -c "import json,sys;print(json.load(sys.stdin).get('port',5432))")
USER=$(echo "$MASTER" | python3 -c "import json,sys;print(json.load(sys.stdin)['username'])")
PASS=$(echo "$MASTER" | python3 -c "import json,sys,urllib.parse;print(urllib.parse.quote(json.load(sys.stdin)['password']))")

URL="postgresql://${USER}:${PASS}@${HOST}:${PORT}/gateway?sslmode=require"

aws secretsmanager create-secret --name claude-gateway/postgres-url --secret-string "$URL" 2>/dev/null \
  || aws secretsmanager put-secret-value --secret-id claude-gateway/postgres-url --secret-string "$URL"

echo "claude-gateway/postgres-url set (host=$HOST)."
