import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// ROUND_7 Task 2: hand in as is. A blank scores zero, the fold scores it
// withheld, and the solution reveals — and there is no other way to it.
const STUDENT = new mongoose.Types.ObjectId();
vi.mock('@/lib/auth/session', () => ({
  requireSession: async () => ({ student_id: String(STUDENT), email: 'blank@extralesson.invalid', role: 'student' }),
}));

let mongod: MongoMemoryServer;
let db: typeof import('@/lib/db');
let submitAnswer: typeof import('@/app/study/session/[id]/actions').submitAnswer;
let loadHistory: typeof import('@/lib/study/history').loadHistory;

async function structured() {
  const { insertedId } = await db.Question.collection.insertOne({
    kind: 'structured',
    stem: 'Two parts.',
    marks: 3,
    objective_ids: ['M1.1.1'],
    parts: [
      { label: 'a', prompt: 'Solve 3x = 15.', marks: 2, slots: [{ label: 'i', answer: '5', response_mode: 'answer', objective_id: 'M1.1.1' }] },
      { label: 'b', prompt: 'Factors of 6.', marks: 1, slots: [{ label: 'i', answer: '1, 2, 3, 6', response_mode: 'answer', objective_id: 'M1.1.1' }] },
    ],
    rubric: [
      { code: 'AK1', slot_ref: 'a.i', part_label: 'a', criterion: 'divides both sides by 3', mark_value: 1, profile: 'AK' },
      { code: 'AK2', slot_ref: 'a.i', part_label: 'a', criterion: 'x = 5 CAO', mark_value: 1, profile: 'AK' },
      { code: 'CK1', slot_ref: 'b.i', part_label: 'b', criterion: 'all four factors', mark_value: 1, profile: 'CK' },
    ],
    worked_solution: 'x = 5 and the factors are 1, 2, 3, 6',
    misconceptions: [],
    status: 'approved',
  });
  return insertedId;
}
async function mcq() {
  const { insertedId } = await db.Question.collection.insertOne({
    kind: 'mcq', stem: 'Pick.', marks: 1, objective_ids: ['M1.1.1'], options: ['a', 'b', 'c', 'd'], answer_key: 1, profile: 'CK',
    worked_solution: 'It is b.', misconceptions: [], status: 'approved',
  });
  return insertedId;
}
async function session(qid: unknown) {
  const s = await db.PracticeSession.create({ student_id: STUDENT, question_ids: [qid], mode: 'adaptive' });
  return String(s._id);
}

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  await mongoose.connect(process.env.MONGODB_URI);
  db = await import('@/lib/db');
  ({ submitAnswer } = await import('@/app/study/session/[id]/actions'));
  ({ loadHistory } = await import('@/lib/study/history'));
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});
beforeEach(async () => {
  await Promise.all([db.Attempt.deleteMany({}), db.PracticeSession.deleteMany({})]);
});

describe('hand in as is', () => {
  it('all blank: the attempt records the blanks, every row is withheld, the solution reveals', async () => {
    const sessionId = await session(await structured());
    const fb = await submitAnswer({ sessionId, questionIndex: 0, answers: [{ label: 'a.i', answer: '' }, { label: 'b.i', answer: '' }] });
    if ('error' in fb) throw new Error(fb.error);
    expect(fb.correct).toBe(false);
    expect(fb.rubric_awarded).toEqual([]);
    expect(fb.partResults.map((p) => p.correct)).toEqual([false, false]);
    expect(fb.feedbackHtml).toContain('factors are');
    const stored = await db.Attempt.findOne({ session_id: sessionId }).lean<{ answer: string }>();
    expect(stored?.answer).toBe('(a.i) ; (b.i) ');
    expect(await loadHistory(String(STUDENT))).toMatchObject([{ earned: 0, marks: 3, unassessed: 0 }]);
  });

  it('part blank: the filled part earns, the blank part is withheld, nothing is unassessed', async () => {
    const sessionId = await session(await structured());
    const fb = await submitAnswer({ sessionId, questionIndex: 0, answers: [{ label: 'a.i', answer: '5' }, { label: 'b.i', answer: '' }] });
    if ('error' in fb) throw new Error(fb.error);
    expect(fb.rubric_awarded.sort()).toEqual(['AK1', 'AK2']);
    expect(fb.partResults.map((p) => p.correct)).toEqual([true, false]);
    expect(await loadHistory(String(STUDENT))).toMatchObject([{ earned: 2, marks: 3, unassessed: 0 }]);
  });

  it('MCQ "I don’t know" is the fifth option and scores wrong', async () => {
    const sessionId = await session(await mcq());
    const fb = await submitAnswer({ sessionId, questionIndex: 0, answers: [{ label: 'a', answer: '4' }] });
    if ('error' in fb) throw new Error(fb.error);
    expect(fb.correct).toBe(false);
    expect(fb.feedbackHtml).toContain('It is b.');
    expect(await loadHistory(String(STUDENT))).toMatchObject([{ earned: 0, marks: 1 }]);
  });

  it('the card always lets a structured question be handed in, and says what a blank costs', () => {
    const card = readFileSync(join(process.cwd(), 'app', 'study', 'session', '[id]', 'question-card.tsx'), 'utf8');
    expect(card).toMatch(/const canSubmit = question\.kind === 'mcq' \? selected !== null : markedSlots\.length > 0;/);
    expect(card).toMatch(/'Hand in as is'/);
    expect(card).toMatch(/Blanks score zero, like the exam\./);
    expect(card).toMatch(/export const DONT_KNOW = 4;/);
    expect(card).toMatch(/I don&rsquo;t know/);
  });
});
