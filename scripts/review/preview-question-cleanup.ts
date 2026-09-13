// Preparation only: this command has no bank-write path.
import 'dotenv/config';
import { isDeepStrictEqual } from 'node:util';
import mongoose from 'mongoose';
import { dbConnect, Question } from '@/lib/db';
import { QuestionDraftZ } from '@/lib/validation/question';
import held from './held-question-cleanup.json';
import missing from './missing-question-cleanup.json';
import { isEntryPoint } from '../entry';

export const batches = { held, missing };
export const authoredFields = 'status kind shape misconceptions stimulus_table module objective_ids difficulty marks stem stimulus visual parts rubric worked_solution final_answer archetype representation context_category';
export type Repair = (typeof held)[number] | (typeof missing)[number];
export type Content = Repair['expected'];

export function prepare(q: Content, repair: Repair) {
  const next = structuredClone(repair.expected);
  for (const { ref, prompt } of repair.prompts) {
    const [part, label] = ref.split('.');
    const slot = next.parts.find(p => p.label === part)?.slots.find(s => s.label === label);
    if (!slot || slot.response_mode !== 'explain') throw new Error(`${repair.id}: unexpected explanation ${ref}`);
    Object.assign(slot, { prompt });
  }
  for (const [label, statement] of Object.entries(repair.statements)) {
    const part = next.parts.find(p => p.label === label);
    if (!part) throw new Error(`${repair.id}: unexpected part ${label}`);
    Object.assign(part, { statement });
  }
  if (!isDeepStrictEqual(q, repair.expected) && !isDeepStrictEqual(q, next)) {
    throw new Error(`${repair.id}: content changed since review; re-review required`);
  }
  QuestionDraftZ.parse(next);
  return { next, changed: !isDeepStrictEqual(q, next) };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some(arg => !['--held', '--missing'].includes(arg))) {
    throw new Error('Preview only. Allowed flags: --held or --missing. Bank application requires separate approval and a guarded apply script.');
  }
  const repairs = args.includes('--held') ? held : args.includes('--missing') ? missing : [...held, ...missing];
  let failed = 0;
  try {
    await dbConnect();
    for (const repair of repairs) {
      // Read only the authored fields needed for validation and stale-review checks.
      const q = await Question.findById(repair.id).select(`${authoredFields} -_id`).lean<Content>();
      try {
        if (!q) throw new Error(`${repair.id}: question missing`);
        const result = prepare(q, repair);
        console.log(JSON.stringify({ id: repair.id, changed: result.changed, prompts: repair.prompts, statements: repair.statements }));
      } catch (error) {
        failed++;
        console.error(JSON.stringify({ id: repair.id, error: error instanceof Error ? error.message : String(error) }));
      }
    }
    console.log(`Preview only: ${repairs.length - failed} valid; ${failed} held by validation/review guard. No bank or attempt writes.`);
    if (failed) process.exitCode = 1;
  } finally { await mongoose.disconnect(); }
}
if (isEntryPoint(import.meta.url)) main().catch(e => { console.error(e.message); process.exitCode = 1; });
