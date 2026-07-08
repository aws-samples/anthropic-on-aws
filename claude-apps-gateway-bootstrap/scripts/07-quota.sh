#!/usr/bin/env bash
# Manage per-user spend quotas on the Claude apps gateway (requires VPN).
#
# The gateway meters every /v1/messages response (token counts priced at USD list
# price) into per-user daily/weekly/monthly counters in Postgres, and blocks with
# 429 billing_error once a cap is exceeded. Caps are set via the gateway's Admin
# API (mirrors Anthropic's Admin API), authenticated with the write key stored in
# Secrets Manager (claude-gateway/admin-write-key).
#
# Usage:
#   scripts/07-quota.sh list                          # configured caps
#   scripts/07-quota.sh spend                         # per-user spend to date
#   scripts/07-quota.sh set <sub> <usd> [period]      # e.g. set J8Qt... 10 daily
#   scripts/07-quota.sh set-org <usd> [period]        # org-wide default cap
#   scripts/07-quota.sh block <sub>                   # zero cap = block now
#   scripts/07-quota.sh delete <spl_id>               # remove a cap
#   scripts/07-quota.sh audit                         # who changed which cap
#
# <sub> is the user's OIDC subject; find it in the gateway audit log
# (session.mint events) or in `spend` output rows.
set -euo pipefail
export AWS_PROFILE=${AWS_PROFILE:-default}
export AWS_REGION=${AWS_REGION_OVERRIDE:-ap-southeast-2}
REPO_ROOT=$(cd "$(dirname "$0")/.." && pwd)

# Gateway origin comes from the gitignored deployment.config.json at the repo root.
GW="https://$(python3 -c "import json,os; print(json.load(open(os.path.join('$REPO_ROOT','deployment.config.json')))['gatewayHost'])")"
BASE="$GW/v1/organizations/spend_limits"
KEY=$(aws secretsmanager get-secret-value --secret-id claude-gateway/admin-write-key \
  --query SecretString --output text)

api() { curl -sS -m 15 -H "x-api-key: $KEY" -H "Content-Type: application/json" "$@"; }

usd_to_cents() { python3 -c "print(int(round(float('$1') * 100)))"; }

case "${1:-}" in
  list)   api "$BASE" | python3 -m json.tool ;;
  spend)  api "$BASE/effective" | python3 -c '
import json,sys
# API convention (mirrors Anthropic Admin API): amount AND period_to_date_spend are USD CENTS.
for r in json.load(sys.stdin)["data"]:
    a = r["actor"] or {}
    cap = r["amount"]; cap = "unlimited" if cap is None else f"${int(cap)/100:.2f}"
    print(f'"'"'{r["period"]:8} {a.get("email_address") or r["scope"]["user_id"]:45} '"'"'
          f'"'"'spent ${float(r["period_to_date_spend"])/100:.4f} / cap {cap}'"'"')' ;;
  set)    api "$BASE" -d "{\"scope\":{\"type\":\"user\",\"user_id\":\"$2\"},\"amount\":\"$(usd_to_cents "$3")\",\"period\":\"${4:-daily}\"}" | python3 -m json.tool ;;
  set-org) api "$BASE" -d "{\"scope\":{\"type\":\"organization\"},\"amount\":\"$(usd_to_cents "$2")\",\"period\":\"${3:-monthly}\"}" | python3 -m json.tool ;;
  block)  api "$BASE" -d "{\"scope\":{\"type\":\"user\",\"user_id\":\"$2\"},\"amount\":\"0\",\"period\":\"daily\"}" | python3 -m json.tool ;;
  delete) api -X DELETE "$BASE/$2" ;;
  audit)  api "$BASE/audit" | python3 -m json.tool ;;
  *) grep '^#   scripts' "$0" | sed 's/^# *//'; exit 1 ;;
esac
