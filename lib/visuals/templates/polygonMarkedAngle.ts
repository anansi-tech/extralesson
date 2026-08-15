import { z } from 'zod';
import { pathArc, polar, polygon, round, svgOpen, text } from '../svg';
import { valueStatedInText, type VisualTemplate } from '../types';

// Convex polygon (4–8 sides), regular or irregular, with vertex labels and
// some interior angles marked (value or variable). Vertices are placed by the
// template on a circle — a deterministic angular jitter gives the irregular
// look while keeping the polygon convex (any cyclic polygon is convex).

export const PolygonMarkedAngleParamsZ = z.object({
  sides: z.number().int().min(4).max(8),
  regular: z.boolean().default(false),
  labels: z.array(z.string().min(1).max(4)).max(8).optional(), // defaults A, B, C, ...
  angles: z
    .array(
      z.object({
        vertex: z.number().int().min(0).max(7),
        value: z.number().optional(), // degrees
        variable: z.string().max(8).optional(), // e.g. "x°"
      }),
    )
    .max(8)
    .default([]),
});

export type PolygonMarkedAngleParams = z.infer<typeof PolygonMarkedAngleParamsZ>;

const W = 640;
const H = 430;
const CX = 320;
const CY = 218;
const R = 162;
const JITTER = [7, -9, 12, -6, 9, -11, 5, -8]; // degrees, deterministic
const NAMES = ['Quadrilateral', 'Pentagon', 'Hexagon', 'Heptagon', 'Octagon'];

function vertexDeg(p: PolygonMarkedAngleParams, k: number): number {
  // labels run clockwise from the top of the circle
  return 90 - (k * 360) / p.sides + (p.regular ? 0 : JITTER[k]);
}

function labelsFor(p: PolygonMarkedAngleParams): string[] {
  if (p.labels && p.labels.length === p.sides) return p.labels;
  return Array.from({ length: p.sides }, (_, i) => String.fromCharCode(65 + i));
}

function dirDeg(from: [number, number], to: [number, number]): number {
  return (Math.atan2(from[1] - to[1], to[0] - from[0]) * 180) / Math.PI;
}

export const polygonMarkedAngle: VisualTemplate<PolygonMarkedAngleParams> = {
  name: 'polygonMarkedAngle',
  // Invariants enforced by verify(); surfaced to the draft prompt.
  rules: [
    "supply either no labels or exactly one per vertex",
    "vertex indices must be within the polygon",
    "interior angles must be strictly between 0 and 360, and if EVERY angle is numeric they must sum to (sides - 2) x 180",
  ],
  paramsSchema: PolygonMarkedAngleParamsZ,

  render(p) {
    const labels = labelsFor(p);
    const verts: [number, number][] = Array.from({ length: p.sides }, (_, k) =>
      polar(CX, CY, R, vertexDeg(p, k)),
    );
    const parts: string[] = [svgOpen(W, H)];
    parts.push(polygon(verts, true));

    labels.forEach((label, k) => {
      const [lx, ly] = polar(CX, CY, R + 22, vertexDeg(p, k));
      parts.push(text(lx, ly + 5, label, { size: 15, italic: true }));
    });

    for (const a of p.angles) {
      if (a.vertex >= p.sides) continue;
      const label = a.variable ?? (a.value !== undefined ? `${a.value}°` : undefined);
      if (label === undefined) continue;
      const v = verts[a.vertex];
      const prev = verts[(a.vertex + p.sides - 1) % p.sides];
      const next = verts[(a.vertex + 1) % p.sides];
      const d1 = dirDeg(v, prev);
      const d2 = dirDeg(v, next);
      let cover = ((d1 - d2) % 360 + 360) % 360;
      let start = d1;
      if (cover > 180) {
        start = d2;
        cover = 360 - cover; // convex interior angle < 180°
      }
      parts.push(pathArc(v[0], v[1], 22, start, start - cover));
      const [lx, ly] = polar(v[0], v[1], 44, start - cover / 2);
      parts.push(text(lx, ly + 4, label, { size: 13 }));
    }

    parts.push('</svg>');
    return parts.join('');
  },

  describe(p) {
    const labels = labelsFor(p);
    const out: string[] = [
      `${p.regular ? 'Regular ' : 'Convex '}${NAMES[p.sides - 4].toLowerCase()} ${labels.join('')} (vertices in order).`,
    ];
    for (const a of p.angles) {
      if (a.vertex >= p.sides) continue;
      const shown = a.variable ?? (a.value !== undefined ? `${a.value}°` : null);
      if (shown) out.push(`The interior angle at ${labels[a.vertex]} is marked ${shown}.`);
    }
    return out.join(' ');
  },

  verify(p, context) {
    const issues: string[] = [];
    if (p.labels && p.labels.length !== p.sides) {
      issues.push(`polygonMarkedAngle: ${p.labels.length} labels supplied for ${p.sides} vertices`);
    }
    const numericByVertex = new Map<number, number>();
    for (const a of p.angles) {
      if (a.vertex >= p.sides) {
        issues.push(`polygonMarkedAngle: vertex index ${a.vertex} out of range for ${p.sides} sides`);
        continue;
      }
      if (a.value === undefined) continue;
      if (a.value <= 0 || a.value >= 360) {
        issues.push(`polygonMarkedAngle: interior angle ${a.value}° must be strictly between 0° and 360°`);
      }
      if (!valueStatedInText(a.value, context)) {
        issues.push(`polygonMarkedAngle: angle ${a.value}° never appears in the question text`);
      }
      numericByVertex.set(a.vertex, a.value);
    }
    if (numericByVertex.size === p.sides) {
      const sum = [...numericByVertex.values()].reduce((s, v) => s + v, 0);
      const expected = (p.sides - 2) * 180;
      if (Math.abs(sum - expected) > 0.01) {
        issues.push(`polygonMarkedAngle: interior angles sum to ${round(sum)}°, expected ${expected}°`);
      }
    }
    return issues;
  },
};
