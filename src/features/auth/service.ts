import { randomBytes, createHash } from "crypto";
import { hash } from "bcryptjs";
import { forPlatform } from "@/features/tenancy";
import { sendEmail } from "@/lib/mailer";
import { recordAuditLog } from "@/lib/audit";
import { getEnv } from "@/lib/env";

const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

function hashOpaqueToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Issues a server-side RefreshToken row backing a new JWT session. The row's
 * id (not the raw token) is embedded in the JWT as the `rtid` claim, so
 * `requireRole()` can check — on every protected request — whether this
 * specific session has since been revoked (logout, password reset, staff
 * deactivation), independent of the JWT's own expiry.
 */
export async function issueRefreshToken(userId: string) {
  const db = forPlatform();
  const raw = randomBytes(32).toString("hex");
  return db.refreshToken.create({
    data: {
      userId,
      tokenHash: hashOpaqueToken(raw),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });
}

export async function revokeRefreshToken(id: string): Promise<void> {
  const db = forPlatform();
  await db.refreshToken.updateMany({
    where: { id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/** Called on password reset so every other logged-in session is force-logged-out. */
export async function revokeAllRefreshTokensForUser(userId: string): Promise<void> {
  const db = forPlatform();
  await db.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function isRefreshTokenValid(id: string): Promise<boolean> {
  const db = forPlatform();
  const token = await db.refreshToken.findUnique({ where: { id } });
  return Boolean(token && !token.revokedAt && token.expiresAt > new Date());
}

export async function sendVerificationEmail(userId: string, email: string): Promise<void> {
  const db = forPlatform();
  const token = randomBytes(32).toString("hex");
  await db.verificationToken.create({
    data: { userId, token, expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS) },
  });

  const env = getEnv();
  const url = `${env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;
  await sendEmail({
    to: email,
    subject: "Verify your email — Moto",
    html: `<p>Welcome to Moto. Confirm your email to activate your account:</p><p><a href="${url}">${url}</a></p><p>This link expires in 24 hours.</p>`,
  });
}

export type SignupResult = { ok: true } | { ok: false; error: string };

/**
 * Public self-registration always creates a CUSTOMER account — dealership
 * staff (OWNER/MANAGER/SALES) are created via the Stage 3 onboarding wizard
 * or Stage 7 team invites, never through this open form.
 */
export async function signupCustomer(input: {
  name: string;
  email: string;
  password: string;
}): Promise<SignupResult> {
  const db = forPlatform();
  const email = input.email.toLowerCase();

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    // Don't reveal whether the email is already registered.
    return { ok: true };
  }

  const passwordHash = await hash(input.password, 12);
  const user = await db.user.create({
    data: { name: input.name, email, passwordHash, role: "CUSTOMER", dealershipId: null },
  });

  await sendVerificationEmail(user.id, user.email);
  await recordAuditLog({
    actorId: user.id,
    action: "auth.signup",
    entityType: "User",
    entityId: user.id,
  });

  return { ok: true };
}

export type VerifyEmailResult = "verified" | "already-verified" | "invalid-or-expired";

export async function verifyEmailToken(token: string): Promise<VerifyEmailResult> {
  const db = forPlatform();
  const record = await db.verificationToken.findUnique({ where: { token } });
  if (!record || record.expiresAt < new Date()) return "invalid-or-expired";

  const user = await db.user.findUnique({ where: { id: record.userId } });
  if (!user) return "invalid-or-expired";

  const wasAlreadyVerified = Boolean(user.emailVerifiedAt);

  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: user.emailVerifiedAt ?? new Date() },
    }),
    db.verificationToken.delete({ where: { token } }),
  ]);

  if (!wasAlreadyVerified) {
    await recordAuditLog({
      actorId: user.id,
      dealershipId: user.dealershipId,
      action: "auth.email_verified",
      entityType: "User",
      entityId: user.id,
    });
  }

  return wasAlreadyVerified ? "already-verified" : "verified";
}

/** Always succeeds silently for unknown emails — avoids leaking which addresses are registered. */
export async function requestPasswordReset(email: string): Promise<void> {
  const db = forPlatform();
  const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !user.passwordHash) return;

  const token = randomBytes(32).toString("hex");
  await db.passwordResetToken.create({
    data: { userId: user.id, token, expiresAt: new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS) },
  });

  const env = getEnv();
  const url = `${env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: "Reset your password — Moto",
    html: `<p>Reset your password (this link expires in 1 hour):</p><p><a href="${url}">${url}</a></p><p>If you didn't request this, you can safely ignore this email.</p>`,
  });

  await recordAuditLog({
    actorId: user.id,
    dealershipId: user.dealershipId,
    action: "auth.password_reset_requested",
    entityType: "User",
    entityId: user.id,
  });
}

export type ResetPasswordResult = "reset" | "invalid-or-expired";

export async function resetPassword(token: string, newPassword: string): Promise<ResetPasswordResult> {
  const db = forPlatform();
  const record = await db.passwordResetToken.findUnique({ where: { token } });
  if (!record || record.usedAt || record.expiresAt < new Date()) return "invalid-or-expired";

  const passwordHash = await hash(newPassword, 12);

  await db.$transaction([
    db.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    db.passwordResetToken.update({ where: { token }, data: { usedAt: new Date() } }),
  ]);

  await revokeAllRefreshTokensForUser(record.userId);

  await recordAuditLog({
    actorId: record.userId,
    action: "auth.password_reset_completed",
    entityType: "User",
    entityId: record.userId,
  });

  return "reset";
}
