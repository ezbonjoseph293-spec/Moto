"use server";

import { headers } from "next/headers";
import { rateLimit } from "@/lib/rate-limit";
import * as leadsService from "./service";
import { contactFormSchema, vehicleInquirySchema } from "./schema";

export type FormState = { ok: boolean; error?: string; message?: string };

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

/**
 * Public forms carry no session — every submission is scoped to a
 * `dealershipId` resolved by the caller (the page already knows it from the
 * `[dealerSlug]` route) rather than `requireRole()`.
 */
export async function submitContactFormAction(
  dealershipId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const ip = await clientIp();
  const limited = rateLimit(`contact-form:${ip}`, 5, 10 * 60);
  if (!limited.success) {
    return { ok: false, error: "Too many submissions. Please try again later." };
  }

  const parsed = contactFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await leadsService.createContactLead(dealershipId, parsed.data);
  return { ok: true, message: "Thanks — we'll be in touch shortly." };
}

export async function submitVehicleInquiryAction(
  dealershipId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const ip = await clientIp();
  const limited = rateLimit(`vehicle-inquiry:${ip}`, 8, 10 * 60);
  if (!limited.success) {
    return { ok: false, error: "Too many submissions. Please try again later." };
  }

  const parsed = vehicleInquirySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await leadsService.createVehicleInquiryLead(dealershipId, parsed.data);
  return { ok: true, message: "Thanks — the dealer will contact you shortly." };
}
