import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

/**
 * AN EDIT TRAIL, BECAUSE THERE WAS NONE. Five questions were found storing a
 * shape their own recipe contradicted, and nothing recorded when a row was last
 * written — so whether an editor or a script had done it could not be settled.
 */
let mongod: MongoMemoryServer;
let db: typeof import('@/lib/db');

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  db = await import('@/lib/db');
  await db.dbConnect();
}, 60_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

const question = () => ({
  kind: 'structured', objective_ids: ['M1.1.1'], module: 1,
  stem: 'A shirt is reduced. Find the new price.', archetype: 'direct-procedure',
  representation: 'prose', difficulty: 1, marks: 4, shape: 'paper',
  parts: [{ label: 'a', prompt: 'Find the price.', marks: 4, slots: [{ label: 'i', answer: '68' }] }],
  rubric: [{ code: 'AK1', profile: 'AK', criterion: 'Computes it', mark_value: 4, slot_ref: 'a.i', part_label: 'a' }],
  final_answer: '68', worked_solution: 'It is 68.', status: 'draft',
  gen_meta: { model: 'm', prompt_version: 'v1', verified: true, ts: new Date() },
});

describe('a question records when it was written', () => {
  it('stamps created_at and updated_at on insert', async () => {
    const q = await db.Question.create(question());
    const raw = await db.Question.collection.findOne({ _id: q._id });

    expect(raw?.created_at, 'created_at').toBeInstanceOf(Date);
    expect(raw?.updated_at, 'updated_at').toBeInstanceOf(Date);
  });

  it('moves updated_at when the row is edited, and leaves created_at alone', async () => {
    const q = await db.Question.create(question());
    const before = await db.Question.collection.findOne({ _id: q._id });
    await new Promise((r) => setTimeout(r, 10));

    await db.Question.updateOne({ _id: q._id }, { $set: { shape: 'drill' } });
    const after = await db.Question.collection.findOne({ _id: q._id });

    expect(new Date(after!.updated_at as Date).getTime()).toBeGreaterThan(
      new Date(before!.updated_at as Date).getTime(),
    );
    expect(new Date(after!.created_at as Date).getTime()).toBe(
      new Date(before!.created_at as Date).getTime(),
    );
  });

  it('the fields are declared, so nothing strips them', () => {
    expect(Object.keys(db.Question.schema.paths)).toEqual(
      expect.arrayContaining(['created_at', 'updated_at']),
    );
  });
});
