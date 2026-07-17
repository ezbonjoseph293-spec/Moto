import { prisma as basePrisma } from "@/lib/prisma";
import { isDealerOwnedModel } from "./dealer-owned-models";
import { TenancyViolationError } from "./tenancy-violation-error";

const READ_OPS = new Set([
  "findMany",
  "findFirst",
  "findFirstOrThrow",
  "findUnique",
  "findUniqueOrThrow",
  "count",
  "aggregate",
  "groupBy",
]);

const WHERE_WRITE_OPS = new Set(["update", "updateMany", "delete", "deleteMany"]);

type Row = Record<string, unknown>;

function scopedWhere(where: unknown, dealershipId: string): Row {
  const w = (where ?? {}) as Row;
  if ("dealershipId" in w && w.dealershipId !== dealershipId) {
    throw new TenancyViolationError(
      `Cross-tenant query blocked: where.dealershipId "${String(w.dealershipId)}" does not match scoped tenant "${dealershipId}".`,
    );
  }
  return { ...w, dealershipId };
}

function scopedData(data: unknown, dealershipId: string, label: string): Row {
  const d = (data ?? {}) as Row;
  if ("dealershipId" in d && d.dealershipId !== undefined && d.dealershipId !== dealershipId) {
    throw new TenancyViolationError(
      `Cross-tenant ${label} blocked: dealershipId "${String(d.dealershipId)}" does not match scoped tenant "${dealershipId}".`,
    );
  }
  return { ...d, dealershipId };
}

/**
 * Returns a Prisma Client bound to a single dealership. This is the only
 * sanctioned way to read or write dealer-owned data (enforced by the
 * no-restricted-imports ESLint rule on @/lib/prisma).
 *
 * Every operation against a model in DEALER_OWNED_MODELS is intercepted:
 * reads and where-bearing writes get `dealershipId` merged into `where`;
 * creates get `dealershipId` stamped onto `data`. If the caller already
 * supplied a *different* dealershipId anywhere in the query, that is a bug
 * trying to cross tenants — this throws TenancyViolationError rather than
 * silently overwriting it, so the bug surfaces immediately instead of being
 * masked.
 */
export function forDealership(dealershipId: string) {
  if (!dealershipId) {
    throw new TenancyViolationError("forDealership() requires a non-empty dealershipId.");
  }

  return basePrisma.$extends({
    name: `tenant:${dealershipId}`,
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!isDealerOwnedModel(model)) {
            return query(args);
          }

          const a = args as Row;

          if (READ_OPS.has(operation) || WHERE_WRITE_OPS.has(operation)) {
            a.where = scopedWhere(a.where, dealershipId);
          }

          if (operation === "create") {
            a.data = scopedData(a.data, dealershipId, "create");
          }

          if (operation === "createMany" && Array.isArray(a.data)) {
            a.data = (a.data as unknown[]).map((row) =>
              scopedData(row, dealershipId, "createMany"),
            );
          }

          if (operation === "upsert") {
            a.where = scopedWhere(a.where, dealershipId);
            a.create = scopedData(a.create, dealershipId, "upsert.create");
          }

          return query(a as never);
        },
      },
    },
  });
}

export type ScopedClient = ReturnType<typeof forDealership>;

/**
 * Explicit, unscoped escape hatch for platform-level code (super admin panel,
 * cross-dealer cron jobs). Every call site must write its own AuditLog entry
 * — there is no automatic enforcement of that here, so keep call sites few
 * and deliberate.
 */
export function forPlatform() {
  return basePrisma;
}
