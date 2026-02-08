# syntax=docker/dockerfile:1

# ==========================================
# Base image with Node.js and pnpm
# ==========================================
FROM node:22.14-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# ==========================================
# Build arguments (injected by Coolify)
# ==========================================
ARG COOLIFY_URL
ARG NEXT_PUBLIC_MAP_STYLE_URL
ARG POSTGRES_USER
ARG POSTGRES_PASSWORD
ARG POSTGRES_DB
ARG S3_ACCESS_KEY
ARG S3_SECRET_KEY
ARG S3_BUCKET_SOUNDS
ARG S3_BUCKET_WAVEFORMS
ARG GARAGE_ADMIN_TOKEN
ARG GARAGE_RPC_SECRET
ARG GARAGE_CAPACITY
ARG GARAGE_ZONE
ARG NEXTAUTH_SECRET
ARG KEYCLOAK_ISSUER
ARG KEYCLOAK_CLIENT_ID
ARG KEYCLOAK_CLIENT_SECRET

# ==========================================
# Dependencies pruning stage
# ==========================================
FROM base AS builder
WORKDIR /app

# Install turbo globally
RUN pnpm add -g turbo

# Copy entire monorepo
COPY . .

# Generate pruned workspace for web app
RUN turbo prune @soundmap/web --docker

# ==========================================
# Install dependencies stage
# ==========================================
FROM base AS installer
WORKDIR /app

# Re-declare build args needed for next build
ARG KEYCLOAK_ISSUER
ARG KEYCLOAK_CLIENT_ID
ARG NEXT_PUBLIC_MAP_STYLE_URL

# Copy lockfile and package.json files
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/.npmrc ./.npmrc

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy pruned source code
COPY --from=builder /app/out/full/ .

# Copy root config files
COPY turbo.json turbo.json
COPY tsconfig.json tsconfig.json

# Build the application
RUN pnpm turbo build --filter=@soundmap/web...

# ==========================================
# Production runner stage
# ==========================================
FROM base AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Copy built application
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Runtime environment variables (will be overridden by docker-compose)
ENV DATABASE_URL=""
ENV REDIS_URL=""
ENV S3_ENDPOINT=""
ENV S3_REGION=""
ENV S3_ACCESS_KEY=""
ENV S3_SECRET_KEY=""
ENV S3_BUCKET_SOUNDS=""
ENV S3_BUCKET_WAVEFORMS=""
ENV S3_FORCE_PATH_STYLE=""
ENV NEXT_PUBLIC_APP_URL=""
ENV NEXT_PUBLIC_MAP_STYLE_URL=""
ENV NEXTAUTH_URL=""
ENV NEXTAUTH_SECRET=""
ENV KEYCLOAK_ISSUER=""
ENV KEYCLOAK_CLIENT_ID=""
ENV KEYCLOAK_CLIENT_SECRET=""

EXPOSE 3000

# Start the server
CMD ["node", "apps/web/server.js"]