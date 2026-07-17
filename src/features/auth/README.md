# auth

Auth.js (NextAuth v5) credentials flow, built in Stage 2.

- **`@/lib/auth.config.ts`** — edge-safe shared config (no DB, no bcrypt):
  `jwt`/`session` callbacks that only copy fields already on the token.
  Used by both `auth.ts` (Node) and `middleware.ts` (Edge).
- **`@/lib/auth.ts`** — the full Node-only config: adds the Credentials
  provider (bcrypt compare + Prisma lookup), rate-limits login attempts,
  audit-logs every login attempt, issues a `RefreshToken` row per session,
  and revokes it in the `signOut` event.
- **`service.ts`** — core business logic: `signupCustomer` (public
  self-registration always creates a CUSTOMER — staff accounts come from
  Stage 3 onboarding / Stage 7 invites), email verification, password
  reset, and the refresh-token lifecycle (`issueRefreshToken`,
  `revokeRefreshToken`, `revokeAllRefreshTokensForUser`,
  `isRefreshTokenValid`).
- **`actions.ts`** — thin `"use server"` Server Actions wrapping `service.ts`
  with Zod validation and rate limiting, used directly by the form
  components (`login-form.tsx`, `signup-form.tsx`, etc.) via
  `useActionState`.
- **`require-role.ts`** — the authoritative authorization guard for Server
  Components/Actions/Route Handlers. Unlike `middleware.ts` (a fast,
  claims-only redirect gate reading the JWT), this re-checks the database
  on every call: the user must still be active and the session's
  `RefreshToken` must not have been revoked. This is what makes logout,
  password reset, and staff deactivation take effect immediately instead of
  only once the JWT itself expires.

## Session design: JWT + a revocable refresh token

Sessions are JWT-based (`session.strategy = "jwt"`, 30-day `maxAge`), but each
sign-in also creates a `RefreshToken` row in Postgres, whose id is embedded in
the JWT as the `rtid` claim. The JWT itself is never checked against the
database by `middleware.ts` (kept edge-safe and fast), but `requireRole()`
looks the row up on every protected request. Revoking that row — on logout,
password reset, or (future) staff deactivation — cuts off access immediately,
independent of the JWT's own expiry.

## Rate limiting

`@/lib/rate-limit.ts` is an in-memory fixed-window limiter, applied to login,
signup, forgot-password, and reset-password. It's per-process — fine for a
single-instance MVP deployment, and can be swapped for a shared store
(Upstash/Redis) later without changing any call site.
