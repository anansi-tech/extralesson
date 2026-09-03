import { ResetToken } from '@/lib/db/reset-token';
import { lookupFor } from './reset-token';

/**
 * Claim a reset secret: atomic, once, and only while live. The expiry is IN THE
 * QUERY because Mongo's TTL sweep lags by about a minute. Null for a secret
 * unknown, used, or expired — cases the caller must not tell the holder apart.
 */
export async function claimResetSecret(secret: string, now: Date = new Date()): Promise<string | null> {
  const doc = await ResetToken.findOneAndUpdate(
    { lookup: lookupFor(secret), used_at: null, expires_at: { $gt: now } },
    { $set: { used_at: now } },
  ).lean<{ email: string } | null>();
  return doc?.email ?? null;
}
