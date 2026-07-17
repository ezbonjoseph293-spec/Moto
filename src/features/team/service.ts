import { randomBytes } from "crypto";
import { hash } from "bcryptjs";

import { forDealership, forPlatform } from "@/features/tenancy";
import { revokeAllRefreshTokensForUser } from "@/features/auth/service";
import { recordAuditLog } from "@/lib/audit";
import { sendEmail } from "@/lib/mailer";
import { getEnv } from "@/lib/env";
import type { AcceptInviteInput, InviteStaffInput, UpdateStaffRoleInput } from "./schema";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const STAFF_ROLES = ["OWNER", "MANAGER", "SALES"] as const;

export async function listStaff(dealershipId: string) {
  const db = forPlatform();
  return db.user.findMany({
    where: { dealershipId, role: { in: [...STAFF_ROLES] } },
    orderBy: { createdAt: "asc" },
  });
}

export async function listPendingInvites(dealershipId: string) {
  const db = forDealership(dealershipId);
  return db.staffInvite.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    include: { invitedBy: { select: { name: true } } },
  });
}

export type InviteStaffResult =
  | { ok: true }
  | { ok: false; error: "already-staff" | "already-invited" };

export async function inviteStaff(
  dealershipId: string,
  actorId: string,
  dealershipName: string,
  input: InviteStaffInput,
): Promise<InviteStaffResult> {
  const email = input.email.toLowerCase();
  const platform = forPlatform();
  const db = forDealership(dealershipId);

  const existingUser = await platform.user.findUnique({ where: { email } });
  if (existingUser) return { ok: false, error: "already-staff" };

  const existingInvite = await db.staffInvite.findFirst({
    where: { email, status: "PENDING" },
  });
  if (existingInvite) return { ok: false, error: "already-invited" };

  const token = randomBytes(32).toString("hex");
  const invite = await db.staffInvite.create({
    data: {
      dealershipId,
      invitedById: actorId,
      email,
      role: input.role,
      token,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    },
  });

  const env = getEnv();
  const url = `${env.NEXT_PUBLIC_APP_URL}/accept-invite?token=${token}`;
  await sendEmail({
    to: email,
    subject: `You're invited to join ${dealershipName} on Moto`,
    html: `<p>You've been invited to join <strong>${dealershipName}</strong> as a ${input.role === "MANAGER" ? "Manager" : "Sales"}.</p><p><a href="${url}">${url}</a></p><p>This invite expires in 7 days.</p>`,
  });

  await recordAuditLog({
    dealershipId,
    actorId,
    action: "team.invite.created",
    entityType: "StaffInvite",
    entityId: invite.id,
    after: { email, role: input.role },
  });

  return { ok: true };
}

export async function revokeInvite(dealershipId: string, actorId: string, id: string) {
  const db = forDealership(dealershipId);
  const invite = await db.staffInvite.update({
    where: { id },
    data: { status: "REVOKED" },
  });

  await recordAuditLog({
    dealershipId,
    actorId,
    action: "team.invite.revoked",
    entityType: "StaffInvite",
    entityId: invite.id,
  });

  return invite;
}

/** Public lookup for the accept-invite page — token is the only credential available. */
export async function getInviteByToken(token: string) {
  const db = forPlatform();
  const invite = await db.staffInvite.findUnique({ where: { token } });
  if (!invite || invite.status !== "PENDING" || invite.expiresAt < new Date()) return null;
  return invite;
}

export type AcceptInviteResult =
  | { ok: true }
  | { ok: false; error: "invalid-or-expired" | "already-registered" };

/**
 * Public flow: only a token is known, not yet a dealershipId, so the initial
 * lookup goes through forPlatform() (same pattern as auth/service.ts's
 * verifyEmailToken) — every subsequent write is scoped once the invite
 * resolves the tenant.
 */
export async function acceptInvite(input: AcceptInviteInput): Promise<AcceptInviteResult> {
  const platform = forPlatform();
  const invite = await platform.staffInvite.findUnique({ where: { token: input.token } });
  if (!invite || invite.status !== "PENDING") return { ok: false, error: "invalid-or-expired" };

  if (invite.expiresAt < new Date()) {
    await forDealership(invite.dealershipId).staffInvite.update({
      where: { id: invite.id },
      data: { status: "EXPIRED" },
    });
    return { ok: false, error: "invalid-or-expired" };
  }

  const existingUser = await platform.user.findUnique({ where: { email: invite.email } });
  if (existingUser) return { ok: false, error: "already-registered" };

  const passwordHash = await hash(input.password, 12);
  const db = forDealership(invite.dealershipId);

  const user = await platform.user.create({
    data: {
      name: input.name,
      email: invite.email,
      passwordHash,
      role: invite.role,
      dealershipId: invite.dealershipId,
      emailVerifiedAt: new Date(),
    },
  });

  await db.staffInvite.update({
    where: { id: invite.id },
    data: { status: "ACCEPTED", acceptedAt: new Date() },
  });

  await recordAuditLog({
    dealershipId: invite.dealershipId,
    actorId: user.id,
    action: "team.invite.accepted",
    entityType: "User",
    entityId: user.id,
  });

  return { ok: true };
}

export async function updateStaffRole(
  dealershipId: string,
  actorId: string,
  input: UpdateStaffRoleInput,
) {
  const db = forPlatform();
  const target = await db.user.findUniqueOrThrow({ where: { id: input.userId } });
  if (target.dealershipId !== dealershipId || target.role === "OWNER") {
    throw new Error("Cannot change this account's role.");
  }

  const user = await db.user.update({
    where: { id: input.userId },
    data: { role: input.role },
  });

  await recordAuditLog({
    dealershipId,
    actorId,
    action: "team.role_updated",
    entityType: "User",
    entityId: user.id,
    before: { role: target.role },
    after: { role: user.role },
  });

  return user;
}

export async function setStaffActive(
  dealershipId: string,
  actorId: string,
  userId: string,
  isActive: boolean,
) {
  const db = forPlatform();
  const target = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (target.dealershipId !== dealershipId || target.role === "OWNER") {
    throw new Error("Cannot change this account's status.");
  }

  const user = await db.user.update({ where: { id: userId }, data: { isActive } });
  if (!isActive) await revokeAllRefreshTokensForUser(userId);

  await recordAuditLog({
    dealershipId,
    actorId,
    action: isActive ? "team.staff_reactivated" : "team.staff_deactivated",
    entityType: "User",
    entityId: user.id,
  });

  return user;
}

export async function listTeamActivity(dealershipId: string, limit = 50) {
  const db = forPlatform();
  return db.auditLog.findMany({
    where: { dealershipId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { actor: { select: { name: true, email: true } } },
  });
}
