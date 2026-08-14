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

export function renderMathHtml(text: string): string {
  const restore = (s: string) => s.replace(new RegExp(CURRENCY_SENTINEL, 'g'), () => 'EC$');
  return text
    .replace(/EC\$/g, CURRENCY_SENTINEL)
    .split(/(\$[^$]+\$)/g)
    .map((seg) => {
      if (seg.startsWith('$') && seg.endsWith('$') && seg.length > 2) {
        try {
          return katex.renderToString(restore(seg.slice(1, -1)), { throwOnError: false });
        } catch {
          return escapeHtml(restore(seg));
        }
      }
      // Real newlines become line breaks so worked solutions read as
      // steps/paragraphs, like board work.
      return escapeHtml(restore(seg)).replace(/\n/g, '<br />');
    })
    .join('');
}
