# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A **worked example for deploying the Claude apps gateway on AWS**, modeled on Anthropic's official
GCP example (`github.com/anthropics/claude-code/tree/main/examples/gateway/gcp`). It is reference
material for customer-managed infrastructure — *a working example, not a supported production
artifact*. Every doc and README must preserve that framing.

The Claude apps gateway is a self-hosted service built into the `claude` binary
(`claude gateway --config gateway.yaml`). It sits between developers' Claude Code clients and a
model provider: developers sign in via corporate OIDC SSO instead of holding API keys, the gateway
holds the upstream credential, enforces per-IdP-group model access + managed settings, and fans out
OTLP telemetry. This repo's upstream is **Amazon Bedrock**.

The implementation is built out — `setup.sh` and the CDK app (`cdk/`) provision the Fargate track,
with the EKS track documented in `docs/`. When adding or changing files, follow the existing
structure and keep the `setup.sh` and CDK paths in sync rather than diverging.

## Architecture

Two deployment tracks, mirroring how the GCP example splits Cloud Run (automated) vs GKE (notes):

- **ECS Fargate** behind an **internal IPv4 ALB** — the primary, fully-automated track, delivered as
  both `setup.sh` (idempotent `aws`-CLI) and a CDK app (`cdk/`, TypeScript).
- **EKS + IRSA** — a documented-notes-only track in `docs/eks-notes.md`.

Shared data plane: RDS for PostgreSQL (private subnets, no public IP), Secrets Manager (jwt / oidc
client secret / postgres-url / the `gateway.yaml` config itself), ECR for the image, and an IAM task
role granting Bedrock invoke.

The CDK app and `setup.sh` provision the **same** Fargate deployment two ways — keep them in sync.

## Non-obvious constraints (these break the gateway if missed)

- **Bedrock IAM needs two ARN families.** Grant `bedrock:InvokeModel` +
  `bedrock:InvokeModelWithResponseStream` on *both* `inference-profile/us.anthropic.*` *and*
  `foundation-model/anthropic.*`. Missing either yields 403s.
- **Fargate, not EC2, is the primary track for a reason.** On EC2-backed compute the default IMDSv2
  hop limit of 1 blocks the in-container metadata call → every Bedrock request 502s with
  `Could not load credentials from any providers`. Fargate task roles avoid this (ECS
  container-credentials endpoint). The EKS notes must document the hop-limit fix.
- **Gateway hostname must resolve to private IPs only** — Claude Code's `/login` rejects any public
  IP. Use an **IPv4-only internal ALB**: internal *dual-stack* ALBs return public-range AAAA records
  that the check rejects.
- **`public_url` drives everything.** The gateway builds its OIDC `redirect_uri` and discovery doc
  only from `listen.public_url`, never from `X-Forwarded-*`. This forces a **two-pass deploy**: first
  pass provisions and prints the ALB hostname; set it as `public_url` (and register
  `<public_url>/oauth/callback` on the OIDC client), then redeploy.
- **Raise the ALB idle timeout** (e.g. 3600s) or long streaming responses get cut off.
- **Config secret guard:** `setup.sh` must refuse to publish `gateway.yaml` while any `REPLACE_ME`
  placeholder remains.
- **Container image:** distroless glibc base (`gcr.io/distroless/cc-debian12:nonroot`) around the
  pinned `linux-x64` native `claude` binary; build `--platform=linux/amd64 --provenance=false`
  (buildx OCI image indexes are rejected by some runtimes). `CLAUDE_CONFIG_DIR=/tmp/.claude`.

## Conventions

- **Secret expansion in `gateway.yaml`:** `${ENV_VAR}` (env injection, used on ECS) or
  `${file:/path}` (mounted files, used on EKS via the Secrets Store CSI driver). Never inline secrets.
- **`auth: {}`** in the Bedrock upstream means "use the AWS default credential chain" — i.e. the task
  role / IRSA. Prefer this over static keys everywhere.
- Health: ALB target-group health check → `GET /healthz` (liveness). `GET /readyz` verifies the store
  (Postgres). Keep the target-group check on `/healthz`: liveness keeps replicas in rotation, whereas
  pointing it at `/readyz` would drain *all* replicas on a transient Postgres blip. Weigh that before
  changing the probe target.
- `setup.sh` is idempotent (describe-before-create); `set -euo pipefail`; `trap`-clean partial binary
  downloads. Mirror the env-var-with-defaults convention from the GCP `setup.sh`.

## Verification

No live AWS account is wired up here, so verification is local/static:

- Shell: `bash -n setup.sh`, and `shellcheck setup.sh` if available.
- CDK (strongest automated check — type-checks TS + validates construct wiring without deploying):
  `cd cdk && npm install && npx cdk synth`. Deploy a single stack with `npx cdk deploy <StackName>`.
- Tests (run these after changing the stack or `stamp-config.sh`, and add cases when
  fixing a deployment trap): `cd cdk && npm test` (Jest + CDK `assertions` over the
  synthesized template — dual-ARN Bedrock policy, IPv4 internal ALB, `/healthz` probe,
  `:4318` listener, `createVpcEndpoints` opt-out) and `./test/stamp-config.test.sh`
  (dependency-free bash: placeholder guard + Google scope auto-injection). Neither
  needs an AWS account. CDK tests pass `-c zoneId` to skip the `fromLookup` credential call.
- Config: `python3 -c 'import yaml; yaml.safe_load(open("gateway.yaml.example"))'` (the `${...}`
  placeholders are plain strings to YAML).
- `docker build` is deferred — it needs the real pinned `claude` binary that `setup.sh` stages.

End-to-end smoke tests (against a real account + OIDC IdP) are the user's, per the gateway quickstart:
`/.well-known/oauth-authorization-server`, `/oauth/device_authorization`, then the browser sign-in leg.

## Reference docs

- Gateway overview / quickstart: https://code.claude.com/docs/en/claude-apps-gateway
- Config reference (every `gateway.yaml` option): https://code.claude.com/docs/en/claude-apps-gateway-config
- Deployment & operations (IAM, image, health, security): https://code.claude.com/docs/en/claude-apps-gateway-deploy
- The GCP worked example this mirrors: https://code.claude.com/docs/en/claude-apps-gateway-on-gcp
