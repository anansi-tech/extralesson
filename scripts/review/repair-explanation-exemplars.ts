// Approved evidence-alignment repair. Preview by default; --apply writes only reviewed exemplar fields.
import 'dotenv/config';
import { isDeepStrictEqual } from 'node:util';
import mongoose from 'mongoose';
import { dbConnect, Question } from '@/lib/db';
import { deriveFinalAnswer, QuestionDraftZ } from '@/lib/validation/question';
import { authoredFields } from './preview-question-cleanup';
import { isEntryPoint } from '../entry';

type Change = { ref: string; answer: string; accept: string[]; before: { answer: string; accept: string[] } };
type Repair = { id: string; changes: Change[] };

export const repairs: Repair[] = [
  {
    id: '6a83de1af8a49010ad804a29',
    changes: [
      {
        ref: 'd.image_claim',
        before: { answer: 'Incorrect; $x=-1$ also has image $-5$ because it is the same distance from $x=1$ as $x=3$.', accept: ['No; $x=-1$ also maps to $-5$, by symmetry about $x=1$', 'Incorrect; $gf(-1)=-5$'] },
        answer: 'Incorrect; by symmetry about $x=1$, $x=-1$ is the same distance from the axis as $x=3$, so it also has image $-5$.',
        accept: ['No; $x=-1$ also maps to $-5$ by symmetry about $x=1$.'],
      },
      {
        ref: 'd.root_claim',
        before: { answer: 'Incorrect; the roots are $-2$ and $4$, since $x^2-2x-8=(x+2)(x-4)$ and the graph crosses the $x$-axis twice.', accept: ['No; $x=-2$ and $x=4$', 'Incorrect; $gf(x)$ has two roots, $-2$ and $4$'] },
        answer: 'Incorrect; $gf(x)=0$ gives $x^2-2x-8=(x+2)(x-4)=0$, so the roots are $-2$ and $4$, and the graph has two $x$-intercepts.',
        accept: ['No; solving $gf(x)=0$ gives roots $-2$ and $4$, which are the graph’s two $x$-intercepts.'],
      },
    ],
  },
  {
    id: '6a83e649f8a49010ad804b34',
    changes: [{
      ref: 'c.decision',
      before: { answer: 'No', accept: ['No, because \\$1 205.86 is less than \\$1 210', 'No; he is \\$4.14 short'] },
      answer: 'No; $\\$1\,205.86$ is less than $\\$1\,210$.',
      accept: ['No; Kemar retains $\\$1\,205.86$, so he is $\\$4.14$ short of $\\$1\,210$.'],
    }],
  },
  {
    id: '6a840a950676ebb26b9e88a2',
    changes: [{
      ref: 'd.ii',
      before: { answer: '7.4 minutes is a sample statistic which estimates, but does not give the exact value of, the population parameter.', accept: ['The sample mean is a statistic and only estimates the population mean.', 'The actual mean for all 180 customers is a population parameter, so it cannot be known exactly from the sample.'] },
      answer: 'The 7.4-minute sample mean is a sample statistic; the mean for all 180 customers is the population parameter, and the sample statistic estimates it rather than giving its exact value.',
      accept: ['The sample mean is a statistic, while the actual mean for all 180 customers is a population parameter that the sample can only estimate.'],
    }],
  },
  {
    id: '6a8554abc99a188733a9f570',
    changes: [{
      ref: 'd.ii',
      before: { answer: '$3 \\times 2 = 6$', accept: ['There are $3$ choices for the two netball-only players and $2$ choices for the player who plays both sports, giving $6$ teams.'] },
      answer: 'The netball-only pairs are $\\{A,D\\}$, $\\{A,K\\}$ and $\\{D,K\\}$, and $R$ or $S$ can be the player who plays both sports, so $3\\times2=6$ teams.',
      accept: ['There are three netball-only pairs and two choices, $R$ and $S$, for the player who plays both sports; therefore $3\\times2=6$ teams.'],
    }],
  },
  {
    id: '6a8797946af0b4c2ed48641b',
    changes: [{
      ref: 'd.reason',
      before: { answer: '$30\\% < 33\\frac{1}{3}\\%$', accept: ['More than 30 minutes is 30%, which is less than one third', '$30\\% < \\frac{1}{3}$'] },
      answer: '$100\\%-70\\%=30\\%$ took more than 30 minutes, and $30\\%<33\\frac{1}{3}\\%$, so fewer than one third did so.',
      accept: ['The complement of $70\\%$ is $30\\%$, and $30\\%$ is less than one third.'],
    }],
  },
];

export type Content = {
  marks: number;
  objective_ids: string[];
  rubric: unknown;
  parts: { label: string; slots: { label: string; answer: string; accept?: string[]; response_mode?: string }[] }[];
  final_answer: string;
  updated_at?: unknown;
} & Record<string, unknown>;

export function prepare(q: Content, repair: Repair) {
  const next = structuredClone(q);
  for (const change of repair.changes) {
    const [partLabel, slotLabel] = change.ref.split('.');
    const slot = next.parts.find(part => part.label === partLabel)?.slots.find(slot => slot.label === slotLabel);
    if (!slot) {
      throw new Error(`${repair.id}: ${change.ref} changed since review; re-review required.`);
    }
    const actual = { answer: slot.answer, accept: slot.accept ?? [] };
    const after = { answer: change.answer, accept: change.accept };
    if (isDeepStrictEqual(actual, after)) continue;
    if (!isDeepStrictEqual(actual, change.before)) throw new Error(`${repair.id}: ${change.ref} changed since review; re-review required.`);
    Object.assign(slot, after);
  }
  next.final_answer = deriveFinalAnswer(next.parts);
  QuestionDraftZ.parse(next);
  return { next, changed: !isDeepStrictEqual(q, next) };
}

async function main() {
  const apply = process.argv.includes('--apply');
  if (process.argv.slice(2).some(arg => arg !== '--apply')) throw new Error('Allowed flag: --apply. Without it, this is a read-only preview.');
  const plans: { q: Content; repair: Repair; next: Content; changed: boolean }[] = [];
  try {
    await dbConnect();
    for (const repair of repairs) {
      const q = await Question.findById(repair.id).select(`${authoredFields} updated_at -_id`).lean<Content>();
      if (!q) throw new Error(`${repair.id}: missing question; no writes started.`);
      plans.push({ q, repair, ...prepare(q, repair) });
    }
    for (const plan of plans) {
      console.log(JSON.stringify({ id: plan.repair.id, changed: plan.changed, refs: plan.repair.changes.map(change => change.ref) }));
      if (!apply || !plan.changed) continue;
      const filter = { _id: plan.repair.id, updated_at: { $eq: plan.q.updated_at } };
      const result = await Question.updateOne(filter, { $set: { parts: plan.next.parts, final_answer: plan.next.final_answer } });
      if (result.modifiedCount !== 1) throw new Error(`${plan.repair.id}: concurrent edit; stopped. Re-review and preview again before continuing.`);
    }
    console.log(JSON.stringify({ mode: apply ? 'apply' : 'preview', reviewed: plans.length, changed: plans.filter(plan => plan.changed).length, applied: apply ? plans.filter(plan => plan.changed).length : 0 }));
  } finally { await mongoose.disconnect(); }
}
if (isEntryPoint(import.meta.url)) main().catch(error => { console.error(error.message); process.exitCode = 1; });
