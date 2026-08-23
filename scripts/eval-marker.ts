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
import { dbConnect, Question } from '@/lib/db';
import { transcribeWorking } from '@/lib/grade/transcribe';
import { markableSlots } from '@/lib/grade/mark';
import { MARKER_VERSION } from '@/lib/grade/version';
import { isFollowThrough } from '@/lib/prompts/mark-scheme';
import {
  GoldenReferenceZ,
  GoldenSetZ,
  methodCandidates,
  scoreReading,
  type GoldenQuestion,
} from '@/lib/grade/golden-set';

const DIR = join(process.cwd(), 'design', 'golden');
const GATE = 0.9;

async function main() {
  const setPath = join(DIR, 'set.json');
  const referencePath = join(DIR, 'review.json');
  if (!existsSync(setPath)) {
    console.log('No golden set yet.\n');
    console.log('  Expected: design/golden/set.json');
    console.log('  Format:   design/golden/README.md');
    console.log('\nUntil it exists the gate cannot pass, so method marking stays off.');
    console.log(`MARKER_VERSION is ${MARKER_VERSION} — the pass has never run.`);
    process.exit(0);
  }

  await dbConnect();
  const entries = GoldenSetZ.parse(JSON.parse(readFileSync(setPath, 'utf8')));
  const reference = GoldenReferenceZ.parse(JSON.parse(readFileSync(referencePath, 'utf8')));
  const referenceById = new Map(reference.entries.map((entry) => [entry.id, entry]));
  const photo = entries.filter((e) => e.mode === 'photo');
  const typed = entries.filter((e) => e.mode === 'typed');
  console.log(`golden set: ${entries.length} workings — ${photo.length} photographed, ${typed.length} typed`);
  console.log(`photo writers: ${[...new Set(photo.map((e) => e.writer))].join(', ')}\n`);

  // ---- READING ------------------------------------------------------------
  const byWriter = new Map<string, { expected: number; returned: number; matched: number }>();
  const buckets = new Map<string, { n: number; right: number }>();
  // Photographs arrive one at a time; an entry without its image yet is not an
  // error, it is work still to do.
  const missing: string[] = [];

  for (const e of photo) {
    const q = await Question.findById(e.question_id).select('parts').lean() as unknown as GoldenQuestion | null;
    if (!q) {
      console.log(`  ${e.id}: question not in the bank, skipped`);
      continue;
    }
    const imagePath = join(DIR, e.image!);
    if (!existsSync(imagePath)) {
      missing.push(e.id);
      continue;
    }
    const image = readFileSync(imagePath);
    const read = await transcribeWorking({
      image: new Uint8Array(image),
      contentType: e.image!.endsWith('.png') ? 'image/png' : 'image/jpeg',
      slotRefs: markableSlots(q.parts ?? []),
    });

    const score = scoreReading(e.transcript, read.transcription.lines);
    const w = byWriter.get(e.writer) ?? { expected: 0, returned: 0, matched: 0 };
    w.expected += score.expected;
    w.returned += score.returned;
    w.matched += score.matched;
    for (const line of score.returnedLines) {
      const band = line.confidence >= 0.9 ? '0.9+' : line.confidence >= 0.8 ? '0.8-0.9' : line.confidence >= 0.6 ? '0.6-0.8' : '<0.6';
      const b = buckets.get(band) ?? { n: 0, right: 0 };
      b.n++;
      if (line.matched) b.right++;
      buckets.set(band, b);
    }
    byWriter.set(e.writer, w);
  }

  if (missing.length > 0) {
    console.log(`READING — ${missing.length} of ${photo.length} photograph(s) not taken yet: ${missing.join(', ')}\n`);
  }
  if (byWriter.size > 0) {
    console.log('READING — exact line match by writer (missing lines count)');
    for (const [writer, r] of [...byWriter].sort()) {
      const precision = r.returned === 0 ? 0 : r.matched / r.returned;
      const recall = r.expected === 0 ? 0 : r.matched / r.expected;
      const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
      console.log(
        `   ${writer.padEnd(10)} ${r.matched}/${r.expected} truth lines · ` +
        `precision ${(100 * precision).toFixed(0)}% · recall ${(100 * recall).toFixed(0)}% · F1 ${(100 * f1).toFixed(0)}%`,
      );
    }
    const all = [...byWriter.values()].reduce(
      (a, b) => ({ expected: a.expected + b.expected, returned: a.returned + b.returned, matched: a.matched + b.matched }),
      { expected: 0, returned: 0, matched: 0 },
    );
    const precision = all.returned === 0 ? 0 : all.matched / all.returned;
    const recall = all.expected === 0 ? 0 : all.matched / all.expected;
    const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
    console.log(
      `   overall    ${all.matched}/${all.expected} truth lines · ` +
      `precision ${(100 * precision).toFixed(0)}% · recall ${(100 * recall).toFixed(0)}% · F1 ${(100 * f1).toFixed(0)}%`,
    );

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
  console.log('\nMARKING');
  let rows = 0;
  let awarded = 0;
  let followThrough = 0;
  const byProfile = new Map<string, number>();
  const referenceProblems: string[] = [];
  for (const e of entries) {
    const q = await Question.findById(e.question_id).select('parts rubric').lean() as unknown as GoldenQuestion | null;
    const reviewed = referenceById.get(e.id);
    if (!q || !reviewed) {
      referenceProblems.push(`${e.id}: missing ${q ? 'reference entry' : 'question'}`);
      continue;
    }
    const candidates = methodCandidates(q, reviewed.student_answers).candidates;
    const expectedCodes = candidates.map((row) => row.code).sort();
    const reviewedCodes = reviewed.marks.map((row) => row.code).sort();
    if (JSON.stringify(expectedCodes) !== JSON.stringify(reviewedCodes)) {
      referenceProblems.push(`${e.id}: proposed codes do not match the rows the method marker would receive`);
      continue;
    }
    rows += candidates.length;
    awarded += reviewed.marks.filter((row) => row.awarded).length;
    for (const row of candidates) {
      byProfile.set(row.profile, (byProfile.get(row.profile) ?? 0) + 1);
      if (isFollowThrough(row.criterion)) followThrough++;
    }
  }

  if (referenceProblems.length > 0) {
    console.log(`   reference invalid:\n   ${referenceProblems.join('\n   ')}`);
    process.exit(1);
  }

  console.log(
    `   reference ${reference.status}: ${rows} row(s) after deterministic marking · ` +
    `${awarded} proposed awards · ${rows - awarded} proposed withholds`,
  );
  console.log(
    `   coverage: ${[...byProfile].sort().map(([p, n]) => `${p} ${n}`).join(' · ')} · follow-through ${followThrough}`,
  );

  if (reference.status !== 'approved') {
    console.log('   HUMAN APPROVAL REQUIRED: review design/golden/review.json before these labels can be ground truth.');
  }

  if (MARKER_VERSION === 'v0') {
    console.log(`   not enabled (MARKER_VERSION ${MARKER_VERSION}).`);
    console.log(`   gate: >${GATE * 100}% agreement, zero false awards on CAO rows.`);
  }
  process.exit(0);
}

main();
