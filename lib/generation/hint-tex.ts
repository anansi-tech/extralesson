/**
 * TeX THROUGH JSON (ROUND_7 Task 1): the hint generator tells the model to
 * double every backslash inside the JSON string, restores any command name
 * the criterion has that arrives bare ("overrightarrow{") — inside math
 * only — and refuses a hint that breaks any of the rules below.
 */
const TEX_COMMAND = /\\([A-Za-z]+)/g;
export const commandsIn = (s: string): string[] => [...new Set([...s.matchAll(TEX_COMMAND)].map((m) => m[1]))];

/** The $…$ spans of a hint, as [start, end) offsets; an unclosed $ runs to the end. */
export function mathSpans(s: string): [number, number][] {
  const spans: [number, number][] = [];
  let open = -1;
  for (let i = 0; i < s.length; i++) {
    if (s[i] !== '$') continue;
    if (open < 0) open = i;
    else {
      spans.push([open, i + 1]);
      open = -1;
    }
  }
  if (open >= 0) spans.push([open, s.length]);
  return spans;
}

const inMath = (s: string, at: number) => mathSpans(s).some(([a, b]) => at >= a && at < b);

/** A bare command name the criterion has gets its backslash back, inside math only. */
export function repairTex(hint: string, criterion: string): string {
  let out = hint;
  for (const c of commandsIn(criterion)) {
    const bare = new RegExp(`(?<!\\\\)\\b${c}(?=[{\\s$])`, 'g');
    out = out.replace(bare, (m, at: number) => (inMath(out, at) ? `\\${c}` : m));
  }
  return out;
}

/** The scheme's quoted "your" is the student's plain your. */
export const plainYour = (hint: string): string => hint.replace(/[“"']your[”"']/g, 'your');

/**
 * A command the criterion has that appears in the hint's math as a bare word
 * ("ge20" for \\ge20, "frac{" for \\frac{) lost its backslash on the way
 * through JSON. A command the hint never uses is not missing: a hint says
 * the step, not the answer, and the answer is where most of the TeX lives.
 */
export function missingCommands(hint: string, criterion: string): string[] {
  if (!hint.includes('$')) return [];
  const math = mathSpans(hint).map(([a, b]) => hint.slice(a, b)).join(' ');
  return commandsIn(criterion).filter((c) => new RegExp(`(?<![\\\\A-Za-z])${c}(?![A-Za-z])`).test(math) && !new RegExp(`\\\\${c}(?![A-Za-z])`).test(math));
}

/** Every reason a hint may not ship; empty means it may. */
export function hintProblems(hint: string, criterion: string): string[] {
  const problems: string[] = [];
  const missing = missingCommands(hint, criterion);
  if (missing.length) problems.push(`lacks \\${missing.join(', \\')} from its criterion`);
  for (const m of hint.matchAll(/\\[A-Za-z]+/g)) if (!inMath(hint, m.index!)) problems.push(`bare TeX outside $…$: ${m[0]}`);
  if (/\\[()[\]]/.test(hint)) problems.push('uses \\( \\) or \\[ \\] instead of $…$');
  if (mathSpans(hint).some(([, b]) => b === hint.length && hint[hint.length - 1] !== '$')) problems.push('an unclosed $');
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(hint)) problems.push('contains a control character');
  if (/[“"']your[”"']/.test(hint)) problems.push('quotes "your"');
  if (/\b(mark|criterion|award|their)\b/i.test(hint)) problems.push('uses a scheme word (mark, criterion, award, their)');
  return problems;
}
