// SAME-COMMIT BACKFILL for Question.gate. A schema addition ships with one.
//
// Every question gets what the DETERMINISTIC checks find today: the figure, the
// stimulus table, the question disagreeing with itself, a value nothing can
// evaluate, a slot paid twice for one read. Those are the faults that were
// already there, and recording them is what stops them refusing an edit they
// have nothing to do with.
//
// THE SOLVE IS NOT BACKFILLED. It is a model call for every question in the
// bank, and more to the point "we have not asked" is not the same as "we know
// it was broken" — an unrecorded solve goes on blocking, exactly as before.
//
// Run: pnpm tsx scripts/done/backfill-gate-result.ts [--write]
import 'dotenv/config';
import { dbConnect, Question } from '@/lib/db';
import { questionDisagreements } from '@/lib/grade/answer-agrees';
import { verifyQuestionVisual, verifyStimulusTable } from '@/lib/visuals/verify';
import { readOffSlots } from '@/lib/generation/read-off';
import type { GateCheck } from '@/lib/generation/approve-gate';
import { isEntryPoint } from '../entry';

function deterministicFailures(q: Record<string, unknown>): GateCheck[] {
  const parts = (q.parts ?? []) as { prompt: string; slots?: { prompt?: string }[] }[];
  const partPrompts = parts.flatMap((p) => [p.prompt, ...(p.slots ?? []).map((s) => s.prompt ?? '')]);
  const at = { stimulus: q.stimulus as string, stem: q.stem as string, partPrompts };
  const failed: GateCheck[] = [];
  if (q.visual && !verifyQuestionVisual(q.visual as never, at).ok) failed.push('visual');
  if (q.stimulus_table && !verifyStimulusTable(q.stimulus_table as never, at).ok) failed.push('stimulus_table');
  const findings = questionDisagreements(parts as never);
  if (findings.some((d) => d.kind !== 'unparseable')) failed.push('self_disagreement');
  if (findings.some((d) => d.kind === 'unparseable')) failed.push('unparseable');
  if (readOffSlots(q as never).some((s) => s.shape === 'exact')) failed.push('read_off');
  return failed;
}

async function main(): Promise<void> {
  await dbConnect();
  const rows = await Question.find({}).lean<Record<string, unknown>[]>();
  const at = new Date();
  const counts = new Map<string, number>();
  let withFailures = 0;
  let written = 0;

  for (const q of rows) {
    const failed = deterministicFailures(q);
    for (const c of failed) counts.set(c, (counts.get(c) ?? 0) + 1);
    if (failed.length) withFailures++;
    if (process.argv.includes('--write')) {
      // The native driver: mongoose strips a field the schema marks with no
      // default when the update sets it to an empty array.
      await Question.collection.updateOne({ _id: q._id as never }, { $set: { gate: { at, failed } } });
      written++;
    }
  }

  console.log(`questions: ${rows.length}   with a deterministic failure: ${withFailures}`);
  for (const [c, n] of [...counts.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${c.padEnd(18)} ${n}`);
  console.log(process.argv.includes('--write') ? `\nwrote gate on ${written}` : '\ndry run — pass --write to save');
  process.exit(0);
}

if (isEntryPoint(import.meta.url)) void main();
