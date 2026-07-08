#!/usr/bin/env bash
# Wire this Mac to the gateway (CLI) and bootstrap (Claude Desktop). Run after the VPN is
# up and DNS resolves the private hostnames. Requires sudo for the managed-settings file.
# Reads the gateway host + Entra IDs from deployment.config.json at the repo root.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CFG="$ROOT/deployment.config.json"
[ -f "$CFG" ] || { echo "Missing $CFG (copy deployment.config.example.json first)"; exit 1; }

GW_HOST=$(python3 -c "import json;print(json.load(open('$CFG'))['gatewayHost'])")
TENANT=$(python3 -c "import json;print(json.load(open('$CFG'))['entraTenantId'])")
DESKTOP_APP=$(python3 -c "import json;print(json.load(open('$CFG'))['desktopClientId'])")
MANAGED_DIR="/Library/Application Support/ClaudeCode"

echo "=== 1. claude CLI managed settings (forces gateway login) ==="
sudo mkdir -p "$MANAGED_DIR"
sudo tee "$MANAGED_DIR/managed-settings.json" >/dev/null <<EOF
{
  "forceLoginMethod": "gateway",
  "forceLoginGatewayUrl": "https://$GW_HOST"
}
EOF
echo "Wrote $MANAGED_DIR/managed-settings.json"

echo
echo "=== 2. Claude Desktop bootstrap import file (PKCE mode) ==="
OUT="$HOME/claude-bootstrap-import.json"
cat > "$OUT" <<EOF
{
  "bootstrapUrl": "https://$GW_HOST/user/bootstrap",
  "bootstrapOidc": {
    "clientId": "$DESKTOP_APP",
    "issuer": "https://login.microsoftonline.com/$TENANT/v2.0",
    "scopes": "openid offline_access $DESKTOP_APP/.default",
    "redirectPort": 8990
  }
}
EOF
echo "Wrote $OUT"
echo "In Claude Desktop: Settings -> Developer -> Configure third-party inference -> Import -> $OUT"

echo
echo "=== 3. Trust the ALB certificate (only if using a private CA) ==="
echo "  sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain ./pki/ca.crt"
echo "  (Skip if the ALB uses a public ACM certificate.)"
