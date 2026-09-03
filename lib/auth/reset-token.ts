import { createHash, randomBytes } from 'node:crypto';

// A SHORT OPAQUE SECRET, not a signed payload: single-use enforcement needs a
// stored row anyway, so the row is the proof and the URL only names it. What is
// stored is the SHA-256 of the secret, never the secret, so a dump of the
// collection yields no working reset link. The secret is 128 random bits, so
// the hash is a lookup key and no salt or KDF is called for.

export const RESET_TOKEN_BYTES = 16;

export interface ResetSecret {
  /** Goes in the URL. 22 characters. */
  secret: string;
  /** Goes in the database, in place of the secret. */
  lookup: string;
}

export function newResetSecret(): ResetSecret {
  const secret = randomBytes(RESET_TOKEN_BYTES).toString('base64url');
  return { secret, lookup: lookupFor(secret) };
}

export function lookupFor(secret: string): string {
  return createHash('sha256').update(secret).digest('hex');
}
