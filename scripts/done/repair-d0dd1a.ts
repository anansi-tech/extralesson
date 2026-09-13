// Approved content correction; preview by default. No historical grade writes.
import 'dotenv/config';
import mongoose from 'mongoose';
import { dbConnect, Question } from '@/lib/db';
import { QuestionDraftZ } from '@/lib/validation/question';
import original from './d0dd1a-reviewed.json';
import { isEntryPoint } from '../entry';

export { original };
export function correctedQuestion() {
  const q = structuredClone(original);
  const part = q.parts.find(p => p.label === 'd')!;
  for (const slot of part.slots) {
    if (['lower_quartile', 'upper_quartile'].includes(slot.label) && 'answer_format' in slot) delete slot.answer_format;
    if (slot.label === 'claim') slot.response_mode = 'answer';
  }
  const row = q.rubric.find(r => r.code === 'R3')!;
  row.criterion = 'Expresses the interquartile range to 1 decimal place';
  row.template = row.criterion;
  row.hint = 'Write the interquartile range to one decimal place, using unrounded quartile estimates in the subtraction.';
  const slip = q.misconceptions.find(m => m.trigger === '9.4')!;
  slip.name = 'Rounded before subtracting';
  slip.remediation = 'Subtracting the rounded quartiles, 28.3 - 18.9, gives 9.4. Keep the unrounded quartile estimates in the subtraction, then round the interquartile range to one decimal place.';
  return q;
}

const fields = ['parts', 'rubric', 'misconceptions'] as const;
export function prepare(q: typeof original) {
  const next = correctedQuestion();
  // Metadata unrelated to content may change; all authored fields must agree.
  const authored = (x: typeof original) => {
    const { _id, __v, created_at, gen_meta, ...content } = x;
    return JSON.stringify(content);
  };
  if (authored(q) === authored(next)) return { next, changed: false };
  if (authored(q) !== authored(original)) throw new Error('d0dd1a changed since review; re-review before applying.');
  QuestionDraftZ.parse(next);
  return { next, changed: true };
}

async function main() {
  try {
    await dbConnect();
    const q = await Question.findById(original._id).lean<any>();
    if (!q) throw new Error('Question missing');
    const { next, changed } = prepare(q);
    console.log(JSON.stringify({ id: original._id, changed, marks: next.marks, roundingMark: 'IQR only', claim: 'answer', feedback: 'rounding before subtraction' }));
    if (!changed || !process.argv.includes('--apply')) return;
    const result = await Question.updateOne({ _id: q._id, status: 'approved', parts: q.parts, rubric: q.rubric,
      misconceptions: q.misconceptions, stem: q.stem, stimulus: q.stimulus, visual: q.visual,
    }, { $set: Object.fromEntries(fields.map(key => [key, next[key]])) });
    if (result.modifiedCount !== 1) throw new Error('Concurrent edit; nothing applied');
    console.log('Applied content correction. No historical attempts changed.');
  } finally { await mongoose.disconnect(); }
}
if (isEntryPoint(import.meta.url)) main().catch(e => { console.error(e.message); process.exitCode = 1; });
