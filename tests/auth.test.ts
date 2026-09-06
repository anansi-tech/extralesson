import { resetEmail, sendEmail } from '@/lib/email';
import { hashPassword, passwordProblem, verifyPassword } from '@/lib/auth/password';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createSessionToken, verifyToken, SESSION_TTL_MS } from '@/lib/auth/token';

import { lookupFor, newResetSecret, RESET_TOKEN_BYTES } from '@/lib/auth/reset-token';
import { claimResetSecret } from '@/lib/auth/consume';
import { ResetToken } from '@/lib/db/reset-token';
import { RESET_TTL_MS } from '@/lib/auth/token';

const SECRET = 'test-secret';

describe('session tokens', () => {
  it('round-trips, and expires', () => {
    const now = Date.now();
    const token = createSessionToken('abc123', 'kid@example.com', SECRET, now);
    const payload = verifyToken(token, SECRET, now);
    expect(payload?.kind).toBe('session');
    expect(verifyToken(token, SECRET, now + SESSION_TTL_MS + 1)).toBeNull();
  });

  it('rejects a token signed with another secret', () => {
    const token = createSessionToken('abc123', 'kid@example.com', SECRET);
    expect(verifyToken(token, 'a-different-secret')).toBeNull();
  });
});

describe('the reset secret', () => {
  it('is short enough for a human to read off a screen', () => {
    // It replaced a 200-character signed token, which made a 242-character URL
    // that had to be printed twice in the email to be usable at all.
    const { secret } = newResetSecret();
    expect(secret.length).toBeLessThanOrEqual(24);
    expect(secret).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(RESET_TOKEN_BYTES * 8).toBeGreaterThanOrEqual(128);
  });

  it('is never itself what gets stored', () => {
    // A dump of the collection must not yield a working link.
    const { secret, lookup } = newResetSecret();
    expect(lookup).not.toContain(secret);
    expect(lookup).toBe(lookupFor(secret));
  });

  it('does not repeat', () => {
    const seen = new Set(Array.from({ length: 200 }, () => newResetSecret().secret));
    expect(seen.size).toBe(200);
  });
});

describe('claiming a reset secret', () => {
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
  }, 60000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  const issue = async (email: string, ttl = RESET_TTL_MS) => {
    const { secret, lookup } = newResetSecret();
    await ResetToken.create({ lookup, email, expires_at: new Date(Date.now() + ttl) });
    return secret;
  };

  it('claims exactly once', async () => {
    const secret = await issue('kid@example.com');
    expect(await claimResetSecret(secret)).toEqual({ email: 'kid@example.com', grant_role: undefined });
    // Opening the link twice must not set two passwords.
    expect(await claimResetSecret(secret)).toBeNull();
  });

  it('refuses a secret that was never issued', async () => {
    expect(await claimResetSecret(newResetSecret().secret)).toBeNull();
  });

  it('refuses an expired secret without waiting for the TTL sweep', async () => {
    // Mongo's TTL runs about once a minute. The expiry is in the claim query
    // because a row that outlives its expiry by a minute is a live reset link.
    const secret = await issue('kid@example.com', -1000);
    expect(await claimResetSecret(secret)).toBeNull();
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
  const LINK = 'https://x.test/study/reset?token=abc';

  it('carries the link and states the expiry in minutes', () => {
    const { subject, html, text } = resetEmail(LINK, 30);
    expect(subject).toContain('password');
    expect(text).toContain(LINK);
    expect(html).toContain(`href="${LINK}"`);
    expect(text).toContain('30 minutes');
    expect(text).toContain('nothing has changed');
  });

  it('never shows the raw URL as the link\'s text', () => {
    // An anchor whose visible text is the URL is the shape of a phishing mail,
    // and it was printed twice — once as the href, once as the text. Gmail
    // dropped it silently while Outlook took it.
    const { html } = resetEmail(LINK, 30);
    // The lockup's src is an image, not link text: stripped with the hrefs.
    const visible = html.replace(/(href|src)="[^"]*"/g, '');
    expect(visible).not.toContain('http');
    expect(html).toMatch(/<a [^>]*>Set a new password<\/a>/);
  });

  it('puts the URL alone on its line in the text part', () => {
    // Run into the next sentence, a mail client has to guess where the link
    // ends, and it guesses wrong.
    const { text } = resetEmail(LINK, 30);
    expect(text).toContain(`\n\n${LINK}\n\n`);
  });

  it('reads as correspondence, with a greeting and a sign-off', () => {
    const { text, html } = resetEmail(LINK, 30);
    expect(text.startsWith('Hi,')).toBe(true);
    expect(text).toContain('— ExtraLesson');
    expect(html).toMatch(/>Hi,<\/p>/);
    expect(html).toContain('— ExtraLesson');
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
