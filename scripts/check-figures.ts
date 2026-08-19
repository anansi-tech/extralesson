// Does every figure fit on its own canvas?
//
// A circle question referred to an external point P that was drawn at x=708 on
// a 640px canvas: the tangents met further out than the figure was wide, so the
// student read about a point they could not see. That is invisible to the
// visual gate, which checks what the parameters say rather than where the ink
// lands.
//
// Renders every stored figure and reports anything outside its viewBox.
// Run: pnpm tsx scripts/check-figures.ts
import 'dotenv/config';
import { dbConnect, Question } from '@/lib/db';
import { renderVisual, type StoredVisual } from '@/lib/visuals';

// Rounding puts a chord end a fraction of a pixel past the edge; that is not a
// figure anyone can see is wrong.
const TOLERANCE = 2;

function overflow(svg: string): number {
  const vb = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  if (!vb) return 0;
  const [w, h] = [Number(vb[1]), Number(vb[2])];
  let worst = 0;
  const check = (v: number, max: number) => {
    if (v < 0) worst = Math.max(worst, -v);
    if (v > max) worst = Math.max(worst, v - max);
  };
  for (const m of svg.matchAll(/\b(?:x|cx|x1|x2)="(-?[\d.]+)"/g)) check(Number(m[1]), w);
  for (const m of svg.matchAll(/\b(?:y|cy|y1|y2)="(-?[\d.]+)"/g)) check(Number(m[1]), h);
  for (const m of svg.matchAll(/points="([^"]+)"/g)) {
    for (const pair of m[1].trim().split(/\s+/)) {
      const [a, b] = pair.split(',').map(Number);
      if (Number.isFinite(a)) check(a, w);
      if (Number.isFinite(b)) check(b, h);
    }
  }
  return Math.round(worst);
}

async function main() {
  await dbConnect();
  const qs = await Question.find({
    status: { $in: ['draft', 'approved'] },
    'visual.template': { $exists: true },
  }).lean<{ _id: unknown; status: string; visual: StoredVisual }[]>();

  const bad: string[] = [];
  for (const q of qs) {
    let svg: string;
    try {
      svg = renderVisual(q.visual);
    } catch (err) {
      bad.push(`${String(q._id)} [${q.status}] ${q.visual.template}: render threw — ${(err as Error).message}`);
      continue;
    }
    const off = overflow(svg);
    if (off > TOLERANCE) {
      bad.push(`${String(q._id)} [${q.status}] ${q.visual.template}: ${off}px outside the canvas`);
    }
  }

  console.log(`${qs.length} live figures checked`);
  if (bad.length === 0) {
    console.log('all fit on their canvas');
    process.exit(0);
  }
  console.log(`${bad.length} draw outside it:`);
  for (const b of bad) console.log('  ' + b);
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
