// One-off audit for the defect pair caught in review on 2026-08-19, both of
// them in difficulty-3 questions written under the integration requirement:
//
//   1. Composite/inverse function notation (Module 2 content) inside a question
//      tagged with Module 3 objectives. A candidate sitting Module 3 in the
//      modular format may never have met fg(x), so the part is unanswerable for
//      the student it was written for.
//   2. A linear-programming region whose inequalities omit x >= 0, y >= 0. The
//      region is then wrong as written, and a student who states them looks
//      like they added a constraint.
//
// This REPORTS. It does not retire anything and it is not wired into any gate:
// the prompt rule (v41) stops new questions carrying these, and what is already
// in the bank is a review decision, not a script's. Most of the first sweep's
// hits were APPROVED — already reviewed and passed — which is a different
// decision from "still in the queue", so the report splits by status.
//
// Run: pnpm tsx scripts/audit-module-fidelity.ts
import 'dotenv/config';
import { dbConnect, Question } from '@/lib/db';

// Notation, not vocabulary: "inverse" and "composite" are ordinary words that
// appear in matrix and transformation questions, which are legitimately M2 and
// M3 respectively. Only the function notation itself is evidence.
const COMPOSITE = /f\s*\(\s*g\s*\(|g\s*\(\s*f\s*\(|\bfg\s*\(|\bgf\s*\(|f\s*\^\s*\{?\s*-\s*1|g\s*\^\s*\{?\s*-\s*1/;
const LP = /feasible region|linear programm|shaded region[^.]*inequalit|inequalit[^.]*shaded region/i;
const NONNEG = /x\s*\\g(?:e|eq)\s*0|y\s*\\g(?:e|eq)\s*0|x\s*[≥⩾]\s*0|y\s*[≥⩾]\s*0|non-?negativ/i;

interface Lean {
  _id: unknown;
  status: string;
  module: number;
  objective_ids: string[];
  stimulus?: string;
  parts?: { label: string; prompt?: string; statement?: string; slots?: { prompt?: string; answer?: string }[] }[];
}

/** Everything a student reads, plus the answers, as one string. */
function fullText(q: Lean): string {
  return [
    q.stimulus ?? '',
    ...(q.parts ?? []).flatMap((p) => [
      p.prompt ?? '',
      p.statement ?? '',
      ...(p.slots ?? []).flatMap((s) => [s.prompt ?? '', s.answer ?? '']),
    ]),
  ].join(' ');
}

async function main() {
  await dbConnect();
  const qs = await Question.find({
    kind: 'structured',
    difficulty: 3,
    'gen_meta.prompt_version': 'v40',
  }).lean<Lean[]>();

  const hits = qs.flatMap((q) => {
    const text = fullText(q);
    const flags: string[] = [];
    if (q.module === 3 && COMPOSITE.test(text)) flags.push('composite/inverse notation in an M3 question');
    if (LP.test(text) && !NONNEG.test(text)) flags.push('region defined without x >= 0, y >= 0');
    return flags.length ? [{ q, flags }] : [];
  });

  console.log(`Swept ${qs.length} v40 difficulty-3 structured questions — ${hits.length} carry at least one defect.\n`);
  for (const status of ['draft', 'approved', 'retired']) {
    const rows = hits.filter((h) => h.q.status === status);
    if (rows.length === 0) continue;
    console.log(`${status.toUpperCase()} — ${rows.length}${status === 'approved' ? ' (already reviewed and passed)' : ''}`);
    for (const { q, flags } of rows) {
      console.log(`  ${String(q._id)}  ${q.objective_ids.join(',')}`);
      for (const f of flags) console.log(`    · ${f}`);
    }
    console.log('');
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
