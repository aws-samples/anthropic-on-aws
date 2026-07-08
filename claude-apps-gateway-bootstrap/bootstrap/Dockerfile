# Bootstrap server image (Node/Express + jose). Built on the private EC2 builder, pushed to ECR.
FROM node:20-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends tar zip ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY server.js config.js ./
# Bundled default bootstrap config (fallback when S3 is unset/unreachable).
COPY config ./config
# NOTE: org-plugins are no longer served over the network (PKCE mode has no network plugin
# delivery). They ship via the filesystem org-plugins/ directory on each device instead, so
# the server image does not bundle or serve them.

ENV PORT=8081
EXPOSE 8081
USER node
CMD ["node", "server.js"]
