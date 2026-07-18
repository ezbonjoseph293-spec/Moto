# Admin Guide — Running Your Dealership on Moto

This guide is for dealership staff (owners, managers, salespeople) using the
`/admin` dashboard. No technical knowledge is needed — everything here can be
done from a phone.

If you're the platform operator looking for how to onboard a *new* dealership
or manage subscriptions across all dealers, see [PLATFORM_GUIDE.md](PLATFORM_GUIDE.md)
instead.

## Getting started

1. Go to your storefront and click **Sign in**, or go straight to
   `/login`.
2. First time signing in as the owner? You'll land in a short **setup
   wizard** — branding, contact details, and deposit policy — before you can
   see the rest of the dashboard. It takes under 10 minutes on a phone.
3. Once setup is done, the dashboard opens. On a phone you'll see a tab bar
   at the bottom; on a desktop, a sidebar on the left.

### Who can do what

| Role | Can do |
| --- | --- |
| **Owner** | Everything, including billing, team management, and settings. Only one owner per dealership. |
| **Manager** | Everything except billing and team management. |
| **Sales** | Add/edit vehicles, manage leads and deposits. Can't change settings or pricing rules. |

## Adding a car

1. Go to **Inventory** → **Add vehicle**.
2. Fill in the basics: brand, model/title, year, price, mileage, fuel type,
   transmission, condition. Add a description.
3. Upload photos — drag to reorder them, and tap the star icon to pick which
   one shows first (the "cover" photo) on listings.
4. Optionally add a video link or a PDF brochure.
5. Save as **Draft** first if you're not ready to publish, or set the status
   straight to **Available** to make it live on your storefront immediately.
6. Want it to go live automatically later (e.g. at a launch event)? Set a
   **Publish date** instead — it'll flip to Available on its own.

A car's status can only move forward in one direction:
`Draft → Available → Reserved → Sold`, with **Archived**/**Hidden** as
side-exits at any point. You'll never see "Reserved" as something you can
pick by hand — that only happens automatically when a buyer's deposit
payment is confirmed.

**Duplicating a car:** if you're listing several similar vehicles, open one
you've already created and tap **Duplicate** — it copies everything except
the photos, which you'll upload fresh for the new car.

**Bulk actions:** on the Inventory list, select multiple cars with the
checkboxes to change their status, delete them, or adjust pricing (set a new
price or apply a percentage discount) all at once.

**Importing many cars at once:** use **Export** to download a CSV template
of your current inventory format, fill in new rows, and **Import** it back.
Rows with mistakes are reported individually — the good rows still get
added even if a few have errors.

## Changing your branding (logo, colors, contact info)

Go to **Settings**:

- **Branding tab:** upload your logo (light and dark versions), favicon, pick
  your brand color and font, and see a live preview update as you change
  them.
- **Homepage content tab:** edit the subtitle text under your homepage
  headline, the four "why choose us" highlights, and the closing banner text
  and title — all shown live on your storefront the moment you save.
- **Contact tab:** phone numbers, WhatsApp number, email, address (with map
  coordinates so your storefront can show a pin), business hours, and social
  media links.
- **Navigation tab:** add, remove, and reorder the links in your header and
  footer menus.
- **Announcement tab:** a thin banner across the top of every storefront
  page — useful for a sale or holiday hours notice. Toggle it on/off anytime.

Every change here applies to your live storefront instantly.

## Editing a policy page

Go to **Settings** → **Pages & team** → **Pages & policies**. You'll see your
About page and every policy (Privacy, Terms, Warranty, Returns, Financing,
Cookie Policy). Open one, edit the text (basic formatting like **bold**,
lists, and headings works), and save. Every save is recorded so you can see
what changed and when.

## Handling a deposit / reservation

When a buyer pays a deposit online, three things happen automatically:

1. The car flips to **Reserved** on your storefront — no one else can pay a
   deposit on it while it's held.
2. You and the buyer both get a confirmation (SMS/email to the buyer, a
   notification to you).
3. A countdown starts based on your hold period (set in Settings → Deposit
   policy) — if the sale doesn't happen before it runs out, the car
   automatically goes back to Available.

To review deposits: go to **Deposits**. Each entry shows the payment status
and — while active — a live countdown to the hold expiry.

- **Sold the car?** Mark the vehicle **Sold** from its Inventory page — the
  reservation is automatically marked complete, no extra step needed.
- **Deal fell through?** Open the reservation and use **Mark as refunded**
  once you've processed the refund with your payment provider, or **Mark as
  disputed** if there's a disagreement to sort out with the buyer. Add notes
  either way — they're kept in the reservation's history.
- **Two buyers paid for the same car?** This can't actually happen — the
  system only ever confirms the *first* completed payment. If a second
  payment somehow comes in a split second later, it's automatically flagged
  for refund and shows up in your Deposits list as needing attention.

## Responding to a lead

Go to **Leads** — every inquiry lands here in one inbox: contact form
submissions, "ask about this car" questions, and deposit-related messages.

- Click a lead to see the full message and assign it to a team member.
- Move it through **New → Contacted → Closed** as you work it.
- Add notes so the next person (or future you) has context.
- You'll get an email and/or SMS the moment a new lead comes in, if you've
  turned that on in Settings → Deposit policy → Notification preferences.

## Collections & brands

**Settings isn't where these live** — go to **Inventory** → **Brands &
body types** to manage the brand/body-type lists shown across your site
(with logos), and **Inventory** → **Collections** to create curated
groupings like "Luxury" or "Under $20,000". A collection can be built by
hand (pick specific cars) or by rule (e.g. "all SUVs under a certain
price") — rule-based collections stay up to date automatically as your
inventory changes.

## Team management (Owner only)

Go to **Settings** → **Pages & team** → **Team**:

- **Invite staff:** enter their email and pick a role (Manager or Sales).
  They'll get an email link to set their own password — you never need to
  share or reset a password for them.
- **Change a role or deactivate someone:** use the staff table. Deactivating
  someone logs them out everywhere immediately.
- **Activity log:** see everything that's happened in your dashboard
  recently — who changed what, and when.

## Billing (Owner/Manager)

Go to **Billing** to see your current plan, trial or renewal date, and
payment history. If a payment is due, you'll see a reminder banner here (and
by email/SMS) with a **Pay now** button — paying keeps your storefront and
dashboard running without interruption.

## Tips for working from a phone

- The bottom tab bar covers the sections you'll use most day-to-day
  (Overview, Inventory, Leads, Deposits). Everything else is one tap away
  from the menu icon.
- Photo uploads work directly from your phone's camera roll — no need to
  transfer photos to a computer first.
- Every list (Inventory, Leads, Deposits) has search and filters built for
  small screens — pull up the filter panel with the filter icon.
