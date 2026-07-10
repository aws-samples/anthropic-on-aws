# Bootstrap server image (Node/Express + jose). Build with `docker build` and push to ECR
# (see README Step 2) — no standing build infrastructure.
FROM node:20-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY server.js config.js authorize.js ./
# Bundled default bootstrap config: the runtime LOCAL_FALLBACK is config/bootstrap-config.json
# (the key the app reads), but only the .example.json is committed — stage it under the real
# name so getConfig() has a file to fall back to when S3 is unset/unreachable on a cold cache.
COPY config ./config
RUN cp config/bootstrap-config.example.json config/bootstrap-config.json
# NOTE: org-plugins are no longer served over the network (PKCE mode has no network plugin
# delivery). They ship via the filesystem org-plugins/ directory on each device instead, so
# the server image does not bundle or serve them.

ENV PORT=8081
EXPOSE 8081
USER node
CMD ["node", "server.js"]
