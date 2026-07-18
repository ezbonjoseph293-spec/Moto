import type { UserRole } from "@prisma/client";
import type { DefaultSession } from "next-auth";

/**
 * next-auth@beta re-exports `Session`/`User` from `@auth/core/types` (type-only)
 * rather than declaring them itself, so declaration merging has to target
 * `@auth/core/types` directly — augmenting `next-auth` here would be a no-op.
 * Same story for `JWT`, declared in `@auth/core/jwt` and re-exported from
 * `next-auth/jwt`.
 */
declare module "@auth/core/types" {
  interface User {
    role: UserRole;
    dealershipId: string | null;
    /** RefreshToken row id backing this session — see src/features/auth/service.ts. */
    rtid: string;
    /**
     * Set only while a platform admin is impersonating this user for support
     * (see src/features/platform/impersonation.ts). Carries the original
     * admin's identity + their own still-valid rtid, so "exit impersonation"
     * can restore their session without a second sign-in.
     */
    impersonatorId?: string | null;
    impersonatorName?: string | null;
    impersonatorRtid?: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: UserRole;
      dealershipId: string | null;
      rtid: string;
      impersonatorId?: string | null;
      impersonatorName?: string | null;
      impersonatorRtid?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    uid: string;
    role: UserRole;
    dealershipId: string | null;
    rtid: string;
    impersonatorId?: string | null;
    impersonatorName?: string | null;
    impersonatorRtid?: string | null;
  }
}
