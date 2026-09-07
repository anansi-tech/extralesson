import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Approval writes the hints, through the same generator and checks as a batch.
vi.mock('@/lib/auth/session', () => ({
  requireAdmin: async () => ({ student_id: 'x', email: 'admin@extralesson.invalid', role: 'admin' }),
}));
vi.mock('next/cache', () => ({ revalidatePath: () => {} }));
// The width fixture is a snapshot of the REAL bank: this test's bank must never be written over it.
const snapshotLongMath = vi.fn(async () => []);
vi.mock('@/lib/admin/long-math-fixture', () => ({ snapshotLongMath: () => snapshotLongMath() }));

let hintsByCode: Record<string, string> = {};
vi.mock('ai', () => ({
  generateObject: async () => ({ object: { hints: Object.entries(hintsByCode).map(([code, hint]) => ({ code, hint })) }, usage: {} }),
}));

let mongod: MongoMemoryServer;
let db: typeof import('@/lib/db');
let approveQuestion: typeof import('@/app/admin/review/actions').approveQuestion;

async function draft() {
  const { insertedId } = await db.Question.collection.insertOne({
    kind: 'structured',
    stem: 'Solve $3x = 15$.',
    marks: 3,
    module: 1,
    difficulty: 1,
    objective_ids: ['M1.1.1'],
    parts: [{ label: 'a', prompt: 'Solve.', marks: 3, slots: [{ label: 'i', answer: '5', response_mode: 'answer' }] }],
    rubric: [
      { code: 'AK1', slot_ref: 'a.i', part_label: 'a', criterion: 'Divides both sides by $3$', mark_value: 1, profile: 'AK' },
      { code: 'AK2', slot_ref: 'a.i', part_label: 'a', criterion: 'x = 5 CAO', mark_value: 1, profile: 'AK' },
      { code: 'R1', slot_ref: 'a.i', part_label: 'a', criterion: 'States the value of "their" $x$', mark_value: 1, profile: 'R' },
    ],
    worked_solution: 'x = 5',
    misconceptions: [],
    status: 'draft',
    gen_meta: { model: 'm', prompt_version: 'v', verified: true, ts: new Date() },
  });
  return String(insertedId);
}
const rows = async (id: string) => (await db.Question.findById(id).lean<{ status: string; rubric: { code: string; hint?: string }[] }>())!;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  await mongoose.connect(process.env.MONGODB_URI);
  db = await import('@/lib/db');
  ({ approveQuestion } = await import('@/app/admin/review/actions'));
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});
beforeEach(async () => {
  await db.Question.deleteMany({});
});

describe('approving a question writes its hints', () => {
  it('generates a hint for every method row, checks it, and writes it with the approval', async () => {
    hintsByCode = { AK1: 'Divide both sides of the equation by $3$.', R1: 'State the value you found for $x$.' };
    const id = await draft();
    snapshotLongMath.mockClear();
    const res = await approveQuestion(id);
    expect(res.ok).toBe(true);
    // The bank grew: the width fixture is taken again in the same action.
    expect(snapshotLongMath).toHaveBeenCalledTimes(1);
    const q = await rows(id);
    expect(q.status).toBe('approved');
    expect(q.rubric.map((r) => [r.code, r.hint])).toEqual([
      ['AK1', 'Divide both sides of the equation by $3$.'],
      ['AK2', undefined],
      ['R1', 'State the value you found for $x$.'],
    ]);
  });

  it('refuses to approve while any method row fails a check, and writes nothing', async () => {
    hintsByCode = { AK1: 'You divide both sides by $3$.', R1: 'State the value you found for $x$.' };
    const id = await draft();
    const res = await approveQuestion(id);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.problems).toEqual([{ code: 'AK1', hint: 'You divide both sides by $3$.', problem: 'begins with "You "' }]);
    const q = await rows(id);
    expect(q.status).toBe('draft');
    expect(q.rubric.every((r) => r.hint === undefined)).toBe(true);
  });

  it('leaves a row that already has a hint alone', async () => {
    hintsByCode = { R1: 'State the value you found for $x$.' };
    const id = await draft();
    await db.Question.updateOne({ _id: id, 'rubric.code': 'AK1' }, { $set: { 'rubric.$.hint': 'Kept.' } });
    const res = await approveQuestion(id);
    expect(res.ok).toBe(true);
    expect((await rows(id)).rubric.find((r) => r.code === 'AK1')?.hint).toBe('Kept.');
  });
});
