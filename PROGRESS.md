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

## Stage 3 — Dealer Onboarding & Website Settings ✅

- **Public onboarding entry point** (`/onboarding`, `src/features/onboarding/`):
  a single form (dealership name, owner name, email, password) creates
  `Dealership` + a default `Setting` row + an `OWNER` user in one transaction
  (`onboarding/service.ts`), reusing the Stage 2 email-verification flow —
  staff accounts still only ever originate here or from Stage 7 team invites,
  never the open customer signup form. The dealer's slug is generated and
  de-duplicated by a new shared util, `src/lib/slug.ts` (`generateUniqueDealerSlug`),
  which `prisma/seed.ts` now also uses instead of its own copy.
- **`Dealership.onboardingCompletedAt`** (new nullable column, one migration)
  gates a multi-step wizard at `/admin/onboarding` — Branding → Contact →
  Deposit policy → Publish — built from the same forms and Server Actions as
  the ongoing Settings module (see below), so there's exactly one code path
  that writes `Setting`, not two. `/admin` redirects an `OWNER` there until
  it's set; the Publish step shows the live storefront URL with copy and
  "Share to WhatsApp" actions before marking onboarding complete.
- **`src/features/settings/`** — the ongoing "change literally everything"
  module: Zod schemas (`schema.ts`), a service layer over `forDealership()`
  that audit-logs every mutation (`service.ts`), and Server Actions
  (`actions.ts`) restricted to `OWNER`/`MANAGER`. `/admin/settings` renders it
  as five tabs (Branding, Contact, Navigation, Announcement, Deposit policy)
  built on new `Tabs`/`Select`/`Switch`/`Textarea` primitives
  (`@radix-ui/react-{tabs,select,switch}`, matching the existing shadcn/ui
  component style). Header/footer navigation is plain `Menu` CRUD with
  up/down reordering (no drag-and-drop dependency — not worth it for a
  handful of links).
- **Cloudinary**, implemented without the Cloudinary SDK: `src/lib/cloudinary.ts`
  signs direct-to-browser uploads with Node's built-in `crypto` (SHA-1, per
  Cloudinary's documented signing algorithm), and `/api/uploads/sign` hands
  out a short-lived signature scoped to the caller's own dealership folder
  (`dealers/{dealershipId}/{branding|favicon}`). `ImageUpload`
  (`src/components/media/image-upload.tsx`) uploads directly to Cloudinary
  from the browser — the file never touches our server — but always keeps a
  manual "paste an image URL" fallback, so logo/favicon fields work even
  before a dealer (or this environment) has real Cloudinary credentials
  configured; the Cloudinary env vars stay optional-until-configured rather
  than hard-required, consistent with how `mailer.ts` already degrades
  gracefully without `RESEND_API_KEY`.
- **Storefront resolution**: `/{dealerSlug}` now resolves the dealer from the
  database (`layout.tsx`), 404ing cleanly for unknown slugs. Branding applies
  via inline-scoped CSS variables (`--brand`, `--radius`, `--font-heading`) so
  it can never leak between dealers on the same server — no client JS, no
  global state. Header/footer render the dealer's real logo, nav, contact
  info, WhatsApp deep link, business hours, socials, and an embedded
  OpenStreetMap pin (zero API key needed) when coordinates are set. The
  announcement bar and homepage both reflect real `Setting` data instead of
  the Stage 0 placeholder chrome.
- Verified end-to-end against the seeded database with the dev server
  running: storefront pages for both seeded dealers render their real
  branding/contact/nav/hours; an unknown slug 404s; logging in as a seeded
  `OWNER` reaches `/admin/settings` and all five tabs render with the
  dealer's existing data pre-filled.
- 40 existing tests still green (typecheck, lint, and `next build` all clean).
  No new automated tests added this stage — Stage 3 is UI/forms/integration
  work over already-tested tenancy and auth primitives; the state-machine and
  webhook-heavy stages ahead (6, 8) are where new integration test coverage
  matters most.

## Stage 4 — Inventory Management ✅

- **`src/features/inventory/`** — the full vehicle CRUD module, following the
  Stage 3 settings conventions: Zod schemas (`schema.ts`), a service layer
  over `forDealership()` that audit-logs every mutation (`service.ts`), and
  role-gated Server Actions (`actions.ts`). Vehicle/media create/update/delete
  is open to `OWNER`/`MANAGER`/`SALES` (a salesperson can list a car from
  their phone); brands, body types, collections, bulk actions, and CSV
  import/export are `OWNER`/`MANAGER` only.
- **State machine**: `VEHICLE_STATUS_TRANSITIONS` in `schema.ts` is the single
  source of truth for legal `DRAFT → AVAILABLE → RESERVED → SOLD (+ ARCHIVED
  / HIDDEN)` moves. `transitionVehicleStatus()` validates against it and
  audit-logs every change (`vehicle.status.<from>_to_<to>`); `RESERVED` is
  deliberately unreachable from the admin UI — the transitions list filters
  it out everywhere it's rendered, since only the Stage 6 payment webhook may
  set it.
- **Media**: multi-image upload with drag-to-reorder (`@dnd-kit`) and cover
  selection (`vehicle-image-manager.tsx`), video-by-URL, and PDF brochure
  upload (`vehicle-document-manager.tsx`, Cloudinary `resource_type=raw`) —
  all direct-to-Cloudinary via a shared `uploadToCloudinary()` client helper
  (`src/components/media/upload-file.ts`) built on the Stage 3 signing route,
  which now issues signatures for 6 more purposes (`vehicle-images`,
  `vehicle-videos`, `vehicle-documents`, `brands`, `body-types`,
  `collections`) alongside the original `branding`/`favicon`.
- **Brands & body types**: CRUD with logo/icon upload, manual reordering
  (same swap-order pattern as Stage 3 menus), delete blocked while any
  vehicle still references the row.
- **Collections**: `MANUAL` (pick vehicles via `CollectionMembershipManager`)
  and `RULE_BASED` (an AND-only rule builder over price/year/mileage/
  condition/brand/body type/status, serialized to `Collection.ruleConfig`
  JSON). Rule-based membership is evaluated **live** on every read
  (`getCollectionVehicles()` → `ruleConfigToWhere()`) rather than
  materialized into `CollectionVehicle` rows, so it can never go stale —
  Stage 5's storefront will call the same function.
- **Bulk actions**: multi-select table (`vehicle-table.tsx`) with status
  change, delete, and pricing (set / ±% ) — each bulk op writes one summary
  AuditLog entry plus the normal per-vehicle transition logs.
- **CSV import/export** (`papaparse`): export includes every spec field with
  brand/body-type names resolved; import validates row-by-row against
  `csvVehicleRowSchema`, resolves brand/body-type by case-insensitive name
  match, and returns a `{ imported, errors: [{row, message}] }` report —
  good rows commit even when others fail.
- **Scheduled publishing**: `Vehicle.publishAt` (already in the Stage 1
  schema) is honored by `publishScheduledVehicles()`, run for every
  dealership by a new Vercel Cron target, `GET /api/cron/publish-scheduled`
  (`vercel.json`, every 15 minutes), guarded by a `CRON_SECRET` bearer token
  that's optional in local dev so the feature is testable without
  provisioning one. This is the project's first background job — the
  `src/lib` job infrastructure CLAUDE.md describes for Stages 6/8 (expiry,
  dunning) can follow the same pattern.
- **Admin UI**: `/admin/inventory` (searchable/filterable/paginated vehicle
  table), `/admin/inventory/new` and `/admin/inventory/{id}` (create/edit +
  media managers + status control + duplicate/delete),
  `/admin/inventory/brands` (brands + body types side by side), and
  `/admin/inventory/collections` (+ `/new`, `/{id}`) — tied together by an
  `InventorySubNav` in-page tab strip (Vehicles / Brands & body types /
  Collections) rather than a new top-level sidebar entry, since the existing
  `adminNavItems` sidebar is a flat single-level list.
- Added shadcn/ui primitives needed for CRUD UI (`table`, `dialog`,
  `dropdown-menu`, `checkbox`, `pagination`, `alert-dialog`, `popover`,
  `command`, `separator`) — installed via the shadcn CLI, `button.tsx`
  reverted back to the Stage 0 hand-customized version afterward (the CLI's
  default overwrite has no `inverse` variant, which `platform/layout.tsx`
  depends on) — and new dependencies `@dnd-kit/{core,sortable,utilities}`
  (image reordering) and `papaparse` (CSV).
- Verified end-to-end against the seeded database: logged in as a seeded
  `OWNER` and confirmed `/admin/inventory`, `/admin/inventory/brands`,
  `/admin/inventory/collections`, a vehicle edit page, and a collection
  detail page all render real seeded data (200s, correct content). Ran a
  scripted smoke test through the service layer directly — create → DRAFT,
  transition to AVAILABLE, add an image (auto-cover), duplicate, bulk status
  to SOLD, confirmed an illegal `SOLD → AVAILABLE` transition throws, CSV
  export, cleanup — all passed.
- 40 existing tests still green; `lint`, `typecheck`, and `next build` all
  clean. No new automated tests added this stage — same rationale as Stage
  3, this is CRUD/UI work over the already-tested tenancy and audit
  primitives; the state-machine has an admin-facing guard now but its
  security-critical counterpart (the payment webhook that sets `RESERVED`)
  lands in Stage 6, which is where integration tests for the full state
  machine belong.

## Stage 5 — Public Storefront ✅

- **`src/features/storefront/service.ts`** — every public read goes through
  `forDealership()` and hard-filters to `status: "AVAILABLE"` (never the raw
  admin `listVehicles`), so `DRAFT`/`ARCHIVED`/`HIDDEN`/`SOLD` vehicles can
  never leak onto the storefront regardless of a guessed URL:
  `listPublicVehicles` (search/brand/bodyType/condition/fuel/transmission/
  drive/color/price/year filters + sort + pagination), `getPublicVehicleBySlug`
  (also allows `RESERVED` so a shared link still resolves), `listFeatured/
  LatestVehicles`, `getRelatedVehicles`, `listPublicBrands/BodyTypes`,
  `listPublicCollections` + `getPublicCollectionVehicles` (reuses the Stage 4
  rule-based logic, filtered to `AVAILABLE`), `getPageByKey/BySlug` +
  `listPolicyPages`, `listTestimonials`. `recordVehicleView()` and
  `recordAnalyticsEvent()` are deliberately best-effort (wrapped in
  try/catch) so a database hiccup on the `AnalyticsEvent` write never breaks
  a page render. A tiny `src/features/storefront/actions.ts` exposes
  `trackClickAction` (`"use server"`) so client CTAs (WhatsApp/call/reserve
  buttons) can log `AnalyticsEvent` clicks without a full API route.
- **`src/features/leads/`** built out (was a Stage 7 stub): `schema.ts`
  (`contactFormSchema`, `vehicleInquirySchema`), `service.ts`
  (`createContactLead`, `createVehicleInquiryLead` — both `forDealership()`-
  scoped, audit-logged), `actions.ts` (`submitContactFormAction`,
  `submitVehicleInquiryAction` — public Server Actions, no `requireRole()`,
  IP-rate-limited via the Stage 2 `rateLimit()` helper since these have no
  session to key off). The admin inbox itself (statuses, assignment, notes)
  stays Stage 7.
- **Homepage** (`[dealerSlug]/page.tsx`, replacing the Stage 0/3 placeholder):
  hero using `Setting.tagline`, featured vehicles, latest arrivals, a
  collections row (featured collections only), a "why choose us" grid,
  brand logo strip (featured brands), testimonials (section omitted entirely
  when empty rather than showing a placeholder), and a closing CTA banner —
  plus `AutoDealer` JSON-LD. Every section is conditionally rendered so an
  early-stage dealer with no featured vehicles/collections/testimonials still
  gets a clean page instead of empty boxes.
- **Inventory** (`[dealerSlug]/inventory/`): SSR list driven entirely by
  `searchParams` (shareable/bookmarkable URLs), a filter sidebar on desktop /
  bottom sheet on mobile (`InventoryFilters`, new shadcn `sheet` +
  `accordion` + `skeleton`), a separate `InventorySort` control, and
  `StorefrontPagination` (plain `<a>` links built from the current query
  string, so pagination works without JS). `loading.tsx` skeleton grids on
  both the list and detail routes cover the Suspense gap while a filter
  change streams in new data.
- **Vehicle detail** (`[dealerSlug]/inventory/[slug]/`): a Swiper
  (`VehicleGallery`) main carousel + thumbnail strip with a captioned empty
  state for cars with no photos yet, spec table, features checklist,
  brochure downloads, inline `<video>` playback, a `ShareButton` (Web Share
  API with clipboard fallback), a `VehicleStickyBar` that's a fixed
  price/WhatsApp/call/reserve bar on mobile and a static sidebar block on
  desktop, and a `VehicleInquiryForm` writing straight to the new leads
  service. `Vehicle` JSON-LD included. The "Reserve this car" button links to
  `/reserve?vehicle={slug}` — a stub page (deposit amount computed live from
  `Setting.depositType/depositFixedAmount/depositPercentage` × the vehicle's
  price, hold hours, and refund policy text, all rendered in plain language)
  with a "payment is coming soon" notice; real Flutterwave checkout is Stage
  6, and the page is marked `robots: noindex`.
- **Collections, about, contact, policies**: `/collections` (grid of all
  collections) and `/collections/[slug]` (live membership via the shared
  service function); `/about` renders `Page{key: ABOUT}` with a tagline
  fallback if the dealer hasn't written one yet; `/contact` combines
  `Setting` contact details + the same OpenStreetMap embed used in the
  footer with a `ContactForm` that writes a `CONTACT_FORM` lead. Policy pages
  (`privacy`, `terms`, `cookie-policy`, `warranty`, `returns`, `financing`)
  render at `/{dealerSlug}/{slug}` — a bare `[slug]` catch-all, not
  `/policies/{slug}`, because that's the exact URL shape the Stage 1 seed's
  footer `Menu` rows already use (`/privacy`, `/terms`); Next.js resolves the
  literal `inventory`/`about`/`contact`/`collections`/`reserve` folders
  before falling through to the dynamic segment, so there's no collision.
  `Page.content` is rendered as plain pre-wrapped text, not
  `dangerouslySetInnerHTML` — the Stage 1 seed stores plain paragraphs and
  the Stage 7 rich-text editor (with whatever sanitization it lands with)
  hasn't shipped yet.
- **SEO**: `src/lib/seo.ts` (`vehicleJsonLd`, `autoDealerJsonLd`, `dealerUrl`/
  `siteUrl` off `NEXT_PUBLIC_APP_URL`), per-page `generateMetadata` with
  canonical URLs on every storefront route, and a per-dealer
  `[dealerSlug]/sitemap.xml` + `[dealerSlug]/robots.txt` implemented as
  Route Handlers (not the `sitemap.ts`/`robots.ts` file convention, which
  doesn't cleanly support enumerating URLs under a *dynamic* segment) —
  `sitemap.xml` lists the dealer's available vehicles, collections, and
  policy pages with `lastmod`; `robots.txt` disallows `/reserve` and points
  back at that dealer's own sitemap.
- **New dependencies**: `swiper` (gallery) and `framer-motion` (installed per
  CLAUDE.md §1; not yet used for page-transition polish — that's a Stage 9
  polish-pass candidate). New shadcn/ui primitives: `accordion`, `skeleton`,
  `sheet`, `avatar` (installed via CLI; `button.tsx` checked afterward and
  was **not** overwritten this time, unlike Stage 4). `next.config.ts` now
  declares `images.remotePatterns` for `res.cloudinary.com` so vehicle photos
  get real Next/Image optimization on the public, perf-sensitive storefront
  instead of the admin's `unoptimized` shortcut.
- Verified end-to-end against the seeded database with the dev server
  running: home/inventory/vehicle-detail/collections/about/contact/reserve/
  sitemap.xml/robots.txt all 200 for `prestige-motors-kampala`, an unknown
  slug 404s, inventory price/brand/year filtering and sorting all produce
  200s, the reserve stub correctly computes a live deposit amount (UGX
  5,100,000 = 15% of a 34,000,000 UGX vehicle) from `Setting`, and
  `createContactLead`/`createVehicleInquiryLead` were smoke-tested directly
  against the database (created rows with the right `source`/`vehicleId`,
  then cleaned up). `lint`, `typecheck`, and `next build` are clean; all 40
  existing tests still pass. No new automated tests added this stage — same
  rationale as Stages 3/4, this is read-heavy UI work over already-tested
  tenancy primitives, plus two small, low-risk public write paths
  (`createContactLead`/`createVehicleInquiryLead`) that mirror the
  already-tested `forDealership()` scoping; Stage 6's webhook and state
  machine is where the next real integration-test investment belongs.

## Stage 6 — Deposits & Reservations ✅

Payment design (flow, webhook verification, idempotency, the full
Reservation/PaymentTransaction state machine, expiry job, and every failure
mode) was presented and approved before any code was written, per the Stage
6 gate.

- **`src/lib/flutterwave.ts`**: `initiatePayment()` (Standard hosted checkout
  — one integration covers MTN MoMo, Airtel Money, and card),
  `verifyTransaction()` (server-to-server re-fetch from Flutterwave's API —
  the only source of truth for payment status; the webhook payload itself is
  never trusted), and `isValidWebhookHash()` (constant-time comparison of the
  `verif-hash` header against `FLUTTERWAVE_WEBHOOK_SECRET_HASH`).
  **`src/lib/sms.ts`**: Africa's Talking over plain REST (no SDK dependency),
  mirroring `mailer.ts`'s dev-log fallback when credentials aren't
  configured.
- **`src/features/payments/service.ts`** is the state machine's single home:
  - `initiateReservation()` creates `Reservation` (`PENDING_PAYMENT`) +
    `PaymentTransaction` (`PENDING`, `providerRef` = `dep_{reservationId}`)
    without touching the vehicle — it only ever flips to `RESERVED` once a
    webhook verifies payment, so an abandoned or slow checkout never blocks
    the car for other buyers.
  - `processFlutterwaveWebhookEvent()` is idempotent (looks up
    `PaymentTransaction` by `providerRef`, short-circuits once it's already
    non-`PENDING` — safe under Flutterwave's at-least-once retries and
    replay) and treats the payload as a trigger only, re-verifying via
    `verifyTransaction()` before mutating anything.
  - `settleVerifiedPayment()` is the safety-critical step: one
    `prisma.$transaction` that marks the `PaymentTransaction` `SUCCESSFUL`
    and atomically tries `UPDATE Vehicle SET status='RESERVED' WHERE
    status='AVAILABLE'`. Whichever of two concurrent buyers' webhooks wins
    that conditional update gets `ACTIVE` + the car; the loser's deposit was
    still captured, so their reservation becomes `REFUND_PENDING` instead of
    silently disappearing — proven under real concurrent load in tests (two
    `processFlutterwaveWebhookEvent()` calls via `Promise.all` on one
    vehicle, not just sequential calls).
  - `expireStaleReservations()` (per-dealership, called by the cron below):
    releases `ACTIVE` holds past `holdExpiresAt` back to `AVAILABLE` +
    `refundStatus: "PENDING"`, and separately cancels `PENDING_PAYMENT`
    reservations abandoned for 2+ hours with no webhook ever received.
  - `syncReservationOnVehicleRelease()`, called from
    `inventory/service.ts`'s `transitionVehicleStatus()` whenever a vehicle
    leaves `RESERVED`: dealer marks it `SOLD` → reservation `COMPLETED`;
    dealer releases it back to `AVAILABLE`/`ARCHIVED` → reservation
    `CANCELLED` + refund flagged. Without this hook a dealer completing or
    reversing a sale by hand would leave the reservation's hold timer
    running against a car that already moved on.
  - Admin actions: `markReservationRefunded()`/`markReservationDisputed()`,
    both audit-logged; `getReservationHistory()` reads the same `AuditLog`
    rows back out for the per-reservation transition timeline.
- **Webhook route** (`/api/webhooks/flutterwave`): rejects (401, no DB
  writes) unless `verif-hash` matches via `timingSafeEqual`; on an
  unexpected processing error it 500s deliberately so Flutterwave retries —
  safe because the handler is idempotent.
- **Expiry cron** (`/api/cron/expire-reservations`, `vercel.json` every 10
  min, same `CRON_SECRET`-guarded pattern as Stage 4's publish job).
- **Buyer flow**: `/{dealerSlug}/reserve` now renders a real `ReserveForm`
  (name/phone/email → `initiateReservationAction`, rate-limited like the
  Stage 5 lead forms) whenever the vehicle is `AVAILABLE`, the computed
  deposit is positive, and `FLUTTERWAVE_SECRET_KEY` is configured — falling
  back to the existing "contact the dealer" messaging otherwise, same as
  Stage 3–5's Cloudinary-optional pattern. On success the action redirects
  straight to the Flutterwave checkout URL. `/reserve/callback` (top-level,
  outside the `[dealerSlug]` tree — it only needs a `tx_ref`) polls
  `getReservationStatusAction()` every 3s for up to ~2 minutes and never
  trusts Flutterwave's own redirect query params to declare success, since
  the webhook can land after the redirect.
- **`/admin/deposits`**: list with status-filter tabs, a live
  `HoldCountdown` for `ACTIVE` reservations; **`/admin/deposits/[id]`**:
  full reservation + payment-transaction detail, mark-refunded/mark-disputed
  forms (`OWNER`/`MANAGER` only), and the `AuditLog`-backed transition
  history. `computeDepositAmount()` moved into the payments service so the
  reserve page, the initiate-reservation service call, and (later) any admin
  preview all compute it identically instead of three copies of the same
  percentage/fixed logic.
- **Tests** (`src/features/payments/service.test.ts`, 12 new, real database):
  valid webhook → `ACTIVE` + vehicle `RESERVED`; failed verification →
  `CANCELLED`; `charge.failed` cancels without ever calling `verifyTransaction`;
  a replayed successful webhook is a no-op (one `Lead`, `verifyTransaction`
  called exactly once); two reservations racing on one vehicle under real
  `Promise.all` concurrency → exactly one `ACTIVE`, one `REFUND_PENDING`;
  expiry releases a stale hold and separately cancels an abandoned checkout
  but leaves a fresh one alone; `syncReservationOnVehicleRelease()` for both
  the SOLD and released-back-to-AVAILABLE paths; the two admin actions.
  Total suite: 40 → 52 tests, all passing.
- Found and fixed a real bug surfaced by the concurrency test, not a test
  artifact: `settleVerifiedPayment`'s interactive transaction did five-plus
  sequential round-trips over Supabase's session pooler and blew past
  Prisma's default 5s interactive-transaction timeout ("Transaction not
  found" mid-transaction). Fixed by parallelizing the independent reads
  inside the transaction with `Promise.all` and raising `timeout`/`maxWait`
  on all three multi-step `$transaction` calls in this feature — the earlier
  full-suite run's `password reset` timeouts in Stage 2's tests were a
  symptom of the same pooler contention from running everything concurrently
  and cleared up once this was fixed.
- Verified end-to-end against the seeded database with the dev server
  running: `/reserve` correctly shows the "not configured" fallback with no
  Flutterwave keys set locally; the webhook route 401s with no `verif-hash`
  header; the cron endpoint runs and returns counts; `/admin/deposits` and
  `/admin/deposits/[id]` render real seeded reservations for a logged-in
  `OWNER`. Ran the full happy path against a real seeded vehicle with
  Flutterwave's HTTP calls stubbed (verify → successful): reservation
  reached `ACTIVE` with a hold expiry, vehicle flipped to `RESERVED`, SMS
  dev-logged the confirmation — then cleaned up. `lint`, `typecheck`, and
  `next build` are all clean.

## Stage 7 — Leads Inbox & Content ✅

- **Schema**: `StaffInvite` model (email/role/token/expiry/status, added to
  `DEALER_OWNED_MODELS` so `forDealership()` scopes it like every other
  dealer table) and two notification-preference booleans on `Setting`
  (`notifyNewLeadEmail`, `notifyNewLeadSms`).
- **Leads inbox finished** (`src/features/leads/`, was a Stage 5 stub for
  writes only): `listLeads`/`getLead` (search/status/source/assignee
  filters, pagination), `updateLeadStatus`/`assignLead`/`addLeadNote`
  (all audit-logged), `listAssignableStaff`. `createContactLead`/
  `createVehicleInquiryLead` now call `notifyDealerOfNewLead()` — a
  `Notification` row always, plus email/SMS to the dealer's `Setting.email`/
  `phonePrimary` gated by the two new preference booleans; wrapped so a
  notification failure can never break lead creation itself.
  `/admin/leads` (status-tab list, matching the Stage 6 deposits page
  pattern, plus source/assignee filters) and `/admin/leads/[id]` (status
  select, assignee select, notes timeline) replace the stub.
- **Pages & policies**: added Markdown rendering
  (`src/components/content/markdown-content.tsx`, `react-markdown` — never
  renders raw HTML, so dealer-authored content can't inject script tags) and
  swapped it in on the two storefront routes that previously rendered
  `Page.content` as plain `whitespace-pre-line` text (`/about`, the policy
  catch-all `/[slug]`). `/admin/settings/pages` lists the 7 seeded pages;
  `/admin/settings/pages/[id]` is a Markdown textarea with a live preview
  toggle (same `MarkdownContent` component) and a save-history panel read
  from `AuditLog` — versioning stays audit-log-based as originally decided
  in Stage 5, no new revisions table.
- **Testimonials CRUD** (`src/features/settings/`, extends the existing
  settings service/actions rather than a new feature folder): dialog-based
  create/edit (`testimonial-form-dialog.tsx`, following the Stage 4
  `BodyTypeFormDialog` pattern exactly, including Cloudinary photo upload —
  added a `testimonials` upload purpose) and a list manager, both new tabs
  on `/admin/settings`. No new storefront work needed — Stage 5's homepage
  already reads `listTestimonials()` and hides the section when empty.
- **Team management** (`src/features/team/`, new feature): `StaffInvite`
  rows carry no password — the invited person sets their own on accept, so
  there's no intermediate "temporary password" to leak. `inviteStaff()`
  blocks a duplicate invite or an already-registered email; `acceptInvite()`
  looks the token up via `forPlatform()` (same reasoning as
  `verifyEmailToken()` — the tenant isn't known until the token resolves it)
  then creates the `User` pre-verified and marks the invite `ACCEPTED`.
  `updateStaffRole()`/`setStaffActive()` refuse to touch an `OWNER` row
  (there is exactly one owner per dealership, created at onboarding) and
  deactivating a staff member revokes every one of their `RefreshToken` rows
  via Stage 2's `revokeAllRefreshTokensForUser()`, so a deactivated
  salesperson is logged out immediately, not just blocked on next login.
  Invites are restricted to `MANAGER`/`SALES` and every team action requires
  `OWNER` — a `MANAGER` can see the "Pages" settings tab but not "Team".
  Public accept flow at `/accept-invite` (new `(auth)` route, mirrors
  `/verify-email`/`/reset-password`'s shape: invalid/expired token gets its
  own message, valid token renders `AcceptInviteForm`). `/admin/settings/team`
  brings together the invite form, pending-invite list (with revoke), a
  staff table (inline role change via `Select`, deactivate/reactivate — the
  signed-in owner's own row is read-only), and an activity log reading
  `AuditLog` for the dealership (all Stage 1–7 audit-logged actions show up
  here, not just team events, since that's a more useful "what happened
  today" view for an owner than a team-only filter).
- **New dependency**: `react-markdown` (no `dangerouslySetInnerHTML`
  anywhere in the codebase now, before or after this stage).
- Verified end-to-end with a scripted smoke test run directly against the
  service layer against the seeded database (bypassing browser auth, same
  approach as Stage 4): created a contact lead → confirmed the dealer
  notification dev-logged → listed/filtered leads → status/assign/note all
  landed correctly; edited a policy page's content → confirmed an `AuditLog`
  history entry → restored the original content; created/updated/deleted a
  testimonial; toggled notification preferences; ran the full team lifecycle
  (invite → block duplicate invite → look up by token → accept → new user is
  `SALES`/active/pre-verified → change role to `MANAGER` → deactivate →
  confirm `isActive: false` → activity log shows all of it in order) — all
  passed, then cleaned up every row it created. Separately confirmed
  `/admin/leads` and `/admin/settings` redirect to `/login` unauthenticated,
  and that the Markdown-rendered `/about`/`/terms` storefront pages return
  200 with a real `<h1>`. `lint`, `typecheck`, `next build` (all 30+ routes
  including the 6 new ones), and the existing 52-test suite are all green —
  no new automated tests added this stage, consistent with Stages 3–5's
  rationale (CRUD/UI work over already-tested tenancy/audit primitives; the
  one genuinely new piece of security surface, `StaffInvite` tenant scoping,
  was covered by adding it to `DEALER_OWNED_MODELS` and exercising it in the
  smoke test rather than a new isolation-test file).

## Stage 8 — Subscriptions & Platform Admin ✅

- **Billing model decision** (presented and approved before building): Flutterwave's
  MoMo/Airtel rails can't silently auto-charge like tokenized card billing, so
  recurring billing here is "invoice + pay-now link" — the dunning cron marks
  a period due and reminds the dealer by email/SMS with a link to
  `/admin/billing`; paying (the same Standard checkout Stage 6 built for
  deposits) is what actually extends the period. Identical flow across MoMo,
  Airtel, and card; no card tokenization was built.
- **Schema**: the Stage 1 schema already had `Plan`/`Subscription`/
  `PaymentTransaction.purpose: SUBSCRIPTION` pre-built. Two migrations added
  what dunning needed: `Subscription.pastDueSince`/`dunningStage`/
  `lastDunningSentAt` (grace-period/reminder bookkeeping) and
  `pendingPlanId`/`pendingBillingInterval` (carries a dealer's plan/interval
  choice across the Flutterwave checkout redirect, since the webhook only has
  a `tx_ref` to look the transaction up by — applied on settlement, discarded
  on failure).
- **`src/features/payments/service.ts` extended** (not a new feature folder —
  this is the same money/webhook state machine Stage 6 built, now handling a
  second `PaymentPurpose`): `initiateSubscriptionPayment()` (checkout for the
  current or a newly chosen plan/interval), `settleVerifiedSubscriptionPayment()`
  (activates the period, applies any pending plan change, clears dunning
  state), `markSubscriptionPaymentFailed()`, and `runSubscriptionDunning()` —
  the per-dealership state machine: `TRIALING`/`ACTIVE` → `PAST_DUE` the
  moment `trialEndsAt`/`currentPeriodEnd` passes (`Dealership.status` →
  `TRIAL_EXPIRED`) → reminders at 1/3/5 days past due → `SUSPENDED` at the
  7-day grace deadline (`Dealership.status` → `SUSPENDED`, storefront and
  admin gate below kick in) → `CANCELLED` after 30 further unresolved days.
  `processFlutterwaveWebhookEvent()`'s dispatcher (previously hard-coded to
  reservations) now branches on `txn.purpose` before routing to the
  deposit or subscription settle/fail path — the reservation branch is
  untouched.
- **Onboarding** (`src/features/onboarding/service.ts`) now creates a
  `Subscription` row (`TRIALING`, cheapest active `Plan`, `trialEndsAt` = now
  + that plan's `trialDays`) in the same transaction as the `Dealership` —
  previously only `prisma/seed.ts` did this, so a real signup had no
  subscription at all.
- **Dunning cron** (`/api/cron/subscription-dunning`, `vercel.json` every 6h,
  same `CRON_SECRET`-guarded pattern as Stages 4/6) loops every dealership
  through `runSubscriptionDunning()`.
- **`src/features/platform/`** (new feature folder): `listDealers`/
  `getDealerDetail` (dealers table + detail with subscription/plan/staff/
  payment history), `getPlatformMetrics` (dealer counts by status, trial/
  active/past-due subscription counts, deposits volume, subscription
  revenue), and manual controls — `extendDealerTrial`, `suspendDealer`,
  `reactivateDealer`, `changeDealerPlan` — all audit-logged.
- **Impersonation** (`src/features/platform/impersonation.ts`,
  `src/lib/impersonation-token.ts`): no impersonation mechanism existed
  before this stage. Built on a second NextAuth Credentials provider
  (`id: "impersonate"`, `src/lib/auth.ts`) that never appears on the login
  form — it only accepts a ~20-second HMAC-signed one-shot token minted
  server-side by `startImpersonationAction`/`exitImpersonationAction`.
  Starting impersonation issues the target dealer user a real new
  `RefreshToken` row and stamps `impersonatorId`/`impersonatorName`/
  `impersonatorRtid` onto the JWT (`src/types/next-auth.d.ts`,
  `auth.config.ts` callbacks); exiting restores the platform admin's own
  session using their still-valid original `rtid` — no second sign-in — and
  revokes the impersonated session's refresh token. Both directions are
  audit-logged. `requireRole()` now also surfaces `impersonatedBy` (read off
  the session, no extra DB call) so `AdminLayout` can render an
  `ImpersonationBanner` with an "Exit" button.
- **`/admin/billing`**: current plan/status/trial-or-renewal date, a
  grace-period banner while `PAST_DUE`, a suspended banner while `SUSPENDED`,
  a plan/interval picker that starts a Flutterwave checkout
  (`BillingPayForm`), and payment history. `/admin/billing/callback` polls
  status same as Stage 6's `/reserve/callback` pattern. New `adminNavItems`
  entry.
- **Pay-now wall** (`src/components/layout/admin-billing-gate.tsx`): a client
  component (needs `usePathname()` to exempt `/admin/billing` itself, which a
  server layout can't cleanly read) that replaces all other `/admin/**`
  content with a "pay now" block whenever `Dealership.status` is `SUSPENDED`/
  `CANCELLED`.
- **Storefront suspension gate**: `[dealerSlug]/layout.tsx` now short-circuits
  to a bare "temporarily unavailable" page for `SUSPENDED`/`CANCELLED`
  dealerships, before any of the normal header/footer chrome renders.
- **`/platform`**: overview page combines platform metrics with a searchable
  dealers table (status/plan/subscription); `/platform/dealers/[id]` adds
  per-dealer subscription detail, payment history, the manual-control forms,
  and a per-staff-member "Impersonate" button.
- Found and fixed a real bug while smoke-testing against the dev server (not
  a test artifact): the dealer-detail page passed raw `Plan` rows (Decimal
  `priceMonthly`/`priceYearly` fields) into the client-side
  `DealerActionsForm`, which Next.js rejects — "Only plain objects can be
  passed to Client Components... Decimal objects are not supported." Fixed
  by mapping to `{id, name}` before passing, matching the pattern
  `admin/billing/page.tsx` already used for `BillingPayForm`.
- **Tests** (`src/features/payments/subscription.test.ts`, 14 new, real
  database): checkout creation and its Flutterwave-rejection cleanup path;
  webhook settlement (activates + applies a pending plan/interval change),
  `charge.failed` (leaves subscription status alone, never calls `verify`),
  and replay idempotency; all four `runSubscriptionDunning()` transitions
  (trial→past-due, reminder-without-suspending, suspend-at-grace-deadline,
  cancel-after-long-suspension); all four platform manual controls plus
  dealer listing/metrics. `src/lib/impersonation-token.test.ts` (4 new):
  sign/verify round-trip, tamper rejection, expiry, malformed input.
  `require-role.test.ts` updated for the new `impersonatedBy` field plus one
  new case exercising it. Total suite: 52 → 70 tests, all passing (isolated
  from the rest of the suite to control for this environment's documented
  Supabase-pooler flakiness — confirmed by rerunning with a higher
  transaction timeout that every failure was pooler contention, not logic;
  raised `settleVerifiedSubscriptionPayment`'s `$transaction` timeout/maxWait
  to match Stage 6's fix for the same class of issue).
- Verified end-to-end against the seeded database with the dev server
  running and real cookie-jar logins (no browser needed): `/admin/billing`
  and `/platform` render real seeded plan/subscription/dealer data for the
  seeded `OWNER` and `PLATFORM_ADMIN`; the full impersonation round trip
  (start → dealer session with `impersonatorId` set → admin banner renders →
  exit → restored admin session with the claims cleared) driven directly
  through NextAuth's `/api/auth/callback/impersonate` endpoint; flipping a
  seeded dealership to `SUSPENDED` confirmed the storefront "temporarily
  unavailable" page, the admin pay-now wall (with `/admin/billing` itself
  still reachable), and reverted cleanly afterward. `lint`, `typecheck`, and
  `next build` (44 routes including the 4 new ones) are all clean.

**Next:** Stage 9 — Hardening, Polish & Handover Docs.
