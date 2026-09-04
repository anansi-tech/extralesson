// The reading eval on its own: page loss over the golden photographs, and the
// calibration cases in calibration/reads/. Run: pnpm tsx scripts/eval-reads.ts [runs]
import 'dotenv/config';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { goldenSetExists, loadGoldenSet } from './golden-set';
import { dbConnect, Question } from '@/lib/db';
import { transcribeWorking, linesForSlot, type TranscriptionResult } from '@/lib/grade/transcribe';
import { markableSlots } from '@/lib/grade/mark';

const GOLDEN = join(process.cwd(), 'design', 'golden');
const CASES = join(process.cwd(), 'calibration', 'reads');

interface ReadCase {
  id: string;
  question_id: string;
  required: { part_label: string; text: string }[];
  forbidden?: string[];
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
  const photos = goldenSetExists() ? loadGoldenSet().inputs.filter((e) => e.mode === 'photo' && e.image) : [];
  const golden = photos.filter((e) => existsSync(join(GOLDEN, e.image!)));
  const fieldMissing = photos.filter((e) => !existsSync(join(GOLDEN, e.image!)) && e.image!.startsWith('field/')).map((e) => e.id);
  if (fieldMissing.length) console.log(`field page(s) whose image is not on this machine, skipped: ${fieldMissing.join(', ')}`);
  const cases: ReadCase[] = readdirSync(CASES)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(CASES, f), 'utf8')) as ReadCase);

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
      verdicts.push(`${c.id}: ${v.ok ? 'PASS' : `FAIL — ${v.why}`}`);
    }
    console.log(`run ${run}: page loss ${lost}/${golden.length} · ${verdicts.join(' · ')}`);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
