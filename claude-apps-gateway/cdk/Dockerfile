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

FROM gcr.io/distroless/cc-debian12:nonroot

# The pinned native binary. setup.sh/CDK verify its SHA256 against the release's
# GPG-signed manifest.json before this COPY; the Dockerfile trusts what it's given.
COPY --chmod=0755 claude /usr/local/bin/claude

# The stamped config (real literal values; only secrets + DB facts remain as
# ${VAR} for boot-time env expansion). Read once at boot, never written.
# --chmod=0644 so the nonroot uid can read it regardless of the host file's mode
# (stamp-config.sh writes via mktemp, which is 0600 — without this the gateway
# fails to boot with EACCES opening /etc/claude/gateway.yaml).
COPY --chmod=0644 gateway.yaml /etc/claude/gateway.yaml

# Minimal images have no writable home; the gateway needs a writable state dir.
ENV CLAUDE_CONFIG_DIR=/tmp/.claude

# listen.port default. The ALB target group forwards here.
EXPOSE 8080

# distroless :nonroot runs as uid 65532 — no root, no shell.
USER nonroot

# No shell form (there is no shell): exec form straight to the gateway subcommand.
ENTRYPOINT ["/usr/local/bin/claude", "gateway", "--config", "/etc/claude/gateway.yaml"]
