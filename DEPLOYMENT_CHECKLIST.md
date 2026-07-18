# Deployment Checklist

Run through this before pointing a real dealership at a production
deployment. See [README.md](README.md#deployment-vercel--managed-postgres)
for the mechanics behind each step.

## Environment & secrets

- [ ] Every variable in `.env.example` is set in Vercel's Production
      environment (and Preview, if used).
- [ ] `CRON_SECRET` is set — `env.ts` refuses to boot in production without
      it, since the cron routes (reservation expiry, scheduled publishing,
      subscription dunning) would otherwise be reachable by anyone.
- [ ] `FLUTTERWAVE_WEBHOOK_SECRET_HASH` is set once `FLUTTERWAVE_SECRET_KEY`
      is configured — same reasoning, enforced the same way.
- [ ] `AUTH_SECRET` is a freshly generated value (`openssl rand -base64 33`),
      not reused from local dev.
- [ ] `NEXT_PUBLIC_APP_URL` and `AUTH_URL` match the real production domain.
- [ ] Flutterwave keys are **live** keys (`FLWPUBK-...` / `FLWSECK-...`), not
      the `_TEST-` sandbox ones, before accepting real payments.

## Database

- [ ] Managed Postgres provisioned (Supabase/Neon/Railway); `DATABASE_URL`/
      `DIRECT_URL` point at the correct pooler (see README).
- [ ] Automatic backups / point-in-time recovery enabled on the provider.
- [ ] Build command runs migrations before build: `npm run db:deploy && npm
      run build`.
- [ ] `npm run seed` has **not** been run against production (it wipes and
      reseeds demo data — dev/staging only).

## Third-party services

- [ ] Cloudinary cloud name/API key/secret set; test an image upload from
      `/admin/settings` (Branding tab) after deploy.
- [ ] Flutterwave webhook URL set to `https://<domain>/api/webhooks/flutterwave`
      in the Flutterwave dashboard, secret hash copied into env.
- [ ] Africa's Talking username/API key set (or leave unset — SMS silently
      no-ops to a dev-log fallback if unconfigured; confirm that's
      intentional for launch, not an oversight).
- [ ] Resend API key + verified sending domain set (`EMAIL_FROM` matches a
      domain Resend has verified) — otherwise verification/reset/receipt
      emails will fail to send in production.

## Cron jobs

- [ ] After first deploy, confirm all three jobs appear under Vercel Project
      Settings → Cron Jobs (`publish-scheduled`, `expire-reservations`,
      `subscription-dunning`).
- [ ] Trigger each manually once (Vercel dashboard → Cron Jobs → Run) and
      confirm a 200 response with the expected JSON summary.

## Verification pass

- [ ] `npm run lint && npm run typecheck && npm test && npm run build` all
      pass locally against the same commit being deployed.
- [ ] Sign up a real (or disposable) dealership through `/onboarding` on the
      live URL and complete the setup wizard end-to-end.
- [ ] Add one vehicle, publish it, confirm it's visible on the public
      storefront.
- [ ] Run one Flutterwave **sandbox-mode-equivalent** reservation if
      possible before flipping to live keys, or at minimum a very small real
      deposit against the live keys to confirm the full webhook round-trip
      (payment → webhook → vehicle flips to Reserved → SMS/email sent).
- [ ] Confirm the storefront returns the expected security headers:
      `curl -I https://<domain>/` and check for `content-security-policy`,
      `x-frame-options`, `strict-transport-security`.
- [ ] Run Lighthouse against a real vehicle detail page and the homepage —
      target ≥90 performance, ≥95 SEO/accessibility/best-practices.

## Ongoing

- [ ] Set a calendar reminder to review `npm audit` monthly — the only
      known outstanding advisory as of this stage is a moderate, low-risk
      transitive `postcss` issue via Next.js's own bundled copy, expected to
      clear on Next's next patch release.
- [ ] Decide who holds the platform admin credentials and how
      impersonation use is tracked/reviewed (it's fully audit-logged — make
      someone responsible for occasionally reviewing that log).
