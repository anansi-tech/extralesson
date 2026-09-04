// THE GATE. Nothing ships to a student before this passes.
//
// R2 §6. Two failures, measured separately because they are independent:
// reading the page, and judging what is on it. Both are measured on OUR input —
// the public handwriting benchmarks are single expressions from stroke data and
// this feature only ever sees multi-line working photographed on lined paper.
//
// Reading is scored on the photographed half of the golden set, SPLIT BY WRITER:
// the founder writes like a maths teacher and the users are teenagers, so a
// threshold calibrated on one neat hand is a threshold that fails on the first
// student who writes like a student. The §4.4 confidence threshold comes from
// the confidence buckets printed here — the point where the model's own
// confidence stops predicting whether it read the line correctly.
//
// Marking is scored per RUBRIC ROW, because a mark is the unit CXC awards.
// Gate: >90% agreement overall and zero false awards on CAO rows, reported
// split by profile and by whether the row was follow-through.
//
// Run: pnpm tsx scripts/eval-marker.ts
import 'dotenv/config';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { goldenSetExists, loadGoldenSet } from './golden-set';
import { markMethod, type MethodDecision } from '@/lib/grade/mark-method';
import { dbConnect, Question } from '@/lib/db';
import { transcribeWorking, linesForSlot } from '@/lib/grade/transcribe';
import { markableSlots } from '@/lib/grade/mark';
import { MARKER_VERSION } from '@/lib/grade/version';

import { isFollowThrough } from '@/lib/prompts/mark-scheme';
import { claimsFor } from '@/lib/grade/claim-template';

const DIR = join(process.cwd(), 'design', 'golden');
const GATE = 0.9;
// --reasoning: the rows on explain and show-that slots only (APPROVAL_LOG
// Batch 7), no reading pass, every disagreement printed with both reasons.
const REASONING = process.argv.includes('--reasoning');
const PAPER = new Set(['explain', 'show_that']);



/**
 * Compared the way the GRADER would see it, not character by character.
 *
 * The first version of this scored 53% and made the reader look unusable. It
 * was counting a division sign written as ÷ where the paper has /, a times sign
 * as × where the paper has x, and a trailing full stop — none of which is a
 * misreading, and none of which would change a mark. An eval that measures
 * formatting and reports it as accuracy is worse than no eval: it would have
 * killed a feature that works.
 */
function normalise(s: string): string {
  return s
    .toLowerCase()
    .replace(/[$\\]/g, '')
    .replace(/[÷]/g, '/')
    .replace(/[×·]/g, 'x')
    .replace(/[−–—]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/\s*([(),])\s*/g, '$1')
    .replace(/[.,;:]+$/, '')
    .trim();
}

/**
 * Character error rate, the metric handwriting recognition is actually scored
 * on — and the reason it is here rather than exact-match alone.
 *
 * Exact-match says a line is wrong if one digit is wrong, which is true and
 * useless: it cannot tell "8.4 x 10^6 read as 10^7", which changes a mark, from
 * "(5, 3) read as (5,3)", which changes nothing. Reported together, the pair
 * says both how often a line is perfect and how far off the rest are.
 */
function cer(truth: string, got: string): number {
  const a = truth;
  const b = got;
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return a.length === 0 ? (b.length === 0 ? 0 : 1) : d[a.length][b.length] / a.length;
}

async function main() {
  if (!goldenSetExists()) {
    console.log('No golden set yet.\n');
    console.log('  Expected: design/golden/set.json (the working) and review.json (the verdicts)');
    console.log('  Format:   design/golden/README.md');
    console.log('\nUntil they exist the gate cannot pass, so method marking stays off.');
    console.log(`MARKER_VERSION is ${MARKER_VERSION} — the pass has never run.`);
    process.exit(0);
  }

  await dbConnect();
  // One loader owns the input/verdict split, and refuses a set that is not
  // paired 1:1 or not approved.
  const golden = loadGoldenSet();
  const entries = golden.inputs;
  console.log(`ground truth approved by ${golden.approval.reviewer} on ${String(golden.approval.reviewed_at).slice(0, 10)}`);
  const photo = entries.filter((e) => e.mode === 'photo');
  const typed = entries.filter((e) => e.mode === 'typed');
  console.log(`golden set: ${entries.length} workings — ${photo.length} photographed, ${typed.length} typed`);
  console.log(`writers: ${[...new Set(entries.map((e) => e.writer))].join(', ')}\n`);

  // ---- READING ------------------------------------------------------------
  const byWriter = new Map<string, { lines: number; right: number; cer: number }>();
  const buckets = new Map<string, { n: number; right: number }>();
  // Photographs arrive one at a time; an entry without its image yet is not an
  // error, it is work still to do.
  const missing: string[] = [];
  /** Field pages live under design/golden/field/, which never leaves the machine that imported them. */
  const fieldMissing: string[] = [];
  const unread: string[] = [];
  /** Pages whose transcription differed from the truth, for attribution below. */
  const readDiffered = new Set<string>();

  for (const e of REASONING ? [] : photo) {
    const q = await Question.findById(e.question_id).select('parts').lean<any>();
    if (!q) {
      console.log(`  ${e.id}: question not in the bank, skipped`);
      continue;
    }
    const imagePath = join(DIR, e.image!);
    if (!existsSync(imagePath)) {
      (e.image!.startsWith('field/') ? fieldMissing : missing).push(e.id);
      continue;
    }
    const image = readFileSync(imagePath);
    let read;
    try {
      read = await transcribeWorking({
        image: new Uint8Array(image),
        contentType: e.image!.endsWith('.png') ? 'image/png' : 'image/jpeg',
        slotRefs: markableSlots(q.parts ?? []),
      });
    } catch {
      // One page that would not read is a measurement, not a crash: it is
      // reported and the other fourteen are still scored.
      unread.push(e.id);
      continue;
    }

    // Line-level: did we read this line, attributed to this part, correctly?
    const truth = e.transcript.map((t) => `${t.part_label ?? '-'}|${normalise(t.text)}`);
    const got = read.transcription.lines.map((l) => ({
      key: `${l.part_label ?? '-'}|${normalise(l.text)}`,
      confidence: l.confidence,
    }));
    const w = byWriter.get(e.writer) ?? { lines: 0, right: 0, cer: 0 };
    for (const g of got) {
      const hit = truth.includes(g.key);
      w.lines++;
      if (hit) w.right++;
      // Nearest truth line, so a misordered page is not scored as a misread.
      w.cer += Math.min(...truth.map((t) => cer(t.split('|')[1], g.key.split('|')[1])), 1);
      const band = g.confidence >= 0.9 ? '0.9+' : g.confidence >= 0.8 ? '0.8-0.9' : g.confidence >= 0.6 ? '0.6-0.8' : '<0.6';
      const b = buckets.get(band) ?? { n: 0, right: 0 };
      b.n++;
      if (hit) b.right++;
      buckets.set(band, b);
    }
    if (got.some((g) => !truth.includes(g.key)) || got.length !== truth.length) readDiffered.add(e.id);
    byWriter.set(e.writer, w);
  }

  if (missing.length > 0) {
    console.log(`READING — ${missing.length} of ${photo.length} photograph(s) not taken yet: ${missing.join(', ')}\n`);
  }
  if (fieldMissing.length > 0) {
    console.log(`READING — ${fieldMissing.length} field page(s) whose image is not on this machine, skipped here and marked below: ${fieldMissing.join(', ')}\n`);
  }
  if (unread.length > 0) {
    console.log(`READING — ${unread.length} photograph(s) the reader could not return: ${unread.join(', ')}\n`);
  }
  if (byWriter.size > 0) {
    console.log('READING — line accuracy by writer');
    for (const [writer, r] of [...byWriter].sort()) {
      console.log(
        `   ${writer.padEnd(10)} exact ${String(r.right + '/' + r.lines).padEnd(7)} ${String(((100 * r.right) / r.lines).toFixed(0) + '%').padStart(4)}` +
          `   character error ${((100 * r.cer) / r.lines).toFixed(1)}%`,
      );
    }
    const all = [...byWriter.values()].reduce(
      (a, b) => ({ lines: a.lines + b.lines, right: a.right + b.right, cer: a.cer + b.cer }),
      { lines: 0, right: 0, cer: 0 },
    );
    const spread = [...byWriter.values()].map((r) => r.right / r.lines);
    console.log(`   overall    exact ${all.right}/${all.lines}  ${((100 * all.right) / all.lines).toFixed(0)}%  character error ${((100 * all.cer) / all.lines).toFixed(1)}%` +
      (spread.length > 1 ? `  · spread ${(100 * Math.min(...spread)).toFixed(0)}–${(100 * Math.max(...spread)).toFixed(0)}%` : ''));

    console.log('\nREADING — accuracy by the model\'s own confidence (this sets the §4.4 threshold)');
    for (const band of ['0.9+', '0.8-0.9', '0.6-0.8', '<0.6']) {
      const b = buckets.get(band);
      if (!b) continue;
      console.log(`   ${band.padEnd(8)} ${b.right}/${b.n}  ${((100 * b.right) / b.n).toFixed(0)}%`);
    }
    console.log('   Set the threshold at the lowest band that still reads accurately.');
  } else if (photo.length > 0) {
    console.log('READING — no photographs to read yet, so the threshold cannot be set.');
  }

  // ---- MARKING ------------------------------------------------------------
  //
  // Scored on the 128 rows David judged — the rows a photograph could actually
  // decide. The 30 questions carry 220 reachable rows in total, and every
  // figure below is over the 128, never the 220.
  //
  // FIVE RUNS, GATED ON THE WORST. The marker returns different verdicts for
  // the same working between runs and temperature is not a setting a reasoning
  // model accepts, so a single pass cannot decide anything: one run said 93%
  // and the next said 91%. A gate a re-run can flip is not a gate.
  const RUNS = 5;
  console.log(`\nMARKING — ${RUNS} runs, gated on the worst. Agreement is over the 128 rows in`);
  console.log('contention, not the 220 reachable rows.');

  interface RunStats {
    n: number;
    agree: number;
    byProfile: Map<string, { n: number; agree: number }>;
    ft: { n: number; agree: number };
    plain: { n: number; agree: number };
    falseAwardCao: number;
    falseAwardMethod: number;
    withheldShouldAward: number;
    misread: number;
    lines: string[];
  }

  async function runMarking(): Promise<RunStats> {
    const st: RunStats = {
      n: 0, agree: 0, byProfile: new Map(), ft: { n: 0, agree: 0 }, plain: { n: 0, agree: 0 },
      falseAwardCao: 0, falseAwardMethod: 0, withheldShouldAward: 0, misread: 0, lines: [],
    };
    // A small pool: the wall clock is thirty calls a run, five runs deep.
    const queue = [...entries];
    const workers = Array.from({ length: 4 }, async () => {
      for (;;) {
        const e = queue.shift();
        if (!e) return;
        const truth = golden.verdicts.get(e.id)!;
        if (truth.length === 0) continue;
        const q = await Question.findById(e.question_id).lean<any>();
        if (!q) continue;
        const paperRefs = new Set(
          (q.parts ?? []).flatMap((p: any) => (p.slots ?? []).filter((sl: any) => PAPER.has(sl.response_mode)).map((sl: any) => `${p.label}.${sl.label}`)),
        );
        const inScope = (code: string) => !REASONING || paperRefs.has((q.rubric ?? []).find((r: any) => r.code === code)?.slot_ref);
        const rows = (q.rubric ?? []).filter((r: any) => truth.some((t) => t.code === r.code) && inScope(r.code));
        if (rows.length === 0) continue;

        const workingByPart: Record<string, string[]> = {};
        for (const line of e.transcript) {
          const part = line.part_label ?? '';
          if (part) (workingByPart[part] ??= []).push(line.text);
        }

        let decisions: MethodDecision[] = [];
        try {
          const canonical = Object.fromEntries(
            (q.parts ?? []).flatMap((p: any) => (p.slots ?? []).map((s: any) => [`${p.label}.${s.label}`, s.answer ?? ''])),
          );
          decisions = (await markMethod({
            rows: claimsFor(rows, e.studentAnswers, canonical),
            workingByPart,
            typedAnswers: e.studentAnswers,
            workedSolution: q.worked_solution,
            questionStem: `${q.stimulus ?? ''} ${q.stem}`.trim(),
          })).decisions;
        } catch {
          /* counted as disagreement below */
        }

        const misread = e.mode === 'photo' && readDiffered.has(e.id);
        for (const t of truth) {
          if (!inScope(t.code)) continue;
          const got = decisions.find((d) => d.code === t.code);
          const row = rows.find((r: any) => r.code === t.code);
          const isCao = row ? /\bCAO\b/.test(row.criterion) : false;
          st.n++;
          const ok = got ? got.awarded === t.awarded : false;
          if (ok) st.agree++;
          else {
            if (misread) st.misread++;
            if (got?.awarded && !t.awarded) {
              // CAO is the deterministic grader's territory and a false award
              // there is a hard fail; a method-row false award is tolerable and
              // tracked. earnableByMethod excludes CAO upstream, so this counter
              // exists to prove that holds rather than to assume it.
              if (isCao) st.falseAwardCao++;
              else st.falseAwardMethod++;
            }
            if (!got?.awarded && t.awarded) st.withheldShouldAward++;
            st.lines.push(
              `${e.id}/${t.code} truth ${t.awarded ? 'award' : 'withhold'} got ${got ? (got.awarded ? 'award' : 'withhold') : 'nothing'}` +
                (REASONING ? `\n         review: ${t.reason ?? '—'}\n         marker: ${got?.reason ?? '—'}` : ''),
            );
          }
          const prof = row?.profile ?? '?';
          const p = st.byProfile.get(prof) ?? { n: 0, agree: 0 };
          p.n++; if (ok) p.agree++;
          st.byProfile.set(prof, p);
          const bucket = row && isFollowThrough(row.criterion) ? st.ft : st.plain;
          bucket.n++; if (ok) bucket.agree++;
        }
      }
    });
    await Promise.all(workers);
    return st;
  }

  const runs: RunStats[] = [];
  for (let i = 1; i <= RUNS; i++) {
    const r = await runMarking();
    runs.push(r);
    console.log(`   run ${i}: ${r.agree}/${r.n} ${((100 * r.agree) / r.n).toFixed(0)}%` +
      `  false awards CAO ${r.falseAwardCao} / method ${r.falseAwardMethod}` +
      `  withheld-should-award ${r.withheldShouldAward}`);
    // Which rows, per run, so a case can be followed across runs and not
    // only in the worst one.
    console.log(`      disagreed: ${r.lines.map((l) => l.split(' ')[0]).join(', ') || 'none'}`);
  }

  const spread = (pick: (r: RunStats) => number) => {
    const v = runs.map(pick).sort((a, b) => a - b);
    return { min: v[0], median: v[Math.floor(v.length / 2)], max: v[v.length - 1] };
  };
  const pct = (a: number, b: number) => (b ? ((100 * a) / b).toFixed(0) + '%' : '—');
  const ag = spread((r) => r.agree / r.n);
  const worst = runs.reduce((a, b) => (a.agree / a.n <= b.agree / b.n ? a : b));

  console.log(`\n   agreement       min ${(100 * ag.min).toFixed(0)}%  median ${(100 * ag.median).toFixed(0)}%  max ${(100 * ag.max).toFixed(0)}%   (n=${worst.n})`);
  for (const prof of [...worst.byProfile.keys()].sort()) {
    const sp = spread((r) => (r.byProfile.get(prof)?.agree ?? 0) / (r.byProfile.get(prof)?.n ?? 1));
    console.log(`   ${prof.padEnd(15)} min ${(100 * sp.min).toFixed(0)}%  median ${(100 * sp.median).toFixed(0)}%  max ${(100 * sp.max).toFixed(0)}%`);
  }
  const ftSp = spread((r) => r.ft.agree / r.ft.n);
  console.log(`   follow-through  min ${(100 * ftSp.min).toFixed(0)}%  median ${(100 * ftSp.median).toFixed(0)}%  max ${(100 * ftSp.max).toFixed(0)}%   (n=${worst.ft.n})`);
  const otherSp = spread((r) => r.plain.agree / r.plain.n);
  console.log(`   other rows      min ${(100 * otherSp.min).toFixed(0)}%  median ${(100 * otherSp.median).toFixed(0)}%  max ${(100 * otherSp.max).toFixed(0)}%   (n=${worst.plain.n})`);

  const caoSp = spread((r) => r.falseAwardCao);
  const methodSp = spread((r) => r.falseAwardMethod);
  const withheldSp = spread((r) => r.withheldShouldAward);
  console.log(`\n   false award, CAO row     min ${caoSp.min} median ${caoSp.median} max ${caoSp.max}   <- hard fail at any count`);
  console.log(`   false award, method row  min ${methodSp.min} median ${methodSp.median} max ${methodSp.max}   <- tolerable, tracked`);
  console.log(`   withheld when it should have awarded: min ${withheldSp.min} median ${withheldSp.median} max ${withheldSp.max}   (${pct(withheldSp.median, worst.n)} of rows)`);
  console.log('   The conservative direction is the one \u00a71.1 chose: a withheld row costs a');
  console.log('   mark the student earned; a false award gives one they did not. Today they earn');
  console.log('   no method marks at all on 424 of 427 questions.');
  console.log(`   disagreements traceable to a misread (worst run): ${worst.misread} of ${worst.n - worst.agree}`);

  const passes = ag.min > GATE && caoSp.max === 0;
  console.log(`\n   ${passes ? 'PASS' : 'BELOW GATE'} — worst of ${RUNS} runs must exceed ${GATE * 100}% with no CAO false award.`);
  console.log(`   worst run disagreements:`);
  for (const l of REASONING ? worst.lines : worst.lines.slice(0, 10)) console.log(`      ${l}`);

  process.exit(0);
}

main();
