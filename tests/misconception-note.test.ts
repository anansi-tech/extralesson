import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// THE NOTE IS ABOUT THE ANSWER, THE SOLUTION IS ABOUT THE QUESTION. The
// remediation used to be written over feedbackHtml, so the student who got it
// wrong — the one who needed the working — was the only one who never saw it,
// and revisiting the same attempt showed a different panel than answering it.
const STUDENT = new mongoose.Types.ObjectId();
vi.mock('@/lib/auth/session', () => ({
  requireSession: async () => ({ student_id: String(STUDENT), email: 'note@extralesson.invalid', role: 'student' }),
}));

let mongod: MongoMemoryServer;
let db: typeof import('@/lib/db');
let submitAnswer: typeof import('@/app/study/session/[id]/actions').submitAnswer;

const SOLUTION = 'The sample mean is 6.';
const REMEDIATION = 'The symbol for a sample mean is x-bar, not mu.';

async function mcq() {
  const { insertedId } = await db.Question.collection.insertOne({
    kind: 'mcq',
    stem: 'Which gives the sample mean?',
    marks: 1,
    objective_ids: ['M2.1.1'],
    options: ['x-bar = 6', 'mu = 6', 'x-bar = 24', 'mu = 24'],
    answer_key: 0,
    profile: 'CK',
    worked_solution: SOLUTION,
    misconceptions: [{ trigger: 'mu = 6', name: 'Population parameter notation', remediation: REMEDIATION }],
    status: 'approved',
  });
  return insertedId;
}

async function structured() {
  const { insertedId } = await db.Question.collection.insertOne({
    kind: 'structured',
    stem: 'One part.',
    marks: 1,
    objective_ids: ['M1.1.1'],
    parts: [{ label: 'a', prompt: 'Solve 3x + 1 = 0.', marks: 1, slots: [{ label: 'i', answer: '-1/3', response_mode: 'answer', objective_id: 'M1.1.1' }] }],
    rubric: [{ code: 'AK1', slot_ref: 'a.i', part_label: 'a', criterion: 'x = -1/3 CAO', mark_value: 1, profile: 'AK' }],
    worked_solution: SOLUTION,
    misconceptions: [{ trigger: '1/3', name: 'Sign slip', remediation: 'The sign flips.' }],
    status: 'approved',
  });
  return insertedId;
}

/** A diagnostic, since that is the screen this was found on. */
async function session(qid: unknown) {
  const s = await db.PracticeSession.create({ student_id: STUDENT, question_ids: [qid], mode: 'diagnostic' });
  return String(s._id);
}

const panel = (f: unknown) => {
  const { feedbackHtml, misconception } = f as { feedbackHtml: string; misconception?: { nameHtml: string; remediationHtml: string } };
  return { feedbackHtml, misconception };
};

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  await mongoose.connect(process.env.MONGODB_URI);
  db = await import('@/lib/db');
  ({ submitAnswer } = await import('@/app/study/session/[id]/actions'));
}, 60000);
afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});
beforeEach(async () => {
  for (const c of ['questions', 'practicesessions', 'attempts']) await mongoose.connection.collection(c).deleteMany({});
});

describe('a wrong answer gets the note and the solution', () => {
  it('an MCQ: both, and the same both when the attempt is read back', async () => {
    const sessionId = await session(await mcq());
    const args = { sessionId, questionIndex: 0, answers: [{ label: 'a', answer: '1' }], durationMs: 1000 };

    const live = await submitAnswer(args);
    expect('error' in live ? live.error : null).toBeNull();
    expect(panel(live).feedbackHtml, 'the worked solution survives the note').toContain(SOLUTION);
    expect(panel(live).misconception?.nameHtml).toContain('Population parameter notation');
    expect(panel(live).misconception?.remediationHtml).toContain(REMEDIATION);

    // The second call is the read-back path: the attempt already exists.
    const revisit = await submitAnswer(args);
    expect(panel(revisit)).toEqual(panel(live));
  }, 30000);

  it('a structured question: the same, through the slot the marker faulted', async () => {
    const sessionId = await session(await structured());
    const args = { sessionId, questionIndex: 0, answers: [{ label: 'a.i', answer: '1/3' }], durationMs: 1000 };

    const live = await submitAnswer(args);
    expect(panel(live).feedbackHtml).toContain(SOLUTION);
    expect(panel(live).misconception?.nameHtml).toContain('Sign slip');
    expect(panel(await submitAnswer(args))).toEqual(panel(live));
  }, 30000);

  it('a right answer: the solution, and no note about a mistake that was not made', async () => {
    const sessionId = await session(await mcq());
    const args = { sessionId, questionIndex: 0, answers: [{ label: 'a', answer: '0' }], durationMs: 1000 };

    const live = await submitAnswer(args);
    expect(panel(live).feedbackHtml).toContain(SOLUTION);
    expect(panel(live).misconception).toBeUndefined();
    expect(panel(await submitAnswer(args))).toEqual(panel(live));
  }, 30000);

  it('a wrong answer the bank has no name for: the solution, and no note', async () => {
    const sessionId = await session(await mcq());
    const args = { sessionId, questionIndex: 0, answers: [{ label: 'a', answer: '3' }], durationMs: 1000 };

    const live = await submitAnswer(args);
    expect(panel(live).feedbackHtml).toContain(SOLUTION);
    expect(panel(live).misconception).toBeUndefined();
    expect(panel(await submitAnswer(args))).toEqual(panel(live));
  }, 30000);
});
