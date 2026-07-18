import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js config, shared between the Node-only full config
 * (`auth.ts`, which adds the Credentials provider — bcrypt + Prisma, not
 * edge-compatible) and `middleware.ts` (which must run on the Edge runtime).
 *
 * The callbacks here only ever *read* fields already present on the token —
 * they never touch the database — so they're safe to run in either runtime.
 * Database-backed revalidation (has the user been deactivated? has this
 * session's refresh token been revoked?) happens one layer up, in
 * `requireRole()` (src/features/auth/require-role.ts), which only runs in
 * Server Components/Actions/Route Handlers. Middleware is a fast first-pass
 * redirect gate based on the JWT's claims; `requireRole()` is the
 * authoritative check.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.uid = user.id as string;
        token.role = user.role;
        token.dealershipId = user.dealershipId;
        token.rtid = user.rtid;
        // Present only for the "impersonate" provider's authorize() results;
        // undefined otherwise clears any prior impersonation claim, so
        // exiting impersonation (which signs back in as the plain admin
        // user) correctly drops these fields from the new token.
        token.impersonatorId = user.impersonatorId ?? null;
        token.impersonatorName = user.impersonatorName ?? null;
        token.impersonatorRtid = user.impersonatorRtid ?? null;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.uid;
      session.user.role = token.role;
      session.user.dealershipId = token.dealershipId;
      session.user.rtid = token.rtid;
      session.user.impersonatorId = token.impersonatorId ?? null;
      session.user.impersonatorName = token.impersonatorName ?? null;
      session.user.impersonatorRtid = token.impersonatorRtid ?? null;
      return session;
    },
  },
} satisfies NextAuthConfig;
