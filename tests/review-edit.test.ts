import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// EDITING AN APPROVED QUESTION (found on 6a82595879ca6c35515de177). The write
// filtered on status: 'draft', so every approved question was uneditable and
// the action said nothing about it — the editor closed as though it had saved.
vi.mock('@/lib/auth/session', () => ({ requireAdmin: async () => ({ role: 'admin' }) }));
vi.mock('next/cache', () => ({ revalidatePath: () => {} }));
// The gate's solve is a model call. Stubbed, and counted: a save that cannot
// land must not reach it.
const gate = vi.hoisted(() => vi.fn(async () => ({ ok: true }) as { ok: boolean; reason?: string }));
vi.mock('@/lib/generation/approve-gate', () => ({ approvalGate: gate }));

let mongod: MongoMemoryServer;
let db: typeof import('@/lib/db');
let actions: typeof import('@/app/admin/review/actions');

const STEM = 'Which option gives the sample mean?';
const EDITED = 'Which option gives the sample mean, in the right notation?';

/** The shape the editor hands back, which is what QuestionDraftZ validates. */
const edit = (stem: string) =>
  JSON.stringify({
    kind: 'mcq',
    objective_ids: ['M2.1.1'],
    module: 2,
    stem,
    archetype: 'direct-procedure',
    representation: 'prose',
    parts: [{ label: 'a', prompt: 'Select the correct option.', marks: 1, slots: [{ label: 'i', answer: 'x-bar = 6', response_mode: 'answer', rubric_codes: ['CK1'], objective_id: 'M2.1.1' }] }],
    options: ['x-bar = 6', 'mu = 6', 'x-bar = 24', 'mu = 24'],
    answer_key: 0,
    profile: 'CK',
    difficulty: 1,
    marks: 1,
    worked_solution: 'The sample mean is 6.',
    misconceptions: [],
  });

async function question(status: string) {
  const { insertedId } = await db.Question.collection.insertOne({
    kind: 'mcq',
    stem: STEM,
    marks: 1,
    difficulty: 1,
    module: 2,
    objective_ids: ['M2.1.1'],
    options: ['x-bar = 6', 'mu = 6', 'x-bar = 24', 'mu = 24'],
    answer_key: 0,
    profile: 'CK',
    worked_solution: 'The sample mean is 6.',
    misconceptions: [],
    status,
  } as never);
  return String(insertedId);
}
/** The row, or a failure naming it: a missing question is never the assertion. */
const read = async (id: string) => {
  const q = await db.Question.findById(id).select('stem status').lean<{ stem: string; status: string } | null>();
  if (!q) throw new Error(`no question ${id}`);
  return q;
};

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  await mongoose.connect(process.env.MONGODB_URI);
  db = await import('@/lib/db');
  actions = await import('@/app/admin/review/actions');
}, 60000);
afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});
beforeEach(async () => {
  gate.mockClear();
  gate.mockResolvedValue({ ok: true });
  await mongoose.connection.collection('questions').deleteMany({});
});

describe('saving an edit', () => {
  it('an approved question takes the edit and returns to draft', async () => {
    const id = await question('approved');

    expect(await actions.saveQuestionEdit(id, edit(EDITED))).toEqual({});

    const after = await read(id);
    expect(after.stem, 'the edit was written').toBe(EDITED);
    expect(after.status, 'and it faces review again').toBe('draft');
  }, 30000);

  it('a draft takes the edit and stays a draft, as it always did', async () => {
    const id = await question('draft');

    expect(await actions.saveQuestionEdit(id, edit(EDITED))).toEqual({});

    expect(await read(id)).toMatchObject({ stem: EDITED, status: 'draft' });
  }, 30000);

  it('a question that is gone is refused in words, and costs no model call', async () => {
    const id = await question('approved');
    await mongoose.connection.collection('questions').deleteMany({});

    const res = await actions.saveQuestionEdit(id, edit(EDITED));

    expect(res.error, 'the card is told').toMatch(/no longer in the bank/);
    expect(gate, 'the solve is never reached').not.toHaveBeenCalled();
  }, 30000);

  it('a refused gate is still reported, and still writes nothing', async () => {
    const id = await question('approved');
    gate.mockResolvedValue({ ok: false, reason: 'visual verify failed: nope' });

    expect(await actions.saveQuestionEdit(id, edit(EDITED))).toEqual({ error: 'visual verify failed: nope' });
    expect(await read(id)).toMatchObject({ stem: STEM, status: 'approved' });
  }, 30000);
});

// The same rule everywhere it can happen: an action whose filter did not match
// has written nothing, and saying nothing is what read as success.
describe('a write that matches nothing', () => {
  it('retiring something already retired says so', async () => {
    const id = await question('retired');
    expect((await actions.rejectQuestion(id)).error).toMatch(/already retired/);
  }, 30000);

  it('restoring something that is not retired says so', async () => {
    const id = await question('approved');
    expect((await actions.restoreQuestion(id)).error).toMatch(/not retired/);
    expect(await read(id)).toMatchObject({ status: 'approved' });
  }, 30000);

  it('approving something that is not a draft says so', async () => {
    const id = await question('approved');
    const res = await actions.approveQuestion(id);
    expect(res.ok).toBe(false);
    expect('error' in res ? res.error : '').toBeTruthy();
  }, 30000);

  it('and each of them lands when the question is in the state it expects', async () => {
    const retire = await question('approved');
    expect(await actions.rejectQuestion(retire)).toEqual({});
    expect(await read(retire)).toMatchObject({ status: 'retired' });

    expect(await actions.restoreQuestion(retire)).toEqual({});
    expect(await read(retire)).toMatchObject({ status: 'draft' });
  }, 30000);
});
