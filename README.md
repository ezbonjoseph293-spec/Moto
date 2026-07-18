# Moto Platform

Multi-tenant car dealership platform: every dealership gets a premium storefront at
`/{dealer-slug}`, a mobile-first admin dashboard at `/admin`, and online vehicle
deposits via Flutterwave. Operated through a super-admin panel at `/platform`.

Built with Next.js 15 (App Router), TypeScript, Tailwind CSS 4 + shadcn/ui,
Prisma + PostgreSQL. Full product spec lives in [CLAUDE.md](CLAUDE.md); the staged
build plan lives in [staged-build-plan-claude-code.md](staged-build-plan-claude-code.md);
stage-by-stage build notes are in [PROGRESS.md](PROGRESS.md).

- Running a dealership day-to-day? See [ADMIN_GUIDE.md](ADMIN_GUIDE.md).
- Operating the platform (onboarding dealers, billing, disputes)? See
  [PLATFORM_GUIDE.md](PLATFORM_GUIDE.md).
- Deploying to production? See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md).

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

## Deployment (Vercel + managed Postgres)

The app is a single Next.js deployable — no separate API server. See
[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) for the full go-live
checklist; this section covers the mechanics.

1. **Database.** Provision a managed Postgres instance (Supabase, Neon, or
   Railway all work). If using Supabase, point both `DATABASE_URL` and
   `DIRECT_URL` at the **Session pooler** connection string (port 5432) —
   this app is a long-running Node process, not serverless/edge, and the
   Session pooler is the one that supports Prisma's prepared statements.
   Neon/Railway: use their standard connection string for both variables.
2. **Vercel project.** Import the repo, set the framework preset to Next.js.
   Add every variable from `.env.example` under Project Settings →
   Environment Variables (Production, and Preview if you want preview
   deployments to work against a separate/staging database). At minimum for
   production: `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `AUTH_URL`,
   `NEXT_PUBLIC_APP_URL`, `CRON_SECRET` (required — `env.ts` refuses to boot
   without it once `NODE_ENV=production`), Cloudinary, Flutterwave (+
   `FLUTTERWAVE_WEBHOOK_SECRET_HASH`, also required once
   `FLUTTERWAVE_SECRET_KEY` is set), Africa's Talking, Resend.
3. **Migrations.** Vercel's build does not run `prisma migrate deploy`
   automatically — add it as the project's Build Command:
   `npm run db:deploy && npm run build`. This applies any pending migrations
   before the new build goes live; it's a no-op when there are none.
4. **Cron jobs.** `vercel.json` already declares the three scheduled jobs
   (publish-scheduled, expire-reservations, subscription-dunning) — Vercel
   picks these up automatically on deploy, no extra configuration needed.
   Confirm they're listed under Project Settings → Cron Jobs after the first
   deploy.
5. **Flutterwave webhook.** In the Flutterwave dashboard, set the webhook URL
   to `https://<your-domain>/api/webhooks/flutterwave` and copy the "secret
   hash" you configure there into `FLUTTERWAVE_WEBHOOK_SECRET_HASH`.
6. **Cloudinary.** No server-side config needed beyond the three env vars —
   uploads go straight from the browser to Cloudinary using signatures this
   app issues (`/api/uploads/sign`).
7. **First dealer.** Once deployed, either run `npm run seed` against the
   production database for a demo dealer (not recommended past initial
   testing), or have a real dealership sign up through `/onboarding` — see
   [PLATFORM_GUIDE.md](PLATFORM_GUIDE.md).

### Backups

Managed Postgres providers (Supabase, Neon, Railway) all offer automatic
daily backups with point-in-time recovery on their paid tiers — enable this
before onboarding any real dealership, since this app has no separate backup
job of its own. Before any risky manual operation against production data
(bulk migration, manual data fix), take an on-demand snapshot first if your
provider supports it.

### Security headers & CSP

`next.config.ts` sets `X-Frame-Options`, `X-Content-Type-Options`,
`Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`, and a
`Content-Security-Policy` that allows Flutterwave's checkout domains (needed
for the deposit/subscription payment flow) and Cloudinary images, and denies
everything else by default. If you add another third-party script/embed
(analytics, chat widget), extend `CONTENT_SECURITY_POLICY` in that file
rather than loosening it wholesale.
