import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer;
let db: typeof import('@/lib/db');
let ResetToken: typeof import('@/lib/db/reset-token').ResetToken;
let deleteStudent: typeof import('@/lib/delete-student').deleteStudent;
let DELETED_BY_STUDENT_ID: readonly string[];
let KEPT_BUT_ANONYMISED: string;

const STUDENT = {
  email: 'delete-me@extralesson.invalid',
  name: 'Delete me',
  exam_sitting: 'may-june-2027',
  syllabus_mode: 'modular-2027',
  target_modules: [1, 2, 3],
};

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.ADMIN_EMAILS = 'boss@extralesson.invalid';
  await mongoose.connect(process.env.MONGODB_URI);
  db = await import('@/lib/db');
  ({ ResetToken } = await import('@/lib/db/reset-token'));
  ({ deleteStudent, DELETED_BY_STUDENT_ID, KEPT_BUT_ANONYMISED } = await import(
    '@/lib/delete-student'
  ));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

/** A student with one of everything hanging off them. */
async function seed() {
  const student = await db.Student.create(STUDENT);
  const question = new mongoose.Types.ObjectId();
  const session = await db.PracticeSession.create({
    student_id: student._id,
    question_ids: [question],
    mode: 'adaptive',
    started_at: new Date(),
  });
  const attempt = await db.Attempt.create({
    student_id: student._id,
    question_id: question,
    session_id: session._id,
    answer: 'x',
    rubric_awarded: [],
    profile_marks: { CK: 0, AK: 0, R: 0 },
    correct: false,
    duration_ms: 1,
  });
  await db.SessionDraft.create({ session_id: session._id, question_index: 0, answers: { 'a.i': '2' } });
  await db.Transcription.create({
    student_id: student._id,
    session_id: session._id,
    question_index: 0,
    attempt_id: attempt._id,
    question_id: question,
    lines: [{ text: 'working', confidence: 1 }],
    legible: true,
    reader_model: 'test',
  });
  await db.CapturedImage.create({
    student_id: student._id,
    session_id: session._id,
    question_index: 0,
    attempt_id: attempt._id,
    data: Buffer.from([1, 2, 3]),
    content_type: 'image/jpeg',
  });
  await ResetToken.create({ email: STUDENT.email, lookup: 'lookup-1', expires_at: new Date(Date.now() + 6e4) });
  await db.Payment.create({
    event_id: `evt_${Date.now()}`,
    email: STUDENT.email,
    amount_total: 4900,
    currency: 'usd',
    student_id: student._id,
  });
  return student;
}

beforeEach(async () => {
  for (const m of [db.Student, db.PracticeSession, db.Attempt, db.SessionDraft, db.Transcription, db.CapturedImage, db.Payment, ResetToken]) {
    await m.deleteMany({});
  }
});

describe('deleting a student', () => {
  it('takes everything attached, and says how much of each', async () => {
    await seed();
    const result = await deleteStudent(STUDENT.email);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.counts).toMatchObject({
      Attempt: 1,
      PracticeSession: 1,
      Transcription: 1,
      CapturedImage: 1,
      SessionDraft: 1,
      ResetToken: 1,
      Student: 1,
      PaymentAnonymised: 1,
    });
    for (const m of [db.Student, db.PracticeSession, db.Attempt, db.Transcription, db.CapturedImage, ResetToken]) {
      expect(await m.countDocuments({}), m.modelName).toBe(0);
    }
  });

  // THE ONE THAT GETS MISSED. SessionDraft carries no student_id at all, so a
  // sweep written from "which schemas name a student" leaves it behind.
  it('takes the session drafts, which are keyed by session and not by student', async () => {
    await seed();
    expect(await db.SessionDraft.countDocuments({})).toBe(1);
    await deleteStudent(STUDENT.email);
    expect(await db.SessionDraft.countDocuments({})).toBe(0);
  });

  it('keeps the payment and takes the person out of it', async () => {
    await seed();
    await deleteStudent(STUDENT.email);
    const payments = await db.Payment.find({}).lean<Record<string, unknown>[]>();
    expect(payments).toHaveLength(1); // the money is a financial record
    const [p] = payments;
    expect(p.amount_total).toBe(4900);
    expect(p.student_id).toBeUndefined();
    expect(p.email).toBeUndefined(); // the address names the person
    expect(p.resolved_at).toBeTruthy(); // so it does not reappear to be chased
    expect(String(p.note)).toMatch(/account deleted/i);
    expect(JSON.stringify(payments)).not.toContain(STUDENT.email);
  });

  it('refuses an address in ADMIN_EMAILS', async () => {
    await db.Student.create({ ...STUDENT, email: 'boss@extralesson.invalid' });
    const result = await deleteStudent('boss@extralesson.invalid');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toMatch(/ADMIN_EMAILS/);
    expect(await db.Student.countDocuments({})).toBe(1);
  });

  it('refuses an address with no account, rather than reporting a silent success', async () => {
    const result = await deleteStudent('nobody@extralesson.invalid');
    expect(result.ok).toBe(false);
  });

  it('leaves other students alone', async () => {
    await seed();
    const other = await db.Student.create({ ...STUDENT, email: 'keep-me@extralesson.invalid' });
    await db.Attempt.create({
      student_id: other._id,
      question_id: new mongoose.Types.ObjectId(),
      session_id: new mongoose.Types.ObjectId(),
      answer: 'y',
      rubric_awarded: [],
      profile_marks: { CK: 1, AK: 0, R: 0 },
      correct: true,
      duration_ms: 1,
    });
    await deleteStudent(STUDENT.email);
    expect(await db.Student.countDocuments({})).toBe(1);
    expect(await db.Attempt.countDocuments({})).toBe(1);
  });
});

// ANTI-DRIFT.
//
// A collection added later that carries a student_id, and is not named by the
// delete function, would silently orphan that student's rows — they would sit
// in the database after the account was erased, which is the failure this
// whole function exists to prevent. The list is read off the registered
// models rather than written down twice.
describe('no collection can be added and quietly missed', () => {
  it('names every schema that carries a student_id', () => {
    const handled = new Set<string>([...DELETED_BY_STUDENT_ID, KEPT_BUT_ANONYMISED]);
    const carrying = Object.values(mongoose.models)
      .filter((m) => m.schema.path('student_id'))
      .map((m) => m.modelName);

    expect(carrying.length, 'no models registered — the import did not run').toBeGreaterThan(0);
    const missed = carrying.filter((name) => !handled.has(name));
    expect(
      missed,
      `these carry a student_id and lib/delete-student.ts does not name them: ${missed.join(', ')}`,
    ).toEqual([]);
  });

  it('does not name a collection that has since stopped carrying one', () => {
    const registered = new Set(
      Object.values(mongoose.models)
        .filter((m) => m.schema.path('student_id'))
        .map((m) => m.modelName),
    );
    for (const name of [...DELETED_BY_STUDENT_ID, KEPT_BUT_ANONYMISED]) {
      expect(registered.has(name), `${name} is named but carries no student_id`).toBe(true);
    }
  });
});
