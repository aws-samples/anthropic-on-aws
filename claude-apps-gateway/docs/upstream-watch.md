# Upstream watch — keeping across Claude apps gateway changes

This example pins one Claude Code version (`CLAUDE_VERSION` in [`setup.sh`](../cdk/scripts/setup.sh),
which drives both the binary download and the image tag). The gateway's config schema,
upstream behaviour, and managed-settings keys are all **bundled in that pinned version**,
so a new release can add a feature we can't use — or change behaviour we document —
until we bump. This is the pre-release ritual for spotting that drift.

Run it **before each version bump** and **when a gateway release ships**.

## Current pin

- **Pinned version:** `2.1.199` (see `CLAUDE_VERSION` in `cdk/scripts/setup.sh` and `claudeVersion` in `cdk/bin/app.ts`)
- **Validated on:** `2.1.199`
- **Floor:** `2.1.195` (the `gateway` subcommand floor)

Update the "Pinned version" line here whenever `CLAUDE_VERSION` changes.

## Sources of truth

| What | Where |
|---|---|
| Binary changelog | `https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md` |
| Config reference (every `gateway.yaml` key) | https://code.claude.com/docs/en/claude-apps-gateway-config |
| Deployment & operations | https://code.claude.com/docs/en/claude-apps-gateway-deploy |
| Overview / quickstart | https://code.claude.com/docs/en/claude-apps-gateway |
| Docs index (discover new pages) | https://code.claude.com/docs/llms.txt |

## The checks

### 1. Diff the changelog since our pin

Gateway-relevant entries are namespaced with a `Gateway:` prefix; upstream/auth
changes mention `bedrock`, `anthropicAws`, `vertex`, `foundry`, `upstream`, `OIDC`,
`failover`, `telemetry`, or `managed`. Skim every version **above** the current pin:

```bash
curl -fsSL https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md \
  | grep -iE 'gateway|bedrock|anthropicAws|upstream|oidc|failover|telemetry|managed|vertex|foundry'
```

### 2. Look for version tripwires in the docs

Any doc phrase like *"requires v2.1.X or later"* or *"as of vN"* is a gate. If X
exceeds our pin, we're behind on that feature. Two known ones we already track:

- `anthropicAws` (Claude Platform on AWS) provider — **requires ≥ 2.1.198**
- cross-upstream failover on `404` — **added in 2.1.198**

### 3. Re-check the two facts this example is sensitive to

- **Managed-settings keys.** We ship a live `managed.policies[].cli` block and set
  `enforceAvailableModels: true` with `auto_include_builtin_models`. A model ID or a
  `cli` key newer than the pin fails **at gateway boot** or is rejected server-side
  at `/v1/messages`. Confirm every model in `availableModels` and every `cli` key is
  known to the pinned version. (See the README's Claude Code version prerequisite.)
- **Bedrock IAM ARN families.** The two-ARN grant (`inference-profile/global.anthropic.*`
  **and** `foundation-model/anthropic.*`) is asserted in the CDK tests. If the docs'
  IAM table changes, update the policy and the test.

## If a change matters

1. Bump `CLAUDE_VERSION` in `cdk/scripts/setup.sh`, `claudeVersion` in `cdk/bin/app.ts`,
   and the "Current pin" line above.
2. Reconcile the docs it touches: `gateway.yaml.template` **and** `gateway.yaml.example`
   (keep them in sync — the example is a stamped copy of the template), plus the
   README's version notes.
3. Re-run the local verification (`cd cdk && npm test`; `./test/stamp-config.test.sh`;
   `bash -n cdk/scripts/setup.sh`) and add a test case if you're fixing a deployment trap.

## Automated reminder

Run check #1 by hand each cycle (the `curl | grep` above), or drop a small script in
a **git-ignored** `scripts/` directory and wire it to your own cron/CI — this repo
keeps such tooling local (`/scripts/` is in `.gitignore`) rather than shipping it.
A reference implementation that reads the pin from `cdk/scripts/setup.sh`, diffs the live
changelog, and exits non-zero when gateway-relevant entries appear above the pin can
live at `scripts/upstream-watch.sh`.
