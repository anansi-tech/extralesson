// A SET WRITTEN AS A CONDITION CANNOT BE TYPED INTO A BOX.
//
// {x in N : 1 <= x <= 12} is a predicate, not a list of values, so the typed
// input has nothing to put in boxes — and the characters are not on a phone
// keyboard either. Measured against the live bank, the keys in this shape
// reject every plausible student answer, including the correct enumeration and
// the same set typed in ASCII; the two that pass do so by accidental word
// overlap, which is a coin toss rather than marking.
//
// In the exam the student WRITES this notation by hand. Self-marking against
// the revealed answer is both the honest treatment and the faithful one.
//
// Run: pnpm tsx scripts/repair-set-builder-slots.ts [--apply]
import 'dotenv/config';
import { dbConnect, Question } from '@/lib/db';
import { isSetBuilder } from '@/lib/grade/input-shape';

async function main() {
  const apply = process.argv.includes('--apply');
  await dbConnect();
  const qs = await Question.find({ status: { $ne: 'retired' }, kind: 'structured' }).lean<any[]>();

  let found = 0;
  for (const q of qs) {
    const hits: string[] = [];
    for (const p of q.parts ?? []) {
      for (const s of p.slots ?? []) {
        if ((s.response_mode ?? 'answer') !== 'answer') continue;
        if (!s.answer || !isSetBuilder(String(s.answer))) continue;
        hits.push(`${p.label}.${s.label}`);
      }
    }
    if (hits.length === 0) continue;
    found += hits.length;
    const marks = (q.rubric ?? []).filter((r: any) => hits.includes(r.slot_ref)).length;
    console.log(`${String(q._id).slice(-6)} ${q.status}  ${hits.join(', ')}  (${marks} mark(s) become self-marked)`);

    if (!apply) continue;
    const doc = await Question.findById(q._id);
    for (const p of doc.parts ?? []) {
      for (const s of p.slots ?? []) {
        if (hits.includes(`${p.label}.${s.label}`)) s.response_mode = 'explain';
      }
    }
    await doc.save();
  }

  console.log(`\n${found} slot(s) ${apply ? 'moved to self-marking' : 'would move to self-marking (dry run)'}.`);
  process.exit(0);
}

main();
