// Reviewed correction, not a blanket explain -> answer migration.
// Preview: pnpm exec tsx scripts/done/repair-d0dccb-cloze.ts
// Apply:   pnpm exec tsx scripts/done/repair-d0dccb-cloze.ts --apply
import 'dotenv/config';
import mongoose from 'mongoose';
import { dbConnect, Question } from '@/lib/db';
import { QuestionDraftZ } from '@/lib/validation/question';
import { isEntryPoint } from '../entry';

export const QUESTION_ID = '6a852cc0ed771942b6d0dccb';
const EXPECTED = { days: '7', comparison: 'more', decision: 'should' };

/** The printed sentence gives the meaning of all three short entries. */
export function correction(q: {
  parts: { label: string; statement?: string; marks: number; slots: { label: string; answer: string; response_mode?: string }[] }[];
}) {
  const index = q.parts.findIndex((p) => p.label === 'c');
  const part = q.parts[index];
  if (!part || part.marks !== 4 || part.statement?.split('{}').length !== 4 || part.slots.length !== 3) throw new Error('Part (c) changed; review before applying.');
  const changes: Record<string, string> = {};
  for (const [label, answer] of Object.entries(EXPECTED)) {
    const i = part.slots.findIndex((s) => s.label === label);
    const slot = part.slots[i];
    if (!slot || slot.answer !== answer || !['answer', 'explain'].includes(slot.response_mode ?? 'answer')) throw new Error(`Slot ${label} changed; review before applying.`);
    if (slot.response_mode === 'explain') changes[`parts.${index}.slots.${i}.response_mode`] = 'answer';
  }
  return changes;
}

async function main() {
  try {
    await dbConnect();
    const q = await Question.findById(QUESTION_ID).lean<any>();
    if (!q) throw new Error('Question not found.');
    const changes = correction(q);
    const next = structuredClone(q);
    for (const slot of next.parts.find((p: { label: string }) => p.label === 'c').slots) slot.response_mode = 'answer';
    QuestionDraftZ.parse(next);
    console.log(JSON.stringify({ question: QUESTION_ID, changes, rubricUnchanged: true }, null, 2));
    if (!Object.keys(changes).length) return;
    if (!process.argv.includes('--apply')) { console.log('Preview only.'); return; }
    // Compare the reviewed content, not just the id; never overwrite a concurrent edit.
    const result = await Question.updateOne({ _id: QUESTION_ID, parts: q.parts, rubric: q.rubric, stem: q.stem, stimulus: q.stimulus }, { $set: changes });
    if (result.modifiedCount !== 1) throw new Error('Question changed concurrently; nothing applied.');
    console.log('Corrected three response modes. No attempts, reads or marks updated.');
  } finally {
    await mongoose.disconnect();
  }
}

if (isEntryPoint(import.meta.url)) main().catch((e) => { console.error(e.message); process.exitCode = 1; });
