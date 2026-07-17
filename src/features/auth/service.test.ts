import { randomUUID } from "node:crypto";
import { compare } from "bcryptjs";
import { afterAll, describe, expect, it } from "vitest";

import { forPlatform } from "@/features/tenancy";
import {
  isRefreshTokenValid,
  issueRefreshToken,
  requestPasswordReset,
  resetPassword,
  revokeAllRefreshTokensForUser,
  revokeRefreshToken,
  signupCustomer,
  verifyEmailToken,
} from "./service";

const db = forPlatform();
const createdUserIds: string[] = [];

afterAll(async () => {
  if (createdUserIds.length > 0) {
    await db.user.deleteMany({ where: { id: { in: createdUserIds } } });
  }
});

function uniqueEmail(label: string) {
  return `${label}-${randomUUID().slice(0, 8)}@test.example`;
}

describe("signupCustomer", () => {
  it("creates an unverified CUSTOMER account with no dealership", async () => {
    const email = uniqueEmail("signup");
    const result = await signupCustomer({ name: "Test Buyer", email, password: "Password123!" });
    expect(result.ok).toBe(true);

    const user = await db.user.findUnique({ where: { email } });
    createdUserIds.push(user!.id);

    expect(user).not.toBeNull();
    expect(user!.role).toBe("CUSTOMER");
    expect(user!.dealershipId).toBeNull();
    expect(user!.emailVerifiedAt).toBeNull();
    expect(await compare("Password123!", user!.passwordHash!)).toBe(true);
  });

  it("does not create a duplicate account for an already-registered email", async () => {
    const email = uniqueEmail("dup");
    await signupCustomer({ name: "First", email, password: "Password123!" });
    const first = await db.user.findUnique({ where: { email } });
    createdUserIds.push(first!.id);

    const result = await signupCustomer({ name: "Second", email, password: "Password456!" });
    expect(result.ok).toBe(true);

    const count = await db.user.count({ where: { email } });
    expect(count).toBe(1);
  });
});

describe("verifyEmailToken", () => {
  it("verifies a valid token and consumes it", async () => {
    const email = uniqueEmail("verify");
    await signupCustomer({ name: "Verifier", email, password: "Password123!" });
    const user = await db.user.findUnique({ where: { email } });
    createdUserIds.push(user!.id);

    const record = await db.verificationToken.findFirstOrThrow({ where: { userId: user!.id } });

    const result = await verifyEmailToken(record.token);
    expect(result).toBe("verified");

    const updated = await db.user.findUnique({ where: { id: user!.id } });
    expect(updated!.emailVerifiedAt).not.toBeNull();

    const tokenGone = await db.verificationToken.findUnique({ where: { token: record.token } });
    expect(tokenGone).toBeNull();
  });

  it("reports already-verified when the token is replayed after the first email was already confirmed via another token", async () => {
    const email = uniqueEmail("already");
    await signupCustomer({ name: "Already", email, password: "Password123!" });
    const user = await db.user.findUnique({ where: { email } });
    createdUserIds.push(user!.id);

    const record = await db.verificationToken.findFirstOrThrow({ where: { userId: user!.id } });
    await verifyEmailToken(record.token);

    // Issue a second token for the now-verified user and consume it too.
    const secondToken = randomUUID();
    await db.verificationToken.create({
      data: { userId: user!.id, token: secondToken, expiresAt: new Date(Date.now() + 60_000) },
    });

    const result = await verifyEmailToken(secondToken);
    expect(result).toBe("already-verified");
  });

  it("rejects an unknown token", async () => {
    const result = await verifyEmailToken("not-a-real-token");
    expect(result).toBe("invalid-or-expired");
  });

  it("rejects an expired token", async () => {
    const email = uniqueEmail("expired");
    await signupCustomer({ name: "Expired", email, password: "Password123!" });
    const user = await db.user.findUnique({ where: { email } });
    createdUserIds.push(user!.id);

    const token = randomUUID();
    await db.verificationToken.create({
      data: { userId: user!.id, token, expiresAt: new Date(Date.now() - 1000) },
    });

    const result = await verifyEmailToken(token);
    expect(result).toBe("invalid-or-expired");
  });
});

describe("refresh tokens", () => {
  it("is valid immediately after issuance, invalid after revocation", async () => {
    const email = uniqueEmail("rt");
    const user = await db.user.create({
      data: { name: "RT User", email, role: "CUSTOMER", passwordHash: "x" },
    });
    createdUserIds.push(user.id);

    const token = await issueRefreshToken(user.id);
    expect(await isRefreshTokenValid(token.id)).toBe(true);

    await revokeRefreshToken(token.id);
    expect(await isRefreshTokenValid(token.id)).toBe(false);
  });

  it("revokeAllRefreshTokensForUser invalidates every active session for that user", async () => {
    const email = uniqueEmail("rt-all");
    const user = await db.user.create({
      data: { name: "RT All", email, role: "CUSTOMER", passwordHash: "x" },
    });
    createdUserIds.push(user.id);

    const tokenA = await issueRefreshToken(user.id);
    const tokenB = await issueRefreshToken(user.id);

    await revokeAllRefreshTokensForUser(user.id);

    expect(await isRefreshTokenValid(tokenA.id)).toBe(false);
    expect(await isRefreshTokenValid(tokenB.id)).toBe(false);
  });

  it("an unknown refresh token id is invalid", async () => {
    expect(await isRefreshTokenValid(randomUUID())).toBe(false);
  });
});

describe("password reset", () => {
  it("resets the password, consumes the token, and revokes existing sessions", async () => {
    const email = uniqueEmail("reset");
    const user = await db.user.create({
      data: { name: "Reset Me", email, role: "CUSTOMER", passwordHash: "old-hash" },
    });
    createdUserIds.push(user.id);

    const activeToken = await issueRefreshToken(user.id);

    await requestPasswordReset(email);
    const record = await db.passwordResetToken.findFirstOrThrow({ where: { userId: user.id } });

    const result = await resetPassword(record.token, "NewPassword123!");
    expect(result).toBe("reset");

    const updated = await db.user.findUnique({ where: { id: user.id } });
    expect(await compare("NewPassword123!", updated!.passwordHash!)).toBe(true);

    const usedRecord = await db.passwordResetToken.findUnique({ where: { token: record.token } });
    expect(usedRecord!.usedAt).not.toBeNull();

    expect(await isRefreshTokenValid(activeToken.id)).toBe(false);
  });

  it("rejects reusing an already-used reset token", async () => {
    const email = uniqueEmail("reset-reuse");
    const user = await db.user.create({
      data: { name: "Reset Reuse", email, role: "CUSTOMER", passwordHash: "old-hash" },
    });
    createdUserIds.push(user.id);

    await requestPasswordReset(email);
    const record = await db.passwordResetToken.findFirstOrThrow({ where: { userId: user.id } });

    await resetPassword(record.token, "FirstNewPassword1!");
    const secondAttempt = await resetPassword(record.token, "SecondNewPassword1!");

    expect(secondAttempt).toBe("invalid-or-expired");
  });

  it("does not create a reset token for an email that has no account", async () => {
    const email = uniqueEmail("no-account");
    await requestPasswordReset(email);

    const count = await db.passwordResetToken.count({
      where: { user: { email } },
    });
    expect(count).toBe(0);
  });
});
