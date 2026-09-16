# Upstream watch — keeping across Claude apps gateway changes

This example pins one Claude Code version (`CLAUDE_VERSION` in [`setup.sh`](../cdk/scripts/setup.sh),
which drives both the binary download and the image tag). The gateway's config schema,
upstream behaviour, and managed-settings keys are all **bundled in that pinned version**,
so a new release can add a feature we can't use — or change behaviour we document —
until we bump. This is the pre-release ritual for spotting that drift.

Run it **before each version bump** and **when a gateway release ships**.

## Current pin

- **Pinned version:** `2.1.272` (see `CLAUDE_VERSION` in `cdk/scripts/setup.sh` and `claudeVersion` in `cdk/bin/app.ts`)
- **Validated on:** `2.1.272` (live end-to-end: in-place image swap on the running Fargate
  service, clean boot on both replicas, browser SSO sign-in, and one Bedrock inference call
  per model in `availableModels` — `claude-opus-5`, `claude-sonnet-5`, `claude-haiku-4-5`,
  all `200` with a matching `inference` event. `/user/bootstrap` returns `401` rather than
  `404`, so the Desktop opt-in still mounts on this pin; the Chat tab itself was last
  eyeballed in Desktop on 2.1.229)
- **Floor:** `2.1.195` (the `gateway` subcommand floor)

Update the "Pinned version" line here whenever `CLAUDE_VERSION` changes.

Things the 2.1.251 and 2.1.272 validation runs turned up that are worth knowing before you
hand-test:

- `--model claude-haiku-4-5` silently ran on the session default instead (the gateway logged
  `model:"claude-opus-5"`). The short `--model haiku` alias resolved correctly. Read the
  gateway's own `inference` event to confirm which model actually served a request — the
  CLI's fallback is silent. Driving `/v1/messages` directly with a bearer token sidesteps the
  aliasing entirely, and is the stronger per-model check.
- With more than one replica, each task writes its **own** log stream. Tailing one stream and
  concluding a request never arrived is a false negative; check every `gateway/web/*` stream
  for the service.
- **`client_ip` in the audit events is the load balancer, not the developer.** On 2.1.272 the
  `session.mint` event recorded `client_ip: 10.20.10.165` — an ALB ENI — while the signing-in
  laptop was on the VPN at `10.200.0.130`. The boot log says why: `client IPs: TCP peer
  address (listen.trusted_proxies empty)`. Anything keyed on client IP (per-IP sign-in rate
  limits, `access_control.allow_cidrs`, audit attribution) therefore sees one address for the
  whole fleet until `listen.trusted_proxies` names the ALB subnets. Set that **first** if you
  add an access list, or the list will pass everything.
- `POST /oauth/token` accepts **form encoding only**; a JSON body returns
  `{"error":"invalid_request"}`, which reads like a broken sign-in rather than a wrong
  content type. Only matters if you script the device flow by hand instead of using the CLI.
- A client hanging up mid-stream does **not** show up as a failure: the `inference` event
  still logs `status: 200`. That also means the 2.1.260 aborted-request `CountTokens` path
  can't be forced with a `curl --max-time` abort — it never triggered across four attempts.

## Sources of truth

| What | Where |
|---|---|
| Binary changelog | `https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md` |
| Config reference (every `gateway.yaml` key) | https://code.claude.com/docs/en/claude-apps-gateway-config |
| Deployment & operations | https://code.claude.com/docs/en/claude-apps-gateway-deploy |
| Overview / quickstart | https://code.claude.com/docs/en/claude-apps-gateway |
| Spend limits + Admin API | https://code.claude.com/docs/en/claude-apps-gateway-spend-limits |
| Docs index (discover new pages) | https://code.claude.com/docs/llms.txt |

Every page here fetches as plain markdown by appending `.md` to the URL, which makes the
check-2 tripwire grep below cheap. Sweep **all** of them: the spend-limits page carries
version gates the other three don't.

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
- `desktop` block validated against Claude Desktop's own full schema, plus
  `desktop.disabledBuiltinTools` / `coworkEgressAllowedHosts` / `managedMcpServers` —
  **require ≥ 2.1.232**
- stricter boot validation of empty `match.groups` / `admin.admin_groups` entries and
  malformed `email_domain` values — **added in 2.1.232**
- `400`/`413` from a cloud upstream carrying the upstream's own message (and the
  `capability_rejected:` token) — **requires ≥ 2.1.233**
- `forward_user_identity` on an `anthropic` upstream (per-user attribution at a proxy
  *behind* the gateway; not applicable to a Bedrock upstream) — **requires ≥ 2.1.233**
- `oidc.scope_on_refresh` (for IdPs that return an `id_token` on refresh only when asked
  for `openid` again) — **requires ≥ 2.1.260**
- `bedrock:CountTokens` in the **task role** — **worth granting from 2.1.260**, where an
  aborted request's input tokens are counted through Bedrock's free `CountTokens` API. An
  IAM gate rather than a config key, and a soft one: on failure the gateway logs
  `bedrock CountTokens failed, using a max_tokens:1 request for the aborted-request token
  count` once per upstream (debug thereafter) and meters through that billable probe
  instead, so nothing breaks and nothing goes uncounted. Two Bedrock-side limits, probed
  2026-09-15: `CountTokens` takes only a **bare foundation-model id** — the gateway strips
  the `global.`/`us.` prefix itself — and of this catalog only
  `anthropic.claude-haiku-4-5-20251001-v1:0` supports it; `anthropic.claude-opus-5` and
  `anthropic.claude-sonnet-5` answer `ValidationException: The provided model doesn't
  support counting tokens`. Re-probe when Bedrock adds support:
  `aws bedrock-runtime count-tokens --model-id anthropic.claude-opus-5 --input
  '{"converse":{"messages":[{"role":"user","content":[{"text":"x"}]}]}}'`
- `403` (rather than a silent pass) on an unreadable `access_control` entry, and correct
  client IP when a trusted proxy appends a port to `X-Forwarded-For` — **2.1.261**
- OTLP export straight to the collector named in the gateway's `OTEL_EXPORTER_OTLP_ENDPOINT`
  managed setting, bypassing the gateway relay — **added in 2.1.265** (the relay's 30-second
  forwarding pause after a rejected payload was fixed in the same release)
- `pricing:` rates delivered to signed-in clients through managed settings, so `/cost` and
  telemetry agree with the spend meter — **added in 2.1.268**. Before this, `pricing:` was
  read only by the spend meter
- `gatewayInternalNetworks` managed setting (lets `/login` accept a gateway on the
  organization's own public IPv4 block) and the empty-`access_control.allow_cidrs` startup
  warning — **2.1.268**. The warning **fires on this example's shipped config**, which sets
  no `allow_cidrs` and relies on the internal ALB plus its security group. Confirmed in the
  2.1.272 boot log; it is advisory, not a boot failure. Set `access_control.allow_cidrs` to
  your private ranges to silence it and add defence in depth
- `pricing.multiplier` above `1`, up to `10` — **requires ≥ 2.1.271**. Through `2.1.270` the
  ceiling was `1`, so the block could only discount; boot-probed both sides. This is what
  makes the data-residency premium a one-line correction (README §5, gotchas §21)

Client-side gates are a separate axis — they argue the README's **developer** floor, not
this pin. The current one to know: the **Spend limit** bar in `/usage` and the
`rate_limits.spend_limit` status-line field need **≥ 2.1.251 on the developer's machine**
but nothing newer than **2.1.225 on the gateway server**. Don't bump the container for a
client-side gate.

**One gate has halves on two different releases, so check both axes for it:** a
`pricing.multiplier` above `1` needs **≥ 2.1.271 on the server** to be accepted at all, and
**≥ 2.1.270 on the developer's machine** to be honoured. Below that the client ignores the
markup and shows `/cost` at list price, while caps and the gateway's own spend records are
already corrected. The gateway names the client floor at boot, so read the boot log after
setting one. A discount below `1` has no client floor.

One client release to keep a fleet off: **2.1.265** made the undocumented
`CLAUDE_CODE_USE_GATEWAY` variable force Cloud-gateway sign-in on its own, so a machine
setting it alongside an API key, `apiKeyHelper` or custom auth headers failed every request
with "Not signed in to the Cloud gateway". **2.1.266** restored the old behaviour, no config
change needed.

**The `desktop` block's key set is bounded by the pin, and the block is validated
strictly** — an unknown key fails gateway boot (crash-loops the container on ECS), so a
key copied from the docs page for a newer release takes the deployment down.

**2.1.232 changed the shape of this check.** Through `2.1.231` the gateway accepted a fixed
list of 11 hand-listed feature-gate keys and rejected every other key at boot. From
`2.1.232` on — including this example's pin — it accepts *every released Claude Desktop
setting* and validates the block against **Desktop's own configuration schema**. So the
question is no longer "is this key on the list of 11" but "does the pinned gateway's bundled
Desktop schema know this key, and would Desktop accept this value". Boot still fails on:

- an unknown key;
- a recognized key whose value Desktop would reject or silently drop (an empty value, a
  misspelled sub-key inside a nested entry such as `banner`);
- a key the gateway computes itself — the inference connection, the model list, the OTLP
  relay (configure those via `upstreams`, `models`, and `telemetry.forward_to`);
- a legacy alias of a current key (the boot error names the canonical key to write);
- keys Desktop reads only from MDM or local files, such as `bootstrapUrl`.

The pin still bounds what you can deliver: to ship a setting introduced by a newer Claude
Desktop release, upgrade the gateway first. Verify a new key against the pinned binary
before shipping it:

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
  The `cli` schema is closed apart from `env`, `pluginConfigs`, and keys nested under
  `permissions`, which pass through for newer clients. Settings this pin newly *can*
  deliver, none of them shipped in our block yet: `modelPricing`, `modelPicker`,
  `promptCacheTtl`, `subagentPromptCacheTtl` (2.1.243), `feedbackDrafts` and the extended
  `spinnerTipsOverride` entry shape (2.1.247). Probe each before shipping it — none is
  documented on the gateway config page.
- **Model IDs are two claims, not one.** A model can be current in Claude Code and still
  have no Bedrock inference profile under our `global.` prefix — the release notes don't
  tell you. Check the upstream side directly before shipping a catalog change:
  `aws bedrock list-inference-profiles --query "inferenceProfileSummaries[?contains(inferenceProfileId,'<model>')]"`,
  then one `aws bedrock-runtime converse --model-id global.anthropic.<model>` per entry.
  Done for the 2.1.229 catalog: `global.anthropic.claude-opus-5` is ACTIVE and all three
  shipped models return 200. **Open on the 2.1.272 pin:** 2.1.251 raised Sonnet 5's default
  auto-compact threshold to its full 1M context (~967K tokens, up from ~934K). Confirm
  `global.anthropic.claude-sonnet-5` actually serves a 1M window on Bedrock before relying
  on it — a client-side threshold above what the profile serves fails near the top of a
  long session.
- **Bedrock IAM actions and ARN families.** The two-ARN grant
  (`inference-profile/global.anthropic.*` **and** `foundation-model/anthropic.*`) and the
  three actions (`InvokeModel`, `InvokeModelWithResponseStream`, `CountTokens`) are asserted
  in the CDK tests. If the docs' IAM table changes, update the policy and the test. Watch
  for *new actions* specifically: `CountTokens` arrived in 2.1.260 and no deployment check
  catches a missing one, because the gateway degrades quietly (a warning plus a billable
  fallback) rather than failing.

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
