import { forPlatform } from "@/features/tenancy";
import { recordAuditLog } from "@/lib/audit";
import type { DealershipStatus } from "@prisma/client";

// ============================================================================
// Dealers table & detail
// ============================================================================

export async function listDealers(filters: { search?: string; status?: DealershipStatus } = {}) {
  const db = forPlatform();
  return db.dealership.findMany({
    where: {
      status: filters.status,
      ...(filters.search
        ? {
            OR: [
              { name: { contains: filters.search, mode: "insensitive" } },
              { slug: { contains: filters.search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { subscription: { include: { plan: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getDealerDetail(dealershipId: string) {
  const db = forPlatform();
  const dealership = await db.dealership.findUnique({
    where: { id: dealershipId },
    include: {
      subscription: { include: { plan: true } },
      users: {
        where: { role: { in: ["OWNER", "MANAGER", "SALES"] } },
        orderBy: { role: "asc" },
        select: { id: true, name: true, email: true, role: true, isActive: true },
      },
    },
  });
  if (!dealership) return null;

  const paymentTxns = await db.paymentTransaction.findMany({
    where: { dealershipId, purpose: "SUBSCRIPTION" },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return { dealership, paymentTxns };
}

export async function listPlans() {
  const db = forPlatform();
  return db.plan.findMany({ where: { isActive: true }, orderBy: { priceMonthly: "asc" } });
}

// ============================================================================
// Platform metrics
// ============================================================================

export async function getPlatformMetrics() {
  const db = forPlatform();

  const [dealerCounts, depositAgg, subscriptionAgg] = await Promise.all([
    db.dealership.groupBy({ by: ["status"], _count: { _all: true } }),
    db.paymentTransaction.aggregate({
      where: { purpose: "DEPOSIT", status: "SUCCESSFUL" },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    db.paymentTransaction.aggregate({
      where: { purpose: "SUBSCRIPTION", status: "SUCCESSFUL" },
      _sum: { amount: true },
      _count: { _all: true },
    }),
  ]);

  const byStatus: Record<string, number> = {};
  for (const row of dealerCounts) byStatus[row.status] = row._count._all;

  const [trialingCount, activeCount, pastDueCount] = await Promise.all([
    db.subscription.count({ where: { status: "TRIALING" } }),
    db.subscription.count({ where: { status: "ACTIVE" } }),
    db.subscription.count({ where: { status: "PAST_DUE" } }),
  ]);

  return {
    totalDealers: dealerCounts.reduce((sum, r) => sum + r._count._all, 0),
    byStatus,
    trialingCount,
    activeSubscriptionCount: activeCount,
    pastDueCount,
    depositsVolume: Number(depositAgg._sum.amount ?? 0),
    depositsCount: depositAgg._count._all,
    subscriptionRevenue: Number(subscriptionAgg._sum.amount ?? 0),
    subscriptionPaymentsCount: subscriptionAgg._count._all,
  };
}

// ============================================================================
// Manual controls
// ============================================================================

export async function extendDealerTrial(actorId: string, dealershipId: string, days: number) {
  const db = forPlatform();
  const subscription = await db.subscription.findUniqueOrThrow({ where: { dealershipId } });

  const base =
    subscription.trialEndsAt && subscription.trialEndsAt > new Date()
      ? subscription.trialEndsAt
      : new Date();
  const trialEndsAt = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);

  const updated = await db.$transaction([
    db.subscription.update({
      where: { dealershipId },
      data: { status: "TRIALING", trialEndsAt, pastDueSince: null, dunningStage: 0 },
    }),
    db.dealership.update({ where: { id: dealershipId }, data: { status: "ACTIVE" } }),
  ]);

  await recordAuditLog({
    dealershipId,
    actorId,
    action: "platform.trial_extended",
    entityType: "Subscription",
    entityId: subscription.id,
    after: { trialEndsAt, days },
  });

  return updated[0];
}

export async function suspendDealer(actorId: string, dealershipId: string, reason?: string) {
  const db = forPlatform();
  const subscription = await db.subscription.findUnique({ where: { dealershipId } });

  await db.$transaction([
    db.dealership.update({ where: { id: dealershipId }, data: { status: "SUSPENDED" } }),
    ...(subscription
      ? [db.subscription.update({ where: { dealershipId }, data: { status: "SUSPENDED" } })]
      : []),
  ]);

  await recordAuditLog({
    dealershipId,
    actorId,
    action: "platform.dealer_suspended",
    entityType: "Dealership",
    entityId: dealershipId,
    after: { reason },
  });
}

export async function reactivateDealer(actorId: string, dealershipId: string) {
  const db = forPlatform();
  const subscription = await db.subscription.findUnique({ where: { dealershipId } });

  await db.$transaction([
    db.dealership.update({ where: { id: dealershipId }, data: { status: "ACTIVE" } }),
    ...(subscription
      ? [
          db.subscription.update({
            where: { dealershipId },
            data: {
              status: "ACTIVE",
              pastDueSince: null,
              dunningStage: 0,
              currentPeriodStart: new Date(),
              currentPeriodEnd: subscription.currentPeriodEnd ?? new Date(Date.now() + 30 * 86_400_000),
            },
          }),
        ]
      : []),
  ]);

  await recordAuditLog({
    dealershipId,
    actorId,
    action: "platform.dealer_reactivated",
    entityType: "Dealership",
    entityId: dealershipId,
  });
}

export async function changeDealerPlan(actorId: string, dealershipId: string, planId: string) {
  const db = forPlatform();
  const [subscription, plan] = await Promise.all([
    db.subscription.findUniqueOrThrow({ where: { dealershipId } }),
    db.plan.findUniqueOrThrow({ where: { id: planId } }),
  ]);

  const updated = await db.subscription.update({
    where: { dealershipId },
    data: { planId: plan.id },
  });

  await recordAuditLog({
    dealershipId,
    actorId,
    action: "platform.dealer_plan_changed",
    entityType: "Subscription",
    entityId: subscription.id,
    before: { planId: subscription.planId },
    after: { planId: plan.id },
  });

  return updated;
}
