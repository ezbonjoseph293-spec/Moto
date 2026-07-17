# MASTER PROMPT — Elite Multi-Dealer Car Platform

### Merged build prompt: enterprise polish + your product decisions (multi-tenant, deposits, African payments)

Copy everything below the line into your AI coding tool. Placeholders are in [brackets].

---

You are a Staff Software Engineer, Principal Product Designer, Solution Architect, Database Architect, Security Engineer, SEO Expert, and UX Designer.

Your task is to build a production-ready, enterprise-grade **multi-tenant Car Dealership Platform** — a SaaS where many dealerships each get their own premium storefront and powerful admin dashboard. The storefronts must rival premium dealership websites from Mercedes-Benz, BMW, Porsche, Tesla, and AutoTrader.

This is NOT just a website. It is a complete dealership management system.

**Production standards:** No placeholders. No fake APIs. No TODO comments. Everything must work end-to-end.

---

## 0. Non-Negotiable Product Decisions

These override anything else in this document:

1. **Multi-tenant SaaS.** One codebase serves unlimited dealerships. Each dealership gets a storefront at `platform.com/{dealer-slug}` (custom domains architected for, added later). Every database table that holds dealer data carries `dealership_id`, and tenant isolation is enforced in one place (the repository/data-access layer) so no query can ever leak across tenants.
2. **Online deposits are a core MVP feature.** Buyers can reserve a car by paying a deposit online via **Flutterwave** (MTN Mobile Money, Airtel Money, and cards). A reservation only becomes real when Flutterwave's **webhook** confirms payment — never trust the client. Car status follows a strict logged state machine: `DRAFT → AVAILABLE → RESERVED → SOLD` (+ `ARCHIVED/HIDDEN`), with automatic expiry that releases reserved cars after the hold period.
3. **Dealer self-service is the product.** A non-technical dealership owner must be able to change literally everything — logo, colors, content, cars, collections, policies, staff, deposit rules — without a developer. Audit the final build for any hard-coded string a dealer might want to change; move it to settings.
4. **Mobile-first, premium on desktop.** The primary market is African buyers and sales staff on Android phones over variable connections. Design at 360px first, then scale up to a luxurious desktop experience. (Premium ≠ desktop-first.)
5. **Platform business model.** Dealerships pay a monthly subscription (also via Flutterwave). Include a trial period, dunning for failed payments, and a Platform Super Admin panel for managing dealers, plans, and disputes.

---

## 1. Tech Stack

**Framework: Next.js 15 (App Router) + TypeScript — one codebase for storefronts, dashboards, and API.**
Chosen deliberately over a Vite SPA + separate Express API because: (a) car detail and inventory pages need true SSR for SEO — this is where buyers come from; (b) one deployable app ships dramatically faster for a solo/small team; (c) Server Actions + a layered backend give clean architecture without microservice overhead.

- **Backend architecture:** Server Actions / Route Handlers → Services → Repositories → **Prisma** → **PostgreSQL**. Business logic lives in services; tenant scoping lives in repositories.
- **Styling:** Tailwind CSS + shadcn/ui, themed entirely through CSS variables so each dealer's brand color and fonts apply instantly. (If you strongly prefer CSS Modules for bespoke components, use them for the marketing site only — the design-token system must remain CSS-variable driven either way.)
- **Auth:** Auth.js (NextAuth) with JWT sessions + refresh, bcrypt, email verification, forgot/reset password, and role + tenant claims. Roles: Platform Super Admin, Dealer Owner, Manager, Sales, Customer.
- **Forms & validation:** React Hook Form + Zod (shared schemas client/server).
- **Data fetching:** React Query for interactive dashboard views; server components elsewhere.
- **Media:** Cloudinary — images, videos, PDF brochures; automatic optimization, responsive sizes, folder-per-dealer media library.
- **Payments:** Flutterwave (buyer deposits + dealer subscriptions) with signed webhook verification.
- **Notifications:** Africa's Talking (SMS receipts and alerts) + Resend/Nodemailer (email). WhatsApp deep links throughout.
- **Motion:** Framer Motion for micro-animations and page transitions; Swiper for galleries/sliders.
- **SEO:** Next.js Metadata API, JSON-LD (Vehicle + AutoDealer schema.org), Open Graph/Twitter cards, per-dealer sitemap.xml and robots.txt, canonical URLs, 301 redirect manager.
- **Hardening:** rate limiting on auth/forms/payments, Helmet-equivalent security headers, compression, input validation on every endpoint, Winston (or pino) structured logging, Sentry error tracking.
- **Background jobs:** Inngest or Vercel Cron — reservation expiry, subscription dunning, scheduled publishing, unused-asset detection.
- **Deployment:** Vercel (app) + Supabase/Neon/Railway PostgreSQL. Docker Compose for local development. GitHub Actions CI/CD (lint, typecheck, test, migrate, deploy).

---

## 2. Build in Two Phases

Build **Phase 1 completely and deeply** before touching Phase 2. A working, polished core beats a wide shallow shell.

### Phase 1 — Sellable MVP

Multi-tenancy + dealer onboarding wizard; full inventory management; premium storefront (home, inventory, vehicle details, collections, financing, about/contact, policies, 404); deposit/reservation flow end-to-end; leads inbox; branding & website settings; team roles; subscriptions; platform admin; SEO fundamentals; seed data.

### Phase 2 — Growth Suite

Blog CMS, testimonials, FAQ manager, homepage drag-and-drop builder, customer accounts (favorites, saved searches, alerts), trade-in and finance-application workflows, appointments/test-drive calendar, service bookings, marketing suite (newsletter, campaigns, popups, coupons, referral codes), analytics dashboards, media-library extras, 2FA + IP restrictions, multi-branch support per dealership, i18n + multi-currency, AI-powered similar-vehicle recommendations, instant search with autocomplete, live chat, custom domains, cross-dealer marketplace homepage.

Architect Phase 1 so every Phase 2 module can be added without refactoring (modular, feature-based folder organization).

---

## 3. Public Storefront (per dealer)

**Pages:** Home · Inventory · Vehicle Details · New Cars · Used Cars · Collections (Luxury, Electric, SUV, Commercial — dealer-defined, unlimited) · Special Offers · Financing · Trade-In · Book Test Drive (Phase 2 booking, Phase 1 inquiry) · About · Contact · Blog (Phase 2) · FAQ (Phase 2) · Privacy · Terms · Cookie Policy · 404.

**Homepage** (sections toggleable and reorderable by the dealer): hero with editable headline/media, luxury vehicle slider, featured inventory, latest arrivals, best deals, finance calculator, why-choose-us, testimonials, manufacturer logo strip, vehicle categories, video section, Google Map, newsletter signup, CTA banners, announcement bar.

**Inventory:** advanced filtering — brand, model, year, price range, mileage, fuel, transmission, drive type, body style, condition (new/used/imported), color, seats, engine size, availability — plus free-text search with autocomplete. Sort by newest, price, mileage, year, popularity. Pagination with clean URLs (SEO), skeleton loaders, 2-col mobile / 3–4-col desktop grid.

**Vehicle Details:** swipeable optimized gallery (video + 360° viewer support), sticky price + **"Reserve with Deposit"** bar on mobile, full spec table, features checklist, PDF brochure downloads, discount pricing, finance estimate, related vehicles, inquiry form, WhatsApp deep link, call button, share, favorite, compare. SEO URLs like `/{dealer}/cars/toyota-land-cruiser-2021-xk93`, Vehicle JSON-LD, OG image.

**Deposit flow:** Reserve → see deposit amount, hold period, refund policy in plain language → name + phone → pay via MoMo/Airtel/card → webhook confirms → car flips to RESERVED for everyone → SMS + email receipt with hold expiry → dealer notified. Expired holds auto-release.

---

## 4. Dealer Admin Dashboard

Clean enough for a salesperson on a phone (bottom tab bar mobile, sidebar desktop). Modules:

- **Overview:** leads, deposits, views, cars sold, inventory status, revenue from deposits, recent activity, notifications, charts.
- **Inventory:** add/edit/duplicate/archive vehicles; multi-image upload with drag-to-reorder and cover selection; videos and PDF brochures; structured specs + rich-text description; status controls incl. Draft and scheduled publishing; featured flags; bulk actions (edit, delete, pricing, images); CSV import/export.
- **Brands & body types:** editable lists with logos, descriptions, ordering, featured brands.
- **Collections:** unlimited custom collections; manual or rule-based assignment; reorder; feature on homepage.
- **Homepage & content:** edit every section's text, images, and media; enable/disable and reorder sections; announcement bar; popup banners (Phase 2); rich-text policy editor (privacy, terms, returns, warranty, financing, cookies).
- **Website settings:** light/dark logos, favicon, business name, tagline, phones, WhatsApp, emails, address + map pin, business hours, social links, header/footer navigation, theme color, font choice, border radius, button style — all live-previewed.
- **Leads:** unified inbox (inquiries, deposit payments, trade-in and finance requests, test-drive requests) with statuses (New → Contacted → Closed), assignment to staff, and notes.
- **Deposits & reservations:** list with payment status, hold countdown, refund marking, dispute notes; full transition history per car.
- **Team:** invite staff, granular role permissions, activity/audit log, login history, session management.
- **Media library:** per-dealer folders, search, replace assets, optimization, unused-asset detection.
- **SEO:** per-page meta title/description, OG image, canonical, redirects; auto sitemap.
- **Billing:** current plan, invoices, payment method, trial status.
- **Settings safety:** every change audit-logged (who, what, when); one-click CSV export of inventory and leads.

**Platform Super Admin (yours):** dealers list, plan management, subscription health, impersonate-dealer support mode, platform metrics, dispute tooling, feature flags.

---

## 5. Design System

**Mood:** confident, premium, trustworthy — closer to a bank than a classifieds site. Inspired by Mercedes-Benz, Porsche, Audi, Tesla, and Apple: minimal, elegant, large typography, generous spacing, restrained micro-animations, glassmorphism only where it earns its place. No AI-generated-looking layouts. The neutral system must look premium under **any** dealer brand color.

- **Base palette:** ink `#0F1722`, surface `#F7F8FA`, card `#FFFFFF`, default accent `#2563EB` (overridden per dealer via `--brand`), success/Available `#10B981`, Reserved `#F59E0B`, Sold `#DC2626`, muted `#64748B`, borders `#E2E8F0`, premium gold badge `#C8A24B`.
- **Type:** Space Grotesk 600/700 for headings; Inter 400–600 for body/UI; prices in Inter 700 tabular numbers, 22–28px on cards. Scale 32/24/20/16/14, 1.5 line height.
- **Components:** 12px-radius cards, soft shadows `0 1px 3px rgba(15,23,34,0.08)`, 8-pt spacing grid, skeleton loaders everywhere (never spinners), enforced 4:3 image crops, lazy loading below the fold, smooth Framer Motion transitions kept under 250ms.
- **Accessibility:** WCAG 2.2 AA — semantic HTML, alt-text fields on every admin image upload, visible focus states, contrast-checked against dealer brand colors with automatic fallback.

---

## 6. Database Schema (PostgreSQL + Prisma)

Model at minimum: Dealership, Subscription/Plan, User, Role/Permission, Vehicle, VehicleImage, VehicleVideo, VehicleDocument, Brand, BodyType, Collection, CollectionVehicle, Reservation/Deposit, PaymentTransaction, Lead, LeadNote, Testimonial, BlogPost, BlogCategory, Page/Policy, Menu, Setting (per dealer), MediaAsset, Favorite, TradeInRequest, FinanceApplication, Appointment, ServiceBooking, NewsletterSubscriber, Notification, AuditLog, Branch, Redirect, AnalyticsEvent.

Every dealer-owned table includes `dealership_id` with composite indexes. Include Prisma migrations and a rich seed script: 2 demo dealerships, 15+ realistic vehicles each with Cloudinary-ready images, brands, collections, policies, sample leads and a completed deposit, plus admin accounts.

---

## 7. API & Engineering Standards

RESTful route handlers (versioned under `/api/v1`) with validation (Zod), pagination, filtering, sorting, consistent error envelopes, OpenAPI/Swagger docs, and role+tenant authorization middleware on every route. Rate-limit auth, forms, and payment endpoints.

Write the codebase as if it will support 100,000+ listings and millions of monthly visitors: clean feature-based architecture, reusable abstractions, clear naming, thorough validation, caching where it matters, and image optimization everywhere. Unit + integration tests for critical services (tenancy isolation, reservation state machine, webhook handling, auth). Performance targets: Lighthouse 90+ performance and 95+ SEO/accessibility/best-practices on storefront pages.

---

## 8. Deliverables

1. Complete monorepo with feature-based organization, Docker Compose for local dev, `.env.example`, GitHub Actions CI/CD.
2. Prisma schema + migrations + seed script.
3. Documented API (Swagger) and an architecture overview in the README.
4. `README.md` — setup, deployment (Vercel + managed Postgres), backups, maintenance.
5. `ADMIN_GUIDE.md` — plain-language, step-by-step manual for dealership staff: add a car, change the logo, edit a policy, handle a deposit, respond to a lead.
6. `PLATFORM_GUIDE.md` — for you as the operator: onboarding a new dealer, managing subscriptions, handling disputes.

---

## 9. Working Method

Work iteratively. **First present for my approval: (1) the full Prisma schema, (2) the route map (public, dealer admin, platform admin, API), and (3) the tenancy + payment-webhook design.** Only after approval, build Phase 1 in this order: schema & tenancy foundation → auth & onboarding wizard → inventory management → storefront → deposit flow with webhooks & SMS → leads, settings, policies → platform admin → polish, tests, seed, deploy docs. Ask clarifying questions whenever requirements are ambiguous instead of assuming.

**Final objective:** an enterprise-grade platform where any dealership owner independently manages branding, inventory, content, policies, deposits, team, and settings through a polished dashboard — without ever needing a developer — and where you can onboard dealer #2, #10, and #100 without touching code.

Always update PROGRESS.md at the end of each completed stage.
