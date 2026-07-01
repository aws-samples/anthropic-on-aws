FROM public.ecr.aws/debian/debian:bookworm-slim

RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

COPY claude /usr/local/bin/claude
COPY gateway.yaml /etc/claude/gateway.yaml

RUN chmod +x /usr/local/bin/claude

ENV CLAUDE_CONFIG_DIR=/tmp/.claude

EXPOSE 8080

ENTRYPOINT ["claude", "gateway", "--config", "/etc/claude/gateway.yaml"]
