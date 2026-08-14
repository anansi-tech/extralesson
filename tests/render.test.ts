import { describe, expect, it } from 'vitest';
import { normalizeEscapedNewlines } from '@/lib/text';
import { renderMathHtml } from '@/lib/katex';

describe('normalizeEscapedNewlines', () => {
  it('converts literal \\n sequences to real newlines', () => {
    expect(normalizeEscapedNewlines('Step 1.\\n\\nStep 2.')).toBe('Step 1.\n\nStep 2.');
    expect(normalizeEscapedNewlines('so\\n$3x = 9$\\nThus $x = 3$.')).toBe(
      'so\n$3x = 9$\nThus $x = 3$.',
    );
  });

  it('never touches KaTeX commands that start with \\n', () => {
    expect(normalizeEscapedNewlines('$a \\neq b$')).toBe('$a \\neq b$');
    expect(normalizeEscapedNewlines('$x \\notin A$ and $\\nu > 0$')).toBe(
      '$x \\notin A$ and $\\nu > 0$',
    );
  });

  it('leaves already-clean strings unchanged (idempotent)', () => {
    const clean = 'Line one.\n\nLine two with $\\frac{1}{2}$.';
    expect(normalizeEscapedNewlines(clean)).toBe(clean);
    expect(normalizeEscapedNewlines(normalizeEscapedNewlines('A\\n\\nB'))).toBe('A\n\nB');
  });
});

describe('renderMathHtml — multi-line worked solution', () => {
  it('renders newlines as line breaks around KaTeX segments (snapshot)', () => {
    const fixture = normalizeEscapedNewlines(
      'Let $x$ be the cost of one mango.\\n\\nThen $3x + 2(x - 2) = 31$.\\nSo $5x = 35$, giving $x = 7$.',
    );
    const html = renderMathHtml(fixture);
    expect(html).toContain('<br />');
    expect(html).toMatchSnapshot();
  });

  it('escapes HTML in text segments and keeps breaks', () => {
    expect(renderMathHtml('a < b\nnext')).toBe('a &lt; b<br />next');
  });
});
