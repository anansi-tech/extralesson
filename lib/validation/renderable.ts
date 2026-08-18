// Can this string survive the renderer?
//
// Every formatting defect found in the August audit — $$ blocks, prose swallowed
// between stray delimiters, cloze gaps inside maths, semicolons tearing an
// answer in half, $ in an SVG label, a control character where \vec belonged —
// reached the database because NOTHING checked. The generator asked for
// KaTeX-safe output, the model mostly complied, and the only place a mistake
// surfaced was a reviewer's screen. Every repair was therefore a database
// repair, and the next batch brought the same classes back.
//
// These are the renderer's own contracts, stated as checks:
//   lib/katex.ts renderMathHtml   — splits on a single $, and on \[...\]
//   lib/katex.ts renderAnswerHtml — splits on ";" BEFORE typesetting
//   the cloze surfaces            — split the statement on {} BEFORE typesetting
//   lib/visuals/svg.ts            — draws labels as plain text, never KaTeX

/** Money is stored escaped (\$) and is not a delimiter; drop it before counting. */
const bare = (s: string) => s.replace(/\\\$/g, '');

const CONTROL = new RegExp('[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F]');

export function delimiterIssues(text: string): string[] {
  const issues: string[] = [];
  const s = bare(text);
  if (s.includes('$$')) {
    issues.push('uses $$ for display maths; this renderer splits on a single $, so write \\[ ... \\]');
  }
  if ((s.match(/\$/g) ?? []).length % 2 !== 0) {
    issues.push('has an odd number of $ delimiters, so one opens and never closes');
  }
  if (CONTROL.test(text)) {
    issues.push('contains a control character, which is a mangled command rather than maths');
  }
  return issues;
}

/**
 * A cloze statement is split at {} before typesetting, so every piece has to
 * stand on its own. "$n(A \cap B) = {}$" leaves both halves with one loose $.
 */
export function clozeIssues(statement: string): string[] {
  const broken = bare(statement)
    .split('{}')
    .some((p) => (p.match(/\$/g) ?? []).length % 2 !== 0);
  return broken ? ['a {} gap sits inside $...$; the gap must be outside the maths'] : [];
}

/**
 * An answer is split on ";" before typesetting, so a semicolon inside maths
 * tears the expression in half.
 */
export function answerIssues(answer: string): string[] {
  if (!answer.includes(';')) return [];
  const torn = answer
    .split(';')
    .some(
      (f) =>
        (bare(f).match(/\$/g) ?? []).length % 2 !== 0 ||
        (f.match(/\\begin\{/g) ?? []).length !== (f.match(/\\end\{/g) ?? []).length,
    );
  return torn ? ['a ";" falls inside maths; answers are split on ";" before they are typeset'] : [];
}

/** SVG and table labels are drawn as plain text — KaTeX never runs on them. */
export function labelIssues(label: string): string[] {
  return bare(label).includes('$')
    ? ['a figure or table label carries $; labels are plain text and are never typeset']
    : [];
}
