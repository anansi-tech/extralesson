// One report for the state of the bank: what was accepted, what it is set in,
// and whether it is shaped like the papers.
//
// Everything here is read from DECLARED fields — shape, context_category,
// depends_on, rubric rows — never from wording. A metric that pattern-matches
// prose measures how a question announces itself rather than what it is.
//
// Run: pnpm tsx scripts/report-bank.ts
import 'dotenv/config';
import { dbConnect, Question, Topic, Blueprint } from '@/lib/db';
import { actsPerMark, chainDepth, summarise } from '@/lib/targets/difficulty';
import { computeMatrix, P1_TOTAL, P2_MARKS_TOTAL, type QuestionFacts } from '@/lib/targets/matrix';
import { CONTEXT_CATEGORIES, CONTEXT_FREE_MCQ_SHARE } from '@/lib/generation/contexts';
import { STRUCTURED_ARCHETYPE_TARGETS } from '@/lib/targets/representation';
import { TARGET_ACTS_PER_MARK, TARGET_CHAIN_DEPTH } from '@/lib/targets/difficulty';

interface Lean {
  kind: 'mcq' | 'structured';
  status: string;
  shape?: string;
  archetype?: string;
  difficulty: 1 | 2 | 3;
  marks: number;
  module: 1 | 2 | 3;
  objective_ids: string[];
  representation: string;
  context_category?: string;
  parts?: { label: string; prompt: string; slots?: { label: string; depends_on?: string[] }[] }[];
  rubric?: { mark_value: number; profile: 'CK' | 'AK' | 'R' }[];
}

function bar(n: number, of: number, width = 28): string {
  const filled = of === 0 ? 0 : Math.round((n / of) * width);
  return '█'.repeat(Math.min(width, filled));
}

function pct(n: number, of: number): string {
  return `${of === 0 ? 0 : Math.round((n / of) * 100)}%`;
}

async function main() {
  await dbConnect();
  const [qs, topics, blueprints] = await Promise.all([
    Question.find({ status: { $in: ['draft', 'approved'] } }).lean<Lean[]>(),
    Topic.find({}).lean<{ code: string; title: string; module: 1 | 2 | 3; order: number }[]>(),
    Blueprint.find({}).lean<
      { paper: 'P1' | 'P2'; module: number; allocations: { topic_codes: string[]; items?: number; marks?: number }[] }[]
    >(),
  ]);

  const topicOf = (id: string) => {
    const prefix = id.slice(0, id.lastIndexOf('.'));
    const t = topics.find((x) => `M${x.module}.${x.order}` === prefix);
    return t?.code ?? '?';
  };

  const structured = qs.filter((q) => q.kind === 'structured');
  const mcq = qs.filter((q) => q.kind === 'mcq');
  console.log(`BANK: ${qs.length} questions — ${structured.length} structured, ${mcq.length} Paper 1 items\n`);

  // --- matrix coverage -----------------------------------------------------
  const facts: QuestionFacts[] = qs.map((q) => ({
    kind: q.kind,
    module: q.module,
    topic_code: topicOf(q.objective_ids[0] ?? ''),
    topic_span: new Set(q.objective_ids.map(topicOf)).size,
    representation: q.representation as QuestionFacts['representation'],
    archetype: (q.archetype ?? 'multi-step-application') as QuestionFacts['archetype'],
    difficulty: q.difficulty,
    marks: q.marks,
    rubric_profile_marks: (q.rubric ?? []).reduce(
      (acc, r) => ({ ...acc, [r.profile]: (acc[r.profile] ?? 0) + r.mark_value }),
      { CK: 0, AK: 0, R: 0 } as Record<'CK' | 'AK' | 'R', number>,
    ),
  }));
  const matrix = computeMatrix(topics, blueprints, facts);
  console.log(
    `MATRIX  P1 ${matrix.p1_actual_total}/${P1_TOTAL} items (${pct(matrix.p1_actual_total, P1_TOTAL)}) · ` +
      `P2 ${matrix.p2_marks_actual_total}/${P2_MARKS_TOTAL} marks (${pct(matrix.p2_marks_actual_total, P2_MARKS_TOTAL)})\n`,
  );

  // --- shape ---------------------------------------------------------------
  const paper = structured.filter((q) => q.shape === 'paper');
  const drill = qs.filter((q) => (q.shape ?? 'drill') === 'drill');
  console.log(`SHAPE   paper-shaped ${paper.length} · drill ${drill.length}`);
  if (paper.length) {
    const m = summarise(paper.map((q) => q.marks));
    console.log(`        paper-shaped marks: mean ${m.mean.toFixed(1)}, range ${m.min}-${m.max}\n`);
  } else {
    console.log('');
  }

  // --- setting distribution ------------------------------------------------
  const settings = new Map<string, number>();
  for (const q of qs) settings.set(q.context_category ?? '(unset)', (settings.get(q.context_category ?? '(unset)') ?? 0) + 1);
  const contextual = qs.filter((q) => q.context_category && q.context_category !== 'none');
  console.log(`SETTINGS  ${settings.size - (settings.has('none') ? 1 : 0)} of ${CONTEXT_CATEGORIES.length - 1} categories used`);
  for (const [c, n] of [...settings].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${c.padEnd(16)} ${String(n).padStart(3)} ${pct(n, qs.length).padStart(4)} ${bar(n, qs.length)}`);
  }
  const topShare = contextual.length
    ? Math.max(...[...settings].filter(([c]) => c !== 'none' && c !== '(unset)').map(([, n]) => n)) / contextual.length
    : 0;
  console.log(`  largest single setting: ${Math.round(topShare * 100)}% of contextualised questions\n`);

  // --- context-free P1 -----------------------------------------------------
  const bare = mcq.filter((q) => q.context_category === 'none').length;
  console.log(
    `CONTEXT-FREE P1  ${bare}/${mcq.length} = ${pct(bare, mcq.length)} (target ${Math.round(CONTEXT_FREE_MCQ_SHARE * 100)}%)\n`,
  );

  // --- acts per mark -------------------------------------------------------
  const acts = structured.map(actsPerMark).filter((v): v is number => v !== null);
  const a = summarise(acts);
  console.log(
    `ACTS PER MARK  mean ${a.mean.toFixed(2)}, median ${a.median.toFixed(2)}, range ${a.min.toFixed(2)}-${a.max.toFixed(2)} (target ${TARGET_ACTS_PER_MARK})`,
  );
  const coarse = acts.filter((v) => v < 0.999).length;
  console.log(`  ${coarse} of ${acts.length} carry a row worth more than one mark\n`);

  // --- chain depth ---------------------------------------------------------
  const depths = structured.map(chainDepth);
  const d = summarise(depths);
  console.log(`CHAIN DEPTH  mean ${d.mean.toFixed(2)}, median ${d.median.toFixed(2)}, max ${d.max} (target ${TARGET_CHAIN_DEPTH}+ for paper-shaped)`);
  for (let k = 1; k <= Math.max(1, d.max); k++) {
    const n = depths.filter((v) => v === k).length;
    if (n) console.log(`  depth ${k}  ${String(n).padStart(3)} ${pct(n, depths.length).padStart(4)} ${bar(n, depths.length)}`);
  }
  if (paper.length) {
    const pd = summarise(paper.map(chainDepth));
    console.log(`  paper-shaped only: mean ${pd.mean.toFixed(2)}, min ${pd.min}\n`);
  } else {
    console.log('');
  }

  // --- archetype / reverse-reasoning ---------------------------------------
  const arch = new Map<string, number>();
  for (const q of structured) arch.set(q.archetype ?? '?', (arch.get(q.archetype ?? '?') ?? 0) + 1);
  console.log('ARCHETYPE (structured)   actual vs target');
  for (const [name, target] of Object.entries(STRUCTURED_ARCHETYPE_TARGETS)) {
    const n = arch.get(name) ?? 0;
    console.log(
      `  ${name.padEnd(24)} ${String(n).padStart(3)} ${pct(n, structured.length).padStart(4)}  target ${String(target).padStart(2)}%  ${bar(n, structured.length)}`,
    );
  }

  // --- acceptance by topic is reported by the generator itself --------------
  console.log('\nPER-TOPIC COUNTS (acceptance rates come from the generation run)');
  for (const row of matrix.topics) {
    const n = qs.filter((q) => topicOf(q.objective_ids[0] ?? '') === row.code).length;
    if (n === 0) continue;
    console.log(
      `  ${row.code.padEnd(12)} ${String(n).padStart(3)} questions · P1 ${row.p1_actual}/${row.p1_target} · P2 ${row.p2_marks_actual}/${row.p2_marks_target} marks`,
    );
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
