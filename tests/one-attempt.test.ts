import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// ROUND_6 Task 4: one attempt per question in a session. The unique index is
// the mechanism; a second submit reads the first attempt's outcome and spends
// nothing.
const STUDENT = new mongoose.Types.ObjectId();
vi.mock('@/lib/auth/session', () => ({
  requireSession: async () => ({ student_id: String(STUDENT), email: 'once@extralesson.invalid', role: 'student' }),
}));

let markerCalls = 0;
vi.mock('ai', () => ({
  generateObject: async (opts: { messages?: unknown }) => {
    if (opts.messages) {
      return { object: { lines: [{ part_label: 'a', slot_label: null, text: '3x = 15', confidence: 0.9 }], answers: [], legible: true }, usage: {} };
    }
    markerCalls++;
    return { object: { decisions: [{ code: 'R1', awarded: true, reason: 'divides by 3', confidence: 0.9 }] }, usage: {} };
  },
}));

let mongod: MongoMemoryServer;
let db: typeof import('@/lib/db');
let submitAnswer: typeof import('@/app/study/session/[id]/actions').submitAnswer;
let readWorking: typeof import('@/app/study/session/[id]/capture').readWorking;
const IMAGE = { contentType: 'image/jpeg', data: Buffer.from('not really a jpeg').toString('base64') };

async function question() {
  const { insertedId } = await db.Question.collection.insertOne({
    kind: 'structured',
    stem: 'Solve.',
    marks: 2,
    parts: [{ label: 'a', prompt: 'Solve 3x = 15.', marks: 2, slots: [{ label: 'i', answer: '5', response_mode: 'answer' }] }],
    rubric: [
      { code: 'R1', slot_ref: 'a.i', part_label: 'a', criterion: 'divides both sides by 3', mark_value: 1, profile: 'AK' },
      { code: 'R2', slot_ref: 'a.i', part_label: 'a', criterion: 'x = 5 CAO', mark_value: 1, profile: 'AK' },
    ],
    worked_solution: 'x = 5',
    misconceptions: [],
    status: 'approved',
  });
  return insertedId;
}
async function session() {
  const s = await db.PracticeSession.create({ student_id: STUDENT, question_ids: [await question()], mode: 'adaptive', started_at: new Date() });
  return String(s._id);
}
const wrong = [{ label: 'a.i', answer: '4' }];
const right = [{ label: 'a.i', answer: '5' }];

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  await mongoose.connect(process.env.MONGODB_URI);
  db = await import('@/lib/db');
  await db.Attempt.init();
  ({ submitAnswer } = await import('@/app/study/session/[id]/actions'));
  ({ readWorking } = await import('@/app/study/session/[id]/capture'));
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});
beforeEach(async () => {
  markerCalls = 0;
  await Promise.all([db.Attempt.deleteMany({}), db.Transcription.deleteMany({}), db.PracticeSession.deleteMany({})]);
});

describe('one attempt per question', () => {
  it('is a unique index, with a backfill that ranks attempts whose session is gone', async () => {
    const indexes = db.Attempt.schema.indexes() as [Record<string, number>, { unique?: boolean }][];
    expect(indexes.some(([k, o]) => o?.unique && Object.keys(k).join(',') === 'session_id,question_index')).toBe(true);
    const { backfillAttemptIndex } = await import('@/lib/db/backfill-attempt-index');
    const sid = String(await session());
    const gone = new mongoose.Types.ObjectId();
    const q = (await db.PracticeSession.findById(sid).lean<{ question_ids: unknown[] }>())!.question_ids[0];
    const base = { student_id: STUDENT, answer: '', rubric_awarded: [], profile_marks: { CK: 0, AK: 0, R: 0 }, correct: false, duration_ms: 0 };
    // Legacy rows predate the index; the backfill's syncIndexes is what brings it back.
    await db.Attempt.collection.dropIndex('session_id_1_question_index_1');
    await db.Attempt.collection.insertMany([
      { ...base, session_id: new mongoose.Types.ObjectId(sid), question_id: q, ts: new Date(1) },
      { ...base, session_id: gone, question_id: q, ts: new Date(2) },
      { ...base, session_id: gone, question_id: q, ts: new Date(3) },
    ]);
    expect(await backfillAttemptIndex()).toEqual({ indexed: 1, ranked: 2 });
    const rows = await db.Attempt.find().sort({ ts: 1 }).lean<{ question_index: number }[]>();
    expect(rows.map((r) => r.question_index)).toEqual([0, 0, 1]);
    const live = await db.Attempt.collection.indexes();
    expect(live.some((i) => i.name === 'session_id_1_question_index_1' && i.unique)).toBe(true);
  });

  it('two submits in parallel: one attempt lands, both callers get its outcome, the marker runs once', async () => {
    const sessionId = await session();
    await readWorking({ sessionId, questionIndex: 0, ...IMAGE });
    // Both wrong, so whichever lands has a method row for the marker to read.
    const [a, b] = await Promise.all([
      submitAnswer({ sessionId, questionIndex: 0, answers: wrong }),
      submitAnswer({ sessionId, questionIndex: 0, answers: [{ label: 'a.i', answer: '3' }] }),
    ]);
    if ('error' in a || 'error' in b) throw new Error('a submit errored');
    expect(await db.Attempt.countDocuments({ session_id: sessionId })).toBe(1);
    expect(a.attemptId).toBe(b.attemptId);
    expect(a.correct).toBe(b.correct);
    expect(a.rubric_awarded).toEqual(b.rubric_awarded);
    expect(markerCalls).toBe(1);
  });

  it('a later second submit reads the first back and never re-marks', async () => {
    const sessionId = await session();
    await readWorking({ sessionId, questionIndex: 0, ...IMAGE });
    const first = await submitAnswer({ sessionId, questionIndex: 0, answers: wrong });
    if ('error' in first) throw new Error(first.error);
    const again = await submitAnswer({ sessionId, questionIndex: 0, answers: right });
    if ('error' in again) throw new Error(again.error);
    expect(again.attemptId).toBe(first.attemptId);
    expect(again.correct).toBe(false);
    expect(again.partResults).toEqual([{ label: 'a.i', correct: false, formWithheld: false, reasonHtml: expect.any(String) }]);
    expect(again.working?.method).toEqual(first.working?.method);
    expect(await db.Attempt.countDocuments()).toBe(1);
    expect(markerCalls).toBe(1);
  });
});
