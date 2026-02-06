# Dockerfile for database migrations
FROM node:22.14-alpine

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copy root package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json .npmrc ./

# Copy packages
COPY packages/database ./packages/database
COPY packages/shared ./packages/shared

# Install dependencies
RUN pnpm install --frozen-lockfile --filter=@soundmap/database...

WORKDIR /app/packages/database

# Run migrations (push schema directly to database, --force skips confirmation)
CMD ["pnpm", "db:push", "--force"]
