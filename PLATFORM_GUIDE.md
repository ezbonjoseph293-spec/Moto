# Platform Guide — Operating Moto

This guide is for **you**, the platform operator, using the `/platform`
super-admin panel. It covers onboarding new dealerships, managing
subscriptions, and handling disputes.

If you're a dealership owner or staff member looking for how to run your own
storefront and dashboard, see [ADMIN_GUIDE.md](ADMIN_GUIDE.md) instead.

## Signing in

Platform admin accounts are created directly in the database (there's no
public signup for this role — see `prisma/seed.ts` for how the seeded one is
created, or insert a `User` row with `role: PLATFORM_ADMIN` for a real one).
Sign in at `/login` — you'll land on `/platform` instead of `/admin`.

## Onboarding a new dealership

There are two ways a dealership gets onto the platform:

1. **Self-serve (the normal path):** they go to `/onboarding` and create
   their own account — this immediately creates their `Dealership`, a
   `Subscription` on your cheapest active `Plan` (starting in trial), and
   signs them in as `OWNER`. They're then walked through the setup wizard
   (branding, contact, deposit policy) inside `/admin` before they can use
   the rest of the dashboard.
2. **You do it for them:** there's no dedicated "create dealer" form in
   `/platform` today — the fastest path is to have them go through
   `/onboarding` themselves while you're on a call with them, or run
   `prisma/seed.ts`-style logic manually via Prisma Studio (`npm run
   db:studio`) if they can't self-serve at all.

Either way, once they exist you'll see them in the **Dealers** table on the
`/platform` overview page.

## Managing plans

Plans (`Plan` model) aren't editable through the UI yet — add or adjust them
directly in the database (Prisma Studio, or a migration if you want it
tracked). Each plan needs: a unique `code`, `name`, `priceMonthly`/
`priceYearly`, `currency`, `trialDays`, and a `features` JSON blob. Mark a
plan `isActive: false` to stop new dealers from being offered it without
affecting anyone already subscribed to it.

## Monitoring dealers and subscriptions

The `/platform` overview shows:

- **Stat tiles:** total dealers, trialing, active subscriptions, past due.
- **Deposits captured** and **subscription revenue** across all dealers
  (labeled "UGX equivalent" — these are simple sums across dealers, not a
  true multi-currency conversion; if you onboard a dealer in a different
  currency, treat this figure as directional, not exact).
- **Dealers table**, searchable by name — click through to a dealer's detail
  page for their subscription, staff list, and payment history.

### The subscription lifecycle

Every dealership moves through this automatically (driven by the
`subscription-dunning` cron job, every 6 hours):

```
TRIALING → ACTIVE (on payment) → PAST_DUE (payment lapses)
  → reminders at 1/3/5 days past due
  → SUSPENDED (7 days past due — storefront + admin gated)
  → CANCELLED (30 more days unresolved)
```

While `SUSPENDED` or `CANCELLED`, the dealer's storefront shows a polite
"temporarily unavailable" page to their customers, and their `/admin` shows
a pay-now wall (they can still reach `/admin/billing` to pay and reinstate
themselves — nothing else). Paying at any point in this lifecycle brings
them straight back to `ACTIVE`.

### Manual controls

On a dealer's detail page (`/platform/dealers/[id]`):

- **Extend trial** — buy them more time before their first payment is due.
  Use this for goodwill gestures or known payment delays on your end.
- **Suspend** — immediately gate their storefront/admin, bypassing the
  normal dunning timeline. Use for policy violations or a dealer's own
  request to pause.
- **Reactivate** — lift a suspension without requiring a payment. Use
  sparingly; it's meant for correcting a mistaken suspension, not as a
  standard unlock.
- **Change plan** — move them to a different `Plan` immediately (not
  gated behind a payment, unlike a dealer changing their own plan from
  `/admin/billing`, which does require paying the new plan's price first).

Every one of these actions is audit-logged, including who did it.

## Impersonation (support mode)

From a dealer's detail page, click **Impersonate** next to any staff member
to sign in as them without needing their password. This is for
troubleshooting a dealer's reported issue firsthand. You'll see a banner at
the top of the impersonated session with an **Exit** button — clicking it
returns you to your own platform-admin session (no need to sign in again).
Both starting and ending an impersonation session are audit-logged.

## Handling a deposit dispute

Disputes are surfaced within the dealer's own `/admin/deposits`, not on the
platform side — a dealer marks a reservation **Disputed** when there's a
disagreement with a buyer. If a dealer escalates a dispute to you:

1. Impersonate the relevant staff member (or ask them to screen-share) to
   see the reservation's full payment and status history in
   `/admin/deposits/[id]`.
2. The underlying Flutterwave transaction is the source of truth for
   whether money actually moved — cross-check the `providerRef` shown there
   against your Flutterwave dashboard if there's any doubt about payment
   status.
3. Refunds themselves are processed through Flutterwave directly (this
   platform doesn't call Flutterwave's refund API automatically) — once
   you've processed one, make sure the dealer marks the reservation
   **Refunded** so their records stay accurate.

## Day-to-day operational checklist

- Check `/platform` weekly for dealers stuck in `PAST_DUE` — a personal
  nudge alongside the automatic dunning emails/SMS often resolves it faster.
- Watch for dealers approaching `SUSPENDED` that you know are engaged/active
  — a quick outreach beats losing them to an auto-suspend.
- Review new sign-ups' storefronts a day or two after onboarding — this is
  the best way to catch a dealer stuck in the setup wizard or confused about
  next steps before it becomes a support ticket.
