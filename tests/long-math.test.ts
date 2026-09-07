import { describe, expect, it } from 'vitest';
import { renderMathHtml } from '@/lib/katex';

// Long solutions wrap: a set breaks at its commas, each item typeset on its
// own; long inline math scrolls in its own box; short math is untouched and
// display math keeps its block.
describe('long math', () => {
  it('renders a sample space as wrapping items', () => {
    const html = renderMathHtml('$S=\\{(1,H),(1,T),(2,H),(2,T),(3,H),(3,T)\\}$');
    expect(html).toMatch(/^<span class="math-items">/);
    expect(html.match(/<span class="katex">/g)).toHaveLength(8);
    expect(html).toContain('</span>, <span class="katex">');
    expect(html).not.toContain('math-scroll');
  });
  it('keeps the commas inside an item together', () => {
    const html = renderMathHtml('$\\{(\\text{Mango},H),(\\text{Mango},T),(\\text{Coconut},H)\\}$');
    expect(html.match(/<span class="katex">/g)).toHaveLength(5);
    expect(html).toContain('Mango');
  });
  it('leaves a two-item set and a short expression alone', () => {
    expect(renderMathHtml('$\\{1,2\\}$')).not.toContain('math-items');
    expect(renderMathHtml('$x=3$')).not.toMatch(/math-items|math-scroll/);
  });
  it('scrolls a long chain of column vectors in its own box', () => {
    const chain = '$\\overrightarrow{AB}=\\overrightarrow{OB}-\\overrightarrow{OA}=\\begin{pmatrix}8\\\\5\\end{pmatrix}-\\begin{pmatrix}2\\\\-1\\end{pmatrix}=\\begin{pmatrix}6\\\\6\\end{pmatrix}$';
    expect(renderMathHtml(chain)).toMatch(/^<span class="math-scroll"><span class="katex">/);
  });
  it('keeps display math as its own scrolling block', () => {
    expect(renderMathHtml('\\[\\frac{489+24.5x}{22+x}=23.5\\]')).toContain('class="katex-display"');
  });
});
