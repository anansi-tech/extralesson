import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  createMagicLinkToken,
  createSessionToken,
  verifyToken,
  MAGIC_LINK_TTL_MS,
} from '@/lib/auth/token';
import { claimMagicToken } from '@/lib/auth/consume';
import { MagicToken } from '@/lib/db/magic-token';

const SECRET = 'test-secret';

describe('magic-link token (HMAC-SHA256)', () => {
  it('round-trips a valid token', () => {
    const { token } = createMagicLinkToken('kid@example.com', SECRET);
    const payload = verifyToken(token, SECRET);
    expect(payload).not.toBeNull();
    expect(payload!.kind).toBe('magic');
    if (payload!.kind === 'magic') expect(payload!.email).toBe('kid@example.com');
  });

  it('expires after 15 minutes', () => {
    const now = Date.now();
    const { token } = createMagicLinkToken('kid@example.com', SECRET, now);
    expect(verifyToken(token, SECRET, now + MAGIC_LINK_TTL_MS - 1)).not.toBeNull();
    expect(verifyToken(token, SECRET, now + MAGIC_LINK_TTL_MS)).toBeNull();
    expect(verifyToken(token, SECRET, now + MAGIC_LINK_TTL_MS + 1)).toBeNull();
  });

  it('rejects tampered payloads and wrong secrets', () => {
    const { token } = createMagicLinkToken('kid@example.com', SECRET);
    const [body, sig] = token.split('.');
    const forgedBody = Buffer.from(
      JSON.stringify({ kind: 'magic', email: 'admin@example.com', jti: 'x', exp: Date.now() + 60000 }),
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

describe('magic-link single use (jti persisted)', () => {
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
    const { jti, expires_at } = createMagicLinkToken('kid@example.com', SECRET);
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
