import { z } from 'zod';
import { line, pathArc, polar, polygon, round, svgOpen, text } from '../svg';
import { valueStatedInText, type VisualTemplate } from '../types';

// Triangle with vertex labels, optional side/angle labels, equal-side tick
// marks and a right-angle mark. The TEMPLATE places the vertices — the model
// never supplies coordinates. Placement is derived deterministically from
// whichever numeric angles are given (aesthetic scalene fallback otherwise).

const AngleZ = z.object({
  vertex: z.number().int().min(0).max(2), // 0/1/2 → labels[0..2]
  value: z.number().optional(), // degrees
  variable: z.string().max(8).optional(), // e.g. "x°"
});

const SideZ = z.object({
  side: z.number().int().min(0).max(2), // side i joins vertex i and vertex (i+1)%3
  value: z.number().positive().max(100000).optional(),
  variable: z.string().max(8).optional(),
  unit: z.enum(['cm', 'm', 'mm']).optional(),
});

export const TriangleLabeledParamsZ = z.object({
  labels: z.array(z.string().min(1).max(4)).length(3).default(['A', 'B', 'C']),
  angles: z.array(AngleZ).max(3).default([]),
  sides: z.array(SideZ).max(3).default([]),
  equalTicks: z
    .array(
      z.object({
        side: z.number().int().min(0).max(2),
        count: z.number().int().min(1).max(2).default(1),
      }),
    )
    .max(3)
    .default([]),
  rightAngleAt: z.number().int().min(0).max(2).optional(),
});

export type TriangleLabeledParams = z.infer<typeof TriangleLabeledParamsZ>;

const W = 640;
const H = 420;
const PAD = 64;
const DEFAULT_ANGLES: [number, number, number] = [72, 63, 45];

// Effective drawing angles at vertices [0, 1, 2].
function layoutAngles(p: TriangleLabeledParams): [number, number, number] {
  const given: (number | null)[] = [null, null, null];
  for (const a of p.angles) {
    if (a.value !== undefined) given[a.vertex] = a.value;
  }
  if (p.rightAngleAt !== undefined && given[p.rightAngleAt] === null) {
    given[p.rightAngleAt] = 90;
  }
  const known = given.filter((v): v is number => v !== null);
  if (known.some((v) => v <= 0 || v >= 180)) return DEFAULT_ANGLES;
  const sum = known.reduce((s, v) => s + v, 0);
  const missing = [0, 1, 2].filter((i) => given[i] === null);
  if (missing.length === 0) {
    return Math.abs(sum - 180) < 0.01 ? (given as [number, number, number]) : DEFAULT_ANGLES;
  }
  const remaining = 180 - sum;
  if (remaining < 2) return DEFAULT_ANGLES; // degenerate — verify() flags it
  const shares = missing.length === 1 ? [1] : [0.58, 0.42]; // unequal → scalene look
  missing.forEach((idx, k) => {
    given[idx] = remaining * shares[k];
  });
  return given as [number, number, number];
}

// Screen positions of vertices 0 (apex), 1 (bottom-left), 2 (bottom-right).
function vertexPositions(p: TriangleLabeledParams): [number, number][] {
  const [a0, a1, a2] = layoutAngles(p);
  void a0;
  const cot = (deg: number) => Math.cos((deg * Math.PI) / 180) / Math.sin((deg * Math.PI) / 180);
  // Unit base from vertex 1 to vertex 2 (y-up raw space), apex above.
  const h = 1 / (cot(a1) + cot(a2));
  const raw: [number, number][] = [
    [h * cot(a1), h],
    [0, 0],
    [1, 0],
  ];
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

function unit(dx: number, dy: number): [number, number] {
  const len = Math.hypot(dx, dy) || 1;
  return [dx / len, dy / len];
}

// Polar-convention degrees (as used by svg.ts polar()) of direction from→to.
function dirDeg(from: [number, number], to: [number, number]): number {
  return (Math.atan2(from[1] - to[1], to[0] - from[0]) * 180) / Math.PI;
}

// Arc covering the smaller region between directions d1 and d2 at (cx, cy).
function interiorArc(
  cx: number,
  cy: number,
  r: number,
  d1: number,
  d2: number,
): { path: string; midDeg: number } {
  const cover = ((d1 - d2) % 360 + 360) % 360;
  const start = cover <= 180 ? d1 : d2;
  const m = cover <= 180 ? cover : 360 - cover;
  return { path: pathArc(cx, cy, r, start, start - m), midDeg: start - m / 2 };
}

function sideName(labels: string[], side: number): string {
  return `${labels[side]}${labels[(side + 1) % 3]}`;
}

export const triangleLabeled: VisualTemplate<TriangleLabeledParams> = {
  name: 'triangleLabeled',
  paramsSchema: TriangleLabeledParamsZ,

  render(p) {
    const v = vertexPositions(p);
    const cx = (v[0][0] + v[1][0] + v[2][0]) / 3;
    const cy = (v[0][1] + v[1][1] + v[2][1]) / 3;
    const parts: string[] = [svgOpen(W, H)];
    parts.push(polygon(v, true));

    // vertex labels, pushed outward from the centroid
    p.labels.forEach((label, i) => {
      const [ux, uy] = unit(v[i][0] - cx, v[i][1] - cy);
      parts.push(text(v[i][0] + 24 * ux, v[i][1] + 24 * uy + 5, label, { size: 15, italic: true }));
    });

    // right-angle mark
    if (p.rightAngleAt !== undefined) {
      const i = p.rightAngleAt;
      const a = v[(i + 1) % 3];
      const b = v[(i + 2) % 3];
      const u1 = unit(a[0] - v[i][0], a[1] - v[i][1]);
      const u2 = unit(b[0] - v[i][0], b[1] - v[i][1]);
      const s = 14;
      parts.push(
        polygon(
          [
            [v[i][0] + s * u1[0], v[i][1] + s * u1[1]],
            [v[i][0] + s * (u1[0] + u2[0]), v[i][1] + s * (u1[1] + u2[1])],
            [v[i][0] + s * u2[0], v[i][1] + s * u2[1]],
          ],
          false,
        ),
      );
    }

    // angle arcs + labels
    for (const a of p.angles) {
      const i = a.vertex;
      const label = a.variable ?? (a.value !== undefined ? `${a.value}°` : undefined);
      if (label === undefined) continue;
      const d1 = dirDeg(v[i], v[(i + 1) % 3]);
      const d2 = dirDeg(v[i], v[(i + 2) % 3]);
      const arc = interiorArc(v[i][0], v[i][1], 24, d1, d2);
      if (i !== p.rightAngleAt) parts.push(arc.path);
      const [lx, ly] = polar(v[i][0], v[i][1], 46, arc.midDeg);
      parts.push(text(lx, ly + 4, label, { size: 13 }));
    }

    // side labels, pushed outward from the centroid
    for (const s of p.sides) {
      const a = v[s.side];
      const b = v[(s.side + 1) % 3];
      const mx = (a[0] + b[0]) / 2;
      const my = (a[1] + b[1]) / 2;
      const [nx, ny] = unit(mx - cx, my - cy);
      const label = s.variable ?? (s.value !== undefined ? `${s.value}${s.unit ? ` ${s.unit}` : ''}` : undefined);
      if (label === undefined) continue;
      parts.push(text(mx + 24 * nx, my + 24 * ny + 4, label, { size: 13 }));
    }

    // equal-side tick marks
    for (const t of p.equalTicks) {
      const a = v[t.side];
      const b = v[(t.side + 1) % 3];
      const mx = (a[0] + b[0]) / 2;
      const my = (a[1] + b[1]) / 2;
      const [ux, uy] = unit(b[0] - a[0], b[1] - a[1]);
      const [nx, ny] = [-uy, ux];
      for (let k = 0; k < t.count; k++) {
        const off = (k - (t.count - 1) / 2) * 6;
        const px = mx + off * ux;
        const py = my + off * uy;
        parts.push(line(px - 7 * nx, py - 7 * ny, px + 7 * nx, py + 7 * ny));
      }
    }

    parts.push('</svg>');
    return parts.join('');
  },

  describe(p) {
    const out: string[] = [`Triangle ${p.labels.join('')}.`];
    for (const a of p.angles) {
      const shown = a.variable ?? (a.value !== undefined ? `${a.value}°` : null);
      if (shown) out.push(`The angle at ${p.labels[a.vertex]} is marked ${shown}.`);
    }
    if (p.rightAngleAt !== undefined) {
      out.push(`There is a right angle at ${p.labels[p.rightAngleAt]}.`);
    }
    for (const s of p.sides) {
      const shown = s.variable ?? (s.value !== undefined ? `${s.value}${s.unit ? ` ${s.unit}` : ''}` : null);
      if (shown) out.push(`Side ${sideName(p.labels, s.side)} is marked ${shown}.`);
    }
    const byCount = new Map<number, string[]>();
    for (const t of p.equalTicks) {
      const list = byCount.get(t.count) ?? [];
      list.push(sideName(p.labels, t.side));
      byCount.set(t.count, list);
    }
    for (const [count, names] of byCount) {
      if (names.length >= 2) {
        out.push(`Sides ${names.join(' and ')} carry matching tick marks (${count === 1 ? 'single' : 'double'}), so they are equal in length.`);
      } else {
        out.push(`Side ${names[0]} carries ${count === 1 ? 'a single tick mark' : 'double tick marks'}.`);
      }
    }
    return out.join(' ');
  },

  verify(p, context) {
    const issues: string[] = [];
    const numeric = p.angles.filter((a) => a.value !== undefined);
    for (const a of numeric) {
      const value = a.value as number;
      if (value <= 0 || value >= 180) {
        issues.push(`triangleLabeled: angle ${value}° at ${p.labels[a.vertex]} must be strictly between 0° and 180°`);
      }
      if (!valueStatedInText(value, context)) {
        issues.push(`triangleLabeled: angle ${value}° never appears in the question text`);
      }
      if (p.rightAngleAt === a.vertex && Math.abs(value - 90) > 0.01) {
        issues.push(`triangleLabeled: vertex ${p.labels[a.vertex]} has a right-angle mark but is labeled ${value}°`);
      }
    }
    const sum = numeric.reduce((s, a) => s + (a.value as number), 0);
    if (numeric.length === 3) {
      if (Math.abs(sum - 180) > 0.01) {
        issues.push(`triangleLabeled: the three angles sum to ${round(sum)}°, expected 180°`);
      }
    } else if (sum > 180 + 0.01) {
      issues.push(`triangleLabeled: given angles sum to ${round(sum)}°, which exceeds 180°`);
    }
    for (const s of p.sides) {
      if (s.value !== undefined && !valueStatedInText(s.value, context)) {
        issues.push(`triangleLabeled: side length ${s.value} never appears in the question text`);
      }
    }
    return issues;
  },
};
