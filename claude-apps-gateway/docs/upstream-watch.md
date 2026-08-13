# Upstream watch — keeping across Claude apps gateway changes

This example pins one Claude Code version (`CLAUDE_VERSION` in [`setup.sh`](../cdk/scripts/setup.sh),
which drives both the binary download and the image tag). The gateway's config schema,
upstream behaviour, and managed-settings keys are all **bundled in that pinned version**,
so a new release can add a feature we can't use — or change behaviour we document —
until we bump. This is the pre-release ritual for spotting that drift.

Run it **before each version bump** and **when a gateway release ships**.

## Current pin

- **Pinned version:** `2.1.229` (see `CLAUDE_VERSION` in `cdk/scripts/setup.sh` and `claudeVersion` in `cdk/bin/app.ts`)
- **Validated on:** `2.1.229` (live end-to-end: deploy + SSO sign-in + Bedrock inference on
  Claude Opus 5, plus the Claude Desktop overlay serving a Chat tab via `/user/bootstrap`)
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
exceeds our pin, we're behind on that feature. The ones we already track:

- `anthropicAws` (Claude Platform on AWS) provider — **requires ≥ 2.1.198**
- cross-upstream failover on `404` — **added in 2.1.198**
- complete-credentials validation on a partial Bedrock `auth:` block — **added in 2.1.207**
- Claude Desktop bootstrap endpoint (`/user/bootstrap`, the `desktop` policy key) — **requires ≥ 2.1.203**
- `desktop.chatTabEnabled` + `desktop.chatAdvancedFileAnalysisEnabled` — **require ≥ 2.1.227**
- `oidc.use_proxy` (gateway's own IdP requests through `HTTPS_PROXY`) — **requires ≥ 2.1.227**
- `pricing:` block (contracted rates for the spend meter; also needs `admin:`) — **requires ≥ 2.1.227**
- `model must be a string` → `400` — **added in 2.1.221**; `model is required` → **2.1.228**

**The `desktop` block's key set is bounded by the pin, and the block is validated
strictly** — an unknown key fails gateway boot (crash-loops the container on ECS), so a
key copied from the docs page for a newer release takes the deployment down. As of
`2.1.229` the accepted keys are exactly: `modelDiscoveryEnabled`, `coworkTabEnabled`,
`isClaudeCodeForDesktopEnabled`, `chatTabEnabled`, `chatAdvancedFileAnalysisEnabled`,
`isDesktopExtensionEnabled`, `isDesktopExtensionSignatureRequired`, `isLocalDevMcpEnabled`,
`disableAutoUpdates`, `autoUpdaterEnforcementHours`, `banner`. Verify a new key against the
pinned binary before shipping it:

```bash
# boots and reports `Unrecognized key(s) in object: '<key>'` if the pin doesn't know it
claude gateway --config /tmp/probe.yaml
```

That probe is worth running against *two* binaries — the pin and the release below the
gate — because it fails fast and needs no AWS: it reaches the config-schema check before
touching Postgres, so `could not connect to Postgres` already means the schema passed.
Verified this way for the 2.1.227 gate: `2.1.226` exits with `Unrecognized key(s) in
object: 'chatTabEnabled', 'chatAdvancedFileAnalysisEnabled'` at
`managed.policies[0].desktop`, while `2.1.229` gets past `config.load`.

Closed gap: `chatTabEnabled` was missing from the gateway schema through 2.1.221, so a
bootstrap-configured Desktop lost its Chat tab with no way to re-enable it — filed as
[anthropics/claude-code#83723](https://github.com/anthropics/claude-code/issues/83723).
**2.1.227 added the key** (plus `chatAdvancedFileAnalysisEnabled`), and this example now
pins past it. The issue is still open upstream even though the fix shipped. Note the
default: Chat is *hidden* unless `chatTabEnabled: true`, so a `desktop` block that omits it
still costs Desktop users the tab — it's now a choice rather than a dead end. Confirmed
live on 2.1.229: with the `desktop` block enabled, Claude Desktop showed the Chat tab.

### 3. Re-check the facts this example is sensitive to

- **Managed-settings keys.** We ship a live `managed.policies[].cli` block and set
  `enforceAvailableModels: true` with `auto_include_builtin_models`. A model ID or a
  `cli` key newer than the pin fails **at gateway boot** or is rejected server-side
  at `/v1/messages`. Confirm every model in `availableModels` and every `cli` key is
  known to the pinned version. (See the README's Claude Code version prerequisite.)
- **Model IDs are two claims, not one.** A model can be current in Claude Code and still
  have no Bedrock inference profile under our `global.` prefix — the release notes don't
  tell you. Check the upstream side directly before shipping a catalog change:
  `aws bedrock list-inference-profiles --query "inferenceProfileSummaries[?contains(inferenceProfileId,'<model>')]"`,
  then one `aws bedrock-runtime converse --model-id global.anthropic.<model>` per entry.
  Done for the 2.1.229 catalog: `global.anthropic.claude-opus-5` is ACTIVE and all three
  shipped models return 200.
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
4. Only move the "Validated on" line above after a **live** run: deploy, browser SSO
   sign-in, and one inference call per model in `availableModels`. Static checks can't
   catch a model ID Bedrock doesn't serve or a schema key the pin rejects. The
   laptop-side probe (`/healthz`, `/readyz`, the discovery doc) needs a route to the
   private ALB — DNS alone isn't proof, since the hostname resolves publicly to its
   private addresses whether or not the VPN is up. Check the route, not `dig`.

## Automated reminder

Run check #1 by hand each cycle (the `curl | grep` above), or drop a small script in
a **git-ignored** `scripts/` directory and wire it to your own cron/CI — this repo
keeps such tooling local (`/scripts/` is in `.gitignore`) rather than shipping it.
A reference implementation that reads the pin from `cdk/scripts/setup.sh`, diffs the live
changelog, and exits non-zero when gateway-relevant entries appear above the pin can
live at `scripts/upstream-watch.sh`.
