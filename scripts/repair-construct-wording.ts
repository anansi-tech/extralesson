// One-off repair: construct questions whose wording promises a figure the
// student cannot see while answering.
//
// The figure in a graph construct is the ANSWER to part (a) — withheld until
// the student commits, then shown for them to check against. 23 questions told
// them to "use the grid below" anyway, which points at nothing and contradicts
// the part asking them to draw it. The prompt never said the figure was
// withheld, so this is a defect in what we asked for, not in what was written.
//
// Edited, not regenerated. Every stem here is scaffolding — "use the grid to
// answer the parts below" — carrying no mathematics, so it is replaced whole.
// A stimulus carries the question, so only the sentence or clause that points
// at the figure is removed from it.
//
// Run: pnpm tsx scripts/repair-construct-wording.ts [--write]
import 'dotenv/config';
import { dbConnect, Question } from '@/lib/db';
import { figureGivesAnswer } from '@/lib/targets/construct';
import { QuestionDraftZ } from '@/lib/validation/question';

const SHOWN =
  /\b(?:use\s+the\s+[a-z' ]{0,24}?(?:grid|graph|diagram|figure|sketch)|the\s+[a-z' ]{0,24}?(?:grid|graph|diagram|figure|sketch)\s+(?:shows?|below|above|provided|is\s+for|represents)|shown\s+below|below\s+shows|as\s+shown)/i;

/** A clause that only points at the figure, inside a sentence that says more. */
const CLAUSE = /,?\s*(?:and\s+)?as\s+shown\s+(?:on|in)\s+the\s+[a-z ]+?(?=[.,;]|$)/gi;

const NEUTRAL_STEM = 'Answer the parts below.';

/**
 * Split into sentences WITHOUT cutting inside maths.
 *
 * A display block holds full stops and dots of its own — \begin{bmatrix} …
 * 1.5 … \end{bmatrix} — and splitting on them tore a matrix in half, leaving
 * \begin stranded in prose where the backslash would print to the student. The
 * schema caught it, which is why the repair re-validates rather than trusting
 * its own regex.
 */
function sentences(text: string): string[] {
  const spans: string[] = [];
  const masked = text.replace(/\\\[[\s\S]*?\\\]|\$[^$]*\$/g, (m) => {
    spans.push(m);
    return `\u0000${spans.length - 1}\u0000`;
  });
  return masked
    .split(/(?<=\.)\s+/)
    .map((s) => s.replace(/\u0000(\d+)\u0000/g, (_, i) => spans[Number(i)]));
}

function repairStimulus(text: string): string {
  // LINE BY LINE, then sentence by sentence inside each line. A stimulus often
  // opens with a colon and a display block on its own line, so the whole thing
  // is one "sentence" to a full-stop splitter — and dropping it took the
  // question with the pointer. Line structure is also worth keeping: the block
  // sits on its own line because that is how it reads.
  const repairedLines = text.split('\n').map((line) => {
    let out = line.replace(CLAUSE, '');
    for (let pass = 0; pass < 4; pass++) {
      const next = sentences(out).filter((s) => !SHOWN.test(s)).join(' ');
      if (next === out) break;
      out = next;
    }
    return out.replace(/[ \t]+/g, ' ').replace(/ +([.,;])/g, '$1').trim();
  });
  return repairedLines.filter((l) => l !== '').join('\n').trim();
}

async function main() {
  const write = process.argv.includes('--write');
  await dbConnect();
  const qs = await Question.find({ status: { $in: ['draft', 'approved'] } }).lean<any[]>();
  const targets = qs.filter(
    (q) =>
      (q.parts ?? []).some((p: any) => (p.slots ?? []).some((s: any) => s.response_mode === 'construct')) &&
      figureGivesAnswer(q.visual?.template) &&
      SHOWN.test([q.stimulus ?? '', q.stem].join(' ')),
  );

  let clean = 0;
  const problems: string[] = [];
  for (const q of targets) {
    const stimulus = repairStimulus(q.stimulus ?? '');
    const stem = NEUTRAL_STEM;
    const id = String(q._id).slice(-6);

    if (SHOWN.test(`${stimulus} ${stem}`)) {
      problems.push(`${id}: still refers after repair`);
      continue;
    }
    if (stimulus.trim() === '' && (q.stimulus ?? '').trim() !== '') {
      problems.push(`${id}: repair emptied the stimulus`);
      continue;
    }
    // The schema is the check that matters: it now rejects this class itself.
    const { _id, status, gen_meta, createdAt, updatedAt, __v, shape, context_category, ...rest } = q as any;
    const res = QuestionDraftZ.safeParse({ ...rest, stem, stimulus: stimulus || undefined });
    if (!res.success) {
      problems.push(`${id}: ${res.error.issues.map((i) => i.message).join('; ').slice(0, 100)}`);
      continue;
    }
    clean++;
    if (write) await Question.updateOne({ _id: q._id }, { $set: { stem, stimulus } });
  }

  console.log(`${targets.length} question(s) refer to a withheld figure.`);
  console.log(`  repaired and re-validated clean: ${clean}`);
  console.log(`  needing a human: ${problems.length}`);
  for (const p of problems) console.log(`    ${p}`);
  console.log(write ? '\nWRITTEN.' : '\nDry run — nothing written.');
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
