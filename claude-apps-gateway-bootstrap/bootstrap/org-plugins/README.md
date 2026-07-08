# Organization plugins (filesystem delivery)

Each subdirectory is one plugin (`.claude-plugin/plugin.json` required) delivered to
Claude Desktop via `/Library/Application Support/Claude/org-plugins/` — see
`scripts/06-install-org-plugins.sh` and AS-BUILT §6.

This sample ships ONE original example plugin, **spend-admin** (the `spend-report`
skill that renders the usage/quota report as a chart artifact — AS-BUILT §7.1b).
Add your own plugins alongside it; the Anthropic knowledge-work catalog and partner
plugins can be obtained from their respective sources and dropped in here (they are
intentionally not redistributed with this sample).
