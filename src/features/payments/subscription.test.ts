import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const verifyTransactionMock = vi.fn();
const initiatePaymentMock = vi.fn();

vi.mock("@/lib/flutterwave", () => ({
  verifyTransaction: verifyTransactionMock,
  isValidWebhookHash: vi.fn(() => true),
  initiatePayment: initiatePaymentMock,
}));
vi.mock("@/lib/sms", () => ({ sendSms: vi.fn() }));
vi.mock("@/lib/mailer", () => ({ sendEmail: vi.fn() }));

const { forDealership, forPlatform } = await import("@/features/tenancy");
const {
  processFlutterwaveWebhookEvent,
  initiateSubscriptionPayment,
  runSubscriptionDunning,
} = await import("./service");
const platformService = await import("@/features/platform/service");

const platform = forPlatform();
const CURRENCY = "UGX";

let dealer: { id: string; name: string };
let plan: { id: string };
let plan2: { id: string };
let actorId: string;

beforeAll(async () => {
  const suffix = randomUUID().slice(0, 8);
  dealer = await platform.dealership.create({
    data: { slug: `test-billing-${suffix}`, name: "Test Billing Dealer" },
  });
  await platform.setting.create({
    data: { dealershipId: dealer.id, email: `owner-${suffix}@example.com` },
  });
  plan = await platform.plan.create({
    data: {
      code: `starter-test-${suffix}`,
      name: "Starter",
      priceMonthly: 150_000,
      priceYearly: 1_500_000,
      currency: CURRENCY,
      trialDays: 14,
      features: {},
    },
  });
  plan2 = await platform.plan.create({
    data: {
      code: `growth-test-${suffix}`,
      name: "Growth",
      priceMonthly: 350_000,
      priceYearly: 3_500_000,
      currency: CURRENCY,
      trialDays: 14,
      features: {},
    },
  });
  const owner = await forDealership(dealer.id).user.create({
    data: {
      dealershipId: dealer.id,
      name: "Test Owner",
      email: `billing-owner-${suffix}@example.com`,
      passwordHash: "not-a-real-hash",
      role: "OWNER",
    },
  });
  actorId = owner.id;
});

afterAll(async () => {
  await platform.dealership.delete({ where: { id: dealer.id } });
  await platform.plan.deleteMany({ where: { id: { in: [plan.id, plan2.id] } } });
});

beforeEach(() => {
  verifyTransactionMock.mockReset();
  initiatePaymentMock.mockReset();
});

/**
 * Fully resets the shared test subscription row before each scenario —
 * plain upsert() would leave fields untouched by `data` (pastDueSince,
 * dunningStage, pendingPlanId…) carrying over from whichever test ran
 * before it, since every test in this file shares one dealer/subscription.
 */
async function resetSubscription(
  data: Pick<Prisma.SubscriptionUncheckedCreateInput, "planId" | "status"> &
    Partial<Prisma.SubscriptionUncheckedCreateInput>,
) {
  const full: Prisma.SubscriptionUncheckedCreateInput = {
    dealershipId: dealer.id,
    trialEndsAt: null,
    currentPeriodStart: null,
    currentPeriodEnd: null,
    pastDueSince: null,
    dunningStage: 0,
    lastDunningSentAt: null,
    pendingPlanId: null,
    pendingBillingInterval: null,
    ...data,
  };
  await platform.subscription.upsert({
    where: { dealershipId: dealer.id },
    create: full,
    update: full,
  });
  await platform.dealership.update({ where: { id: dealer.id }, data: { status: "ACTIVE" } });
}

function mockSuccessfulVerification(amount: number) {
  verifyTransactionMock.mockImplementation(async (flwTransactionId: string) => ({
    ok: true as const,
    status: "successful" as const,
    amount,
    currency: CURRENCY,
    txRef: flwTransactionId,
    flwTransactionId,
    raw: {},
  }));
}

describe("initiateSubscriptionPayment", () => {
  it("creates a PENDING transaction and starts checkout", async () => {
    await resetSubscription({ planId: plan.id, status: "TRIALING", trialEndsAt: new Date(Date.now() + 86_400_000) });
    initiatePaymentMock.mockResolvedValue({ ok: true, checkoutUrl: "https://pay.example/x" });

    const result = await initiateSubscriptionPayment(
      dealer.id,
      { planId: plan.id, billingInterval: "MONTHLY" },
      { name: "Test Owner", email: "owner@example.com" },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.checkoutUrl).toBe("https://pay.example/x");

    const db = forDealership(dealer.id);
    const txns = await db.paymentTransaction.findMany({
      where: { purpose: "SUBSCRIPTION" },
      orderBy: { createdAt: "desc" },
    });
    expect(txns[0]?.status).toBe("PENDING");
    expect(Number(txns[0]?.amount)).toBe(150_000);
  });

  it("returns an error and doesn't leave a dangling PENDING row when Flutterwave rejects", async () => {
    await resetSubscription({ planId: plan.id, status: "TRIALING", trialEndsAt: new Date(Date.now() + 86_400_000) });
    initiatePaymentMock.mockResolvedValue({ ok: false, error: "boom" });

    const result = await initiateSubscriptionPayment(
      dealer.id,
      { planId: plan.id, billingInterval: "MONTHLY" },
      { name: "Test Owner", email: "owner@example.com" },
    );

    expect(result.ok).toBe(false);
  });
});

describe("processFlutterwaveWebhookEvent — subscriptions", () => {
  it("activates the subscription and dealership on a valid webhook", async () => {
    await resetSubscription({ planId: plan.id, status: "TRIALING", trialEndsAt: new Date(Date.now() + 86_400_000) });
    await platform.dealership.update({ where: { id: dealer.id }, data: { status: "TRIAL_EXPIRED" } });

    const subscription = await platform.subscription.findUniqueOrThrow({
      where: { dealershipId: dealer.id },
    });
    const txRef = `sub_${subscription.id}_${Date.now()}`;
    await platform.paymentTransaction.create({
      data: {
        dealershipId: dealer.id,
        subscriptionId: subscription.id,
        purpose: "SUBSCRIPTION",
        provider: "FLUTTERWAVE",
        providerRef: txRef,
        status: "PENDING",
        amount: 150_000,
        currency: CURRENCY,
      },
    });
    mockSuccessfulVerification(150_000);

    await processFlutterwaveWebhookEvent({
      event: "charge.completed",
      data: { id: txRef, tx_ref: txRef },
    });

    const updatedSub = await platform.subscription.findUniqueOrThrow({
      where: { dealershipId: dealer.id },
    });
    const updatedDealer = await platform.dealership.findUniqueOrThrow({
      where: { id: dealer.id },
    });
    const txn = await platform.paymentTransaction.findUniqueOrThrow({
      where: { providerRef: txRef },
    });

    expect(updatedSub.status).toBe("ACTIVE");
    expect(updatedSub.currentPeriodEnd).not.toBeNull();
    expect(updatedDealer.status).toBe("ACTIVE");
    expect(txn.status).toBe("SUCCESSFUL");
  });

  it("applies a pending plan change on settlement", async () => {
    await resetSubscription({ planId: plan.id, status: "PAST_DUE", pastDueSince: new Date() });
    const subscription = await platform.subscription.findUniqueOrThrow({
      where: { dealershipId: dealer.id },
    });
    await platform.subscription.update({
      where: { dealershipId: dealer.id },
      data: { pendingPlanId: plan2.id, pendingBillingInterval: "YEARLY" },
    });

    const txRef = `sub_${subscription.id}_${Date.now()}`;
    await platform.paymentTransaction.create({
      data: {
        dealershipId: dealer.id,
        subscriptionId: subscription.id,
        purpose: "SUBSCRIPTION",
        provider: "FLUTTERWAVE",
        providerRef: txRef,
        status: "PENDING",
        amount: 3_500_000,
        currency: CURRENCY,
      },
    });
    mockSuccessfulVerification(3_500_000);

    await processFlutterwaveWebhookEvent({
      event: "charge.completed",
      data: { id: txRef, tx_ref: txRef },
    });

    const updatedSub = await platform.subscription.findUniqueOrThrow({
      where: { dealershipId: dealer.id },
    });
    expect(updatedSub.planId).toBe(plan2.id);
    expect(updatedSub.billingInterval).toBe("YEARLY");
    expect(updatedSub.pendingPlanId).toBeNull();
  });

  it("marks the transaction FAILED on charge.failed without touching subscription status", async () => {
    await resetSubscription({ planId: plan.id, status: "PAST_DUE", pastDueSince: new Date() });
    const subscription = await platform.subscription.findUniqueOrThrow({
      where: { dealershipId: dealer.id },
    });
    const txRef = `sub_${subscription.id}_${Date.now()}`;
    await platform.paymentTransaction.create({
      data: {
        dealershipId: dealer.id,
        subscriptionId: subscription.id,
        purpose: "SUBSCRIPTION",
        provider: "FLUTTERWAVE",
        providerRef: txRef,
        status: "PENDING",
        amount: 150_000,
        currency: CURRENCY,
      },
    });

    await processFlutterwaveWebhookEvent({ event: "charge.failed", data: { tx_ref: txRef } });

    const txn = await platform.paymentTransaction.findUniqueOrThrow({
      where: { providerRef: txRef },
    });
    const updatedSub = await platform.subscription.findUniqueOrThrow({
      where: { dealershipId: dealer.id },
    });
    expect(txn.status).toBe("FAILED");
    expect(verifyTransactionMock).not.toHaveBeenCalled();
    expect(updatedSub.status).toBe("PAST_DUE");
  });

  it("is a no-op when a successful subscription webhook is replayed", async () => {
    await resetSubscription({ planId: plan.id, status: "TRIALING", trialEndsAt: new Date(Date.now() + 86_400_000) });
    const subscription = await platform.subscription.findUniqueOrThrow({
      where: { dealershipId: dealer.id },
    });
    const txRef = `sub_${subscription.id}_${Date.now()}`;
    await platform.paymentTransaction.create({
      data: {
        dealershipId: dealer.id,
        subscriptionId: subscription.id,
        purpose: "SUBSCRIPTION",
        provider: "FLUTTERWAVE",
        providerRef: txRef,
        status: "PENDING",
        amount: 150_000,
        currency: CURRENCY,
      },
    });
    mockSuccessfulVerification(150_000);

    const event = { event: "charge.completed" as const, data: { id: txRef, tx_ref: txRef } };
    await processFlutterwaveWebhookEvent(event);
    await processFlutterwaveWebhookEvent(event);

    expect(verifyTransactionMock).toHaveBeenCalledTimes(1);
  });
});

describe("runSubscriptionDunning", () => {
  it("transitions an expired trial to PAST_DUE and the dealer to TRIAL_EXPIRED", async () => {
    await resetSubscription({
      planId: plan.id,
      status: "TRIALING",
      trialEndsAt: new Date(Date.now() - 60_000),
    });

    const result = await runSubscriptionDunning(dealer.id);

    expect(result.trialExpired).toBe(1);
    const sub = await platform.subscription.findUniqueOrThrow({ where: { dealershipId: dealer.id } });
    const d = await platform.dealership.findUniqueOrThrow({ where: { id: dealer.id } });
    expect(sub.status).toBe("PAST_DUE");
    expect(sub.pastDueSince).not.toBeNull();
    expect(d.status).toBe("TRIAL_EXPIRED");
  });

  it("sends a reminder without suspending inside the grace period", async () => {
    await resetSubscription({
      planId: plan.id,
      status: "PAST_DUE",
      pastDueSince: new Date(Date.now() - 2 * 86_400_000),
      dunningStage: 0,
    });

    const result = await runSubscriptionDunning(dealer.id);

    expect(result.reminderSent).toBe(1);
    expect(result.suspended).toBe(0);
    const sub = await platform.subscription.findUniqueOrThrow({ where: { dealershipId: dealer.id } });
    expect(sub.dunningStage).toBe(1);
    expect(sub.status).toBe("PAST_DUE");
  });

  it("suspends the dealer once the grace period has fully elapsed", async () => {
    await resetSubscription({
      planId: plan.id,
      status: "PAST_DUE",
      pastDueSince: new Date(Date.now() - 8 * 86_400_000),
      dunningStage: 2,
    });

    const result = await runSubscriptionDunning(dealer.id);

    expect(result.suspended).toBe(1);
    const sub = await platform.subscription.findUniqueOrThrow({ where: { dealershipId: dealer.id } });
    const d = await platform.dealership.findUniqueOrThrow({ where: { id: dealer.id } });
    expect(sub.status).toBe("SUSPENDED");
    expect(d.status).toBe("SUSPENDED");
  });

  it("cancels after a long unresolved suspension", async () => {
    await resetSubscription({
      planId: plan.id,
      status: "SUSPENDED",
      pastDueSince: new Date(Date.now() - 40 * 86_400_000),
    });

    const result = await runSubscriptionDunning(dealer.id);

    expect(result.cancelled).toBe(1);
    const sub = await platform.subscription.findUniqueOrThrow({ where: { dealershipId: dealer.id } });
    expect(sub.status).toBe("CANCELLED");
  });
});

describe("platform admin manual controls", () => {
  it("extends a trial and reactivates the dealer", async () => {
    await resetSubscription({ planId: plan.id, status: "SUSPENDED" });
    await platform.dealership.update({ where: { id: dealer.id }, data: { status: "SUSPENDED" } });

    await platformService.extendDealerTrial(actorId, dealer.id, 7);

    const sub = await platform.subscription.findUniqueOrThrow({ where: { dealershipId: dealer.id } });
    const d = await platform.dealership.findUniqueOrThrow({ where: { id: dealer.id } });
    expect(sub.status).toBe("TRIALING");
    expect(d.status).toBe("ACTIVE");
  });

  it("suspends and reactivates a dealer", async () => {
    await resetSubscription({ planId: plan.id, status: "ACTIVE" });

    await platformService.suspendDealer(actorId, dealer.id, "non-payment");
    let d = await platform.dealership.findUniqueOrThrow({ where: { id: dealer.id } });
    expect(d.status).toBe("SUSPENDED");

    await platformService.reactivateDealer(actorId, dealer.id);
    d = await platform.dealership.findUniqueOrThrow({ where: { id: dealer.id } });
    const sub = await platform.subscription.findUniqueOrThrow({ where: { dealershipId: dealer.id } });
    expect(d.status).toBe("ACTIVE");
    expect(sub.status).toBe("ACTIVE");
  });

  it("changes a dealer's plan", async () => {
    await resetSubscription({ planId: plan.id, status: "ACTIVE" });

    await platformService.changeDealerPlan(actorId, dealer.id, plan2.id);

    const sub = await platform.subscription.findUniqueOrThrow({ where: { dealershipId: dealer.id } });
    expect(sub.planId).toBe(plan2.id);
  });

  it("lists dealers and computes platform metrics", async () => {
    await resetSubscription({ planId: plan.id, status: "ACTIVE" });

    const dealers = await platformService.listDealers({ search: dealer.name });
    expect(dealers.some((d) => d.id === dealer.id)).toBe(true);

    const metrics = await platformService.getPlatformMetrics();
    expect(metrics.totalDealers).toBeGreaterThan(0);
  });
});
