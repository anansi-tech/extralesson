import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// The width fixture is a snapshot of the approved bank: taken on approval and
// by hand, written only where there is a checkout to write into.
let mongod: MongoMemoryServer;
let Question: typeof import('@/lib/db').Question;
let snapshotLongMath: typeof import('@/lib/admin/long-math-fixture').snapshotLongMath;
const dir = mkdtempSync(join(tmpdir(), 'long-math-'));

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  await mongoose.connect(process.env.MONGODB_URI);
  ({ Question } = await import('@/lib/db'));
  ({ snapshotLongMath } = await import('@/lib/admin/long-math-fixture'));
}, 120000);
afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
  rmSync(dir, { recursive: true, force: true });
});

const base = { kind: 'structured', marks: 2, module: 1, difficulty: 1, objective_ids: ['M1.1.1'], misconceptions: [], gen_meta: { model: 'm', prompt_version: 'v', verified: true, ts: new Date() } };

describe('the width fixture', () => {
  it('holds the longest solutions and every set, from approved questions only', async () => {
    await Question.collection.insertMany([
      { ...base, stem: 'Short.', worked_solution: 'x = 5', status: 'approved' },
      { ...base, stem: 'Long.', worked_solution: 'a'.repeat(400), status: 'approved' },
      { ...base, stem: 'List the sample space $S=\\{(1,H),(1,T),(2,H),(2,T)\\}$.', worked_solution: 'Eight outcomes.', status: 'approved' },
      { ...base, stem: 'Draft.', worked_solution: 'b'.repeat(900), status: 'draft' },
    ]);
    const path = join(dir, 'long-math.json');
    const out = await snapshotLongMath(path);
    expect(out!.map((o) => [o.stem, o.why])).toEqual([
      ['Long.', 'longest solution'],
      ['List the sample space $S=\\{(1,H),(1,T),(2,H),(2,T)\\}$.', 'longest solution'],
      ['Short.', 'longest solution'],
    ]);
    expect(JSON.parse(readFileSync(path, 'utf8'))).toEqual(out);
  });
  it('writes nothing where there is no fixture directory', async () => {
    const path = join(dir, 'nowhere', 'long-math.json');
    expect(await snapshotLongMath(path)).toBeNull();
    expect(existsSync(path)).toBe(false);
  });
});
