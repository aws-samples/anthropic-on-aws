#!/usr/bin/env bash
# Install organization plugins/skills via the FILESYSTEM delivery path.
#
# In PKCE bootstrap mode, network delivery (organizationPluginsUrl) is unavailable — Claude
# Desktop reads org plugins from a system-wide directory it treats as admin-provisioned:
#
#   macOS:   /Library/Application Support/Claude/org-plugins/
#   Windows: C:\Program Files\Claude\org-plugins\
#
# Each subdirectory is one plugin and MUST contain .claude-plugin/plugin.json (dirs without it
# are ignored). A change to version.json triggers re-sync on the next app launch. On a fleet,
# ship this directory via the same MDM / software-distribution channel used for the app itself;
# this script is the single-machine / reference equivalent.
#
# Usage:  sudo bash scripts/06-install-org-plugins.sh
set -euo pipefail

REPO_ROOT=$(cd "$(dirname "$0")/.." && pwd)
SRC="${REPO_ROOT}/bootstrap/org-plugins"
DEST="/Library/Application Support/Claude/org-plugins"

if [ "$(uname)" != "Darwin" ]; then
  echo "This script targets macOS. On Windows use C:\\Program Files\\Claude\\org-plugins\\." >&2
  exit 1
fi
if [ ! -d "$SRC" ]; then echo "source not found: $SRC" >&2; exit 1; fi
if [ "$(id -u)" -ne 0 ]; then
  echo "Run with sudo (writes under /Library/Application Support):" >&2
  echo "  sudo bash scripts/06-install-org-plugins.sh" >&2
  exit 1
fi

echo "Installing org plugins -> $DEST"
mkdir -p "$DEST"

count=0; skipped=0
for d in "$SRC"/*/; do
  name=$(basename "$d")
  if [ ! -f "$d/.claude-plugin/plugin.json" ]; then
    echo "  skip (no .claude-plugin/plugin.json): $name"; skipped=$((skipped+1)); continue
  fi
  # rsync keeps the dest in sync (adds/updates/removes) so version bumps propagate cleanly.
  rsync -a --delete "$d" "$DEST/$name/"
  echo "  installed: $name"; count=$((count+1))
done

echo "Done: $count installed, $skipped skipped."
echo "Relaunch Claude Desktop; it re-syncs plugins whose version.json changed."
