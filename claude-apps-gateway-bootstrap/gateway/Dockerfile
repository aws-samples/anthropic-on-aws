# Gateway image: the native `claude` binary run as `claude gateway`.
# Built on the private EC2 builder (no local Docker) and pushed to ECR.
# glibc base per the gateway image requirements; arm64 to match the builder + Fargate.
FROM debian:stable-slim

ARG CLAUDE_VERSION=2.1.197
ARG CLAUDE_PLATFORM=linux-arm64
ARG RELEASES=https://downloads.claude.ai/claude-code-releases

RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl gnupg jq \
 && rm -rf /var/lib/apt/lists/*

# Download + GPG-verify the release manifest, then verify the binary checksum against it.
RUN set -eux; \
    curl -fsSL https://downloads.claude.ai/keys/claude-code.asc | gpg --import; \
    gpg --fingerprint security@anthropic.com | grep -q "31DD DE24 DDFA B679 F42D  7BD2 BAA9 29FF 1A7E CACE"; \
    curl -fsSLO "${RELEASES}/${CLAUDE_VERSION}/manifest.json"; \
    curl -fsSLO "${RELEASES}/${CLAUDE_VERSION}/manifest.json.sig"; \
    gpg --verify manifest.json.sig manifest.json; \
    curl -fsSL -o /usr/local/bin/claude "${RELEASES}/${CLAUDE_VERSION}/${CLAUDE_PLATFORM}/claude"; \
    EXPECTED="$(jq -r ".platforms.\"${CLAUDE_PLATFORM}\".checksum" manifest.json)"; \
    echo "${EXPECTED}  /usr/local/bin/claude" | sha256sum -c -; \
    chmod +x /usr/local/bin/claude; \
    rm -f manifest.json manifest.json.sig

# gateway.yaml carries no secrets (they arrive via ${ENV} expansion), so baking it
# into the image is safe and avoids mounting config into Fargate.
COPY gateway.yaml /etc/claude/gateway.yaml

# Writable config dir for minimal images (the gateway runs as any user).
ENV CLAUDE_CONFIG_DIR=/tmp/.claude
EXPOSE 8080

# gateway.yaml is mounted read-only at /etc/claude/gateway.yaml; secrets arrive as env vars.
ENTRYPOINT ["claude", "gateway", "--config", "/etc/claude/gateway.yaml"]
