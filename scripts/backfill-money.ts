// Migrate stored content to the measured money convention (R1.8 correction).
//
// Every question written before this used "EC$12", because our own rule said
// so. Measured against the papers that rule was wrong — 61 bare dollar signs
// across the text-layer papers and no EC$ anywhere — and the delimiter problem
// it was invented to solve is now handled at the encoding layer: money is
// stored as \$ and rendered as $.
//
// So stored content has to move with it, and the move is not cosmetic. Once the
// renderer stops special-casing EC$, a question holding "EC$5 … EC$3" has two
// unescaped dollar signs that the math segmenter WILL pair, swallowing the
// prose between them. This must run in the same commit as the convention.
//
// Also normalises thousands to a space: 27 instances of "17 400" in the papers
// and none of "17,400".
//
// Idempotent. Run: pnpm tsx scripts/backfill-money.ts [--yes]
import 'dotenv/config';
import { dbConnect, Question } from '@/lib/db';

// A currency prefix our old rule allowed. A BARE dollar is deliberately NOT
// touched: under the old convention money always carried a prefix, so every
// bare $ in stored content is a math delimiter — and "$3$" opens with a dollar
// followed by a digit, which no lookahead can tell from money. Rewriting those
// would corrupt the mathematics of every question in the bank.
const PREFIXED = /\b(?:EC|US|TT|BB|BDS|BZ|KY|GY|J|G|B)\s*\$(?=\s*\d)/g;
const COMMA_GROUPED = /(\d),(?=\d{3}\b)/g;

/** One field's worth of content, moved to the stored convention. */
export function toStoredMoney(text: string): string {
  return text.replace(PREFIXED, '\\$').replace(COMMA_GROUPED, '$1 ');
}

function migrate(q: Record<string, unknown>): { changed: boolean; doc: Record<string, unknown> } {
  let changed = false;
  const fix = (v: unknown): unknown => {
    if (typeof v === 'string') {
      const next = toStoredMoney(v);
      if (next !== v) changed = true;
      return next;
    }
    if (Array.isArray(v)) return v.map(fix);
    if (v && typeof v === 'object') {
      return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, val]) => [k, fix(val)]));
    }
    return v;
  };

  const doc: Record<string, unknown> = {};
  for (const field of ['stem', 'stimulus', 'worked_solution', 'options', 'parts', 'rubric', 'misconceptions', 'final_answer', 'visual']) {
    if (q[field] === undefined) continue;
    doc[field] = fix(q[field]);
  }
  return { changed, doc };
}

async function main() {
  const apply = process.argv.includes('--yes');
  await dbConnect();

  const qs = await Question.find({}).lean<Record<string, unknown>[]>();
  let touched = 0;
  const samples: string[] = [];

  for (const q of qs) {
    const { changed, doc } = migrate(q);
    if (!changed) continue;
    touched++;
    if (samples.length < 5) {
      const before = String(q.stem).replace(/\s+/g, ' ').slice(0, 84);
      const after = String(doc.stem).replace(/\s+/g, ' ').slice(0, 84);
      if (before !== after) samples.push(`  before: ${before}\n  after:  ${after}`);
    }
    if (apply) await Question.updateOne({ _id: q._id }, { $set: doc });
  }

  for (const s of samples) console.log(s);
  console.log(`\n${touched} of ${qs.length} question(s) carry money or comma-grouped thousands.`);
  console.log(apply ? 'applied' : 'preview only — re-run with --yes');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
