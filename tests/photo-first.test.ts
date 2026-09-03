import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

const STUDENT = new mongoose.Types.ObjectId();
vi.mock('@/lib/auth/session', () => ({
  requireSession: async () => ({ student_id: String(STUDENT), email: 'photo@extralesson.invalid' }),
  isAdminEmail: () => false,
}));

// A COUNTING STUB. What is under test is where the image goes and how often,
// never what the model sees in it.
const calls: { image: boolean; kind: 'read' | 'drawing' | 'mark' }[] = [];
let readerAnswers: { slot_label: string; text: string }[] = [];
vi.mock('ai', () => ({
  generateObject: async (opts: { schema: unknown; messages?: { content: unknown }[] }) => {
    const content = opts.messages?.[0]?.content; // markMethod sends a prompt, not messages
    const image = Array.isArray(content) && content.some((p) => p.type === 'image');
    const { TranscriptionZ } = await import('@/lib/grade/transcribe');
    const kind = !image ? 'mark' : opts.schema === TranscriptionZ ? 'read' : 'drawing';
    calls.push({ image, kind });
    if (kind === 'read') {
      return {
        object: {
          lines: [{ part_label: 'a', slot_label: null, text: '3x = 15', confidence: 0.9 }],
          answers: readerAnswers,
          legible: true,
        },
        usage: { inputTokens: 10, outputTokens: 5 },
      };
    }
    if (kind === 'drawing') {
      return {
        object: {
          legible: true,
          axesDrawn: true,
          observations: [
            { index: 0, visible: true, note: '' },
            { index: 1, visible: true, note: '' },
          ],
        },
      };
    }
    return {
      object: { decisions: [{ code: 'R1', awarded: true, reason: 'divides by 3', confidence: 0.9 }] },
      usage: { inputTokens: 1, outputTokens: 1 },
    };
  },
}));

let mongod: MongoMemoryServer;
let db: typeof import('@/lib/db');
let readWorking: typeof import('@/app/study/session/[id]/capture').readWorking;
let captureWorking: typeof import('@/app/study/session/[id]/capture').captureWorking;
let submitAnswer: typeof import('@/app/study/session/[id]/actions').submitAnswer;

const IMAGE = { contentType: 'image/jpeg', data: Buffer.from('not really a jpeg').toString('base64') };

const rubric = [
  { code: 'R1', slot_ref: 'a.i', part_label: 'a', criterion: 'divides both sides by 3', mark_value: 1, profile: 'AK' },
  { code: 'R2', slot_ref: 'a.i', part_label: 'a', criterion: 'x = 5 CAO', mark_value: 1, profile: 'AK' },
  { code: 'R3', slot_ref: 'b.i', part_label: 'b', criterion: 'all four factors', mark_value: 1, profile: 'CK' },
];
const parts = [
  { label: 'a', prompt: 'Solve 3x = 15.', marks: 2, slots: [{ label: 'i', answer: '5', response_mode: 'answer' }] },
  { label: 'b', prompt: 'List the factors of 6.', marks: 1, slots: [{ label: 'i', answer: '1, 2, 3, 6', response_mode: 'answer' }] },
];
const constructPart = {
  label: 'c',
  prompt: 'Draw the line.',
  marks: 1,
  slots: [{ label: 'i', answer: 'a straight line through (0, 2) and (1, 5)', response_mode: 'construct' }],
};

async function question(construct = false) {
  const doc = {
    kind: 'structured',
    stem: 'Two parts.',
    marks: construct ? 4 : 3,
    parts: construct ? [...parts, constructPart] : parts,
    rubric: construct
      ? [...rubric, { code: 'R4', slot_ref: 'c.i', part_label: 'c', criterion: 'line drawn', mark_value: 1, profile: 'AK' }]
      : rubric,
    visual: construct
      ? { template: 'coordinateGrid', params: { x_range: [0, 5], y_range: [0, 18], lines: [{ m: 3, c: 2 }] } }
      : undefined,
    worked_solution: 'x = 5',
    misconceptions: [],
    status: 'approved',
  };
  const { insertedId } = await db.Question.collection.insertOne(doc);
  return insertedId;
}

async function session(questionId: unknown) {
  const s = await db.PracticeSession.create({
    student_id: STUDENT,
    question_ids: [questionId],
    mode: 'adaptive',
    started_at: new Date(),
  });
  return String(s._id);
}

const wrongAnswers = [
  { label: 'a.i', answer: '4' },
  { label: 'b.i', answer: '', values: ['1', '2', '3', '6'] },
];

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  await mongoose.connect(process.env.MONGODB_URI);
  db = await import('@/lib/db');
  ({ readWorking, captureWorking } = await import('@/app/study/session/[id]/capture'));
  ({ submitAnswer } = await import('@/app/study/session/[id]/actions'));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(() => {
  calls.length = 0;
  readerAnswers = [
    { slot_label: 'a.i', text: '5' },
    { slot_label: 'b.i', text: '1, 2, 3, 6' },
  ];
});

const imageCalls = () => calls.filter((c) => c.image).length;

describe('photo first — ROUND_4 Task 1', () => {
  it('prefill lands in the draft, single-box slots only, and the read has no attempt', async () => {
    const sessionId = await session(await question());
    const res = await readWorking({ sessionId, questionIndex: 0, ...IMAGE });
    expect(res).toMatchObject({ take: 1, takesLeft: 1, prefill: { 'a.i': '5' } });
    if ('error' in res) return;
    expect(res.prefill).not.toHaveProperty('b.i'); // a list is typed one box per value

    const draft = await db.SessionDraft.findOne({ session_id: sessionId, question_index: 0 }).lean<{ answers: Record<string, string> } | null>();
    expect(draft?.answers).toEqual({ 'a.i': '5' });

    const read = await db.Transcription.findOne({ session_id: sessionId, question_index: 0 }).lean<Record<string, unknown> | null>();
    expect(read?.attempt_id).toBeUndefined();
    expect(read?.answers).toEqual(
      expect.arrayContaining([{ slot_label: 'a.i', text: '5' }, { slot_label: 'b.i', text: '1, 2, 3, 6' }]),
    );
    expect(read?.method_marks).toEqual([]);
    expect(imageCalls()).toBe(1);
  });

  it('submit links the read to the attempt and marks from stored text, never re-reading the image', async () => {
    const sessionId = await session(await question());
    await readWorking({ sessionId, questionIndex: 0, ...IMAGE });
    expect(imageCalls()).toBe(1);

    const fb = await submitAnswer({ sessionId, questionIndex: 0, answers: wrongAnswers });
    expect('error' in fb).toBe(false);
    if ('error' in fb) return;
    expect(fb.working?.method).toEqual([{ code: 'R1', awarded: true, reason: 'divides by 3', mark_value: 1 }]);
    expect(fb.working?.marksAdded).toBe(1);
    expect(fb.rubric_awarded).not.toContain('R1'); // the attempt is untouched: the mark lives on the read
    expect(fb.earnableByMethod).toBe(0); // R1 is now earned, so nothing is left for a second photo to add

    const read = await db.Transcription.findOne({ session_id: sessionId, question_index: 0 }).lean<Record<string, unknown> | null>();
    expect(String(read?.attempt_id)).toBe(fb.attemptId);
    expect(read?.expires_at).toBeUndefined();
    const image = await db.CapturedImage.findOne({ session_id: sessionId, question_index: 0 }).lean<Record<string, unknown> | null>();
    expect(String(image?.attempt_id)).toBe(fb.attemptId);

    expect(imageCalls()).toBe(1);
    expect(calls.map((c) => c.kind)).toEqual(['read', 'mark']);
  });

  it('a second read replaces the prefill, and a third is refused', async () => {
    const sessionId = await session(await question());
    await readWorking({ sessionId, questionIndex: 0, ...IMAGE });
    readerAnswers = [{ slot_label: 'a.i', text: '7' }];
    const second = await readWorking({ sessionId, questionIndex: 0, ...IMAGE });
    expect(second).toMatchObject({ take: 2, takesLeft: 0, prefill: { 'a.i': '7' } });
    const draft = await db.SessionDraft.findOne({ session_id: sessionId, question_index: 0 }).lean<{ answers: Record<string, string> } | null>();
    expect(draft?.answers['a.i']).toBe('7');
    expect(await readWorking({ sessionId, questionIndex: 0, ...IMAGE })).toMatchObject({ error: /limit/ });
    expect(await db.Transcription.countDocuments({ session_id: sessionId })).toBe(2);
  });

  it('a read with no submit expires with the draft', async () => {
    const sessionId = await session(await question());
    await readWorking({ sessionId, questionIndex: 0, ...IMAGE });
    const read = await db.Transcription.findOne({ session_id: sessionId }).lean<{ expires_at?: Date } | null>();
    const days = (read!.expires_at!.getTime() - Date.now()) / 86_400_000;
    expect(Math.round(days)).toBe(db.DRAFT_TTL_DAYS);
    const ttl = (db.Transcription.schema.indexes() as [Record<string, number>, { expireAfterSeconds?: number }][]).filter(
      ([, o]) => typeof o?.expireAfterSeconds === 'number',
    );
    expect(ttl).toHaveLength(1);
    expect(ttl[0]).toMatchObject([{ expires_at: 1 }, { expireAfterSeconds: 0 }]);
  });

  it('a construct question is drawn-checked at read time and decided at submit without the image', async () => {
    const sessionId = await session(await question(true));
    await readWorking({ sessionId, questionIndex: 0, ...IMAGE });
    expect(calls.map((c) => c.kind)).toEqual(['read', 'drawing']);
    const stored = await db.Transcription.findOne({ session_id: sessionId }).lean<{ construction?: { complete: boolean } } | null>();
    expect(stored?.construction?.complete).toBe(true);

    const fb = await submitAnswer({ sessionId, questionIndex: 0, answers: wrongAnswers });
    if ('error' in fb) throw new Error(fb.error);
    expect(fb.working?.method.find((m) => m.code === 'R4')).toMatchObject({ awarded: true });
    expect(calls.map((c) => c.kind)).toEqual(['read', 'drawing', 'mark']);
    expect(imageCalls()).toBe(2);
  });

  it('the post-submit camera is read then mark, and writes no draft', async () => {
    const sessionId = await session(await question());
    const fb = await submitAnswer({ sessionId, questionIndex: 0, answers: wrongAnswers });
    if ('error' in fb) throw new Error(fb.error);
    expect(fb.working).toBeUndefined();
    expect(calls).toEqual([]);

    const res = await captureWorking({ attemptId: fb.attemptId, ...IMAGE });
    expect(res).toMatchObject({ take: 1, takesLeft: 1, marksAdded: 1 });
    expect(calls.map((c) => c.kind)).toEqual(['read', 'mark']);
    const read = await db.Transcription.findOne({ attempt_id: fb.attemptId }).lean<Record<string, unknown> | null>();
    expect(read?.marker_version).toBeTruthy();
    expect(await db.SessionDraft.countDocuments({ session_id: sessionId })).toBe(0);
  });

  it('refuses a read into a session that is not the student’s', async () => {
    const other = await db.PracticeSession.create({
      student_id: new mongoose.Types.ObjectId(),
      question_ids: [await question()],
      mode: 'adaptive',
      started_at: new Date(),
    });
    expect(await readWorking({ sessionId: String(other._id), questionIndex: 0, ...IMAGE })).toMatchObject({ error: /found/ });
    expect(calls).toEqual([]);
  });
});
