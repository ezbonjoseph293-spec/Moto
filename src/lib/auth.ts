import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import { authConfig } from "./auth.config";
import { forPlatform } from "@/features/tenancy";
import { recordAuditLog } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import { verifyImpersonationToken } from "@/lib/impersonation-token";
import { issueRefreshToken, isRefreshTokenValid, revokeRefreshToken } from "@/features/auth/service";

const credentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw, request) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const email = parsed.data.email.toLowerCase();
        const ip = request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

        // Backstop rate limit — the login Server Action already checks this,
        // but authorize() is the actual credential-checking code path
        // regardless of entry point, so it enforces the limit itself too.
        const limited = rateLimit(`login:${ip}:${email}`, 8, 60);
        if (!limited.success) return null;

        const db = forPlatform();
        const dbUser = await db.user.findUnique({ where: { email } });

        const passwordOk = dbUser?.passwordHash
          ? await compare(parsed.data.password, dbUser.passwordHash)
          : false;

        if (!dbUser || !passwordOk || !dbUser.isActive || !dbUser.emailVerifiedAt) {
          await recordAuditLog({
            actorId: dbUser?.id ?? null,
            dealershipId: dbUser?.dealershipId ?? null,
            action: "auth.login.failed",
            entityType: "User",
            entityId: dbUser?.id ?? null,
            ipAddress: ip,
          });
          return null;
        }

        const refreshToken = await issueRefreshToken(dbUser.id);

        await db.user.update({ where: { id: dbUser.id }, data: { lastLoginAt: new Date() } });
        await recordAuditLog({
          actorId: dbUser.id,
          dealershipId: dbUser.dealershipId,
          action: "auth.login.success",
          entityType: "User",
          entityId: dbUser.id,
          ipAddress: ip,
        });

        return {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          role: dbUser.role,
          dealershipId: dbUser.dealershipId,
          rtid: refreshToken.id,
        };
      },
    }),
    Credentials({
      id: "impersonate",
      name: "impersonate",
      credentials: { token: {} },
      /**
       * Never reachable from the login form — only from
       * src/features/platform/impersonation.ts, which signs a one-shot,
       * ~20-second HMAC token and immediately calls signIn("impersonate", ...)
       * server-side. Two token kinds ride the same provider: "start" swaps
       * the session to a dealer user for support (issuing them a real new
       * RefreshToken row), and "restore" swaps back to the platform admin
       * using their own still-valid rtid — no second sign-in required.
       */
      async authorize(raw) {
        const token = typeof raw?.token === "string" ? raw.token : "";
        const payload = verifyImpersonationToken(token);
        if (!payload) return null;

        const db = forPlatform();

        if (payload.kind === "start") {
          const { targetUserId, adminId, adminName, adminRtid } = payload;
          if (!targetUserId || !adminId || !adminName || !adminRtid) return null;

          const target = await db.user.findUnique({ where: { id: targetUserId } });
          if (!target || !target.isActive || !target.dealershipId) return null;
          if (!["OWNER", "MANAGER", "SALES"].includes(target.role)) return null;

          const refreshToken = await issueRefreshToken(target.id);
          return {
            id: target.id,
            email: target.email,
            name: target.name,
            role: target.role,
            dealershipId: target.dealershipId,
            rtid: refreshToken.id,
            impersonatorId: adminId,
            impersonatorName: adminName,
            impersonatorRtid: adminRtid,
          };
        }

        if (payload.kind === "restore") {
          const { adminId, adminRtid } = payload;
          if (!adminId || !adminRtid) return null;

          const admin = await db.user.findUnique({ where: { id: adminId } });
          if (!admin || !admin.isActive || admin.role !== "PLATFORM_ADMIN") return null;
          if (!(await isRefreshTokenValid(adminRtid))) return null;

          return {
            id: admin.id,
            email: admin.email,
            name: admin.name,
            role: admin.role,
            dealershipId: null,
            rtid: adminRtid,
            impersonatorId: null,
            impersonatorName: null,
            impersonatorRtid: null,
          };
        }

        return null;
      },
    }),
  ],
  events: {
    async signOut(message) {
      if ("token" in message && message.token?.rtid) {
        await revokeRefreshToken(message.token.rtid);
      }
    },
  },
});
