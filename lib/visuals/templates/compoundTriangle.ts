import { z } from 'zod';
import { line, pathArc, polar, polygon, round, svgOpen, text } from '../svg';
import { valueStatedInText, type VisualTemplate } from '../types';

// Two triangles in one figure, which triangleLabeled cannot draw: 'adjacent'
// share a SIDE (the vertical in the angle-of-elevation-from-two-points figure),
// 'nested' share a VERTEX (the apex of the similar-triangles figure). Angles are
// addressed as (at, from, to) because a shared vertex carries more than one
// angle, and a template that could not say WHICH would draw the wrong thing.

const ArrangementZ = z.enum(['adjacent', 'nested']);

const AngleZ = z.object({
  at: z.number().int().min(0).max(4),
  from: z.number().int().min(0).max(4),
  to: z.number().int().min(0).max(4),
  value: z.number().min(1).max(179).optional(),
  variable: z.string().max(8).optional(),
});

const SideZ = z.object({
  from: z.number().int().min(0).max(4),
  to: z.number().int().min(0).max(4),
  value: z.number().positive().max(100000).optional(),
  variable: z.string().max(8).optional(),
  unit: z.enum(['cm', 'm', 'km']).optional(),
});

export const CompoundTriangleParamsZ = z.object({
  arrangement: ArrangementZ,
  /** 'adjacent' takes 4 labels, 'nested' takes 5. See vertexOrder(). */
  labels: z.array(z.string().min(1).max(4)).min(4).max(5),
  angles: z.array(AngleZ).max(6).default([]),
  sides: z.array(SideZ).max(7).default([]),
  /** Right angles, drawn as the paper's square rather than an arc. */
  rightAngles: z
    .array(z.object({ at: z.number().int().min(0).max(4), from: z.number().int().min(0).max(4), to: z.number().int().min(0).max(4) }))
    .max(2)
    .default([]),
});

export type CompoundTriangleParams = z.infer<typeof CompoundTriangleParamsZ>;

const W = 640;
const H = 420;

/**
 * Vertex placement, and with it the meaning of each label index. adjacent:
 * 0,1,2 on level ground with 3 above 2, triangles (0,2,3) and (1,2,3). nested:
 * 0 the apex, 1-2 the base, 3-4 on the sloping sides and parallel to 1-2.
 */
function vertices(arrangement: CompoundTriangleParams['arrangement']): [number, number][] {
  if (arrangement === 'adjacent') {
    return [
      [80, 330],
      [310, 330],
      [540, 330],
      [540, 100],
    ];
  }
  const apex: [number, number] = [320, 80];
  const left: [number, number] = [110, 345];
  const right: [number, number] = [540, 345];
  const t = 0.46; // the cut is a sketch, not a scale drawing
  const along = (p: [number, number]): [number, number] => [
    apex[0] + (p[0] - apex[0]) * t,
    apex[1] + (p[1] - apex[1]) * t,
  ];
  return [apex, left, right, along(left), along(right)];
}

/** The segments actually drawn, as index pairs. */
function segments(arrangement: CompoundTriangleParams['arrangement']): [number, number][] {
  return arrangement === 'adjacent'
    ? [
        [0, 1],
        [1, 2],
        [2, 3],
        [0, 3],
        [1, 3],
      ]
    : [
        [0, 1],
        [1, 2],
        [2, 0],
        [3, 4],
      ];
}

function expectedLabelCount(arrangement: CompoundTriangleParams['arrangement']): number {
  return arrangement === 'adjacent' ? 4 : 5;
}

/**
 * Points on one straight line of the figure, in order along it. Any pair drawn
 * from a run is a real segment even when it is not listed above: the ground of
 * the 'adjacent' figure runs A-B-C, so an elevation at A is measured against it.
 */
function collinearRuns(arrangement: CompoundTriangleParams['arrangement']): number[][] {
  return arrangement === 'adjacent'
    ? [[0, 1, 2]]
    : [
        [0, 3, 1],
        [0, 4, 2],
      ];
}

function isDrawn(arrangement: CompoundTriangleParams['arrangement'], a: number, b: number): boolean {
  if (collinearRuns(arrangement).some((run) => run.includes(a) && run.includes(b))) return true;
  return segments(arrangement).some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

function dirDeg(from: [number, number], to: [number, number]): number {
  return (Math.atan2(from[1] - to[1], to[0] - from[0]) * 180) / Math.PI;
}

function unit(dx: number, dy: number): [number, number] {
  const len = Math.hypot(dx, dy) || 1;
  return [dx / len, dy / len];
}

function pairName(labels: string[], a: number, b: number): string {
  return `${labels[a]}${labels[b]}`;
}

export const compoundTriangle: VisualTemplate<CompoundTriangleParams> = {
  name: 'compoundTriangle',
  placesOwnPoints: true,
  rules: [
    "'adjacent' takes exactly 4 labels: the first three lie on level ground and the fourth is vertically above the third, so the triangles share the side between the last two",
    "'nested' takes exactly 5 labels: the first is the shared apex, the next two are the base, and the last two lie on the sloping sides with the segment between them parallel to the base",
    "an angle is written as {\"at\": 1, \"from\": 0, \"to\": 3} — the vertex it sits at, and the two vertices its arms run to — because a shared vertex has more than one angle",
    "every angle arm and every labelled side must run along a segment the figure actually draws",
    "the three angles of one triangle must sum to 180 when all three are given",
  ],
  paramsSchema: CompoundTriangleParamsZ,

  render(p) {
    const v = vertices(p.arrangement);
    const parts: string[] = [svgOpen(W, H)];

    if (p.arrangement === 'adjacent') {
      parts.push(polygon([v[0], v[2], v[3]], true));
      parts.push(line(v[1][0], v[1][1], v[3][0], v[3][1]));
    } else {
      parts.push(polygon([v[0], v[1], v[2]], true));
      parts.push(line(v[3][0], v[3][1], v[4][0], v[4][1]));
    }

    const cx = v.reduce((s, q) => s + q[0], 0) / v.length;
    const cy = v.reduce((s, q) => s + q[1], 0) / v.length;
    p.labels.forEach((label, i) => {
      const [ux, uy] = unit(v[i][0] - cx, v[i][1] - cy);
      parts.push(text(v[i][0] + 20 * ux, v[i][1] + 20 * uy + 5, label, { size: 15, italic: true, halo: true }));
    });

    for (const r of p.rightAngles) {
      const [ax, ay] = unit(v[r.from][0] - v[r.at][0], v[r.from][1] - v[r.at][1]);
      const [bx, by] = unit(v[r.to][0] - v[r.at][0], v[r.to][1] - v[r.at][1]);
      const s = 15;
      const c: [number, number] = [v[r.at][0] + (ax + bx) * s, v[r.at][1] + (ay + by) * s];
      parts.push(line(v[r.at][0] + ax * s, v[r.at][1] + ay * s, c[0], c[1]));
      parts.push(line(c[0], c[1], v[r.at][0] + bx * s, v[r.at][1] + by * s));
    }

    for (const a of p.angles) {
      const label = a.variable ?? (a.value !== undefined ? `${a.value}°` : undefined);
      const d1 = dirDeg(v[a.at], v[a.from]);
      const d2 = dirDeg(v[a.at], v[a.to]);
      let cover = (((d1 - d2) % 360) + 360) % 360;
      let start = d1;
      if (cover > 180) {
        start = d2;
        cover = 360 - cover;
      }
      parts.push(pathArc(v[a.at][0], v[a.at][1], 30, start, start - cover));
      if (label !== undefined) {
        const [lx, ly] = polar(v[a.at][0], v[a.at][1], 52, start - cover / 2);
        parts.push(text(lx, ly + 4, label, { size: 13, halo: true }));
      }
    }

    for (const s of p.sides) {
      const label = s.variable ?? (s.value !== undefined ? `${s.value}${s.unit ? ` ${s.unit}` : ''}` : undefined);
      if (label === undefined) continue;
      const mx = (v[s.from][0] + v[s.to][0]) / 2;
      const my = (v[s.from][1] + v[s.to][1]) / 2;
      const [nx, ny] = unit(mx - cx, my - cy);
      parts.push(text(mx + 22 * nx, my + 22 * ny + 4, label, { size: 13, halo: true }));
    }

    parts.push('</svg>');
    return parts.join('');
  },

  describe(p) {
    const L = p.labels;
    const out: string[] =
      p.arrangement === 'adjacent'
        ? [
            `Triangles ${L[0]}${L[2]}${L[3]} and ${L[1]}${L[2]}${L[3]} share the side ${pairName(L, 2, 3)}.`,
            `${L[0]}, ${L[1]} and ${L[2]} lie on level ground in that order, and ${L[3]} is vertically above ${L[2]}.`,
          ]
        : [
            `Triangles ${L[0]}${L[1]}${L[2]} and ${L[0]}${L[3]}${L[4]} share the vertex ${L[0]}.`,
            `${L[3]} lies on ${pairName(L, 0, 1)} and ${L[4]} lies on ${pairName(L, 0, 2)}, and ${pairName(L, 3, 4)} is parallel to ${pairName(L, 1, 2)}.`,
          ];

    for (const r of p.rightAngles) {
      out.push(`The angle at ${L[r.at]} between ${pairName(L, r.at, r.from)} and ${pairName(L, r.at, r.to)} is a right angle.`);
    }
    for (const a of p.angles) {
      const shown = a.variable ?? (a.value !== undefined ? `${a.value}°` : null);
      if (shown) {
        out.push(`Angle ${L[a.from]}${L[a.at]}${L[a.to]} is marked ${shown}.`);
      }
    }
    for (const s of p.sides) {
      const shown = s.variable ?? (s.value !== undefined ? `${s.value}${s.unit ? ` ${s.unit}` : ''}` : null);
      if (shown) out.push(`Side ${pairName(L, s.from, s.to)} is marked ${shown}.`);
    }
    return out.join(' ');
  },

  verify(p, context) {
    const issues: string[] = [];
    const want = expectedLabelCount(p.arrangement);
    if (p.labels.length !== want) {
      issues.push(`compoundTriangle: a '${p.arrangement}' figure takes ${want} labels, got ${p.labels.length}`);
      return issues; // every other check indexes into labels
    }
    if (new Set(p.labels).size !== p.labels.length) {
      issues.push('compoundTriangle: duplicate vertex labels');
    }

    const check = (a: number, b: number, what: string) => {
      if (a === b) {
        issues.push(`compoundTriangle: ${what} joins ${p.labels[a]} to itself`);
      } else if (!isDrawn(p.arrangement, a, b)) {
        issues.push(`compoundTriangle: ${what} ${pairName(p.labels, a, b)} is not a segment this figure draws`);
      }
    };
    for (const a of p.angles) {
      check(a.at, a.from, 'angle arm');
      check(a.at, a.to, 'angle arm');
    }
    for (const r of p.rightAngles) {
      check(r.at, r.from, 'right-angle arm');
      check(r.at, r.to, 'right-angle arm');
    }
    for (const s of p.sides) check(s.from, s.to, 'side');

    for (const a of p.angles) {
      if (a.value !== undefined && !valueStatedInText(a.value, context)) {
        issues.push(`compoundTriangle: angle ${a.value}° never appears in the question text`);
      }
    }
    for (const s of p.sides) {
      if (s.value !== undefined && !valueStatedInText(s.value, context)) {
        issues.push(`compoundTriangle: side length ${s.value} never appears in the question text`);
      }
    }

    // A triangle whose three angles are all given must be a possible triangle.
    const triangles: number[][] =
      p.arrangement === 'adjacent'
        ? [
            [0, 2, 3],
            [1, 2, 3],
          ]
        : [
            [0, 1, 2],
            [0, 3, 4],
          ];
    for (const tri of triangles) {
      const given = tri
        .map((at) => {
          const others = tri.filter((x) => x !== at);
          const found = p.angles.find(
            (a) =>
              a.at === at &&
              a.value !== undefined &&
              others.includes(a.from) &&
              others.includes(a.to),
          );
          const right = p.rightAngles.find(
            (r) => r.at === at && others.includes(r.from) && others.includes(r.to),
          );
          return found?.value ?? (right ? 90 : null);
        })
        .filter((x): x is number => x !== null);
      if (given.length === 3) {
        const sum = given.reduce((s, x) => s + x, 0);
        if (Math.abs(sum - 180) > 0.01) {
          issues.push(
            `compoundTriangle: the angles of triangle ${tri.map((i) => p.labels[i]).join('')} sum to ${round(sum)}°, expected 180°`,
          );
        }
      }
    }
    return issues;
  },
};
