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
import { transcribeWorking, linesForSlot } from '@/lib/grade/transcribe';
import { markableSlots } from '@/lib/grade/mark';
import { MARKER_VERSION } from '@/lib/grade/version';
import { earnableByMethod } from '@/lib/grade/method-marks';
import { isFollowThrough } from '@/lib/prompts/mark-scheme';

const DIR = join(process.cwd(), 'design', 'golden');
const GATE = 0.9;

interface Entry {
  id: string;
  question_id: string;
  writer: string;
  mode: 'photo' | 'typed';
  image?: string;
  transcript: { part_label: string | null; text: string }[];
  marks: { code: string; awarded: boolean }[];
}

/** Compared the way the grader would see it, not character by character. */
function normalise(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').replace(/[$\\]/g, '').trim();
}

async function main() {
  const setPath = join(DIR, 'set.json');
  if (!existsSync(setPath)) {
    console.log('No golden set yet.\n');
    console.log('  Expected: design/golden/set.json');
    console.log('  Format:   design/golden/README.md');
    console.log('\nUntil it exists the gate cannot pass, so method marking stays off.');
    console.log(`MARKER_VERSION is ${MARKER_VERSION} — the pass has never run.`);
    process.exit(0);
  }

  await dbConnect();
  const entries: Entry[] = JSON.parse(readFileSync(setPath, 'utf8'));
  const photo = entries.filter((e) => e.mode === 'photo');
  const typed = entries.filter((e) => e.mode === 'typed');
  console.log(`golden set: ${entries.length} workings — ${photo.length} photographed, ${typed.length} typed`);
  console.log(`writers: ${[...new Set(entries.map((e) => e.writer))].join(', ')}\n`);

  // ---- READING ------------------------------------------------------------
  const byWriter = new Map<string, { lines: number; right: number }>();
  const buckets = new Map<string, { n: number; right: number }>();
  // Photographs arrive one at a time; an entry without its image yet is not an
  // error, it is work still to do.
  const missing: string[] = [];

  for (const e of photo) {
    const q = await Question.findById(e.question_id).select('parts').lean<any>();
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

    // Line-level: did we read this line, attributed to this part, correctly?
    const truth = e.transcript.map((t) => `${t.part_label ?? '-'}|${normalise(t.text)}`);
    const got = read.transcription.lines.map((l) => ({
      key: `${l.part_label ?? '-'}|${normalise(l.text)}`,
      confidence: l.confidence,
    }));
    const w = byWriter.get(e.writer) ?? { lines: 0, right: 0 };
    for (const g of got) {
      const hit = truth.includes(g.key);
      w.lines++;
      if (hit) w.right++;
      const band = g.confidence >= 0.9 ? '0.9+' : g.confidence >= 0.8 ? '0.8-0.9' : g.confidence >= 0.6 ? '0.6-0.8' : '<0.6';
      const b = buckets.get(band) ?? { n: 0, right: 0 };
      b.n++;
      if (hit) b.right++;
      buckets.set(band, b);
    }
    byWriter.set(e.writer, w);
  }

  if (missing.length > 0) {
    console.log(`READING — ${missing.length} of ${photo.length} photograph(s) not taken yet: ${missing.join(', ')}\n`);
  }
  if (byWriter.size > 0) {
    console.log('READING — line accuracy by writer');
    for (const [writer, r] of [...byWriter].sort()) {
      console.log(`   ${writer.padEnd(10)} ${r.right}/${r.lines}  ${((100 * r.right) / r.lines).toFixed(0)}%`);
    }
    const all = [...byWriter.values()].reduce((a, b) => ({ lines: a.lines + b.lines, right: a.right + b.right }), { lines: 0, right: 0 });
    const spread = [...byWriter.values()].map((r) => r.right / r.lines);
    console.log(`   overall    ${all.right}/${all.lines}  ${((100 * all.right) / all.lines).toFixed(0)}%` +
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
  console.log('\nMARKING');
  if (MARKER_VERSION === 'v0') {
    // Every row the marker WOULD be asked about, so the set can be sized before
    // the pass exists: rows deterministic marking cannot settle.
    let rows = 0;
    let followThrough = 0;
    const byProfile = new Map<string, number>();
    for (const e of entries) {
      const q = await Question.findById(e.question_id).select('parts rubric').lean<any>();
      if (!q) continue;
      for (const r of earnableByMethod(q as never, [])) {
        rows++;
        byProfile.set(r.profile, (byProfile.get(r.profile) ?? 0) + 1);
        if (isFollowThrough(r.criterion)) followThrough++;
      }
    }
    console.log(`   not enabled (MARKER_VERSION ${MARKER_VERSION}).`);
    console.log(`   the set covers ${rows} markable row(s): ` +
      [...byProfile].sort().map(([p, n]) => `${p} ${n}`).join(' · ') +
      ` · follow-through ${followThrough}`);
    console.log(`   gate: >${GATE * 100}% agreement, zero false awards on CAO rows.`);
  }
  process.exit(0);
}

main();
