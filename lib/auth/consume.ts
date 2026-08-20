import { ResetToken } from '@/lib/db/reset-token';
import { lookupFor } from './reset-token';

/**
 * Claim a reset secret: atomically, once, and only while it is live.
 *
 * The expiry is IN THE QUERY rather than checked after. It used to be enforced
 * by the token's own signature; with an opaque secret the row is the only
 * record of when it dies, and Mongo's TTL sweep runs about once a minute — so
 * a token checked against the sweep alone would keep working for up to a minute
 * after it expired.
 *
 * Returns the email the reset was requested for, or null for a secret that is
 * unknown, already used, or out of time — three cases the caller must not tell
 * apart to the person holding the link.
 */
export async function claimResetSecret(secret: string, now: Date = new Date()): Promise<string | null> {
  const doc = await ResetToken.findOneAndUpdate(
    { lookup: lookupFor(secret), used_at: null, expires_at: { $gt: now } },
    { $set: { used_at: now } },
  ).lean<{ email: string } | null>();
  return doc?.email ?? null;
}
