# tenancy

Multi-tenant foundation: the tenant-scoped repository layer (all dealer-owned
data access goes through it) and isolation guarantees, built in Stage 1;
dealership resolution from `/{dealerSlug}` is added in Stage 3.

## Usage

```ts
import { forDealership, forPlatform } from "@/features/tenancy";

// Dealer-scoped: every query below is auto-filtered/stamped with dealershipId.
const db = forDealership(dealershipId);
await db.vehicle.findMany({ where: { status: "AVAILABLE" } });

// Platform-level only (super admin panel, cross-dealer cron jobs).
const platformDb = forPlatform();
await platformDb.dealership.findMany();
```

Never import `@/lib/prisma` (the raw client) outside `src/lib` or
`src/features/tenancy` — an ESLint rule (`eslint.config.mjs`) blocks it. All
dealer-owned data access must go through `forDealership()`.

See `dealer-owned-models.ts` for exactly which models are auto-scoped, and
`scoped-client.ts` for how. `User`, `Notification`, and `AuditLog` have a
nullable `dealershipId` (platform admins, customer accounts, and
platform-level audit entries can have none) and are intentionally excluded
from the automatic scoping — code touching them must filter by
`dealershipId` explicitly where relevant.
