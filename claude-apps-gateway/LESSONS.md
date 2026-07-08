# LESSONS.md — deployment audit log

Live deploy of this worked example (Track A `setup.sh` + Client VPN + verification),
strictly following the repo docs as written. One entry per finding, appended as
encountered. Severity tags: **BLOCKER / WRONG / UNCLEAR / MISSING / FYI**.

> **Resolution status (2026-07-08):** the WRONG/UNCLEAR/MISSING findings below were
> addressed on this branch after the run — setup.sh (container-tool detection,
> `OIDC_CLIENT_SECRET` seeding + phase-0 fail-fast, summary doc link), deployment.md
> (prereqs 1/3/6, INGRESS_CIDR callout, Track A/B secret flow, cost section),
> connectivity.md (VPN sketch: `--split-tunnel` + client-profile steps), gotchas.md
> §13, plus `test/setup-helpers.test.sh`. Entries are kept as observed for the record.

Environment: account 133399841627, us-east-1, profile `awsbryn-Admin`,
gateway hostname `claude-gateway.awsbryn.people.aws.dev`, OIDC = Auth0
(`awsbryn.au.auth0.com`), managed public-cert TLS mode, `ENABLE_DASHBOARD=true`,
`DAILY_COST_THRESHOLD_USD=25`. Run date: 2026-07-08.

---

## Phase 0 — prerequisites (docs/deployment.md "Prerequisites (both tracks)")

### 1. [WORKAROUND / WRONG] `setup.sh` cannot run with podman despite docs saying podman works

- **When:** 2026-07-08, pre-deploy tooling check.
- **Following:** `docs/deployment.md` prereq 6 ("`docker` (or `podman`)") and
  `docs/gotchas.md` §13 ("`docker` isn't required — `podman` works, but drop
  `--provenance=false`").
- **Expected:** Track A runs on a podman-only machine (this laptop has podman 5.7.1,
  no docker).
- **What happened:** `setup.sh` phase-0 preflight hard-requires a binary literally
  named `docker` on PATH (`die "required tool not found on PATH: docker"`), and
  phase 2f hardcodes `docker build --platform=linux/amd64 --provenance=false` —
  the exact buildx-only flag gotchas §13 says podman rejects. So the podman path
  documented in gotchas is unusable with Track A as shipped.
- **What I did:** wrote a shim at `~/gateway-test/bin/docker` that execs `podman`
  with `--provenance=false` filtered out, and prepended it to PATH for the run.
- **Suggested fix:** setup.sh should detect `docker`/`podman`/`finch` (e.g.
  `CONTAINER_TOOL` env var), and only pass `--provenance=false` to docker buildx.
  At minimum, deployment.md prereq 6 should not list podman as satisfying Track A.

### 2. [UNCLEAR] Private-zone prerequisite vs. the public-zone happy path — and the "private" zone here is public

- **Following:** `docs/deployment.md` prereq 3 ("A **private** Route 53 hosted
  zone … for the gateway A-record") vs `docs/connectivity.md` DNS note ("because
  the gateway record lives in a **public** Route 53 zone but resolves to the
  ALB's **private** IPs, laptops resolve it correctly even without the Resolver
  inbound endpoint").
- **What happened:** the zone supplied for this run (`Z05253383FOJYSJSPLYZN`,
  `awsbryn.people.aws.dev`) is actually **public** (`PrivateZone: false`, NS
  delegation live). The docs' two statements pull in opposite directions:
  deployment.md mandates a private zone, while connectivity.md describes (from the
  authors' own live test) the simpler topology where the A-record lives in the
  public zone. Neither doc says explicitly that ZONE_ID may equal PUBLIC_ZONE_ID.
  Note also that if you *do* use a private zone, `setup.sh` never associates it
  with the VPC it creates, and connectivity gets harder (Resolver inbound endpoint
  needed for VPN clients) — none of that is called out in deployment.md.
- **What I did:** passed the same public zone as both `ZONE_ID` and
  `PUBLIC_ZONE_ID` (connectivity.md's verified happy path; the record answers
  private 10.20.x.x IPs, which is all the CLI checks).
- **Suggested fix:** deployment.md prereq 3 should say "a hosted zone the
  developer laptops can resolve — public-zone-with-private-answer is the simplest
  (see connectivity.md); a private zone also works but requires VPC association +
  a Resolver inbound endpoint for VPN clients."

### 3. [UNCLEAR] INGRESS_CIDR guidance contradicts itself for the Client VPN topology

- **Following:** `docs/deployment.md` Track A callout ("`INGRESS_CIDR` is the
  VPN/corp **client** CIDR developers connect from — **not** the VPC CIDR") vs
  `docs/connectivity.md` Client VPN gotcha 1 ("AWS Client VPN **source-NATs**
  client traffic … So `ingressCidr` for a Client VPN topology is effectively the
  VPC CIDR, not the client pool").
- **What happened:** for this run's topology (AWS Client VPN), following
  deployment.md literally (client CIDR `10.200.0.0/22`) would produce a gateway
  no VPN client can reach — the exact trap connectivity.md documents.
- **What I did:** set `INGRESS_CIDR=10.20.0.0/16` (the VPC CIDR setup.sh creates),
  per connectivity.md.
- **Suggested fix:** deployment.md's callout should carry the Client-VPN exception
  inline ("…unless your path is AWS Client VPN, which source-NATs — then use the
  VPC CIDR; see connectivity.md").

### 4. [FYI] Bedrock model-access check has no documented verification command

- **Following:** `docs/deployment.md` prereq 1.
- **What happened:** docs say to enable model access in the console but give no
  way to *check* it. Verified all four `availableModels` (opus-4-8, sonnet-5,
  haiku-4-5, fable-5) by issuing a 5-token `aws bedrock-runtime converse` against
  each `us.anthropic.*` profile — all succeeded (this account had access already).
- **Suggested fix:** add the one-liner converse loop to the prereqs as a
  verification step.

---

## Phase 1 — Track A `setup.sh` run 1 (docs/deployment.md "Track A")

### 5. [FYI] Phases 0–2 (preflight, config stamp, signed-manifest binary verify, image build+push) worked as written — including on bash 3.2

- **When:** 2026-07-08, first run.
- **Following:** deployment.md Track A; prereq 6 says "Track A needs bash 4+
  (macOS ships 3.2 — `brew install bash`)".
- **What happened:** ran under stock macOS bash 3.2 (no brew bash installed) and
  phases 0–2 completed cleanly: GPG key fingerprint verified, manifest signature
  verified, binary SHA-256 matched, image built (via the podman shim) and pushed
  in one pass. gotchas.md §13 already admits the script "uses no bash-4-isms now".
- **Suggested fix:** deployment.md prereq 6 overstates the requirement —
  contradicting gotchas.md §13. Align the two (either drop the bash-4 claim or
  explain it's only for future extensions).

### 5b. [UNCLEAR] "One command deploys end to end" — actually run → set OIDC secret → re-run, and deployment.md never mentions the secret step

- **When:** 2026-07-08, ~13 min into run 1 (image build ~4 min, NAT ~2 min, RDS ~9 min).
- **Following:** deployment.md Track A: "One command deploys end to end".
- **Expected:** a single invocation reaching the deploy summary.
- **What happened:** run 1 exited at phase 4: the script creates
  `claude-gateway-oidc-client-secret` with a `REPLACE_ME` placeholder and then
  deliberately dies with put-secret-value instructions. That guard is sensible,
  but (a) deployment.md's Track A section never tells you the OIDC client secret
  must be placed in Secrets Manager at all — prereq 5 only says "note the client
  secret"; (b) the die comes *after* the ~9-minute RDS wait, so the mandatory
  second run costs real time; (c) "one command deploys end to end" is not true
  for a first deploy. The error message itself is excellent (exact command,
  correct region).
- **What I did:** ran the printed `put-secret-value` command with the real Auth0
  secret and re-ran setup.sh (idempotent skip of phases 1–3 worked as advertised).
- **Suggested fix:** deployment.md Track A should document the two-step reality
  (or setup.sh should accept `OIDC_CLIENT_SECRET` as an optional env var and seed
  the secret itself, keeping the guard for the unset case). Cheap improvement:
  perform the placeholder check in phase 0 *before* the slow phases.

### 5c. [FYI] Run 2: phases 4–7 followed as written, no issues — full second pass took ~3.5 min

- **What happened:** idempotent re-run skipped phases 1–3 as advertised (`(exists)`
  markers), managed-cert mode requested the ACM cert and it went ISSUED well
  inside the script's 10-min poll (validation CNAME in the genuinely-delegated
  public zone — the gotchas.md §17 stall did not occur), both listeners + ADOT +
  gateway services + A-record + dashboard + `alb-5xx`/`daily-cost` alarms all
  created first try, and `aws ecs wait services-stable` returned green within
  minutes of the run finishing. Phase 7 `ENABLE_DASHBOARD`/`DAILY_COST_THRESHOLD_USD`
  flags worked exactly as documented.

### 5d. [WRONG] setup.sh's final summary references `docs/developer-setup.md`, which does not exist

- **Following:** setup.sh "NEXT STEPS" item 5: "Push forceLoginMethod/
  forceLoginGatewayUrl to developer machines (see docs/developer-setup.md)".
- **What happened:** there is no `docs/developer-setup.md` in the repo (docs/ has
  connectivity, deployment, eks-notes, gotchas, teardown, upstream-watch). The
  actual managed-settings content lives in deployment.md's Verify section.
- **Suggested fix:** point the summary at `docs/deployment.md` (Verify section),
  or add the missing file.

## Phase 2 — Client VPN (docs/connectivity.md appendix)

### 6. [MISSING] The Client VPN sketch stops before the client config — export/inline steps are undocumented

- **Following:** connectivity.md "Appendix: Client VPN + Resolver inbound endpoint
  sketch" steps 1–3.
- **Expected:** enough steps to get a laptop connected.
- **What happened:** the sketch ends at `authorize-client-vpn-ingress`. Getting an
  actually-usable client profile needs undocumented steps:
  `aws ec2 export-client-vpn-client-configuration`, inlining `<cert>`/`<key>`
  blocks into the `.ovpn`, and adding the gotcha-3 `tun-mtu`/`mssfix` lines by
  hand. The four "verified the hard way" gotchas were accurate and saved real
  time (keyUsage extension + domain-style CN on the server cert; MSS clamping).
- **What I did:** hand-rolled the OpenSSL PKI per gotcha 2 (extensions verified
  present), imported the server cert to ACM (reused as the client root chain ARN
  since one CA signs both), exported + assembled `~/gateway-test/vpn/claude-gateway.ovpn`.
- **Suggested fix:** extend the sketch with the export-config + inline-cert step
  (3 lines) and fold the mssfix fix directly into it.

### 7. [MISSING] The sketch omits `--split-tunnel` — as written it full-tunnels the laptop

- **Following:** same appendix, `create-client-vpn-endpoint` sketch.
- **What happened:** without `--split-tunnel`, the endpoint defaults to full
  tunnel: all laptop traffic is routed into a VPC with no authorized internet
  egress path for VPN clients — the laptop loses internet while testing the
  gateway. For a laptop-test topology split tunnel is what you want.
- **What I did:** added `--split-tunnel` (only `10.20.0.0/16` routes over VPN).
- **Suggested fix:** add `--split-tunnel` to the sketch with a one-line why.

---

## Phase 3 — Verification (docs/deployment.md "Verify" + docs/gotchas.md §14)

### 8. [FYI] Verification followed as written, no issues — gotchas §14's throwaway-Fargate-task pattern and its log-group tip both worked first try

- **When:** 2026-07-08, ~40 min after starting.
- **What happened:** ran a one-off Fargate task (amazonlinux:2023, task SG, private
  subnet) per gotchas §14. All four checks passed on the first attempt:
  - DNS → `10.20.11.181`, `10.20.10.12` (private only, no public/AAAA answers)
  - `/healthz` 200, `/readyz` 200
  - `/.well-known/oauth-authorization-server` → valid discovery JSON
  - `POST /oauth/device_authorization` → real `device_code`/`user_code` JSON
    (Postgres writable end to end)
  The §14 tip to log into the existing `/claude-gateway/gateway` group (because
  the exec role is least-privilege to it) was exactly right — a fresh log group
  would have failed task start. Bonus signal: the probe's curl validated the ACM
  chain *without* `-k`, confirming the managed cert is publicly trusted in-VPC.
  ECS services stable (gateway 2/2, otel 1/1), both targets healthy, both alarms
  `OK`, dashboard `claude-gateway` present, cert `ISSUED`, VPN
  `available`/`associated` with `10.20.0.0/16` authorized.

### 9. [FYI] Elapsed time + cost profile of the full run

- Prereq checks ~10 min; setup.sh run 1 ~13 min (image ~4, NAT ~2, RDS ~9, then
  the phase-4 die); secret + run 2 ~4 min; VPN provisioning ran in parallel
  (~10 min to `available`/`associated`); verification ~5 min. **Total ~35–40 min
  wall clock.**
- Estimated steady-state cost ≈ **$8–10/day**: the two biggest line items are
  ones the docs never flag — the 5 interface VPC endpoints × 2 AZs (~$2.40/day)
  and the Client VPN subnet association (~$2.40/day, plus $0.05/h per connected
  client). NAT ~$1.15/day, Fargate ~$1.50/day, ALB ~$0.60/day, RDS ~$0.45/day.
  A cost callout in deployment.md (or teardown.md) would help disposable-account
  testing. [MISSING]

