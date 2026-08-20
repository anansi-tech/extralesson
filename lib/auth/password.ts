import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

export { PASSWORD_MIN, passwordProblem } from './password-policy';

const scrypt = promisify(scryptCb) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
) => Promise<Buffer>;

// Password storage. scrypt from node:crypto — a real password KDF, memory-hard
// by construction, and already in the runtime, so this adds no dependency to a
// surface where a supply-chain problem would be a credential problem.
//
// Round 1 was passwordless because a magic link is safer than a password a
// student will reuse. It was replaced because checking email every session is
// friction a sixteen-year-old on a phone will not pay, and a teacher moving
// between devices pays it repeatedly. The friction was losing us the session,
// which costs more than the risk the link avoided.

const KEYLEN = 64;
const SALT_BYTES = 16;

/** Stored as scrypt$<salt hex>$<hash hex> so the format can change later. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const key = await scrypt(password, salt, KEYLEN);
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltHex, keyHex] = stored.split('$');
  if (scheme !== 'scrypt' || !saltHex || !keyHex) return false;
  const expected = Buffer.from(keyHex, 'hex');
  const actual = await scrypt(password, Buffer.from(saltHex, 'hex'), expected.length);
  // Lengths are equal by construction; the guard is for a malformed record.
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
