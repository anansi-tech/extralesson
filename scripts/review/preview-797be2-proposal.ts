// Approved content repair. Preview by default; --apply writes only reviewed fields.
import 'dotenv/config';
import { isDeepStrictEqual } from 'node:util';
import mongoose from 'mongoose';
import { dbConnect, Question } from '@/lib/db';
import { deriveFinalAnswer, QuestionDraftZ } from '@/lib/validation/question';
import { authoredFields } from './preview-question-cleanup';
import original from './797be2-reviewed.json';
import { isEntryPoint } from '../entry';

export { original };
export const id = '6a854012e7fc40f429797be2';
export const descriptionPrompt = 'Describe a feature of the shape of the distribution and justify your description using the histogram.';
export const descriptionCriterion = 'Describes a feature of the distribution correctly and supports it with bar heights or frequencies from the histogram. Accept a single peak in the 40–50 kg class with frequency 12, or lack of exact symmetry supported by unequal corresponding bars. A qualified judgement of approximate symmetry is acceptable when supported by the central peak and decreasing frequencies towards both ends, with unequal corresponding bars acknowledged. Equal estimated mean and median alone, or an unsupported shape label, is insufficient.';
export const descriptionHint = 'Inspect the bar heights. Describe a peak or compare bars on opposite sides of the central class, and use the frequencies to support your description.';
export const verdictPrompt = 'Use your estimated median and semi-interquartile range to form the acceptable mass interval. Compare 58 kg with that interval and justify your decision.';
export const verdictCriterion = 'Uses their estimated median and semi-interquartile range to form the acceptable interval and makes the correct acceptance decision for 58 kg relative to that interval.';
export const verdictHint = 'Form an interval from your estimated median minus your semi-interquartile range to your estimated median plus your semi-interquartile range. Compare 58 kg with your limits and decide whether it is accepted.';

export function proposedQuestion() {
  const q = structuredClone(original);
  const c = q.parts.find(p => p.label === 'c')!;
  const description = c.slots.find(s => s.label === 'iii')!;
  Object.assign(description, {
    prompt: descriptionPrompt,
    answer: 'not exactly symmetrical: corresponding bars have unequal frequencies, 4 and 8 at the ends and 7 and 9 beside the central class',
    accept: [
      'single-peaked, with the highest frequency of 12 in the 40–50 kg class',
      'approximately symmetrical in overall shape, with a central peak and frequencies decreasing towards both ends, although corresponding frequencies 4 and 8, and 7 and 9, are unequal',
    ],
    depends_on: [],
    objective_id: 'M3.1.8',
  });
  c.statement = 'The median class is {}. The estimated median mass is {} kg. A description of the distribution, supported by the histogram, is: {}.';
  q.objective_ids = [...q.objective_ids, 'M3.1.8'];
  const r1 = q.rubric.find(r => r.code === 'R1')!;
  Object.assign(r1, { criterion: descriptionCriterion, template: descriptionCriterion, hint: descriptionHint });
  const d = q.parts.find(p => p.label === 'd')!;
  Reflect.deleteProperty(d.slots.find(s => s.label === 'i')!, 'answer_format');
  Object.assign(d.slots.find(s => s.label === 'iii')!, { prompt: verdictPrompt });
  const r3 = q.rubric.find(r => r.code === 'R3')!;
  Object.assign(r3, { criterion: verdictCriterion, template: verdictCriterion, hint: verdictHint });
  q.worked_solution = q.worked_solution.replace(
    'The estimated mean and estimated median are both $47.5$ kg, so the distribution is approximately symmetrical.',
    'The estimated mean and median are both $47.5$ kg, but this alone does not establish symmetry. The histogram is not exactly symmetrical: the frequencies in corresponding classes are $4$ and $8$, and $7$ and $9$. Another supported description is that it has a single peak in the $40\\le m<50$ class, whose frequency is $12$. A qualified description of approximate symmetry may refer to the central peak and decreasing frequencies towards both ends, while acknowledging the unequal corresponding bars.',
  );
  q.final_answer = deriveFinalAnswer(q.parts);
  return q;
}

export function prepare(q: typeof original) {
  const next = proposedQuestion();
  if (!isDeepStrictEqual(q, original) && !isDeepStrictEqual(q, next)) throw new Error('797be2 changed since review; re-review required.');
  QuestionDraftZ.parse(next);
  return { next, changed: !isDeepStrictEqual(q, next) };
}

async function main() {
  const apply = process.argv.includes('--apply');
  if (process.argv.slice(2).some(arg => arg !== '--apply')) throw new Error('Allowed flag: --apply. Without it, this is a read-only preview.');
  try {
    await dbConnect();
    const q = await Question.findById(id).select(`${authoredFields} -_id`).lean<typeof original>();
    if (!q) throw new Error('797be2 missing');
    const { next, changed } = prepare(q);
    console.log(JSON.stringify({ id, mode: apply ? 'apply' : 'preview', changed, marks: next.marks, R1: next.rubric.find(r => r.code === 'R1'), R3: next.rubric.find(r => r.code === 'R3'), parts: next.parts.filter(p => ['c', 'd'].includes(p.label)), final_answer: next.final_answer }, null, 2));
    if (!apply || !changed) return;
    const filter: Record<string, unknown> = { _id: id };
    for (const field of authoredFields.split(' ')) {
      const value = (q as Record<string, unknown>)[field];
      filter[field] = value === undefined ? { $exists: false } : { $eq: value };
    }
    const result = await Question.updateOne(filter, {
      $set: { objective_ids: next.objective_ids, parts: next.parts, rubric: next.rubric, worked_solution: next.worked_solution, final_answer: next.final_answer },
    });
    if (result.modifiedCount !== 1) throw new Error('797be2 changed concurrently; nothing applied. Re-review and preview again.');
    console.log('Applied approved 797be2 content only. Attempts unchanged.');
  } finally { await mongoose.disconnect(); }
}
if (isEntryPoint(import.meta.url)) main().catch(e => { console.error(e.message); process.exitCode = 1; });
