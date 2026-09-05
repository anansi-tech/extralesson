import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// ROUND_6 Task 4: the row is inserted before the model is called and before a
// gate is passed, so of two racing calls exactly one lands and the loser
// spends nothing. The stub counts what reached the model.
const STUDENT = new mongoose.Types.ObjectId();
vi.mock('@/lib/auth/session', () => ({
  requireSession: async () => ({ student_id: String(STUDENT), email: 'race@extralesson.invalid', role: 'student' }),
  clearSessionCookie: async () => {},
}));
vi.mock('next/navigation', () => ({
  redirect: (to: string) => {
    throw new Error(`redirect:${to}`);
  },
}));

let readerCalls = 0;
let readerFails = false;
vi.mock('ai', () => ({
  generateObject: async (opts: { messages?: unknown }) => {
    if (!opts.messages) return { object: { decisions: [] }, usage: {} };
    readerCalls++;
    await new Promise((r) => setTimeout(r, 30));
    if (readerFails) throw new Error('vision down');
    return { object: { lines: [{ part_label: 'a', slot_label: null, text: '3x = 15', confidence: 0.9 }], answers: [], legible: true }, usage: {} };
  },
}));

let mongod: MongoMemoryServer;
let db: typeof import('@/lib/db');
let readWorking: typeof import('@/app/study/session/[id]/capture').readWorking;
let startSession: typeof import('@/app/study/actions').startSession;
const IMAGE = { contentType: 'image/jpeg', data: Buffer.from('not really a jpeg').toString('base64') };

async function question() {
  const { insertedId } = await db.Question.collection.insertOne({
    kind: 'structured',
    stem: 'Solve.',
    marks: 9,
    module: 1,
    difficulty: 2,
    objective_ids: ['M1.1.1'],
    parts: [{ label: 'a', prompt: 'Solve 3x = 15.', marks: 9, slots: [{ label: 'i', answer: '5', response_mode: 'answer', objective_id: 'M1.1.1' }] }],
    rubric: [{ code: 'R1', slot_ref: 'a.i', part_label: 'a', criterion: 'divides both sides by 3', mark_value: 9, profile: 'AK' }],
    worked_solution: 'x = 5',
    misconceptions: [],
    status: 'approved',
    gen_meta: { model: 'm', prompt_version: 'v', verified: true, ts: new Date() },
  });
  return insertedId;
}
const form = (mode: string) => {
  const fd = new FormData();
  fd.append('mode', mode);
  return fd;
};
const outcome = (r: PromiseSettledResult<void>) => (r.status === 'rejected' ? String((r.reason as Error).message) : 'returned');

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  await mongoose.connect(process.env.MONGODB_URI);
  db = await import('@/lib/db');
  await Promise.all([db.Transcription.init(), db.PracticeSession.init()]);
  ({ readWorking } = await import('@/app/study/session/[id]/capture'));
  ({ startSession } = await import('@/app/study/actions'));
  await db.Student.create({ _id: STUDENT, email: 'race@extralesson.invalid', name: 'R', exam_sitting: 'may-june-2027', syllabus_mode: 'modular-2027', target_modules: [1, 2, 3] });
  await question();
}, 120000);
afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});
beforeEach(async () => {
  readerCalls = 0;
  readerFails = false;
  await Promise.all([db.Transcription.deleteMany({}), db.PracticeSession.deleteMany({}), db.Attempt.deleteMany({}), db.SessionDraft.deleteMany({})]);
  const { resetRateLimits } = await import('@/lib/auth/rate-limit');
  resetRateLimits();
});

describe('two reads of the same page', () => {
  it('one lands, the other is refused before the model, and one take is spent', async () => {
    const s = await db.PracticeSession.create({ student_id: STUDENT, question_ids: [await question()], mode: 'adaptive' });
    const sessionId = String(s._id);
    const [a, b] = await Promise.all([readWorking({ sessionId, questionIndex: 0, ...IMAGE }), readWorking({ sessionId, questionIndex: 0, ...IMAGE })]);
    const errors = [a, b].filter((r) => 'error' in r);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ error: /already being read/ });
    expect(readerCalls).toBe(1);
    const rows = await db.Transcription.find({ session_id: sessionId }).lean<{ take: number; pending?: boolean; lines: unknown[] }[]>();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ take: 1, lines: [{ text: '3x = 15' }] });
    expect(rows[0].pending).toBeUndefined();
  });

  it('a model failure gives the reservation back, so the take is not spent', async () => {
    const s = await db.PracticeSession.create({ student_id: STUDENT, question_ids: [await question()], mode: 'adaptive' });
    const sessionId = String(s._id);
    readerFails = true;
    expect(await readWorking({ sessionId, questionIndex: 0, ...IMAGE })).toMatchObject({ error: /could not read/ });
    expect(await db.Transcription.countDocuments({ session_id: sessionId })).toBe(0);
    readerFails = false;
    expect(await readWorking({ sessionId, questionIndex: 0, ...IMAGE })).toMatchObject({ take: 1 });
  });
});

describe('two first sessions', () => {
  it('exactly one lands; the loser is told the first question is taken', async () => {
    const results = await Promise.allSettled([startSession(form('first')), startSession(form('first'))]);
    const outcomes = results.map(outcome).sort();
    expect(outcomes.filter((o) => o.startsWith('redirect:/study/session/'))).toHaveLength(1);
    expect(outcomes).toContain('redirect:/study?error=first-taken');
    expect(await db.PracticeSession.countDocuments({ mode: 'first' })).toBe(1);
  });
});

describe('two starts racing for the last free session', () => {
  it('exactly one lands; the loser meets the paywall', async () => {
    const { FREE_SESSIONS } = await import('@/lib/access');
    for (let i = 1; i < FREE_SESSIONS; i++) {
      await db.PracticeSession.create({ student_id: STUDENT, question_ids: [await question()], mode: 'adaptive', free_slot: i });
    }
    const results = await Promise.allSettled([startSession(form('adaptive')), startSession(form('adaptive'))]);
    const outcomes = results.map(outcome).sort();
    expect(outcomes.filter((o) => o.startsWith('redirect:/study/session/'))).toHaveLength(1);
    expect(outcomes).toContain('redirect:/study?error=needs-access');
    expect(await db.PracticeSession.countDocuments({ student_id: STUDENT, mode: 'adaptive' })).toBe(FREE_SESSIONS);
  });

  it('numbers existing sessions in start order, per student', async () => {
    const { backfillFreeSlots } = await import('@/lib/db/backfill-free-slots');
    const other = new mongoose.Types.ObjectId();
    const q = await question();
    await db.PracticeSession.collection.insertMany([
      { student_id: STUDENT, question_ids: [q], mode: 'adaptive', started_at: new Date(2) },
      { student_id: STUDENT, question_ids: [q], mode: 'diagnostic', started_at: new Date(1) },
      { student_id: STUDENT, question_ids: [q], mode: 'topic', started_at: new Date(3) },
      { student_id: other, question_ids: [q], mode: 'adaptive', started_at: new Date(4) },
    ]);
    expect(await backfillFreeSlots()).toEqual({ numbered: 3, students: 2 });
    const mine = await db.PracticeSession.find({ student_id: STUDENT }).sort({ started_at: 1 }).lean<{ mode: string; free_slot?: number }[]>();
    expect(mine.map((s) => [s.mode, s.free_slot ?? null])).toEqual([['diagnostic', null], ['adaptive', 1], ['topic', 2]]);
  });
});
