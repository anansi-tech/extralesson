import { z } from 'zod';
import { INK, line, round, svgOpen, text } from '../svg';
import type { VisualTemplate } from '../types';

// Square-grid cartesian plane with labeled axes and integer gridlines.
// Carries labeled points, polygons (including pre/post transformation
// overlays — the image polygon drawn dashed with primed labels), and
// straight lines given as y = mx + c.
const CoordZ = z.number().min(-50).max(50);

export const CoordinateGridParamsZ = z.object({
  x_range: z.tuple([z.number().int().min(-50).max(50), z.number().int().min(-50).max(50)]),
  y_range: z.tuple([z.number().int().min(-50).max(50), z.number().int().min(-50).max(50)]),
  points: z
    .array(z.object({ x: CoordZ, y: CoordZ, label: z.string().max(12).optional() }))
    .max(10)
    .default([]),
  polygons: z
    .array(
      z.object({
        vertices: z.array(z.object({ x: CoordZ, y: CoordZ })).min(3).max(8),
        labels: z.array(z.string().min(1).max(6)).max(8).optional(),
        dashed: z.boolean().default(false),
      }),
    )
    .max(2)
    .default([]),
  lines: z
    .array(
      z.object({
        m: z.number().min(-50).max(50),
        c: z.number().min(-100).max(100),
        label: z.string().max(24).optional(),
      }),
    )
    .max(4)
    .default([]),
});

export type CoordinateGridParams = z.infer<typeof CoordinateGridParamsZ>;

const W = 640;
const PAD = 45;
const MAX_PLOT_H = 400;
const TOL = 0.01;

type Pt = { x: number; y: number };

function matchesMap(a: Pt[], b: Pt[], f: (p: Pt) => Pt): boolean {
  return a.every((p, i) => {
    const q = f(p);
    return Math.abs(q.x - b[i].x) <= TOL && Math.abs(q.y - b[i].y) <= TOL;
  });
}

// Single standard CSEC transformation: translation, reflection in the x-axis,
// y-axis, or y = x, rotation of 90/180/270 about O, or enlargement from O.
function isStandardTransformation(a: Pt[], b: Pt[]): boolean {
  const fixed: ((p: Pt) => Pt)[] = [
    (p) => ({ x: p.x, y: -p.y }), // reflection in x-axis
    (p) => ({ x: -p.x, y: p.y }), // reflection in y-axis
    (p) => ({ x: p.y, y: p.x }), // reflection in y = x
    (p) => ({ x: -p.y, y: p.x }), // rotation 90° about O
    (p) => ({ x: -p.x, y: -p.y }), // rotation 180° about O
    (p) => ({ x: p.y, y: -p.x }), // rotation 270° about O
  ];
  if (fixed.some((f) => matchesMap(a, b, f))) return true;
  const dx = b[0].x - a[0].x;
  const dy = b[0].y - a[0].y;
  if (matchesMap(a, b, (p) => ({ x: p.x + dx, y: p.y + dy }))) return true;
  const i = a.findIndex((p) => Math.abs(p.x) > TOL || Math.abs(p.y) > TOL);
  if (i >= 0) {
    const k = Math.abs(a[i].x) > TOL ? b[i].x / a[i].x : b[i].y / a[i].y;
    if (Number.isFinite(k) && matchesMap(a, b, (p) => ({ x: k * p.x, y: k * p.y }))) return true;
  }
  return false;
}

// Parse a label of the form "y = 2x + 1" / "y = x - 3" / "y = -x" / "y = 3".
export function parseLineLabel(label: string): { m: number; c: number } | null {
  const s = label.replace(/[\s$]/g, '');
  const match = s.match(/^y=(?:(-?\d*(?:\.\d+)?)x)?([+-]?\d+(?:\.\d+)?)?$/);
  if (!match) return null;
  const [, mRaw, cRaw] = match;
  if (mRaw === undefined && cRaw === undefined) return null;
  const m = mRaw === undefined ? 0 : mRaw === '' ? 1 : mRaw === '-' ? -1 : Number(mRaw);
  const c = cRaw === undefined ? 0 : Number(cRaw);
  return { m, c };
}

function fmtLine(m: number, c: number): string {
  if (m === 0) return `y = ${c}`;
  const ms = m === 1 ? '' : m === -1 ? '-' : String(m);
  const cs = c === 0 ? '' : c > 0 ? ` + ${c}` : ` - ${-c}`;
  return `y = ${ms}x${cs}`;
}

// Two farthest-apart points where y = mx + c crosses the visible window.
function clipLine(
  m: number,
  c: number,
  xmin: number,
  xmax: number,
  ymin: number,
  ymax: number,
): [[number, number], [number, number]] | null {
  const eps = 1e-9;
  const cand: [number, number][] = [];
  const add = (x: number, y: number) => {
    if (x >= xmin - eps && x <= xmax + eps && y >= ymin - eps && y <= ymax + eps) cand.push([x, y]);
  };
  add(xmin, m * xmin + c);
  add(xmax, m * xmax + c);
  if (m !== 0) {
    add((ymin - c) / m, ymin);
    add((ymax - c) / m, ymax);
  }
  let best: [[number, number], [number, number]] | null = null;
  let bestD = eps;
  for (let i = 0; i < cand.length; i++) {
    for (let j = i + 1; j < cand.length; j++) {
      const d = (cand[i][0] - cand[j][0]) ** 2 + (cand[i][1] - cand[j][1]) ** 2;
      if (d > bestD) {
        bestD = d;
        best = [cand[i], cand[j]];
      }
    }
  }
  return best;
}

export const coordinateGrid: VisualTemplate<CoordinateGridParams> = {
  name: 'coordinateGrid',
  // Invariants enforced by verify(); surfaced to the draft prompt.
  rules: [
    "x_range and y_range must be ascending and each span at most 20 units",
    "every point and polygon vertex must lie inside the ranges",
    "if you supply TWO polygons the second must be the image of the first under ONE standard transformation: translation, reflection in an axis or y = x, rotation of 90/180/270 about the origin, or enlargement from the origin",
    "a line label written as y = mx + c must match that line's m and c",
  ],
  paramsSchema: CoordinateGridParamsZ,

  render(p) {
    const [xmin, xmax] = p.x_range;
    const [ymin, ymax] = p.y_range;
    const spanX = Math.max(1, xmax - xmin);
    const spanY = Math.max(1, ymax - ymin);
    const u = Math.min((W - 2 * PAD) / spanX, MAX_PLOT_H / spanY);
    const gridW = spanX * u;
    const gridH = spanY * u;
    const ox = (W - gridW) / 2;
    const oy = PAD;
    const H = Math.round(gridH + 2 * PAD);
    const X = (v: number) => ox + (v - xmin) * u;
    const Y = (v: number) => oy + (ymax - v) * u;

    const parts: string[] = [svgOpen(W, H)];
    // integer gridlines, step 1
    for (let gx = xmin; gx <= xmax; gx++) {
      parts.push(
        `<line x1="${round(X(gx))}" y1="${round(oy)}" x2="${round(X(gx))}" y2="${round(oy + gridH)}" stroke-width="0.5" />`,
      );
    }
    for (let gy = ymin; gy <= ymax; gy++) {
      parts.push(
        `<line x1="${round(ox)}" y1="${round(Y(gy))}" x2="${round(ox + gridW)}" y2="${round(Y(gy))}" stroke-width="0.5" />`,
      );
    }
    const hasXAxis = ymin <= 0 && 0 <= ymax;
    const hasYAxis = xmin <= 0 && 0 <= xmax;
    if (hasXAxis) {
      const y = Y(0);
      parts.push(line(ox - 8, y, ox + gridW + 12, y));
      parts.push(`<polygon points="${round(ox + gridW + 18)},${round(y)} ${round(ox + gridW + 10)},${round(y - 4)} ${round(ox + gridW + 10)},${round(y + 4)}" fill="${INK}" />`);
      parts.push(text(ox + gridW + 28, y + 4, 'x', { italic: true }));
    }
    if (hasYAxis) {
      const x = X(0);
      parts.push(line(x, oy + gridH + 8, x, oy - 12));
      parts.push(`<polygon points="${round(x)},${round(oy - 18)} ${round(x - 4)},${round(oy - 10)} ${round(x + 4)},${round(oy - 10)}" fill="${INK}" />`);
      parts.push(text(x, oy - 24, 'y', { italic: true }));
    }
    // integer labels along the axes (or grid edges when an axis is off-screen)
    const labelY = hasXAxis ? Y(0) + 14 : oy + gridH + 16;
    for (let gx = xmin; gx <= xmax; gx++) {
      if (gx !== 0) parts.push(text(X(gx), labelY, String(gx), { size: 9 }));
    }
    const labelX = hasYAxis ? X(0) - 5 : ox - 6;
    for (let gy = ymin; gy <= ymax; gy++) {
      if (gy !== 0) parts.push(text(labelX, Y(gy) + 3, String(gy), { size: 9, anchor: 'end' }));
    }
    if (hasXAxis && hasYAxis) parts.push(text(X(0) - 5, Y(0) + 14, 'O', { size: 10, anchor: 'end' }));
    // straight lines y = mx + c across the visible window
    for (const ln of p.lines) {
      const seg = clipLine(ln.m, ln.c, xmin, xmax, ymin, ymax);
      if (!seg) continue;
      const [[x1, y1], [x2, y2]] = seg;
      parts.push(line(X(x1), Y(y1), X(x2), Y(y2)));
      if (ln.label) {
        const mx = (X(x1) + X(x2)) / 2;
        const my = (Y(y1) + Y(y2)) / 2;
        parts.push(text(mx + 10, my - 8, ln.label, { size: 12, anchor: 'start' }));
      }
    }
    // polygons (image polygon drawn dashed for transformation overlays)
    for (const poly of p.polygons) {
      const px = poly.vertices.map((v) => [X(v.x), Y(v.y)] as [number, number]);
      const d = px.map((pt) => `${round(pt[0])},${round(pt[1])}`).join(' ');
      parts.push(`<polygon points="${d}"${poly.dashed ? ' stroke-dasharray="6 4"' : ''} />`);
      if (poly.labels) {
        const cx = px.reduce((s, pt) => s + pt[0], 0) / px.length;
        const cy = px.reduce((s, pt) => s + pt[1], 0) / px.length;
        poly.labels.forEach((lab, i) => {
          if (i >= px.length) return;
          const dx = px[i][0] - cx;
          const dy = px[i][1] - cy;
          const len = Math.hypot(dx, dy) || 1;
          parts.push(text(px[i][0] + (dx / len) * 14, px[i][1] + (dy / len) * 14 + 4, lab, { size: 12 }));
        });
      }
    }
    // labeled points
    for (const pt of p.points) {
      parts.push(`<circle cx="${round(X(pt.x))}" cy="${round(Y(pt.y))}" r="3.5" fill="${INK}" />`);
      if (pt.label) parts.push(text(X(pt.x) + 8, Y(pt.y) - 8, pt.label, { size: 12, anchor: 'start' }));
    }
    parts.push('</svg>');
    return parts.join('');
  },

  describe(p) {
    const bits: string[] = [
      `Cartesian grid with x from ${p.x_range[0]} to ${p.x_range[1]} and y from ${p.y_range[0]} to ${p.y_range[1]}, gridlines every 1 unit.`,
    ];
    for (const pt of p.points) {
      bits.push(`Point${pt.label ? ` ${pt.label}` : ''} at (${pt.x}, ${pt.y}).`);
    }
    p.polygons.forEach((poly, i) => {
      const verts = poly.vertices
        .map((v, j) => `${poly.labels?.[j] ? `${poly.labels[j]} ` : ''}(${v.x}, ${v.y})`)
        .join(', ');
      bits.push(`Polygon ${i + 1}${poly.dashed ? ' (drawn dashed)' : ''} with vertices ${verts}.`);
    });
    for (const ln of p.lines) {
      bits.push(`Straight line ${fmtLine(ln.m, ln.c)}${ln.label ? ` labeled "${ln.label}"` : ''}.`);
    }
    return bits.join(' ');
  },

  verify(p) {
    const issues: string[] = [];
    const [xmin, xmax] = p.x_range;
    const [ymin, ymax] = p.y_range;
    if (xmin >= xmax) issues.push('coordinateGrid: x_range must be ascending');
    if (ymin >= ymax) issues.push('coordinateGrid: y_range must be ascending');
    if (xmax - xmin > 20) issues.push('coordinateGrid: x_range span exceeds 20');
    if (ymax - ymin > 20) issues.push('coordinateGrid: y_range span exceeds 20');
    const inRange = (x: number, y: number) => x >= xmin && x <= xmax && y >= ymin && y <= ymax;
    for (const pt of p.points) {
      if (!inRange(pt.x, pt.y)) {
        issues.push(`coordinateGrid: point (${pt.x}, ${pt.y}) outside the visible range`);
      }
    }
    p.polygons.forEach((poly, i) => {
      for (const v of poly.vertices) {
        if (!inRange(v.x, v.y)) {
          issues.push(`coordinateGrid: polygon ${i + 1} vertex (${v.x}, ${v.y}) outside the visible range`);
        }
      }
      if (poly.labels && poly.labels.length !== poly.vertices.length) {
        issues.push(`coordinateGrid: polygon ${i + 1} has ${poly.labels.length} labels for ${poly.vertices.length} vertices`);
      }
    });
    if (
      p.polygons.length === 2 &&
      p.polygons[0].vertices.length === p.polygons[1].vertices.length &&
      !isStandardTransformation(p.polygons[0].vertices, p.polygons[1].vertices)
    ) {
      issues.push(
        'coordinateGrid: second polygon is not the image of the first under any single standard transformation (translation, reflection in an axis or y = x, rotation of 90/180/270 about O, or enlargement from O)',
      );
    }
    for (const ln of p.lines) {
      if (!ln.label) continue;
      const parsed = parseLineLabel(ln.label);
      if (parsed && (Math.abs(parsed.m - ln.m) > TOL || Math.abs(parsed.c - ln.c) > TOL)) {
        issues.push(
          `coordinateGrid: line label "${ln.label}" does not match the drawn line ${fmtLine(ln.m, ln.c)}`,
        );
      }
    }
    return issues;
  },
};
