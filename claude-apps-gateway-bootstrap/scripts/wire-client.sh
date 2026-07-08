#!/usr/bin/env bash
# Generate the Claude Desktop bootstrap import file for this add-on.
# (CLI gateway login is handled by the claude-apps-gateway sample's own docs;
# this script covers only the Desktop bootstrap keys.)
#
# Usage:
#   ./wire-client.sh <gateway-host> <entra-tenant-id> <desktop-client-id>
set -euo pipefail

GW_HOST="${1:?usage: wire-client.sh <gateway-host> <entra-tenant-id> <desktop-client-id>}"
TENANT="${2:?missing entra-tenant-id}"
DESKTOP_APP="${3:?missing desktop-client-id}"

OUT="$HOME/claude-bootstrap-import.json"
cat > "$OUT" <<JSON
{
  "bootstrapUrl": "https://$GW_HOST/user/bootstrap",
  "bootstrapOidc": {
    "clientId": "$DESKTOP_APP",
    "issuer": "https://login.microsoftonline.com/$TENANT/v2.0",
    "scopes": "openid offline_access $DESKTOP_APP/.default",
    "redirectPort": 8990
  }
}
JSON
echo "Wrote $OUT"
echo "Claude Desktop: Settings -> Developer -> Configure third-party inference -> Import -> $OUT"
