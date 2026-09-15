// Approved 12-question label batch. Preview by default; no grading changes.
import 'dotenv/config';
import mongoose from 'mongoose';
import { isDeepStrictEqual } from 'node:util';
import { dbConnect, Question } from '@/lib/db';
import { QuestionDraftZ } from '@/lib/validation/question';
import { authoredFields, batches, prepare as wording } from './preview-question-cleanup';
import { repairs as priority, prepare as priorityExemplar, type Content } from './repair-explanation-exemplars';
import { repairs as final, prepare as finalExemplar } from './repair-final-explanation-exemplars';
import { isEntryPoint } from '../entry';

export const repairs = [
  { id: '6a83d1c6c24c2d59f4d9c40e', ref: 'c.i', prompt: 'Coordinates of the new x-intercept' },
  { id: '6a83e24ef8a49010ad804aa6', ref: 'c.i', prompt: 'Property illustrated' },
  { id: '6a852665bd8b8cbd670ab933', ref: 'c.ii', prompt: 'Additional suitable beans needed (standard form)' },
  { id: '6a85508bc99a188733a9f51d', ref: 'd.i', prompt: 'Could the stated area result from measurement error alone?' },
  { id: '6a8554abc99a188733a9f570', ref: 'd.i', prompt: "Is the coach's claim correct?" },
  { id: '6a83b9cd11edd390f46a52bb', ref: 'd.i', prompt: 'Does the sample support the claim?' },
  { id: '6a841cd45222177bc0d16fe7', ref: 'd.i', prompt: 'Minimum number of complete 2 m lengths' },
  { id: '6a8522946d7444309a004444', ref: 'c.i', prompt: 'Figure number' },
  { id: '6a85272ebd8b8cbd670ab945', ref: 'c.i', prompt: 'Other time at the same height' },
  { id: '6a8529eeed771942b6d0dc8f', ref: 'b.i', prompt: 'Length BD' },
  { id: '6a8407a00676ebb26b9e8854', ref: 'c.i', prompt: 'Angle TAB' },
  { id: '6a8410e70676ebb26b9e8942', ref: 'b.i', prompt: 'Angle TAB' },
];
type Repair = typeof repairs[number];

export function reviewedBefore(repair: Repair): Content {
  const source = batches.missing.find(r => r.id === repair.id)!;
  let q = wording(source.expected, source).next as unknown as Content;
  const p = priority.find(r => r.id === repair.id);
  const f = final.find(r => r.id === repair.id);
  if (p) q = priorityExemplar(q, p).next;
  if (f) q = finalExemplar(q, f).next;
  return q;
}

export function prepare(q: Content, repair: Repair) {
  const before = reviewedBefore(repair);
  const next = structuredClone(before);
  const [part, slot] = repair.ref.split('.');
  const p = next.parts.findIndex(p => p.label === part);
  const s = next.parts[p].slots.findIndex(s => s.label === slot);
  Object.assign(next.parts[p].slots[s], { prompt: repair.prompt });
  if (!isDeepStrictEqual(q, before) && !isDeepStrictEqual(q, next)) throw new Error(`${repair.id}: changed since review; re-review required.`);
  QuestionDraftZ.parse(next);
  const filter = { _id: new mongoose.Types.ObjectId(repair.id) } as { _id: mongoose.Types.ObjectId } & Record<string, unknown>;
  for (const field of authoredFields.split(' ')) filter[field] = q[field] === undefined ? { $exists: false } : { $eq: q[field] };
  return { next, changed: !isDeepStrictEqual(q, next), filter,
    update: { $set: { [`parts.${p}.slots.${s}.prompt`]: repair.prompt }, $currentDate: { updated_at: true as const } } };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--apply')) throw new Error('Only --apply is supported; default is preview.');
  try {
    await dbConnect();
    const plans = [];
    // Validate all reviewed records before the first write.
    for (const repair of repairs) {
      const q = await Question.findById(repair.id).select(`${authoredFields} -_id`).lean<Content>();
      if (!q) throw new Error(`${repair.id}: missing question`);
      plans.push({ repair, ...prepare(q, repair) });
    }
    let applied = 0;
    for (const plan of plans) {
      console.log(JSON.stringify({ ...plan.repair, changed: plan.changed }));
      if (!args.includes('--apply') || !plan.changed) continue;
      // Preserve stored BSON order in the exact-content filter, without Mongoose recasting.
      const result = await Question.collection.updateOne(plan.filter, plan.update);
      if (result.modifiedCount !== 1) throw new Error(`Concurrent edit at ${plan.repair.id}; stopped after ${applied} writes. Earlier writes remain applied.`);
      applied++;
    }
    console.log(JSON.stringify({ reviewed: plans.length, changed: plans.filter(p => p.changed).length, applied }));
  } finally { await mongoose.disconnect(); }
}
if (isEntryPoint(import.meta.url)) main().catch(e => { console.error(e.message); process.exitCode = 1; });
