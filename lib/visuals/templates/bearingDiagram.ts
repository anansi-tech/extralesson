import { z } from 'zod';
import { INK, line, pathArc, polar, round, svgOpen, text } from '../svg';
import { valueStatedInText, type VisualTemplate } from '../types';

// Bearing diagram: 1–3 labeled points, each with a north arrow, joined by
// legs with distance labels. Bearings are drawn as arcs swept clockwise from
// north and labeled in three-digit form ("060°") or with a variable. The
// TEMPLATE derives point positions from the legs' bearings and distances.

export const BearingDiagramParamsZ = z.object({
  points: z.array(z.object({ label: z.string().min(1).max(4) })).min(1).max(3),
  unit: z.enum(['km', 'm']).default('km'),
  legs: z
    .array(
      z.object({
        from: z.number().int().min(0).max(2), // point index
        to: z.number().int().min(0).max(2),
        bearing: z.number().min(0).lt(360), // bearing of `to` from `from`
        bearingLabel: z.string().max(8).optional(), // variable shown instead of the numeric bearing
        markBearing: z.boolean().default(true), // draw the arc from north
        distance: z.number().positive().max(100000).optional(),
        distanceLabel: z.string().max(12).optional(), // variable shown instead of the numeric distance
      }),
    )
    .max(3)
    .default([]),
});

export type BearingDiagramParams = z.infer<typeof BearingDiagramParamsZ>;

const W = 640;
const H = 440;

// Three-digit bearing label, e.g. 60 → "060°".
function fmtBearing(b: number): string {
  const s = String(round(b));
  const [int, frac] = s.split('.');
  return `${int.padStart(3, '0')}${frac ? `.${frac}` : ''}°`;
}

// Raw (unfitted) positions derived from the legs; north = -y.
function rawPositions(p: BearingDiagramParams): [number, number][] {
  const numeric = p.legs.map((l) => l.distance).filter((d): d is number => d !== undefined);
  const defaultD = numeric.length > 0 ? numeric.reduce((s, d) => s + d, 0) / numeric.length : 1;
  const pos: ([number, number] | null)[] = p.points.map(() => null);
  const delta = (l: (typeof p.legs)[number]): [number, number] => {
    const d = l.distance ?? defaultD;
    const rad = (l.bearing * Math.PI) / 180;
    return [d * Math.sin(rad), -d * Math.cos(rad)];
  };
  for (const l of p.legs) {
    if (l.from >= pos.length || l.to >= pos.length || l.from === l.to) continue;
    if (pos[l.from] === null && pos[l.to] === null) pos[l.from] = [0, 0];
    const [dx, dy] = delta(l);
    const from = pos[l.from];
    const to = pos[l.to];
    if (from !== null && to === null) pos[l.to] = [from[0] + dx, from[1] + dy];
    else if (from === null && to !== null) pos[l.from] = [to[0] - dx, to[1] - dy];
  }
  let spare = 0;
  for (let i = 0; i < pos.length; i++) {
    if (pos[i] === null) pos[i] = [spare++ * 1.2 * defaultD, 0];
  }
  return pos as [number, number][];
}

// Fit raw positions into the canvas, leaving room for north arrows and labels.
function fitted(p: BearingDiagramParams): [number, number][] {
  const raw = rawPositions(p);
  const xs = raw.map((v) => v[0]);
  const ys = raw.map((v) => v[1]);
  const spanX = Math.max(...xs) - Math.min(...xs);
  const spanY = Math.max(...ys) - Math.min(...ys);
  const availW = W - 220;
  const availH = H - 230;
  const s = Math.min(spanX > 0 ? availW / spanX : Infinity, spanY > 0 ? availH / spanY : Infinity);
  const scale = Number.isFinite(s) ? s : 1;
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  return raw.map(([x, y]) => [W / 2 + (x - cx) * scale, H / 2 + 30 + (y - cy) * scale]);
}

function dirDeg(from: [number, number], to: [number, number]): number {
  return (Math.atan2(from[1] - to[1], to[0] - from[0]) * 180) / Math.PI;
}

export const bearingDiagram: VisualTemplate<BearingDiagramParams> = {
  name: 'bearingDiagram',
  // Invariants enforced by verify(); surfaced to the draft prompt.
  rules: [
    "bearings must be in [0, 360)",
    "each leg's from/to must index a declared point and cannot be the same point",
    "if a return bearing is also marked it must equal (forward + 180) mod 360",
  ],
  paramsSchema: BearingDiagramParamsZ,

  render(p) {
    const pos = fitted(p);
    const parts: string[] = [svgOpen(W, H)];

    // north arrows first (under segments/labels)
    pos.forEach(([x, y]) => {
      parts.push(line(x, y, x, y - 64));
      parts.push(
        `<polygon points="${round(x)},${round(y - 72)} ${round(x - 5)},${round(y - 60)} ${round(x + 5)},${round(y - 60)}" fill="${INK}" stroke="none" />`,
      );
      parts.push(text(x, y - 78, 'N', { size: 13 }));
    });

    // legs
    for (const l of p.legs) {
      if (l.from >= pos.length || l.to >= pos.length || l.from === l.to) continue;
      const a = pos[l.from];
      const b = pos[l.to];
      parts.push(line(a[0], a[1], b[0], b[1]));
      const distText = l.distanceLabel ?? (l.distance !== undefined ? `${l.distance} ${p.unit}` : undefined);
      if (distText !== undefined) {
        const mx = (a[0] + b[0]) / 2;
        const my = (a[1] + b[1]) / 2;
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
        let nx = (b[1] - a[1]) / len;
        let ny = -(b[0] - a[0]) / len;
        if (ny > 0) {
          nx = -nx;
          ny = -ny; // keep the distance label above the segment
        }
        parts.push(text(mx + 16 * nx, my + 16 * ny + 4, distText, { size: 13 }));
      }
      if (l.markBearing) {
        const segDeg = dirDeg(a, b);
        const cover = ((90 - segDeg) % 360 + 360) % 360; // clockwise from north
        parts.push(pathArc(a[0], a[1], 34, 90, 90 - cover));
        const bearingText = l.bearingLabel ?? fmtBearing(l.bearing);
        const [lx, ly] = polar(a[0], a[1], 52, 90 - cover / 2);
        parts.push(text(lx, ly + 4, bearingText, { size: 13 }));
      }
    }

    // point dots and labels
    p.points.forEach((pt, i) => {
      const [x, y] = pos[i];
      parts.push(`<circle cx="${round(x)}" cy="${round(y)}" r="3" fill="${INK}" stroke="none" />`);
      parts.push(text(x - 14, y + 16, pt.label, { size: 15, italic: true }));
    });

    parts.push('</svg>');
    return parts.join('');
  },

  describe(p) {
    const out: string[] = [
      `Bearing diagram with north lines drawn at ${p.points.map((pt) => pt.label).join(', ')}.`,
    ];
    for (const l of p.legs) {
      if (l.from >= p.points.length || l.to >= p.points.length) continue;
      const from = p.points[l.from].label;
      const to = p.points[l.to].label;
      const bearingText = l.bearingLabel ?? fmtBearing(l.bearing);
      const distText = l.distanceLabel ?? (l.distance !== undefined ? `${l.distance} ${p.unit}` : null);
      let s = `${to} lies on a bearing of ${bearingText} from ${from}`;
      if (distText) s += `, at a distance of ${distText}`;
      s += l.markBearing ? ` (the bearing is marked at ${from}).` : '.';
      out.push(s);
    }
    return out.join(' ');
  },

  verify(p, context) {
    const issues: string[] = [];
    const labels = new Set(p.points.map((pt) => pt.label));
    if (labels.size !== p.points.length) issues.push('bearingDiagram: duplicate point labels');
    for (const l of p.legs) {
      if (l.from >= p.points.length || l.to >= p.points.length) {
        issues.push(`bearingDiagram: leg refers to point index ${Math.max(l.from, l.to)} but only ${p.points.length} points exist`);
        continue;
      }
      if (l.from === l.to) {
        issues.push(`bearingDiagram: leg from ${p.points[l.from].label} to itself`);
        continue;
      }
      if (l.bearing < 0 || l.bearing >= 360) {
        issues.push(`bearingDiagram: bearing ${l.bearing}° outside [0, 360)`);
      }
      if (l.markBearing && l.bearingLabel === undefined && !valueStatedInText(l.bearing, context)) {
        issues.push(`bearingDiagram: bearing ${fmtBearing(l.bearing)} never appears in the question text`);
      }
      if (l.distance !== undefined && !valueStatedInText(l.distance, context)) {
        issues.push(`bearingDiagram: distance ${l.distance} ${p.unit} never appears in the question text`);
      }
    }
    // return bearings must be the forward bearing + 180 (mod 360)
    for (let i = 0; i < p.legs.length; i++) {
      for (let j = i + 1; j < p.legs.length; j++) {
        const a = p.legs[i];
        const b = p.legs[j];
        if (a.from !== b.to || a.to !== b.from) continue;
        if (a.bearingLabel !== undefined || b.bearingLabel !== undefined) continue;
        if (!a.markBearing || !b.markBearing) continue;
        const expected = (a.bearing + 180) % 360;
        const diff = Math.abs(b.bearing - expected);
        if (Math.min(diff, 360 - diff) > 0.01) {
          issues.push(
            `bearingDiagram: return bearing ${fmtBearing(b.bearing)} should be ${fmtBearing(expected)} (forward bearing ${fmtBearing(a.bearing)} + 180°)`,
          );
        }
      }
    }
    return issues;
  },
};
