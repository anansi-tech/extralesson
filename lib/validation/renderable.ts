// Can this string survive the renderer? These are the renderer's own contracts,
// stated as checks, so a defect is caught before the database rather than on a
// reviewer's screen: renderMathHtml splits on a single $ and on \[...\];
// renderAnswerHtml splits on ";" BEFORE typesetting; the cloze surfaces split
// the statement on {}; lib/visuals/svg.ts draws labels as plain text.

/** Money is stored escaped (\$) and is not a delimiter; drop it before counting. */
const bare = (s: string) => s.replace(/\\\$/g, '');

// Every control character except the newline, the only one a question
// legitimately contains. A tab here is what a JSON escape leaves behind when a
// maths command loses its second backslash — \theta arrives as tab + "heta" —
// and \times, \neq, \rho and \frac fail the same way, so the class has to be
// everything rather than the codes noticed so far.
const CONTROL = new RegExp('[\\u0000-\\u0009\\u000B-\\u001F\\u007F]');

/** The one check every field needs, whatever else is checked about it. */
function controlIssues(text: string): string[] {
  return CONTROL.test(text)
    ? ['contains a control character — a maths command whose backslash was eaten by a JSON escape, not maths']
    : [];
}

/**
 * A math span holding a sentence of prose is a mis-paired delimiter. Parity is
 * not enough: two stray $ balance each other, so every span after the first is
 * shifted and prose is typeset as maths. Counting delimiters cannot see it.
 */
function proseInsideMath(text: string): boolean {
  return bare(text)
    .split(/(\$[^$]+\$)/g)
    .some((seg) => {
      if (!(seg.startsWith('$') && seg.endsWith('$') && seg.length > 2)) return false;
      const body = seg.slice(1, -1);
      if (/\\text\{|\\mbox\{|\\operatorname|\\begin\{/.test(body)) return false;
      const words = body
        .replace(/\\(?:begin|end)\{[a-zA-Z*]+\}|\\[a-zA-Z]+/g, ' ')
        .replace(/[^a-zA-Z ]+/g, ' ')
        .trim()
        .split(/\s+/)
        // Point labels — PQR, ABCD — are maths, not prose.
        .filter((w) => w.length >= 3 && w !== w.toUpperCase());
      return words.length >= 2;
    });
}

/**
 * A command stranded in prose. "exceeded 35\%." outside any $...$ prints the
 * backslash to the student, because prose is escaped and never typeset.
 */
function strandedCommands(text: string): string[] {
  const prose = bare(text)
    .replace(/\\\[[\s\S]*?\\\]/g, ' ')
    .replace(/\$[^$]+\$/g, ' ');
  return [...new Set((prose.match(/\\[a-zA-Z]+|\\%/g) ?? []))];
}

export function delimiterIssues(text: string): string[] {
  const issues: string[] = [];
  const s = bare(text);
  if (s.includes('$$')) {
    issues.push('uses $$ for display maths; this renderer splits on a single $, so write \\[ ... \\]');
  }
  if ((s.match(/\$/g) ?? []).length % 2 !== 0) {
    issues.push('has an odd number of $ delimiters, so one opens and never closes');
  }
  issues.push(...controlIssues(text));
  const stranded = strandedCommands(text);
  if (stranded.length > 0) {
    issues.push(
      `carries ${stranded.slice(0, 3).join(', ')} outside any maths, which prints the backslash to the student`,
    );
  }
  if (proseInsideMath(text)) {
    issues.push(
      'a $...$ span contains a sentence of prose, so the delimiters are mis-paired — an unclosed $ earlier shifts every span after it',
    );
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
  // An answer is compared character by character against what a student types,
  // so a stray control character there is worse than in prose: it can never be
  // matched, and the question is unanswerable rather than merely ugly.
  const control = controlIssues(answer);
  if (control.length > 0) return control;
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
