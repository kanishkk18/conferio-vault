# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
RUN npm install -g pnpm@9.12.0 turbo@2.10.4

# ---- Prune the monorepo down to just what apps/web needs ----
FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune @securevault/web --docker

# ---- Install deps + build ----
FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
# Prisma client generation needs internet access to fetch engine binaries
# — this is a normal build-time step, no DATABASE_URL required for it.
RUN pnpm turbo run build --filter=@securevault/web

# ---- Minimal runtime image ----
FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

CMD ["node", "apps/web/server.js"]
