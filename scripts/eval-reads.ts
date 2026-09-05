// The reading eval on its own: page loss over the golden photographs, and the
// calibration cases in calibration/reads/. Run: pnpm tsx scripts/eval-reads.ts [runs]
import 'dotenv/config';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { goldenSetExists, loadGoldenSet } from './golden-set';
import { dbConnect, Question } from '@/lib/db';
import { transcribeWorking, linesForSlot, type TranscriptionResult } from '@/lib/grade/transcribe';
import { markableSlots } from '@/lib/grade/mark';
import { provenance, writeResults } from './eval-provenance';

const GOLDEN = join(process.cwd(), 'design', 'golden');
const CASES = join(process.cwd(), 'calibration', 'reads');

interface ReadCase {
  id: string;
  question_id: string;
  required: { part_label: string; text: string }[];
  forbidden?: string[];
  /** A known limit of the reader: the case is expected to FAIL, and passing fails the gate — the note is stale. */
  expected_fail?: boolean;
}

const normalise = (s: string) =>
  s.toLowerCase().replace(/[$\\,\s]/g, '').replace(/[÷]/g, '/').replace(/[×·]/g, 'x').replace(/[−–—]/g, '-');

async function read(imagePath: string, questionId: string): Promise<TranscriptionResult | null> {
  const q = await Question.findById(questionId).select('parts').lean<{ parts?: never[] } | null>();
  if (!q) return null;
  const image = readFileSync(imagePath);
  try {
    const out = await transcribeWorking({
      image: new Uint8Array(image),
      contentType: imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg',
      slotRefs: markableSlots(q.parts ?? []),
    });
    return out.transcription;
  } catch {
    return null;
  }
}

function passes(t: TranscriptionResult, c: ReadCase): { ok: boolean; why: string } {
  for (const line of c.required) {
    const got = linesForSlot(t, line.part_label).map(normalise);
    if (!got.includes(normalise(line.text))) return { ok: false, why: `missing for (${line.part_label}): ${line.text} — read: ${got.join(' | ') || 'nothing'}` };
  }
  const all = normalise(t.lines.map((l) => l.text).join(' '));
  for (const f of c.forbidden ?? []) if (all.includes(normalise(f))) return { ok: false, why: `repaired toward ${f}` };
  return { ok: true, why: '' };
}

async function main() {
  await dbConnect();
  const runs = Number(process.argv[2] ?? 3);
  if (!goldenSetExists()) {
    console.error('No golden set: design/golden/set.json and review.json are required. The gate FAILS.');
    process.exit(1);
  }
  const photos = loadGoldenSet().inputs.filter((e) => e.mode === 'photo' && e.image);
  const golden = photos.filter((e) => existsSync(join(GOLDEN, e.image!)));
  const fieldMissing = photos.filter((e) => !existsSync(join(GOLDEN, e.image!)) && e.image!.startsWith('field/')).map((e) => e.id);
  if (fieldMissing.length) console.log(`field page(s) whose image is not on this machine, skipped: ${fieldMissing.join(', ')}`);
  const cases: ReadCase[] = readdirSync(CASES)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(CASES, f), 'utf8')) as ReadCase);

  const results: { run: number; lost: number; of: number; verdicts: string[] }[] = [];
  for (let run = 1; run <= runs; run++) {
    let lost = 0;
    for (const e of golden) if (!(await read(join(GOLDEN, e.image!), e.question_id))) lost++;
    const verdicts: string[] = [];
    for (const c of cases) {
      const image = join(CASES, `${c.id}.jpg`);
      if (!existsSync(image)) {
        verdicts.push(`${c.id}: NO IMAGE`);
        continue;
      }
      const t = await read(image, c.question_id);
      if (!t) {
        verdicts.push(`${c.id}: UNREAD`);
        continue;
      }
      const v = passes(t, c);
      // An expected failure that still fails is the reader as documented; one
      // that passes means the reader moved and the case must be re-judged.
      const asExpected = c.expected_fail ? !v.ok : v.ok;
      verdicts.push(`${c.id}: ${asExpected ? (c.expected_fail ? 'EXPECTED FAIL' : 'PASS') : c.expected_fail ? 'UNEXPECTED PASS — re-judge the case' : `FAIL — ${v.why}`}`);
    }
    console.log(`run ${run}: page loss ${lost}/${golden.length} · ${verdicts.join(' · ')}`);
    results.push({ run, lost, of: golden.length, verdicts });
  }
  // The bar: no page lost on any run, and every calibration case passing on
  // every run. A case with no image is a missing golden file, and fails too.
  const clean = results.every((r) => r.lost === 0 && r.verdicts.every((v) => v.includes(': PASS') || v.includes(': EXPECTED FAIL')));
  const file = writeResults('eval-reads', { ...(await provenance()), golden_pages: golden.length, field_missing: fieldMissing, cases: cases.map((c) => c.id), runs: results, passes: clean });
  console.log(`${clean ? 'PASS' : 'BELOW GATE'} — no page lost and every case as expected, on every run. results: ${file}`);
  process.exit(clean ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
