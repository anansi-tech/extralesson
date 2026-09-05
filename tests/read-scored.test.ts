import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// ROUND_6 Task 1, as behaviour: every surface reads lib/study/outcome.ts, so
// the audit's cases are asserted on the loaders the pages call, not on source.
const STUDENT = new mongoose.Types.ObjectId();
vi.mock('@/lib/auth/session', () => ({
  requireSession: async () => ({ student_id: String(STUDENT), email: 'fold@extralesson.invalid' }),
  isAdminEmail: () => false,
}));

let page: { lines: { part_label: string; slot_label: null; text: string; confidence: number }[]; legible: boolean } = { lines: [], legible: true };
let decisions: { code: string; awarded: boolean; reason: string; confidence: number }[] = [];
let markerFails = false;
let imageCalls = 0;
vi.mock('ai', () => ({
  generateObject: async (opts: { messages?: { content: unknown }[] }) => {
    if (opts.messages) {
      imageCalls++;
      return { object: { ...page, answers: [] }, usage: { inputTokens: 1, outputTokens: 1 } };
    }
    if (markerFails) throw new Error('timed out');
    return { object: { decisions }, usage: { inputTokens: 1, outputTokens: 1 } };
  },
}));

let mongod: MongoMemoryServer;
let db: typeof import('@/lib/db');
let readWorking: typeof import('@/app/study/session/[id]/capture').readWorking;
let retryMarking: typeof import('@/app/study/session/[id]/capture').retryMarking;
let submitAnswer: typeof import('@/app/study/session/[id]/actions').submitAnswer;
let loaders: {
  loadHistory: typeof import('@/lib/study/history').loadHistory;
  loadReviewable: typeof import('@/lib/study/reviewable').loadReviewable;
  loadAttemptRows: typeof import('@/lib/study/state').loadAttemptRows;
  loadMistakes: typeof import('@/lib/study/mistakes').loadMistakes;
  loadProgress: typeof import('@/lib/study/progress').loadProgress;
};

const IMAGE = { contentType: 'image/jpeg', data: Buffer.from('not really a jpeg').toString('base64') };

// Three marks the grader settles, one the page has to earn.
async function question() {
  const { insertedId } = await db.Question.collection.insertOne({
    kind: 'structured',
    stem: 'Three parts.',
    marks: 4,
    objective_ids: ['M1.1.1', 'M1.1.2', 'M1.2.1'],
    parts: [
      { label: 'a', prompt: 'Solve 3x = 15.', marks: 2, slots: [{ label: 'i', answer: '5', response_mode: 'answer', objective_id: 'M1.1.1' }] },
      { label: 'b', prompt: 'List the factors of 6.', marks: 1, slots: [{ label: 'i', answer: '1, 2, 3, 6', response_mode: 'answer', objective_id: 'M1.1.2' }] },
      { label: 'c', prompt: 'Show that the sum is 10.', marks: 1, slots: [{ label: 'i', answer: '10', response_mode: 'show_that', objective_id: 'M1.2.1' }] },
    ],
    rubric: [
      { code: 'R1', slot_ref: 'a.i', part_label: 'a', criterion: 'divides both sides by 3', mark_value: 1, profile: 'AK' },
      { code: 'R2', slot_ref: 'a.i', part_label: 'a', criterion: 'x = 5 CAO', mark_value: 1, profile: 'AK' },
      { code: 'R3', slot_ref: 'b.i', part_label: 'b', criterion: 'all four factors', mark_value: 1, profile: 'CK' },
      { code: 'R5', slot_ref: 'c.i', part_label: 'c', criterion: 'shows the sum equals 10', mark_value: 1, profile: 'R' },
    ],
    worked_solution: 'x = 5',
    misconceptions: [],
    status: 'approved',
  });
  return insertedId;
}

async function session(questionId: unknown) {
  const s = await db.PracticeSession.create({ student_id: STUDENT, question_ids: [questionId], mode: 'adaptive', started_at: new Date() });
  return String(s._id);
}

const right = [
  { label: 'a.i', answer: '5' },
  { label: 'b.i', answer: '', values: ['1', '2', '3', '6'] },
];
const wrong = [
  { label: 'a.i', answer: '4' },
  { label: 'b.i', answer: '', values: ['1', '2', '3', '6'] },
];

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  await mongoose.connect(process.env.MONGODB_URI);
  db = await import('@/lib/db');
  ({ readWorking, retryMarking } = await import('@/app/study/session/[id]/capture'));
  ({ submitAnswer } = await import('@/app/study/session/[id]/actions'));
  loaders = {
    loadHistory: (await import('@/lib/study/history')).loadHistory,
    loadReviewable: (await import('@/lib/study/reviewable')).loadReviewable,
    loadAttemptRows: (await import('@/lib/study/state')).loadAttemptRows,
    loadMistakes: (await import('@/lib/study/mistakes')).loadMistakes,
    loadProgress: (await import('@/lib/study/progress')).loadProgress,
  };
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  markerFails = false;
  imageCalls = 0;
  await Promise.all([db.Attempt.deleteMany({}), db.Transcription.deleteMany({}), db.PracticeSession.deleteMany({})]);
});

const DAYS = 24 * 60 * 60 * 1000;

describe('one score fold — ROUND_6 Task 1', () => {
  it('an unreadable photo assesses nothing: 3/3 stays 3/3 on every surface, one mark unassessed', async () => {
    page = { lines: [], legible: false };
    decisions = [{ code: 'R5', awarded: false, reason: 'nothing could be read', confidence: 0 }];
    const sessionId = await session(await question());
    await readWorking({ sessionId, questionIndex: 0, ...IMAGE });
    const fb = await submitAnswer({ sessionId, questionIndex: 0, answers: right });
    if ('error' in fb) throw new Error(fb.error);
    expect(fb.working?.method).toEqual([{ code: 'R5', awarded: false, reason: 'nothing could be read', mark_value: 1 }]);

    const id = String(STUDENT);
    expect(await loaders.loadHistory(id)).toMatchObject([{ earned: 3, marks: 3, unassessed: 1 }]);
    expect(await loaders.loadReviewable(id)).toMatchObject([{ earned: 3, marks: 3, unassessed: 1 }]);
    expect(await loaders.loadAttemptRows(id)).toMatchObject([{ score: 1, marks: 3 }]);
    expect((await loaders.loadProgress(id)).marksAssessed).toBe(3);
    const mistakes = await loaders.loadMistakes(id, new Date(Date.now() + 4 * DAYS));
    expect([...mistakes.lostByObjective.entries()]).toEqual([]);
  });

  it('a row the page earned is in the score and not in the revisit losses', async () => {
    page = { lines: [{ part_label: 'a', slot_label: null, text: '3x = 15, x = 15/3', confidence: 0.9 }], legible: true };
    decisions = [
      { code: 'R1', awarded: true, reason: 'the division by 3 is written', confidence: 0.9 },
      { code: 'R5', awarded: false, reason: 'we could not see the sum', confidence: 0.8 },
    ];
    const sessionId = await session(await question());
    await readWorking({ sessionId, questionIndex: 0, ...IMAGE });
    const fb = await submitAnswer({ sessionId, questionIndex: 0, answers: wrong });
    if ('error' in fb) throw new Error(fb.error);
    expect(fb.rubric_awarded).toEqual(['R3']);

    const id = String(STUDENT);
    // R1 from the page, R3 from the grader; R2 and R5 withheld; nothing unassessed.
    expect(await loaders.loadHistory(id)).toMatchObject([{ earned: 2, marks: 4, unassessed: 0 }]);
    expect(await loaders.loadReviewable(id)).toMatchObject([{ earned: 2, marks: 4, photographed: true }]);
    expect(await loaders.loadAttemptRows(id)).toMatchObject([{ score: 0.5, marks: 4 }]);
    const mistakes = await loaders.loadMistakes(id, new Date(Date.now() + 4 * DAYS));
    expect(Object.fromEntries(mistakes.lostByObjective)).toEqual({ 'M1.1.1': 1, 'M1.2.1': 1 });
  });

  it('with no photograph the page’s row is unassessed, never lost', async () => {
    const sessionId = await session(await question());
    const fb = await submitAnswer({ sessionId, questionIndex: 0, answers: wrong });
    if ('error' in fb) throw new Error(fb.error);
    const id = String(STUDENT);
    expect(await loaders.loadHistory(id)).toMatchObject([{ earned: 1, marks: 3, unassessed: 1 }]);
    const mistakes = await loaders.loadMistakes(id, new Date(Date.now() + 4 * DAYS));
    expect(Object.fromEntries(mistakes.lostByObjective)).toEqual({ 'M1.1.1': 2 });
  });
});

describe('marking fails honestly — ROUND_6 Task 1', () => {
  const legiblePage = () => {
    page = { lines: [{ part_label: 'c', slot_label: null, text: '4 + 6 = 10', confidence: 0.9 }], legible: true };
  };

  it('a timeout is stored as a failure, leaves the row unassessed, and is retryable over the stored text', async () => {
    legiblePage();
    markerFails = true;
    const sessionId = await session(await question());
    await readWorking({ sessionId, questionIndex: 0, ...IMAGE });
    const fb = await submitAnswer({ sessionId, questionIndex: 0, answers: right });
    if ('error' in fb) throw new Error(fb.error);
    expect(fb.working).toMatchObject({ marked: false, failure: 'timed out', method: [], marksAdded: 0 });

    const stored = await db.Transcription.findOne({ attempt_id: fb.attemptId }).lean<Record<string, any> | null>();
    expect(stored?.marker_version).toBeUndefined();
    expect(stored?.marking).toMatchObject({ status: 'failed', reason: 'timed out' });
    expect(await loaders.loadHistory(String(STUDENT))).toMatchObject([{ earned: 3, marks: 3, unassessed: 1 }]);

    markerFails = false;
    decisions = [{ code: 'R5', awarded: true, reason: 'the sum “4 + 6 = 10” is written', confidence: 0.9 }];
    const again = await retryMarking({ attemptId: fb.attemptId });
    expect(again).toMatchObject({ marked: true, marksAdded: 1 });
    const after = await db.Transcription.findOne({ attempt_id: fb.attemptId }).lean<Record<string, any> | null>();
    expect(after?.marker_version).toBeTruthy();
    expect(after?.marking).toBeUndefined();
    expect(imageCalls).toBe(1);
    expect(await loaders.loadHistory(String(STUDENT))).toMatchObject([{ earned: 4, marks: 4, unassessed: 0 }]);
  });

  it('a missing, repeated or unknown code is a failure, not a partial result', async () => {
    legiblePage();
    for (const [bad, reason] of [
      [[], /did not decide R5/],
      [[{ code: 'R5', awarded: true, reason: 'a', confidence: 1 }, { code: 'R5', awarded: false, reason: 'b', confidence: 1 }], /twice/],
      [[{ code: 'R5', awarded: true, reason: 'a', confidence: 1 }, { code: 'R9', awarded: true, reason: 'b', confidence: 1 }], /not asked/],
    ] as const) {
      decisions = [...bad];
      const sessionId = await session(await question());
      await readWorking({ sessionId, questionIndex: 0, ...IMAGE });
      const fb = await submitAnswer({ sessionId, questionIndex: 0, answers: right });
      if ('error' in fb) throw new Error(fb.error);
      expect(fb.working?.marked).toBe(false);
      expect(fb.working?.failure).toMatch(reason);
      const stored = await db.Transcription.findOne({ attempt_id: fb.attemptId }).lean<Record<string, any> | null>();
      expect(stored?.method_marks).toEqual([]);
      expect(stored?.marker_version).toBeUndefined();
    }
  });

  it('refuses a retry on another student’s attempt', async () => {
    const other = await db.Attempt.create({
      student_id: new mongoose.Types.ObjectId(),
      question_id: await question(),
      session_id: new mongoose.Types.ObjectId(),
      answer: '',
      rubric_awarded: [],
      profile_marks: { CK: 0, AK: 0, R: 0 },
      correct: false,
      duration_ms: 0,
    });
    expect(await retryMarking({ attemptId: String(other._id) })).toMatchObject({ error: /found/ });
  });
});
