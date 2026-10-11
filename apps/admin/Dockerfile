# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
RUN npm install -g pnpm@9.12.0 turbo@2.10.4

FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune @securevault/admin --docker

FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN pnpm turbo run build --filter=@securevault/admin

FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=installer --chown=nextjs:nodejs /app/apps/admin/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/admin/.next/static ./apps/admin/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/admin/public ./apps/admin/public

USER nextjs
EXPOSE 3001
ENV PORT=3001
ENV NODE_ENV=production

CMD ["node", "apps/admin/server.js"]
