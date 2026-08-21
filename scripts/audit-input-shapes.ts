// WHAT INPUT EVERY AUTO-MARKED SLOT ACTUALLY WANTS.
//
// A single free-text box asks the student to type the answer as a string. That
// charges them for two things that are not mathematics: reaching a character
// the phone keyboard does not carry, and picking a delimiter the marker will
// accept. This counts, across the live bank, how often each answer shape comes
// up — so the input can be typed to match the shapes that are actually common
// rather than the ones that are easy to imagine.
//
// READ-ONLY. Run: pnpm tsx scripts/audit-input-shapes.ts
import 'dotenv/config';
import { dbConnect, Question } from '@/lib/db';
import { readInputShape, type InputShape } from '@/lib/grade/input-shape';

// Shapes whose value cannot be entered as one plain string without the student
// supplying structure themselves — a delimiter, a bracket, a layout.
const NEEDS_STRUCTURE = new Set<InputShape>([
  'list', 'roots', 'set', 'coordinate', 'column_vector', 'matrix', 'ratio',
]);

async function main() {
  await dbConnect();
  const qs = await Question.find({ status: { $ne: 'retired' }, kind: 'structured' })
    .select('parts status')
    .lean<any[]>();

  const rows: { shape: InputShape; boxes: number; ordered: boolean; answer: string }[] = [];
  for (const q of qs) {
    for (const p of q.parts ?? []) {
      for (const s of p.slots ?? []) {
        if ((s.response_mode ?? 'answer') !== 'answer') continue;
        if (!s.answer) continue;
        rows.push({ ...readInputShape(String(s.answer)), answer: String(s.answer) });
      }
    }
  }

  const byShape = new Map<InputShape, typeof rows>();
  for (const r of rows) {
    if (!byShape.has(r.shape)) byShape.set(r.shape, []);
    byShape.get(r.shape)!.push(r);
  }

  console.log(`\nAUTO-MARKED SLOTS IN THE LIVE BANK: ${rows.length}\n`);
  console.log('  shape           count    share   multi-box   example');
  console.log('  ' + '-'.repeat(84));
  const order = [...byShape.entries()].sort((a, b) => b[1].length - a[1].length);
  for (const [shape, list] of order) {
    const multi = list.filter((r) => r.boxes > 1).length;
    const pct = ((100 * list.length) / rows.length).toFixed(1) + '%';
    const eg = list[0].answer.replace(/\s+/g, ' ').slice(0, 40);
    console.log(
      `  ${shape.padEnd(15)} ${String(list.length).padStart(4)}   ${pct.padStart(6)}   ${String(multi).padStart(7)}     ${eg}`,
    );
  }

  const structured = rows.filter((r) => NEEDS_STRUCTURE.has(r.shape));
  const orderedMulti = rows.filter((r) => r.boxes > 1 && r.ordered);
  console.log(`\n  needs structure the student must type: ${structured.length} (${((100 * structured.length) / rows.length).toFixed(1)}%)`);
  console.log(`  more than one value in one box:        ${rows.filter((r) => r.boxes > 1).length}`);
  console.log(`  ...of which ORDER carries meaning:     ${orderedMulti.length}`);

  for (const shape of NEEDS_STRUCTURE) {
    const list = byShape.get(shape);
    if (!list?.length) continue;
    console.log(`\n  ${shape.toUpperCase()} — ${list.length} slot(s), up to ${Math.max(...list.map((r) => r.boxes))} values`);
    for (const r of list.slice(0, 4)) console.log(`     ${r.answer.replace(/\s+/g, ' ').slice(0, 70)}`);
  }
  process.exit(0);
}

main();
