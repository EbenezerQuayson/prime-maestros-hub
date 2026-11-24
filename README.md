# Prime Maestros Hub (PMH)

> *Discover Your Talent. Master Your Instrument.*

Web platform combining the Prime Maestros Hub public academy website, academy management system, and student learning portal.

## Architecture

- **Frontend (`frontend/`)**: Next.js (App Router), TypeScript, Tailwind CSS
- **Backend (`backend/`)**: NestJS modular monolith, TypeScript, REST API (`/api/v1`)
- **Database & ORM**: PostgreSQL + Prisma
- **Documentation (`documentation/`)**: SRS & System Design Blueprint

## Initial Instruments

1. Acoustic Guitar
2. Bass Guitar
3. Keyboard/Piano
4. Drums

## Getting Started

### 1. Environment Variables

Copy environment templates:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

### 2. Database (PostgreSQL)

Start PostgreSQL (and Mailpit for local email testing) via Docker:

```bash
docker compose up -d
```

Or point `DATABASE_URL` in `backend/.env` to your local PostgreSQL instance.

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Generate Prisma Client, Run Migrations, and Seed

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

### 5. Run Development Servers

```bash
# Terminal 1 - NestJS API (http://localhost:4000/api/v1)
pnpm dev:backend

# Terminal 2 - Next.js Frontend (http://localhost:3000)
pnpm dev:frontend
```

## Useful Workspace Scripts

- `pnpm build` — Build both backend and frontend
- `pnpm lint` — Lint both packages
- `pnpm test` — Run tests across packages
- `pnpm db:studio` — Open Prisma Studio
