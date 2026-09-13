// Approved content-only repair. Preview by default; --apply changes AK4 only.
import 'dotenv/config';
import { isDeepStrictEqual } from 'node:util';
import mongoose from 'mongoose';
import { dbConnect, Question } from '@/lib/db';
import { QuestionDraftZ } from '@/lib/validation/question';
import original from './037e5d-reviewed.json';
import { isEntryPoint } from '../entry';

export { original };
export function correctedQuestion() {
  const q = structuredClone(original);
  const row = q.rubric.find(r => r.code === 'AK4')!;
  row.criterion = 'Expresses the correct value of $d$ in exact form, CAO $10(\\sqrt{3}+1)$.';
  row.template = row.criterion;
  row.for_format = true;
  return q;
}

type Content = typeof original & { updated_at?: unknown };
export function prepare(q: Content) {
  const next = correctedQuestion();
  const authored = (x: Content) => {
    const { _id, __v, created_at, updated_at, gen_meta, ...content } = x;
    return content;
  };
  QuestionDraftZ.parse(next);
  if (isDeepStrictEqual(authored(q), authored(next))) return { next, changed: false };
  if (!isDeepStrictEqual(authored(q), authored(original))) throw new Error('037e5d changed since review; re-review before applying.');
  return { next, changed: true };
}

async function main() {
  try {
    await dbConnect();
    const q = await Question.findById(original._id).lean<any>();
    if (!q) throw new Error('Question missing');
    const { next, changed } = prepare(q);
    console.log(JSON.stringify({ id: original._id, changed, marks: next.marks, AK4: next.rubric.find(r => r.code === 'AK4') }));
    if (!changed || !process.argv.includes('--apply')) return;
    const result = await Question.updateOne({ _id: q._id, status: 'approved', parts: q.parts,
      rubric: q.rubric, stem: q.stem, stimulus: q.stimulus, visual: q.visual,
    }, { $set: { rubric: next.rubric } });
    if (result.modifiedCount !== 1) throw new Error('Concurrent edit; nothing applied');
    console.log('Corrected AK4 only. Answers and historical attempts unchanged.');
  } finally { await mongoose.disconnect(); }
}
if (isEntryPoint(import.meta.url)) main().catch(e => { console.error(e.message); process.exitCode = 1; });
