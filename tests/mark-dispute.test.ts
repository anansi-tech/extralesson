import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

const STUDENT = new mongoose.Types.ObjectId();
vi.mock('@/lib/auth/session', () => ({
  requireSession: async () => ({ student_id: String(STUDENT), email: 'dispute@extralesson.invalid' }),
  isAdminEmail: () => false,
}));

let mongod: MongoMemoryServer;
let db: typeof import('@/lib/db');
let disputeMark: typeof import('@/app/study/session/[id]/dispute').disputeMark;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  await mongoose.connect(process.env.MONGODB_URI);
  db = await import('@/lib/db');
  ({ disputeMark } = await import('@/app/study/session/[id]/dispute'));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  for (const m of [db.Attempt, db.Transcription, db.MarkDispute]) await m.deleteMany({});
});

async function marked(student = STUDENT) {
  const session = new mongoose.Types.ObjectId();
  const question = new mongoose.Types.ObjectId();
  const attempt = await db.Attempt.create({
    student_id: student,
    question_id: question,
    session_id: session,
    answer: '(a.i) 4',
    rubric_awarded: ['R3'],
    profile_marks: { CK: 1, AK: 0, R: 0 },
    correct: false,
    duration_ms: 1,
  });
  const read = await db.Transcription.create({
    student_id: student,
    session_id: session,
    question_index: 0,
    attempt_id: attempt._id,
    question_id: question,
    lines: [{ part_label: 'a', text: '3x = 15', confidence: 0.9 }],
    legible: true,
    reader_model: 'test',
    method_marks: [
      { code: 'R1', awarded: false, reason: 'we could not see the division', mark_value: 1, profile: 'AK' },
      { code: 'R2', awarded: true, reason: 'shown', mark_value: 1, profile: 'AK' },
    ],
    marker_version: 'v3',
  });
  return { attemptId: String(attempt._id), transcriptionId: String(read._id) };
}

const snapshot = async () => ({
  attempts: JSON.stringify(await db.Attempt.find({}).lean()),
  reads: JSON.stringify(await db.Transcription.find({}).lean()),
});

// ROUND_4 Task 3. The gate: a dispute never changes an attempt, a
// transcription, or mastery. Mastery is a fold over those two collections, so
// two byte-identical collections are the proof for the third.
describe('a mark dispute', () => {
  it('writes one row, and changes nothing it is about', async () => {
    const ids = await marked();
    const before = await snapshot();
    expect(await disputeMark({ ...ids, code: 'R1' })).toEqual({ ok: true });
    expect(await snapshot()).toEqual(before);
    const rows = await db.MarkDispute.find({}).lean<{ student_id: unknown; attempt_id: unknown; transcription_id: unknown; code: string; ts: Date }[]>();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ code: 'R1' });
    expect(String(rows[0].student_id)).toBe(String(STUDENT));
    expect(String(rows[0].attempt_id)).toBe(ids.attemptId);
    expect(String(rows[0].transcription_id)).toBe(ids.transcriptionId);
    expect(rows[0].ts).toBeInstanceOf(Date);
  });

  it('is once per row: a second tap is the same report', async () => {
    const ids = await marked();
    await disputeMark({ ...ids, code: 'R1' });
    expect(await disputeMark({ ...ids, code: 'R1' })).toEqual({ ok: true });
    expect(await db.MarkDispute.countDocuments({})).toBe(1);
  });

  it('refuses a row that was awarded, or does not exist', async () => {
    const ids = await marked();
    expect(await disputeMark({ ...ids, code: 'R2' })).toMatchObject({ error: /awarded/ });
    expect(await disputeMark({ ...ids, code: 'R9' })).toMatchObject({ error: /found/ });
    expect(await db.MarkDispute.countDocuments({})).toBe(0);
  });

  it('refuses another student’s marking', async () => {
    const ids = await marked(new mongoose.Types.ObjectId());
    expect(await disputeMark({ ...ids, code: 'R1' })).toMatchObject({ error: /found/ });
    expect(await db.MarkDispute.countDocuments({})).toBe(0);
  });

  it('refuses a read that is not the attempt’s', async () => {
    const a = await marked();
    const b = await marked();
    expect(await disputeMark({ attemptId: a.attemptId, transcriptionId: b.transcriptionId, code: 'R1' })).toMatchObject({ error: /found/ });
  });

  it('is append-only in shape: no resolution field, unique per row', () => {
    const paths = Object.keys(db.MarkDispute.schema.paths);
    expect(paths.some((p) => /resolv|status|outcome/.test(p))).toBe(false);
    const unique = (db.MarkDispute.schema.indexes() as [Record<string, number>, { unique?: boolean }][]).find(([, o]) => o?.unique);
    expect(unique?.[0]).toEqual({ transcription_id: 1, code: 1 });
  });
});
