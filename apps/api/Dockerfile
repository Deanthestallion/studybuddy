# ── Builder ──────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Prisma needs OpenSSL (and glibc shim) on Alpine to fetch/run its query engine.
RUN apk add --no-cache openssl libc6-compat

# Install workspace deps using the lockfile (root + workspaces).
# --include=dev guarantees build tools (tsup, prisma, typescript) are installed
# even if NODE_ENV=production leaks into the build.
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
RUN npm install --include=dev

# Copy sources and build against the Postgres schema (production).
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
RUN npm run build:prod --workspace=@studybuddy/api

# ── Runner ───────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Runtime also needs OpenSSL for the Prisma engine.
RUN apk add --no-cache openssl libc6-compat

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

WORKDIR /app/apps/api
EXPOSE 4000

# Sync the Postgres schema then boot. (Switch to `prisma migrate deploy` once you
# commit migration files.)
CMD ["sh", "-c", "npx prisma db push --schema prisma/schema.postgres.prisma --skip-generate && node dist/index.js"]
