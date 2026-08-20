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
// R1.9 makes it SYMMETRIC, and adds under-tagging. The first pass looked only
// for Module 2 content inside Module 3 questions, because that was the
// direction the review happened to catch; the leak runs both ways. The sine and
// cosine rules are M3.3.7, and Module 2 trigonometry is the right-angled ratios
// and Pythagoras, so a Module 2 question solving a non-right triangle is the
// mirror image of the first defect.
//
// Under-tagging is the same evidence read the other way. A question that uses
// the sine rule and never declares M3.3.7 leaves the matrix reporting zero
// coverage for an objective the bank actually assesses — which is how an
// objective can be both taught and invisible. Those are REPORTED for retagging,
// never retagged here: whether the question assesses the objective well enough
// to count is a judgement about content.
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
// The worked solution names the method even though the question may not: the
// no-naming rule is about what a candidate reads, not about our own solution.
// Detecting on the name rather than on formula shape is what separates a real
// sine-rule question from right-angled work that merely contains a fraction and
// a sine — the first attempt at this flagged tan(30) = QR/45 as a sine rule.
const NON_RIGHT_TRIG = /\b(sine|cosine)\s+rule\b|\blaw of (sines|cosines)\b/i;
const SINE_COSINE_OBJECTIVE = 'M3.3.7';
const LP = /feasible region|linear programm|shaded region[^.]*inequalit|inequalit[^.]*shaded region/i;
const NONNEG = /x\s*\\g(?:e|eq)\s*0|y\s*\\g(?:e|eq)\s*0|x\s*[≥⩾]\s*0|y\s*[≥⩾]\s*0|non-?negativ/i;

interface Lean {
  _id: unknown;
  status: string;
  module: number;
  objective_ids: string[];
  stimulus?: string;
  worked_solution?: string;
  rubric?: { criterion?: string }[];
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

/** What we WORK, as opposed to what the student reads — where a method is named. */
function methodText(q: Lean): string {
  return [q.worked_solution ?? '', ...(q.rubric ?? []).map((r) => r.criterion ?? '')].join(' ');
}

async function main() {
  await dbConnect();
  // The whole live bank now, not one prompt version: the first sweep was scoped
  // to the batch under suspicion, which is exactly the habit that keeps finding
  // the same class of defect in whatever corner was last looked at.
  const qs = await Question.find({ status: { $in: ['draft', 'approved'] } }).lean<Lean[]>();

  const hits = qs.flatMap((q) => {
    const text = fullText(q);
    const flags: string[] = [];
    const method = methodText(q);
    if (q.module === 3 && COMPOSITE.test(text)) {
      flags.push('Module 2 function notation (fg, f-inverse) in a Module 3 question');
    }
    if (q.module === 2 && NON_RIGHT_TRIG.test(method)) {
      flags.push(`Module 3 method (sine/cosine rule, ${SINE_COSINE_OBJECTIVE}) in a Module 2 question`);
    }
    if (LP.test(text) && !NONNEG.test(text)) flags.push('region defined without x >= 0, y >= 0');
    if (NON_RIGHT_TRIG.test(method) && !q.objective_ids.includes(SINE_COSINE_OBJECTIVE)) {
      flags.push(
        `UNDER-TAGGED: uses the sine/cosine rule but declares ${q.objective_ids.join(', ')} — ${SINE_COSINE_OBJECTIVE} reads as uncovered`,
      );
    }
    return flags.length ? [{ q, flags }] : [];
  });

  console.log(`Swept ${qs.length} live questions — ${hits.length} carry at least one flag.\n`);
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
