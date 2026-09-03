#!/usr/bin/env bash
# Bulk-dismiss open Dependabot alerts as tolerable risk.
#
# The samples in this repo are point-in-time examples with dependencies pinned
# at publication (see README "Dependencies and security"). Alerts that need a
# major-version upgrade of a sample are dismissed rather than fixed. Run this
# quarterly after glancing at any critical alerts.
#
# Usage:
#   scripts/dismiss-dependabot-alerts.sh                 # dry run, lists what would be dismissed
#   scripts/dismiss-dependabot-alerts.sh --apply         # dismiss
#   EXCLUDE='claude-apps-gateway' scripts/dismiss-dependabot-alerts.sh --apply
#
# EXCLUDE is an extended regex matched against the alert's manifest path; alerts
# whose manifest matches are left open (use it for samples under active
# development where you want to fix rather than dismiss).
#
# Requires: gh (authenticated with security_events scope), jq.
set -euo pipefail

REPO="${REPO:-aws-samples/anthropic-on-aws}"
EXCLUDE="${EXCLUDE:-}"
REASON="${REASON:-tolerable_risk}"
COMMENT="${COMMENT:-Sample code with dependencies pinned at publication; refresh before deploying. See README: Dependencies and security.}"
APPLY=0
[[ "${1:-}" == "--apply" ]] && APPLY=1

alerts=$(gh api --paginate "repos/$REPO/dependabot/alerts?state=open&per_page=100" \
  | jq -c '.[] | {n: .number, sev: .security_advisory.severity, pkg: .dependency.package.name, path: .dependency.manifest_path}')

if [[ -n "$EXCLUDE" ]]; then
  alerts=$(printf '%s\n' "$alerts" | jq -c --arg re "$EXCLUDE" 'select(.path | test($re) | not)')
fi

count=$(printf '%s\n' "$alerts" | grep -c . || true)
echo "$count open alert(s) selected (repo=$REPO exclude='${EXCLUDE:-none}')"
printf '%s\n' "$alerts" | jq -r '"  #\(.n)\t\(.sev)\t\(.pkg)\t\(.path)"'

if [[ $APPLY -eq 0 ]]; then
  echo
  echo "Dry run. Re-run with --apply to dismiss these as '$REASON'."
  exit 0
fi

printf '%s\n' "$alerts" | jq -r '.n' | while read -r n; do
  gh api -X PATCH "repos/$REPO/dependabot/alerts/$n" \
    -f state=dismissed -f dismissed_reason="$REASON" -f dismissed_comment="$COMMENT" \
    --silent && echo "dismissed #$n"
done
