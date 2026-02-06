# Using a multi-stage build for efficiency
FROM node:22-alpine AS base

# Install system dependencies
RUN apk add --no-cache ffmpeg python3 make g++

# Enable corepack for pnpm
RUN corepack enable

WORKDIR /app

# Copy root configuration files for pnpm workspace
COPY pnpm-lock.yaml package.json turbo.json pnpm-workspace.yaml .npmrc ./
COPY tsconfig.json ./tsconfig.json

# Copy packages needed for the worker
COPY packages/shared ./packages/shared
# If database package is needed, uncomment:
# COPY packages/database ./packages/database

# Copy the worker app
COPY apps/worker ./apps/worker

# Install dependencies (frozen-lockfile for consistency)
# We filter to install only necessary deps + workspace deps
RUN pnpm install --frozen-lockfile

# Build the worker
# Need to build shared packages first if they have build steps, or rely on Turbo
WORKDIR /app/apps/worker
RUN pnpm build

# Start the worker
CMD ["node", "dist/index.js"]
