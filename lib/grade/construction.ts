import type { StoredVisual } from '@/lib/visuals';

/**
 * THE PARAMS ARE THE ONLY SOURCE: a figure is checked against the structure it
 * is rendered from, so the two cannot drift. Where they locate nothing this
 * returns nothing and the slot stays self-marked. See ROUND_2 §8.
 */
export type CheckKind = 'point' | 'intercept' | 'shape' | 'segment' | 'boundary';

export interface ConstructionCheck {
  kind: CheckKind;
  /** Said the way a student would read it off their own page. */
  describes: string;
  /** What the params say is true, for the deterministic comparison. */
  expected: { x?: number; y?: number; shape?: string; label?: string };
}

const round = (n: number) => Math.round(n * 100) / 100;

interface Line { m: number; c: number; label?: string }
interface Curve { a: number; b: number; c: number; domain?: [number, number]; plotted?: number[] }
interface Point { t?: number; v?: number; d?: number; x?: number; y?: number }

/**
 * The facts a photograph can be checked against. An empty list means the
 * template cannot ground-truth this construction, and the slot keeps the
 * self-check list the student already has.
 */
export function constructionChecks(visual: StoredVisual | undefined): ConstructionCheck[] {
  if (!visual) return [];
  const p = (visual.params ?? {}) as Record<string, unknown>;
  const checks: ConstructionCheck[] = [];

  if (visual.template === 'coordinateGrid') {
    for (const line of (p.lines as Line[] | undefined) ?? []) {
      if (typeof line.m !== 'number' || typeof line.c !== 'number') continue;
      checks.push({
        kind: 'intercept',
        describes: `the line${line.label ? ` "${line.label}"` : ''} crosses the y-axis at ${round(line.c)}`,
        expected: { y: round(line.c), label: line.label },
      });
      // A second point fixes the gradient without asking anyone to read a slope
      // off a photograph, which is the least reliable thing to ask for.
      checks.push({
        kind: 'point',
        describes: `the line${line.label ? ` "${line.label}"` : ''} passes through (1, ${round(line.m + line.c)})`,
        expected: { x: 1, y: round(line.m + line.c), label: line.label },
      });
    }

    for (const curve of (p.curves as Curve[] | undefined) ?? []) {
      if (typeof curve.a !== 'number') continue;
      checks.push({
        kind: 'shape',
        describes: `the curve opens ${curve.a > 0 ? 'upwards' : 'downwards'}`,
        expected: { shape: curve.a > 0 ? 'opens-up' : 'opens-down' },
      });
      const vx = -curve.b / (2 * curve.a);
      const vy = curve.a * vx * vx + curve.b * vx + curve.c;
      checks.push({
        kind: 'point',
        describes: `its turning point is at (${round(vx)}, ${round(vy)})`,
        expected: { x: round(vx), y: round(vy) },
      });
      // Plotted points the question itself declares, which is what a candidate
      // is marked on: every point from the table, none outside the domain.
      for (const x of curve.plotted ?? []) {
        const y = curve.a * x * x + curve.b * x + curve.c;
        checks.push({
          kind: 'point',
          describes: `the curve passes through (${round(x)}, ${round(y)})`,
          expected: { x: round(x), y: round(y) },
        });
      }
    }

    for (const [i] of ((p.regions as unknown[] | undefined) ?? []).entries()) {
      checks.push({
        kind: 'boundary',
        describes: `a region is shaded${i > 0 ? ` (${i + 1})` : ''}`,
        expected: { shape: 'shaded-region' },
      });
    }
  }

  if (visual.template === 'travelGraph') {
    const points = ((p.points as Point[] | undefined) ?? []).filter(
      (q) => typeof q.t === 'number' && (typeof q.v === 'number' || typeof q.d === 'number'),
    );
    for (const q of points) {
      const y = (q.v ?? q.d) as number;
      checks.push({
        kind: 'point',
        describes: `the graph passes through (${round(q.t!)}, ${round(y)})`,
        expected: { x: round(q.t!), y: round(y) },
      });
    }
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1];
      const b = points[i];
      const ya = (a.v ?? a.d) as number;
      const yb = (b.v ?? b.d) as number;
      checks.push({
        kind: 'segment',
        describes:
          ya === yb
            ? `it is horizontal between ${round(a.t!)} and ${round(b.t!)}`
            : `it ${yb > ya ? 'rises' : 'falls'} between ${round(a.t!)} and ${round(b.t!)}`,
        expected: { shape: ya === yb ? 'horizontal' : yb > ya ? 'rising' : 'falling' },
      });
    }
  }

  if (visual.template === 'cumulativeFrequency') {
    // The ogive: running totals plotted at UPPER class boundaries, which is the
    // act the acts list marks and the one candidates get wrong.
    const table = (p.table as { upper?: number; cf?: number }[] | undefined) ?? [];
    for (const row of table) {
      if (typeof row.upper !== 'number' || typeof row.cf !== 'number') continue;
      checks.push({
        kind: 'point',
        describes: `a point is plotted at (${round(row.upper)}, ${round(row.cf)}) — the upper boundary, not the midpoint`,
        expected: { x: round(row.upper), y: round(row.cf) },
      });
    }
    if (checks.length) {
      checks.push({
        kind: 'shape',
        describes: 'the curve rises throughout and never falls',
        expected: { shape: 'increasing' },
      });
    }
  }

  return checks;
}

export function canGroundTruth(visual: StoredVisual | undefined): boolean {
  return constructionChecks(visual).length > 0;
}
