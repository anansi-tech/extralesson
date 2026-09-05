import { ResetToken } from '@/lib/db/reset-token';
import { lookupFor } from './reset-token';

export interface ClaimedReset {
  email: string;
  /** A provisioning link: the role to grant now that the inbox is proved. */
  grant_role?: 'admin';
}

/**
 * Claim a reset secret: atomic, once, and only while live. The expiry is IN THE
 * QUERY because Mongo's TTL sweep lags by about a minute. Null for a secret
 * unknown, used, or expired — cases the caller must not tell the holder apart.
 */
export async function claimResetSecret(secret: string, now: Date = new Date()): Promise<ClaimedReset | null> {
  const doc = await ResetToken.findOneAndUpdate(
    { lookup: lookupFor(secret), used_at: null, expires_at: { $gt: now } },
    { $set: { used_at: now } },
  ).lean<{ email: string; grant_role?: 'admin' } | null>();
  return doc ? { email: doc.email, grant_role: doc.grant_role } : null;
}
