import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { CapturedImage, Transcription } from '@/lib/db';

let mongod: MongoMemoryServer;
let db: typeof import('@/lib/db');
let backfillReadKeys: typeof import('@/lib/db/backfill-read-keys').backfillReadKeys;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  await mongoose.connect(process.env.MONGODB_URI);
  db = await import('@/lib/db');
  ({ backfillReadKeys } = await import('@/lib/db/backfill-read-keys'));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

type Index = [Record<string, number>, { unique?: boolean } | undefined];
const indexes = (m: mongoose.Model<unknown>) => m.schema.indexes() as Index[];
const uniqueOn = (m: mongoose.Model<unknown>, keys: string[]) =>
  indexes(m).some(([k, o]) => o?.unique && Object.keys(k).join(',') === keys.join(','));

// ROUND_4 Task 1: a read exists before an attempt does, so it cannot be keyed
// on one. Both collections move to the question in the session, and the take.
describe('reads are keyed on the question in the session', () => {
  for (const [name, m] of [
    ['Transcription', Transcription],
    ['CapturedImage', CapturedImage],
  ] as const) {
    it(`${name}: unique on {session_id, question_index, take}, attempt_id optional`, () => {
      expect(uniqueOn(m, ['session_id', 'question_index', 'take'])).toBe(true);
      expect(uniqueOn(m, ['attempt_id', 'take'])).toBe(false);
      expect(m.schema.path('attempt_id').isRequired).toBeFalsy();
      expect(m.schema.path('session_id').isRequired).toBe(true);
      expect(m.schema.path('question_index').isRequired).toBe(true);
    });
  }

  it('stores what the reader answered and what the drawing showed', () => {
    const paths = Object.keys(Transcription.schema.paths);
    expect(paths).toContain('answers');
    expect(paths).toContain('construction');
    const answer = (Transcription.schema.path('answers') as unknown as { schema: { paths: object } }).schema;
    expect(Object.keys(answer.paths)).toEqual(expect.arrayContaining(['slot_label', 'text']));
    const drawing = (Transcription.schema.path('construction') as unknown as { schema: { paths: object } }).schema;
    expect(Object.keys(drawing.paths)).toEqual(expect.arrayContaining(['complete', 'missing', 'legible']));
  });

  it('keeps the image TTL', () => {
    expect(indexes(CapturedImage).some(([, o]) => 'expireAfterSeconds' in (o ?? {}))).toBe(true);
  });
});

describe('the backfill derives both keys from the row’s attempt', () => {
  it('keys every legacy row and retires the attempt-keyed unique index', async () => {
    const student = new mongoose.Types.ObjectId();
    const questions = [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()];
    const session = await db.PracticeSession.create({
      student_id: student,
      question_ids: questions,
      mode: 'adaptive',
      started_at: new Date(),
    });
    const attempt = await db.Attempt.create({
      student_id: student,
      question_id: questions[1],
      session_id: session._id,
      answer: 'x',
      rubric_awarded: [],
      profile_marks: { CK: 0, AK: 0, R: 0 },
      correct: false,
      duration_ms: 1,
    });

    // The pre-ROUND_4 collections: attempt-keyed, no session, and no index the
    // new schema declares — in production the rows exist before the deploy's
    // index build, which fails over them until the backfill has run.
    for (const m of [Transcription, CapturedImage]) {
      await m.collection.dropIndexes();
      await m.collection.createIndex({ attempt_id: 1, take: 1 }, { unique: true });
    }
    const legacy = { student_id: student, attempt_id: attempt._id, created_at: new Date() };
    await Transcription.collection.insertOne({
      ...legacy,
      question_id: questions[1],
      lines: [],
      legible: true,
      take: 1,
      reader_model: 'test',
    });
    await Transcription.collection.insertOne({
      ...legacy,
      question_id: questions[1],
      lines: [],
      legible: true,
      take: 2,
      reader_model: 'test',
    });
    await CapturedImage.collection.insertOne({
      ...legacy,
      take: 1,
      data: Buffer.from([1]),
      content_type: 'image/jpeg',
    });
    const orphan = { ...legacy, attempt_id: new mongoose.Types.ObjectId(), take: 1 };
    await CapturedImage.collection.insertOne({ ...orphan, data: Buffer.from([1]), content_type: 'image/jpeg' });

    const n = await backfillReadKeys();
    expect(n).toEqual({ Transcription: 2, CapturedImage: 1, unresolved: 1 });

    const reads = await Transcription.find({ attempt_id: attempt._id }).lean<
      { session_id: unknown; question_index: number; take: number }[]
    >();
    expect(reads.map((r) => [String(r.session_id), r.question_index, r.take])).toEqual([
      [String(session._id), 1, 1],
      [String(session._id), 1, 2],
    ]);
    const image = await CapturedImage.findOne({ attempt_id: attempt._id }).lean<{ question_index: number } | null>();
    expect(image?.question_index).toBe(1);

    for (const m of [Transcription, CapturedImage]) {
      const live = await m.collection.indexes();
      const named = (keys: string[]) => live.find((i) => Object.keys(i.key).join(',') === keys.join(','));
      expect(named(['attempt_id', 'take']), `${m.modelName} still has the old unique index`).toBeUndefined();
      expect(named(['session_id', 'question_index', 'take'])?.unique).toBe(true);
    }
  });

  it('the live index now refuses a second read of the same take, with or without an attempt', async () => {
    const session = new mongoose.Types.ObjectId();
    const base = {
      student_id: new mongoose.Types.ObjectId(),
      session_id: session,
      question_index: 0,
      question_id: new mongoose.Types.ObjectId(),
      lines: [],
      legible: true,
      take: 1,
      reader_model: 'test',
    };
    await Transcription.create(base);
    await expect(Transcription.create(base)).rejects.toThrow(/duplicate/);
    await expect(Transcription.create({ ...base, take: 2 })).resolves.toBeTruthy();
  });
});
