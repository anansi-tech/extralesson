import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

const STUDENT = new mongoose.Types.ObjectId();
vi.mock('@/lib/auth/session', () => ({
  requireSession: async () => ({ student_id: String(STUDENT), email: 'reject@extralesson.invalid' }),
  isAdminEmail: () => false,
}));

// The marker is a stub that records every prompt it was sent, so the gate can
// say what the marker SAW, which is stronger than what it said.
const prompts: string[] = [];
const B1 = '1200000 - 144000 = 156000';
vi.mock('ai', () => ({
  generateObject: async (opts: { schema: unknown; prompt?: string; messages?: { content: unknown }[] }) => {
    const content = opts.messages?.[0]?.content;
    const image = Array.isArray(content) && content.some((p) => p.type === 'image');
    if (image) {
      return {
        object: {
          lines: [
            { part_label: 'a', slot_label: null, text: '0.12 x 1200000 = 144000', confidence: 0.95 },
            { part_label: 'b', slot_label: 'i', text: B1, confidence: 0.9 },
            { part_label: null, slot_label: 'ii', text: '1056000/1200000 = 0.88 = 88%', confidence: 0.8 },
          ],
          answers: [{ slot_ref: 'a.i', text: '144000' }, { slot_ref: 'b.i', text: '156000' }, { slot_ref: 'b.ii', text: '88%' }],
          legible: true,
        },
        usage: { inputTokens: 1, outputTokens: 1 },
      };
    }
    prompts.push(opts.prompt ?? '');
    return { object: { decisions: [{ code: 'CK2', awarded: false, reason: 'we could not see the subtraction', confidence: 0.6 }] }, usage: {} };
  },
}));

let mongod: MongoMemoryServer;
let db: typeof import('@/lib/db');
let readWorking: typeof import('@/app/study/session/[id]/capture').readWorking;
let submitAnswer: typeof import('@/app/study/session/[id]/actions').submitAnswer;
let rejectLine: typeof import('@/app/study/session/[id]/reject-line').rejectLine;

const IMAGE = { contentType: 'image/jpeg', data: Buffer.from('page').toString('base64') };

async function cocoa() {
  const { insertedId } = await db.Question.collection.insertOne({
    kind: 'structured',
    stem: 'Use the table to answer the questions below.',
    stimulus: 'A cocoa farmer sorts a harvest of 1 200 000 cocoa beans.',
    marks: 6,
    parts: [
      { label: 'a', prompt: 'Calculate the number of rejected beans.', marks: 2, slots: [{ label: 'i', answer: '144 000', response_mode: 'answer' }] },
      { label: 'b', prompt: 'Complete the row for suitable beans.', marks: 4, slots: [{ label: 'i', answer: '1 056 000', response_mode: 'answer', depends_on: ['a.i'] }, { label: 'ii', answer: '88%', response_mode: 'answer', depends_on: ['b.i'] }] },
    ],
    rubric: [
      { code: 'AK1', slot_ref: 'a.i', part_label: 'a', criterion: 'Calculates $0.12 \\times 1\\,200\\,000$', mark_value: 1, profile: 'AK' },
      { code: 'CK2', slot_ref: 'b.i', part_label: 'b', criterion: 'Recognises that suitable beans equal the total harvest less rejected beans', mark_value: 1, profile: 'CK' },
      { code: 'AK2', slot_ref: 'b.i', part_label: 'b', criterion: 'Subtracts "their" rejected-bean total from 1 200 000', mark_value: 1, profile: 'AK' },
    ],
    worked_solution: '1 200 000 - 144 000 = 1 056 000',
    misconceptions: [],
    status: 'approved',
  });
  const s = await db.PracticeSession.create({ student_id: STUDENT, question_ids: [insertedId], mode: 'adaptive', started_at: new Date() });
  return String(s._id);
}

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  await mongoose.connect(process.env.MONGODB_URI);
  db = await import('@/lib/db');
  await db.LineRejected.init();
  ({ readWorking } = await import('@/app/study/session/[id]/capture'));
  ({ submitAnswer } = await import('@/app/study/session/[id]/actions'));
  ({ rejectLine } = await import('@/app/study/session/[id]/reject-line'));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(() => {
  prompts.length = 0;
});

// ROUND_5 Task 2. The gate: a rejected line never reaches the marker, so it
// can never appear in a reason. The cocoa page, with the b(i) slip rejected.
describe('not what I wrote', () => {
  it('keeps the rejected line out of everything the marker sees, so CK2 cannot cite it', async () => {
    const sessionId = await cocoa();
    const read = await readWorking({ sessionId, questionIndex: 0, ...IMAGE });
    if ('error' in read) throw new Error(read.error);
    expect(await rejectLine({ transcriptionId: read.transcriptionId, lineIndex: 1 })).toEqual({ ok: true });

    // Their slip stands as the answer, so the b.i rows stay unearned and go to the marker.
    const fb = await submitAnswer({ sessionId, questionIndex: 0, answers: [{ label: 'a.i', answer: '144000' }, { label: 'b.i', answer: '156000' }, { label: 'b.ii', answer: '88%' }] });
    if ('error' in fb) throw new Error(fb.error);
    expect(prompts).toHaveLength(1);
    expect(prompts[0]).not.toContain(B1);
    // The line under the rejected one keeps its part, so it still goes.
    expect(prompts[0]).toContain('1056000/1200000');
    for (const m of fb.working?.method ?? []) expect(m.reason).not.toContain(B1);
    expect(fb.working?.rejected).toEqual([1]);

    // The read itself is untouched: the record is what was read.
    const stored = await db.Transcription.findById(read.transcriptionId).lean<{ lines: { text: string }[] } | null>();
    expect(stored?.lines[1].text).toBe(B1);
  });

  it('is append-only: a second tap is the same rejection, and nothing can be put back', async () => {
    const sessionId = await cocoa();
    const read = await readWorking({ sessionId, questionIndex: 0, ...IMAGE });
    if ('error' in read) throw new Error(read.error);
    await rejectLine({ transcriptionId: read.transcriptionId, lineIndex: 1 });
    expect(await rejectLine({ transcriptionId: read.transcriptionId, lineIndex: 1 })).toEqual({ ok: true });
    expect(await db.LineRejected.countDocuments({ transcription_id: read.transcriptionId })).toBe(1);
    const paths = Object.keys(db.LineRejected.schema.paths);
    expect(paths.some((p) => /restor|undo|status/.test(p))).toBe(false);
  });

  it('is closed once the read has been marked', async () => {
    const sessionId = await cocoa();
    const read = await readWorking({ sessionId, questionIndex: 0, ...IMAGE });
    if ('error' in read) throw new Error(read.error);
    await submitAnswer({ sessionId, questionIndex: 0, answers: [{ label: 'a.i', answer: '144000' }, { label: 'b.i', answer: '1056000' }, { label: 'b.ii', answer: '88' }] });
    expect(await rejectLine({ transcriptionId: read.transcriptionId, lineIndex: 0 })).toMatchObject({ error: /marked/ });
  });

  it('refuses a line outside the read, and another student’s read', async () => {
    const sessionId = await cocoa();
    const read = await readWorking({ sessionId, questionIndex: 0, ...IMAGE });
    if ('error' in read) throw new Error(read.error);
    expect(await rejectLine({ transcriptionId: read.transcriptionId, lineIndex: 9 })).toMatchObject({ error: /found/ });
    await db.Transcription.updateOne({ _id: read.transcriptionId }, { $set: { student_id: new mongoose.Types.ObjectId() } });
    expect(await rejectLine({ transcriptionId: read.transcriptionId, lineIndex: 0 })).toMatchObject({ error: /found/ });
  });
});

describe('the control and the strike-through', () => {
  const at = (f: string) => readFileSync(join(process.cwd(), 'app', 'study', 'session', '[id]', f), 'utf8');
  it('offers one control per line while the read is unmarked, and strikes a rejected line', () => {
    const read = at('working-read.tsx');
    expect(read).toMatch(/\{reject && \(\s*<RejectLineButton/);
    expect(read).toContain('you said this wasn&rsquo;t yours');
    expect(at('reject-line-button.tsx')).toContain('Not what I wrote');
    // Before submit only: after an attempt exists the read is marked at once.
    expect(at('working-photo.tsx')).toMatch(/reject=\{!attemptId && readId \? \{ transcriptionId: readId \} : undefined\}/);
  });
  it('carries rejections into the look back and the live result', () => {
    expect(at('page.tsx')).toMatch(/LineRejected\.find\(\{ transcription_id: \{ \$in: takes\.map/);
    expect(at('question-card.tsx')).toMatch(/rejected=\{w\.rejected\}/);
    expect(at('mark-working.ts')).toMatch(/struck\.has\(i\) \? \{ \.\.\.l, text: '' \} : l/);
  });
});
