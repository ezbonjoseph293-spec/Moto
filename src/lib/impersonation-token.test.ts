import { describe, expect, it, vi } from "vitest";

import { signImpersonationToken, verifyImpersonationToken } from "./impersonation-token";

describe("impersonation-token", () => {
  it("round-trips a signed payload", () => {
    const token = signImpersonationToken({ kind: "start", adminId: "admin-1" }, 30);
    const payload = verifyImpersonationToken(token);
    expect(payload?.kind).toBe("start");
    expect(payload?.adminId).toBe("admin-1");
  });

  it("rejects a tampered token", () => {
    const token = signImpersonationToken({ kind: "start", adminId: "admin-1" }, 30);
    const [encoded] = token.split(".");
    const tampered = `${encoded}.deadbeef`;
    expect(verifyImpersonationToken(tampered)).toBeNull();
  });

  it("rejects an expired token", () => {
    vi.useFakeTimers();
    const token = signImpersonationToken({ kind: "start", adminId: "admin-1" }, 1);
    vi.advanceTimersByTime(2000);
    expect(verifyImpersonationToken(token)).toBeNull();
    vi.useRealTimers();
  });

  it("rejects a malformed token", () => {
    expect(verifyImpersonationToken("not-a-token")).toBeNull();
    expect(verifyImpersonationToken("")).toBeNull();
  });
});
