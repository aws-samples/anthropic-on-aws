FROM public.ecr.aws/docker/library/node:22-alpine

WORKDIR /app

# Only the relay's own dependency surface is needed at runtime: no bundler,
# so copy the whole repo's node_modules (already resolved by npm ci at
# build time) and the two source trees the relay imports from.
COPY package.json package-lock.json ./
# npm ci (not --omit=dev): tsx is a devDependency but is the actual runtime
# interpreter here (this repo runs its TS sources directly via tsx rather
# than a build step) -- omitting dev deps left `npx tsx` unable to find tsx
# locally, and it crashed on start (exit 255, no logs) trying to resolve it
# some other way instead.
RUN npm ci

COPY relay/src ./relay/src
COPY shared ./shared

ENV NODE_ENV=production
EXPOSE 8080
ENTRYPOINT ["npx", "tsx", "relay/src/index.ts"]
