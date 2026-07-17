# Moto Platform

Multi-tenant car dealership platform: every dealership gets a premium storefront at
`/{dealer-slug}`, a mobile-first admin dashboard at `/admin`, and online vehicle
deposits via Flutterwave. Operated through a super-admin panel at `/platform`.

Built with Next.js 15 (App Router), TypeScript, Tailwind CSS 4 + shadcn/ui,
Prisma + PostgreSQL. Full product spec lives in [CLAUDE.md](CLAUDE.md); the staged
build plan lives in [staged-build-plan-claude-code.md](staged-build-plan-claude-code.md).

## Local development

Prerequisites: Node.js 20+, Docker Desktop.

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (defaults work for local dev)
cp .env.example .env

# 3. Start PostgreSQL
docker compose up -d

# 4. Run the app
npm run dev
```

Open http://localhost:3000 — the marketing page links to a demo storefront,
the dealer dashboard, and the platform admin shell.

## Scripts

| Script                 | What it does                          |
| ---------------------- | ------------------------------------- |
| `npm run dev`          | Start the dev server                  |
| `npm run build`        | Production build                      |
| `npm run lint`         | ESLint                                |
| `npm run typecheck`    | TypeScript, no emit                   |
| `npm run test`         | Vitest, single run                    |
| `npm run format`       | Prettier write                        |

## Structure

```
src/
  app/                  # routes: marketing, /{dealerSlug}, /admin, /platform
  components/ui/        # shadcn/ui-style design-system components
  components/layout/    # navigation shells (admin sidebar/tab bar, headers)
  features/             # feature modules (inventory, auth, tenancy, payments, leads, settings)
  lib/                  # env validation, logger, shared utilities
prisma/                 # Prisma schema (models arrive in Stage 1)
```

CI (GitHub Actions) runs lint → typecheck → test on every push and PR.
