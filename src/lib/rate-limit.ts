/**
 * In-memory fixed-window rate limiter. Good enough for a single-process MVP
 * deployment; the call sites (auth Server Actions) don't need to change if
 * this is later swapped for a shared store (Upstash/Redis) — only this
 * module would be rewritten.
 *
 * Not suitable for a multi-instance deployment (each instance has its own
 * counters), which is an acceptable limitation pre-launch.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Periodically drop expired buckets so memory doesn't grow unbounded across
// a long-running process.
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;
let lastSweep = Date.now();

function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult = {
  success: boolean;
  /** Seconds until the caller may retry. Only meaningful when success is false. */
  retryAfterSeconds: number;
};

/**
 * Consumes one request from `key`'s window. `limit` requests are allowed
 * per `windowSeconds`; exceeding it returns success: false until the window
 * resets.
 */
export function rateLimit(key: string, limit: number, windowSeconds: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { success: true, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    return { success: false, retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000) };
  }

  existing.count += 1;
  return { success: true, retryAfterSeconds: 0 };
}

/** Test-only: clears all buckets so tests don't leak state between runs. */
export function _resetRateLimitsForTests() {
  buckets.clear();
}
