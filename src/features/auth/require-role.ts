import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { auth } from "@/lib/auth";
import { forPlatform } from "@/features/tenancy";
import { isRefreshTokenValid } from "./service";

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  dealershipId: string | null;
  /** Set only while a platform admin is impersonating this user for support. */
  impersonatedBy: { id: string; name: string } | null;
};

/**
 * Authoritative server-side guard for Server Actions, Route Handlers, and
 * protected layouts/pages. Unlike middleware (which only reads role claims
 * off the JWT for a fast redirect), this re-validates against the database
 * on every call: the user must still be active and this session's refresh
 * token must not have been revoked — so access is cut off the moment either
 * happens (logout, password reset, staff deactivation), not only when the
 * JWT itself expires.
 */
export async function requireRole(
  allowedRoles: readonly UserRole[],
  options: { redirectTo?: string } = {},
): Promise<AuthenticatedUser> {
  const loginRedirect = options.redirectTo ?? "/login";
  const session = await auth();
  const sessionUser = session?.user;

  if (!sessionUser?.id) {
    redirect(loginRedirect);
  }

  const db = forPlatform();
  const [user, refreshValid] = await Promise.all([
    db.user.findUnique({ where: { id: sessionUser.id } }),
    isRefreshTokenValid(sessionUser.rtid),
  ]);

  if (!user || !user.isActive || !refreshValid) {
    redirect(loginRedirect);
  }

  if (!allowedRoles.includes(user.role)) {
    redirect("/403");
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    dealershipId: user.dealershipId,
    impersonatedBy: sessionUser.impersonatorId
      ? { id: sessionUser.impersonatorId, name: sessionUser.impersonatorName ?? "Platform admin" }
      : null,
  };
}
