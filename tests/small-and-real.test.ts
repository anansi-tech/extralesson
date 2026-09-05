import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { readingCostOf } from '@/lib/admin/reading-cost';
import { buildSession, RECENT_DAYS } from '@/lib/session/builder';
import { attemptOutcome } from '@/lib/study/outcome';
import { rubricHash } from '@/lib/grade/version';

// ROUND_6 Task 8: small and real.
describe('(1) the cost names what it counted', () => {
  it('totals reading, drawing and marking, and says which were recorded', () => {
    const c = readingCostOf([
      { usage: { input_tokens: 1000, output_tokens: 100 } },
      { usage: { input_tokens: 1000, output_tokens: 100, marking_input: 2000, marking_output: 200 } },
    ]);
    expect(c.reads).toBe(2);
    expect(c.reading.calls).toBe(2);
    expect(c.marking.calls).toBe(1);
    expect(c.drawing.calls).toBe(0);
    expect(c.present).toEqual(['reading', 'marking']);
    expect(c.totalUsd).toBeCloseTo(c.reading.usd + c.marking.usd);
  });
  it('is stored per call with a model id', () => {
    const schema = readFileSync(join(process.cwd(), 'lib', 'db', 'transcription.ts'), 'utf8');
    for (const k of ['marking_input', 'marking_output', 'drawing_input', 'drawing_output', 'marker_model', 'drawing_model']) expect(schema).toContain(k);
  });
});

describe('(2) a question seen lately is not set again', () => {
  const candidates = [
    { id: 'b', objective_ids: ['M1.1.1'], module: 1 as const, kind: 'structured' as const, marks: 9 },
    { id: 'a', objective_ids: ['M1.1.1'], module: 1 as const, kind: 'structured' as const, marks: 9 },
    { id: 'c', objective_ids: ['M1.1.1'], module: 1 as const, kind: 'structured' as const, marks: 9 },
  ];
  const args = { candidates, perObjectiveMastery: new Map(), m1Mastery: 0.9, targetModules: [1 as const], topicWeightByPrefix: new Map([['M1.1.', 1]]) };
  it('adaptive and topic leave out ids attempted in the last 14 days, and tie-break by id', () => {
    expect(RECENT_DAYS).toBe(14);
    expect(buildSession({ ...args, mode: 'adaptive', recentIds: new Set(['a']) }).map((q) => q.id)[0]).toBe('b');
    expect(buildSession({ ...args, mode: 'adaptive' }).map((q) => q.id)[0]).toBe('a');
    expect(buildSession({ ...args, mode: 'topic', focusPrefixes: ['M1.1.'], recentIds: new Set(['a', 'b']) }).map((q) => q.id)[0]).toBe('c');
  });
  it('the planner reads the window from the attempts', () => {
    expect(readFileSync(join(process.cwd(), 'lib', 'session', 'plan.ts'), 'utf8')).toMatch(/RECENT_DAYS \* 86_400_000[\s\S]*recentIds: new Set/);
  });
});

describe('(3) a failed connect is forgotten', () => {
  it('drops the rejected promise so the next call connects again', async () => {
    const prev = process.env.MONGODB_URI;
    const g = global as typeof globalThis & { _mongoose?: { conn: unknown; promise: unknown } };
    const saved = g._mongoose;
    g._mongoose = undefined;
    vi.resetModules();
    const { dbConnect } = await import('@/lib/db/connect');
    process.env.MONGODB_URI = 'mongodb://127.0.0.1:1/x?serverSelectionTimeoutMS=200&connectTimeoutMS=200';
    await expect(dbConnect()).rejects.toThrow();
    expect((g as { _mongoose?: { promise: unknown } })._mongoose?.promise).toBeNull();
    process.env.MONGODB_URI = prev;
    g._mongoose = saved;
  }, 20000);
});

describe('(4) the rubric the attempt was marked against', () => {
  it('is hashed, and the fold prefers the snapshot to the bank', () => {
    const then = [{ code: 'A1', profile: 'AK' as const, criterion: 'old', mark_value: 2, slot_ref: 'a.i' }];
    const now = [{ code: 'A1', profile: 'AK' as const, criterion: 'new', mark_value: 5, slot_ref: 'a.i' }];
    expect(rubricHash(then)).not.toBe(rubricHash(now));
    const q = { parts: [{ label: 'a', slots: [{ label: 'i', response_mode: 'answer' }] }], rubric: now };
    expect(attemptOutcome({ rubric_awarded: ['A1'], rubric: then }, q).earned).toBe(2);
    expect(attemptOutcome({ rubric_awarded: ['A1'] }, q).earned).toBe(5);
  });
  it('is stored on submit with its hash, and looking back renders it', () => {
    expect(readFileSync(join(process.cwd(), 'app', 'study', 'session', '[id]', 'actions.ts'), 'utf8')).toMatch(/rubric_hash: rubricHash\(question\.rubric\)/);
    expect(readFileSync(join(process.cwd(), 'app', 'study', 'session', '[id]', 'page.tsx'), 'utf8')).toMatch(/reviewing \? attempts\[index\]\.rubric \?\? question\.rubric : question\.rubric/);
  });
});

describe('(4) the backfill stamps what exists', () => {
  let mongod: MongoMemoryServer;
  let db: typeof import('@/lib/db');
  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongod.getUri();
    await mongoose.connect(process.env.MONGODB_URI);
    db = await import('@/lib/db');
  }, 60000);
  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });
  it('takes the bank rubric for attempts made before the snapshot, and counts a gone question', async () => {
    const { backfillRubricSnapshot } = await import('@/lib/db/backfill-rubric-snapshot');
    const { insertedId } = await db.Question.collection.insertOne({ kind: 'structured', stem: 's', marks: 1, rubric: [{ code: 'A1', profile: 'AK', criterion: 'c', mark_value: 1, slot_ref: 'a.i', part_label: 'a' }], worked_solution: 'w', misconceptions: [], status: 'approved' });
    const base = { student_id: new mongoose.Types.ObjectId(), session_id: new mongoose.Types.ObjectId(), question_index: 0, answer: '', rubric_awarded: [], profile_marks: { CK: 0, AK: 0, R: 0 }, correct: false, duration_ms: 0, ts: new Date() };
    await db.Attempt.collection.insertMany([{ ...base, question_id: insertedId }, { ...base, question_id: new mongoose.Types.ObjectId() }]);
    expect(await backfillRubricSnapshot()).toEqual({ stamped: 1, orphaned: 1 });
    const stamped = await db.Attempt.findOne({ question_id: insertedId }).lean<{ rubric_hash: string; rubric: { code: string }[] }>();
    expect(stamped?.rubric_hash).toMatch(/^[0-9a-f]{12}$/);
    expect(stamped?.rubric.map((r) => r.code)).toEqual(['A1']);
  });
});

describe('(5) one instruction file, one place for finished scripts', () => {
  it('has no AGENTS.md, points the README at R6, and keeps the one-offs under scripts/done', () => {
    expect(existsSync(join(process.cwd(), 'AGENTS.md'))).toBe(false);
    const readme = readFileSync(join(process.cwd(), 'README.md'), 'utf8');
    expect(readme).toMatch(/ROUND_6_ONE_TRUTH\.md/);
    expect(readme).toMatch(/pnpm eval:marker[\s\S]*pnpm eval:reads[\s\S]*pnpm eval:pipeline/);
    const top = readdirSync(join(process.cwd(), 'scripts')).filter((f) => /^(repair-|relabel-|reset-question-bank)/.test(f));
    expect(top).toEqual([]);
    expect(readdirSync(join(process.cwd(), 'scripts', 'done')).length).toBeGreaterThan(10);
  });
});
