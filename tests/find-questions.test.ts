import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// The search an operator arrives at Review with, and the one filter ROUND_13
// Task 3 added to it: objective:<id>, so a coverage chip has somewhere to go.
let mongod: MongoMemoryServer;
let db: typeof import('@/lib/db');
let findQuestions: typeof import('@/lib/admin/find-questions').findQuestions;

async function question(over: Record<string, unknown>) {
  const { insertedId } = await db.Question.collection.insertOne({
    kind: 'mcq',
    stem: 'A shirt marked $80.',
    marks: 1,
    difficulty: 1,
    module: 1,
    options: ['a', 'b', 'c', 'd'],
    answer_key: 0,
    profile: 'CK',
    worked_solution: 'w',
    misconceptions: [],
    status: 'draft',
    ...over,
  } as never);
  return String(insertedId);
}

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  await mongoose.connect(process.env.MONGODB_URI);
  db = await import('@/lib/db');
  ({ findQuestions } = await import('@/lib/admin/find-questions'));
}, 60000);
afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});
beforeEach(async () => {
  await mongoose.connection.collection('questions').deleteMany({});
});

describe('objective:<id>', () => {
  it('finds the questions that are evidence for that objective, and only those', async () => {
    const wanted = await question({ objective_ids: ['M1.1.1'] });
    const alsoWanted = await question({ objective_ids: ['M2.4.2', 'M1.1.1'], status: 'approved' });
    await question({ objective_ids: ['M1.1.2'] });

    const found = (await findQuestions('objective:M1.1.1')).map((r) => r.id).sort();
    expect(found).toEqual([wanted, alsoWanted].sort());
  }, 30000);

  it('reads the declared field, so a chip and its search cannot disagree', async () => {
    // The objective is named in the stem but not declared: coverage would not
    // count it, so the search must not find it either.
    await question({ objective_ids: ['M3.1.1'], stem: 'Nothing to do with M1.1.1 despite saying it.' });

    expect(await findQuestions('objective:M1.1.1')).toEqual([]);
  }, 30000);

  it('is case-insensitive on the id, and matches nothing for an unknown one', async () => {
    const q = await question({ objective_ids: ['M1.1.1'] });

    expect((await findQuestions('objective:m1.1.1')).map((r) => r.id)).toEqual([q]);
    expect(await findQuestions('objective:M9.9.9')).toEqual([]);
  }, 30000);

  it('leaves the rest of the grammar alone', async () => {
    const q = await question({ objective_ids: ['M1.1.1'], stem: 'A shirt marked $80.' });

    // Free text still searches the prose it always did.
    expect((await findQuestions('shirt')).map((r) => r.id)).toEqual([q]);
    // And a bare objective id, with no prefix, is free text — not the filter.
    expect(await findQuestions('M1.1.1')).toEqual([]);
  }, 30000);
});
