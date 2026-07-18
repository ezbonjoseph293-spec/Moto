"use server";

import { requireRole } from "@/features/auth/require-role";
import * as platformService from "./service";
import {
  changeDealerPlanSchema,
  extendTrialSchema,
  reactivateDealerSchema,
  suspendDealerSchema,
} from "./schema";

export type FormState = { ok: boolean; error?: string; message?: string };

export async function extendTrialAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireRole(["PLATFORM_ADMIN"]);
  const parsed = extendTrialSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  await platformService.extendDealerTrial(admin.id, parsed.data.dealershipId, parsed.data.days);
  return { ok: true, message: `Trial extended by ${parsed.data.days} day(s).` };
}

export async function suspendDealerAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireRole(["PLATFORM_ADMIN"]);
  const parsed = suspendDealerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  await platformService.suspendDealer(admin.id, parsed.data.dealershipId, parsed.data.reason);
  return { ok: true, message: "Dealer suspended." };
}

export async function reactivateDealerAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireRole(["PLATFORM_ADMIN"]);
  const parsed = reactivateDealerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  await platformService.reactivateDealer(admin.id, parsed.data.dealershipId);
  return { ok: true, message: "Dealer reactivated." };
}

export async function changeDealerPlanAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireRole(["PLATFORM_ADMIN"]);
  const parsed = changeDealerPlanSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  await platformService.changeDealerPlan(admin.id, parsed.data.dealershipId, parsed.data.planId);
  return { ok: true, message: "Plan updated." };
}
