import { describe, expect, it } from 'vitest';
import { inputAffordance } from '@/lib/grade/input-hints';

describe('inputAffordance — what is legal to type, where the typing happens', () => {
  it('offers the ASCII spelling of characters a keyboard hides', () => {
    expect(inputAffordance('$2\\sqrt{3}$', 'number').symbols).toContain('√');
    expect(inputAffordance('$2\\sqrt{3}$', 'number').hints[0]).toMatch(/sqrt\(2\)/);
    expect(inputAffordance('$x \\le 5$', 'inequality').symbols).toEqual(['≤', '≥']);
    expect(inputAffordance('$2\\pi r$', 'expression').symbols).toContain('π');
    expect(inputAffordance('$35^\\circ$', 'number').symbols).toContain('°');
  });

  it('says a unit may be left off, because the marker accepts that', () => {
    expect(inputAffordance('72 cm', 'quantity').hints.join(' ')).toMatch(/unit is optional/);
  });

  // The answer decides WHICH hint shows. It never supplies the numbers in one,
  // or the hint would print the answer under the box.
  it('never quotes the answer back at the student', () => {
    // The invariant is that the hint is the SAME constant whatever the answer
    // holds — two different fractions, one sentence. (Checking the text simply
    // avoids the answer's digits would be a weaker claim and a flakier test:
    // "0.75" contains a 5 by coincidence, not because 9/5 was read.)
    const a = inputAffordance('$\\frac{9}{5}$', 'number');
    const b = inputAffordance('$\\frac{2}{7}$', 'number');
    expect(a.hints).toEqual(b.hints);
    expect(a.hints.join(' ')).toMatch(/3\/4 or 0\.75/);
    expect(inputAffordance('$41^\\circ$', 'number').hints).toEqual(
      inputAffordance('$88^\\circ$', 'number').hints,
    );
  });

  it('stays quiet where nothing applies', () => {
    expect(inputAffordance('42', 'number')).toEqual({ hints: [], symbols: [] });
    expect(inputAffordance('corresponding angles', 'word')).toEqual({ hints: [], symbols: [] });
  });

  it('never grows into a help page', () => {
    const busy = inputAffordance('$\\frac{\\sqrt{2}\\pi}{2}^\\circ\\%$', 'quantity');
    expect(busy.hints.length).toBeLessThanOrEqual(2);
  });
});
