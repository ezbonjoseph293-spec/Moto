"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireRole } from "@/features/auth/require-role";
import { forPlatform } from "@/features/tenancy";
import { rateLimit } from "@/lib/rate-limit";
import * as teamService from "./service";
import { acceptInviteSchema, inviteStaffSchema, updateStaffRoleSchema } from "./schema";

export type FormState = { ok: boolean; error?: string; message?: string };

async function requireOwner() {
  const user = await requireRole(["OWNER"]);
  if (!user.dealershipId) {
    throw new Error("This account has no dealership.");
  }
  return { ...user, dealershipId: user.dealershipId };
}

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function inviteStaffAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireOwner();
  const parsed = inviteStaffSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const dealership = await forPlatform().dealership.findUniqueOrThrow({
    where: { id: user.dealershipId },
  });

  const result = await teamService.inviteStaff(
    user.dealershipId,
    user.id,
    dealership.name,
    parsed.data,
  );
  if (!result.ok) {
    const message =
      result.error === "already-staff"
        ? "Someone with that email is already registered."
        : "There's already a pending invite for that email.";
    return { ok: false, error: message };
  }

  revalidatePath("/admin/settings/team");
  return { ok: true, message: "Invite sent." };
}

export async function revokeInviteAction(id: string): Promise<void> {
  const user = await requireOwner();
  await teamService.revokeInvite(user.dealershipId, user.id, id);
  revalidatePath("/admin/settings/team");
}

export async function updateStaffRoleAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireOwner();
  const parsed = updateStaffRoleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await teamService.updateStaffRole(user.dealershipId, user.id, parsed.data);
  revalidatePath("/admin/settings/team");
  return { ok: true, message: "Role updated." };
}

export async function setStaffActiveAction(userId: string, isActive: boolean): Promise<void> {
  const user = await requireOwner();
  await teamService.setStaffActive(user.dealershipId, user.id, userId, isActive);
  revalidatePath("/admin/settings/team");
}

export async function acceptInviteAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = acceptInviteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const ip = await clientIp();
  const limited = rateLimit(`accept-invite:${ip}`, 10, 10 * 60);
  if (!limited.success) {
    return { ok: false, error: "Too many attempts. Please try again later." };
  }

  const result = await teamService.acceptInvite(parsed.data);
  if (!result.ok) {
    const message =
      result.error === "already-registered"
        ? "An account with that email already exists. Log in instead."
        : "This invite link is invalid or has expired.";
    return { ok: false, error: message };
  }

  return { ok: true, message: "Your account is ready. You can now log in." };
}
