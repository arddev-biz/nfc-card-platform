import "server-only";

/**
 * Minimal in-memory brute-force protection for the login endpoint.
 *
 * Deliberately simple for V1: a single-instance deployment keeps this
 * accurate. If the app is later horizontally scaled across multiple
 * instances, this in-memory map will no longer share state across
 * instances and should be replaced with a shared store (e.g. Redis) —
 * flagged here as a known V1 limitation, not a silent gap.
 */

interface Attempt {
  count: number;
  windowStartedAt: number;
}

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

const attempts = new Map<string, Attempt>();

export function checkRateLimit(key: string): {
  allowed: boolean;
  retryAfterSeconds?: number;
} {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || now - entry.windowStartedAt > WINDOW_MS) {
    attempts.set(key, { count: 1, windowStartedAt: now });
    return { allowed: true };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil(
      (WINDOW_MS - (now - entry.windowStartedAt)) / 1000
    );
    return { allowed: false, retryAfterSeconds };
  }

  entry.count += 1;
  return { allowed: true };
}

export function resetRateLimit(key: string): void {
  attempts.delete(key);
}
