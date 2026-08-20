import { createHash, randomBytes } from 'node:crypto';

// The reset token is a SHORT OPAQUE SECRET, not a signed payload.
//
// It was a 200-character HMAC token carrying the email and expiry in its body,
// which made the reset URL 242 characters. A URL that long is unreadable, is
// impossible to retype off a screen, and — printed twice in an email, once as
// the link and once as its own text — is one of the things a spam classifier is
// looking at when it decides a message is phishing.
//
// The signature existed so the token could be trusted without a lookup. But the
// reset flow ALREADY does a lookup: single-use enforcement needs a stored row
// either way. So the row is the proof, and the URL only has to name it.
//
// What is stored is the SHA-256 of the secret, never the secret itself, so a
// dump of the collection does not yield a working reset link. Hashing here is
// a lookup key, not password storage — the secret is 128 random bits, so there
// is nothing to brute-force and no salt or KDF is called for.

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
