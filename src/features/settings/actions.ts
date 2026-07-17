"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/features/auth/require-role";
import * as settingsService from "./service";
import {
  announcementSchema,
  contactSchema,
  depositSchema,
  identitySchema,
  menuItemSchema,
} from "./schema";

export type FormState = { ok: boolean; error?: string; message?: string };

const SETTINGS_STAFF_ROLES = ["OWNER", "MANAGER"] as const;

async function requireDealershipStaff() {
  const user = await requireRole(SETTINGS_STAFF_ROLES);
  if (!user.dealershipId) {
    throw new Error("This account has no dealership.");
  }
  return { ...user, dealershipId: user.dealershipId };
}

export async function updateIdentityAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireDealershipStaff();
  const parsed = identitySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await settingsService.updateIdentity(user.dealershipId, user.id, parsed.data);
  revalidatePath("/admin/settings");
  revalidatePath("/[dealerSlug]", "layout");

  return { ok: true, message: "Branding saved." };
}

export async function updateContactAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireDealershipStaff();
  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await settingsService.updateContact(user.dealershipId, user.id, parsed.data);
  revalidatePath("/admin/settings");
  revalidatePath("/[dealerSlug]", "layout");

  return { ok: true, message: "Contact details saved." };
}

export async function updateDepositAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireDealershipStaff();
  const parsed = depositSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await settingsService.updateDeposit(user.dealershipId, user.id, parsed.data);
  revalidatePath("/admin/settings");

  return { ok: true, message: "Deposit policy saved." };
}

export async function updateAnnouncementAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireDealershipStaff();
  const parsed = announcementSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await settingsService.updateAnnouncement(user.dealershipId, user.id, parsed.data);
  revalidatePath("/admin/settings");
  revalidatePath("/[dealerSlug]", "layout");

  return { ok: true, message: "Announcement bar saved." };
}

export async function createMenuItemAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireDealershipStaff();
  const parsed = menuItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await settingsService.createMenuItem(user.dealershipId, user.id, parsed.data);
  revalidatePath("/admin/settings");
  revalidatePath("/[dealerSlug]", "layout");

  return { ok: true, message: "Menu item added." };
}

export async function deleteMenuItemAction(id: string): Promise<void> {
  const user = await requireDealershipStaff();
  await settingsService.deleteMenuItem(user.dealershipId, user.id, id);
  revalidatePath("/admin/settings");
  revalidatePath("/[dealerSlug]", "layout");
}

export async function moveMenuItemAction(id: string, direction: "up" | "down"): Promise<void> {
  const user = await requireDealershipStaff();
  await settingsService.moveMenuItem(user.dealershipId, user.id, id, direction);
  revalidatePath("/admin/settings");
  revalidatePath("/[dealerSlug]", "layout");
}
