# Claude apps gateway — container image for the AWS / Bedrock worked example.
#
# Distroless glibc base: the standard Claude Code linux-x64 build's only dynamic
# dependencies are glibc libraries, so `cc-debian12` satisfies them with no shell
# and no package manager. We run the binary directly — no wrapper script — which
# is exactly why config is baked in rather than written at start by an entrypoint
# (a wrapper would need a shell this image doesn't have). See ADR 0001.
#
# Build context must already contain (both staged by setup.sh / the CDK build step
# BEFORE `docker build`):
#   ./claude        the pinned, SHA-verified linux-x64 native binary
#   ./gateway.yaml  the STAMPED config (stamp-config.sh output — not the template)
#
# Build with (buildx OCI image indexes are rejected by some runtimes, hence
# --provenance=false; the binary is linux/amd64):
#   docker build --platform=linux/amd64 --provenance=false -t <repo>:<tag> .

# ── Stage 1: assemble /etc/claude with deterministic perms ──
# Distroless has no shell to chmod in, and a single
# `COPY --chmod=0644 gateway.yaml /etc/claude/gateway.yaml` is not enough: on
# Docker/BuildKit the --chmod also stamps the auto-created /etc/claude parent at
# 0644 (no traverse bit), so the nonroot uid 65532 can't enter the dir → EACCES
# crash-loop at boot. (podman's builder doesn't propagate the mode, which is why
# the single-COPY form appears to work there.) Build the tree here with explicit
# dir/file modes and copy the finished directory across — COPY --from preserves
# these modes verbatim on every builder. See docs/gotchas.md §2.
FROM debian:12-slim AS config
COPY gateway.yaml /tmp/gateway.yaml
RUN mkdir -p /out/etc/claude \
 && cp /tmp/gateway.yaml /out/etc/claude/gateway.yaml \
 && chmod 0755 /out/etc/claude \
 && chmod 0644 /out/etc/claude/gateway.yaml

# ── Stage 2: distroless runtime ──
FROM gcr.io/distroless/cc-debian12:nonroot

# The pinned native binary. setup.sh/CDK verify its SHA256 against the release's
# GPG-signed manifest.json before this COPY; the Dockerfile trusts what it's given.
COPY --chmod=0755 claude /usr/local/bin/claude

# The stamped config (real literal values; only secrets + DB facts remain as
# ${VAR} for boot-time env expansion). Read once at boot, never written. Copied
# from the config stage as a finished tree: /etc/claude lands 0755, gateway.yaml
# 0644 — readable and traversable by the nonroot uid regardless of builder.
COPY --from=config /out/etc/claude /etc/claude

# Minimal images have no writable home; the gateway needs a writable state dir.
ENV CLAUDE_CONFIG_DIR=/tmp/.claude

# listen.port default. The ALB target group forwards here.
EXPOSE 8080

# distroless :nonroot runs as uid 65532 — no root, no shell.
USER nonroot

# No shell form (there is no shell): exec form straight to the gateway subcommand.
ENTRYPOINT ["/usr/local/bin/claude", "gateway", "--config", "/etc/claude/gateway.yaml"]
