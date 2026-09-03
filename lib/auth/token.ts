import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

// HMAC-SHA256 session cookies. Secret and clock are injectable so tests can
// pin them. Reset tokens are NOT signed: they are opaque secrets checked
// against a stored row (lib/auth/reset-token), which is what makes them
// single-use.

// A reset link is rare, so it can afford to be short-lived.
export const RESET_TTL_MS = 30 * 60 * 1000;
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function b64url(buf: Buffer): string {
  return buf.toString('base64url');
}

function hmac(payload: string, secret: string): string {
  return b64url(createHmac('sha256', secret).update(payload).digest());
}

export function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error('SESSION_SECRET is not set');
  return s;
}

export interface SessionPayload {
  kind: 'session';
  student_id: string;
  email: string;
  exp: number; // epoch ms
}

type Payload = SessionPayload;

export function signToken(payload: Payload, secret: string): string {
  const body = b64url(Buffer.from(JSON.stringify(payload)));
  return `${body}.${hmac(body, secret)}`;
}

export function verifyToken(token: string, secret: string, now: number = Date.now()): Payload | null {
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = hmac(body, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  let payload: Payload;
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString());
  } catch {
    return null;
  }
  if (typeof payload.exp !== 'number' || payload.exp <= now) return null;
  return payload;
}

export function createSessionToken(
  student_id: string,
  email: string,
  secret: string,
  now: number = Date.now(),
): string {
  return signToken({ kind: 'session', student_id, email, exp: now + SESSION_TTL_MS }, secret);
}
