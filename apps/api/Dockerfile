# FoodStra API — multi-stage build for a lean production image.
# Build context is the repo root: `docker build -f apps/api/Dockerfile .`
FROM node:20.18.1-bookworm-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /repo

# --- deps: install with the full workspace lockfile for reproducibility ---
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --filter @foodstra/api... --filter @foodstra/shared...

# --- build: compile shared + api to JS ---
FROM deps AS build
COPY packages/shared packages/shared
COPY apps/api apps/api
COPY tsconfig.base.json ./
RUN pnpm --filter @foodstra/shared build \
  && pnpm --filter @foodstra/api prisma:generate \
  && pnpm --filter @foodstra/api build

# --- runtime: prune dev deps, run as non-root ---
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /repo/node_modules /repo/node_modules
COPY --from=build /repo/packages/shared /repo/packages/shared
COPY --from=build /repo/apps/api /repo/apps/api
COPY --from=build /repo/package.json /repo/pnpm-workspace.yaml /repo/
RUN pnpm --filter @foodstra/api... --prod deploy /app || true
WORKDIR /repo/apps/api
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD node -e "fetch('http://localhost:4000/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/server.js"]
