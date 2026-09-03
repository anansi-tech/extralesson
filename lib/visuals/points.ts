import type { VerifyContext } from './types';

// Named points are stated ONCE, in the question's text, and coordinateGrid's
// `named` block says which of them the figure draws. Authoring the figure's
// geometry separately leaves two copies that can disagree, and a gate for that
// class can only detect a disagreement already written down.

export interface NamedPoint {
  label: string;
  x: number;
  y: number;
}

// "A(1,1)", "A = (1, 1)", "C' = (6,1)", "$B'(4,-3)$" — a coordinate written
// against a name, which is how every CSEC question states one.
const NAMED_COORDINATE =
  /([A-Z])('{1,2}|_\d)?\s*(?:=\s*)?\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/g;

export function questionText(context: VerifyContext): string {
  return [context.stimulus ?? '', context.stem, ...context.partPrompts].join(' ');
}

/**
 * Every point the question names, in order of first appearance. A label stated
 * twice with different coordinates is dropped entirely: the question is
 * ambiguous about where it is, and drawing either position would be a guess.
 */
export function namedPoints(context: VerifyContext | undefined): Map<string, NamedPoint> {
  const found = new Map<string, NamedPoint>();
  const ambiguous = new Set<string>();
  if (!context) return found;
  for (const m of questionText(context).matchAll(NAMED_COORDINATE)) {
    const label = `${m[1]}${m[2] ?? ''}`;
    const point = { label, x: Number(m[3]), y: Number(m[4]) };
    const seen = found.get(label);
    if (seen && (seen.x !== point.x || seen.y !== point.y)) {
      ambiguous.add(label);
      continue;
    }
    found.set(label, point);
  }
  for (const label of ambiguous) found.delete(label);
  return found;
}

/** Resolve the labels a figure references, reporting any the question never states. */
export function resolvePoints(
  labels: string[],
  context: VerifyContext | undefined,
): { points: NamedPoint[]; missing: string[] } {
  const known = namedPoints(context);
  const points: NamedPoint[] = [];
  const missing: string[] = [];
  for (const label of labels) {
    const p = known.get(label);
    if (p) points.push(p);
    else missing.push(label);
  }
  return { points, missing };
}
