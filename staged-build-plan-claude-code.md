# Staged Build Plan — Claude Code Task Prompts
### Multi-Dealer Car Platform, built one stage at a time

## How to use this file

1. **Put the master prompt in the repo.** Save `master-dealership-platform-prompt.md` as `CLAUDE.md` in your project root (or reference it from `CLAUDE.md`). Claude Code reads it automatically every session — every stage prompt below assumes it as the source of truth.
2. **One stage per session.** Paste one stage prompt, let it complete, review, then commit. Fresh session for the next stage keeps context clean and quality high.
3. **Don't skip gates.** Stages 1 and 6 end with an explicit "stop and show me" checkpoint. Approving the schema and the payment design before code exists is what saves you from painful rewrites.
4. **Commit discipline:** `git commit` at the end of every stage with the stage name. If a stage goes sideways, you can reset to the last good stage instead of untangling.

Golden rule to include in every session if Claude drifts: *"Only build what this stage asks for. Do not scaffold future stages. No placeholders or TODOs — everything in this stage must fully work."*

---

## Stage 0 — Project Foundation

> Read CLAUDE.md fully before doing anything. We are building the platform in strict stages; this session is **Stage 0: Project Foundation only**.
>
> Set up:
> 1. Next.js 15 (App Router) + TypeScript, strict mode, with a feature-based folder structure: `src/features/{inventory,auth,tenancy,payments,leads,settings}/`, `src/lib/`, `src/components/ui/`.
> 2. Tailwind CSS + shadcn/ui, with the full design-token system from CLAUDE.md Section 5 implemented as CSS variables (ink, surface, `--brand` accent, status colors, radius, shadows) and Space Grotesk + Inter loaded via `next/font`.
> 3. Prisma initialized against PostgreSQL, Docker Compose for local Postgres, `.env.example` with every variable we'll eventually need (DB, Auth.js, Cloudinary, Flutterwave, Africa's Talking, Resend) documented with comments.
> 4. Base layout shell: marketing root page, `/{dealerSlug}` storefront layout stub, `/admin` dashboard layout stub with mobile bottom-tab / desktop sidebar navigation, and a `/platform` super-admin layout stub. Stubs render real layouts with the design system — but no features.
> 5. Tooling: ESLint, Prettier, Vitest configured with one passing example test, GitHub Actions workflow (lint → typecheck → test), Winston/pino logger utility, and a typed `env.ts` validator (Zod).
>
> Definition of done: `docker compose up` + `npm run dev` gives a styled, navigable shell; CI passes. Do NOT create any database models yet — that is Stage 1.

---

## Stage 1 — Database Schema & Tenancy Foundation ⛔ approval gate

> Read CLAUDE.md. This session is **Stage 1: Schema & Tenancy**.
>
> 1. Design the complete Prisma schema for Phase 1 AND Phase 2 (model everything from CLAUDE.md Section 6 now, even though we build features in stages — the schema should not need restructuring later). Every dealer-owned model carries `dealershipId` with composite indexes. Include the Vehicle status enum and Reservation/PaymentTransaction models with the full state machine states.
> 2. **STOP before migrating. Present me: the full schema, an entity-relationship summary, and your tenancy-isolation design (how the repository layer guarantees every query is scoped to `dealershipId`). Wait for my approval.**
> 3. After approval: run the initial migration, implement the repository layer with tenant scoping (e.g. a `forDealership(id)` factory that all data access goes through), and write integration tests proving isolation — a query for dealer A can never return dealer B's rows, and unscoped access to dealer-owned tables throws.
> 4. Seed script: 2 demo dealerships, 15 realistic vehicles each (varied brands/specs/statuses), brands, body types, 3 collections each, default policies and settings, and user accounts for every role.
>
> Definition of done: migrations run clean, isolation tests pass, `npm run seed` produces a believable dataset.

---

## Stage 2 — Authentication & Roles

> Read CLAUDE.md. This session is **Stage 2: Auth & Roles**.
>
> Implement Auth.js with credentials: signup, login, email verification, forgot/reset password (Resend for email), bcrypt, JWT session with refresh, and session claims carrying `role` + `dealershipId`. Roles: PLATFORM_ADMIN, OWNER, MANAGER, SALES, CUSTOMER.
>
> Build the authorization layer: a `requireRole()` guard for Server Actions/route handlers and middleware protecting `/admin/**` (dealer staff only, scoped to their dealership) and `/platform/**` (platform admin only). Rate-limit all auth endpoints. Audit-log auth events (login, failed login, password reset) to the AuditLog model.
>
> Definition of done: I can register, verify, log in as each seeded role, and get correctly blocked from routes above my permission. Tests cover the guards.

---

## Stage 3 — Dealer Onboarding & Website Settings

> Read CLAUDE.md. This session is **Stage 3: Onboarding & Settings**.
>
> 1. Onboarding wizard (target: under 10 minutes on a phone): dealership name + auto-generated unique slug → logo upload (Cloudinary) + brand color picker with live preview → contact details, WhatsApp number, address + map coordinates, business hours → deposit settings (fixed amount or % of price, hold duration, refund policy text) with sensible defaults → publish, showing the storefront link with copy + "share to WhatsApp" buttons.
> 2. Settings module in `/admin`: everything from CLAUDE.md Section 4 "Website settings" — logos (light/dark), favicon, identity, contacts, socials, navigation, announcement bar, theme color and font choice — persisted per dealer and applied to the storefront via CSS variables at request time.
> 3. Storefront resolution: `/{dealerSlug}` loads that dealer's branding and settings; unknown slugs 404 cleanly.
>
> Definition of done: I can onboard a brand-new dealership end-to-end on a 360px viewport and immediately see its branded (empty) storefront.

---

## Stage 4 — Inventory Management

> Read CLAUDE.md. This session is **Stage 4: Inventory (admin side)**.
>
> Build the full inventory module in `/admin`: vehicle create/edit with all structured specs from CLAUDE.md, rich-text description, multi-image upload to Cloudinary with drag-to-reorder + cover selection, video URL and PDF brochure upload; status management implementing the state machine (DRAFT → AVAILABLE → RESERVED → SOLD, + ARCHIVED) with every transition written to AuditLog; featured flag; duplicate; scheduled publishing (background job); bulk actions (status, delete, pricing); CSV import with validation report + CSV export.
>
> Also: Brands and BodyTypes management (CRUD, logo, ordering), and Collections (unlimited, manual assignment + rule-based e.g. price-under, reorder, feature on homepage).
>
> All list views: fast, searchable, filterable, phone-usable. Definition of done: a salesperson can add a fully photographed car from a phone in under 5 minutes, and every admin table respects tenancy.

---

## Stage 5 — Public Storefront

> Read CLAUDE.md. This session is **Stage 5: Storefront**.
>
> Build the buyer-facing storefront per CLAUDE.md Sections 3 and 5 (premium, mobile-first):
> 1. **Home:** hero (dealer-editable content from settings), featured vehicles, latest arrivals, collections row, why-choose-us, testimonials placeholder section (hidden if empty), logo strip, map, CTA banner, announcement bar.
> 2. **Inventory:** SSR list with URL-driven filters (brand, price, year, mileage, fuel, transmission, body style, condition, color) + text search, sort options, pagination, filter chips on mobile / sidebar on desktop, skeleton loaders.
> 3. **Vehicle details:** swipeable gallery, sticky mobile bar with price + "Reserve this car" button (button links to a stub `/reserve` page this stage — payment is Stage 6), spec table, features, brochure download, WhatsApp deep link + call button, share, related vehicles.
> 4. **Content pages:** about, contact (map + form storing a Lead), and policy pages rendered from the database.
> 5. **SEO:** metadata per page, Vehicle + AutoDealer JSON-LD, OG images, per-dealer sitemap and robots, clean slugs like `/{dealer}/cars/toyota-land-cruiser-2021-xk93`.
>
> Definition of done: seeded dealerships look like premium real dealership sites on both 360px and desktop; Lighthouse on the vehicle page ≥90 performance / ≥95 SEO.

---

## Stage 6 — Deposits & Reservations ⛔ approval gate

> Read CLAUDE.md. This session is **Stage 6: Payments** — the most safety-critical stage.
>
> 1. **STOP first. Present me your design before writing code:** the Flutterwave payment flow (initiation → redirect/modal → webhook), webhook signature verification, idempotency handling, the exact Reservation + PaymentTransaction state transitions, the expiry job design, and failure modes (double payment on one car, webhook retries, payment succeeds after hold expired). Wait for approval.
> 2. After approval: implement Reserve flow on the vehicle page — deposit amount/hold/refund terms displayed plainly → buyer name + phone → Flutterwave checkout (MTN MoMo, Airtel Money, card). Reservation becomes ACTIVE **only** on verified webhook; the car flips to RESERVED atomically (guard against two buyers paying for one car — first verified webhook wins, second is auto-refund-flagged and surfaced to the dealer).
> 3. Confirmations: SMS via Africa's Talking + email receipt to buyer with hold expiry; notification + lead entry for the dealer.
> 4. Background job: expire stale reservations, release the car to AVAILABLE, mark deposit for refund per policy, notify both parties.
> 5. `/admin` Deposits module: list with payment status and hold countdown, mark-refunded, dispute notes, per-car transition history.
> 6. Integration tests for the state machine and webhook handler (valid, invalid signature, replay, race on one vehicle).
>
> Definition of done: full happy path works in Flutterwave sandbox end-to-end, and every failure mode above has a tested, sensible outcome.

---

## Stage 7 — Leads Inbox & Content

> Read CLAUDE.md. This session is **Stage 7: Leads & Content**.
>
> 1. Unified Leads inbox in `/admin`: inquiries, contact-form submissions, and deposit events in one list; statuses New → Contacted → Closed; assign to staff; notes; filters; new-lead email/SMS notification per dealer preference.
> 2. Policy & page editor: rich-text editing for privacy, terms, warranty, returns, financing, about — with versioned saves in AuditLog.
> 3. Testimonials CRUD (rating, photo, featured) now rendering into the storefront section built in Stage 5.
> 4. Team management: invite staff by email (accept-invite flow), assign roles, deactivate, activity log view.
>
> Definition of done: a dealer can run their whole day from the Leads screen on a phone.

---

## Stage 8 — Subscriptions & Platform Admin

> Read CLAUDE.md. This session is **Stage 8: Monetization & Platform**.
>
> 1. Dealer subscriptions via Flutterwave: plans (define one launch plan + architecture for more), 14-day trial started at onboarding, recurring billing, webhook-driven status, dunning emails/SMS on failure, and a grace period after which the storefront shows a polite "temporarily unavailable" page while `/admin` shows a pay-now wall.
> 2. Billing page in `/admin`: plan, status, invoices, update payment method.
> 3. `/platform` Super Admin: dealers table (status, plan, health), dealer detail with impersonate-for-support mode (audit-logged), platform metrics (dealers, active subscriptions, deposits volume), and manual controls (extend trial, suspend dealer).
>
> Definition of done: the full commercial loop works in sandbox — trial → pay → active → failed payment → dunning → suspend → reactivate.

---

## Stage 9 — Hardening, Polish & Handover Docs

> Read CLAUDE.md. This session is **Stage 9: Ship**.
>
> 1. Sweep for hard-coded strings a dealer might want to change — move them to settings. Sweep for TODOs/placeholders — there must be none.
> 2. Performance pass: image audit, caching headers, bundle check, Lighthouse ≥90/95 targets on storefront pages. Accessibility pass to WCAG 2.2 AA.
> 3. Security pass: rate limits verified on auth/forms/payments, headers, dependency audit, webhook secrets, session handling.
> 4. Test pass: tenancy isolation, reservation state machine, webhook handling, auth guards all green in CI.
> 5. Write the three documents from CLAUDE.md Section 8: `README.md` (setup, deploy to Vercel + managed Postgres, backups), `ADMIN_GUIDE.md` (plain-language dealer manual with step-by-step tasks), `PLATFORM_GUIDE.md` (operator manual: onboard a dealer, manage subscriptions, handle a deposit dispute).
> 6. Produce a deployment checklist and deploy.
>
> Definition of done: a stranger could clone the repo and be running locally in 15 minutes, and a non-technical dealer could pass the ADMIN_GUIDE without calling you.

---

## After launch (Phase 2 stages, when ready)

Run the same pattern per module: Blog CMS → customer accounts & favorites → trade-in + finance applications → appointments calendar → marketing suite → analytics → multi-branch → i18n/multi-currency → custom domains → cross-dealer marketplace. One module, one session, one commit.