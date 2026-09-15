import { evaluate, parse, rationalize, simplify } from 'mathjs';
import { markMoney, normaliseDigitGroups } from '@/lib/money';
import { parseQuantity, parseQuantityProduct, productsEqual, sameDimension, UNIT_WORDS } from './quantity';
import { roundingOf, roundTo, type Rounding } from './rounding';

// Final-answer equivalence (ROUND_1 §6.3 and §4.3): documented deterministic
// heuristics, no LLM grading.

// Phone keyboards and copy-out-of-a-page insert zero-width joiners and
// non-breaking spaces. A wrong mark nothing on the screen explains is the
// worst kind, so these characters carry no weight here.
function stripInvisible(raw: string): string {
  return raw
    .replace(/[\u200b-\u200f\u2060\ufeff]/g, '')
    .replace(/[\u00a0\u2007\u2009\u202f]/g, ' ');
}

function preClean(raw: string): string {
  // Currency logic lives in lib/money.ts and nowhere else. Money is MARKED as a
  // unit, not stripped: deleting the currency made every amount a bare number,
  // so $70 matched 70 m.
  // SPACING COMMANDS FIRST, THEN THE GROUPING. "18\\ 000" is eighteen thousand,
  // but the grouper looks for a digit followed by a space or a comma and finds a
  // BACKSLASH, so it never fired; and it ran before the strip below, so even the
  // forms that strip cleanly were past saving by then. `\\ ` is a thin space and
  // `\\\\ ` is a matrix row separator followed by one, so only an unpaired
  // backslash is a space.
  // WORD-BOUNDED, because \right is a prefix of \rightarrow: stripping it left
  // the word "arrow" standing in the middle of a mapping, so "f: x \rightarrow 2x+1"
  // read as prose and never reached the symbolic path.
  const despaced = stripInvisible(raw).replace(/\\left\b|\\right\b|\\,|\\;|(?<!\\)\\ /g, '');
  const cleaned = normaliseDigitGroups(markMoney(despaced))
    .trim()
    .toLowerCase()
    .replace(/\$+/g, '') // KaTeX delimiters and bare dollar signs
    .replace(/\\text\{([^{}]*)\}/g, '$1') // \text{ and } wrappers carry no value
    // A VECTOR IS ITS SYMBOL. \vec{a}, \mathbf{a} and \underline{a} are three
    // spellings of "this is a vector", and what a mark scheme compares is the
    // expression they sit in: 2b - a and -a + 2b are one answer, 2a - b is a
    // different one, and only the symbols can tell those apart. Read as prose —
    // which is what an unknown command becomes — every vector answer matched
    // every rearrangement of its own terms, including the wrong ones.
    .replace(/\\(?:vec|mathbf|underline)\s*\{([^{}]*)\}/g, '$1')
    .replace(/\\(?:vec|mathbf|underline)\s+([a-z])/g, '$1')
    // Authored answers are KaTeX, where a literal percent is \%. It is the same
    // sign, so unescaping it is what lets "10\%" match "10" and "10%".
    .replace(/\\%/g, '%')
    .replace(/\\[dt]frac\b/g, '\\frac') // display/inline fractions are one fraction
    .replace(/[−–]/g, '-') // unicode minus / en-dash
    // One spelling per relation, whichever notation the writer reached for.
    .replace(/\\mapsto|\\rightarrow|\\to(?![a-z])|↦|→/g, '->')
    .replace(/\\neq?(?![a-z])|≠/g, '!=')
    // Not \b: the bank writes "x\\leq5" with no space, and a digit after q is not
    // a word boundary, so the whole chain went unrecognised.
    .replace(/\\leq?(?![a-z])|≤/g, '<=')
    .replace(/\\geq?(?![a-z])|≥/g, '>=')
    .replace(/\\lt\b/g, '<')
    .replace(/\\gt\b/g, '>')
    .replace(/⁻¹/g, '^{-1}')
    .replace(/[×·]|\\times|\\cdot/g, '*')
    .replace(/÷|\\div\b/g, '/')
    .replace(/\^\s*\{?\s*\\?circ\s*\}?/g, '°')
    .replace(/²/g, '^2') // unicode superscripts are exponents, not prose
    .replace(/³/g, '^3')
    .replace(/\s+/g, ' ')
    // A full stop at the end of a written answer is punctuation, not a value:
    // "No." and "No" are one answer. Only after a letter or a bracket, so a
    // decimal point is never touched.
    .replace(/([a-z)\]])\.$/, '$1')
    // A point named before its coordinates — O(0,0) — is the same point as
    // (0,0), exactly as "x = " in front of a value is the same value. Here and
    // not in stripLabel, which only ever sees one side of the comma.
    .replace(/^[a-z]\s*(\([^()]*,[^()]*\))$/, '$1')
    .trim();
  return rewritePositionalTimes(cleaned);
}

// The letter x is a multiplication sign only POSITIONALLY: every piece either
// side must be arithmetic carrying no letters, so "2^3 x 3" is a product while
// "2x + 5" and "2 x 3 grid" keep their x. Reading it that way anywhere else
// would turn every algebraic answer into arithmetic. quantity.ts applies the
// same rule one level up, for pieces that are quantities.
const ARITHMETIC_PIECE = /^[\d.^{}()\s*\/+-]*\d[\d.^{}()\s*\/+-]*$/;

function rewritePositionalTimes(s: string): string {
  const pieces = s.split(/\s+x\s+/);
  if (pieces.length < 2) return s;
  return pieces.every((p) => ARITHMETIC_PIECE.test(p.trim())) ? pieces.join(' * ') : s;
}

// Input is pre-cleaned, so digit grouping is already gone and every comma
// still standing is a separator. Requiring a space after it marked
// "18kg,27kg,36kg" wrong against the same list typed with the spacebar.
function splitParts(cleaned: string): string[] {
  return cleaned
    .split(/\s+or\s+|\s+and\s+|;|\n|,\s*/)
    .map(stripLabel)
    .filter((p) => p.length > 0);
}

// A name standing in front of a value: "P", "cost of one pineapple". Excludes
// digits, operators, braces and backslashes so an expression is never a label.
const LABEL_LIKE = /^[a-z][a-z\s_]{0,24}$/;

/** One letter standing alone: a name, not a value. */
const BARE_NAME = /^[a-z](?:\^\{?-1\}?)?$/;

// A function being defined or evaluated is a name too, and the answer is its
// right-hand side. Without this, "gf(4) = 6" and "6" read as different answers.
const DEFINITION_LHS = /^(?:[a-z](?:\^\{?-1\}?)?){1,4}(?:\((?:[^()]|\([^()]*\)){0,16}\))?$/;

// "f: x -> (x-1)/2" and "x ↦ (x-1)/2" define the same function as
// "f(x) = (x-1)/2"; the value is what the variable maps to.
function stripMapping(part: string): string {
  const i = part.indexOf('->');
  if (i < 0) return part;
  return /^[a-z]$/.test(part.slice(0, i).trim()) ? part.slice(i + 2).trim() : part;
}

/** Whether the right side is written in variables the left side is not. */
function inOtherVariables(lhs: string, rhs: string): boolean {
  const vars = freeVariables(toMathExpr(rhs));
  return vars !== null && vars.some((v) => v.toLowerCase() !== lhs.toLowerCase());
}

// The left side is discarded only when it actually looks like a label —
// otherwise "matrix = -PR" would throw away the matrix and keep the
// restatement, and "3s = 2(s + 250)" would lose half the equation.
function stripLabel(part: string): string {
  const p = part
    .trim()
    .replace(/^\(?[a-z]\)[\s.:]*/, '')
    // A point named before its coordinates — O(0,0) — is the same point as
    // (0,0), exactly as "x = " in front of a value is the same value. The comma
    // is what says these are coordinates and not a function being evaluated.
;
  for (const sep of ['=', ':']) {
    const i = p.indexOf(sep);
    if (i < 0) continue;
    const lhs = p.slice(0, i).trim();
    const rhs = p.slice(i + 1).trim();
    // "P = 30" is a value with a name on it. "h = d" is a RELATION between two
    // unknowns, and dropping its left side left "d" facing "h" — which is how a
    // scheme and its own accept list, the same relation written both ways round,
    // compared unequal. A bare name on both sides means neither is a label.
    //
    // A function being APPLIED is still a definition, whatever is on the right:
    // "ff^{-1}(x) = x" says the composition is the identity, and its answer is
    // what the chain ends at.
    const applied = DEFINITION_LHS.test(lhs) && lhs.includes('(');
    if (!applied && BARE_NAME.test(rhs)) break;
    // "y = 80x + 120" is an EQUATION, not a labelled expression: a bare
    // single-letter left side is a variable when the right side is written in
    // other variables. Stripping it made an equation into an expression, so
    // "y - 120 = 80x" — the same line rearranged — never reached the rule that
    // compares two equations, and a student who wrote it was refused.
    if (!applied && BARE_NAME.test(lhs) && inOtherVariables(lhs, rhs)) break;
    if (LABEL_LIKE.test(lhs) || DEFINITION_LHS.test(lhs)) {
      // Recurse: "f^{-1}(f(x)) = f(f^{-1}(x)) = x" is a chain of definitions
      // and the answer is what the chain ends at.
      return stripLabel(stripMapping(p.slice(i + 1).trim()));
    }
    break;
  }
  return stripMapping(p.trim());
}

// Returns null when the string is not cleanly numeric.
export function parseNumeric(raw: string): number | null {
  let s = normaliseDigitGroups(preClean(raw)).replace(/,/g, '');
  const eq = s.lastIndexOf('=');
  if (eq >= 0) s = s.slice(eq + 1).trim();
  let percent = false;
  if (s.endsWith('%')) {
    percent = true;
    s = s.slice(0, -1).trim();
  }
  const frac = s.match(/^-?\\frac\{(-?[\d.]+)\}\{(-?[\d.]+)\}$/);
  if (frac) {
    const sign = s.startsWith('-') ? -1 : 1;
    const v = (sign * Number(frac[1])) / Number(frac[2]);
    return Number.isFinite(v) ? (percent ? v / 100 : v) : null;
  }
  const mixed = s.match(/^(-?)(\d+) (\d+)\/(\d+)$/);
  if (mixed) {
    const sign = mixed[1] === '-' ? -1 : 1;
    const v = sign * (Number(mixed[2]) + Number(mixed[3]) / Number(mixed[4]));
    return percent ? v / 100 : v;
  }
  const simple = s.match(/^(-?[\d.]+)\/(-?[\d.]+)$/);
  if (simple) {
    const v = Number(simple[1]) / Number(simple[2]);
    return Number.isFinite(v) ? (percent ? v / 100 : v) : null;
  }
  if (s === '') return null;
  // The numeric head of "72 cm", for callers that want a number and not what it
  // measures. Only units the quantity parser recognises are stripped: stripping
  // any trailing word made "5 pi" the number 5 and kept it off the algebra path
  // that knows pi. The degree sign is a unit that is not a letter and may be the
  // whole tail, so the character class admits it first as well.
  const unitTail = s.match(/^(-?[\d.]+(?: \d+\/\d+)?|-?[\d.]+\/[\d.]+)\s*[a-z°][a-z .°^\d]*$/);
  if (unitTail && parseQuantity(s) !== null) return parseNumeric(unitTail[1]);
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return percent ? n / 100 : n;
}

/** The numeric head of a quantity, before any unit conversion. */
function headOf(raw: string): number | null {
  const m = raw.trim().match(/^(-?\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : null;
}

// EXACT unless the scheme's answer is itself rounded: two numbers agree at
// the stated rounding, and only there. A less-precise-wins rule accepted 26.5
// for 27 with nothing in the question asking for whole numbers; a blanket
// tolerance before it accepted 335 for 336. Representation error is always
// absorbed: 1000 x 1e-6 is 0.001.
function closeEnough(a: number, b: number, rounding: Rounding | null): boolean {
  if (a === b) return true;
  if (Math.abs(a - b) <= Math.max(1e-9, Math.max(Math.abs(a), Math.abs(b)) * 1e-9)) return true;
  if (!rounding) return false;
  return roundTo(a, rounding) === roundTo(b, rounding);
}


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

function toMathExpr(s: string): string {
  return splitAdjacentSymbols(expandRootSigns(expandNestedCommands(s))
    // \left and \right are spacing, and preClean drops them — but
    // looksMathematical asks this of a RAW stored answer, where they survive
    // to be read as the English words "left" and "right", so a bracketed
    // expression looked like prose. The commands go; the words do not.
    .replace(/\\left\b|\\right\b/g, '')
    .replace(/\^\s*\{([^{}]+)\}/g, '^($1)') // 10^{-5}: mathjs wants parentheses
    .replace(/\\pi|π/g, 'pi')).replace(/\\/g, '');
}

// "a = b" becomes "(a) - (b)", so two forms of one equation ("3s = 2(s + 250)"
// and "3s = 2s + 500") reduce to the same expression.
function asDifference(expr: string): string {
  const sides = expr.split('=');
  return sides.length === 2 ? `(${sides[0]}) - (${sides[1]})` : expr;
}

// Names mathjs resolves itself; everything else in an expression is a free
// variable the student chose.
const MATH_CONSTANTS = new Set(['pi', 'e', 'i', 'tau', 'phi', 'infinity']);

// The free variables of an expression, or null if it will not parse.
function freeVariables(expr: string): string[] | null {
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

// Irrational-ish and spread over both signs: two different expressions agree
// at 0, 1 and 2 by coincidence far more easily than they agree here.
const SAMPLE_POINTS = [0.7371, 1.4142, 2.6458, -1.2361, 3.3166, -2.2360, 4.7958];

// Equality of functions, not a student rounding, so the tolerance is float
// noise and nothing more.
function sameToFloatNoise(a: number, b: number): boolean {
  return Math.abs(a - b) <= Math.max(Math.abs(a), Math.abs(b), 1) * 1e-9;
}

// null means "could not tell" — never "not equal".
function sampledEquivalent(ea: string, eb: string, vars: string[]): boolean | null {
  let agreed = 0;
  for (const base of SAMPLE_POINTS) {
    const scope: Record<string, number> = {};
    // Each variable gets its own value, or "x + y" and "2x" would agree.
    vars.forEach((v, j) => {
      scope[v] = base + j * 0.6180;
    });
    let va: unknown;
    let vb: unknown;
    try {
      va = evaluate(ea, { ...scope });
      vb = evaluate(eb, { ...scope });
    } catch {
      continue; // this point is outside a domain (log, sqrt, /0) — try the next
    }
    // A POINT OUTSIDE THE REALS SAYS NOTHING, and is skipped like one outside
    // a domain: mathjs answers x^(1/3) with a COMPLEX number where x is
    // negative, while nthRoot(x, 3) gives the real root, so one negative
    // sample aborted the comparison of two forms of the same cube root
    // instead of passing over it.
    if (typeof va !== 'number' || typeof vb !== 'number') continue;
    if (!Number.isFinite(va) || !Number.isFinite(vb)) continue;
    if (!sameToFloatNoise(va, vb)) return false;
    agreed++;
  }
  return agreed >= 3 ? true : null;
}

// Returns null when it cannot decide. Expressions with a variable are compared
// by SAMPLING, because rationalize() answers a question about strings and
// reported an expression not equivalent to ITSELF over a 2.2e-16 residue. So
// rationalize and simplify are trusted ASYMMETRICALLY: '0' proves equality, a
// non-zero residue proves nothing. A symbolic engine never returns false here.
/**
 * TWO EQUATIONS SAY THE SAME THING when one side's difference is a non-zero
 * multiple of the other's. 6m + 24 = 90 and 6m = 66 are one equation written
 * twice; so are 0.75p = 360 and 75p = 36 000, h = x and x = h, and
 * P = M^2 - 2M and P = M(M - 2). Comparing the differences for EQUALITY caught
 * only the last of those, which is why a mark scheme and its own accept list
 * could disagree.
 *
 * A constant ratio across samples is the whole test. Zero on one side and not
 * the other is a real difference; an identically-zero equation proves nothing
 * and stays undecided.
 */
/**
 * a/b at every sample point it can be taken at. Null means the two are not in
 * any ratio at all: one side vanishes where the other does not.
 */
function sampleRatios(ea: string, eb: string, vars: string[]): { ratios: number[]; sawNonZero: boolean } | null {
  const ratios: number[] = [];
  let sawNonZero = false;
  for (const base of SAMPLE_POINTS) {
    const scope: Record<string, number> = {};
    vars.forEach((v, j) => (scope[v] = base + j * 0.618));
    let va: unknown;
    let vb: unknown;
    try {
      va = evaluate(ea, { ...scope });
      vb = evaluate(eb, { ...scope });
    } catch {
      continue;
    }
    if (typeof va !== 'number' || typeof vb !== 'number') continue;
    if (!Number.isFinite(va) || !Number.isFinite(vb)) continue;
    if (Math.abs(vb) < 1e-9) {
      if (Math.abs(va) > 1e-6) return null;
      continue;
    }
    ratios.push(va / vb);
    if (Math.abs(va) > 1e-9) sawNonZero = true;
  }
  return { ratios, sawNonZero };
}

function constantRatio(sampled: { ratios: number[]; sawNonZero: boolean }): number | null {
  if (sampled.ratios.length < 3 || !sampled.sawNonZero) return null;
  const k = sampled.ratios[0];
  if (Math.abs(k) < 1e-9) return null;
  return sampled.ratios.every((r) => Math.abs(r - k) <= 1e-6 * Math.max(1, Math.abs(k))) ? k : null;
}

function proportional(ea: string, eb: string, vars: string[]): boolean | null {
  const sampled = sampleRatios(ea, eb, vars);
  if (sampled === null) return false;
  if (sampled.ratios.length < 3 || !sampled.sawNonZero) return null;
  if (Math.abs(sampled.ratios[0]) < 1e-9) return false;
  return constantRatio(sampled) !== null;
}

/**
 * AN INEQUALITY IS A SET OF VALUES, not a value, so it reduces to the bounds
 * that set has. Each one is written `expr >= 0`, or `expr > 0` when strict, and
 * a chain contributes one per link: 2 <= x <= 7 is `x - 2 >= 0` and `7 - x >= 0`.
 */
interface Bound {
  expr: string;
  strict: boolean;
}

interface Inequality {
  /** The set the variable is drawn from, when the answer names one. */
  domain: string | null;
  /** A unit written after the last bound, which belongs to the whole interval. */
  unit: string | null;
  bounds: Bound[];
}

/**
 * Set-builder is the inequality inside it, said about a named domain:
 * {x \in \mathbb{R} : 9 <= x <= 12} bounds the same values as 9 <= x <= 12, and
 * the domain is the rest of what it says. The braces may already be gone —
 * readInputShape hands a set-builder over as its one member.
 */
function splitDomain(body: string): { domain: string | null; rest: string } {
  const inner = body.replace(/^\\?\{\s*/, '').replace(/\s*\\?\}$/, '');
  const named = inner.match(/^[a-z]\s*(?:\\in|∈)\s*(?:\\mathbb\{([a-z])\}|([a-z]))\s*(?::|\||\\mid\b)\s*(.+)$/);
  if (!named) return { domain: null, rest: inner };
  return { domain: named[1] ?? named[2], rest: named[3].trim() };
}

/**
 * The unit written once at the end of an interval — "10 <= t < 15 minutes" —
 * measures every bound in it, so it comes off the last term and is compared
 * separately. A one-letter tail is left alone: it cannot be told from a
 * variable.
 */
function splitTrailingUnit(term: string): { term: string; unit: string | null } {
  const m = term.match(/^(.+?)\s+([a-z]{2,})$/);
  if (!m || !UNIT_WORDS.has(m[2])) return { term, unit: null };
  return { term: m[1].trim(), unit: m[2] };
}

/** Null when the string is not an inequality. Input is pre-cleaned. */
function parseInequality(s: string): Inequality | null {
  const { domain, rest } = splitDomain(s.trim());
  const pieces = rest.split(/\s*(<=|>=|<|>)\s*/);
  if (pieces.length < 3 || pieces.length % 2 === 0) return null;
  const terms: string[] = [];
  const rels: string[] = [];
  pieces.forEach((piece, i) => (i % 2 === 0 ? terms : rels).push(piece.trim()));
  const tail = splitTrailingUnit(terms[terms.length - 1]);
  terms[terms.length - 1] = tail.term;
  if (terms.some((t) => t === '' || !looksMathematical(t))) return null;

  const bounds: Bound[] = [];
  for (let i = 0; i < rels.length; i++) {
    const [lo, hi] = rels[i].startsWith('<') ? [terms[i], terms[i + 1]] : [terms[i + 1], terms[i]];
    const expr = toMathExpr(`(${hi}) - (${lo})`);
    if (freeVariables(expr) === null) return null;
    bounds.push({ expr, strict: rels[i].length === 1 });
  }
  return { domain, unit: tail.unit, bounds };
}

/**
 * The value of an expression that does not VARY, or null. Asking whether it
 * carries free variables is not the same question: (x - 7) + (2 - x) carries x
 * and is nevertheless -5, which is the whole of why those two bounds contradict.
 */
function constantValue(expr: string): number | null {
  const vars = freeVariables(expr);
  if (vars === null) return null;
  const seen: number[] = [];
  for (const base of SAMPLE_POINTS) {
    const scope: Record<string, number> = {};
    vars.forEach((v, j) => (scope[v] = base + j * 0.618));
    try {
      const v = evaluate(expr, { ...scope });
      if (typeof v === 'number' && Number.isFinite(v)) seen.push(v);
    } catch {
      continue;
    }
    if (vars.length === 0) break;
  }
  if (seen.length === 0 || (vars.length > 0 && seen.length < 3)) return null;
  return seen.every((v) => sameToFloatNoise(v, seen[0])) ? seen[0] : null;
}

/**
 * AN IMPOSSIBLE INTERVAL DESCRIBES NOTHING, so it equals nothing — including
 * another impossible interval. 7 <= x <= 2 is not a set written backwards; it
 * is a wrong answer, and marking it against its mirror image would award it.
 *
 * Two bounds contradict when they cannot both hold: add them, and if the
 * variable cancels to a negative constant there is no value that satisfies both.
 */
function unsatisfiable(ineq: Inequality): boolean {
  for (let i = 0; i < ineq.bounds.length; i++) {
    for (let j = i + 1; j < ineq.bounds.length; j++) {
      const sum = constantValue(`(${ineq.bounds[i].expr}) + (${ineq.bounds[j].expr})`);
      if (sum === null) continue;
      if (sum < 0) return true;
      if (sum === 0 && (ineq.bounds[i].strict || ineq.bounds[j].strict)) return true;
    }
  }
  return false;
}

/**
 * Two bounds cut at the same place the same way round. "18x - 216 >= 0" and
 * "x - 12 >= 0" admit exactly the same x, because one is a POSITIVE multiple of
 * the other; a negative multiple is the same line facing the other way, which
 * is a different set.
 */
function sameBound(a: Bound, b: Bound): boolean {
  if (a.strict !== b.strict) return false;
  const va = freeVariables(a.expr);
  const vb = freeVariables(b.expr);
  if (va === null || vb === null) return false;
  const vars = [...new Set([...va, ...vb])];
  if (vars.length === 0) {
    const na = constantValue(a.expr);
    const nb = constantValue(b.expr);
    return na !== null && nb !== null && na >= 0 === nb >= 0;
  }
  const sampled = sampleRatios(a.expr, b.expr, vars);
  if (sampled === null) return false;
  const k = constantRatio(sampled);
  return k !== null && k > 0;
}

function sameInequality(a: Inequality, b: Inequality): boolean {
  if (a.domain !== b.domain || a.unit !== b.unit) return false;
  if (a.bounds.length !== b.bounds.length) return false;
  if (unsatisfiable(a) || unsatisfiable(b)) return false;
  const used = new Array<boolean>(b.bounds.length).fill(false);
  return a.bounds.every((ba) => {
    const i = b.bounds.findIndex((bb, j) => !used[j] && sameBound(ba, bb));
    if (i === -1) return false;
    used[i] = true;
    return true;
  });
}

/**
 * WORDS, NOT SYMBOLS. "non-square", "right-angled isosceles triangle" and a
 * sentence that quotes a value are English, and English is compared as words —
 * mathjs reads "obtuse angle" as a product of eleven letters. A hyphen joins
 * words far more often than it subtracts, which is what put every one of these
 * on the expression path, where nothing but string equality could settle them.
 */
export function isProse(s: string): boolean {
  const plain = s
    .replace(/\$[^$]*\$/g, ' ') // inline mathematics is not prose
    .replace(/\\[a-z]+\s*\{[^{}]*\}|\\[a-z]+/gi, ' ')
    .trim();
  if (plain === '') return false;
  if (/^[a-z][a-z\s-]*$/i.test(plain)) return true;
  // A sentence keeps its values, so it is the WORDS that say what it is.
  const words = plain.replace(/[^a-z\s-]/gi, ' ').split(/[\s-]+/).filter((w) => w.length >= 3);
  return words.length >= 3;
}

/** "A = 5x" as the student may answer it, with the name left off. */
function withoutName(s: string): string | null {
  const i = s.indexOf('=');
  if (i < 0) return null;
  return BARE_NAME.test(s.slice(0, i).trim()) ? s.slice(i + 1).trim() : null;
}

function mathEquivalent(a: string, b: string, rounding: Rounding | null): boolean | null {
  const bothEquations = a.includes('=') && b.includes('=');
  // A named quantity is still a name the student may leave off: "A = 5x" is
  // answered by "5x". Only against a side that is NOT an equation — two
  // equations are statements and are compared whole, below.
  if (!bothEquations) {
    const ra = withoutName(a);
    const rb = withoutName(b);
    if (ra !== null && rb === null) return mathEquivalent(ra, b, rounding);
    if (rb !== null && ra === null) return mathEquivalent(a, rb, rounding);
  }
  const ea = toMathExpr(bothEquations ? asDifference(a) : a);
  const eb = toMathExpr(bothEquations ? asDifference(b) : b);

  const va = freeVariables(ea);
  const vb = freeVariables(eb);
  if (va === null || vb === null) return null;
  const vars = [...new Set([...va, ...vb])];

  if (vars.length === 0) {
    try {
      const na = evaluate(ea);
      const nb = evaluate(eb);
      if (typeof na === 'number' && typeof nb === 'number') return closeEnough(na, nb, rounding);
    } catch {
      // not something mathjs can evaluate — fall through
    }
  } else {
    // An equation is a statement, not a value: scaling both sides leaves it
    // saying the same thing, so the differences are compared up to a factor.
    if (bothEquations) {
      const scaled = proportional(ea, eb, vars);
      if (scaled !== null) return scaled;
    }
    const sampled = sampledEquivalent(ea, eb, vars);
    if (sampled !== null) return sampled;
  }

  // rationalize expands polynomials to canonical form (simplify alone does
  // not distribute, so "2(x-2)" vs "2x-4" would not reduce to 0).
  try {
    if (rationalize(`(${ea}) - (${eb})`).toString() === '0') return true;
  } catch {
    // non-polynomial (surds, functions) — try plain simplification
  }
  try {
    if (simplify(`(${ea}) - (${eb})`).toString() === '0') return true;
  } catch {
    return null;
  }
  return null;
}

// Generic nouns that never distinguish two answers ("obtuse" vs "obtuse
// angle" is one answer). Never strip an answer down to nothing.
const GENERIC_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'of',
  'angle', 'angles', 'degree', 'degrees', 'unit', 'units',
]);

function contentTokens(s: string): string[] {
  const all = s
    .replace(/[^a-z0-9°/.\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const kept = all.filter((t) => !GENERIC_WORDS.has(t));
  return kept.length > 0 ? kept : all;
}

// Short classification answers must match on content words exactly, so "acute"
// against "exterior" still fails. Sentence-length justifications are reworded
// freely by an independent solver, so they match on content-word overlap.
function wordsEquivalent(a: string, b: string): boolean {
  const ta = contentTokens(a);
  const tb = contentTokens(b);
  if (ta.length === 0 || tb.length === 0) return false;
  if ([...ta].sort().join(' ') === [...tb].sort().join(' ')) return true;

  // Two prose answers quoting different numbers are different answers. Without
  // this, an answer with a wrong value appended reads as a superset of the
  // right one — which is how a deliberately poisoned draft passed this gate.
  const numbers = (t: string[]) => t.filter((x) => /\d/.test(x)).sort().join(' ');
  if (numbers(ta) !== numbers(tb)) return false;

  const setA = new Set(ta);
  const setB = new Set(tb);
  const [small, large] = setA.size <= setB.size ? [setA, setB] : [setB, setA];
  let shared = 0;
  for (const t of small) if (large.has(t)) shared++;

  // One side adding a qualifier the other omits ("hexagon" / "regular
  // hexagon") is one answer at mark-scheme level. Disjoint answers are not.
  if (shared === small.size) return true;

  if (ta.length >= 4 || tb.length >= 4) {
    return shared / Math.max(setA.size, setB.size) >= 0.6;
  }
  return false;
}

// Prose is not algebra: mathjs reads "obtuse angle" as implicit multiplication
// and rationalize() returns garbage that would read as "not equivalent", so the
// symbolic path runs only when both sides look mathematical.
/**
 * The names an EXPANDED expression carries, so the prose guard does not read
 * one as a word. nthRoot was missing, so "nth" read as prose and no nth root
 * ever reached the symbolic path.
 *
 * Not every name mathjs owns: `min` and `max` are also units and English, and
 * stripping them made "1 h 15 min" read as algebra — which put a unit answer
 * back in front of a comparison that can never settle it.
 */
const NAME_WORDS = /sqrt|nthroot|cbrt|frac|pi|text|cdot|times/gi;

/**
 * WHETHER THE COMPARATOR CAN GET A VALUE OUT OF THIS AT ALL.
 *
 * A value that looks like mathematics but that nothing here can evaluate falls
 * through to a STRING comparison, where it equals itself and nothing else — so
 * a question whose canonical is written one way and whose accept list is
 * written another passes every check by being compared as text. \sqrt[3]{X}
 * did exactly that until the expansion learned it.
 *
 * Prose is not unevaluable: it is compared as words, deliberately.
 */
export function canEvaluate(s: string): boolean {
  const parts = splitParts(preClean(s));
  if (parts.length === 0) return false;
  // Every part, because a whole answer is compared part by part.
  return parts.every((raw) => {
    const part = stripLabel(raw);
    if (part === '') return false;
    if (parseNumeric(part) !== null) return true;
    if (parseQuantity(part) !== null) return true;
    if (parseQuantityProduct(part) !== null) return true;
    if (parseInequality(part) !== null) return true;
    if (isProse(part)) return true; // words, compared as words
    // The symbolic path, which is the last one that yields a VALUE: past here
    // valueEquivalent has only string and word comparison left. An equation is
    // parsed the way the comparator parses one — as the difference of its
    // sides — because "27x = 120 + 15x" is not an assignment.
    if (!looksMathematical(part)) return false;
    return freeVariables(toMathExpr(asDifference(part))) !== null;
  });
}

export function looksMathematical(s: string): boolean {
  // Adjacent letters beside arithmetic are a product, not a word: gT^2 is g
  // times T squared, and reading it as prose kept the whole expression out of
  // the symbolic path. The question is asked of the form the symbolic path
  // receives, so the gate and the parse cannot disagree about what a string is.
  const bare = toMathExpr(s).replace(NAME_WORDS, '');
  return !/[a-z]{2,}/.test(bare);
}

function valueEquivalent(a: string, b: string, rounding: Rounding | null): boolean {
  const close = (x: number, y: number) => closeEnough(x, y, rounding);
  // INEQUALITIES FIRST, and decisively: an interval is not a number, and every
  // path below reads one as the value after its last relation sign. "2 <= x <= 7"
  // against "7 <= x <= 2" compared as the word set {2, 7, x} and agreed, so a
  // student could be awarded an interval that holds nothing.
  const ia = parseInequality(a);
  const ib = parseInequality(b);
  if (ia && ib) return sameInequality(ia, ib);
  if (ia || ib) return false;
  // QUANTITIES FIRST, and decisively: if either side carries a unit the numeric
  // path below must not see it, because that path drops the unit — which is how
  // 72 cm came to equal 72 m. A product of quantities is tried before a single
  // one, since each side of a product is a quantity too.
  const pa = parseQuantityProduct(a);
  const pb = parseQuantityProduct(b);
  if (pa && pb) return productsEqual(pa, pb, close);
  if (pa || pb) return false;

  const qa = parseQuantity(a);
  const qb = parseQuantity(b);
  if (qa && qb) return sameDimension(qa, qb) && close(qa.value, qb.value);
  if (qa || qb) {
    // A bare number is accepted against a unit when the values agree: the
    // question supplied the unit, so omitting it is not a mathematical error.
    // Anything else carrying no unit is not a number, and is not equal.
    const quantity = (qa ?? qb)!;
    const other = parseNumeric(qa ? b : a);
    if (other === null) return false;
    const asWritten = headOf(qa ? a : b);
    return close(other, quantity.value) || (asWritten !== null && close(other, asWritten));
  }

  // AN EQUATION IS NOT ITS RIGHT-HAND SIDE. parseNumeric reads the value after
  // the last "=", which is right for "x = 5" and wrong for two equations:
  // "6m + 24 = 90" against "6m = 66" was compared as 90 against 66, so the
  // statement was never looked at and the symbolic path never ran.
  const bothEquations = a.includes('=') && b.includes('=');
  const na = bothEquations ? null : parseNumeric(a);
  const nb = bothEquations ? null : parseNumeric(b);
  if (na !== null && nb !== null) return close(na, nb);
  if (looksMathematical(a) && looksMathematical(b)) {
    const m = mathEquivalent(a, b, rounding);
    if (m !== null) return m;
  }
  // both sides are already pre-cleaned/label-stripped
  return a === b || wordsEquivalent(a, b);
}

// True when two answers are equivalent. Multi-part answers ("x = -1/3 or
// x = 2", "EC$70; EC$58") match as unordered sets of equivalent values.
// `rounding` undefined means the default: 3 s.f. when either side cannot
// terminate — the scheme's third, or a student's exact surd against a scheme
// that rounded it — and exact otherwise. null means exact.
export function answersEquivalent(a: string, b: string, rounding?: Rounding | null): boolean {
  if (rounding === undefined) rounding = roundingOf({ canonical: b }) ?? roundingOf({ canonical: a });
  const partsA = splitParts(preClean(a));
  const partsB = splitParts(preClean(b));
  if (partsA.length === 0 || partsB.length === 0) return false;

  if (partsA.length !== partsB.length) {
    // Different part counts: only a whole-string comparison can save it.
    return valueEquivalent(stripLabel(preClean(a)), stripLabel(preClean(b)), rounding);
  }

  const used = new Array<boolean>(partsB.length).fill(false);
  for (const pa of partsA) {
    const idx = partsB.findIndex((pb, i) => !used[i] && valueEquivalent(pa, pb, rounding));
    if (idx === -1) return false;
    used[idx] = true;
  }
  return true;
}

// The single entry point for grading and the solve gate. Synonymy lives in the
// question's accept list, as on a real mark scheme, never in heuristics here.
export function answersEquivalentAny(
  candidate: string,
  canonical: string,
  accept?: string[],
  rounding?: Rounding | null,
): boolean {
  if (answersEquivalent(candidate, canonical, rounding)) return true;
  return (accept ?? []).some((alt) => answersEquivalent(candidate, alt, rounding));
}
