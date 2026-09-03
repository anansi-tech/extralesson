import { z } from 'zod';
import { hatchDefs, hatchFill, INK, line, meshDefs, meshRect, plotMark, round, svgOpen, text } from '../svg';
import type { VerifyContext, VisualTemplate } from '../types';
import { namedPoints, resolvePoints } from '../points';

const CoordZ = z.number().min(-50).max(50);

// A, A', A'', A_1 — every way the papers name an image point.
const NameZ = z.string().regex(/^[A-Z](?:'{1,2}|_\d)?$/);

export const CoordinateGridParamsZ = z.object({
  // Omit both ranges when `named` supplies the geometry: the window is then
  // derived from the points the question states.
  x_range: z.tuple([z.number().int().min(-50).max(50), z.number().int().min(-50).max(50)]).optional(),
  y_range: z.tuple([z.number().int().min(-50).max(50), z.number().int().min(-50).max(50)]).optional(),
  /**
   * Coordinates live in the question text and nowhere else, so the figure
   * cannot disagree with it. `sketch` (the default) drops axes, gridlines and
   * scale numbers — the schematic the papers print.
   */
  named: z
    .object({
      polygons: z
        .array(
          z.object({
            points: z.array(NameZ).min(3).max(10),
            dashed: z.boolean().default(false),
            shaded: z.boolean().default(false),
            name: z.string().min(1).max(6).optional(),
          }),
        )
        .max(3)
        .default([]),
      points: z.array(NameZ).max(8).default([]),
      sketch: z.boolean().default(true),
    })
    .optional(),
  points: z
    .array(z.object({ x: CoordZ, y: CoordZ, label: z.string().max(12).optional() }))
    .max(10)
    .default([]),
  polygons: z
    .array(
      z.object({
        vertices: z.array(z.object({ x: CoordZ, y: CoordZ })).min(3).max(10),
        /** Per-VERTEX labels, in order: A, B, C round the shape. */
        labels: z.array(z.string().min(1).max(6)).max(10).optional(),
        /** Names the WHOLE shape ("Quadrilateral P"), not its corners. */
        name: z.string().min(1).max(6).optional(),
        dashed: z.boolean().default(false),
        shaded: z.boolean().default(false),
      }),
    )
    // A transformation question shows an object and up to three images.
    .max(4)
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
  // `domain` restricts the x values plotted; omit it for the whole window.
  curves: z
    .array(
      z.object({
        a: z.number().min(-20).max(20),
        b: z.number().min(-50).max(50),
        c: z.number().min(-100).max(100),
        label: z.string().max(24).optional(),
        domain: z.tuple([CoordZ, CoordZ]).optional(),
        plotted: z.array(CoordZ).max(12).optional(),
      }),
    )
    .max(3)
    .default([]),
  // Every constraint is normalised to a*x + b*y <= c ('le') or >= c ('ge'),
  // so y <= mx + k and x >= k are the same shape. A region is shaded where
  // EVERY one of its constraints holds.
  regions: z
    .array(
      z.object({
        constraints: z
          .array(
            z.object({
              a: z.number().min(-50).max(50),
              b: z.number().min(-50).max(50),
              c: z.number().min(-500).max(500),
              op: z.enum(['le', 'ge']),
            }),
          )
          .min(1)
          .max(5),
        label: z.string().max(40).optional(),
      }),
    )
    .max(2)
    .default([]),
});

export type CoordinateGridParams = z.infer<typeof CoordinateGridParamsZ>;

const W = 640;
const PAD = 45;
const MAX_PLOT_H = 400;
// Unit scales stay equal — a gradient or parabola on unequal axes lies — so a
// lopsided window widens its short axis symmetrically instead, which shows more
// of the plane and can never hide a feature the question refers to.
const MAX_ASPECT = 1.6;

// Labels ride near the far end of a run: the middle of a graph is its most
// crowded part, at the origin and the tick numerals. Only when the end itself
// lands on an axis does the anchor walk back until clear — backing off
// unconditionally would undo what putting labels at the end fixed.
const AXIS_CLEARANCE = 24; // px

function labelAtEnd(
  pts: [number, number][],
  canvasW: number,
  canvasH: number,
  axes?: { x?: number; y?: number }, // screen positions of the drawn axes
): { x: number; y: number; anchor: 'start' | 'end' } {
  const end = pts[pts.length - 1];
  const prev = pts[Math.max(0, pts.length - 2)];
  const dx = end[0] - prev[0];
  const dy = end[1] - prev[1];
  const len = Math.hypot(dx, dy) || 1;

  const from = pts[0];
  const clearOf = (x: number, y: number) =>
    (axes?.x === undefined || Math.abs(y - axes.x) > AXIS_CLEARANCE) &&
    (axes?.y === undefined || Math.abs(x - axes.y) > AXIS_CLEARANCE);
  let t = 0;
  let ax = end[0];
  let ay = end[1];
  while (t < 0.5 && !clearOf(ax, ay)) {
    t += 0.05;
    ax = end[0] + (from[0] - end[0]) * t;
    ay = end[1] + (from[1] - end[1]) * t;
  }

  // perpendicular, upward on screen, so the label sits off the stroke
  const nx = (-dy / len) * 12;
  const ny = (dx / len) * 12 - 4;
  const toRight = ax > canvasW / 2;
  const anchor: 'start' | 'end' = toRight ? 'end' : 'start';
  const x = Math.min(canvasW - 6, Math.max(6, ax + nx + (toRight ? -6 : 6)));
  const y = Math.min(canvasH - 6, Math.max(14, ay + ny));
  return { x, y, anchor };
}

// Derived from the question's own coordinates; nothing is stored twice.
interface ResolvedFigure {
  polygons: { vertices: [number, number][]; labels: string[]; dashed: boolean; shaded: boolean; name?: string }[];
  points: { x: number; y: number; label: string }[];
}

function resolveFigure(
  named: NonNullable<CoordinateGridParams['named']>,
  context: VerifyContext | undefined,
): ResolvedFigure {
  const polygons = named.polygons.map((poly) => {
    const { points } = resolvePoints(poly.points, context);
    return {
      vertices: points.map((pt) => [pt.x, pt.y] as [number, number]),
      labels: points.map((pt) => pt.label),
      dashed: poly.dashed,
      shaded: poly.shaded,
      name: poly.name,
    };
  });
  const points = resolvePoints(named.points, context).points.map((pt) => ({
    x: pt.x,
    y: pt.y,
    label: pt.label,
  }));
  return { polygons: polygons.filter((poly) => poly.vertices.length >= 3), points };
}

function polygonSvg(points: [number, number][], dashed: boolean, shaded: boolean): string {
  const d = points.map((pt) => `${round(pt[0])},${round(pt[1])}`).join(' ');
  const fill = shaded ? ' fill="#D8D2C6"' : '';
  return `<polygon points="${d}"${fill}${dashed ? ' stroke-dasharray="6 4"' : ''} />`;
}

function shapeName(points: [number, number][], name: string | undefined): string {
  if (!name) return '';
  const cx = points.reduce((s, pt) => s + pt[0], 0) / points.length;
  const cy = points.reduce((s, pt) => s + pt[1], 0) / points.length;
  return text(cx, cy + 4, name, { size: 14, italic: true, halo: true });
}

function windowFor(figure: ResolvedFigure): { x: [number, number]; y: [number, number] } {
  const xs = [...figure.polygons.flatMap((p) => p.vertices.map((v) => v[0])), ...figure.points.map((p) => p.x)];
  const ys = [...figure.polygons.flatMap((p) => p.vertices.map((v) => v[1])), ...figure.points.map((p) => p.y)];
  if (xs.length === 0) return { x: [-5, 5], y: [-5, 5] };
  return {
    x: [Math.floor(Math.min(...xs)) - 1, Math.ceil(Math.max(...xs)) + 1],
    y: [Math.floor(Math.min(...ys)) - 1, Math.ceil(Math.max(...ys)) + 1],
  };
}

function balanceWindow(
  [xmin, xmax]: [number, number],
  [ymin, ymax]: [number, number],
): { xmin: number; xmax: number; ymin: number; ymax: number } {
  let [a, b, c, d] = [xmin, xmax, ymin, ymax];
  const grow = (lo: number, hi: number, want: number): [number, number] => {
    const extra = (want - (hi - lo)) / 2;
    return [Math.floor(lo - extra), Math.ceil(hi + extra)];
  };
  const spanX = b - a;
  const spanY = d - c;
  if (spanY > spanX * MAX_ASPECT) [a, b] = grow(a, b, spanY / MAX_ASPECT);
  else if (spanX > spanY * MAX_ASPECT) [c, d] = grow(c, d, spanX / MAX_ASPECT);
  return { xmin: a, xmax: b, ymin: c, ymax: d };
}
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

// Parse a label of the form "y = x^2 - 2x - 3" / "y = -2x²+5" / "y = x^2".
export function parseQuadraticLabel(
  label: string,
): { a: number; b: number; c: number } | null {
  const s = label.replace(/[\s$]/g, '').replace(/²/g, '^2');
  const match = s.match(
    /^y=(-?\d*(?:\.\d+)?)x\^2([+-]\d*(?:\.\d+)?)?x?([+-]\d+(?:\.\d+)?)?$/,
  );
  if (!match) return null;
  const [, aRaw, bRaw, cRaw] = match;
  const coeff = (raw: string | undefined, fallback: number): number =>
    raw === undefined ? fallback : raw === '' || raw === '+' ? 1 : raw === '-' ? -1 : Number(raw);
  // "y=x^2-3" has no x term: the middle group only holds b when an "x" follows.
  const hasXTerm = /x\^2[+-]\d*(?:\.\d+)?x/.test(s);
  return {
    a: coeff(aRaw, 1),
    b: hasXTerm ? coeff(bRaw, 0) : 0,
    c: Number(hasXTerm ? (cRaw ?? 0) : (bRaw ?? cRaw ?? 0)),
  };
}

// Features of y = ax^2 + bx + c, used for the question-text cross-checks.
function vertexOf(a: number, b: number, c: number): { x: number; y: number } {
  const x = -b / (2 * a);
  return { x, y: a * x * x + b * x + c };
}

function rootsOf(a: number, b: number, c: number): number[] {
  const disc = b * b - 4 * a * c;
  if (disc < 0) return [];
  const s = Math.sqrt(disc);
  return disc === 0 ? [-b / (2 * a)] : [(-b - s) / (2 * a), (-b + s) / (2 * a)];
}

function fmtQuadratic(a: number, b: number, c: number): string {
  const as = a === 1 ? '' : a === -1 ? '-' : String(a);
  const bs = b === 0 ? '' : b === 1 ? ' + x' : b === -1 ? ' - x' : b > 0 ? ` + ${b}x` : ` - ${-b}x`;
  const cs = c === 0 ? '' : c > 0 ? ` + ${c}` : ` - ${-c}`;
  return `y = ${as}x^2${bs}${cs}`;
}

// Split into contiguous runs with interpolated edge crossings: a curve may
// leave the top of the grid and re-enter further along.
function sampleCurve(
  a: number,
  b: number,
  c: number,
  xlo: number,
  xhi: number,
  ymin: number,
  ymax: number,
): [number, number][][] {
  const SAMPLES = 240;
  const at = (x: number) => a * x * x + b * x + c;
  const runs: [number, number][][] = [];
  let run: [number, number][] = [];
  let prev: { x: number; y: number; inside: boolean } | null = null;
  for (let i = 0; i <= SAMPLES; i++) {
    const x = xlo + ((xhi - xlo) * i) / SAMPLES;
    const y = at(x);
    const inside = y >= ymin && y <= ymax;
    if (inside) {
      if (prev && !prev.inside) {
        const edge = prev.y < ymin ? ymin : ymax;
        const t = (edge - prev.y) / (y - prev.y);
        run.push([prev.x + t * (x - prev.x), edge]);
      }
      run.push([x, y]);
    } else if (prev?.inside) {
      const edge = y < ymin ? ymin : ymax;
      const t = (edge - prev.y) / (y - prev.y);
      run.push([prev.x + t * (x - prev.x), edge]);
      runs.push(run);
      run = [];
    }
    prev = { x, y, inside };
  }
  if (run.length > 1) runs.push(run);
  return runs.filter((r) => r.length > 1);
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

type Region = CoordinateGridParams['regions'][number];
type Constraint = Region['constraints'][number];

// Sutherland–Hodgman: clip a convex polygon against the half-plane
// a*x + b*y <= c. 'ge' constraints are negated into that form by the caller.
function clipHalfPlane(poly: Pt[], a: number, b: number, c: number): Pt[] {
  const EPS = 1e-9;
  const at = (q: Pt) => a * q.x + b * q.y - c;
  const out: Pt[] = [];
  for (let i = 0; i < poly.length; i++) {
    const cur = poly[i];
    const prev = poly[(i + poly.length - 1) % poly.length];
    const dc = at(cur);
    const dp = at(prev);
    const cross = (): Pt => {
      const t = dp / (dp - dc);
      return { x: prev.x + t * (cur.x - prev.x), y: prev.y + t * (cur.y - prev.y) };
    };
    if (dc <= EPS) {
      if (dp > EPS) out.push(cross());
      out.push(cur);
    } else if (dp <= EPS) {
      out.push(cross());
    }
  }
  return out;
}

// Empty when the constraints have no common ground on screen — fewer than
// three vertices, or a sliver of no area.
function regionPolygon(
  region: Region,
  xmin: number,
  xmax: number,
  ymin: number,
  ymax: number,
): Pt[] {
  let poly: Pt[] = [
    { x: xmin, y: ymin },
    { x: xmax, y: ymin },
    { x: xmax, y: ymax },
    { x: xmin, y: ymax },
  ];
  for (const k of region.constraints) {
    if (k.a === 0 && k.b === 0) continue; // degenerate — verify() flags it
    const s = k.op === 'ge' ? -1 : 1;
    poly = clipHalfPlane(poly, s * k.a, s * k.b, s * k.c);
    if (poly.length === 0) return [];
  }
  // Drop vertices the clipping duplicated at shared boundaries.
  const dedup: Pt[] = [];
  for (const q of poly) {
    const last = dedup[dedup.length - 1];
    if (!last || Math.abs(last.x - q.x) > TOL || Math.abs(last.y - q.y) > TOL) dedup.push(q);
  }
  while (
    dedup.length > 1 &&
    Math.abs(dedup[0].x - dedup[dedup.length - 1].x) <= TOL &&
    Math.abs(dedup[0].y - dedup[dedup.length - 1].y) <= TOL
  ) {
    dedup.pop();
  }
  if (dedup.length < 3) return [];
  let area2 = 0;
  for (let i = 0; i < dedup.length; i++) {
    const q = dedup[i];
    const r = dedup[(i + 1) % dedup.length];
    area2 += q.x * r.y - r.x * q.y;
  }
  return Math.abs(area2) / 2 < 1e-6 ? [] : dedup;
}

function rhsText(m: number, k: number): string {
  if (m === 0) return String(round(k));
  const ms = m === 1 ? 'x' : m === -1 ? '-x' : `${round(m)}x`;
  if (k === 0) return ms;
  return k > 0 ? `${ms} + ${round(k)}` : `${ms} - ${round(-k)}`;
}

// A constraint in the form a student reads: "y <= 2x + 1", "x >= 0".
function fmtConstraint(k: Constraint): string {
  const sym = k.op === 'le' ? '<=' : '>=';
  const flipped = k.op === 'le' ? '>=' : '<=';
  if (k.b !== 0) {
    // Divide by b; dividing by a negative reverses the inequality.
    return `y ${k.b > 0 ? sym : flipped} ${rhsText(-k.a / k.b, k.c / k.b)}`;
  }
  if (k.a !== 0) {
    return `x ${k.a > 0 ? sym : flipped} ${round(k.c / k.a)}`;
  }
  return `0 ${sym} ${round(k.c)}`;
}

type Curve = CoordinateGridParams['curves'][number];

// Stated features are exact algebraic claims, but a question may quote them to
// one decimal place, so allow for that rounding rather than 0.01.
const FEATURE_TOL = 0.06;

// A root, turning point, y-intercept or axis of symmetry ASSERTED in the
// question text must be true of a drawn curve. Only explicit assertions match:
// "find the turning point" states nothing and is never checked.
function statedFeatureIssues(
  curves: Curve[],
  context: { stimulus?: string; stem: string; partPrompts: string[] },
): string[] {
  if (curves.length === 0) return [];
  const text = [context.stimulus ?? '', context.stem, ...context.partPrompts].join(' ');
  const issues: string[] = [];
  const near = (a: number, b: number) => Math.abs(a - b) <= FEATURE_TOL;
  const anyCurve = (holds: (cv: Curve) => boolean) => curves.some(holds);

  const turning = text.match(
    /(?:turning point|minimum point|maximum point|vertex)\s*(?:is|at|of the curve is)?\s*\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/i,
  );
  if (turning) {
    const [tx, ty] = [Number(turning[1]), Number(turning[2])];
    if (!anyCurve((cv) => {
      const v = vertexOf(cv.a, cv.b, cv.c);
      return near(v.x, tx) && near(v.y, ty);
    })) {
      issues.push(
        `coordinateGrid: the question states a turning point of (${tx}, ${ty}), which no drawn curve has`,
      );
    }
  }

  const axis = text.match(/axis of symmetry\s*(?:is|:|=)?\s*x\s*=\s*(-?\d+(?:\.\d+)?)/i);
  if (axis) {
    const ax = Number(axis[1]);
    if (!anyCurve((cv) => near(vertexOf(cv.a, cv.b, cv.c).x, ax))) {
      issues.push(
        `coordinateGrid: the question states an axis of symmetry x = ${ax}, which no drawn curve has`,
      );
    }
  }

  const yInt =
    text.match(/y[-\s]?intercept\s*(?:is|=|of)\s*(-?\d+(?:\.\d+)?)/i) ??
    text.match(/(?:cuts|crosses|meets)\s+the\s+y[-\s]?axis\s+at\s*\(?\s*0\s*,\s*(-?\d+(?:\.\d+)?)\s*\)?/i);
  if (yInt) {
    const yv = Number(yInt[1]);
    if (!anyCurve((cv) => near(cv.c, yv))) {
      issues.push(
        `coordinateGrid: the question states a y-intercept of ${yv}, which no drawn curve has`,
      );
    }
  }

  const rootPair =
    text.match(
      /(?:roots|solutions|zeros)\s*(?:are|:|=)?\s*x\s*=\s*(-?\d+(?:\.\d+)?)\s*(?:and|,|or)\s*x\s*=\s*(-?\d+(?:\.\d+)?)/i,
    ) ??
    text.match(
      /(?:cuts|crosses|meets)\s+the\s+x[-\s]?axis\s+(?:at|where)\s*x?\s*=?\s*(-?\d+(?:\.\d+)?)\s*(?:and|,|or)\s*x?\s*=?\s*(-?\d+(?:\.\d+)?)/i,
    );
  if (rootPair) {
    const stated = [Number(rootPair[1]), Number(rootPair[2])];
    if (!anyCurve((cv) => {
      const r = rootsOf(cv.a, cv.b, cv.c);
      return stated.every((s) => r.some((v) => near(v, s)));
    })) {
      issues.push(
        `coordinateGrid: the question states roots x = ${stated[0]} and x = ${stated[1]}, which no drawn curve has`,
      );
    }
  }

  return issues;
}

export const coordinateGrid: VisualTemplate<CoordinateGridParams> = {
  name: 'coordinateGrid',
  // Invariants enforced by verify(); surfaced to the draft prompt.
  rules: [
    "x_range and y_range must be ascending and each span at most 40 units",
    "every point and polygon vertex must lie inside the ranges",
    "if you supply TWO polygons the second must be the image of the first under ONE standard transformation: translation, reflection in an axis or y = x, rotation of 90/180/270 about the origin, or enlargement from the origin",
    "a line label written as y = mx + c must match that line's m and c",
    "curves are quadratics y = ax^2 + bx + c and need a non-zero a; use lines for straight graphs",
    "a curve label written as y = ax^2 + bx + c must match that curve's a, b and c",
    "any root, turning point, y-intercept or axis of symmetry STATED in the question text must be true of a drawn curve",
    "curves may list `plotted` x values, which mark the points a candidate would have plotted from a table of values",
    "a region shades where ALL of its constraints hold; each constraint is a*x + b*y <= c (op 'le') or a*x + b*y >= c (op 'ge') — write y <= mx + k as a = -m, b = 1, c = k, and x >= k as a = 1, b = 0, c = k",
    "a region constraint must have a or b non-zero — a = b = 0 constrains nothing",
    "a region's constraints must be satisfiable together somewhere inside x_range x y_range; mutually exclusive constraints shade nothing",
    "draw the boundary of each inequality as a line in `lines` as well, so the student can see it",
  ],
  paramsSchema: CoordinateGridParamsZ,

  render(p, context) {
    const figure = p.named ? resolveFigure(p.named, context) : undefined;
    const derived = figure ? windowFor(figure) : undefined;
    // A `named` figure is a sketch unless the question is about the grid
    // itself; a sketch shows the shape and its labels, and nothing to measure.
    const sketch = (p.named?.sketch ?? false) && figure !== undefined;
    const { xmin, xmax, ymin, ymax } = balanceWindow(
      (derived?.x ?? p.x_range ?? [-5, 5]) as [number, number],
      (derived?.y ?? p.y_range ?? [-5, 5]) as [number, number],
    );
    const spanX = Math.max(1, xmax - xmin);
    const spanY = Math.max(1, ymax - ymin);
    const u = Math.min((W - 2 * PAD) / spanX, MAX_PLOT_H / spanY);
    const gridW = spanX * u;
    const gridH = spanY * u;
    const canvasW = Math.round(Math.min(W, gridW + 2 * PAD));
    const ox = (canvasW - gridW) / 2;
    const oy = PAD;
    const H = Math.round(gridH + 2 * PAD);
    const X = (v: number) => ox + (v - xmin) * u;
    const Y = (v: number) => oy + (ymax - v) * u;

    // Where the axes are drawn, so a label can be kept off them. A sketch draws
    // none, and then there is nothing to avoid.
    const drawnAxes = sketch
      ? {}
      : {
          x: ymin <= 0 && 0 <= ymax ? Y(0) : undefined,
          y: xmin <= 0 && 0 <= xmax ? X(0) : undefined,
        };

    const parts: string[] = [svgOpen(canvasW, H)];
    // A sketch keeps the geometry and drops the apparatus — what CXC prints
    // when a transformation question is not set on a supplied grid.
    if (!sketch) {
    // The paper's fine mesh, under the unit lines: reading an intercept or a
    // value between two whole numbers is only fair when it is there.
    parts.push(meshDefs('gridMesh', u));
    parts.push(meshRect('gridMesh', ox, oy, gridW, gridH));
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
      parts.push(text(Math.min(ox + gridW + 28, canvasW - 8), y + 4, 'x', { italic: true }));
    }
    if (hasYAxis) {
      const x = X(0);
      parts.push(line(x, oy + gridH + 8, x, oy - 12));
      parts.push(`<polygon points="${round(x)},${round(oy - 18)} ${round(x - 4)},${round(oy - 10)} ${round(x + 4)},${round(oy - 10)}" fill="${INK}" />`);
      parts.push(text(x, oy - 24, 'y', { italic: true }));
    }
    const labelY = hasXAxis ? Y(0) + 14 : oy + gridH + 16;
    for (let gx = xmin; gx <= xmax; gx++) {
      if (gx !== 0) parts.push(text(X(gx), labelY, String(gx), { size: 9 }));
    }
    const labelX = hasYAxis ? X(0) - 5 : ox - 6;
    for (let gy = ymin; gy <= ymax; gy++) {
      if (gy !== 0) parts.push(text(labelX, Y(gy) + 3, String(gy), { size: 9, anchor: 'end' }));
    }
    if (hasXAxis && hasYAxis) parts.push(text(X(0) - 5, Y(0) + 14, 'O', { size: 10, anchor: 'end' }));
    }

    for (const poly of figure?.polygons ?? []) {
      const px = poly.vertices.map(([x, y]) => [X(x), Y(y)] as [number, number]);
      parts.push(polygonSvg(px, poly.dashed, poly.shaded));
      parts.push(shapeName(px, poly.name));
      const cx = px.reduce((sum, pt) => sum + pt[0], 0) / px.length;
      const cy = px.reduce((sum, pt) => sum + pt[1], 0) / px.length;
      poly.labels.forEach((lab, i) => {
        const dx = px[i][0] - cx;
        const dy = px[i][1] - cy;
        const len = Math.hypot(dx, dy) || 1;
        parts.push(
          text(px[i][0] + (dx / len) * 16, px[i][1] + (dy / len) * 16 + 4, lab, { size: 13, halo: true }),
        );
      });
    }
    for (const pt of figure?.points ?? []) {
      parts.push(`<circle cx="${round(X(pt.x))}" cy="${round(Y(pt.y))}" r="3" fill="${INK}" stroke="none" />`);
      parts.push(text(X(pt.x) + 8, Y(pt.y) - 8, pt.label, { size: 13, anchor: 'start', halo: true }));
    }
    // shaded inequality regions, drawn UNDER the lines, curves, polygons and
    // points so every marker stays legible on top of the hatch
    if (p.regions.length > 0) {
      parts.push(hatchDefs('regionHatch'));
      for (const region of p.regions) {
        const poly = regionPolygon(region, xmin, xmax, ymin, ymax);
        if (poly.length < 3) continue; // empty region — draw nothing
        const d = poly.map((q) => `${round(X(q.x))},${round(Y(q.y))}`).join(' ');
        parts.push(`<polygon points="${d}" fill="${hatchFill('regionHatch')}" stroke="none" />`);
        if (region.label) {
          const cx = poly.reduce((s, q) => s + X(q.x), 0) / poly.length;
          const cy = poly.reduce((s, q) => s + Y(q.y), 0) / poly.length;
          parts.push(text(cx, cy + 4, region.label, { size: 13, halo: true }));
        }
      }
    }
    for (const ln of p.lines) {
      const seg = clipLine(ln.m, ln.c, xmin, xmax, ymin, ymax);
      if (!seg) continue;
      const [[x1, y1], [x2, y2]] = seg;
      parts.push(line(X(x1), Y(y1), X(x2), Y(y2)));
      if (ln.label) {
        const spot = labelAtEnd(
          [
            [X(x1), Y(y1)],
            [X(x2), Y(y2)],
          ],
          canvasW,
          H,
          drawnAxes,
        );
        parts.push(text(spot.x, spot.y, ln.label, { size: 12, anchor: spot.anchor, halo: true }));
      }
    }
    for (const cv of p.curves) {
      const xlo = Math.max(xmin, cv.domain ? Math.min(...cv.domain) : xmin);
      const xhi = Math.min(xmax, cv.domain ? Math.max(...cv.domain) : xmax);
      if (xhi <= xlo) continue;
      const runs = sampleCurve(cv.a, cv.b, cv.c, xlo, xhi, ymin, ymax);
      for (const run of runs) {
        const d = run.map((pt) => `${round(X(pt[0]))},${round(Y(pt[1]))}`).join(' ');
        parts.push(`<polyline points="${d}" />`);
      }
      for (const px of cv.plotted ?? []) {
        const py = cv.a * px * px + cv.b * px + cv.c;
        if (px < xmin || px > xmax || py < ymin || py > ymax) continue;
        parts.push(plotMark(X(px), Y(py)));
      }
      if (cv.label && runs.length > 0) {
        const longest = runs.reduce((best, r) => (r.length > best.length ? r : best), runs[0]);
        const spot = labelAtEnd(
          longest.map((pt) => [X(pt[0]), Y(pt[1])] as [number, number]),
          canvasW,
          H,
          drawnAxes,
        );
        parts.push(text(spot.x, spot.y, cv.label, { size: 12, anchor: spot.anchor, halo: true }));
      }
    }
    for (const poly of p.polygons) {
      const px = poly.vertices.map((v) => [X(v.x), Y(v.y)] as [number, number]);
      parts.push(polygonSvg(px, poly.dashed, poly.shaded));
      parts.push(shapeName(px, poly.name));
      if (poly.labels) {
        const cx = px.reduce((s, pt) => s + pt[0], 0) / px.length;
        const cy = px.reduce((s, pt) => s + pt[1], 0) / px.length;
        poly.labels.forEach((lab, i) => {
          if (i >= px.length) return;
          const dx = px[i][0] - cx;
          const dy = px[i][1] - cy;
          const len = Math.hypot(dx, dy) || 1;
          parts.push(
            text(px[i][0] + (dx / len) * 14, px[i][1] + (dy / len) * 14 + 4, lab, { size: 12, halo: true }),
          );
        });
      }
    }
    for (const pt of p.points) {
      parts.push(`<circle cx="${round(X(pt.x))}" cy="${round(Y(pt.y))}" r="3.5" fill="${INK}" />`);
      if (pt.label) {
        parts.push(text(X(pt.x) + 8, Y(pt.y) - 8, pt.label, { size: 12, anchor: 'start', halo: true }));
      }
    }
    parts.push('</svg>');
    return parts.join('');
  },

  describe(p, context) {
    const figure = p.named ? resolveFigure(p.named, context) : undefined;
    const win = figure ? windowFor(figure) : { x: p.x_range ?? [-5, 5], y: p.y_range ?? [-5, 5] };
    const sketch = (p.named?.sketch ?? false) && figure !== undefined;
    const bits: string[] = [
      sketch
        ? 'Schematic sketch on a plane, without axes or gridlines: the shape is drawn from the coordinates the question states, so relative position is exact but nothing is to be measured.'
        : `Cartesian grid with x from ${win.x[0]} to ${win.x[1]} and y from ${win.y[0]} to ${win.y[1]}, gridlines every 1 unit.`,
    ];
    for (const poly of figure?.polygons ?? []) {
      bits.push(
        `${poly.dashed ? 'Image shape' : 'Shape'} ${poly.labels.join('')} drawn through ${poly.labels
          .map((l, i) => `${l}(${poly.vertices[i][0]}, ${poly.vertices[i][1]})`)
          .join(', ')}.`,
      );
    }
    for (const pt of figure?.points ?? []) bits.push(`Point ${pt.label} at (${pt.x}, ${pt.y}).`);
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
    // Equation only, as for lines: the solver does its own algebra rather than
    // being handed the roots or turning point it is being asked to find.
    for (const cv of p.curves) {
      const shape = cv.a > 0 ? 'opening upward' : 'opening downward';
      const dom = cv.domain ? ` drawn for ${Math.min(...cv.domain)} <= x <= ${Math.max(...cv.domain)}` : '';
      bits.push(
        `Parabola ${fmtQuadratic(cv.a, cv.b, cv.c)} (${shape})${dom}${cv.label ? ` labeled "${cv.label}"` : ''}.`,
      );
    }
    p.regions.forEach((region, i) => {
      const conds = region.constraints.map(fmtConstraint).join(' and ');
      const named = region.label ? ` labelled "${region.label}"` : '';
      bits.push(
        `Shaded region${p.regions.length > 1 ? ` ${i + 1}` : ''}${named}: the region where ${conds}.`,
      );
    });
    return bits.join(' ');
  },

  verify(p, context) {
    const issues: string[] = [];

    // A `named` figure carries no coordinates of its own, so all there is to
    // check is that the question states the ones it references.
    if (p.named) {
      const referenced = [...p.named.polygons.flatMap((poly) => poly.points), ...p.named.points];
      const { missing } = resolvePoints(referenced, context);
      if (missing.length > 0) {
        issues.push(
          `coordinateGrid: the figure references ${missing.join(', ')}, but the question states no coordinates for ${missing.length === 1 ? 'it' : 'them'}`,
        );
      }
      const stated = namedPoints(context);
      for (const poly of p.named.polygons) {
        if (poly.points.filter((l) => stated.has(l)).length < 3) {
          issues.push(`coordinateGrid: shape ${poly.points.join('')} needs at least three points the question names`);
        }
      }
      if (referenced.length === 0) {
        issues.push('coordinateGrid: named block references no points at all');
      }
      return issues;
    }

    const [xmin, xmax] = p.x_range ?? [-5, 5];
    const [ymin, ymax] = p.y_range ?? [-5, 5];
    if (!p.x_range || !p.y_range) {
      issues.push('coordinateGrid: x_range and y_range are required unless the figure uses named points');
    }
    if (xmin >= xmax) issues.push('coordinateGrid: x_range must be ascending');
    if (ymin >= ymax) issues.push('coordinateGrid: y_range must be ascending');
    // The mesh step scales with the span, so a wide window stays readable, and
    // applied contexts need one: cost against 30 items, distance over 40 km.
    if (xmax - xmin > 40) issues.push('coordinateGrid: x_range span exceeds 40');
    if (ymax - ymin > 40) issues.push('coordinateGrid: y_range span exceeds 40');
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
    for (const cv of p.curves) {
      if (cv.a === 0) {
        issues.push(
          'coordinateGrid: a curve with a = 0 is a straight line — put it in lines instead',
        );
        continue;
      }
      if (cv.domain && Math.min(...cv.domain) >= Math.max(...cv.domain)) {
        issues.push('coordinateGrid: curve domain must be ascending');
      }
      if (cv.label) {
        const parsed = parseQuadraticLabel(cv.label);
        if (
          parsed &&
          (Math.abs(parsed.a - cv.a) > TOL ||
            Math.abs(parsed.b - cv.b) > TOL ||
            Math.abs(parsed.c - cv.c) > TOL)
        ) {
          issues.push(
            `coordinateGrid: curve label "${cv.label}" does not match the drawn curve ${fmtQuadratic(cv.a, cv.b, cv.c)}`,
          );
        }
      }
    }
    p.regions.forEach((region, i) => {
      let degenerate = false;
      region.constraints.forEach((k, j) => {
        if (k.a === 0 && k.b === 0) {
          degenerate = true;
          issues.push(
            `coordinateGrid: region ${i + 1} constraint ${j + 1} has a = 0 and b = 0, which constrains nothing`,
          );
        }
      });
      if (degenerate) return;
      if (regionPolygon(region, xmin, xmax, ymin, ymax).length < 3) {
        issues.push(
          `coordinateGrid: region ${i + 1} constraints (${region.constraints.map(fmtConstraint).join(', ')}) are not satisfiable together anywhere in the visible range`,
        );
      }
    });
    issues.push(...statedFeatureIssues(p.curves, context));
    return issues;
  },
};
