// A DECLARED FORM THAT NOTHING MARKS.
//
// R1.7 §B4 gives the form its own mark and the generation contract has asked
// for that row since v37, but nothing enforced it — so the model complied about
// half the time on every prompt version since. 129 of the 256 slots declaring
// an answer_format had no row paying for it, which meant missing the form cost
// no marks and still failed the answer: "9 out of 9" printed beside "Not
// quite" (c0c05d). The validator rejects it now; this repairs what is already
// in the bank.
//
// Three paths, and only two of them are mechanical:
//   RELABEL  a row on that slot already marks the form in its criterion — set
//            for_format on it. No marks move.
//   DROP     nothing in the question asks for a form. The declaration was
//            decoration; remove it. No marks move.
//   AUTHOR   the question DOES demand the form and no row covers it. That needs
//            a mark, which changes what the question is worth, so it is
//            reported and left alone.
//
// Run: pnpm tsx scripts/repair-unpaid-formats.ts [--apply]
import 'dotenv/config';
import { dbConnect, Question } from '@/lib/db';

// A criterion already marking the form: relabelling it costs nothing.
const FORM_ROW =
  /correct to|significant figure|decimal place|standard form|lowest terms|simplest form|exact form|nearest|whole number|express(es|ed)? .*(form|figures|places)|round(s|ed|ing)?\b/i;
// Wording that DEMANDS a form, so a mark ought to be on offer for it.
const DEMANDS =
  /correct to|significant figure|decimal place|standard form|lowest terms|simplest form|exact form|nearest|whole number/i;

async function main() {
  const apply = process.argv.includes('--apply');
  await dbConnect();
  const qs = await Question.find({ status: { $ne: 'retired' } }).lean<any[]>();

  const relabel: string[] = [];
  const drop: string[] = [];
  const author: string[] = [];
  const touched = new Map<string, { relabel: string[]; drop: string[] }>();

  for (const q of qs) {
    for (const p of q.parts ?? []) {
      for (const sl of p.slots ?? []) {
        if ((sl.response_mode ?? 'answer') !== 'answer' || !sl.answer_format) continue;
        const ref = `${p.label}.${sl.label}`;
        const rows = (q.rubric ?? []).filter((r: any) => r.slot_ref === ref);
        if (rows.some((r: any) => r.for_format)) continue;

        const id = String(q._id);
        const row = touched.get(id) ?? { relabel: [], drop: [] };

        // An MCQ is marked by the option its answer_key names. It has no rubric
        // rows, so nothing can pay for a form — and nothing reads the format
        // either, since no answer is typed. The declaration is inert: drop it.
        if (q.kind === 'mcq') {
          drop.push(`${id.slice(-6)} ${ref} ${sl.answer_format} (mcq — inert)`);
          row.drop.push(ref);
          touched.set(id, row);
          continue;
        }
        const formRow = rows.find((r: any) => FORM_ROW.test(r.criterion));
        const asked = DEMANDS.test(`${sl.prompt ?? ''} ${p.prompt ?? ''} ${q.stem ?? ''}`);

        if (formRow) {
          relabel.push(`${id.slice(-6)} ${ref} ${sl.answer_format} -> ${formRow.code}`);
          row.relabel.push(`${ref}|${formRow.code}`);
        } else if (asked) {
          const marks = rows.reduce((n: number, r: any) => n + r.mark_value, 0);
          author.push(`${id.slice(-6)} ${ref} ${sl.answer_format}  slot carries ${marks} mark(s)  "${String(sl.prompt ?? p.prompt).replace(/\s+/g, ' ').slice(0, 58)}"`);
          continue;
        } else {
          drop.push(`${id.slice(-6)} ${ref} ${sl.answer_format}`);
          row.drop.push(ref);
        }
        touched.set(id, row);
      }
    }
  }

  console.log(`RELABEL an existing row  : ${relabel.length}`);
  console.log(`DROP the declaration     : ${drop.length}`);
  console.log(`AUTHOR a new mark        : ${author.length}   <- not mechanical`);
  for (const a of author) console.log(`    ${a}`);

  if (apply) {
    let changed = 0;
    for (const [id, work] of touched) {
      const doc = await Question.findById(id);
      for (const pair of work.relabel) {
        const [ref, code] = pair.split('|');
        const r = doc.rubric.find((x: any) => x.slot_ref === ref && x.code === code);
        if (r) r.for_format = true;
      }
      for (const ref of work.drop) {
        const [pl, sl] = ref.split('.');
        const slot = doc.parts.find((p: any) => p.label === pl)?.slots.find((s: any) => s.label === sl);
        if (slot) slot.answer_format = undefined;
      }
      await doc.save();
      changed++;
    }
    console.log(`\n${changed} question(s) updated.`);
  } else {
    console.log('\n(dry run)');
  }
  process.exit(0);
}

main();
