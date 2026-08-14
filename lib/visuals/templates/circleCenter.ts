import { z } from 'zod';
import { circle, line, pathArc, polar, svgOpen, text } from '../svg';
import { valueStatedInText, type VisualTemplate } from '../types';

// Circle with centre O. Points sit on the circumference at compass-style
// bearings (0° = top of the circle, clockwise). Optional radii, chords, a
// diameter, a tangent, and marked angles at the centre or circumference.

const LabelZ = z.string().min(1).max(4);

export const CircleCenterParamsZ = z.object({
  points: z
    .array(
      z.object({
        label: LabelZ,
        bearing: z.number().min(0).max(360), // 0 = top, clockwise
        radius: z.boolean().default(false), // draw the radius O–point
      }),
    )
    .max(6)
    .default([]),
  chords: z.array(z.object({ from: LabelZ, to: LabelZ })).max(4).default([]),
  diameter: z.object({ from: LabelZ, to: LabelZ }).optional(),
  tangentAt: LabelZ.optional(),
  angles: z
    .array(
      z.object({
        vertex: LabelZ, // 'O' for the centre, else a circumference point label
        arc: z.tuple([LabelZ, LabelZ]), // endpoints of the subtended arc
        value: z.number().optional(), // degrees
        variable: z.string().max(8).optional(), // e.g. "x°"
      }),
    )
    .max(4)
    .default([]),
});

export type CircleCenterParams = z.infer<typeof CircleCenterParamsZ>;

const W = 640;
const H = 420;
const CX = 320;
const CY = 210;
const R = 158;

// Compass bearing → svg.ts polar() degrees.
function polarDeg(bearing: number): number {
  return 90 - bearing;
}

function pointPos(bearing: number): [number, number] {
  return polar(CX, CY, R, polarDeg(bearing));
}

function dirDeg(from: [number, number], to: [number, number]): number {
  return (Math.atan2(from[1] - to[1], to[0] - from[0]) * 180) / Math.PI;
}

export const circleCenter: VisualTemplate<CircleCenterParams> = {
  name: 'circleCenter',
  paramsSchema: CircleCenterParamsZ,

  render(p) {
    const pos = new Map<string, [number, number]>([['O', [CX, CY]]]);
    for (const pt of p.points) pos.set(pt.label, pointPos(pt.bearing));

    const parts: string[] = [svgOpen(W, H)];
    parts.push(circle(CX, CY, R));
    parts.push(`<circle cx="${CX}" cy="${CY}" r="2.5" fill="#1E2430" stroke="none" />`);
    parts.push(text(CX - 13, CY + 19, 'O', { size: 15, italic: true }));

    for (const pt of p.points) {
      const [px, py] = pos.get(pt.label) as [number, number];
      if (pt.radius) parts.push(line(CX, CY, px, py));
      const [lx, ly] = polar(CX, CY, R + 19, polarDeg(pt.bearing));
      parts.push(text(lx, ly + 5, pt.label, { size: 15, italic: true }));
    }

    for (const ch of p.chords) {
      const a = pos.get(ch.from);
      const b = pos.get(ch.to);
      if (a && b) parts.push(line(a[0], a[1], b[0], b[1]));
    }

    if (p.diameter) {
      const a = pos.get(p.diameter.from);
      const b = pos.get(p.diameter.to);
      if (a && b) parts.push(line(a[0], a[1], b[0], b[1]));
    }

    if (p.tangentAt) {
      const t = pos.get(p.tangentAt);
      const pt = p.points.find((q) => q.label === p.tangentAt);
      if (t && pt) {
        const d = polarDeg(pt.bearing) + 90; // perpendicular to the radius
        const [x1, y1] = polar(t[0], t[1], 140, d);
        const [x2, y2] = polar(t[0], t[1], 140, d + 180);
        parts.push(line(x1, y1, x2, y2));
      }
    }

    for (const a of p.angles) {
      const v = pos.get(a.vertex);
      const e1 = pos.get(a.arc[0]);
      const e2 = pos.get(a.arc[1]);
      if (!v || !e1 || !e2) continue;
      parts.push(line(v[0], v[1], e1[0], e1[1]));
      parts.push(line(v[0], v[1], e2[0], e2[1]));
      const d1 = dirDeg(v, e1);
      const d2 = dirDeg(v, e2);
      let cover = ((d1 - d2) % 360 + 360) % 360;
      let start = d1;
      // Draw the smaller region unless a reflex value says otherwise.
      const wantReflex = a.value !== undefined && a.value > 180;
      if ((cover > 180) !== wantReflex) {
        start = d2;
        cover = 360 - cover;
      }
      parts.push(pathArc(v[0], v[1], 26, start, start - cover));
      const label = a.variable ?? (a.value !== undefined ? `${a.value}°` : undefined);
      if (label !== undefined) {
        const [lx, ly] = polar(v[0], v[1], 47, start - cover / 2);
        parts.push(text(lx, ly + 4, label, { size: 13 }));
      }
    }

    parts.push('</svg>');
    return parts.join('');
  },

  describe(p) {
    const out: string[] = ['Circle with centre O.'];
    if (p.points.length > 0) {
      const list = p.points
        .map((pt) => `${pt.label} at ${pt.bearing}°`)
        .join(', ');
      out.push(`Points on the circumference (position measured clockwise from the top of the circle): ${list}.`);
      const radii = p.points.filter((pt) => pt.radius).map((pt) => `O${pt.label}`);
      if (radii.length > 0) out.push(`Radii drawn: ${radii.join(', ')}.`);
    }
    for (const ch of p.chords) out.push(`Chord ${ch.from}${ch.to} is drawn.`);
    if (p.diameter) out.push(`${p.diameter.from}${p.diameter.to} is a diameter.`);
    if (p.tangentAt) out.push(`A tangent touches the circle at ${p.tangentAt}.`);
    for (const a of p.angles) {
      const shown = a.variable ?? (a.value !== undefined ? `${a.value}°` : null);
      if (!shown) continue;
      const where = a.vertex === 'O' ? 'at the centre O' : `at ${a.vertex} on the circumference`;
      out.push(`The angle ${where} subtended by arc ${a.arc[0]}${a.arc[1]} is marked ${shown}.`);
    }
    return out.join(' ');
  },

  verify(p, context) {
    const issues: string[] = [];
    const known = new Set<string>(['O', ...p.points.map((pt) => pt.label)]);
    if (known.size !== p.points.length + 1) {
      issues.push('circleCenter: duplicate point labels');
    }
    for (const pt of p.points) {
      if (pt.bearing < 0 || pt.bearing > 360) {
        issues.push(`circleCenter: bearing ${pt.bearing} for ${pt.label} outside 0–360`);
      }
    }
    const refs: string[] = [
      ...p.chords.flatMap((c) => [c.from, c.to]),
      ...(p.diameter ? [p.diameter.from, p.diameter.to] : []),
      ...(p.tangentAt ? [p.tangentAt] : []),
      ...p.angles.flatMap((a) => [a.vertex, a.arc[0], a.arc[1]]),
    ];
    for (const r of refs) {
      if (!known.has(r)) issues.push(`circleCenter: reference to unknown point "${r}"`);
    }
    const arcKey = (a: [string, string]) => [...a].sort().join('|');
    for (const a of p.angles) {
      if (a.value === undefined) continue;
      if (!valueStatedInText(a.value, context)) {
        issues.push(`circleCenter: angle ${a.value}° never appears in the question text`);
      }
      if (a.vertex !== 'O') continue;
      for (const b of p.angles) {
        if (b.vertex === 'O' || b.value === undefined) continue;
        if (arcKey(a.arc) !== arcKey(b.arc)) continue;
        if (Math.abs(a.value - 2 * b.value) > 0.01) {
          issues.push(
            `circleCenter: centre angle ${a.value}° should be twice the circumference angle ${b.value}° on arc ${a.arc[0]}${a.arc[1]}`,
          );
        }
      }
    }
    return issues;
  },
};
