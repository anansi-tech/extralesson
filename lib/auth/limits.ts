/**
 * THE LIMITS, AND THE WORDS FOR THEM — with no request in sight, so a client
 * component can read them. The bucket that enforces them, and the request
 * headers it reads, live in rate-limit.ts, which a client must not import.
 */
export interface Limit {
  /** Calls allowed from a full bucket. */
  capacity: number;
  /** Tokens returned per second. */
  refillPerSecond: number;
}

export const LIMITS = {
  login: { capacity: 10, refillPerSecond: 10 / 600 },
  'reset-request': { capacity: 5, refillPerSecond: 5 / 900 },
  'reset-confirm': { capacity: 10, refillPerSecond: 10 / 900 },
  read: { capacity: 30, refillPerSecond: 30 / 600 },
} as const satisfies Record<string, Limit>;

export type Scope = keyof typeof LIMITS;

export const TOO_MANY = 'Too many attempts. Wait a minute and try again.';

/** How long until one more call is allowed from an empty bucket, in whole minutes. */
export function windowMinutes(scope: Scope): number {
  return Math.ceil(1 / LIMITS[scope].refillPerSecond / 60);
}
