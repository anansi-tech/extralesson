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
import { hasShowThat, SHOW_THAT_SHARE } from '@/lib/targets/show-that';
import { CONSTRUCT_SHARE } from '@/lib/targets/construct';
import { STRUCTURED_ARCHETYPE_TARGETS } from '@/lib/targets/representation';
import { TARGET_ACTS_PER_MARK, TARGET_CHAIN_DEPTH } from '@/lib/targets/difficulty';
import { LANDING } from '@/lib/landing-content';
import { NAMES, NAMING_RATE, namesAPerson, recentActors } from '@/lib/generation/territories';

/**
 * WHAT THE STEERING CHANGES WERE WORTH, MEASURED AGAINST THE DAY THEY LANDED.
 *
 * Four changes went in together and none had been generated against: the
 * naming rate read off the papers, the flat NAMES list with least-used
 * selection, the dealings vocabulary, and template deficit ordering. There was
 * no batch to run them through — the bank had passed its pool target and every
 * assessable objective was covered, so a run would have been a deliberate
 * over-target batch to confirm mechanisms already proven in principle.
 *
 * So the baseline is recorded instead. Whenever the next real batch happens,
 * and for whatever reason, these read as a DELTA rather than as numbers nobody
 * can place. Measured over the APPROVED bank, which is what a student sees.
 */
const STEERING_BASELINE = {
  on: '2026-08-28',
  approved: 609,
  namedShare: 0.077,
  namesInUse: 8,
  banking: 0.021,
  wages: 0.007,
  agriculture: 0.112,
  cumulativeFrequency: 6,
  distinctActors: 80,
  topFiveActors: 0.385,
} as const;

/** Measured on the papers, and what the recipe steers toward. */
const PAPER_SHARES = { banking: 0.31, wages: 0.08, agriculture: 0.065 } as const;

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
  stimulus?: string;
  stem?: string;
  visual?: { template?: string };
  parts?: { label: string; prompt: string; slots?: { label: string; depends_on?: string[]; response_mode?: string }[] }[];
  rubric?: { mark_value: number; profile: 'CK' | 'AK' | 'R'; criterion: string }[];
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
  const [qs, everything, topics, blueprints] = await Promise.all([
    Question.find({ status: { $in: ['draft', 'approved'] } }).lean<Lean[]>(),
    Question.find({}).select('kind status').lean<{ kind: string; status: string }[]>(),
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

  // Always by STATUS. "Still in the queue" and "already approved" lead to
  // opposite decisions — a single total once had a reviewer agree to retire 48
  // questions on the understanding that none of them had been reviewed, when 34
  // of them had.
  console.log(`BANK: ${qs.length} live questions — ${structured.length} structured, ${mcq.length} Paper 1 items`);
  const cell = (kind: string, status: string) =>
    everything.filter((q) => q.kind === kind && q.status === status).length;
  console.log('             approved   draft  retired');
  for (const kind of ['structured', 'mcq']) {
    console.log(
      `  ${kind.padEnd(11)}${String(cell(kind, 'approved')).padStart(8)}${String(cell(kind, 'draft')).padStart(8)}${String(cell(kind, 'retired')).padStart(9)}`,
    );
  }
  console.log('');

  // --- matrix coverage -----------------------------------------------------
  const facts: QuestionFacts[] = qs.map((q) => ({
    kind: q.kind,
    module: q.module,
    topic_code: topicOf(q.objective_ids[0] ?? ''),
    topic_span: new Set(q.objective_ids.map(topicOf)).size,
    objective_span: new Set((q.parts ?? []).flatMap((p: any) => (p.slots ?? []).map((s: any) => s.objective_id).filter(Boolean))).size,
    has_construct: (q.parts ?? []).some((p) => (p.slots ?? []).some((s) => s.response_mode === 'construct')),
    has_show_that: hasShowThat(q.parts as never),
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

  // --- what the marks are actually for -------------------------------------
  //
  // The landing page prints this share as a statistic, so it is measured here
  // beside the counts it belongs with. A number stated in marketing and
  // computed nowhere drifts the moment a batch of questions lands, and drifts
  // silently — which is the one kind of wrong this report exists to prevent.
  //
  // CAO is a mark-scheme convention we author deliberately, so reading it off
  // the criterion is reading a declared field's own vocabulary, not
  // pattern-matching prose about the maths.
  const approvedStructured = structured.filter((q) => q.status === 'approved');
  const rubricRows = approvedStructured.flatMap((q) => q.rubric ?? []);
  const rubricMarks = rubricRows.reduce((n, r) => n + r.mark_value, 0);
  const answerMarks = rubricRows
    .filter((r) => /\bCAO\b/.test(r.criterion))
    .reduce((n, r) => n + r.mark_value, 0);
  const workingMarks = rubricMarks - answerMarks;
  const workingPct = rubricMarks === 0 ? 0 : (workingMarks / rubricMarks) * 100;
  // FLOORED, not rounded — the same rule lib/targets/coverage.ts states for the
  // coverage figure: a claim about ourselves should lag the truth and never
  // lead it, and under-claiming by a point costs nothing. 84.6% is stated as
  // 84%, and would be an overstatement at 85%.
  const claimable = Math.floor(workingPct);
  const claimed = Number(LANDING.statWorking.replace('%', ''));
  console.log(
    `MARKS   ${workingMarks}/${rubricMarks} for the working (${workingPct.toFixed(1)}%) · ` +
      `${answerMarks} for the answer (CAO)`,
  );
  if (claimed > claimable) {
    console.log(
      `        ⚠ LANDING PAGE CLAIMS ${LANDING.statWorking} AND THE BANK SUPPORTS ${claimable}% — ` +
        `that overstates it. Lower LANDING.statWorking in lib/landing-content.ts\n`,
    );
  } else if (claimable - claimed > 1) {
    console.log(
      `        landing page says ${LANDING.statWorking}, bank now supports ${claimable}% — ` +
        `safe, but stale enough to raise\n`,
    );
  } else {
    console.log(`        landing page says ${LANDING.statWorking} — supported\n`);
  }

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

  // --- demands the papers set that we have to ASK for ----------------------
  const pct1 = (n: number) => `${Math.round((n / Math.max(1, matrix.p2_actual_total)) * 100)}%`;
  console.log('\nDEMAND SHARES (structured)');
  console.log(
    `  construction  ${String(matrix.construct_actual).padStart(3)} ${pct1(matrix.construct_actual).padStart(4)}  target ${Math.round(CONSTRUCT_SHARE * 100)}%`,
  );
  console.log(
    `  show that     ${String(matrix.show_that_actual).padStart(3)} ${pct1(matrix.show_that_actual).padStart(4)}  target ${Math.round(SHOW_THAT_SHARE * 100)}%`,
  );

  // --- acceptance by topic is reported by the generator itself --------------
  console.log('\nPER-TOPIC COUNTS (acceptance rates come from the generation run)');
  for (const row of matrix.topics) {
    const n = qs.filter((q) => topicOf(q.objective_ids[0] ?? '') === row.code).length;
    if (n === 0) continue;
    console.log(
      `  ${row.code.padEnd(12)} ${String(n).padStart(3)} questions · P1 ${row.p1_actual}/${row.p1_target} · P2 ${row.p2_marks_actual}/${row.p2_marks_target} marks`,
    );
  }

  // STEERING, against the baseline recorded at the top of this file.
  //
  // Every figure is over the APPROVED bank. A change that has never been
  // generated against reads exactly as its baseline, which is the point: the
  // day these move is the day a batch actually exercised them.
  const live = qs.filter((q) => q.status === 'approved');
  const text = (q: Lean) =>
    [q.stimulus ?? '', q.stem ?? '', ...(q.parts ?? []).map((p) => p.prompt)].join(' ');
  const share = (n: number) => n / Math.max(1, live.length);
  const delta = (now: number, then: number) => {
    const d = now - then;
    return Math.abs(d) < 0.0005 ? 'unmoved' : `${d > 0 ? '+' : ''}${(d * 100).toFixed(1)}pp`;
  };
  const line = (label: string, now: string, was: string, target: string, moved: string) =>
    console.log(`  ${label.padEnd(30)} ${now.padStart(8)}   was ${was.padStart(7)}   target ${target.padStart(7)}   ${moved}`);

  console.log(`\nSTEERING  against the baseline of ${STEERING_BASELINE.on} (${STEERING_BASELINE.approved} approved)`);

  const named = live.filter((q) => namesAPerson(text(q))).length;
  line(
    'questions naming a person',
    `${(share(named) * 100).toFixed(1)}%`,
    `${(STEERING_BASELINE.namedShare * 100).toFixed(1)}%`,
    `${(NAMING_RATE * 100).toFixed(0)}%`,
    delta(share(named), STEERING_BASELINE.namedShare),
  );

  const inUse = NAMES.filter((n) => live.some((q) => new RegExp(`\\b${n}\\b`).test(text(q)))).length;
  line(
    'names of ' + NAMES.length + ' ever used',
    `${inUse}`,
    `${STEERING_BASELINE.namesInUse}`,
    `${NAMES.length}`,
    inUse === STEERING_BASELINE.namesInUse ? 'unmoved' : `${inUse > STEERING_BASELINE.namesInUse ? '+' : ''}${inUse - STEERING_BASELINE.namesInUse}`,
  );

  for (const key of ['banking', 'wages', 'agriculture'] as const) {
    const n = live.filter((q) => q.context_category === key).length;
    line(
      `setting: ${key}`,
      `${(share(n) * 100).toFixed(1)}%`,
      `${(STEERING_BASELINE[key] * 100).toFixed(1)}%`,
      `${(PAPER_SHARES[key] * 100).toFixed(0)}%`,
      delta(share(n), STEERING_BASELINE[key]),
    );
  }

  const cf = live.filter((q) => q.visual?.template === 'cumulativeFrequency').length;
  line(
    'template: cumulativeFrequency',
    `${cf}`,
    `${STEERING_BASELINE.cumulativeFrequency}`,
    'deficit',
    cf === STEERING_BASELINE.cumulativeFrequency ? 'unmoved' : `${cf > STEERING_BASELINE.cumulativeFrequency ? '+' : ''}${cf - STEERING_BASELINE.cumulativeFrequency}`,
  );

  const actorCounts = new Map<string, number>();
  for (const q of live) for (const a of recentActors([text(q)])) actorCounts.set(a, (actorCounts.get(a) ?? 0) + 1);
  const ranked = [...actorCounts.values()].sort((a, b) => b - a);
  const mentions = ranked.reduce((t, n) => t + n, 0);
  const topFive = mentions === 0 ? 0 : ranked.slice(0, 5).reduce((t, n) => t + n, 0) / mentions;
  line(
    'distinct actors',
    `${actorCounts.size}`,
    `${STEERING_BASELINE.distinctActors}`,
    'more',
    actorCounts.size === STEERING_BASELINE.distinctActors ? 'unmoved' : `${actorCounts.size > STEERING_BASELINE.distinctActors ? '+' : ''}${actorCounts.size - STEERING_BASELINE.distinctActors}`,
  );
  line(
    'top-5 actor concentration',
    `${(topFive * 100).toFixed(1)}%`,
    `${(STEERING_BASELINE.topFiveActors * 100).toFixed(1)}%`,
    'lower',
    delta(topFive, STEERING_BASELINE.topFiveActors),
  );

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
