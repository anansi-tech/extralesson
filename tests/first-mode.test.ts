import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// ROUND_4 Task 2: the first question is one per student, ever, and free — it
// counts like the diagnostic, not against the free sessions.
let mongod: MongoMemoryServer;
let PracticeSession: typeof import('@/lib/db').PracticeSession;
let access: typeof import('@/lib/access');

const STUDENT = new mongoose.Types.ObjectId();
const NOW = new Date('2026-09-03T00:00:00Z');
const paid = { sitting: 'may-june-2027', granted_at: NOW, source: 'manual' };

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  await mongoose.connect(process.env.MONGODB_URI);
  ({ PracticeSession } = await import('@/lib/db'));
  access = await import('@/lib/access');
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await PracticeSession.deleteMany({});
});

const sat = (mode: string, daysAgo = 0) =>
  PracticeSession.create({
    student_id: STUDENT,
    question_ids: [new mongoose.Types.ObjectId()],
    mode,
    started_at: new Date(NOW.getTime() - daysAgo * 86_400_000),
  });

describe("the 'first' gate", () => {
  it('lets a student who has never had one start it, paid or not', async () => {
    expect((await access.canStartSession(String(STUDENT), null, 'first', NOW)).allowed).toBe(true);
    expect((await access.canStartSession(String(STUDENT), paid, 'first', NOW)).allowed).toBe(true);
    expect(await access.firstQuestionTaken(String(STUDENT))).toBe(false);
  });

  it('refuses a second one, ever, even to a paying student', async () => {
    await sat('first', 400);
    for (const a of [null, paid]) {
      const gate = await access.canStartSession(String(STUDENT), a, 'first', NOW);
      expect(gate).toEqual({ allowed: false, reason: 'first-taken' });
    }
    expect(await access.firstQuestionTaken(String(STUDENT))).toBe(true);
  });

  it('does not count against the free sessions, and is not counted by them', async () => {
    await sat('first');
    await sat('diagnostic');
    expect(await access.freeSessionsUsed(String(STUDENT))).toBe(0);
    for (let i = 0; i < access.FREE_SESSIONS; i++) await sat('adaptive');
    expect(await access.freeSessionsUsed(String(STUDENT))).toBe(access.FREE_SESSIONS);
    const gate = await access.canStartSession(String(STUDENT), null, 'adaptive', NOW);
    expect(gate).toMatchObject({ allowed: false, reason: 'needs-access', used: access.FREE_SESSIONS });
  });

  it('is free after the free sessions are spent', async () => {
    for (let i = 0; i < access.FREE_SESSIONS; i++) await sat('adaptive');
    expect((await access.canStartSession(String(STUDENT), null, 'first', NOW)).allowed).toBe(true);
  });

  it('names both free modes in one place, which the schema and the actions accept', () => {
    expect(access.FREE_MODES).toEqual(['diagnostic', 'first']);
    const modes = (PracticeSession.schema.path('mode') as unknown as { enumValues: string[] }).enumValues;
    for (const m of access.FREE_MODES) expect(modes).toContain(m);
    const actions = readFileSync(join(process.cwd(), 'app', 'study', 'actions.ts'), 'utf8');
    expect(actions).toMatch(/MODES: SessionMode\[\] = \[[^\]]*'first'/);
  });
});

describe("the 'first' summary", () => {
  it('says what the question earned and that the diagnostic is next', () => {
    const page = readFileSync(join(process.cwd(), 'app', 'study', 'session', '[id]', 'page.tsx'), 'utf8');
    // From the first summary to the diagnostic summary that follows it; the
    // diagnostic's intro guard sits earlier in the file (ROUND_9 Task 5).
    const start = page.indexOf("session.mode === 'first'");
    const first = page.slice(start, page.indexOf("session.mode === 'diagnostic'", start));
    expect(first).toContain('What that question earned');
    expect(first).toContain('Next: the diagnostic');
    // The action is the diagnostic: the summary's one form carries that mode (ROUND_9 Task 6).
    expect(first).toMatch(/mode: 'diagnostic'/);
    // No ranking and no estimate: one question cannot support either.
    expect(first).not.toMatch(/rankByVerdict|topicsSeen|overall_percent/);
  });
});
