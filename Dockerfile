# All-in-one image: one service serves BOTH the API and the built web SPA on a
# single origin. Used for the free single-service Render/Fly deploy.
# (apps/api/Dockerfile remains the API-only image for split deployments.)

# ── Builder ──────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
# Prisma needs OpenSSL on Alpine.
RUN apk add --no-cache openssl libc6-compat

COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
RUN npm install --include=dev

COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
COPY apps/web ./apps/web

# Web calls the API on the same origin (all-in-one). Vite inlines this at build.
ENV VITE_API_URL=/api/v1
RUN npm run build --workspace=@studybuddy/web
# API bundle generated against the Postgres schema.
RUN npm run build:prod --workspace=@studybuddy/api

# ── Runner ───────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV SERVE_WEB=1
RUN apk add --no-cache openssl libc6-compat

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
# Served statically by the API (resolved at ../web/dist relative to apps/api).
COPY --from=builder /app/apps/web/dist ./apps/web/dist

WORKDIR /app/apps/api
EXPOSE 4000

# Sync the Postgres schema, then boot. Binds $PORT (Render/Fly) or API_PORT.
CMD ["sh", "-c", "npx prisma db push --schema prisma/schema.postgres.prisma --skip-generate && node dist/index.js"]
