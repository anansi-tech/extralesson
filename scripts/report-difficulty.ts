// Report the two measured difficulty properties for the bank, and compare our
// WORDING against the real papers'.
//
// The calibration this was written for did not survive contact with the
// specimen. Chain depth cannot be read out of a paper's prose: "hence" appears
// once or twice in an entire paper while the chaining is constant, so a cue
// detector run over the specimen measures nothing but its restraint. Depth is
// therefore declared in the data (slot.depends_on) and only the bank can report
// it; what the specimen CAN calibrate is how loudly we signpost, which is the
// comparison this prints.
//
// Run: pnpm tsx scripts/report-difficulty.ts [path/to/specimen.txt] [papers/dir]
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { dbConnect, Question } from '@/lib/db';
import {
  actsPerMark,
  chainDepth,
  dependsOnEarlier,
  summarise,
  type QuestionShapeLike,
} from '@/lib/targets/difficulty';

interface Lean extends QuestionShapeLike {
  _id: unknown;
  kind: string;
  status: string;
  shape?: string;
  archetype?: string;
  difficulty: 1 | 2 | 3;
}

function histogram(label: string, values: number[], buckets: number[]): void {
  const s = summarise(values);
  console.log(
    `\n${label}: n=${s.n} mean=${s.mean.toFixed(2)} median=${s.median.toFixed(2)} range ${s.min}–${s.max}`,
  );
  for (const b of buckets) {
    const n = values.filter((v) => Math.round(v) === b).length;
    if (n === 0) continue;
    const pct = Math.round((n / values.length) * 100);
    console.log(`  ${String(b).padStart(3)}  ${String(n).padStart(3)} ${String(pct).padStart(3)}%  ${'█'.repeat(Math.round(pct / 2))}`);
  }
}

/** How often a body of exam prose signposts, per the cues we used to steer by. */
function signposting(text: string): { hence: number; method: number } {
  return {
    hence: (text.match(/\bhence\b/gi) ?? []).length,
    method: (
      text.match(
        /\bus(?:e|ing) (?:the )?(?:cosine rule|sine rule|pythagoras|quadratic formula|substitution|elimination|completing the square)\b/gi,
      ) ?? []
    ).length,
  };
}

async function main() {
  const specimenPath = process.argv[2];
  await dbConnect();

  const qs = await Question.find({ kind: 'structured', status: { $in: ['draft', 'approved'] } })
    .select('kind status shape archetype difficulty marks parts rubric')
    .lean<Lean[]>();

  console.log(`=== BANK — ${qs.length} structured questions (draft + approved)`);

  const acts = qs.map(actsPerMark).filter((v): v is number => v !== null);
  histogram('acts per mark (1.0 = an examiner\'s mark scheme)', acts, [1, 2, 3]);

  const depths = qs.map(chainDepth);
  histogram('chain depth', depths, [0, 1, 2, 3, 4, 5, 6, 7, 8]);

  for (const shape of ['paper', 'drill']) {
    const subset = qs.filter((q) => (q.shape ?? 'drill') === shape);
    if (!subset.length) continue;
    const s = summarise(subset.map(chainDepth));
    const a = summarise(subset.map(actsPerMark).filter((v): v is number => v !== null));
    console.log(
      `\n  ${shape.padEnd(6)} n=${s.n}  chain depth mean ${s.mean.toFixed(2)}  acts/mark mean ${a.mean.toFixed(2)}`,
    );
  }

  const archetypes = new Map<string, number>();
  for (const q of qs) archetypes.set(q.archetype ?? '?', (archetypes.get(q.archetype ?? '?') ?? 0) + 1);
  console.log('\narchetype mix:');
  for (const [a, n] of [...archetypes].sort((x, y) => y[1] - x[1])) {
    console.log(`  ${a.padEnd(24)} ${String(n).padStart(3)}  ${Math.round((n / qs.length) * 100)}%`);
  }

  if (!specimenPath) {
    console.log('\n(no specimen path given — skipping calibration)');
    process.exit(0);
  }

  const text = readFileSync(specimenPath, 'utf8');
  const spec = signposting(text);
  console.log(`\n=== SIGNPOSTING — how loudly a question announces its own chain`);
  console.log(`  2027 specimen (whole paper) : "hence" x${spec.hence}, method named x${spec.method}`);

  let bankHence = 0;
  let bankMethod = 0;
  let questionsWithHence = 0;
  for (const q of qs) {
    const prose = (q.parts ?? [])
      .map((p) => `${p.prompt} ${(p.slots ?? []).map((sl) => sl.prompt ?? '').join(' ')}`)
      .join(' ');
    const c = signposting(prose);
    bankHence += c.hence;
    bankMethod += c.method;
    if (c.hence > 0) questionsWithHence++;
  }
  console.log(
    `  our bank (${qs.length} questions)      : "hence" x${bankHence} in ${questionsWithHence} questions (${Math.round((questionsWithHence / qs.length) * 100)}%), method named x${bankMethod}`,
  );
  console.log(
    '\n  A paper is ~9 questions. Ours should say "hence" about as often as one paper does, not once per question.',
  );

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
