"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireRole } from "@/features/auth/require-role";
import { rateLimit } from "@/lib/rate-limit";
import * as onboardingService from "./service";
import { startOnboardingSchema } from "./schema";

export type FormState = { ok: boolean; error?: string; message?: string };

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function startOnboardingAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = startOnboardingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const ip = await clientIp();
  const limited = rateLimit(`onboarding:${ip}`, 5, 10 * 60);
  if (!limited.success) {
    return { ok: false, error: "Too many attempts. Please try again later." };
  }

  const result = await onboardingService.createDealership(parsed.data);
  if (!result.ok) return result;

  return {
    ok: true,
    message: "Check your email to verify your account, then log in to finish setup.",
  };
}

export async function completeOnboardingAction(): Promise<void> {
  const user = await requireRole(["OWNER"]);
  if (!user.dealershipId) {
    throw new Error("This account has no dealership.");
  }

  await onboardingService.completeOnboarding(user.dealershipId, user.id);
  redirect("/admin");
}
