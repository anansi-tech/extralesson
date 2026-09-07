import { headers } from 'next/headers';
import { LIMITS, type Limit, type Scope } from './limits';

export { LIMITS, TOO_MANY, windowMinutes, type Limit, type Scope } from './limits';

/**
 * A SMALL IN-PROCESS TOKEN BUCKET (ROUND_6 Task 3): per account and per IP,
 * no Redis. A serverless instance forgets it on cold start, which is fine —
 * the point is to make guessing slow on the instance doing the guessing, not
 * to keep a ledger. Every scope is keyed by both, and either one refusing
 * refuses the call.
 */
const buckets = new Map<string, { tokens: number; at: number }>();

export function take(key: string, limit: Limit, now: number = Date.now()): boolean {
  const b = buckets.get(key) ?? { tokens: limit.capacity, at: now };
  const refilled = Math.min(limit.capacity, b.tokens + ((now - b.at) / 1000) * limit.refillPerSecond);
  const ok = refilled >= 1;
  buckets.set(key, { tokens: ok ? refilled - 1 : refilled, at: now });
  return ok;
}

export function resetRateLimits(): void {
  buckets.clear();
}

/** The first hop of x-forwarded-for, or 'unknown' outside a request. */
export async function clientIp(): Promise<string> {
  try {
    const h = await headers();
    const forwarded = h.get('x-forwarded-for')?.split(',')[0]?.trim();
    return forwarded || h.get('x-real-ip') || 'unknown';
  } catch {
    return 'unknown';
  }
}

/** True when this call is over the limit for the account or for the IP. */
export async function limited(scope: Scope, account: string): Promise<boolean> {
  const limit = LIMITS[scope];
  const ip = await clientIp();
  const byAccount = take(`${scope}:account:${account.toLowerCase()}`, limit);
  const byIp = take(`${scope}:ip:${ip}`, limit);
  return !(byAccount && byIp);
}
