import { describe, expect, it } from 'vitest';
import { normalizeEscapedNewlines } from '@/lib/text';
import { renderAnswerHtml, renderMathHtml } from '@/lib/katex';

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
  // Whitespace is preserved verbatim, not rewritten into markup: callers
  // render inside `.question-prose` (white-space: pre-wrap).
  it('preserves newlines around KaTeX segments (snapshot)', () => {
    const fixture = normalizeEscapedNewlines(
      'Let $x$ be the cost of one mango.\\n\\nThen $3x + 2(x - 2) = 31$.\\nSo $5x = 35$, giving $x = 7$.',
    );
    const html = renderMathHtml(fixture);
    expect(html).toContain('\n\n');
    expect(html).not.toContain('<br />');
    expect(html).toMatchSnapshot();
  });

  it('escapes HTML in text segments and keeps newlines', () => {
    expect(renderMathHtml('a < b\nnext')).toBe('a &lt; b\nnext');
  });

  it('preserves the double space that separates two sentences', () => {
    // A sentence ending in a number followed by one starting with a decimal
    // needs its authored gap to stay readable ("EC$140.  0.15 x 140 = 21").
    const html = renderMathHtml('costs EC$140.  $0.15 \\times 140 = 21$ follows.');
    expect(html).toContain('EC$140.  ');
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

describe('renderAnswerHtml — values-only answers carry no $ delimiters', () => {
  it('typesets algebraic answers stored as bare source', () => {
    for (const v of ['P=M^2-2M', 'r=\\sqrt[3]{\\frac{3V}{4\\pi}}', '\\frac{500\\pi}{3}', '(M-5)(M+3)=0']) {
      // katex-html is the visually rendered tree; the raw source survives only
      // inside the MathML <annotation> element, which is intended.
      expect(renderAnswerHtml(v), v).toContain('katex-html');
    }
    expect(renderAnswerHtml('r=\\sqrt[3]{\\frac{3V}{4\\pi}}')).toContain('mroot');
    expect(renderAnswerHtml('\\frac{500\\pi}{3}')).toContain('mfrac');
    expect(renderAnswerHtml('P=M^2-2M')).toContain('msup');
  });

  it('leaves phrase answers as plain text', () => {
    for (const v of ['obtuse angle', 'No', '5 pieces', 'claim rejected']) {
      expect(renderAnswerHtml(v), v).not.toContain('katex');
      expect(renderAnswerHtml(v), v).toBe(v);
    }
  });

  it('keeps currency readable rather than typesetting it', () => {
    expect(renderAnswerHtml('EC$51')).toBe('EC$51');
  });

  it('renders each value of a multi-part answer', () => {
    const html = renderAnswerHtml('P=M^2-2M; (M-5)(M+3)=0; 5');
    expect((html.match(/class="katex"/g) || []).length).toBe(3);
    expect(html).toContain('; ');
  });

  it('falls back to verbatim text when the value is not valid math', () => {
    expect(renderAnswerHtml('3 + \\notacommand{')).toContain('notacommand');
  });

  it('escapes HTML in phrase answers', () => {
    expect(renderAnswerHtml('a < b')).toBe('a &lt; b');
  });

  it('typesets vectors and matrices', () => {
    // The environment name (pmatrix) used to read as a prose word, so these
    // were classified as text and displayed as raw source.
    const html = renderAnswerHtml('\\begin{pmatrix}-3\\\\4\\end{pmatrix}');
    expect(html).toContain('katex-html');
    expect(html).toContain('mtable');
  });

  it('keeps the percent sign, which opens a comment in LaTeX', () => {
    const html = renderAnswerHtml('12.5%');
    expect(html).toContain('katex-html');
    expect(html).toContain('%');
  });
});
