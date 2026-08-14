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

export function renderMathHtml(text: string): string {
  return text
    .split(/(\$[^$]+\$)/g)
    .map((seg) => {
      if (seg.startsWith('$') && seg.endsWith('$') && seg.length > 2) {
        try {
          return katex.renderToString(seg.slice(1, -1), { throwOnError: false });
        } catch {
          return escapeHtml(seg);
        }
      }
      return escapeHtml(seg);
    })
    .join('');
}
