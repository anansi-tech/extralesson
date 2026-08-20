import { resetEmail, sendEmail } from '@/lib/email';
import { hashPassword, passwordProblem, verifyPassword } from '@/lib/auth/password';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  createResetToken,
  createSessionToken,
  verifyToken,
  RESET_TTL_MS,
} from '@/lib/auth/token';
import { claimMagicToken } from '@/lib/auth/consume';
import { MagicToken } from '@/lib/db/magic-token';

const SECRET = 'test-secret';

describe('password-reset token (HMAC-SHA256)', () => {
  it('round-trips a valid token', () => {
    const { token } = createResetToken('kid@example.com', SECRET);
    const payload = verifyToken(token, SECRET);
    expect(payload).not.toBeNull();
    expect(payload!.kind).toBe('reset');
    if (payload!.kind === 'reset') expect(payload!.email).toBe('kid@example.com');
  });

  it('expires after 15 minutes', () => {
    const now = Date.now();
    const { token } = createResetToken('kid@example.com', SECRET, now);
    expect(verifyToken(token, SECRET, now + RESET_TTL_MS - 1)).not.toBeNull();
    expect(verifyToken(token, SECRET, now + RESET_TTL_MS)).toBeNull();
    expect(verifyToken(token, SECRET, now + RESET_TTL_MS + 1)).toBeNull();
  });

  it('rejects tampered payloads and wrong secrets', () => {
    const { token } = createResetToken('kid@example.com', SECRET);
    const [body, sig] = token.split('.');
    const forgedBody = Buffer.from(
      JSON.stringify({ kind: 'reset', email: 'admin@example.com', jti: 'x', exp: Date.now() + 60000 }),
    ).toString('base64url');
    expect(verifyToken(`${forgedBody}.${sig}`, SECRET)).toBeNull();
    expect(verifyToken(token, 'other-secret')).toBeNull();
    expect(verifyToken(`${body}.`, SECRET)).toBeNull();
    expect(verifyToken('garbage', SECRET)).toBeNull();
  });

  it('rotating the secret invalidates all sessions (global logout)', () => {
    const session = createSessionToken('abc123', 'kid@example.com', SECRET);
    expect(verifyToken(session, SECRET)).not.toBeNull();
    expect(verifyToken(session, 'rotated-secret')).toBeNull();
  });
});

describe('password-reset single use (jti persisted)', () => {
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
  }, 60000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  it('claims a jti exactly once', async () => {
    const { jti, expires_at } = createResetToken('kid@example.com', SECRET);
    await MagicToken.create({ jti, email: 'kid@example.com', expires_at });

    const first = await claimMagicToken(jti);
    expect(first).not.toBeNull();
    expect(first!.email).toBe('kid@example.com');

    const second = await claimMagicToken(jti);
    expect(second).toBeNull();
  });

  it('rejects a jti that was never issued', async () => {
    expect(await claimMagicToken('never-issued')).toBeNull();
  });
});

describe('passwords', () => {
  it('accepts the right password and rejects a near miss', async () => {
    const stored = await hashPassword('a long enough phrase');
    expect(await verifyPassword('a long enough phrase', stored)).toBe(true);
    expect(await verifyPassword('a long enough phras', stored)).toBe(false);
    expect(await verifyPassword('A long enough phrase', stored)).toBe(false);
  });

  it('salts, so the same password stores differently every time', async () => {
    const a = await hashPassword('the same password');
    const b = await hashPassword('the same password');
    expect(a).not.toBe(b);
    // ...and both still verify, which is what a salt is for.
    expect(await verifyPassword('the same password', a)).toBe(true);
    expect(await verifyPassword('the same password', b)).toBe(true);
  });

  it('never throws on a malformed or empty stored hash', async () => {
    for (const junk of ['', 'nonsense', 'scrypt$', 'scrypt$abc', 'bcrypt$a$b']) {
      expect(await verifyPassword('anything', junk)).toBe(false);
    }
  });

  it('asks for length rather than punctuation', () => {
    expect(passwordProblem('short')).toContain('at least');
    expect(passwordProblem('a whole sentence as a password')).toBeNull();
    // No character-class rule: Passw0rd! is worse than a long plain phrase.
    expect(passwordProblem('aaaaaaaaaaaa')).toBeNull();
    expect(passwordProblem(' leadingspace')).toContain('space');
  });
});

describe('the reset email', () => {
  it('carries the link and states the expiry in minutes', () => {
    const { subject, html, text } = resetEmail('https://x.test/study/reset?token=abc', 30);
    expect(subject).toContain('password');
    expect(text).toContain('https://x.test/study/reset?token=abc');
    expect(html).toContain('href="https://x.test/study/reset?token=abc"');
    expect(text).toContain('30 minutes');
    // Someone who did not ask for it should be told nothing has changed.
    expect(text).toContain('has not changed');
  });

  it('skips rather than pretending to send when no provider is configured', async () => {
    const key = process.env.RESEND_API_KEY;
    delete process.env.RESEND_API_KEY;
    try {
      const r = await sendEmail({ to: 'a@b.test', subject: 's', html: 'h', text: 't' });
      // The caller needs the difference: "sent" and "written where only an
      // operator can read it" are different facts about getting back in.
      expect(r.skipped).toBe(true);
    } finally {
      if (key !== undefined) process.env.RESEND_API_KEY = key;
    }
  });
});
