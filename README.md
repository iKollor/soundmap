# Mapa Sonoro

> Explora, escucha y mezcla los sonidos de Guayaquil 🎧🗺️

A community-driven web platform for mapping, listening to, and mixing sounds from Guayaquil, Ecuador.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), Tailwind CSS, shadcn/ui
- **Backend:** Next.js Server Actions + API Routes
- **Database:** PostgreSQL + PostGIS
- **ORM:** Drizzle ORM
- **Queue:** Redis + BullMQ
- **Storage:** MinIO (S3-compatible)
- **Auth:** Keycloak (external instance)
- **Monorepo:** Turborepo + pnpm

## Project Structure

```
soundmap/
├── apps/
│   ├── web/          # Next.js frontend + API
│   └── worker/       # BullMQ job processor (transcoding, waveforms)
├── packages/
│   ├── database/     # Drizzle schema + migrations
│   └── shared/       # Types, validators, constants
└── docker/           # Docker configs
```

## Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- Docker & Docker Compose

## Getting Started

### 1. Clone and Install

```bash
# Clone the repository
git clone <repo-url> soundmap
cd soundmap

# Copy environment variables
cp .env.example .env

# Install dependencies
pnpm install
```

### 2. Start Docker Services

```bash
# Start PostgreSQL, MinIO, and Redis
pnpm docker:up

# Verify services are running
docker compose ps
```

### 3. Setup Database

```bash
# Generate migrations
pnpm db:generate

# Push schema to database
pnpm db:push

# (Optional) Open Drizzle Studio
pnpm db:studio
```

### 4. Configure Keycloak

Update `.env` with your external Keycloak settings:

```env
KEYCLOAK_ISSUER=https://your-keycloak.com/realms/mapa-sonoro
KEYCLOAK_CLIENT_ID=web-app
KEYCLOAK_CLIENT_SECRET=your-secret
```

### 5. Start Development

```bash
# Start all apps in development mode
pnpm dev
```

- **Web App:** http://localhost:3000
- **MinIO Console:** http://localhost:9001 (minioadmin/minioadmin)

## Docker Services

| Service  | Port(s)     | Description                |
|----------|-------------|----------------------------|
| postgres | 5432        | PostgreSQL + PostGIS       |
| minio    | 9000, 9001  | S3-compatible storage      |
| redis    | 6379        | BullMQ job queue           |

## License

MIT
