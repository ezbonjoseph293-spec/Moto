# Moto Platform

Multi-tenant car dealership platform: every dealership gets a premium storefront at
`/{dealer-slug}`, a mobile-first admin dashboard at `/admin`, and online vehicle
deposits via Flutterwave. Operated through a super-admin panel at `/platform`.

Built with Next.js 15 (App Router), TypeScript, Tailwind CSS 4 + shadcn/ui,
Prisma + PostgreSQL. Full product spec lives in [CLAUDE.md](CLAUDE.md); the staged
build plan lives in [staged-build-plan-claude-code.md](staged-build-plan-claude-code.md).

## Local development

Prerequisites: Node.js 20+, and a PostgreSQL database — either Docker Desktop
(local Postgres via `docker compose`) or a managed instance (e.g. Supabase).

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Fill in DATABASE_URL / DIRECT_URL — see the comments in .env.example for
# local Docker Postgres vs. Supabase pooler setup.

# 3. Start PostgreSQL (skip if pointing at a managed instance like Supabase)
docker compose up -d

# 4. Run migrations and seed demo data
npm run db:migrate
npm run seed

# 5. Run the app
npm run dev
```

Open http://localhost:3000 — the marketing page links to a demo storefront,
the dealer dashboard, and the platform admin shell.

Seeded login (all roles): password `Password123!` — e.g.
`owner@prestige-motors-kampala.example`, `admin@moto.example` (platform admin).

## Scripts

| Script               | What it does                              |
| -------------------- | ----------------------------------------- |
| `npm run dev`        | Start the dev server                      |
| `npm run build`      | Production build                          |
| `npm run lint`       | ESLint                                    |
| `npm run typecheck`  | TypeScript, no emit                       |
| `npm run test`       | Vitest, single run                        |
| `npm run format`     | Prettier write                            |
| `npm run db:migrate` | Create/apply a Prisma migration (dev)     |
| `npm run db:deploy`  | Apply existing migrations (CI/production) |
| `npm run db:studio`  | Open Prisma Studio                        |
| `npm run seed`       | Wipe and reseed 2 demo dealerships        |

## Structure

```
src/
  app/                  # routes: marketing, /{dealerSlug}, /admin, /platform
  components/ui/        # shadcn/ui-style design-system components
  components/layout/    # navigation shells (admin sidebar/tab bar, headers)
  features/             # feature modules (inventory, auth, tenancy, payments, leads, settings)
  lib/                  # env validation, logger, shared utilities
prisma/                 # Prisma schema, migrations, seed script
```

Dealer-owned data must only be accessed through the tenant-scoped client —
see [src/features/tenancy/README.md](src/features/tenancy/README.md).

CI (GitHub Actions) runs lint → typecheck → migrate → test on every push and
PR, against a throwaway Postgres service container (not Supabase).
