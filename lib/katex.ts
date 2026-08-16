import katex from 'katex';
import { protectMoney, restoreMoney } from '@/lib/money';

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
// Money is understood in exactly one place: lib/money.ts. Content stores an
// escaped \$ and the renderer emits a bare $, so the segmenter below never
// meets a dollar sign it could mistake for a delimiter.

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

function renderOneAnswer(raw: string): string {
  // \( ... \) is the other inline math delimiter; KaTeX's parser rejects it,
  // so an answer written that way used to fall through to verbatim text and
  // show the student \begin{pmatrix}.
  const value = raw.replace(/\\[()]/g, '$').trim();
  if (value === '') return '';
  // Already delimited, or carries currency: the prose renderer handles both.
  // Already delimited, or carries money: the prose renderer handles both.
  if (/\$[^$]+\$/.test(value) || /\\\$/.test(value)) return renderMathHtml(value);
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
// English words that join quantities in an answer: "14 m by 6 m", "3 to 4".
// A run of three letters already marks a value as prose; these are the short
// ones that slipped through and were typeset as maths, which renders them as
// italic variables with the spaces closed up — "14mby6m".
const CONNECTOR = /\b(?:by|to|per|and|or|each)\b/i;

function looksLikeExpression(value: string): boolean {
  if (!/[\\^_=+\-*/]|\d/.test(value)) return false;
  if (CONNECTOR.test(value)) return false;
  const letters = value
    .replace(/\\(?:begin|end)\{[a-zA-Z*]+\}/g, '') // environments: pmatrix, cases
    .replace(/\\[a-zA-Z]+/g, '') // commands: \frac, \sqrt, \pi
    .replace(/[^a-zA-Z]+/g, ' ');
  return !/[a-zA-Z]{3,}/.test(letters);
}

export function renderMathHtml(text: string): string {
  // \[ ... \] is display math, and a worked solution reaches for it to set a
  // table of values as an array. Split those out first and render them in
  // display mode; everything else goes through the inline pipeline below.
  return text
    .split(/(\\\[[\s\S]*?\\\])/g)
    .map((block) =>
      block.startsWith('\\[') && block.endsWith('\\]')
        ? renderDisplayMath(block.slice(2, -2))
        : renderInline(block),
    )
    .join('');
}

function renderDisplayMath(body: string): string {
  try {
    return katex.renderToString(body.trim(), { displayMode: true, throwOnError: true });
  } catch {
    return escapeHtml(body); // not valid math — show it rather than lose it
  }
}

function renderInline(text: string): string {
  // Money first: an escaped \$ becomes a sentinel, so the segmentation below
  // cannot mistake it for a delimiter, and it comes back as a bare $ at the end.
  return protectMoney(text)
    // \( ... \) is the other inline math delimiter and models reach for it
    // freely; unrecognised, it reaches the student as raw source.
    .replace(/\\[()]/g, '$')
    // Math that already carries brackets — a column vector, a coordinate pair —
    // renders as ((7, 1)) when an author wraps it in parentheses as well.
    .replace(/\(\s*(\$[^$]+\$)\s*\)/g, (whole, math: string) => {
      const inner = math.slice(1, -1).trim();
      const bracketed =
        /^\\begin\{[bp]matrix\}/.test(inner) || (inner.startsWith('(') && inner.endsWith(')'));
      return bracketed ? math : whole;
    })
    .split(/(\$[^$]+\$)/g)
    .map((seg) => {
      if (seg.startsWith('$') && seg.endsWith('$') && seg.length > 2) {
        try {
          return katex.renderToString(restoreMoney(seg.slice(1, -1)), { throwOnError: false });
        } catch {
          return escapeHtml(restoreMoney(seg));
        }
      }
      // Authored whitespace is preserved as-is, NOT rewritten into markup:
      // callers render this inside `.question-prose` (white-space: pre-wrap),
      // so line breaks between steps and the double space at a sentence
      // boundary both survive. KaTeX resets white-space internally, so math
      // is unaffected.
      return escapeHtml(restoreMoney(seg));
    })
    .join('');
}
