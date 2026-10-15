FROM public.ecr.aws/docker/library/python:3.12-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
      bash \
      ca-certificates \
      curl \
      git \
      gzip \
      jq \
      libstdc++6 \
      nodejs \
      npm \
      openssh-client \
      procps \
      tar \
      unzip \
      util-linux \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd --gid 1000 developer \
    && useradd --uid 1000 --gid 1000 --create-home --shell /bin/bash developer \
    && install -d -m 0755 /etc/claude-code \
    && install -d -o developer -g developer -m 0750 /workspace

COPY tool-versions.json /opt/claude-agentcore/tool-versions.json

RUN CLAUDE_CODE_VERSION="$(jq --exit-status --raw-output \
      '.claudeCode.version' /opt/claude-agentcore/tool-versions.json)" \
    && CLAUDE_CODE_SHA256="$(jq --exit-status --raw-output \
      '.claudeCode.sha256' /opt/claude-agentcore/tool-versions.json)" \
    && curl --fail --location --silent --show-error \
      "https://storage.googleapis.com/claude-code-dist-86c565f3-f756-42ad-8dfa-d59b1c096819/claude-code-releases/${CLAUDE_CODE_VERSION}/linux-arm64/claude" \
      --output /usr/local/bin/claude \
    && echo "${CLAUDE_CODE_SHA256}  /usr/local/bin/claude" | sha256sum --check --strict \
    && chmod 0755 /usr/local/bin/claude

RUN VSCODE_CLI_VERSION="$(jq --exit-status --raw-output \
      '.vscodeCli.version' /opt/claude-agentcore/tool-versions.json)" \
    && VSCODE_CLI_COMMIT="$(jq --exit-status --raw-output \
      '.vscodeCli.commit' /opt/claude-agentcore/tool-versions.json)" \
    && VSCODE_CLI_SHA256="$(jq --exit-status --raw-output \
      '.vscodeCli.sha256' /opt/claude-agentcore/tool-versions.json)" \
    && curl --fail --location --silent --show-error \
      "https://update.code.visualstudio.com/commit:${VSCODE_CLI_COMMIT}/cli-alpine-arm64/stable" \
      --output /tmp/vscode-cli.tar.gz \
    && echo "${VSCODE_CLI_SHA256}  /tmp/vscode-cli.tar.gz" | sha256sum --check --strict \
    && tar -xzf /tmp/vscode-cli.tar.gz -C /usr/local/bin code \
    && chmod 0755 /usr/local/bin/code \
    && rm -f /tmp/vscode-cli.tar.gz \
    && /usr/local/bin/code --version | grep -F "${VSCODE_CLI_VERSION}"

COPY agent.py /opt/claude-agentcore/agent.py
RUN chown root:root /opt/claude-agentcore/agent.py \
    && chmod 0755 /opt/claude-agentcore/agent.py \
    && ln -s /opt/claude-agentcore/agent.py /usr/local/bin/developer-shell

ENV PYTHONUNBUFFERED=1
EXPOSE 8080
# AgentCore Runtime HTTP protocol contract: host 0.0.0.0, port 8080,
# GET /ping, POST /invocations. See
# docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-http-protocol-contract.html
ENTRYPOINT ["python3", "-u", "/opt/claude-agentcore/agent.py"]
