"use server";

import { redirect } from "next/navigation";

import { auth, signIn } from "@/lib/auth";
import { requireRole } from "@/features/auth/require-role";
import { forPlatform } from "@/features/tenancy";
import { revokeRefreshToken } from "@/features/auth/service";
import { recordAuditLog } from "@/lib/audit";
import { signImpersonationToken } from "@/lib/impersonation-token";
import { impersonateUserSchema } from "./schema";

const TOKEN_TTL_SECONDS = 20;

/**
 * Platform-admin "impersonate for support" entry point. Signs a one-shot
 * token carrying the admin's own identity + still-valid refresh token id,
 * then immediately hands off the session to the target dealer user via the
 * "impersonate" Credentials provider (src/lib/auth.ts) — no password
 * involved, no second sign-in for the admin to restore later.
 */
export async function startImpersonationAction(formData: FormData): Promise<void> {
  const admin = await requireRole(["PLATFORM_ADMIN"]);
  const parsed = impersonateUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Invalid impersonation request.");

  const db = forPlatform();
  const target = await db.user.findUnique({ where: { id: parsed.data.targetUserId } });
  if (!target || !target.dealershipId) {
    throw new Error("That user can't be impersonated.");
  }

  const session = await auth();
  const adminRtid = session?.user.rtid;
  if (!adminRtid) throw new Error("Missing admin session.");

  const token = signImpersonationToken(
    { kind: "start", targetUserId: target.id, adminId: admin.id, adminName: admin.name, adminRtid },
    TOKEN_TTL_SECONDS,
  );

  await recordAuditLog({
    dealershipId: target.dealershipId,
    actorId: admin.id,
    action: "platform.impersonation_started",
    entityType: "User",
    entityId: target.id,
  });

  await signIn("impersonate", { token, redirect: false });
  redirect("/admin");
}

/** Restores the platform admin's own session using their still-valid rtid. */
export async function exitImpersonationAction(): Promise<void> {
  const session = await auth();
  const impersonatorId = session?.user.impersonatorId;
  const impersonatorRtid = session?.user.impersonatorRtid;
  if (!impersonatorId || !impersonatorRtid) {
    redirect("/admin");
  }

  await recordAuditLog({
    dealershipId: session?.user.dealershipId ?? null,
    actorId: impersonatorId,
    action: "platform.impersonation_ended",
    entityType: "User",
    entityId: session?.user.id ?? null,
  });

  // The impersonated session's own refresh token is single-purpose — revoke
  // it now rather than leaving it valid for the rest of its 30-day lifetime.
  if (session?.user.rtid) {
    await revokeRefreshToken(session.user.rtid);
  }

  const token = signImpersonationToken(
    { kind: "restore", adminId: impersonatorId, adminRtid: impersonatorRtid },
    TOKEN_TTL_SECONDS,
  );

  await signIn("impersonate", { token, redirect: false });
  redirect("/platform");
}
