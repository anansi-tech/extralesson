import { evaluate, parse } from 'mathjs';
import { UNIT_WORDS } from './units';

// READING NOTATION AS MATHEMATICS. Everything here turns what a mark scheme or
// a student writes into something mathjs can parse, and says what came out. It
// knows nothing about whether two answers agree — that is equivalence.ts — and
// nothing about units beyond needing to tell a NAME from a product of letters.
//
// It sits below quantity.ts as well as below equivalence.ts, because the value
// in front of a unit is not always a number: "3\sqrt[3]{10} cm" is a length,
// and a quantity parser that could only read digits could not say so.
//
// Not to be confused with symbolic.ts, which is the solve gate's verdict on
// whether an ANSWER is right; this is the reader underneath a comparison.

/**
 * \frac and \sqrt, INNERMOST FIRST AND REPEATEDLY. The braces nest and a single
 * pass of `[^{}]+` cannot see past them: \frac{2}{\sqrt{29}} left the fraction
 * unconverted, mathjs was handed `frac{2}{sqrt(29)}`, and the value never became
 * a number. A surd alone evaluated, a fraction alone evaluated, and the two
 * together did not — so a unit vector written the way a mark scheme writes one
 * could not be compared with anything, including its own accept list.
 *
 * Each pass converts the groups that are now brace-free, which makes the next
 * one visible; it stops when nothing changes.
 */
export function expandNestedCommands(s: string): string {
  let out = s;
  for (let pass = 0; pass < 12; pass++) {
    const next = out
      .replace(/\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))')
      // \sqrt[3]{X} BEFORE \sqrt{X}: an index in brackets is a different root,
      // and mathjs spells it nthRoot. Left unexpanded, a cube root reached the
      // parser as the word "sqrt[3]" and never became a number, so a question
      // whose canonical was \sqrt[3]{...} did not equal its own accept list.
      // \frac13 is \frac{1}{3} without braces, which is how the bank writes a
      // one-digit fraction inside an exponent: ^{\frac13}.
      .replace(/\\[dt]?frac(\d)(\d)/g, '(($1)/($2))')
      .replace(/\\sqrt\[([^\]]+)\]\{([^{}]*)\}/g, 'nthRoot($2, $1)')
      .replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)');
    if (next === out) break;
    out = next;
  }
  return out;
}

/**
 * Names mathjs owns. Everything else that is two letters or more is a PRODUCT
 * of its letters: a mark scheme writes gT^2 for g times T squared, and the
 * parser read `gT` as one symbol, so gT^2 and T^2g — the same product, written
 * two ways — could not be compared. Splitting is not safe for a name, so the
 * names are listed.
 */
const KNOWN_NAMES = new Set([
  'sin', 'cos', 'tan', 'sec', 'csc', 'cot', 'asin', 'acos', 'atan', 'atan2',
  'sinh', 'cosh', 'tanh', 'log', 'log10', 'log2', 'ln', 'exp', 'sqrt', 'cbrt',
  'nthroot', 'abs', 'sign', 'round', 'floor', 'ceil', 'mod', 'min', 'max',
  'pi', 'tau', 'inf', 'nan', 'true', 'false',
]);

/** A name, not a product: cm is a centimetre and 16th is an ordinal. */
function isName(run: string): boolean {
  const lower = run.toLowerCase();
  return KNOWN_NAMES.has(lower) || UNIT_WORDS.has(lower) || /^(st|nd|rd|th)$/.test(lower);
}

export function splitAdjacentSymbols(s: string): string {
  // M(M-2) is M times (M-2), not a call of M — mathjs reads it as a call and
  // throws, so a factorised form could not be compared with an expanded one.
  // ONE LETTER ONLY: a longer run in front of a bracket is a name, and gf(t) is
  // f then g, whose order a product would throw away.
  const called = s.replace(/(^|[^a-zA-Z\\])([a-zA-Z])\s*\(/g, (whole, lead: string, name: string) =>
    KNOWN_NAMES.has(name.toLowerCase()) ? whole : `${lead}${name}*(`);

  return called.replace(/[a-zA-Z]{2,}/g, (run: string, offset: number) => {
    if (isName(run)) return run;
    // A run behind a backslash is a KaTeX command — \leq, \in, \mathbb — and a
    // command name is a name whatever letters it is spelt with.
    if (called[offset - 1] === '\\') return run;
    // CONTEXT, or prose becomes algebra: "obtuse angle" split letter by letter
    // would read as mathematics and reach mathjs, which is what the prose guard
    // exists to prevent. A run is a product only where it touches arithmetic.
    const before = called[offset - 1] ?? '';
    const after = called[offset + run.length] ?? '';
    // A hyphen joins words ("x-intercept", "right-angled") far more often than
    // it multiplies, and a plus is a sign; neither makes a letter run a product.
    // Nor does a brace, which groups a fraction and delimits a set: {red, blue}
    // is three colours. What does: a power, an operator, a bracket, or a digit.
    const touchesMath = /[*/^([\d]/.test(before) || /[*/^)\]\d]/.test(after);
    return touchesMath ? run.split('').join('*') : run;
  });
}

/** √ is a square root, ∛ a cube root, ∜ a fourth. */
const ROOT_INDEX: Record<string, number> = { '\u221A': 2, '\u221B': 3, '\u221C': 4 };

/**
 * A ROOT SIGN TAKES WHAT FOLLOWS IT, however long. The old rule took a run of
 * word characters, so ∛(3V/(4π)) — the way a student types a cube root — kept
 * only the first bracket and the rest fell out of the expression.
 */
function expandRootSigns(s: string): string {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const index = ROOT_INDEX[s[i]];
    if (!index) { out += s[i]; continue; }
    let j = i + 1;
    while (s[j] === ' ') j++;
    let body: string;
    if (s[j] === '(') {
      let depth = 0;
      let k = j;
      for (; k < s.length; k++) {
        if (s[k] === '(') depth++;
        else if (s[k] === ')' && --depth === 0) break;
      }
      body = s.slice(j + 1, k);
      i = k;
    } else {
      let k = j;
      while (k < s.length && /[\w.\\{}^]/.test(s[k])) k++;
      body = s.slice(j, k);
      i = k - 1;
    }
    out += index === 2 ? `sqrt(${body})` : `nthRoot(${body}, ${index})`;
  }
  return out;
}

export function toMathExpr(s: string): string {
  return splitAdjacentSymbols(expandRootSigns(expandNestedCommands(s))
    // \left and \right are spacing, and preClean drops them — but
    // looksMathematical asks this of a RAW stored answer, where they survive
    // to be read as the English words "left" and "right", so a bracketed
    // expression looked like prose. The commands go; the words do not.
    .replace(/\\left\b|\\right\b/g, '')
    // A PRIME IS A COMPLEMENT, not a transpose. mathjs reads C' as the
    // transpose of C, which for a scalar IS C — so a set sampled equal to its
    // own complement, and nothing above could tell them apart.
    .replace(/([a-z])'/gi, '$1_c')
    .replace(/\^\s*\{([^{}]+)\}/g, '^($1)') // 10^{-5}: mathjs wants parentheses
    .replace(/\\pi|π/g, 'pi')).replace(/\\/g, '');
}


// Names mathjs resolves itself; everything else in an expression is a free
// variable the student chose.
const MATH_CONSTANTS = new Set(['pi', 'e', 'i', 'tau', 'phi', 'infinity']);

// The free variables of an expression, or null if it will not parse.
export function freeVariables(expr: string): string[] | null {
  try {
    const names = new Set<string>();
    parse(expr).traverse((node: unknown, _path: string, parent: unknown) => {
      const n = node as { isSymbolNode?: boolean; name?: string };
      const p = parent as { isFunctionNode?: boolean; fn?: unknown } | null;
      if (!n.isSymbolNode || !n.name) return;
      if (p?.isFunctionNode && p.fn === node) return; // "sqrt" is not a variable
      if (!MATH_CONSTANTS.has(n.name.toLowerCase())) names.add(n.name);
    });
    return [...names];
  } catch {
    return null;
  }
}



/**
 * The number an expression comes to, or null. Null covers every way that can
 * fail — it will not parse, it carries a variable, it is complex, it is
 * infinite — because a caller that cannot get a number must fall back, never
 * guess.
 */
export function numericValue(s: string): number | null {
  const expr = toMathExpr(s);
  const vars = freeVariables(expr);
  if (vars === null || vars.length > 0) return null;
  try {
    const v = evaluate(expr);
    return typeof v === 'number' && Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}
