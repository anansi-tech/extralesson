import katex from 'katex';
import { protectMoney, restoreMoney, restoreMoneyForMath } from '@/lib/money';

// Server-side only: output is injected with dangerouslySetInnerHTML, so the
// non-math segments are HTML-escaped here first.
// At 1.4 an array opens up past the height where KaTeX reaches for a taller
// delimiter, which is what a column vector of fractions needs; a matrix of
// plain integers stays compact.
const KATEX_MACROS = { '\\arraystretch': '1.4' } as const;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Money is understood in exactly one place: lib/money.ts. Content stores an
// escaped \$ and the renderer emits a bare $, so the segmenter below never
// meets a dollar sign it could mistake for a delimiter.

// Answer-shaped values hold a bare value with no $ delimiters, which
// renderMathHtml alone would leave as raw source. Each ";"-separated value is
// typeset when it is an expression and left as text when it is a phrase.
export function renderAnswerHtml(raw: string): string {
  return raw
    .split(';')
    .map((value) => renderOneAnswer(value.trim()))
    .filter((v) => v.length > 0)
    .join('; ');
}

function renderOneAnswer(raw: string): string {
  // \( ... \) is the other inline math delimiter, and KaTeX's parser rejects it.
  const value = raw.replace(/\\[()]/g, '$').trim();
  if (value === '') return '';
  // Ask "already delimited?" of the value with its MONEY removed: two escaped
  // prices inside one expression contain $...$ as a substring.
  const withoutMoney = value.replace(/\\\$/g, '');
  if (/\$[^$]+\$/.test(withoutMoney)) return renderMathHtml(value);
  // Money with no delimiters: prose keeps it as prose, but an expression that
  // happens to contain a price is still an expression.
  if (/\\\$/.test(value)) {
    // A bare price is a VALUE and stays readable text; a matrix of prices is an
    // EXPRESSION and must be typeset. The difference is structure beyond money.
    const structured = /\\(?!\$)[a-zA-Z]+/.test(value);
    return renderMathHtml(structured && looksLikeExpression(value) ? `$${value}$` : value);
  }
  if (!looksLikeExpression(value)) return escapeHtml(value);
  try {
    // A bare % opens a comment in KaTeX's input syntax and would swallow the
    // rest of the line, so "12.5%" must be escaped before it is parsed.
    return katex.renderToString(value.replace(/(^|[^\\])%/g, '$1\\%'), {
      throwOnError: true,
      macros: { ...KATEX_MACROS },
    });
  } catch {
    return escapeHtml(value); // not valid math after all — show it verbatim
  }
}

// English words that join quantities in an answer: "14 m by 6 m", "3 to 4".
// A run of three letters already marks a value as prose; these are the short
// ones, which typeset as italic variables with the spaces closed up.
const CONNECTOR = /\b(?:by|to|per|and|or|each)\b/i;

function looksLikeExpression(raw: string): boolean {
  // Words inside \text{} are prose the AUTHOR put inside maths on purpose, so
  // leaving their contents behind makes the whole value read as prose.
  const value = raw.replace(/\\(?:text|mbox|operatorname)\{[^{}]*\}/g, ' ');
  if (!/[\\^_=+\-*/]|\d/.test(value)) return false;
  if (CONNECTOR.test(value)) return false;
  const letters = value
    .replace(/\\(?:begin|end)\{[a-zA-Z*]+\}/g, '')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/[^a-zA-Z]+/g, ' ');
  return !/[a-zA-Z]{3,}/.test(letters);
}

export function renderMathHtml(text: string): string {
  // \[ ... \] is display math, which a worked solution reaches for to set a
  // table of values as an array.
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
    return katex.renderToString(body.trim(), {
      displayMode: true,
      throwOnError: true,
      macros: { ...KATEX_MACROS },
    });
  } catch {
    return escapeHtml(body); // not valid math — show it rather than lose it
  }
}

function renderInline(text: string): string {
  // Money first: an escaped \$ becomes a sentinel, so the segmentation below
  // cannot mistake it for a delimiter, and it comes back as a bare $ at the end.
  return protectMoney(text)
    // \( ... \) is the other inline delimiter and models reach for it freely.
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
          return katex.renderToString(restoreMoneyForMath(seg.slice(1, -1)), {
            throwOnError: false,
            macros: { ...KATEX_MACROS },
          });
        } catch {
          return escapeHtml(restoreMoney(seg));
        }
      }
      // Authored whitespace is preserved as-is, never rewritten into markup:
      // callers render this inside a pre-wrap block, so line breaks between
      // steps survive. KaTeX resets white-space internally, so math is safe.
      return escapeHtml(restoreMoney(seg));
    })
    .join('');
}
