import { z } from 'zod';
import { line, pathArc, polar, polygon, round, svgOpen, text } from '../svg';
import { valueStatedInText, type VisualTemplate } from '../types';

// R1.8 §4.5 — the labelled quadrilateral of Section I geometry: a trapezium
// with its parallel sides marked and two angles given, a parallelogram, a kite,
// a rectangle. This is the 2019 PQRS figure and its relatives.
//
// polygonMarkedAngle cannot do it: that template places vertices on a
// circumcircle, and a general trapezium is not cyclic, so parallel sides can
// never be guaranteed. The shape decides the placement here instead — which is
// why parallelism is true by construction rather than asserted in a label.

const LabelZ = z.string().min(1).max(4);

export const QuadrilateralLabeledParamsZ = z.object({
  shape: z.enum(['trapezium', 'parallelogram', 'kite', 'rectangle']),
  /** Vertices in order round the figure; defaults A, B, C, D. */
  labels: z.array(LabelZ).length(4).default(['A', 'B', 'C', 'D']),
  /** Side i runs from vertex i to vertex i+1. */
  sides: z
    .array(
      z.object({
        side: z.number().int().min(0).max(3),
        value: z.number().positive().max(100000).optional(),
        variable: z.string().max(8).optional(),
        unit: z.enum(['cm', 'm', 'mm']).optional(),
      }),
    )
    .max(4)
    .default([]),
  angles: z
    .array(
      z.object({
        vertex: z.number().int().min(0).max(3),
        value: z.number().min(1).max(359).optional(),
        variable: z.string().max(8).optional(),
      }),
    )
    .max(4)
    .default([]),
  /** Draw a diagonal between two vertices, as a trapezium question often does. */
  diagonal: z.tuple([z.number().int().min(0).max(3), z.number().int().min(0).max(3)]).optional(),
  /** Equal-length tick marks, for a kite or a parallelogram. */
  equalTicks: z
    .array(z.object({ side: z.number().int().min(0).max(3), count: z.number().int().min(1).max(2).default(1) }))
    .max(4)
    .default([]),
});

export type QuadrilateralLabeledParams = z.infer<typeof QuadrilateralLabeledParamsZ>;

const W = 640;
const H = 420;

/**
 * Vertices in order, clockwise from the top left. Each shape is drawn to look
 * like itself — a trapezium visibly tapers, a kite is symmetric about its
 * vertical axis — because the figure is a labelled sketch and its job is to
 * show the relationship the question is about.
 */
function vertices(shape: QuadrilateralLabeledParams['shape']): [number, number][] {
  const cx = W / 2;
  const top = 90;
  const bottom = 330;
  switch (shape) {
    case 'trapezium':
      return [
        [cx - 90, top],
        [cx + 90, top],
        [cx + 175, bottom],
        [cx - 175, bottom],
      ];
    case 'parallelogram':
      return [
        [cx - 90, top],
        [cx + 190, top],
        [cx + 90, bottom],
        [cx - 190, bottom],
      ];
    case 'rectangle':
      return [
        [cx - 165, top],
        [cx + 165, top],
        [cx + 165, bottom],
        [cx - 165, bottom],
      ];
    case 'kite':
      // The two pairs must differ visibly, or the figure reads as a rhombus
      // and tells the student something the question did not say.
      return [
        [cx, top - 30],
        [cx + 120, top + 80],
        [cx, bottom + 60],
        [cx - 120, top + 80],
      ];
  }
}

/** Which side indices are parallel, by construction. */
function parallelPairs(shape: QuadrilateralLabeledParams['shape']): number[][] {
  switch (shape) {
    case 'trapezium':
      return [[0, 2]]; // top and bottom only
    case 'parallelogram':
    case 'rectangle':
      return [
        [0, 2],
        [1, 3],
      ];
    case 'kite':
      return [];
  }
}

function unit(dx: number, dy: number): [number, number] {
  const len = Math.hypot(dx, dy) || 1;
  return [dx / len, dy / len];
}

function dirDeg(from: [number, number], to: [number, number]): number {
  return (Math.atan2(from[1] - to[1], to[0] - from[0]) * 180) / Math.PI;
}

function sideName(labels: string[], side: number): string {
  return `${labels[side]}${labels[(side + 1) % 4]}`;
}

/** A chevron pair on a side, the paper's mark for "these two are parallel". */
function parallelMark(a: [number, number], b: [number, number], count: number): string[] {
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const [ux, uy] = unit(b[0] - a[0], b[1] - a[1]);
  const out: string[] = [];
  for (let k = 0; k < count; k++) {
    const off = (k - (count - 1) / 2) * 7;
    const px = mx + off * ux;
    const py = my + off * uy;
    // an arrowhead pointing along the side
    const back = 6;
    const wing = 4.5;
    const [nx, ny] = [-uy, ux];
    out.push(
      `<path d="M ${round(px - back * ux + wing * nx)} ${round(py - back * uy + wing * ny)} L ${round(px)} ${round(py)} L ${round(px - back * ux - wing * nx)} ${round(py - back * uy - wing * ny)}" fill="none" />`,
    );
  }
  return out;
}

export const quadrilateralLabeled: VisualTemplate<QuadrilateralLabeledParams> = {
  name: 'quadrilateralLabeled',
  placesOwnPoints: true,
  rules: [
    "the shape decides the figure: a trapezium has one parallel pair (sides 0 and 2), a parallelogram and a rectangle have two, a kite none",
    "side i runs from vertex i to vertex i+1, so with labels [P,Q,R,S] side 0 is PQ and side 3 is SP",
    "given angles must each be between 0 and 360, and all four must sum to 360 when all four are numeric",
    "a rectangle's angles are 90 and must not be labelled otherwise; a parallelogram's opposite angles must be equal when both are given",
  ],
  paramsSchema: QuadrilateralLabeledParamsZ,

  render(p) {
    const v = vertices(p.shape);
    const cx = v.reduce((s, q) => s + q[0], 0) / 4;
    const cy = v.reduce((s, q) => s + q[1], 0) / 4;
    const parts: string[] = [svgOpen(W, H)];
    parts.push(polygon(v, true));

    // vertex labels, pushed outward from the centre
    p.labels.forEach((label, i) => {
      const [ux, uy] = unit(v[i][0] - cx, v[i][1] - cy);
      parts.push(text(v[i][0] + 22 * ux, v[i][1] + 22 * uy + 5, label, { size: 15, italic: true, halo: true }));
    });

    // parallel marks, one chevron on the first pair and two on the second
    parallelPairs(p.shape).forEach((pair, k) => {
      for (const side of pair) {
        parts.push(...parallelMark(v[side], v[(side + 1) % 4], k + 1));
      }
    });

    if (p.diagonal) {
      const [a, b] = p.diagonal;
      parts.push(line(v[a][0], v[a][1], v[b][0], v[b][1]));
    }

    // equal-length ticks
    for (const t of p.equalTicks) {
      const a = v[t.side];
      const b = v[(t.side + 1) % 4];
      const mx = (a[0] + b[0]) / 2;
      const my = (a[1] + b[1]) / 2;
      const [ux, uy] = unit(b[0] - a[0], b[1] - a[1]);
      const [nx, ny] = [-uy, ux];
      for (let k = 0; k < t.count; k++) {
        const off = (k - (t.count - 1) / 2) * 6;
        parts.push(line(mx + off * ux - 6 * nx, my + off * uy - 6 * ny, mx + off * ux + 6 * nx, my + off * uy + 6 * ny));
      }
    }

    // marked angles
    for (const a of p.angles) {
      const label = a.variable ?? (a.value !== undefined ? `${a.value}°` : undefined);
      const i = a.vertex;
      const prev = v[(i + 3) % 4];
      const next = v[(i + 1) % 4];
      const d1 = dirDeg(v[i], next);
      const d2 = dirDeg(v[i], prev);
      let cover = (((d1 - d2) % 360) + 360) % 360;
      let start = d1;
      if (cover > 180) {
        start = d2;
        cover = 360 - cover;
      }
      parts.push(pathArc(v[i][0], v[i][1], 26, start, start - cover));
      if (label !== undefined) {
        const [lx, ly] = polar(v[i][0], v[i][1], 46, start - cover / 2);
        parts.push(text(lx, ly + 4, label, { size: 13, halo: true }));
      }
    }

    // side labels, pushed outward
    for (const s of p.sides) {
      const label = s.variable ?? (s.value !== undefined ? `${s.value}${s.unit ? ` ${s.unit}` : ''}` : undefined);
      if (label === undefined) continue;
      const a = v[s.side];
      const b = v[(s.side + 1) % 4];
      const mx = (a[0] + b[0]) / 2;
      const my = (a[1] + b[1]) / 2;
      const [nx, ny] = unit(mx - cx, my - cy);
      parts.push(text(mx + 24 * nx, my + 24 * ny + 4, label, { size: 13, halo: true }));
    }

    parts.push('</svg>');
    return parts.join('');
  },

  describe(p) {
    const out: string[] = [`${p.shape[0].toUpperCase()}${p.shape.slice(1)} ${p.labels.join('')}.`];
    for (const pair of parallelPairs(p.shape)) {
      out.push(`${sideName(p.labels, pair[0])} is parallel to ${sideName(p.labels, pair[1])}.`);
    }
    for (const a of p.angles) {
      const shown = a.variable ?? (a.value !== undefined ? `${a.value}°` : null);
      if (shown) out.push(`The angle at ${p.labels[a.vertex]} is marked ${shown}.`);
    }
    for (const s of p.sides) {
      const shown = s.variable ?? (s.value !== undefined ? `${s.value}${s.unit ? ` ${s.unit}` : ''}` : null);
      if (shown) out.push(`Side ${sideName(p.labels, s.side)} is marked ${shown}.`);
    }
    if (p.diagonal) {
      out.push(`The diagonal ${p.labels[p.diagonal[0]]}${p.labels[p.diagonal[1]]} is drawn.`);
    }
    const byCount = new Map<number, string[]>();
    for (const t of p.equalTicks) {
      const list = byCount.get(t.count) ?? [];
      list.push(sideName(p.labels, t.side));
      byCount.set(t.count, list);
    }
    for (const [, names] of byCount) {
      if (names.length >= 2) out.push(`Sides ${names.join(' and ')} carry matching tick marks, so they are equal in length.`);
    }
    return out.join(' ');
  },

  verify(p, context) {
    const issues: string[] = [];
    if (new Set(p.labels).size !== 4) issues.push('quadrilateralLabeled: duplicate vertex labels');

    const numeric = p.angles.filter((a) => a.value !== undefined);
    for (const a of numeric) {
      const value = a.value as number;
      if (!valueStatedInText(value, context)) {
        issues.push(`quadrilateralLabeled: angle ${value}° never appears in the question text`);
      }
      if (p.shape === 'rectangle' && Math.abs(value - 90) > 0.01) {
        issues.push(`quadrilateralLabeled: a rectangle's angles are 90°, but ${p.labels[a.vertex]} is marked ${value}°`);
      }
    }
    const sum = numeric.reduce((s, a) => s + (a.value as number), 0);
    if (numeric.length === 4 && Math.abs(sum - 360) > 0.01) {
      issues.push(`quadrilateralLabeled: the four angles sum to ${round(sum)}°, expected 360°`);
    } else if (sum > 360.01) {
      issues.push(`quadrilateralLabeled: given angles sum to ${round(sum)}°, which exceeds 360°`);
    }

    // Opposite angles of a parallelogram are equal; co-interior ones supplement.
    if (p.shape === 'parallelogram' || p.shape === 'rectangle') {
      for (const [i, j] of [
        [0, 2],
        [1, 3],
      ]) {
        const a = numeric.find((x) => x.vertex === i);
        const b = numeric.find((x) => x.vertex === j);
        if (a && b && Math.abs((a.value as number) - (b.value as number)) > 0.01) {
          issues.push(
            `quadrilateralLabeled: opposite angles ${p.labels[i]} and ${p.labels[j]} must be equal in a ${p.shape} (${a.value}° and ${b.value}°)`,
          );
        }
      }
    }

    for (const s of p.sides) {
      if (s.value !== undefined && !valueStatedInText(s.value, context)) {
        issues.push(`quadrilateralLabeled: side length ${s.value} never appears in the question text`);
      }
    }
    if (p.diagonal && p.diagonal[0] === p.diagonal[1]) {
      issues.push('quadrilateralLabeled: a diagonal must join two different vertices');
    }
    return issues;
  },
};
