FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

COPY build/claude /usr/local/bin/claude
RUN chmod +x /usr/local/bin/claude

ENV CLAUDE_CONFIG_DIR=/tmp/.claude
ENV CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1

EXPOSE 8080

ENTRYPOINT ["claude", "gateway", "--config", "/etc/claude/gateway.yaml"]
