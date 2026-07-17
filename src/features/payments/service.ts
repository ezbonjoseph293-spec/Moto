import type { Reservation, Setting } from "@prisma/client";

import { forDealership, forPlatform } from "@/features/tenancy";
import { recordAuditLog } from "@/lib/audit";
import { initiatePayment, verifyTransaction } from "@/lib/flutterwave";
import { sendEmail } from "@/lib/mailer";
import { sendSms } from "@/lib/sms";
import { logger } from "@/lib/logger";
import { getEnv } from "@/lib/env";
import { formatPrice } from "@/lib/format";
import type { ReserveVehicleInput, reservationStatusValues } from "./schema";

type ReservationStatusValue = (typeof reservationStatusValues)[number];

/** Abandoned checkouts (no webhook ever arrives) are cancelled after this long. */
const ABANDONED_CHECKOUT_HOURS = 2;

export function computeDepositAmount(
  setting: Pick<Setting, "depositType" | "depositFixedAmount" | "depositPercentage"> | null,
  vehiclePrice: number,
): number {
  if (!setting) return 0;
  if (setting.depositType === "PERCENTAGE") {
    return Math.round((vehiclePrice * Number(setting.depositPercentage ?? 0)) / 100);
  }
  return Number(setting.depositFixedAmount ?? 0);
}

// ============================================================================
// Reserve: create Reservation + PaymentTransaction, start Flutterwave checkout
// ============================================================================

export type InitiateReservationResult =
  | { ok: true; checkoutUrl: string }
  | { ok: false; error: string };

/**
 * Creates the Reservation + PaymentTransaction pair (both PENDING) and
 * starts a Flutterwave hosted checkout. The vehicle is deliberately NOT
 * locked here — it only flips to RESERVED once the webhook verifies payment
 * (see processFlutterwaveWebhookEvent) — so an abandoned or slow checkout
 * never blocks the car for other buyers.
 */
export async function initiateReservation(
  dealershipId: string,
  input: ReserveVehicleInput,
): Promise<InitiateReservationResult> {
  const db = forDealership(dealershipId);

  const [vehicle, setting] = await Promise.all([
    db.vehicle.findUnique({ where: { id: input.vehicleId } }),
    db.setting.findUnique({ where: { dealershipId } }),
  ]);

  if (!vehicle) return { ok: false, error: "Vehicle not found." };
  if (vehicle.status !== "AVAILABLE") {
    return { ok: false, error: "This vehicle is no longer available to reserve." };
  }

  const price = Number(vehicle.discountPrice ?? vehicle.price);
  const depositAmount = computeDepositAmount(setting, price);
  if (depositAmount <= 0) {
    return { ok: false, error: "Deposit reservations aren't set up for this dealership yet." };
  }

  const { reservation, txRef } = await db.$transaction(async (tx) => {
    const reservation = await tx.reservation.create({
      data: {
        dealershipId,
        vehicleId: vehicle.id,
        buyerName: input.buyerName,
        buyerPhone: input.buyerPhone,
        buyerEmail: input.buyerEmail ?? null,
        depositAmount,
        currency: vehicle.currency,
        status: "PENDING_PAYMENT",
      },
    });

    const txRef = `dep_${reservation.id}`;
    await tx.paymentTransaction.create({
      data: {
        dealershipId,
        reservationId: reservation.id,
        purpose: "DEPOSIT",
        provider: "FLUTTERWAVE",
        providerRef: txRef,
        status: "PENDING",
        amount: depositAmount,
        currency: vehicle.currency,
      },
    });

    return { reservation, txRef };
  }, { timeout: 15_000 });

  const env = getEnv();
  const result = await initiatePayment({
    txRef,
    amount: depositAmount,
    currency: vehicle.currency,
    redirectUrl: `${env.NEXT_PUBLIC_APP_URL}/reserve/callback?tx_ref=${encodeURIComponent(txRef)}`,
    customer: {
      email: input.buyerEmail || "no-reply@example.com",
      phoneNumber: input.buyerPhone,
      name: input.buyerName,
    },
    meta: { reservationId: reservation.id, dealershipId, vehicleId: vehicle.id },
    title: `Reserve ${vehicle.title}`,
    description: `Deposit to hold ${vehicle.title} (${vehicle.year})`,
  });

  if (!result.ok) {
    await db.$transaction([
      db.paymentTransaction.updateMany({
        where: { reservationId: reservation.id, status: "PENDING" },
        data: { status: "FAILED" },
      }),
      db.reservation.updateMany({
        where: { id: reservation.id, status: "PENDING_PAYMENT" },
        data: { status: "CANCELLED" },
      }),
    ]);
    return { ok: false, error: result.error };
  }

  await recordAuditLog({
    dealershipId,
    action: "reservation.checkout_started",
    entityType: "Reservation",
    entityId: reservation.id,
    after: { vehicleId: vehicle.id, depositAmount, txRef },
  });

  return { ok: true, checkoutUrl: result.checkoutUrl };
}

// ============================================================================
// Status lookup — used by the /reserve/callback polling page
// ============================================================================

export type ReservationStatusView = {
  reservationStatus: string;
  paymentStatus: string;
  vehicleSlug: string | null;
  dealerSlug: string;
};

/** Unscoped by design: the callback page only has a tx_ref, not a dealershipId yet. */
export async function getReservationStatusByTxRef(
  txRef: string,
): Promise<ReservationStatusView | null> {
  const db = forPlatform();
  const txn = await db.paymentTransaction.findUnique({
    where: { providerRef: txRef },
    include: {
      reservation: { include: { vehicle: { select: { slug: true } } } },
      dealership: { select: { slug: true } },
    },
  });
  if (!txn || !txn.reservation) return null;

  return {
    reservationStatus: txn.reservation.status,
    paymentStatus: txn.status,
    vehicleSlug: txn.reservation.vehicle?.slug ?? null,
    dealerSlug: txn.dealership.slug,
  };
}

// ============================================================================
// Webhook processing
// ============================================================================

export type WebhookEvent = {
  event?: string;
  data?: { id?: number | string; tx_ref?: string; status?: string };
};

/**
 * Processes one Flutterwave webhook delivery. The caller (the route handler)
 * is responsible for verifying the `verif-hash` header before calling this —
 * everything here treats the payload as an untrusted trigger and re-fetches
 * the transaction from Flutterwave's API before trusting anything about it.
 *
 * Idempotent: looking a transaction up by providerRef and short-circuiting
 * once it's already SUCCESSFUL/FAILED makes retried and replayed webhook
 * deliveries safe no-ops.
 */
export async function processFlutterwaveWebhookEvent(payload: WebhookEvent): Promise<void> {
  const txRef = payload.data?.tx_ref;
  const flwTransactionId = payload.data?.id;
  if (!txRef) return;

  const platform = forPlatform();
  const txn = await platform.paymentTransaction.findUnique({
    where: { providerRef: txRef },
    include: { reservation: true },
  });
  if (!txn || !txn.reservation) {
    logger.warn({ txRef }, "flutterwave.webhook_unknown_tx_ref");
    return;
  }
  if (txn.status !== "PENDING") {
    // Already processed (retry/replay) — nothing left to do.
    return;
  }

  if (payload.event === "charge.failed") {
    await markPaymentFailed(txn.dealershipId, txn.id, txn.reservationId!);
    return;
  }

  if (payload.event !== "charge.completed" || flwTransactionId === undefined) return;

  const verified = await verifyTransaction(String(flwTransactionId));
  const expectedAmount = Number(txn.amount);

  const isValid =
    verified.ok &&
    verified.status === "successful" &&
    verified.txRef === txRef &&
    verified.currency === txn.currency &&
    verified.amount >= expectedAmount;

  if (!isValid) {
    logger.error({ txRef, verified }, "flutterwave.webhook_verification_failed");
    await markPaymentFailed(txn.dealershipId, txn.id, txn.reservationId!);
    return;
  }

  await settleVerifiedPayment(txn.dealershipId, txn.id, txn.reservationId!, verified.raw);
}

async function markPaymentFailed(dealershipId: string, txnId: string, reservationId: string) {
  const db = forDealership(dealershipId);
  await db.$transaction([
    db.paymentTransaction.updateMany({
      where: { id: txnId, status: "PENDING" },
      data: { status: "FAILED" },
    }),
    db.reservation.updateMany({
      where: { id: reservationId, status: "PENDING_PAYMENT" },
      data: { status: "CANCELLED" },
    }),
  ]);

  await recordAuditLog({
    dealershipId,
    action: "reservation.payment_failed",
    entityType: "PaymentTransaction",
    entityId: txnId,
  });
}

/**
 * The safety-critical step: marks the payment SUCCESSFUL and atomically
 * tries to flip the vehicle AVAILABLE -> RESERVED. Whichever of two
 * concurrent buyers' webhooks wins that conditional update gets the car;
 * the loser's deposit was still captured, so their reservation is flagged
 * REFUND_PENDING for the dealer instead of silently disappearing.
 */
async function settleVerifiedPayment(
  dealershipId: string,
  txnId: string,
  reservationId: string,
  rawPayload: unknown,
) {
  const db = forDealership(dealershipId);

  const outcome = await db.$transaction(
    async (tx) => {
      const claimed = await tx.paymentTransaction.updateMany({
        where: { id: txnId, status: "PENDING" },
        data: { status: "SUCCESSFUL", rawPayload: rawPayload as never, verifiedAt: new Date() },
      });
      if (claimed.count === 0) return null; // Concurrent webhook already handled this one.

      const [reservation, setting] = await Promise.all([
        tx.reservation.findUniqueOrThrow({ where: { id: reservationId } }),
        tx.setting.findUnique({ where: { dealershipId } }),
      ]);
      const holdHours = setting?.depositHoldHours ?? 48;

      const locked = await tx.vehicle.updateMany({
        where: { id: reservation.vehicleId, status: "AVAILABLE" },
        data: { status: "RESERVED" },
      });

      if (locked.count === 1) {
        const holdExpiresAt = new Date(Date.now() + holdHours * 60 * 60 * 1000);
        const [updated, vehicle] = await Promise.all([
          tx.reservation.update({
            where: { id: reservationId },
            data: { status: "ACTIVE", holdExpiresAt },
          }),
          tx.vehicle.findUniqueOrThrow({ where: { id: reservation.vehicleId } }),
        ]);

        await Promise.all([
          tx.lead.create({
            data: {
              dealershipId,
              source: "DEPOSIT",
              name: reservation.buyerName,
              phone: reservation.buyerPhone,
              email: reservation.buyerEmail,
              message: `Paid a ${formatPrice(reservation.depositAmount.toString(), reservation.currency)} deposit to reserve ${vehicle.title}.`,
              vehicleId: vehicle.id,
            },
          }),
          tx.notification.create({
            data: {
              dealershipId,
              type: "NEW_RESERVATION",
              title: "New reservation",
              message: `${reservation.buyerName} paid a deposit to reserve ${vehicle.title}.`,
              link: "/admin/deposits",
            },
          }),
        ]);

        return {
          kind: "active" as const,
          reservation: updated,
          vehicleTitle: vehicle.title,
          holdHours,
        };
      }

      const [updated] = await Promise.all([
        tx.reservation.update({
          where: { id: reservationId },
          data: {
            status: "REFUND_PENDING",
            refundStatus: "PENDING",
            refundNotes:
              "Vehicle was already reserved or sold by the time this payment was confirmed.",
          },
        }),
        tx.notification.create({
          data: {
            dealershipId,
            type: "PAYMENT_FAILED",
            title: "Deposit needs a refund",
            message: `${reservation.buyerName}'s deposit was captured, but the vehicle was already taken. Refund needed.`,
            link: "/admin/deposits",
          },
        }),
      ]);

      return { kind: "conflict" as const, reservation: updated };
    },
    { timeout: 20_000, maxWait: 15_000 },
  );

  if (!outcome) return;

  await recordAuditLog({
    dealershipId,
    action: outcome.kind === "active" ? "reservation.activated" : "reservation.payment_conflict",
    entityType: "Reservation",
    entityId: outcome.reservation.id,
  });

  if (outcome.kind === "active") {
    await notifyBuyer(outcome.reservation, {
      subject: "Your reservation is confirmed",
      smsMessage: `Your deposit for ${outcome.vehicleTitle} is confirmed. We're holding it for ${outcome.holdHours} hours.`,
      emailHtml: `<p>Your deposit for <strong>${outcome.vehicleTitle}</strong> is confirmed. We're holding it for ${outcome.holdHours} hours. The dealer will be in touch shortly.</p>`,
    });
  } else {
    await notifyBuyer(outcome.reservation, {
      subject: "About your deposit",
      smsMessage: `Sorry — that vehicle was just taken by another buyer. Your deposit will be refunded; the dealer will contact you shortly.`,
      emailHtml: `<p>Sorry — that vehicle was just taken by another buyer before your payment was confirmed. Your deposit will be refunded; the dealer will contact you shortly.</p>`,
    });
  }
}

async function notifyBuyer(
  reservation: Pick<Reservation, "buyerPhone" | "buyerEmail" | "buyerName">,
  content: { subject: string; smsMessage: string; emailHtml: string },
) {
  await sendSms({ to: reservation.buyerPhone, message: content.smsMessage });
  if (reservation.buyerEmail) {
    await sendEmail({ to: reservation.buyerEmail, subject: content.subject, html: content.emailHtml });
  }
}

// ============================================================================
// Expiry cron
// ============================================================================

export type ExpiryResult = { expired: number; abandonedCancelled: number };

/** Run per-dealership by the /api/cron/expire-reservations Vercel Cron target. */
export async function expireStaleReservations(dealershipId: string): Promise<ExpiryResult> {
  const db = forDealership(dealershipId);
  const now = new Date();

  const dueActive = await db.reservation.findMany({
    where: { status: "ACTIVE", holdExpiresAt: { lt: now } },
  });

  let expired = 0;
  for (const reservation of dueActive) {
    const released = await db.$transaction(async (tx) => {
      const vehicleReleased = await tx.vehicle.updateMany({
        where: { id: reservation.vehicleId, status: "RESERVED" },
        data: { status: "AVAILABLE" },
      });
      await tx.reservation.update({
        where: { id: reservation.id },
        data: { status: "EXPIRED", refundStatus: "PENDING" },
      });
      return vehicleReleased.count === 1;
    }, { timeout: 15_000 });

    await recordAuditLog({
      dealershipId,
      action: "reservation.expired",
      entityType: "Reservation",
      entityId: reservation.id,
      after: { vehicleReleased: released },
    });

    await db.notification.create({
      data: {
        dealershipId,
        type: "RESERVATION_EXPIRED",
        title: "Reservation expired",
        message: `${reservation.buyerName}'s hold expired. The vehicle is available again; deposit refund needed.`,
        link: "/admin/deposits",
      },
    });

    await notifyBuyer(reservation, {
      subject: "Your reservation hold has expired",
      smsMessage: `Your hold has expired. Your deposit will be refunded — the dealer will be in touch.`,
      emailHtml: `<p>Your reservation hold has expired. Your deposit will be refunded per our reservation policy; the dealer will be in touch shortly.</p>`,
    });

    expired += 1;
  }

  const abandonCutoff = new Date(Date.now() - ABANDONED_CHECKOUT_HOURS * 60 * 60 * 1000);
  const abandoned = await db.reservation.updateMany({
    where: { status: "PENDING_PAYMENT", createdAt: { lt: abandonCutoff } },
    data: { status: "CANCELLED" },
  });
  if (abandoned.count > 0) {
    await db.paymentTransaction.updateMany({
      where: { reservation: { status: "CANCELLED" }, status: "PENDING" },
      data: { status: "FAILED" },
    });
    await recordAuditLog({
      dealershipId,
      action: "reservation.abandoned_checkout_cancelled",
      entityType: "Reservation",
      after: { count: abandoned.count },
    });
  }

  return { expired, abandonedCancelled: abandoned.count };
}

// ============================================================================
// Admin: Deposits module
// ============================================================================

export async function listReservations(
  dealershipId: string,
  filters: { status?: ReservationStatusValue } = {},
) {
  const db = forDealership(dealershipId);
  return db.reservation.findMany({
    where: filters.status ? { status: filters.status } : undefined,
    include: { vehicle: { select: { title: true, slug: true, year: true } }, paymentTxns: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getReservation(dealershipId: string, id: string) {
  const db = forDealership(dealershipId);
  return db.reservation.findUnique({
    where: { id },
    include: { vehicle: { select: { title: true, slug: true, year: true } }, paymentTxns: true },
  });
}

export async function markReservationRefunded(
  dealershipId: string,
  actorId: string,
  reservationId: string,
  notes: string | undefined,
) {
  const db = forDealership(dealershipId);
  const before = await db.reservation.findUniqueOrThrow({ where: { id: reservationId } });

  const updated = await db.reservation.update({
    where: { id: reservationId },
    data: {
      status: before.status === "REFUND_PENDING" ? "REFUNDED" : before.status,
      refundStatus: "REFUNDED",
      refundNotes: notes ?? before.refundNotes,
    },
  });

  await db.paymentTransaction.updateMany({
    where: { reservationId, status: "SUCCESSFUL" },
    data: { status: "REFUNDED" },
  });

  await recordAuditLog({
    dealershipId,
    actorId,
    action: "reservation.marked_refunded",
    entityType: "Reservation",
    entityId: reservationId,
    before: { status: before.status },
    after: { status: updated.status },
  });

  return updated;
}

export async function markReservationDisputed(
  dealershipId: string,
  actorId: string,
  reservationId: string,
  notes: string | undefined,
) {
  const db = forDealership(dealershipId);
  const before = await db.reservation.findUniqueOrThrow({ where: { id: reservationId } });

  const updated = await db.reservation.update({
    where: { id: reservationId },
    data: { status: "DISPUTED", refundNotes: notes ?? before.refundNotes },
  });

  await recordAuditLog({
    dealershipId,
    actorId,
    action: "reservation.marked_disputed",
    entityType: "Reservation",
    entityId: reservationId,
    before: { status: before.status },
    after: { status: updated.status, notes },
  });

  return updated;
}

// ============================================================================
// Vehicle status sync — called from inventory's transitionVehicleStatus
// whenever a vehicle leaves RESERVED, so a reservation never goes stale
// silently when a dealer manually completes or releases the sale.
// ============================================================================

export async function syncReservationOnVehicleRelease(
  dealershipId: string,
  actorId: string,
  vehicleId: string,
  toStatus: "SOLD" | "AVAILABLE" | "ARCHIVED",
) {
  const db = forDealership(dealershipId);
  const active = await db.reservation.findFirst({
    where: { vehicleId, status: "ACTIVE" },
  });
  if (!active) return;

  if (toStatus === "SOLD") {
    await db.reservation.update({ where: { id: active.id }, data: { status: "COMPLETED" } });
    await recordAuditLog({
      dealershipId,
      actorId,
      action: "reservation.completed",
      entityType: "Reservation",
      entityId: active.id,
    });
    return;
  }

  await db.reservation.update({
    where: { id: active.id },
    data: { status: "CANCELLED", refundStatus: "PENDING" },
  });
  await recordAuditLog({
    dealershipId,
    actorId,
    action: "reservation.cancelled_by_dealer",
    entityType: "Reservation",
    entityId: active.id,
    after: { vehicleStatus: toStatus },
  });
  await notifyBuyer(active, {
    subject: "Your reservation was cancelled",
    smsMessage: `Your reservation was cancelled by the dealer. Your deposit will be refunded.`,
    emailHtml: `<p>Your reservation was cancelled by the dealer. Your deposit will be refunded per our reservation policy.</p>`,
  });
}

export async function getReservationHistory(dealershipId: string, reservationId: string) {
  const db = forPlatform();
  return db.auditLog.findMany({
    where: { dealershipId, entityType: "Reservation", entityId: reservationId },
    orderBy: { createdAt: "asc" },
    include: { actor: { select: { name: true, email: true } } },
  });
}
