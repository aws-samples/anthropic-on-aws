#!/bin/bash
# Claude Gateway — Quick Local Test Script
# Tests the gateway without deploying to AWS.
# Requires: PostgreSQL running locally, gateway binary available.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== Claude Gateway Local Test ==="
echo ""

# Check prerequisites
echo "Checking prerequisites..."

# 1. Gateway binary
GATEWAY_BIN="${GATEWAY_BIN:-$(which claude 2>/dev/null)}"
if [ -z "$GATEWAY_BIN" ]; then
  echo "❌ claude binary not found. Set GATEWAY_BIN or add to PATH."
  exit 1
fi

if ! "$GATEWAY_BIN" gateway --help >/dev/null 2>&1; then
  echo "❌ $GATEWAY_BIN does not support 'gateway' subcommand."
  exit 1
fi
echo "✅ Gateway binary: $GATEWAY_BIN ($("$GATEWAY_BIN" --version))"

# 2. PostgreSQL
if ! command -v pg_isready >/dev/null 2>&1; then
  echo "❌ PostgreSQL not found. Install with: brew install postgresql@16 && brew services start postgresql@16"
  exit 1
fi

if ! pg_isready -q 2>/dev/null; then
  echo "❌ PostgreSQL not running. Start with: brew services start postgresql@16"
  exit 1
fi
echo "✅ PostgreSQL running"

# 3. Create test database if needed
DB_NAME="claude_gateway_test"
if ! psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
  createdb "$DB_NAME" 2>/dev/null || true
fi
echo "✅ Database: $DB_NAME"

# 4. Load .env if present
if [ -f "$PROJECT_DIR/.env" ]; then
  source "$PROJECT_DIR/.env"
  echo "✅ Loaded .env"
else
  echo "⚠️  No .env file found — using defaults"
  OIDC_ISSUER="${OIDC_ISSUER:-https://accounts.google.com}"
  OIDC_CLIENT_ID="${OIDC_CLIENT_ID:-test-client-id}"
  OIDC_CLIENT_SECRET="${OIDC_CLIENT_SECRET:-test-client-secret-at-least-32-chars}"
fi

# 5. Write temporary gateway config
TMPDIR=$(mktemp -d)
trap "rm -rf $TMPDIR" EXIT

cat > "$TMPDIR/gateway.yaml" <<EOF
listen:
  host: 0.0.0.0
  port: 8080
  public_url: https://localhost:8080

oidc:
  issuer: ${OIDC_ISSUER}
  client_id: ${OIDC_CLIENT_ID}
  client_secret: ${OIDC_CLIENT_SECRET}
  allowed_email_domains: [gmail.com, auth0.com]
  userinfo_fallback: true

session:
  jwt_secret: dGVzdC1zZWNyZXQtdGhhdC1pcy1hdC1sZWFzdC0zMi1ieXRlcw==
  ttl_hours: 1

store:
  postgres_url: postgres://${USER}@localhost:5432/${DB_NAME}

upstreams:
  - provider: bedrock
    region: ${BEDROCK_REGION:-us-east-1}
    auth: {}

auto_include_builtin_models: true
EOF

echo "✅ Config written"
echo ""

# 6. Start the gateway
echo "Starting gateway..."
"$GATEWAY_BIN" gateway --config "$TMPDIR/gateway.yaml" &
GW_PID=$!
sleep 3

# 7. Verify
echo ""
echo "=== Verification ==="

# Check 1: Discovery
echo -n "Discovery document... "
if curl -sf http://localhost:8080/.well-known/oauth-authorization-server > /dev/null 2>&1; then
  echo "✅ PASS"
else
  echo "❌ FAIL"
  kill $GW_PID 2>/dev/null
  exit 1
fi

# Check 2: Device authorization
echo -n "Device authorization... "
DEVICE_RESP=$(curl -sf -X POST http://localhost:8080/oauth/device_authorization 2>/dev/null)
if echo "$DEVICE_RESP" | python3 -c "import json,sys; d=json.load(sys.stdin); assert 'user_code' in d" 2>/dev/null; then
  USER_CODE=$(echo "$DEVICE_RESP" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['user_code'])")
  echo "✅ PASS (code: $USER_CODE)"
else
  echo "❌ FAIL"
  kill $GW_PID 2>/dev/null
  exit 1
fi

echo ""
echo "=== All checks passed! ==="
echo ""
echo "Gateway running at http://localhost:8080"
echo "Verification URL: http://localhost:8080/device?user_code=$USER_CODE"
echo ""
echo "Press Ctrl+C to stop."

wait $GW_PID
