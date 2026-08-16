import { z } from 'zod';
import { INK, line, polygon, round, svgOpen, text } from '../svg';
import type { VisualTemplate } from '../types';

// Plane figure carrying labelled vector arrows — the Section II vectors
// configuration. The TEMPLATE places the vertices (well-proportioned,
// non-degenerate); the model supplies labels, the arrows between named
// points, and the ratio-divided points those questions turn on.

const NameZ = z.string().min(1).max(12);

const SegmentZ = z.object({ from: NameZ, to: NameZ });

export const VectorFigureParamsZ = z.object({
  shape: z.enum(['triangle', 'parallelogram', 'quadrilateral']),
  // Vertex names in order around the figure. Omit for A, B, C(, D).
  labels: z.array(z.string().min(1).max(4)).max(4).optional(),
  // Arrows drawn between named points; the arrowhead sits at `to`.
  vectors: z
    .array(z.object({ from: NameZ, to: NameZ, label: z.string().max(12).optional() }))
    .max(8)
    .default([]),
  // Extra named points defined ON a segment: `ratio` is the fraction of the
  // way from the first endpoint to the second (0.5 = midpoint).
  points: z
    .array(
      z.object({
        label: NameZ,
        on: z.tuple([NameZ, NameZ]),
        ratio: z.number().gt(0).lt(1),
      }),
    )
    .max(6)
    .default([]),
  // Pairs of segments marked equal in length (a single tick through each).
  equalMarks: z.array(z.object({ first: SegmentZ, second: SegmentZ })).max(4).default([]),
});

export type VectorFigureParams = z.infer<typeof VectorFigureParamsZ>;

type Shape = VectorFigureParams['shape'];
type Pt = [number, number];

const W = 640;
const H = 420;
const PAD = 70;

// Deterministic, non-degenerate outlines in y-up unit space, vertices in
// order around the figure.
const OUTLINES: Record<Shape, Pt[]> = {
  triangle: [
    [0.32, 0.95],
    [0, 0],
    [1, 0],
  ],
  parallelogram: [
    [0, 0],
    [1, 0],
    [1.3, 0.7],
    [0.3, 0.7],
  ],
  quadrilateral: [
    [0, 0],
    [1, 0.1],
    [0.85, 0.9],
    [0.12, 0.7],
  ],
};

const DEFAULT_LABELS: Record<Shape, string[]> = {
  triangle: ['A', 'B', 'C'],
  parallelogram: ['A', 'B', 'C', 'D'],
  quadrilateral: ['A', 'B', 'C', 'D'],
};

function labelsOf(p: VectorFigureParams): string[] {
  return p.labels && p.labels.length > 0 ? p.labels : DEFAULT_LABELS[p.shape];
}

function vertexPositions(shape: Shape): Pt[] {
  const raw = OUTLINES[shape];
  const xs = raw.map((v) => v[0]);
  const ys = raw.map((v) => v[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const s = Math.min((W - 2 * PAD) / (maxX - minX), (H - 2 * PAD) / (maxY - minY));
  const ox = (W - (maxX - minX) * s) / 2;
  const oy = (H - (maxY - minY) * s) / 2;
  return raw.map(([x, y]) => [ox + (x - minX) * s, H - oy - (y - minY) * s]);
}

// Screen position of every declared name. Points may sit on a segment whose
// endpoints are themselves points, so resolve in passes; whatever is left
// over is unreachable (a forward reference, a cycle, or an unknown name).
function resolve(p: VectorFigureParams): { pos: Map<string, Pt>; unresolved: string[] } {
  const labels = labelsOf(p);
  const verts = vertexPositions(p.shape);
  const pos = new Map<string, Pt>();
  labels.forEach((label, i) => {
    if (i < verts.length && !pos.has(label)) pos.set(label, verts[i]);
  });
  let pending = p.points.slice();
  for (let pass = 0; pass <= p.points.length && pending.length > 0; pass++) {
    const next: typeof pending = [];
    for (const pt of pending) {
      const a = pos.get(pt.on[0]);
      const b = pos.get(pt.on[1]);
      if (!a || !b) {
        next.push(pt);
        continue;
      }
      if (!pos.has(pt.label)) {
        pos.set(pt.label, [a[0] + (b[0] - a[0]) * pt.ratio, a[1] + (b[1] - a[1]) * pt.ratio]);
      }
    }
    if (next.length === pending.length) break;
    pending = next;
  }
  return { pos, unresolved: pending.map((pt) => pt.label) };
}

function unit(dx: number, dy: number): Pt {
  const len = Math.hypot(dx, dy) || 1;
  return [dx / len, dy / len];
}

// Normal to direction u at `mid`, pointing away from the figure's centre so
// a label never lands on the line or inside the figure.
function outwardNormal(mid: Pt, centre: Pt, u: Pt): Pt {
  const n: Pt = [-u[1], u[0]];
  const dot = n[0] * (mid[0] - centre[0]) + n[1] * (mid[1] - centre[1]);
  return dot >= 0 ? n : [-n[0], -n[1]];
}

// Exact n/q for a ratio with a small denominator, for readable prose.
function asFraction(r: number): [number, number] | null {
  for (let q = 2; q <= 12; q++) {
    const n = Math.round(r * q);
    if (n > 0 && n < q && Math.abs(r * q - n) < 1e-9) return [n, q];
  }
  return null;
}

function ratioProse(r: number): { part: string; split: string } {
  const f = asFraction(r);
  if (f) return { part: `${f[0]}/${f[1]}`, split: `${f[0]} : ${f[1] - f[0]}` };
  return { part: String(round(r)), split: `${round(r)} : ${round(1 - r)}` };
}

function tickMarks(pos: Map<string, Pt>, seg: { from: string; to: string }): string[] {
  const a = pos.get(seg.from);
  const b = pos.get(seg.to);
  if (!a || !b) return [];
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const [ux, uy] = unit(b[0] - a[0], b[1] - a[1]);
  return [line(mx + 7 * uy, my - 7 * ux, mx - 7 * uy, my + 7 * ux)];
}

export const vectorFigure: VisualTemplate<VectorFigureParams> = {
  name: 'vectorFigure',
  placesOwnPoints: true,
  // Invariants enforced by verify(); surfaced to the draft prompt.
  rules: [
    'the template places the vertices — never supply coordinates, only labels: 3 for a triangle, 4 for a parallelogram or a quadrilateral',
    'every vertex label and every point label must be distinct',
    'every from/to in vectors, both endpoints of a point\'s "on" segment, and both endpoints of an equalMarks segment must name a declared vertex or a declared point',
    'a vector must join two different points — from and to can never be the same name',
    'a point sits on a segment at "ratio", the fraction of the way from the first endpoint to the second; it must be strictly between 0 and 1 (0.5 is the midpoint, 1/3 is 0.3333)',
    'a point may sit on a segment defined by other points, but those references must not form a cycle',
    'an equalMarks pair must name two different segments, each joining two different declared points',
  ],
  paramsSchema: VectorFigureParamsZ,

  render(p) {
    const labels = labelsOf(p);
    const verts = vertexPositions(p.shape);
    const { pos } = resolve(p);
    const centre: Pt = [
      verts.reduce((s, v) => s + v[0], 0) / verts.length,
      verts.reduce((s, v) => s + v[1], 0) / verts.length,
    ];
    const parts: string[] = [svgOpen(W, H)];
    parts.push(polygon(verts, true));

    // equal-length tick marks
    for (const pair of p.equalMarks) {
      parts.push(...tickMarks(pos, pair.first), ...tickMarks(pos, pair.second));
    }

    // vector arrows: line to the `to` end, filled arrowhead there, label
    // beside the midpoint on the outward side.
    for (const v of p.vectors) {
      const a = pos.get(v.from);
      const b = pos.get(v.to);
      if (!a || !b || (a[0] === b[0] && a[1] === b[1])) continue;
      const u = unit(b[0] - a[0], b[1] - a[1]);
      parts.push(line(a[0], a[1], b[0], b[1]));
      const baseX = b[0] - 13 * u[0];
      const baseY = b[1] - 13 * u[1];
      parts.push(
        `<polygon points="${round(b[0])},${round(b[1])} ${round(baseX + 5 * u[1])},${round(
          baseY - 5 * u[0],
        )} ${round(baseX - 5 * u[1])},${round(baseY + 5 * u[0])}" fill="${INK}" stroke="none" />`,
      );
      if (v.label) {
        const mid: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        const n = outwardNormal(mid, centre, u);
        parts.push(
          text(mid[0] + 17 * n[0], mid[1] + 17 * n[1] + 4, v.label, { size: 14, italic: true }),
        );
      }
    }

    // ratio-divided points: small filled dot plus label
    for (const pt of p.points) {
      const q = pos.get(pt.label);
      if (!q) continue;
      parts.push(`<circle cx="${round(q[0])}" cy="${round(q[1])}" r="3.5" fill="${INK}" />`);
      const [ux, uy] = unit(q[0] - centre[0], q[1] - centre[1]);
      parts.push(text(q[0] + 16 * ux, q[1] + 16 * uy + 5, pt.label, { size: 14, italic: true }));
    }

    // vertex labels, pushed outward from the centre
    labels.forEach((label, i) => {
      if (i >= verts.length) return;
      const [ux, uy] = unit(verts[i][0] - centre[0], verts[i][1] - centre[1]);
      parts.push(
        text(verts[i][0] + 22 * ux, verts[i][1] + 22 * uy + 5, label, { size: 15, italic: true }),
      );
    });

    parts.push('</svg>');
    return parts.join('');
  },

  describe(p) {
    const labels = labelsOf(p);
    const name = labels.join('');
    const out: string[] = [
      `${p.shape === 'triangle' ? 'Triangle' : p.shape === 'parallelogram' ? 'Parallelogram' : 'Quadrilateral'} ${name}, with vertices ${labels.join(', ')} taken in order around the figure.`,
    ];
    if (p.shape === 'parallelogram' && labels.length === 4) {
      const [a, b, c, d] = labels;
      out.push(
        `Because ${name} is a parallelogram, ${a}${b} is parallel and equal in length to ${d}${c}, and ${b}${c} is parallel and equal in length to ${a}${d}.`,
      );
    }
    for (const pt of p.points) {
      const [from, to] = pt.on;
      const r = ratioProse(pt.ratio);
      out.push(
        `Point ${pt.label} lies on ${from}${to} with ${from}${pt.label} = ${r.part} of ${from}${to}, so ${from}${pt.label} : ${pt.label}${to} = ${r.split}.`,
      );
    }
    for (const v of p.vectors) {
      out.push(
        `An arrow runs from ${v.from} to ${v.to}${v.label ? `, labelled ${v.label}` : ' (unlabelled)'}.`,
      );
    }
    for (const pair of p.equalMarks) {
      out.push(
        `${pair.first.from}${pair.first.to} and ${pair.second.from}${pair.second.to} carry matching single tick marks, so they are equal in length.`,
      );
    }
    return out.join(' ');
  },

  verify(p) {
    const issues: string[] = [];
    const labels = labelsOf(p);
    const expected = p.shape === 'triangle' ? 3 : 4;
    if (labels.length !== expected) {
      issues.push(
        `vectorFigure: a ${p.shape} needs ${expected} vertex labels, but ${labels.length} were given`,
      );
    }

    const seen = new Set<string>();
    const declared = new Set<string>();
    for (const label of [...labels, ...p.points.map((pt) => pt.label)]) {
      if (seen.has(label)) {
        issues.push(`vectorFigure: label "${label}" is used more than once`);
      }
      seen.add(label);
      declared.add(label);
    }

    const checkName = (name: string, where: string) => {
      if (!declared.has(name)) {
        issues.push(`vectorFigure: ${where} references "${name}", which is not a declared vertex or point`);
      }
    };

    for (const pt of p.points) {
      const [from, to] = pt.on;
      checkName(from, `point ${pt.label}`);
      checkName(to, `point ${pt.label}`);
      if (from === to) {
        issues.push(`vectorFigure: point ${pt.label} sits on a segment from "${from}" to itself`);
      }
      if (!(pt.ratio > 0 && pt.ratio < 1)) {
        issues.push(
          `vectorFigure: point ${pt.label} has ratio ${pt.ratio}, which must be strictly between 0 and 1`,
        );
      }
    }

    for (const v of p.vectors) {
      checkName(v.from, 'vector');
      checkName(v.to, 'vector');
      if (v.from === v.to) {
        issues.push(`vectorFigure: vector from "${v.from}" to itself has zero length`);
      }
    }

    p.equalMarks.forEach((pair, i) => {
      for (const seg of [pair.first, pair.second]) {
        checkName(seg.from, `equalMarks pair ${i + 1}`);
        checkName(seg.to, `equalMarks pair ${i + 1}`);
        if (seg.from === seg.to) {
          issues.push(
            `vectorFigure: equalMarks pair ${i + 1} marks segment "${seg.from}${seg.to}", which is not a real segment`,
          );
        }
      }
      if (pair.first.from === pair.second.from && pair.first.to === pair.second.to) {
        issues.push(
          `vectorFigure: equalMarks pair ${i + 1} marks the segment ${pair.first.from}${pair.first.to} as equal to itself`,
        );
      }
    });

    // Anything still unplaced after the resolution passes is a cycle or a
    // forward reference the drawing cannot honour.
    for (const label of resolve(p).unresolved) {
      if (!issues.some((issue) => issue.includes(`point ${label}`))) {
        issues.push(
          `vectorFigure: point ${label} cannot be placed — its segment depends on a point that is itself undefined or circular`,
        );
      }
    }

    return issues;
  },
};
