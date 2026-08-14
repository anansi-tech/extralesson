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

describe('renderMathHtml — currency vs math delimiters', () => {
  it('renders EC$ currency literally, never as a math delimiter', () => {
    const html = renderMathHtml('The ticket costs EC$12.');
    expect(html).toBe('The ticket costs EC$12.');
    expect(html).not.toContain('katex');
  });

  it('renders $...$ as math', () => {
    const html = renderMathHtml('$4(x+12)$');
    expect(html).toContain('katex');
    expect(html).not.toContain('$4');
  });

  it('mixed sentence: currency stays prose, math renders, no prose swallowed', () => {
    const html = renderMathHtml(
      'A covered-stand ticket costs EC$12 more than a grass-bank ticket at $x$ dollars, so four cost $4(x+12)$ — that is EC$104.',
    );
    // Currency literal on both sides of the math
    expect(html).toContain('EC$12 more than a grass-bank ticket');
    expect(html).toContain('that is EC$104.');
    // Two math segments rendered
    expect((html.match(/class="katex"/g) || []).length).toBe(2);
    // No sentinel characters leak
    expect(html).not.toContain('\u0001');
  });

  it('two EC$ amounts in one sentence do not pair into a math segment', () => {
    const html = renderMathHtml('Mangoes cost EC$5 and pineapples cost EC$8.');
    expect(html).toBe('Mangoes cost EC$5 and pineapples cost EC$8.');
  });
});
