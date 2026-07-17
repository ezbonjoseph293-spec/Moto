# Progress

Tracks completed stages from [staged-build-plan-claude-code.md](staged-build-plan-claude-code.md).

## Stage 0 — Project Foundation ✅

Next.js 15 (App Router) + TypeScript strict mode, feature-based folder
structure (`src/features/{inventory,auth,tenancy,payments,leads,settings}`),
Tailwind + shadcn/ui with the CLAUDE.md design-token system as CSS variables,
Space Grotesk + Inter via `next/font`. Route shells for marketing,
`/{dealerSlug}` storefront, `/admin` (mobile bottom-tab / desktop sidebar),
and `/platform`. ESLint, Prettier, Vitest, GitHub Actions CI (lint →
typecheck → test), pino logger, Zod-validated `env.ts`. Docker Compose for
local Postgres. No database models yet.

## Stage 1 — Database Schema & Tenancy Foundation ✅

- Full Prisma schema covering Phase 1 and Phase 2 (38 models, 24 enums) —
  approved before migrating. See [prisma/schema.prisma](prisma/schema.prisma).
- Vehicle state machine (`DRAFT → AVAILABLE → RESERVED → SOLD`, +
  `ARCHIVED`/`HIDDEN`) and Reservation/PaymentTransaction state machines
  modeled up front, including dispute/refund states Stage 6 will need.
- **Database provider: Supabase Postgres** (decided mid-stage — local Docker
  Postgres was the original plan, but this environment has no Docker and no
  admin rights to start the locally-installed Postgres service). Both
  `DATABASE_URL` and `DIRECT_URL` point at Supabase's **Session pooler**
  (port 5432) — the project's direct connection is IPv6-only (no IPv4
  add-on), and the Transaction pooler (port 6543) proved flaky with Prisma's
  prepared-statement handling in testing. Session pooler is appropriate here
  since the app is a long-running Node process, not serverless/edge.
- Tenant-scoped repository layer at `src/features/tenancy`
  (`forDealership(id)` / `forPlatform()`) built on a Prisma Client
  extension (`$allOperations`) that auto-injects/validates `dealershipId` on
  every dealer-owned model. Any caller-supplied `dealershipId` that disagrees
  with the active scope throws `TenancyViolationError` instead of being
  silently overwritten. Raw `@/lib/prisma` imports outside `src/lib` and
  `src/features/tenancy` are blocked by an ESLint rule
  (`no-restricted-imports` in `eslint.config.mjs`).
- Isolation proven with integration tests against the real database
  (`src/features/tenancy/scoped-client.test.ts`, 9 tests): cross-tenant
  reads return nothing, cross-tenant updates hit zero rows / throw not-found,
  explicit cross-tenant `dealershipId` in a query throws, and `create` always
  stamps the correct tenant.
- Seed script (`prisma/seed.ts`, `npm run seed`): 2 demo dealerships
  (Prestige Motors Kampala, Elite Auto Nairobi), 15 vehicles each across 6
  brands/5 body types with varied status/condition/pricing, 3 collections
  each, 7 policy pages, header/footer menus, per-dealer settings (branding,
  deposit policy), OWNER/MANAGER/SALES users per dealer, a platform admin,
  sample leads, and one completed deposit + reservation.
- CI updated to run migrations against a throwaway Postgres service
  container before tests (decoupled from Supabase credentials).

**Next:** Stage 2 — Authentication & Roles.
