FROM public.ecr.aws/lambda/microvms:al2023-minimal

ARG CLAUDE_CODE_VERSION=2.1.215
ARG CLAUDE_CODE_SHA256=2b43a3d5b0787217e5d7381fad42c7314292546fe9db9eb8b9b379de90509b30
ARG VSCODE_CLI_VERSION=1.129.1
ARG VSCODE_CLI_COMMIT=8a7abeba6e03ea3af87bfbce9a1b7e48fed567b8
ARG VSCODE_CLI_SHA256=abd6e9ef317be8ecbbe255954bb76e5c174f15e1b37cf99d82a3d59b798812a6

RUN dnf install -y \
      bash \
      binutils \
      ca-certificates \
      curl-minimal \
      findutils \
      git \
      glibc \
      gzip \
      hostname \
      jq \
      libstdc++ \
      make \
      nodejs22 \
      nodejs22-npm \
      openssh-clients \
      procps-ng \
      python3.12 \
      shadow-utils \
      tar \
      unzip \
      util-linux \
      which \
    && dnf clean all \
    && rm -rf /var/cache/dnf \
    && ln -sf /usr/bin/python3.12 /usr/local/bin/python3

RUN groupadd --gid 1000 developer \
    && useradd --uid 1000 --gid 1000 --create-home --shell /bin/bash developer \
    && install -d -m 0755 /etc/claude-code /opt/claude-microvm/bridge \
    && install -d -o developer -g developer -m 0750 /workspace

COPY package.json package-lock.json tsconfig.json /opt/claude-microvm/bridge/
COPY src /opt/claude-microvm/bridge/src
RUN cd /opt/claude-microvm/bridge \
    && npm ci \
    && npm run build \
    && npm prune --omit=dev \
    && chown -R root:root /opt/claude-microvm/bridge \
    && chmod -R go-w /opt/claude-microvm/bridge

RUN curl --fail --location --silent --show-error \
      "https://storage.googleapis.com/claude-code-dist-86c565f3-f756-42ad-8dfa-d59b1c096819/claude-code-releases/${CLAUDE_CODE_VERSION}/linux-arm64/claude" \
      --output /usr/local/bin/claude \
    && echo "${CLAUDE_CODE_SHA256}  /usr/local/bin/claude" | sha256sum --check --strict \
    && chmod 0755 /usr/local/bin/claude

RUN curl --fail --location --silent --show-error \
      "https://update.code.visualstudio.com/commit:${VSCODE_CLI_COMMIT}/cli-alpine-arm64/stable" \
      --output /tmp/vscode-cli.tar.gz \
    && echo "${VSCODE_CLI_SHA256}  /tmp/vscode-cli.tar.gz" | sha256sum --check --strict \
    && tar -xzf /tmp/vscode-cli.tar.gz -C /usr/local/bin code \
    && chmod 0755 /usr/local/bin/code \
    && rm -f /tmp/vscode-cli.tar.gz \
    && /usr/local/bin/code --version | grep -F "${VSCODE_CLI_VERSION}"

COPY agent.py /opt/claude-microvm/agent.py
COPY vscode_tunnel.py /opt/claude-microvm/vscode_tunnel.py
RUN chown root:root /opt/claude-microvm/agent.py \
      /opt/claude-microvm/vscode_tunnel.py \
    && chmod 0755 /opt/claude-microvm/agent.py \
      /opt/claude-microvm/vscode_tunnel.py \
    && ln -s /opt/claude-microvm/agent.py /usr/local/bin/claude-session \
    && ln -s /opt/claude-microvm/vscode_tunnel.py /usr/local/bin/vscode-tunnel

ENV PYTHONUNBUFFERED=1
EXPOSE 8080
ENTRYPOINT ["python3.12", "-u", "/opt/claude-microvm/agent.py"]
