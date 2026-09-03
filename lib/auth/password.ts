import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

export { PASSWORD_MIN, passwordProblem } from './password-policy';

const scrypt = promisify(scryptCb) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
) => Promise<Buffer>;

// scrypt from node:crypto — a real password KDF, memory-hard by construction,
// and already in the runtime, so this adds no dependency to a surface where a
// supply-chain problem would be a credential problem.

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
