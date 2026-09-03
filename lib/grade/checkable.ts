// Which questions can be settled by computation, and what to compute.
// Deliberately narrow: it recognises the shapes the papers actually use and
// reports everything else as unchecked, because a checker that guesses is worse
// than one that abstains.
import {
  composite,
  factorisation,
  inverse,
  satisfiesEquation,
  type Verdict,
} from './symbolic';
import { multiply, parseMatrix, sameMatrix, type Matrix2 } from './matrix';

export interface CheckTarget {
  slotRef: string;
  family: string;
  verdict: Verdict;
}

interface QuestionLike {
  stem?: string;
  stimulus?: string;
  parts?: { label: string; prompt: string; slots?: { label: string; prompt?: string; answer: string }[] }[];
  worked_solution?: string;
}

/**
 * Matrix arithmetic the WORKED SOLUTION asserts, read from its own equality
 * CHAIN, never inferred from prose. Every segment that evaluates to a matrix
 * must agree; matching "A B = C" pairwise reported correct questions as wrong.
 */
export function matrixClaims(text: string): CheckTarget[] {
  const out: CheckTarget[] = [];
  if (!text) return out;

  for (const block of mathBlocks(text)) {
    const segments = block.split('=').map(evaluateMatrixSegment);
    const known = segments.filter((v): v is Matrix2 => v !== null);
    if (known.length < 2) continue;
    const [first, ...rest] = known;
    const wrong = rest.find((m) => !sameMatrix(first, m));
    out.push({
      slotRef: 'worked_solution',
      family: 'matrix arithmetic',
      verdict: wrong
        ? { checked: true, ok: false, reason: matrixMismatch(block, first, wrong) }
        : { checked: true, ok: true },
    });
  }
  return out;
}

/** Display and inline maths, where an asserted equation lives. */
function mathBlocks(text: string): string[] {
  return [...text.matchAll(/\\\[([\s\S]*?)\\\]|\$([^$]+)\$/g)].map((m) => m[1] ?? m[2]);
}

/**
 * A segment of an equality chain, as a matrix — or null when it is not one.
 * Null is load-bearing: an entrywise working step is a matrix of expressions,
 * and guessing at "2-1" would invent a claim the solution never made.
 */
function evaluateMatrixSegment(segment: string): Matrix2 | null {
  const found = [...segment.matchAll(/\\begin\{[bp]matrix\}[\s\S]*?\\end\{[bp]matrix\}/g)].map((m) =>
    parseMatrix(m[0]),
  );
  if (found.length === 0 || found.some((m) => m === null)) return null;

  // ABSTAIN ON ANYTHING THAT IS NOT A PLAIN PRODUCT: a scalar in front of the
  // matrices, or a superscript such as ^{-1} or ^T, changes the value, and
  // ignoring it invents a claim the solution never made.
  const leftover = segment
    .replace(/\\begin\{[bp]matrix\}[\s\S]*?\\end\{[bp]matrix\}/g, '')
    .replace(/\\times|\\cdot|\\left|\\right|\\,|\\;|\\quad|[*\s()]/g, '')
    // Sentence punctuation closing a display block is not mathematics.
    .replace(/^[.,;:]+|[.,;:]+$/g, '');
  if (leftover !== '') return null;

  return (found as Matrix2[]).reduce((acc, m) => multiply(acc, m));
}

function matrixMismatch(block: string, want: Matrix2, got: Matrix2): string {
  const show = (m: Matrix2) => `(${m[0]} ${m[1]}; ${m[2]} ${m[3]})`;
  void block;
  return `the solution asserts ${show(want)} = ${show(got)}, which is false`;
}

export function functionDefs(text: string): Map<string, string> {
  const defs = new Map<string, string>();
  // A period inside a decimal is part of the definition; a period that ends
  // the sentence is not.
  const body = String.raw`((?:[^$,;\n.]|\.(?=\d))+)`;
  const arrow = new RegExp(String.raw`\b([fghpq])\s*:\s*x\s*(?:\\to|\\mapsto|\\rightarrow|->)\s*` + body, 'g');
  const call = new RegExp(String.raw`\b([fghpq])\s*\(\s*x\s*\)\s*=\s*` + body, 'g');
  for (const re of [arrow, call]) {
    for (const m of text.matchAll(re)) {
      const body = m[2].replace(/\\quad|\\ /g, ' ').trim();
      if (body && !defs.has(m[1])) defs.set(m[1], body);
    }
  }
  return defs;
}

/** The expression a "factorise"/"expand" instruction is pointing at. */
function subjectExpression(prompt: string): string | null {
  const m = prompt.match(/\$([^$]+)\$\s*$/) ?? prompt.match(/\$([^$]+)\$/);
  return m ? m[1] : null;
}

/** The equation a "solve" instruction is pointing at. */
function subjectEquation(prompt: string): string | null {
  for (const m of prompt.matchAll(/\$([^$]+)\$/g)) {
    if (m[1].includes('=')) return m[1];
  }
  return null;
}

export function checkQuestion(q: QuestionLike): CheckTarget[] {
  const out: CheckTarget[] = [];
  const context = `${q.stimulus ?? ''} ${q.stem ?? ''}`;
  const defs = functionDefs(context);

  for (const part of q.parts ?? []) {
    for (const slot of part.slots ?? []) {
      const ref = `${part.label}.${slot.label}`;
      const ask = `${part.prompt} ${slot.prompt ?? ''}`;
      const answer = slot.answer;
      if (!answer) continue;

      // A function-valued demand has a function-valued answer: "Calculate
      // f^{-1}g(2)" asks for a NUMBER, and comparing it against the inverse
      // function reports a failure that is the checker's. Test for the variable
      // itself, not a standalone word — "2x+4" has no isolated letter.
      const answerIsExpression = /x/.test(answer.replace(/\\[a-zA-Z]+/g, ''));

      // Composition. fg(x) means f(g(x)) — apply g first. Reversing this is the
      // failure that got through two model passes agreeing with each other.
      const comp = ask.match(/\b([fghpq])\s*([fghpq])\s*\(\s*x\s*\)/);
      if (comp && answerIsExpression && defs.has(comp[1]) && defs.has(comp[2]) && comp[1] !== comp[2]) {
        const [outer, inner] = [comp[1], comp[2]];
        out.push({
          slotRef: ref,
          family: `composite ${outer}${inner}`,
          verdict: composite(defs.get(outer)!, defs.get(inner)!, 'fg', answer),
        });
        continue;
      }

      const inv = ask.match(/\b([fghpq])\s*\^\s*\{?\s*-\s*1\s*\}?/);
      // f^{-1}g(2) or f^{-1}(5) is an evaluation, not the inverse function.
      const wantsFunction = /\^\s*\{?\s*-\s*1\s*\}?\s*\(\s*x\s*\)/.test(ask);
      if (inv && wantsFunction && answerIsExpression && defs.has(inv[1])) {
        out.push({ slotRef: ref, family: `inverse ${inv[1]}`, verdict: inverse(defs.get(inv[1])!, answer) });
        continue;
      }

      // Factorise / expand: the answer must be the same expression, rewritten.
      if (/\bfactoris|\bfactoriz|\bexpand\b/i.test(ask)) {
        const subject = subjectExpression(ask);
        if (subject) {
          out.push({
            slotRef: ref,
            family: /expand/i.test(ask) ? 'expansion' : 'factorisation',
            verdict: factorisation(subject, answer),
          });
          continue;
        }
      }

      // Solve: each root must satisfy the equation it came from.
      if (/\bsolve\b/i.test(ask)) {
        const eq = subjectEquation(ask);
        const variable = eq?.match(/\b([a-z])\b/)?.[1] ?? 'x';
        if (eq) {
          const roots = answer.split(/;|,|\bor\b/).map((r) => r.replace(/^[a-z]\s*=\s*/i, '').trim()).filter(Boolean);
          for (const [i, root] of roots.entries()) {
            out.push({
              slotRef: `${ref}${roots.length > 1 ? `[${i}]` : ''}`,
              family: 'equation root',
              verdict: satisfiesEquation(eq, variable, root),
            });
          }
          continue;
        }
      }
    }
  }
  return out;
}

/** The authoritative verdict: any deterministic failure sinks the question. */
export function symbolicVerdict(q: QuestionLike): {
  checked: number;
  failures: { slotRef: string; family: string; reason: string }[];
} {
  const targets = [...checkQuestion(q), ...matrixClaims(q.worked_solution ?? '')];
  const decided = targets.filter((t) => t.verdict.checked);
  return {
    checked: decided.length,
    failures: decided
      .filter((t) => !(t.verdict as { ok: boolean }).ok)
      .map((t) => ({ slotRef: t.slotRef, family: t.family, reason: (t.verdict as { reason: string }).reason })),
  };
}
