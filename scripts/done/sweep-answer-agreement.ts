// One-off sweep for the ROUND_13 follow-up: every approved slot, checked
// against itself through the marker's own path. Run: pnpm tsx scripts/done/sweep-answer-agreement.ts
import 'dotenv/config';
import { dbConnect, Question } from '@/lib/db';
import { questionDisagreements, type SlotAgreement } from '@/lib/grade/answer-agrees';

async function main() {
  await dbConnect();
  const qs = await Question.find({ status: 'approved' }).select('parts').lean<any[]>();
  const all: (SlotAgreement & { qid: string })[] = [];
  let slots = 0;
  for (const q of qs) {
    for (const p of q.parts ?? []) for (const s of p.slots ?? []) if (s.answer && (s.response_mode ?? 'answer') === 'answer') slots++;
    for (const d of questionDisagreements(q.parts ?? [])) all.push({ ...d, qid: String(q._id) });
  }
  console.log(`approved questions: ${qs.length} · answer slots: ${slots}`);
  console.log(`slots that disagree with themselves: ${new Set(all.map((a) => a.qid + a.ref)).size}  (${all.length} findings)\n`);

  const byKind: Record<string, (SlotAgreement & { qid: string })[]> = {};
  for (const a of all) (byKind[a.kind] ??= []).push(a);
  for (const [kind, list] of Object.entries(byKind)) {
    console.log(`--- ${kind}: ${list.length}`);
    const byNotation: Record<string, typeof list> = {};
    for (const a of list) (byNotation[a.notation.join(' + ')] ??= []).push(a);
    for (const [n, rows] of Object.entries(byNotation).sort((a, b) => b[1].length - a[1].length)) {
      console.log(`    ${n}: ${rows.length}`);
      for (const r of rows.slice(0, 4)) console.log(`      ${r.qid.slice(-6)} (${r.ref})  canonical ${JSON.stringify(r.canonical).slice(0, 90)}\n          failed: ${JSON.stringify(r.failure).slice(0, 90)}`);
      if (rows.length > 4) console.log(`      … and ${rows.length - 4} more`);
    }
  }
  process.exit(0);
}
void main();
