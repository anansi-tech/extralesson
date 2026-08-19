import { describe, expect, it } from 'vitest';
import { normalizeEscapedNewlines } from '@/lib/text';
import { svgPlainLabel } from '@/lib/visuals/svg';
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
    // needs its authored gap to stay readable ("\\$140.  0.15 x 140 = 21").
    const html = renderMathHtml('costs \\$140.  $0.15 \\times 140 = 21$ follows.');
    expect(html).toContain('$140.  ');
  });
});

describe('renderMathHtml — money vs math delimiters', () => {
  it('renders escaped money literally, never as a math delimiter', () => {
    const html = renderMathHtml('The ticket costs \\$12.');
    // stored escaped, rendered bare — the segmenter never sees a naked $
    expect(html).toBe('The ticket costs $12.');
    expect(html).not.toContain('katex');
  });

  it('renders $...$ as math', () => {
    const html = renderMathHtml('$4(x+12)$');
    expect(html).toContain('katex');
    expect(html).not.toContain('$4');
  });

  it('mixed sentence: currency stays prose, math renders, no prose swallowed', () => {
    const html = renderMathHtml(
      'A covered-stand ticket costs \\$12 more than a grass-bank ticket at $x$ dollars, so four cost $4(x+12)$ — that is \\$104.',
    );
    // Currency literal on both sides of the math
    expect(html).toContain('$12 more than a grass-bank ticket');
    expect(html).toContain('that is $104.');
    // Two math segments rendered
    expect((html.match(/class="katex"/g) || []).length).toBe(2);
    // No sentinel characters leak
    expect(html).not.toContain('\u0001');
  });

  it('two amounts in one sentence do not pair into a math segment', () => {
    const html = renderMathHtml('Mangoes cost \\$5 and pineapples cost \\$8.');
    expect(html).toBe('Mangoes cost $5 and pineapples cost $8.');
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

  it('keeps money readable rather than typesetting it', () => {
    expect(renderAnswerHtml('\\$51')).toBe('$51');
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

  it('keeps the percent sign, which opens a comment in KaTeX input', () => {
    const html = renderAnswerHtml('12.5%');
    expect(html).toContain('katex-html');
    expect(html).toContain('%');
  });
});

// A misconception name read "Used the opposite direction ((6 -8))": the author
// wrapped a column vector in parentheses it already draws for itself. And the
// other inline delimiter, \( \), reached the student as raw source.
describe('renderMathHtml — matrix brackets and the other delimiter', () => {
  it('drops parentheses an author put around a column vector', () => {
    const html = renderMathHtml('Used the opposite direction ($\\begin{pmatrix}6\\\\-8\\end{pmatrix}$)');
    const text = html.replace(/<[^>]*>/g, '');
    expect(text).not.toContain('((');
    expect(text).not.toContain('))');
    expect(html).toContain('katex');
  });

  it('renders \\( ... \\) instead of printing it', () => {
    const html = renderMathHtml('The vector is \\(\\begin{pmatrix}6\\\\-8\\end{pmatrix}\\).');
    expect(html).toContain('katex');
    // KaTeX keeps the source in <annotation>, so check the delimiters are gone
    // rather than the source text.
    expect(html).not.toContain('\\(');
    expect(html).not.toContain('\\)');
  });

  it('leaves ordinary parentheses alone', () => {
    const html = renderMathHtml('The point $(2, 3)$ lies on the line (see the diagram).');
    const text = html.replace(/<[^>]*>/g, '');
    expect(text).toContain('(see the diagram)');
  });

  it('still keeps money out of the maths', () => {
    const html = renderMathHtml('The price is \\$120 and $x = 3$.');
    expect(html).toContain('$120');
  });
});

// Screenshot round two: a column vector written \(...\) reached the review card
// as raw source in the part answer, the final answer and a misconception name;
// and a coordinate pair wrapped in an author's parentheses read as ((7, 1)).
describe('renderAnswerHtml — the other delimiter, and brackets drawn twice', () => {
  it('renders a column vector written with \\( \\)', () => {
    const html = renderAnswerHtml('\\(\\begin{pmatrix}4\\\\3\\end{pmatrix}\\)');
    expect(html).toContain('katex');
    // KaTeX keeps the source in <annotation>; what must be gone is the
    // delimiter it cannot parse, and the escaped-text fallback.
    expect(html).not.toContain('\\(');
    expect(html).not.toContain('&#x5C;');
  });

  it('renders each value of a multi-value answer that way', () => {
    const html = renderAnswerHtml('\\(\\begin{pmatrix}4\\\\3\\end{pmatrix}\\); 36.9°; (11, 4)');
    expect(html).toContain('katex');
    expect(html).not.toContain('\\(');
    expect(html.replace(/<[^>]*>/g, '')).toContain('36.9');
  });

  it('drops parentheses an author put around a coordinate pair', () => {
    const text = renderMathHtml('Adds to the wrong point ($(7, 1)$)').replace(/<[^>]*>/g, '');
    expect(text).not.toContain('((');
    expect(text).not.toContain('))');
  });

  it('leaves a parenthetical aside alone', () => {
    const text = renderMathHtml('The point $(2, 3)$ lies on the line (see the diagram).').replace(/<[^>]*>/g, '');
    expect(text).toContain('(see the diagram)');
  });

  it('leaves parentheses that are doing real work', () => {
    const text = renderMathHtml('Solve $2x + 1 = 7$ (show your working).').replace(/<[^>]*>/g, '');
    expect(text).toContain('(show your working)');
  });

  it('still keeps EC$ and percentages intact', () => {
    expect(renderAnswerHtml('\\$70')).toContain('$70');
    expect(renderAnswerHtml('12.5%')).toContain('katex');
  });
});

// A worked solution set a frequency table as \[ \begin{array}...\end{array} \]
// and the whole block reached the student as raw source: we handled $ ... $ and
// \( ... \), never the display form.
describe('renderMathHtml — display math', () => {
  const solution = [
    'The frequencies are shown below.',
    '',
    '\\[',
    '\\begin{array}{c|ccccc}',
    '\\text{Number of containers} & 0 & 1 & 2 & 3 & 4 \\\\\\hline',
    '\\text{Frequency} & 4 & 8 & 10 & 5 & 3',
    '\\end{array}',
    '\\]',
    '',
    'The total is $4 + 8 + 10 + 5 + 3 = 30$ visitors.',
  ].join('\n');

  it('renders a display block in display mode', () => {
    const html = renderMathHtml(solution);
    expect(html).toContain('katex-display');
    expect(html).not.toContain('\\[');
    expect(html).not.toContain('\\]');
  });

  it('renders the array as a table rather than printing its source', () => {
    // KaTeX sets each word in its own span, so collapse the gaps tag-stripping
    // leaves behind before looking for the words.
    const visible = renderMathHtml(solution)
      .replace(/<annotation[^>]*>[\s\S]*?<\/annotation>/g, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ');
    expect(visible).toContain('Number of containers');
    expect(visible).not.toContain('\\begin{array}');
    expect(visible).not.toContain('\\hline');
  });

  it('still renders the inline math around it', () => {
    expect((renderMathHtml(solution).match(/class="katex/g) ?? []).length).toBeGreaterThan(1);
  });

  it('shows an invalid display block rather than swallowing it', () => {
    const html = renderMathHtml('Before \\[ \\begin{nonsense} \\] after');
    expect(html).toContain('Before');
    expect(html).toContain('after');
  });

  it('leaves everything already fixed alone', () => {
    expect(renderMathHtml('The price is \\$120 and $x = 3$.')).toContain('$120');
    expect(renderMathHtml('Adds to the wrong point ($(7, 1)$)').replace(/<[^>]*>/g, '')).not.toContain('((');
    expect(renderMathHtml('The vector is \\(\\begin{pmatrix}6\\\\-8\\end{pmatrix}\\).')).toContain('katex');
    // authored whitespace still survives for .question-prose
    expect(renderMathHtml('Step one.\n\nStep two.')).toContain('\n\n');
  });
});

// A part answer stored as "14 m by 6 m" was typeset as maths and rendered
// "14mby6m": the prose test allows any value whose longest word is under three
// letters, and "by" and "m" both are.
describe('renderAnswerHtml — quantities joined by a word are prose', () => {
  const visible = (v: string) =>
    renderAnswerHtml(v)
      .replace(/<annotation[^>]*>[\s\S]*?<\/annotation>/g, '')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  it('keeps the spaces in a dimensions answer', () => {
    expect(visible('14 m by 6 m')).toBe('14 m by 6 m');
    expect(renderAnswerHtml('14 m by 6 m')).not.toContain('katex');
  });

  it('handles the other connectors the same way', () => {
    for (const v of ['3 to 4', '1 and 2', '\\$24 per km']) {
      expect(visible(v)).toContain(v.replace('\\$24', '$24'));
    }
  });

  it('still typesets real mathematics, spaces and all', () => {
    for (const v of ['y = 2x + 5', '98.1 m^2', '4.5 \\times 10^{-5}', '\\frac{3}{8}', '12.5%', '-1/3']) {
      expect(renderAnswerHtml(v), v).toContain('katex');
    }
  });

  it('keeps a superscript a superscript', () => {
    // the case a blanket "unit words are prose" rule would have broken
    expect(renderAnswerHtml('98.1 m^2')).toContain('katex');
    expect(visible('98.1 m^2')).toContain('98.1');
  });

  it('renders each value of a multi-value answer on its own terms', () => {
    const html = renderAnswerHtml('14 m by 6 m; 98.1 m^2; 17');
    expect(html).toContain('14 m by 6 m'); // prose
    expect(html).toContain('katex'); // and maths beside it
  });
});

// A place-value question in base n asks for "the value of the UNDERLINED
// digit", so the underline carries the question. One authored form,
// \underline{}, has to survive every path a question is rendered through.
describe('an underlined digit survives every rendering path', () => {
  it('renders as a real underline in prose, where KaTeX runs', () => {
    const html = renderMathHtml('State the value of the underlined digit in $3\\underline{2}01_4$.');
    expect(html).toContain('accentunder');
  });

  it('becomes a combining low line in a figure label or table cell, not the word', () => {
    // svgPlainLabel strips backslashes, so an unhandled \underline{2} would
    // read "underline2" and silently lose the question.
    const out = svgPlainLabel('$3\\underline{2}01_4$');
    expect(out).not.toContain('underline');
    expect(out).toBe('32\u033201\u2084');
  });

  it('underlines every character of a multi-digit group', () => {
    expect(svgPlainLabel('$\\underline{35}$')).toBe('3̲5̲');
  });
});

// The August formatting audit.
describe('renderability — contracts the renderer imposes', () => {
  it('renders money inside maths, which used to be a KaTeX syntax error', () => {
    // restoreMoney put a BARE $ back inside the math body, and a bare $ in math
    // mode is "Can't use function '$'". Fourteen fields could never render.
    const html = renderMathHtml('CAO $\\begin{pmatrix}\\$1 860&\\$3 150\\end{pmatrix}$');
    expect(html).not.toContain('katex-error');
  });

  it('still shows prose money as a bare sign', () => {
    expect(renderMathHtml('It costs \\$45 today.')).toContain('$45');
  });
});

// renderAnswerHtml decides whether a value is maths or prose, and got two
// values wrong in ways that printed the source to the student.
describe('renderAnswerHtml — maths that looked like prose', () => {
  const typeset = (s: string) => renderAnswerHtml(s).includes('class="katex"');

  it('typesets an expression whose words are inside \\text{}', () => {
    // Stripping the command but keeping its contents left "grid units" and
    // "and" behind, and the value was judged prose.
    expect(typeset('10\\text{ grid units}')).toBe(true);
    expect(typeset('|v|=1\\text{ and }w=2v')).toBe(true);
  });

  it('typesets an expression that contains prices', () => {
    // "\\begin{pmatrix}\\$1&\\$2\\end{pmatrix}" contains $...$ as a substring —
    // the two escaped prices — so it read as already-delimited and went to the
    // prose renderer, which found no maths and printed the source.
    expect(typeset('\\begin{pmatrix}\\$1 860&\\$3 150\\end{pmatrix}')).toBe(true);
  });

  it('still leaves genuine prose alone', () => {
    expect(typeset('obtuse angle')).toBe(false);
    expect(typeset('14 m by 6 m')).toBe(false);
    expect(typeset('costs \\$45 each')).toBe(false);
    expect(typeset('Yes')).toBe(false);
  });
});
