import { isDeepStrictEqual } from 'node:util';
import { deriveFinalAnswer } from '@/lib/validation/question';
import { authoredFields, batches, prepare } from './preview-question-cleanup';

type Change = { ref: string; before: { answer: string; accept: string[] } };

/** Check the reviewed context, not just the exemplar being replaced. */
export function assertReviewedContext(q: Record<string, unknown>, repair: { id: string; changes: Change[] }) {
  const source = [...batches.held, ...batches.missing].find(item => item.id === repair.id);
  if (!source) throw new Error(`${repair.id}: missing reviewed context`);
  // Compare authored fields only; timestamps are guarded separately at write time.
  const restored = Object.fromEntries(authoredFields.split(' ')
    .filter(field => Object.hasOwn(q, field))
    .map(field => [field, structuredClone(q[field])])) as typeof source.expected;
  if (q.final_answer !== source.expected.final_answer && q.final_answer !== deriveFinalAnswer(restored.parts)) {
    throw new Error(`${repair.id}: final answer changed since review; re-review required.`);
  }
  for (const change of repair.changes) {
    const [part, label] = change.ref.split('.');
    const slot = restored.parts.find(p => p.label === part)?.slots.find(s => s.label === label);
    if (!slot) throw new Error(`${repair.id}: slot changed since review; re-review required.`);
    Object.assign(slot, change.before);
  }
  restored.final_answer = source.expected.final_answer;
  // Both the original fixture and its approved wording cleanup are reviewed states.
  // Nothing else (rubric, stimulus, status, modes, dependencies, etc.) is ignored.
  if (!isDeepStrictEqual(restored, source.expected)) prepare(restored, source);
}
