import { describe, expect, it } from 'vitest';
import { composite, equivalent, factorisation, inverse, satisfiesEquation, toExpr } from '@/lib/grade/symbolic';
import { checkQuestion, functionDefs } from '@/lib/grade/checkable';

// A composite-function question reached review with fg(x) computed as gf(x),
// and BOTH model passes agreed with it — the solve pass is independent in
// prompt only, so a systematic bias survives asking twice. These are the checks
// that do not need a second opinion.

describe('equivalent — numeric sampling, not simplify().equals()', () => {
  it('sees through the shape an expression is written in', () => {
    // mathjs simplify().equals() returns FALSE for this pair, which is why
    // equality is decided by evaluation instead.
    expect(equivalent('2*(x-3)+1', '2x-5')).toMatchObject({ checked: true, ok: true });
    expect(equivalent('(x+1)(x-1)', 'x^2-1')).toMatchObject({ checked: true, ok: true });
  });

  it('separates expressions that merely look similar', () => {
    expect(equivalent('2x+1', '2x+3')).toMatchObject({ checked: true, ok: false });
  });

  it('abstains rather than guessing when it cannot read the input', () => {
    expect(equivalent('the total cost', 'x')).toMatchObject({ checked: false });
  });
});

describe('composite — the failure that got through', () => {
  const f = '2x+1';
  const g = 'x-3';

  it('knows fg(x) means f(g(x)), applying g first', () => {
    expect(composite(f, g, 'fg', '2x-5')).toMatchObject({ checked: true, ok: true });
    expect(composite(f, g, 'gf', '2x-2')).toMatchObject({ checked: true, ok: true });
  });

  it('rejects fg answered as gf, which is the reported defect', () => {
    expect(composite(f, g, 'fg', '2x-2')).toMatchObject({ checked: true, ok: false });
  });
});

describe('inverse, factorisation, roots', () => {
  it('verifies an inverse by composing back to x', () => {
    expect(inverse('2x+1', '(x-1)/2')).toMatchObject({ checked: true, ok: true });
    expect(inverse('2x+1', '(x+1)/2')).toMatchObject({ checked: true, ok: false });
  });

  it('verifies a factorisation by multiplying it back out', () => {
    expect(factorisation('x^2-9', '(x-3)(x+3)')).toMatchObject({ checked: true, ok: true });
    expect(factorisation('x^2-9', '(x-3)(x-3)')).toMatchObject({ checked: true, ok: false });
  });

  it('verifies a root by substituting it', () => {
    expect(satisfiesEquation('x^2-5x+6=0', 'x', '2')).toMatchObject({ checked: true, ok: true });
    expect(satisfiesEquation('x^2-5x+6=0', 'x', '4')).toMatchObject({ checked: true, ok: false });
  });
});

describe('toExpr — the papers write KaTeX source, mathjs reads arithmetic', () => {
  it('reads implicit multiplication and fractions', () => {
    expect(toExpr('2x+1')).toBe('2*x+1');
    expect(toExpr('\\frac{x-1}{2}')).toBe('((x-1)/(2))');
  });
});

describe('functionDefs — extraction, and what it must not get wrong', () => {
  it('reads both notations the papers use', () => {
    expect([...functionDefs('$f: x \\to 2x+1$ and $g(x) = x-3$')]).toEqual([
      ['f', '2x+1'],
      ['g', 'x-3'],
    ]);
  });

  it('keeps a decimal in a definition', () => {
    // "g: x \to 0.9x" was read as "g = 0" because the capture stopped at the
    // period, and a correct question was reported as failing.
    expect(functionDefs('$g: x \\to 0.9x$').get('g')).toBe('0.9x');
  });
});

describe('checkQuestion — abstains where the demand is not function-valued', () => {
  const stem = 'The functions are $f: x \\to 2x+1$ and $g: x \\to x^2+1$.';

  it('checks a composition asked for as a function', () => {
    const t = checkQuestion({ stem, parts: [{ label: 'a', prompt: 'Determine $fg(x)$.', slots: [{ label: 'i', answer: '2x^2+3' }] }] });
    expect(t[0]).toMatchObject({ family: 'composite fg' });
    expect(t[0].verdict).toMatchObject({ checked: true, ok: true });
  });

  it('does NOT treat an evaluation as a function', () => {
    // "Calculate f^{-1}g(2)" asks for a number; comparing 2 against the inverse
    // FUNCTION reported a failure that belonged to the checker.
    const t = checkQuestion({ stem, parts: [{ label: 'c', prompt: 'Calculate $f^{-1}g(2)$.', slots: [{ label: 'i', answer: '2' }] }] });
    expect(t).toEqual([]);
  });
});
