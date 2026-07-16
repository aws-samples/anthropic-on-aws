---
name: ccwb-to-gateway
description: Generate a concrete, AWS-focused migration plan for administrators moving a Claude Code/Desktop deployment off the "guidance-for-claude-code-with-amazon-bedrock" sample and onto claude-apps-gateway (+ optional claude-apps-gateway-bootstrap). Use whenever someone asks how to migrate, cut over, replace, or retire their bedrock credential-process / ccwb-based Claude Code setup in favor of the gateway sample, or asks to compare the two architectures for a migration. Covers architecture deltas, IAM/credential model changes, CDK/CloudFormation deployment differences, client bootstrap/config changes, cutover sequencing, and rollback — tailored to the admin's actual current deployment, not generic advice.
---

# Bedrock guidance → Claude Apps Gateway migration

Produce a migration plan for an administrator moving from
**guidance-for-claude-code-with-amazon-bedrock** (credential-process + CloudFormation, "ccwb")
to **claude-apps-gateway** (self-hosted proxy on ECS/Fargate, CDK) and, optionally,
**claude-apps-gateway-bootstrap** (per-user Claude Desktop config add-on).

These are architecturally different systems, not two versions of the same thing. The bedrock
sample hands each client short-lived **AWS credentials** via a local `credential_process`
binary; the gateway sample hands each client a **bearer JWT** from OIDC SSO and proxies
inference server-side. A good migration plan explains *why* things move, not just *what* to
click, because the admin will be answering questions from their own users during cutover.

**Framing note:** guidance-for-claude-code-with-amazon-bedrock ("ccwb") is now in maintenance
mode, and claude-apps-gateway is the current recommendation for new deployments — so this is a
real, recommended migration, not a discretionary architecture preference between two equally
current options. Say so plainly when asked "should we migrate." That said, claude-apps-gateway
is still explicitly self-labeled in its own repo as "reference material... a working example,
not a supported production artifact" (`claude-apps-gateway/CLAUDE.md`) — don't oversell it as
turnkey. Point the admin at the real, field-verified gotchas in `claude-apps-gateway/docs/gotchas.md`
rather than implying a clean, risk-free swap. And because ccwb is maintenance-only rather than
actively deprecated, there's no forcing function on timeline — the admin can run both side by
side for as long as they need without urgency.

## Scope the answer to the actual question first

Not every request here wants a full migration plan. Someone asking "what changes for our end
users?" or "does the gateway support Okta?" wants a direct, focused answer — grounded in the
same source-reading discipline below, but without the interview or the nine-section plan
structure. Save those for when the admin is actually asking you to plan or sequence a cutover
("help us migrate," "plan our cutover," "what's the migration path"). When in doubt, answer the
narrow question first and note that a fuller cutover plan is available if they want one — don't
default to maximal output.

This scoping applies to *structure*, not to rigor: even a one-line answer should still flag
version-sensitive specifics (session/JWT lifetimes, CLI version floors, default enforcement
behavior) as "confirm against current source" rather than stating them as settled fact — these
are exactly the numbers that drift fastest in both repos.

## Before generating a full plan: interview the admin

Don't write a generic plan from the repos alone — the right cutover sequence depends on their
specific deployment. Ask (skip any they've already told you):

1. **Identity provider** — which OIDC/SAML IdP do they use today with the bedrock sample
   (Okta, Entra ID, Auth0, Google, Cognito User Pools), and can that same IdP register a
   confidential *and* a public (PKCE) client app? The gateway needs a confidential client for
   server-side SSO; the bootstrap add-on needs a separate public PKCE client for Desktop.
2. **Auth mode currently in use** — Direct IAM Federation (OIDC → `AssumeRoleWithWebIdentity`),
   AWS IAM Identity Center, or "None" (raw IAM)? This determines what gets decommissioned vs.
   reused (the IdP app registration itself is usually reusable; the IAM OIDC provider/roles are
   bedrock-sample-specific and get retired).
3. **Client mix** — Claude Code CLI only, or also Claude Desktop/Cowork via MDM? Desktop users
   are the ones who benefit from claude-apps-gateway-bootstrap; CLI-only fleets may not need it.
4. **Which optional stacks are deployed** today — quota/cost enforcement (Lambda+DynamoDB),
   OTEL monitoring (Fargate collector or sidecar), analytics (S3+Athena), dashboards? Each has
   a rough equivalent on the gateway side (see mapping below) that needs to be re-decided, not
   assumed away.
5. **Network posture** — are clients on a corporate VPN/private network today? The gateway ALB
   is internal-only by design (`claude-apps-gateway/README.md` prerequisites) — confirm clients
   can reach a private ALB, since this is a common cutover blocker (see `docs/gotchas.md` and
   `docs/connectivity.md` in that repo).
6. **Rollout scope** — pilot group first, or a hard cutover for everyone at once? This decides
   whether to recommend running both systems side-by-side for a period (both use the same
   underlying Bedrock model access, so this is safe to do).
7. **AWS account/region** — same account as the bedrock sample, or a new one? Reusing the
   account matters for reusing the Bedrock model-access enablement and any existing VPC.

If the admin doesn't know an answer, say so explicitly in the plan as an open decision rather
than silently assuming a default.

## Locate the three repos before reading anything

This skill ships inside the `claude-apps-gateway` sample (`claude-apps-gateway/.claude/skills/`),
so **claude-apps-gateway itself is the directory you're working in** — its files are right here.
`claude-apps-gateway-bootstrap` is normally a sibling directory (both live under the
`anthropic-on-aws` monorepo), but confirm rather than assume. `guidance-for-claude-code-with-amazon-bedrock`
is a **separate repo entirely**, not part of this monorepo — it will not be at a predictable
relative path, and the user may not even have it cloned locally.

Ask the user where their copy of `guidance-for-claude-code-with-amazon-bedrock` lives if they
haven't said (and confirm the bootstrap repo's location if it isn't the expected sibling) — don't
burn time guessing across the filesystem. A quick check of an obvious candidate the user already
named is fine, but treat a wrong guess as a reason to ask, not a reason to keep searching.

Once located, do not rely on memory of these three repos — read the actual files below (or their
current equivalents; names/paths drift as these samples evolve) before making any concrete claim
(stack name, IAM action, port, file path):

- `guidance-for-claude-code-with-amazon-bedrock/README.md`, `QUICK_START.md`, `CLAUDE.md`,
  `deployment/infrastructure/*.yaml`, `source/go/cmd/credential-process/main.go` or
  `source/credential_provider/__main__.py`, `assets/docs/CLI_REFERENCE.md`
- `claude-apps-gateway/README.md`, `CLAUDE.md`, `cdk/lib/claude-gateway-stack.ts`,
  `cdk/bin/app.ts`, `docs/deployment.md`, `docs/gotchas.md`, `docs/teardown.md`,
  `docs/connectivity.md`
- `claude-apps-gateway-bootstrap/README.md`, `cdk/lib/bootstrap-stack.ts`, `.env.example`,
  `scripts/wire-client.sh`

Cite `file:line` for non-obvious claims in the plan so the admin can verify them.

Before trusting any specifics, check how current your copies of the three repos are (recent
commit dates, version strings in `CHANGELOG.md` / `cdk/scripts/*` / `docs/upstream-watch.md`).
claude-apps-gateway in particular pins a narrow, fast-moving Claude Code CLI version floor
(see `docs/upstream-watch.md`) and reconciles its CDK/`gateway.yaml` template on every upstream
bump — a mapping written even a few weeks ago can be stale. Tell the admin the age of what
you're citing so they know whether to double check it themselves before deploying.

## Architecture mapping (a starting map, not a source of truth — verify each row live)

The categories below are the durable, structural differences between the two systems and are
unlikely to change. The specifics in each cell (exact IAM ARNs, service names, default values)
are exactly what drifts fastest as both samples evolve — treat every specific claim as "verify
this against the file cited" rather than as fact:

| Concern | Bedrock guidance sample | Gateway (+ bootstrap) | Verify against |
|---|---|---|---|
| Client → provider auth | Local `credential_process` binary exchanges an OIDC token for temporary **AWS SigV4 creds** via STS `AssumeRoleWithWebIdentity` | `claude /login` browser OIDC SSO → gateway issues a short-lived **bearer JWT**; no AWS creds ever reach the client | `source/go/cmd/credential-process/main.go`; `claude-apps-gateway/README.md` auth section |
| Provider-side credential | N/A — each client assumes its own scoped role | Single upstream credential, held only by the gateway, via the AWS default credential chain (task role / IRSA) | `claude-apps-gateway/cdk/lib/claude-gateway-stack.ts` IAM role definition |
| Deployment tooling | `ccwb` CLI + raw CloudFormation stacks | CDK, or the idempotent `cdk/scripts/setup.sh` alternative; check current deploy sequencing (was two-pass: ECR then full stack) | `deployment/infrastructure/*.yaml`; `claude-apps-gateway/docs/deployment.md` |
| Compute | Lambda + optional ECS/sidecar for OTEL | ECS Fargate behind an internal ALB, plus a separate telemetry-collector service if enabled | `claude-apps-gateway/cdk/lib/claude-gateway-stack.ts` |
| Data store | DynamoDB (quota), S3+Athena (analytics) | RDS + Secrets Manager for sessions/secrets — confirm current engine/version | `claude-apps-gateway/cdk/lib/claude-gateway-stack.ts` |
| Model access IAM | Per-client assumed role scoped to Bedrock actions | A single IAM role needs Bedrock invoke permissions on **both** the inference-profile and foundation-model ARN families for the models in use — missing either family is a documented cause of 403s; confirm the exact ARN patterns in the current gotchas doc | `claude-apps-gateway/docs/gotchas.md`; `cdk/lib/claude-gateway-stack.ts` |
| Quota/cost control | Lambda-based quota checks gate credential issuance | Server-side spend caps enforced per-request; confirm current fail-open-vs-fail-closed default before relying on it | `claude-apps-gateway/README.md` admin/spend-caps section |
| Usage telemetry | OTEL → CloudWatch/S3+Athena/CUR2.0 | OTLP forwarded from a collector service to whatever backend is configured | `claude-apps-gateway/README.md` telemetry section |
| Client install | Installer scripts write `credential_process` into `~/.aws/config`; MDM profile for Desktop | MDM-pushed `managed-settings.json` points the client at the gateway URL; Desktop per-user config optionally delivered by the bootstrap add-on's own PKCE login | `claude-apps-gateway/README.md` client config section; `claude-apps-gateway-bootstrap/README.md` |
| Rollback | `ccwb destroy [stack]`, some resources need manual cleanup | Point clients back at direct Bedrock/bedrock-sample config; check current teardown doc for stack-specific caveats | `claude-apps-gateway/docs/teardown.md` |

The bootstrap add-on is optional and orthogonal to inference: it delivers *Desktop
configuration* (models, MCP servers, egress rules) via its own PKCE client app, separate from
the gateway's own SSO login for inference. A CLI-only fleet can skip it entirely.

## Partial adoption is a valid outcome, not just binary cutover

Don't default to framing this as all-or-nothing. An admin may reasonably want just one piece of
the gateway's capability — e.g., centralized spend caps or OTLP telemetry — while keeping ccwb's
per-client credential model for now, especially since ccwb isn't being forced out on a timeline.
If the admin's stated goal is narrower than "replace ccwb entirely" (e.g., "we just want better
cost controls"), say so and scope the plan to that, rather than pushing a full architecture swap
they didn't ask for. Full cutover and partial adoption both belong in the deployment-sequence
and cutover-strategy sections below — pick the one that matches what the admin actually asked
for.

## Structure of the generated plan

Use this structure only for a full cutover/migration plan (see scoping note above). Once the
interview answers and source reading are done, write the plan with these sections:

1. **Current state summary** — restate the admin's deployment back to them (auth mode, stacks
   deployed, client mix) so they can correct you before you build on it.
2. **Target state** — what gets deployed (gateway stack, optionally bootstrap stack), reusing
   the mapping table above narrowed to what's actually relevant to them.
3. **IdP changes required** — new app registration(s) needed, exact type (confidential vs.
   PKCE public client), redirect URIs, and what happens to the *existing* bedrock-sample IdP
   app registration (usually: leave it running until cutover completes, then retire).
4. **Deployment sequence** — concrete ordered steps referencing the real prerequisites and
   commands from `claude-apps-gateway/docs/deployment.md` (two-pass CDK deploy, Bedrock model
   access enablement, internal ALB/DNS/VPN reachability check) and, if in scope,
   `claude-apps-gateway-bootstrap`'s stack (deployed *after* the gateway, consuming its
   CloudFormation outputs — never modifies the gateway stack).
5. **Cutover strategy** — pilot-group vs. hard-cutover per their answer; both systems can run
   concurrently since they hit the same Bedrock model access, so recommend running gateway
   alongside the bedrock sample for a validation window before decommissioning anything.
6. **Client-side changes** — what changes in `~/.aws/config` / MDM profile / `claude`
   settings for end users, calling out that end users stop needing local AWS credentials
   entirely once cut over.
7. **What gets decommissioned and when** — `ccwb destroy` targets, IAM OIDC provider/roles,
   quota Lambdas/DynamoDB tables, only after the validation window closes.
8. **Rollback plan** — how to point clients back at the bedrock sample if the gateway rollout
   needs to be reverted, and what stays deployed (in standby) during the validation window to
   make that possible.
9. **Open questions / risks** — anything the admin didn't have an answer for, plus real gotchas
   worth flagging proactively: internal-ALB network reachability, the two Bedrock ARN families
   needed in IAM policy, Claude Code CLI version pin required by the gateway, MTU issues over
   VPN noted in the bootstrap README.

Keep the plan concrete — actual stack/file/command names from the source, not paraphrased
generalities. If something in the repos has clearly changed since the mapping table above
(e.g., new CDK constructs, renamed stacks), trust what you just read over this table and note
the discrepancy.
