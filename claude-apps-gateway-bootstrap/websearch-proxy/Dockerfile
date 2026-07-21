# Resource-stripping OAuth proxy image (Node/Express). Build with `docker build`/`finch build`
# and push to ECR (see README) — no standing build infrastructure.
FROM node:20-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY server.js ./

ENV PORT=8082
EXPOSE 8082
USER node
CMD ["node", "server.js"]
