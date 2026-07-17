import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

/**
 * A separate, edge-safe NextAuth instance (authConfig has no providers and
 * never touches the database) used only to read role/dealershipId claims
 * off the JWT for a fast redirect. This is a coarse first-pass gate — the
 * authoritative, database-backed check (is the user still active? has this
 * session been revoked?) happens in requireRole() inside the actual
 * Server Components/Actions behind these routes.
 */
const { auth } = NextAuth(authConfig);

const STAFF_ROLES = new Set(["OWNER", "MANAGER", "SALES"]);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role;

  const requiresStaff = pathname.startsWith("/admin");
  const requiresPlatformAdmin = pathname.startsWith("/platform");

  const authorized =
    (requiresStaff && role !== undefined && STAFF_ROLES.has(role)) ||
    (requiresPlatformAdmin && role === "PLATFORM_ADMIN") ||
    (!requiresStaff && !requiresPlatformAdmin);

  if (!authorized) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/platform/:path*"],
};
