import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// ROUND_13 Task 4. The syllabus graph and the allocations it is built from, to
// be read and nothing else: blueprints as cards, each module's topics as
// disclosures closed by default, one line per objective.
vi.mock('@/lib/auth/session', () => ({ requireAdmin: async () => ({ student_id: 'a', email: 'ops@example.com', role: 'admin' }) }));

let mongod: MongoMemoryServer;
let html = '';
let text = '';

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  await mongoose.connect(process.env.MONGODB_URI);
  const { dbConnect, Topic, Blueprint } = await import('@/lib/db');
  await dbConnect();
  await Topic.create({
    module: 1,
    code: 'M1-CA',
    title: 'Consumer arithmetic',
    order: 1,
    objectives: [
      { id: 'M1.2.1', text: 'calculate discount, sales tax, profit and loss' },
      { id: 'M1.2.2', text: 'construct a frequency table', notes: 'Discrete variables. Ungrouped data.' },
    ],
  });
  await Blueprint.create({
    paper: 'P1',
    module: 1,
    allocations: [{ topic_codes: ['M1-CA'], items: 8 }],
    profile_split: { CK: 30, AK: 45, R: 25 },
  });

  const { default: TopicsPage } = await import('@/app/admin/topics/page');
  html = renderToStaticMarkup(await TopicsPage());
  text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}, 120000);
afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

describe('the topics page', () => {
  it('says it is read only, once', () => {
    expect(text).toContain('Read only');
    expect((text.match(/Read only/gi) ?? []), 'said once, not on every section').toHaveLength(1);
  });

  it('draws the blueprints as cards', () => {
    expect(text).toContain('Blueprints (official allocations)');
    expect(text).toContain('P1 · Module 1');
    expect(text).toContain('CK 30 / AK 45 / R 25');
    expect(text).toContain('8 items');
  });

  it('holds each module’s topics as disclosures, closed by default', () => {
    expect(html).toMatch(/<details[^>]*>/);
    expect(html, 'nothing is open before it is asked for').not.toMatch(/<details[^>]*\sopen/);
    expect(text).toContain('Module 1');
    expect(text).toContain('M1-CA');
    expect(text).toContain('2 objectives');
  });

  it('gives one line per objective, note and all', () => {
    const items = [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((m) => m[1]);
    const objective = items.find((i) => i.includes('M1.2.2'))!;
    expect(objective).toContain('construct a frequency table');
    // The note belongs to the objective, so it is on the objective's line.
    expect(objective).toContain('Discrete variables. Ungrouped data.');
    expect(objective, 'not a second line under it').not.toMatch(/<div/);
  });

  it('holds nothing else — no control, no field, no action', () => {
    expect(html).not.toMatch(/<form|<input|<select|<textarea|<button/);
  });
});
