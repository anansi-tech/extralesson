// Same-commit backfill for RubricItem.template (ROUND_5 Task 1), with the
// audit the spec asks for: rows templated, rows unchanged, and every
// ambiguous row listed for a human glance. Previews by default; --yes writes.
// Run: pnpm tsx scripts/backfill-rubric-template.ts [--yes]
import 'dotenv/config';
import { dbConnect, Question } from '@/lib/db';
import { deriveTemplate, type ScopeSlot } from '@/lib/grade/claim-template';

interface Row { code: string; criterion: string; slot_ref: string; template?: string }
interface Q {
  _id: unknown;
  stem: string;
  stimulus?: string;
  parts?: { label: string; prompt: string; slots: { label: string; answer: string; prompt?: string; depends_on?: string[] }[] }[];
  rubric?: Row[];
  visual?: { params?: unknown };
  stimulus_table?: unknown;
}

export function questionText(q: Q): string {
  return [
    q.stem,
    q.stimulus ?? '',
    ...(q.parts ?? []).flatMap((p) => [p.prompt, ...p.slots.map((s) => s.prompt ?? '')]),
    JSON.stringify(q.visual?.params ?? ''),
    JSON.stringify(q.stimulus_table ?? ''),
  ].join(' ');
}

export function slotsOf(q: Q): Map<string, ScopeSlot> {
  return new Map(
    (q.parts ?? []).flatMap((p) =>
      p.slots.map((s) => [`${p.label}.${s.label}`, { ref: `${p.label}.${s.label}`, answer: s.answer, depends_on: s.depends_on }] as const),
    ),
  );
}

async function main() {
  await dbConnect();
  const apply = process.argv.includes('--yes');
  const questions = await Question.find({ kind: 'structured', rubric: { $exists: true, $ne: [] } })
    .select('stem stimulus parts rubric visual stimulus_table status')
    .lean<(Q & { status: string })[]>();

  let rows = 0, templated = 0, unchanged = 0;
  const ambiguous: string[] = [];
  const refCounts = new Map<number, number>();
  let written = 0;
  for (const q of questions) {
    const slots = slotsOf(q);
    const text = questionText(q);
    const templates: string[] = [];
    for (const r of q.rubric ?? []) {
      rows++;
      const d = deriveTemplate({ criterion: r.criterion, slotRef: r.slot_ref, slots, questionText: text });
      templates.push(d.template);
      if (d.ambiguous) {
        ambiguous.push(`${String(q._id).slice(-6)} [${q.status}] ${r.code} [${r.slot_ref}] — ${d.ambiguous}\n      ${r.criterion}`);
      } else if (d.refs.length) {
        templated++;
        refCounts.set(d.refs.length, (refCounts.get(d.refs.length) ?? 0) + 1);
      } else {
        unchanged++;
      }
    }
    if (apply) {
      const set: Record<string, string> = {};
      templates.forEach((t, i) => { set[`rubric.${i}.template`] = t; });
      const res = await Question.updateOne({ _id: q._id }, { $set: set });
      written += res.modifiedCount;
    }
  }

  console.log(`questions: ${questions.length} · rubric rows: ${rows}`);
  console.log(`templated (≥1 reference): ${templated}  ·  unchanged (no value in scope): ${unchanged}  ·  ambiguous (literal kept): ${ambiguous.length}`);
  console.log(`references per templated row: ${[...refCounts].sort().map(([n, c]) => `${n}→${c}`).join('  ')}`);
  console.log(`\nAMBIGUOUS — ${ambiguous.length} row(s), for a human glance:`);
  for (const a of ambiguous) console.log(`  ${a}`);
  console.log(apply ? `\nwritten: ${written} question(s)` : '\npreview only; pass --yes to write');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
