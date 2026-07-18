import { createHmac, timingSafeEqual } from "node:crypto";

import { getEnv } from "./env";

/**
 * Short-lived, HMAC-signed tokens used only to hand off a session in the
 * platform-admin impersonation flow (see src/features/platform/impersonation.ts).
 * They are not a general-purpose auth mechanism — each one is single-purpose,
 * expires in seconds, and is verified server-side before ever being trusted
 * to swap a session's identity.
 */
export type ImpersonationTokenPayload = Record<string, string>;

function sign(data: string): string {
  return createHmac("sha256", getEnv().AUTH_SECRET).update(data).digest("base64url");
}

export function signImpersonationToken(
  payload: ImpersonationTokenPayload,
  ttlSeconds: number,
): string {
  const body = JSON.stringify({ ...payload, exp: Date.now() + ttlSeconds * 1000 });
  const encoded = Buffer.from(body, "utf8").toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function verifyImpersonationToken(
  token: string,
): (ImpersonationTokenPayload & { exp: number }) | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = sign(encoded);
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(signature);
  if (expectedBuf.length !== actualBuf.length || !timingSafeEqual(expectedBuf, actualBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
