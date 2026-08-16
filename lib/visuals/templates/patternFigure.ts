import { z } from 'zod';
import { INK, line, round, svgOpen, text } from '../svg';
import type { VisualTemplate } from '../types';

// Growing pattern of 2-4 figures made of dots or matchsticks — the visual
// pairing for the complete-the-table archetype. The load-bearing invariant:
// the number of drawn elements in each figure group exactly equals counts[i].
export const PatternFigureParamsZ = z.object({
  // 'concentric-circles' is the target/ripple pattern: figure n is n circles
  // of radii 1..n about a common centre, a dot at the centre and four on each
  // circumference, with the region outside the innermost circle shaded. It
  // grows by a DRAWN RING rather than by loose elements, which is why neither
  // the dot nor the matchstick arrangements can express it.
  kind: z.enum(['dots', 'matchsticks', 'concentric-circles']),
  arrangement: z.enum(['triangle', 'square', 'L', 'row', 'cross']),
  figure_numbers: z.array(z.number().int().min(1).max(30)).min(2).max(4),
  counts: z.array(z.number().int().min(1).max(60)).min(2).max(4),
});

export type PatternFigureParams = z.infer<typeof PatternFigureParamsZ>;

type Arrangement = PatternFigureParams['arrangement'];
type Pt = [number, number]; // unit coords, y up
type Seg = [number, number, number, number];

// Exactly n dot positions in the stated schematic arrangement.
function dotPositions(arrangement: Arrangement, n: number): Pt[] {
  const pts: Pt[] = [];
  switch (arrangement) {
    case 'row':
      for (let i = 0; i < n; i++) pts.push([i % 10, Math.floor(i / 10)]);
      break;
    case 'triangle':
      // rows of 1, 2, 3, ... dots, apex at the top
      for (let r = 0; pts.length < n; r++) {
        for (let j = 0; j <= r && pts.length < n; j++) pts.push([j - r / 2, -r]);
      }
      break;
    case 'square': {
      const side = Math.ceil(Math.sqrt(n));
      for (let r = 0; pts.length < n; r++) {
        for (let j = 0; j < side && pts.length < n; j++) pts.push([j, r]);
      }
      break;
    }
    case 'L': {
      const a = Math.ceil((n + 1) / 2); // vertical arm (includes the corner)
      for (let i = 0; i < a; i++) pts.push([0, i]);
      for (let j = 1; j <= n - a; j++) pts.push([j, 0]);
      break;
    }
    case 'cross':
      pts.push([0, 0]);
      for (let d = 1; pts.length < n; d++) {
        const arm: Pt[] = [[0, d], [d, 0], [0, -d], [-d, 0]];
        for (const p of arm) if (pts.length < n) pts.push(p);
      }
      break;
  }
  return pts.slice(0, n);
}

// Exactly n matchstick segments in the stated schematic arrangement.
function stickSegments(arrangement: Arrangement, n: number): Seg[] {
  const segs: Seg[] = [];
  const add = (x1: number, y1: number, x2: number, y2: number) => segs.push([x1, y1, x2, y2]);
  switch (arrangement) {
    case 'row':
      // vertical sticks in a row (tally style), wrapping after 12
      for (let i = 0; i < n; i++) {
        const col = i % 12;
        const row = Math.floor(i / 12);
        add(col * 0.6, row * 1.4, col * 0.6, row * 1.4 + 1);
      }
      break;
    case 'square':
      // strip of unit squares sharing sides: 4, 7, 10, ...
      add(0, 0, 0, 1);
      add(0, 1, 1, 1);
      add(0, 0, 1, 0);
      add(1, 0, 1, 1);
      for (let k = 1; segs.length < n; k++) {
        add(k, 1, k + 1, 1);
        add(k, 0, k + 1, 0);
        add(k + 1, 0, k + 1, 1);
      }
      break;
    case 'triangle': {
      // strip of triangles sharing sides: 3, 5, 7, ...
      const B = (j: number): Pt => [j, 0];
      const T = (j: number): Pt => [j + 0.5, 1];
      add(...B(0), ...B(1));
      add(...B(0), ...T(0));
      add(...T(0), ...B(1));
      for (let j = 0; segs.length < n; j++) {
        add(...B(j + 1), ...T(j + 1)); // inverted triangle j
        add(...T(j), ...T(j + 1));
        add(...B(j + 1), ...B(j + 2)); // upright triangle j + 1
        add(...T(j + 1), ...B(j + 2));
      }
      break;
    }
    case 'L': {
      const a = Math.ceil(n / 2); // vertical arm
      for (let i = 0; i < a; i++) add(0, i, 0, i + 1);
      for (let j = 0; j < n - a; j++) add(j, 0, j + 1, 0);
      break;
    }
    case 'cross':
      for (let d = 0; segs.length < n; d++) {
        add(0, d, 0, d + 1);
        add(d, 0, d + 1, 0);
        add(0, -d, 0, -d - 1);
        add(-d, 0, -d - 1, 0);
      }
      break;
  }
  return segs.slice(0, n);
}

const W = 640;
const H = 260;
const PAD = 30;

function renderSvg(p: PatternFigureParams): string {
  const nFig = p.figure_numbers.length;
  const slotW = (W - 2 * PAD) / nFig;
  const bottom = H - 55;

  if (p.kind === 'concentric-circles') return renderCircles(p);

  // Per-figure elements in unit coordinates.
  const figures = p.figure_numbers.map((_, i) => {
    const n = p.counts[i] ?? 1;
    if (p.kind === 'dots') {
      const dots = dotPositions(p.arrangement, n);
      const xs = dots.map((d) => d[0]);
      const ys = dots.map((d) => d[1]);
      return { dots, segs: [] as Seg[], xs, ys };
    }
    const segs = stickSegments(p.arrangement, n);
    const xs = segs.flatMap((s) => [s[0], s[2]]);
    const ys = segs.flatMap((s) => [s[1], s[3]]);
    return { dots: [] as Pt[], segs, xs, ys };
  });

  // Shared unit size so the figures are comparable, bounded to fit the slots.
  let u = 22;
  for (const f of figures) {
    const w = Math.max(...f.xs) - Math.min(...f.xs);
    const h = Math.max(...f.ys) - Math.min(...f.ys);
    if (w > 0) u = Math.min(u, (slotW - 28) / w);
    if (h > 0) u = Math.min(u, (bottom - PAD - 10) / h);
  }
  u = Math.max(u, 3);

  const parts: string[] = [svgOpen(W, H)];
  figures.forEach((f, i) => {
    const cx = PAD + slotW * (i + 0.5);
    const minX = Math.min(...f.xs);
    const maxX = Math.max(...f.xs);
    const minY = Math.min(...f.ys);
    const midX = (minX + maxX) / 2;
    const px = (x: number) => cx + (x - midX) * u;
    const py = (y: number) => bottom - (y - minY) * u;
    parts.push(`<g data-figure="${p.figure_numbers[i]}">`);
    for (const s of f.segs) parts.push(line(px(s[0]), py(s[1]), px(s[2]), py(s[3])));
    for (const d of f.dots) {
      parts.push(`<circle cx="${round(px(d[0]))}" cy="${round(py(d[1]))}" r="${round(Math.min(4, u * 0.3))}" fill="${INK}" />`);
    }
    parts.push(text(cx, H - 18, `Figure ${p.figure_numbers[i]}`, { size: 13 }));
    parts.push('</g>');
  });
  parts.push('</svg>');
  return parts.join('');
}

/** Rings about a common centre: figure n carries n circles of radii 1..n. */
export function ringsFor(figureNumber: number): number {
  return figureNumber;
}

/** A centre dot and four on each circumference: 4n + 1 for n rings. */
export function circleDotCount(figureNumber: number): number {
  return 4 * ringsFor(figureNumber) + 1;
}

function renderCircles(p: PatternFigureParams): string {
  const nFig = p.figure_numbers.length;
  const slotW = (W - 2 * PAD) / nFig;
  const maxRings = Math.max(...p.figure_numbers);
  const u = Math.min((slotW - 20) / (2 * maxRings), (H - 70) / (2 * maxRings));
  const cy = (H - 45) / 2 + 10;

  const parts: string[] = [svgOpen(W, H)];
  p.figure_numbers.forEach((fig, i) => {
    const cx = PAD + slotW * (i + 0.5);
    const rings = ringsFor(fig);
    const outer = rings * u;
    parts.push(`<g data-figure="${fig}">`);
    // Everything outside the innermost circle is shaded, which is the region
    // the question asks about; the first figure has no such region.
    if (rings > 1) {
      parts.push(
        `<path d="M ${round(cx - outer)} ${round(cy)} a ${round(outer)} ${round(outer)} 0 1 0 ${round(2 * outer)} 0 a ${round(outer)} ${round(outer)} 0 1 0 ${round(-2 * outer)} 0 Z M ${round(cx - u)} ${round(cy)} a ${round(u)} ${round(u)} 0 1 1 ${round(2 * u)} 0 a ${round(u)} ${round(u)} 0 1 1 ${round(-2 * u)} 0 Z" fill="#E4DFD5" fill-rule="evenodd" stroke="none" />`,
      );
    }
    for (let k = 1; k <= rings; k++) {
      parts.push(
        `<circle cx="${round(cx)}" cy="${round(cy)}" r="${round(k * u)}" fill="none" stroke="${INK}" stroke-width="1.5" />`,
      );
    }
    // The diameters the paper rules through every figure.
    parts.push(line(cx - outer, cy, cx + outer, cy));
    parts.push(line(cx, cy - outer, cx, cy + outer));
    const dot = (x: number, y: number) =>
      `<circle cx="${round(x)}" cy="${round(y)}" r="${round(Math.min(4, u * 0.28))}" fill="${INK}" />`;
    parts.push(dot(cx, cy));
    for (let k = 1; k <= rings; k++) {
      parts.push(dot(cx + k * u, cy), dot(cx - k * u, cy), dot(cx, cy + k * u), dot(cx, cy - k * u));
    }
    parts.push(text(cx, H - 18, `Figure ${fig}`, { size: 13 }));
    parts.push('</g>');
  });
  parts.push('</svg>');
  return parts.join('');
}

export const patternFigure: VisualTemplate<PatternFigureParams> = {
  name: 'patternFigure',
  // Invariants enforced by verify(); surfaced to the draft prompt.
  rules: [
    "figure_numbers must be consecutive and start at 1 or more",
    "counts must strictly increase with CONSTANT SECOND DIFFERENCES (linear or quadratic growth)",
    "counts must equal the number of dots/matchsticks actually drawn",
    "for kind 'concentric-circles', figure n is n circles of radii 1..n about one centre and counts must be the DOTS: 4n + 1 (one at the centre, four on each circumference)",
  ],
  paramsSchema: PatternFigureParamsZ,

  render: renderSvg,

  describe(p) {
    if (p.kind === 'concentric-circles') {
      const perFigure = p.figure_numbers
        .map(
          (n, i) =>
            `Figure ${n} has ${ringsFor(n)} circle(s) of radii 1 to ${ringsFor(n)} units and ${p.counts[i]} dots`,
        )
        .join('; ');
      return `Growing pattern of concentric circles about a common centre, with a horizontal and a vertical diameter ruled through each figure. There is one dot at the centre and four dots on each circumference. ${perFigure}. In every figure after the first, the region between the innermost circle and the outermost circle is shaded.`;
    }
    const unit = p.kind === 'dots' ? 'dots' : 'matchsticks';
    const perFigure = p.figure_numbers
      .map((n, i) => `Figure ${n} has ${p.counts[i]} ${unit}`)
      .join('; ');
    return `Growing pattern of ${unit} in a ${p.arrangement} arrangement. ${perFigure}.`;
  },

  verify(p) {
    const issues: string[] = [];
    if (p.kind === 'concentric-circles') {
      // The drawn dots ARE the count, exactly as for the other kinds: a figure
      // whose table says 12 dots and whose picture shows 13 is unanswerable.
      p.figure_numbers.forEach((n, i) => {
        const drawn = circleDotCount(n);
        if (p.counts[i] !== drawn) {
          issues.push(
            `patternFigure: figure ${n} draws ${drawn} dots (4 x ${ringsFor(n)} rings + 1 centre) but counts says ${p.counts[i]}`,
          );
        }
      });
    }
    if (p.counts.length !== p.figure_numbers.length) {
      issues.push(
        `patternFigure: ${p.counts.length} counts for ${p.figure_numbers.length} figure numbers`,
      );
    }
    if (p.figure_numbers[0] < 1) {
      issues.push('patternFigure: figure numbers must start at 1 or greater');
    }
    for (let i = 1; i < p.figure_numbers.length; i++) {
      if (p.figure_numbers[i] !== p.figure_numbers[i - 1] + 1) {
        issues.push('patternFigure: figure numbers must be consecutive ascending');
        break;
      }
    }
    for (let i = 1; i < p.counts.length; i++) {
      if (p.counts[i] <= p.counts[i - 1]) {
        issues.push('patternFigure: counts must be strictly increasing');
        break;
      }
    }
    if (p.counts.length >= 3) {
      const d1 = p.counts.slice(1).map((c, i) => c - p.counts[i]);
      const d2 = d1.slice(1).map((d, i) => d - d1[i]);
      if (d2.some((d) => d !== d2[0])) {
        issues.push(
          'patternFigure: second differences are not constant (counts must grow linearly or quadratically)',
        );
      }
    }
    // Drawn-element invariant: each figure group must contain exactly counts[i]
    // dots (circles) or matchsticks (lines).
    // The concentric-circles kind is counted above, against the rings it draws:
    // here a <circle> is a ring OR a dot and a <line> is a ruled diameter, so
    // counting tags would compare the wrong things.
    if (p.kind !== 'concentric-circles' && p.counts.length === p.figure_numbers.length) {
      const svg = renderSvg(p);
      const groups = [...svg.matchAll(/<g data-figure="(\d+)">([\s\S]*?)<\/g>/g)];
      if (groups.length !== p.figure_numbers.length) {
        issues.push('patternFigure: rendered figure groups do not match figure_numbers');
      } else {
        groups.forEach((g, i) => {
          const drawn = (g[2].match(p.kind === 'dots' ? /<circle /g : /<line /g) ?? []).length;
          if (drawn !== p.counts[i]) {
            issues.push(
              `patternFigure: figure ${p.figure_numbers[i]} draws ${drawn} elements but counts[${i}] is ${p.counts[i]}`,
            );
          }
        });
      }
    }
    return issues;
  },
};
