// Asking the same model twice is not two gates: the solve pass is independent
// in PROMPT only, same model and same blind spot. Where the mathematics is
// machine-checkable, computation decides and its verdict is authoritative.
// Equality is decided by NUMERIC SAMPLING because simplify().equals() returns
// false for expressions that are plainly equal — 2(x-3)+1 against 2x-5.
import { evaluate, parse } from 'mathjs';

export type Verdict =
  | { checked: true; ok: true }
  | { checked: true; ok: false; reason: string }
  | { checked: false; reason: string };

const UNCHECKED = (reason: string): Verdict => ({ checked: false, reason });

/** KaTeX source as the papers write it, reduced to something mathjs parses. */
export function toExpr(raw: string): string | null {
  if (!raw) return null;
  let s = raw
    .replace(/\\left|\\right/g, '')
    .replace(/\\dfrac|\\tfrac/g, '\\frac')
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '(($1)/($2))')
    .replace(/\\sqrt\{([^{}]+)\}/g, 'sqrt($1)')
    .replace(/\\times/g, '*')
    .replace(/\\cdot/g, '*')
    .replace(/\\div/g, '/')
    .replace(/\\pi/g, 'pi')
    .replace(/[$\\]/g, '')
    .replace(/\s+/g, '')
    .replace(/−/g, '-');
  if (s === '') return null;
  // Implicit multiplication the way a paper writes it: 2x, 3(x+1), x(x-2).
  s = s
    .replace(/(\d)([a-zA-Z(])/g, '$1*$2')
    .replace(/([a-zA-Z0-9)])\(/g, '$1*(')
    .replace(/\)([a-zA-Z0-9])/g, ')*$1')
    .replace(/\^/g, '^');
  return s;
}

const SAMPLES = [0.37, 1.13, 2.71, -1.9, 3.41, -0.53, 5.27];

/** Do two expressions agree everywhere they are both defined? */
export function equivalent(a: string, b: string, vars: string[] = ['x']): Verdict {
  const ea = toExpr(a);
  const eb = toExpr(b);
  if (!ea || !eb) return UNCHECKED('could not read one of the expressions');
  let compared = 0;
  for (const t of SAMPLES) {
    const scope: Record<string, number> = {};
    vars.forEach((v, i) => {
      scope[v] = t + i * 0.61;
    });
    let va: number;
    let vb: number;
    try {
      va = Number(evaluate(ea, scope));
      vb = Number(evaluate(eb, scope));
    } catch {
      return UNCHECKED('expression did not evaluate');
    }
    if (!Number.isFinite(va) || !Number.isFinite(vb)) continue;
    compared++;
    const scale = Math.max(1, Math.abs(va), Math.abs(vb));
    if (Math.abs(va - vb) > 1e-7 * scale) {
      return { checked: true, ok: false, reason: `differ at ${vars[0]}=${scope[vars[0]]}: ${va} vs ${vb}` };
    }
  }
  return compared >= 3
    ? { checked: true, ok: true }
    : UNCHECKED('too few points where both expressions are defined');
}

/** fg(x) means f(g(x)) — apply g FIRST. */
export function composite(f: string, g: string, order: 'fg' | 'gf', claimed: string): Verdict {
  const inner = order === 'fg' ? g : f;
  const outer = order === 'fg' ? f : g;
  const eInner = toExpr(inner);
  const eOuter = toExpr(outer);
  if (!eInner || !eOuter) return UNCHECKED('could not read the function definitions');
  const truth = eOuter.replace(/\bx\b/g, `(${eInner})`);
  return equivalent(truth, claimed);
}

/** g is the inverse of f when f(g(x)) = x and g(f(x)) = x. */
export function inverse(f: string, claimed: string): Verdict {
  const ef = toExpr(f);
  const eg = toExpr(claimed);
  if (!ef || !eg) return UNCHECKED('could not read the function definitions');
  const round = ef.replace(/\bx\b/g, `(${eg})`);
  return equivalent(round, 'x');
}

/** A factorisation must multiply back out to what it factorised. */
export function factorisation(original: string, claimed: string): Verdict {
  return equivalent(original, claimed);
}

/** A root satisfies its equation: substituting it makes both sides agree. */
export function satisfiesEquation(equation: string, variable: string, root: string): Verdict {
  const parts = equation.split('=');
  if (parts.length !== 2) return UNCHECKED('not an equation with one = sign');
  const lhs = toExpr(parts[0]);
  const rhs = toExpr(parts[1]);
  const value = toExpr(root);
  if (!lhs || !rhs || !value) return UNCHECKED('could not read the equation or the root');
  try {
    const v = Number(evaluate(value, {}));
    if (!Number.isFinite(v)) return UNCHECKED('root is not a number');
    const scope = { [variable]: v } as Record<string, number>;
    const l = Number(evaluate(lhs, scope));
    const r = Number(evaluate(rhs, scope));
    if (!Number.isFinite(l) || !Number.isFinite(r)) return UNCHECKED('equation did not evaluate');
    const scale = Math.max(1, Math.abs(l), Math.abs(r));
    return Math.abs(l - r) <= 1e-7 * scale
      ? { checked: true, ok: true }
      : { checked: true, ok: false, reason: `${variable}=${v} gives ${l} vs ${r}` };
  } catch {
    return UNCHECKED('equation did not evaluate');
  }
}

/** Gradient between two points, which is arithmetic and never a judgement. */
export function gradient(p: [number, number], q: [number, number], claimed: string): Verdict {
  if (q[0] === p[0]) return UNCHECKED('vertical line has no gradient');
  return equivalent(String((q[1] - p[1]) / (q[0] - p[0])), claimed, ['t']);
}

export function midpoint(p: [number, number], q: [number, number]): [number, number] {
  return [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
}

export function magnitude(v: [number, number], claimed: string): Verdict {
  return equivalent(String(Math.hypot(v[0], v[1])), claimed, ['t']);
}

export function numbersIn(s: string): number[] {
  return (s.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
}

export function parses(expr: string): boolean {
  const e = toExpr(expr);
  if (!e) return false;
  try {
    parse(e);
    return true;
  } catch {
    return false;
  }
}
