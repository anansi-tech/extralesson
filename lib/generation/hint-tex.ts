/**
 * TeX THROUGH JSON (ROUND_7 Task 1): the hint generator tells the model to
 * double every backslash inside the JSON string, restores any command name
 * the criterion has that arrives bare ("overrightarrow{") — inside math
 * only — and refuses a hint that breaks any of the rules below.
 */
const TEX_COMMAND = /\\([A-Za-z]+)/g;
export const commandsIn = (s: string): string[] => [...new Set([...s.matchAll(TEX_COMMAND)].map((m) => m[1]))];

/** The $…$ spans of a hint, as [start, end) offsets; an unclosed $ runs to the end. A \\$ is money, not math. */
export function mathSpans(s: string): [number, number][] {
  const spans: [number, number][] = [];
  let open = -1;
  for (let i = 0; i < s.length; i++) {
    if (s[i] !== '$' || s[i - 1] === '\\') continue;
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

/**
 * A bare command name the criterion has gets its backslash back, inside math
 * only; and where the criterion writes money as \\$, a bare $ before a digit
 * in the hint is money too, not the start of math.
 */
/** JSON turns \\a, \\b, \\f, \\n, \\r, \\t, \\v into control characters: the command the criterion has, with its first letter eaten. */
const JSON_ESCAPES: [RegExp, string][] = [
  [/\x07/g, 'a'],
  [/\x08/g, 'b'],
  [/\x0c/g, 'f'],
  [/\n/g, 'n'],
  [/\r/g, 'r'],
  [/\t/g, 't'],
  [/\x0b/g, 'v'],
];

export function repairTex(hint: string, criterion: string): string {
  let out = hint;
  // A control character followed by the rest of a command the criterion has
  // is that command with its backslash and first letter swallowed by JSON.
  for (const c of commandsIn(criterion)) {
    for (const [ctrl, letter] of JSON_ESCAPES) {
      if (c.startsWith(letter)) out = out.replace(new RegExp(`${ctrl.source}${c.slice(1)}(?![A-Za-z])`, 'g'), `\\${c}`);
    }
  }
  // Only when the dollars do not pair up: a balanced $1.10$ is math and stays.
  const bare = (out.match(/(?<!\\)\$/g) ?? []).length;
  if (/\\\$/.test(criterion) && bare % 2 === 1) out = out.replace(/(?<!\\)\$(?=\d)(?![^$]*\$)/g, '\\$');
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
  for (const m of hint.matchAll(/\\(?:[A-Za-z]+|%)/g)) if (!inMath(hint, m.index!)) problems.push(`bare TeX outside $…$: ${m[0]}`);
  if (/\\[()[\]]/.test(hint)) problems.push('uses \\( \\) or \\[ \\] instead of $…$');
  if (mathSpans(hint).some(([, b]) => b === hint.length && hint[hint.length - 1] !== '$')) problems.push('an unclosed $');
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(hint)) problems.push('contains a control character');
  if (/[“"']your[”"']/.test(hint)) problems.push('quotes "your"');
  if (/\b(mark|criterion|award|their)\b/i.test(hint)) problems.push('uses a scheme word (mark, criterion, award, their)');
  // Imperative, not narrated: "Set x to 0", never "You set x to 0".
  if (/^You\s/.test(hint)) problems.push('begins with "You "');
  // An operator on its own says nothing: "Use $\\times$" names a symbol, not a
  // step. Between two operands — "area $\\times$ thickness" — it is the relationship.
  const standalone = (at: number, len: number) => {
    const before = hint.slice(0, at).trimEnd();
    const after = hint.slice(at + len).trimStart();
    // "Use ×" or "using ×": the word before is a verb, so the symbol stands alone.
    const verbBefore = /\b(use|using|apply|applying|with|by)$/i.test(before);
    const operand = /[\w)$}]$/.test(before) && /^[\w($\\]/.test(after) && !verbBefore;
    return !operand;
  };
  for (const m of hint.matchAll(/\$\s*\\(?:times|div)\s*\$|[×÷]/g)) if (standalone(m.index!, m[0].length)) problems.push('a standalone × or ÷');
  return problems;
}
