#!/usr/bin/env bash
# Create the Secrets Manager entries the stacks reference. Run once, before deploying
# GatewayStack/BootstrapStack. Values live only in Secrets Manager, never in source.
set -euo pipefail
export AWS_PROFILE=${AWS_PROFILE:-default}
export AWS_REGION=${AWS_REGION:-ap-southeast-2}

echo "Creating secrets in $AWS_REGION (profile $AWS_PROFILE)..."

# 1) Gateway JWT signing secret (bearer tokens the gateway mints).
aws secretsmanager create-secret --name claude-gateway/jwt-secret \
  --secret-string "$(openssl rand -base64 32)" 2>/dev/null \
  || echo "  claude-gateway/jwt-secret already exists (skipping)"

# 2) Bootstrap server token signing key.
aws secretsmanager create-secret --name claude-bootstrap/signing-key \
  --secret-string "$(openssl rand -base64 32)" 2>/dev/null \
  || echo "  claude-bootstrap/signing-key already exists (skipping)"

# 3) Entra client secret — already created for the dedicated app "Claude Gateway + Bootstrap"
#    (your gateway app registration) and stored at claude-gateway/entra-client-secret.
#    To rotate: az ad app credential reset --id <appId> --append, then put-secret-value.

echo
echo "NOTE: claude-gateway/postgres-url is created by 03-postgres-url.sh AFTER RDS exists,"
echo "      because it needs the RDS endpoint + generated master password."
