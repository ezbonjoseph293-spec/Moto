import { beforeEach, describe, expect, it, vi } from "vitest";
import { _resetRateLimitsForTests, rateLimit } from "./rate-limit";

beforeEach(() => {
  _resetRateLimitsForTests();
  vi.useRealTimers();
});

describe("rateLimit", () => {
  it("allows requests up to the limit within the window", () => {
    for (let i = 0; i < 3; i++) {
      expect(rateLimit("key-a", 3, 60).success).toBe(true);
    }
  });

  it("blocks the request once the limit is exceeded", () => {
    for (let i = 0; i < 3; i++) rateLimit("key-b", 3, 60);
    const result = rateLimit("key-b", 3, 60);

    expect(result.success).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("tracks separate keys independently", () => {
    for (let i = 0; i < 3; i++) rateLimit("key-c", 3, 60);

    expect(rateLimit("key-c", 3, 60).success).toBe(false);
    expect(rateLimit("key-d", 3, 60).success).toBe(true);
  });

  it("resets the window after it expires", () => {
    vi.useFakeTimers();
    const now = Date.now();
    vi.setSystemTime(now);

    for (let i = 0; i < 2; i++) rateLimit("key-e", 2, 1);
    expect(rateLimit("key-e", 2, 1).success).toBe(false);

    vi.setSystemTime(now + 1_100);
    expect(rateLimit("key-e", 2, 1).success).toBe(true);

    vi.useRealTimers();
  });
});
