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

## Stage 2 — Authentication & Roles ✅

- **Auth.js (NextAuth v5) credentials flow**, split into an edge-safe shared
  config (`src/lib/auth.config.ts` — no DB, just reshapes JWT ↔ session) and
  a Node-only full config (`src/lib/auth.ts` — adds the Credentials provider:
  bcrypt compare, Prisma lookup, rate limiting, audit logging, refresh-token
  issuance). The split exists so `middleware.ts` can run on the Edge runtime
  without bundling bcrypt/Prisma.
- **JWT sessions with a revocable server-side refresh token:** every login
  creates a `RefreshToken` row; its id rides in the JWT as `rtid`. Sessions
  are cut off the moment that row is revoked (logout, password reset) —
  independent of the JWT's own 30-day expiry — because `requireRole()`
  re-checks it against the database on every protected request.
- **Two-tier authorization:** `middleware.ts` is a fast, claims-only redirect
  gate (`/admin/**` → OWNER/MANAGER/SALES, `/platform/**` → PLATFORM_ADMIN)
  that only reads the JWT, never touches the database. `requireRole()`
  (`src/features/auth/require-role.ts`) is the authoritative guard used
  inside the actual `/admin` and `/platform` layouts: it re-verifies the user
  is still active and the session's refresh token hasn't been revoked before
  checking the role.
- **Full identity flow:** signup (always creates a CUSTOMER — staff accounts
  come from the Stage 3 onboarding wizard / Stage 7 team invites), email
  verification, login, forgot/reset password — all as `"use server"` Server
  Actions (`src/features/auth/actions.ts`) over core logic in `service.ts`,
  driven by `useActionState` forms under `src/app/(auth)/`.
  Password reset revokes every other active session for that user.
- **Resend email** via `src/lib/mailer.ts`, with a dev fallback that logs the
  email instead of sending when `RESEND_API_KEY` is unset — verification and
  reset links are fully testable locally without a Resend account.
- **Rate limiting** (`src/lib/rate-limit.ts`, in-memory fixed-window) on
  login, signup, forgot-password, and reset-password.
- **Audit logging** (`src/lib/audit.ts`) for every login attempt (success and
  failure), signup, email verification, and password reset request/completion.
- Verified end-to-end against seeded accounts with the dev server running:
  login as OWNER reaches `/admin` and is redirected away from `/platform`;
  login as PLATFORM_ADMIN reaches `/platform`; logout revokes the
  `RefreshToken` row in the database and immediately locks the session out.
- 22 new tests (rate limiter, `requireRole()` with mocked auth/DB, and a
  real-database integration suite for the full auth service — signup,
  verification, refresh-token revocation, password reset) — all passing
  alongside the existing Stage 0/1 suite.
- Fixed a latent bug in `env.ts`: optional env vars declared `.min(1)` failed
  validation against a freshly-copied `.env` because unset Stage 3+ variables
  are blank strings (`FOO=`), not absent — `""` now normalizes to `undefined`
  before validation.

**Next:** Stage 3 — Dealer Onboarding & Website Settings.
