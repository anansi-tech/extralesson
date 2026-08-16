import katex from 'katex';

// Render a KaTeX-safe string (inline math delimited by $...$) to HTML.
// Server-side only; output is injected with dangerouslySetInnerHTML and the
// non-math segments are HTML-escaped here first.
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// The $ in a currency marker like "EC$12" must never act as a math delimiter.
// Swap "EC$" for a sentinel before splitting on $...$, restore afterwards.
const CURRENCY_SENTINEL = '\u0001';

// Answer-shaped values — part answers, accept lists, final_answer, and
// misconception triggers. The values-only convention means these hold a bare
// value with no $ delimiters ("P=M^2-2M", "r=\sqrt[3]{\frac{3V}{4\pi}}"), so
// renderMathHtml alone leaves them as raw source. Each ";"-separated value is
// typeset when it is an expression and left as text when it is a phrase
// ("obtuse angle", "No", "5 pieces", "EC$51").
export function renderAnswerHtml(raw: string): string {
  return raw
    .split(';')
    .map((value) => renderOneAnswer(value.trim()))
    .filter((v) => v.length > 0)
    .join('; ');
}

function renderOneAnswer(value: string): string {
  if (value === '') return '';
  // Already delimited, or carries currency: the prose renderer handles both.
  if (/\$[^$]+\$/.test(value) || value.includes('EC$')) return renderMathHtml(value);
  if (!looksLikeExpression(value)) return escapeHtml(value);
  try {
    // A bare % opens a comment in KaTeX's input syntax and would swallow the
    // rest of the line, so "12.5%" must be escaped before it is parsed.
    return katex.renderToString(value.replace(/(^|[^\\])%/g, '$1\\%'), {
      throwOnError: true,
    });
  } catch {
    return escapeHtml(value); // not valid math after all — show it verbatim
  }
}

// An expression carries math signals and no prose words. Backslash commands
// are removed first so \frac and \sqrt don't read as words.
function looksLikeExpression(value: string): boolean {
  if (!/[\\^_=+\-*/]|\d/.test(value)) return false;
  const letters = value
    .replace(/\\(?:begin|end)\{[a-zA-Z*]+\}/g, '') // environments: pmatrix, cases
    .replace(/\\[a-zA-Z]+/g, '') // commands: \frac, \sqrt, \pi
    .replace(/[^a-zA-Z]+/g, ' ');
  return !/[a-zA-Z]{3,}/.test(letters);
}

export function renderMathHtml(text: string): string {
  const restore = (s: string) => s.replace(new RegExp(CURRENCY_SENTINEL, 'g'), () => 'EC$');
  return text
    .replace(/EC\$/g, CURRENCY_SENTINEL)
    // \( ... \) is LaTeX's other inline delimiter and models reach for it
    // freely; unrecognised, it reaches the student as raw source.
    .replace(/\\[()]/g, '$')
    // A column vector already carries its brackets, so an author's parentheses
    // around one render as ((6 -8)).
    .replace(/\(\s*(\$\\begin\{[bp]matrix\}[\s\S]*?\\end\{[bp]matrix\}\$)\s*\)/g, '$1')
    .split(/(\$[^$]+\$)/g)
    .map((seg) => {
      if (seg.startsWith('$') && seg.endsWith('$') && seg.length > 2) {
        try {
          return katex.renderToString(restore(seg.slice(1, -1)), { throwOnError: false });
        } catch {
          return escapeHtml(restore(seg));
        }
      }
      // Authored whitespace is preserved as-is, NOT rewritten into markup:
      // callers render this inside `.question-prose` (white-space: pre-wrap),
      // so line breaks between steps and the double space at a sentence
      // boundary both survive. KaTeX resets white-space internally, so math
      // is unaffected.
      return escapeHtml(restore(seg));
    })
    .join('');
}
