// Approved wording only. Preview by default; bank application is a separate step.
import 'dotenv/config';
import mongoose from 'mongoose';
import { dbConnect, Question } from '@/lib/db';
import { authoredFields, batches, prepare, type Content, type Repair } from './preview-question-cleanup';
import { isEntryPoint } from '../entry';

export function writePlan(q: Content, repair: Repair) {
  const result = prepare(q, repair);
  const filter: Record<string, unknown> = { _id: repair.id };
  for (const field of authoredFields.split(' ')) {
    const value = (q as Record<string, unknown>)[field];
    filter[field] = value === undefined ? { $exists: false } : { $eq: value };
  }
  const set: Record<string, string> = {};
  for (const { ref, prompt } of repair.prompts) {
    const [label, slot] = ref.split('.');
    const partIndex = q.parts.findIndex(p => p.label === label);
    const slotIndex = q.parts[partIndex].slots.findIndex(s => s.label === slot);
    set[`parts.${partIndex}.slots.${slotIndex}.prompt`] = prompt;
  }
  for (const [label, statement] of Object.entries(repair.statements)) {
    set[`parts.${q.parts.findIndex(p => p.label === label)}.statement`] = statement;
  }
  return { id: repair.id, changed: result.changed, filter, update: { $set: set } };
}

type Store = {
  read: (id: string) => Promise<Content | null>;
  update: (plan: ReturnType<typeof writePlan>) => Promise<number>;
};

export async function run(store: Store, apply = false, repairs: Repair[] = [...batches.held, ...batches.missing]) {
  const plans = [];
  for (const repair of repairs) {
    const q = await store.read(repair.id);
    if (!q) throw new Error(`${repair.id}: question missing; no writes started`);
    plans.push(writePlan(q, repair));
  }
  let applied = 0;
  for (const plan of plans) {
    if (!apply || !plan.changed) continue;
    if (await store.update(plan) !== 1) {
      throw new Error(`${plan.id}: concurrent edit; stopped after ${applied} writes. Re-review the changed record and preview again. Earlier writes remain applied.`);
    }
    applied++;
  }
  return { reviewed: plans.length, changed: plans.filter(p => p.changed).length, applied };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--apply')) throw new Error('Allowed flag: --apply. Without it, this is a read-only preview.');
  try {
    await dbConnect();
    const result = await run({
      read: id => Question.findById(id).select(`${authoredFields} -_id`).lean<Content>().exec(),
      update: async plan => (await Question.updateOne(plan.filter, plan.update)).modifiedCount,
    }, args.includes('--apply'));
    console.log(JSON.stringify({ mode: args.includes('--apply') ? 'apply' : 'preview', ...result }));
  } finally { await mongoose.disconnect(); }
}
if (isEntryPoint(import.meta.url)) main().catch(e => { console.error(e.message); process.exitCode = 1; });
