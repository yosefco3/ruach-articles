// Minimal in-memory sliding-window rate limiter.
// Single-instance only (Railway one dyno) — good enough to cap abuse of cheap public
// endpoints. Not a security boundary; resets on restart.

const hits = new Map<string, number[]>();

/**
 * Records one hit for `key` and returns true if it is within `max` per `windowMs`.
 * Returns false once the window is saturated (the hit is still recorded so a steady
 * flood stays blocked until it slows down).
 */
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const cutoff = now - windowMs;
  const recent = (hits.get(key) ?? []).filter((t) => t > cutoff);
  recent.push(now);
  hits.set(key, recent);
  return recent.length <= max;
}

/** Test helper — clears all recorded windows. */
export function __resetRateLimit(): void {
  hits.clear();
}
