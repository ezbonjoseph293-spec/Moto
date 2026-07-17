import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import { authConfig } from "./auth.config";
import { forPlatform } from "@/features/tenancy";
import { recordAuditLog } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import { issueRefreshToken, revokeRefreshToken } from "@/features/auth/service";

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
  ],
  events: {
    async signOut(message) {
      if ("token" in message && message.token?.rtid) {
        await revokeRefreshToken(message.token.rtid);
      }
    },
  },
});
