import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { buildSession, FIRST_ARCHETYPE_ORDER, type CandidateQuestion } from '@/lib/session/builder';
import { ArchetypeZ } from '@/lib/validation/question';
import type { Archetype } from '@/lib/types';
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

/**
 * THE FIRST QUESTION TAKES THE SIMPLEST SHAPE, NOT THE SCARCEST. The generator
 * chooses archetypes by the bank's deficit, which balances a bank and is the
 * wrong instinct for meeting a stranger: a cold account was handed
 * reverse-reasoning — the result given, the input asked for — because it
 * happened to be the rarest thing we had.
 */
describe("'first' ranks archetypes by how much must be done before writing", () => {
  const weights = new Map<string, number>([['M1.1.', 10], ['M1.2.', 10]]);
  const base = {
    perObjectiveMastery: new Map<string, number>(),
    m1Mastery: 0,
    targetModules: [1, 2, 3] as (1 | 2 | 3)[],
    topicWeightByPrefix: weights,
    mode: 'first' as const,
  };
  const cand = (id: string, archetype: Archetype | undefined, module: 1 | 2 | 3 = 1, objective = 'M1.1.1'): CandidateQuestion => ({
    id, objective_ids: [objective], module, kind: 'structured', marks: 5, method_rows: 2, part_count: 1, archetype,
  });

  it('takes the gentlest archetype the pool offers', () => {
    const picked = buildSession({
      ...base,
      candidates: [cand('hard', 'reverse-reasoning'), cand('mid', 'multi-step-application'), cand('easy', 'direct-procedure')],
    });
    expect(picked.map((p) => p.id)).toEqual(['easy']);
  });

  it('falls to the next gentlest when the simplest is not there', () => {
    const picked = buildSession({
      ...base,
      candidates: [cand('hard', 'reverse-reasoning'), cand('mid', 'multi-step-application')],
    });
    expect(picked.map((p) => p.id)).toEqual(['mid']);
  });

  it('still takes reverse-reasoning when it is all the bank has', () => {
    // Never an empty session: the ordering is a preference, not a filter.
    expect(buildSession({ ...base, candidates: [cand('only', 'reverse-reasoning')] }).map((p) => p.id)).toEqual(['only']);
  });

  it('lets the M1 gate outrank it, because a prerequisite is not a preference', () => {
    const picked = buildSession({
      ...base,
      m1Mastery: 0,
      candidates: [cand('m3-easy', 'direct-procedure', 3, 'M3.1.1'), cand('m1-hard', 'reverse-reasoning', 1, 'M1.1.1')],
    });
    expect(picked.map((p) => p.id)).toEqual(['m1-hard']);
  });

  it('outranks topic coverage, which is what this one question is not for', () => {
    const picked = buildSession({
      ...base,
      attemptedObjectives: new Set(['M1.1.1']),
      candidates: [cand('unstarted-hard', 'reverse-reasoning', 1, 'M1.2.1'), cand('started-easy', 'direct-procedure', 1, 'M1.1.1')],
    });
    expect(picked.map((p) => p.id)).toEqual(['started-easy']);
  });

  it('sorts an unknown shape last without excluding it', () => {
    expect(buildSession({ ...base, candidates: [cand('none', undefined), cand('known', 'justification')] }).map((p) => p.id)).toEqual(['known']);
    expect(buildSession({ ...base, candidates: [cand('none', undefined)] }).map((p) => p.id)).toEqual(['none']);
  });

  it('changes nothing for the modes that are balancing, not welcoming', () => {
    const candidates = [cand('hard', 'reverse-reasoning', 1, 'M1.1.1'), cand('easy', 'direct-procedure', 1, 'M1.2.1')];
    // The order adaptive produces must not move when the shapes are removed.
    const withShapes = buildSession({ ...base, mode: 'adaptive', candidates });
    const without = buildSession({ ...base, mode: 'adaptive', candidates: candidates.map((c) => ({ ...c, archetype: undefined })) });
    expect(withShapes.map((p) => p.id)).toEqual(without.map((p) => p.id));
  });

  it('orders every archetype, so a new one cannot sort last by accident', () => {
    expect([...FIRST_ARCHETYPE_ORDER].sort()).toEqual([...ArchetypeZ.options].sort());
  });
});
