// Approved evidence-alignment repair. Preview by default; --apply writes only reviewed exemplar fields.
import 'dotenv/config';
import { isDeepStrictEqual } from 'node:util';
import mongoose from 'mongoose';
import { dbConnect, Question } from '@/lib/db';
import { deriveFinalAnswer, QuestionDraftZ } from '@/lib/validation/question';
import { authoredFields } from './preview-question-cleanup';
import { isEntryPoint } from '../entry';
import { assertReviewedContext } from './exemplar-review-guard';

type Change = { ref: string; answer: string; accept: string[]; before: { answer: string; accept: string[] }; previous?: { answer: string; accept: string[] } };
type Repair = { id: string; changes: Change[] };

// These slots remain photo-assessed. The examples show every row attached to the slot;
// they do not become phrase-match grading rules.
export const repairs: Repair[] = [
  {
    id: '6a83c18fc24c2d59f4d9c254',
    changes: [
      {
        ref: 'b.ii',
        before: { answer: 'magnitude and direction', accept: ['length and direction', 'size and direction'] },
        answer: 'Equal vectors have the same magnitude and direction. Since $\\vec{AB}=\\vec{DC}=2\\mathbf{a}+2\\mathbf{b}$, the vectors are equal.',
        accept: ['Equal vectors have the same length and direction; $\\vec{AB}=\\vec{DC}=2\\mathbf{a}+2\\mathbf{b}$.'],
      },
      {
        ref: 'c.iii',
        before: { answer: 'both pairs of opposite sides are equal and parallel', accept: ['$\\vec{AB}=\\vec{DC}$ and $\\vec{AD}=\\vec{BC}$', 'the opposite sides are equal vectors', 'both pairs of opposite sides have the same magnitude and direction'] },
        answer: '$\\vec{AB}=\\vec{DC}=2\\mathbf{a}+2\\mathbf{b}$ and $\\vec{AD}=\\vec{BC}=2\\mathbf{b}-\\mathbf{a}$, so both pairs of opposite sides are equal and parallel. Therefore $ABCD$ is a parallelogram.',
        accept: ['Both pairs of opposite sides are equal vectors: $\\vec{AB}=\\vec{DC}$ and $\\vec{AD}=\\vec{BC}$; therefore $ABCD$ is a parallelogram.'],
      },
    ],
  },
  {
    id: '6a8402d10676ebb26b9e87e7',
    changes: [{
      ref: 'c.ii',
      before: { answer: 'equal and parallel', accept: ['parallel and equal', 'equal in length and parallel'] },
      answer: '$\\overrightarrow{AB}=\\overrightarrow{CD}=\\begin{pmatrix}6\\\\3\\end{pmatrix}$, so the opposite sides are equal and parallel.',
      accept: ['$\\overrightarrow{AB}$ and $\\overrightarrow{CD}$ have the same displacement, $\\begin{pmatrix}6\\\\3\\end{pmatrix}$, so they are equal and parallel.'],
    }],
  },
  {
    id: '6a8420e75222177bc0d1704a',
    changes: [{
      ref: 'c.ii',
      before: { answer: 'The angle between a tangent and a chord equals the angle in the alternate segment.', accept: ['Angle between tangent DA and chord AB equals angle ACB in the alternate segment.', 'Tangent-chord theorem'] },
      answer: 'By the tangent-chord theorem, the angle between tangent $DA$ and chord $AB$ equals $\\angle ACB$ in the alternate segment.',
      accept: ['The tangent-chord theorem gives $\\angle DAB=\\angle ACB$, because they stand on chord $AB$ in alternate segments.'],
    }],
  },
  {
    id: '6a855228c99a188733a9f53f',
    changes: [{
      ref: 'd.ii',
      before: { answer: '$\\vec{BD}=\\vec{AB}=\\binom{4}{3}$', accept: ['$\\vec{BD}$ is equal to $\\vec{AB}$', '$BD$ is parallel to $AB$ and points in the same direction'] },
      answer: 'Using $k=8$, $\\vec{BD}=\\binom{9-5}{8-5}=\\binom{4}{3}=\\vec{AB}$, so $BD$ has the same direction as $AB$.',
      accept: ['$k=8$ gives $\\vec{BD}=\\binom{4}{3}$, the same vector as $\\vec{AB}$, so the bearings are equal.'],
    }],
  },
  {
    id: '6a862dcc1ab164e441c75c61',
    changes: [{
      ref: 'd.reason',
      before: { answer: '2 trays is the most frequently required number', accept: ['2 occurs most often', '2 trays occurs most often', 'it gives the most frequently required number of trays'] },
      answer: '$2$ trays is the mode: it occurs most often, so it is the number of trays required most frequently.',
      accept: ['The value $2$ occurs most often, so $2$ trays is the most frequently required number.'],
    }],
  },
  {
    id: '6a83e3e5f8a49010ad804ada',
    changes: [{
      ref: 'd.reason',
      before: { answer: '$\\pi^2<10$, so $\\frac{90}{\\pi^2}>9$', accept: ['$\\pi^2<10$, therefore the pendulum length is greater than $9\\text{ m}$', '$\\frac{90}{\\pi^2}>9$'] },
      answer: 'Since $\\pi^2<10$, $\\frac{90}{\\pi^2}>\\frac{90}{10}=9$, so the pendulum needs more than the $9\\text{ m}$ cord.',
      accept: ['$\\pi^2<10$ makes $\\frac{90}{\\pi^2}>9$, so the $9\\text{ m}$ cord is not long enough.'],
    }],
  },
  {
    id: '6a83f9f69aba6d73cb8211a2',
    changes: [{
      ref: 'b.reason',
      before: { answer: 'a random sample of 12 balls', accept: ['a sample of 12 balls', 'the sample of 12 balls', 'sample data'] },
      answer: 'It was calculated from a random sample of $12$ balls, rather than from all of the balls.',
      accept: ['The range uses data from a randomly selected sample of $12$ balls, not the whole population.'],
    }],
  },
  {
    id: '6a83fb989aba6d73cb8211c1',
    changes: [{
      ref: 'c.ii',
      before: { answer: 'both are horizontal', accept: ['they have the same gradient', 'they do not meet'] },
      answer: 'Both $OA$ and $BC$ are horizontal, so they have the same gradient.',
      accept: ['$OA$ and $BC$ have the same gradient, since both are horizontal.'],
    }],
  },
  {
    id: '6a862d781ab164e441c75c59',
    changes: [{
      ref: 'd.reason',
      before: { answer: '$18$ is an extreme value', accept: ['there is an extreme value of 18', '18 is an outlier', 'the value 18 would affect the mean'] },
      answer: '$18$ is an extreme value that would affect the mean, so the median is the more appropriate average.',
      accept: ['Because $18$ is an extreme value that would distort the mean, use the median.'],
    }],
  },
  {
    id: '6a83de58f8a49010ad804a31',
    changes: [{
      ref: 'd.reason',
      before: { answer: '2 vouchers for 20 customers', accept: ['$2<20$', 'There are 2 unused vouchers and 20 customers', '2 unused vouchers; 20 customers'] },
      answer: '$4\\times8-30=2$ vouchers are unused, and $2<20$ customers bought neither item.',
      accept: ['There are $32-30=2$ unused vouchers, which is fewer than the $20$ customers who bought neither item.'],
    }],
  },
  {
    id: '6a84032d0676ebb26b9e87f7',
    changes: [{
      ref: 'd.reason',
      before: { answer: 'The range in 2025 is 12, which is less than the range in 2026, 18.', accept: ['2025 has the smaller range: 12 compared with 18 in 2026', 'The 2025 range is 12 and the 2026 range is 18, so 2025 is more consistent'] },
      answer: 'For 2025, $84-72=12$; for 2026, $88-70=18$. Since $12<18$, attendance was more consistent in 2025.',
      accept: ['$84-72=12$ and $88-70=18$; the smaller range shows that 2025 was more consistent.'],
    }],
  },
  {
    id: '6a852665bd8b8cbd670ab933',
    changes: [{
      ref: 'c.i',
      before: { answer: 'No, $88\\% < 90\\%$', accept: ['No, 88% is less than 90%', 'No'] },
      answer: 'No; $88\\%<90\\%$, so the harvest will not be accepted.',
      accept: ['The harvest is not accepted because its $88\\%$ suitable beans is below the $90\\%$ requirement.'],
    }],
  },
  {
    id: '6a867414274ccc2bbe037df1',
    changes: [{
      ref: 'd.reason',
      before: { answer: 'It has the largest sector and was selected by the greatest number of students.', accept: ['It has the largest sector.', 'It has the greatest frequency.', 'It was chosen by the most students.'] },
      previous: {
        answer: 'Mango juice has the greatest sector angle, $120°$, so it was selected by the greatest number of students and is the mode.',
        accept: ['Mango juice has the largest sector, so it has the greatest frequency and is the modal drink.'],
      },
      answer: 'Using $x=60$, Mango juice has angle $2x=120°$, Sorrel has $x+30=90°$, Coconut water has $90°$, and Mauby has $x=60°$. Since $120°$ exceeds $90°$, $90°$ and $60°$, Mango juice has the greatest frequency and is the mode.',
      accept: ['With $x=60$, the sector angles are Mango juice $120°$, Sorrel $90°$, Coconut water $90°$ and Mauby $60°$. Mango juice has the greatest sector angle, so it was selected by the most students and is the modal drink.'],
    }],
  },
  {
    id: '6a867c3fb944c6fb77c0c0ed',
    changes: [{
      ref: 'b.mirror_line',
      before: { answer: 'the $x$-axis', accept: ['$y=0$', 'line $y=0$'] },
      answer: 'The $x$-axis, $y=0$, because corresponding vertices are equal distances above and below it.',
      accept: ['$y=0$, since the corresponding vertices have opposite $y$-coordinates and the same $x$-coordinates.'],
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
  assertReviewedContext(q, repair);
  const next = structuredClone(q);
  for (const change of repair.changes) {
    const [partLabel, slotLabel] = change.ref.split('.');
    const slot = next.parts.find(part => part.label === partLabel)?.slots.find(slot => slot.label === slotLabel);
    if (!slot) throw new Error(`${repair.id}: ${change.ref} changed since review; re-review required.`);
    const actual = { answer: slot.answer, accept: slot.accept ?? [] };
    const after = { answer: change.answer, accept: change.accept };
    if (isDeepStrictEqual(actual, after)) continue;
    if (!isDeepStrictEqual(actual, change.before) && !isDeepStrictEqual(actual, change.previous)) throw new Error(`${repair.id}: ${change.ref} changed since review; re-review required.`);
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
      const result = await Question.updateOne({ _id: plan.repair.id, updated_at: { $eq: plan.q.updated_at } }, { $set: { parts: plan.next.parts, final_answer: plan.next.final_answer } });
      if (result.modifiedCount !== 1) throw new Error(`${plan.repair.id}: concurrent edit; stopped. Re-review and preview again before continuing.`);
    }
    console.log(JSON.stringify({ mode: apply ? 'apply' : 'preview', reviewed: plans.length, changed: plans.filter(plan => plan.changed).length, applied: apply ? plans.filter(plan => plan.changed).length : 0 }));
  } finally { await mongoose.disconnect(); }
}
if (isEntryPoint(import.meta.url)) main().catch(error => { console.error(error.message); process.exitCode = 1; });
