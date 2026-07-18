"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { requireRole } from "@/features/auth/require-role";
import { forDealership } from "@/features/tenancy";
import { rateLimit } from "@/lib/rate-limit";
import * as paymentsService from "./service";
import {
  initiateSubscriptionPaymentSchema,
  reservationNoteSchema,
  reserveVehicleSchema,
} from "./schema";

export type FormState = { ok: boolean; error?: string; message?: string };

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

/**
 * Public form, no session (same shape as leads/actions.ts). On success it
 * redirects straight to the Flutterwave hosted checkout URL rather than
 * returning state — there's nothing useful to render in between.
 */
export async function initiateReservationAction(
  dealershipId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const ip = await clientIp();
  const limited = rateLimit(`reserve:${ip}`, 5, 10 * 60);
  if (!limited.success) {
    return { ok: false, error: "Too many attempts. Please try again in a few minutes." };
  }

  const parsed = reserveVehicleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await paymentsService.initiateReservation(dealershipId, parsed.data);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  redirect(result.checkoutUrl);
}

export type ReservationStatusResult = Awaited<
  ReturnType<typeof paymentsService.getReservationStatusByTxRef>
>;

/** Polled from the /reserve/callback client component after Flutterwave redirects back. */
export async function getReservationStatusAction(txRef: string): Promise<ReservationStatusResult> {
  return paymentsService.getReservationStatusByTxRef(txRef);
}

// ============================================================================
// Admin: Deposits module
// ============================================================================

export async function markReservationRefundedAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRole(["OWNER", "MANAGER"]);
  if (!user.dealershipId) return { ok: false, error: "This account has no dealership." };

  const parsed = reservationNoteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await paymentsService.markReservationRefunded(
    user.dealershipId,
    user.id,
    parsed.data.reservationId,
    parsed.data.notes,
  );
  return { ok: true, message: "Marked as refunded." };
}

export async function markReservationDisputedAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRole(["OWNER", "MANAGER"]);
  if (!user.dealershipId) return { ok: false, error: "This account has no dealership." };

  const parsed = reservationNoteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await paymentsService.markReservationDisputed(
    user.dealershipId,
    user.id,
    parsed.data.reservationId,
    parsed.data.notes,
  );
  return { ok: true, message: "Marked as disputed." };
}

// ============================================================================
// Admin: Billing (Stage 8)
// ============================================================================

export async function initiateSubscriptionPaymentAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRole(["OWNER", "MANAGER"]);
  if (!user.dealershipId) return { ok: false, error: "This account has no dealership." };

  const parsed = initiateSubscriptionPaymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const setting = await forDealership(user.dealershipId).setting.findUnique({
    where: { dealershipId: user.dealershipId },
  });

  const result = await paymentsService.initiateSubscriptionPayment(user.dealershipId, parsed.data, {
    name: user.name,
    email: user.email,
    phone: setting?.phonePrimary ?? undefined,
  });
  if (!result.ok) return { ok: false, error: result.error };

  redirect(result.checkoutUrl);
}

export type SubscriptionPaymentStatusResult = Awaited<
  ReturnType<typeof paymentsService.getSubscriptionPaymentStatusByTxRef>
>;

/** Polled from the /admin/billing/callback page after Flutterwave redirects back. */
export async function getSubscriptionPaymentStatusAction(
  txRef: string,
): Promise<SubscriptionPaymentStatusResult> {
  await requireRole(["OWNER", "MANAGER", "SALES"]);
  return paymentsService.getSubscriptionPaymentStatusByTxRef(txRef);
}
