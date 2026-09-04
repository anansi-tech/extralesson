import { describe, expect, it } from 'vitest';
import { answersEquivalent, answersEquivalentAny, parseNumeric } from '@/lib/grade/equivalence';

describe('parseNumeric', () => {
  it('parses plain numbers, negatives, decimals', () => {
    expect(parseNumeric('42')).toBe(42);
    expect(parseNumeric('-3.5')).toBe(-3.5);
    expect(parseNumeric(' 7 ')).toBe(7);
  });

  it('parses fractions, mixed numbers, percents, currency', () => {
    expect(parseNumeric('-1/3')).toBeCloseTo(-1 / 3);
    expect(parseNumeric('1 1/2')).toBe(1.5);
    expect(parseNumeric('50%')).toBe(0.5);
    expect(parseNumeric('$1,200')).toBe(1200);
    expect(parseNumeric('\\frac{1}{4}')).toBe(0.25);
  });

  it('strips "x =" prefixes when the value is numeric', () => {
    expect(parseNumeric('x = 2')).toBe(2);
    expect(parseNumeric('EC$70')).toBe(70);
  });

  it('returns null for non-numeric input', () => {
    expect(parseNumeric('no solution')).toBeNull();
    expect(parseNumeric('2x + 1')).toBeNull();
    expect(parseNumeric('')).toBeNull();
  });

  it('parses a number followed by a unit or noun', () => {
    expect(parseNumeric('72 cm')).toBe(72);
    expect(parseNumeric('5 pieces')).toBe(5);
    expect(parseNumeric('500 ml')).toBe(500);
    expect(parseNumeric('1 1/2 hours')).toBe(1.5);
    expect(parseNumeric('2x')).toBeNull(); // algebra, not a unit
  });
});

describe('answersEquivalent', () => {
  it('matches numerically equivalent forms', () => {
    expect(answersEquivalent('0.5', '1/2')).toBe(true);
    expect(answersEquivalent('-1/3', '-0.333', { kind: 'dp', n: 3 })).toBe(true);
    expect(answersEquivalent('-1/3', '-0.333')).toBe(false); // nothing asked for 3 d.p.
    expect(answersEquivalent('$25', '25')).toBe(true);
  });

  it('rejects different values', () => {
    expect(answersEquivalent('1/3', '-1/3')).toBe(false);
    expect(answersEquivalent('2', '3')).toBe(false);
  });

  it('compares non-numeric answers as normalized strings', () => {
    expect(answersEquivalent('x = 2', 'X = 2')).toBe(true);
    expect(answersEquivalent('$x=2$', 'x=2')).toBe(true);
    expect(answersEquivalent('x = 2', 'x = 3')).toBe(false);
  });

  it('strips "x =" style prefixes and part labels', () => {
    expect(answersEquivalent('x = 5', '5')).toBe(true);
    expect(answersEquivalent('(a) 5', '5')).toBe(true);
    expect(answersEquivalent('cost of one pineapple: $8', '8')).toBe(true);
  });

  it('matches multi-root answers as unordered sets', () => {
    expect(answersEquivalent('x = -1/3 or x = 2', '2, -1/3')).toBe(true);
    expect(answersEquivalent('x = 2 or x = 3', 'x = 3 or x = 2')).toBe(true);
    expect(answersEquivalent('x = -1/3; x = 2', 'x = 2 or x = -0.333', { kind: 'dp', n: 3 })).toBe(true);
    expect(answersEquivalent('x = 2 or x = 3', 'x = 2')).toBe(false);
    expect(answersEquivalent('x = 2 or x = 3', 'x = 2 or x = 4')).toBe(false);
  });

  it('matches multi-part money answers with naming prefixes and currency', () => {
    expect(answersEquivalent('Plantain: EC$10; dasheen: EC$16', '$10; $16')).toBe(true);
    expect(
      answersEquivalent('One crate of oranges costs = EC$70; limes = EC$58', '70; 58'),
    ).toBe(true);
    expect(answersEquivalent('EC$10; EC$16', 'EC$10; EC$17')).toBe(false);
  });

  it('treats equivalent fractions/decimals and KaTeX forms as equal', () => {
    expect(answersEquivalent('\\frac{1}{2}', '0.5')).toBe(true);
    expect(answersEquivalent('x = -\\frac{1}{3}', '-1/3')).toBe(true);
    expect(answersEquivalent('1 1/2', '1.5')).toBe(true);
  });

  it('uses mathjs canonical comparison for surds and algebraic forms', () => {
    expect(answersEquivalent('2*sqrt(2)', '2.8284', { kind: 'dp', n: 4 })).toBe(true);
    expect(answersEquivalent('2*sqrt(2)', '2.8284')).toBe(false); // a surd is exact
    expect(answersEquivalent('\\sqrt{9}', '3')).toBe(true);
    expect(answersEquivalent('2x - 4', '2(x - 2)')).toBe(true);
    expect(answersEquivalent('2x - 4', '2x + 4')).toBe(false);
  });
});

describe('answersEquivalent — unit-word tails (pilot regression)', () => {
  it('treats "5 pieces" and "5" as equivalent per part', () => {
    expect(answersEquivalent('5 pieces', '5')).toBe(true);
    expect(answersEquivalent('72 cm', '72')).toBe(true);
    expect(answersEquivalent('3 lengths', '3')).toBe(true);
    expect(answersEquivalent('9 edges', '9')).toBe(true);
    expect(answersEquivalent('5 pieces', '6')).toBe(false);
  });
});

describe('answersEquivalent — word answers (pilot regression)', () => {
  it('matches word answers that differ only in case or a generic noun', () => {
    expect(answersEquivalent('obtuse angle', 'Obtuse angle')).toBe(true);
    expect(answersEquivalent('corresponding angles', 'Corresponding angles')).toBe(true);
    expect(answersEquivalent('alternate interior angles', 'Alternate interior angles')).toBe(true);
    expect(answersEquivalent('obtuse', 'obtuse angle')).toBe(true);
    expect(answersEquivalent('105°, obtuse', '105°; obtuse angle')).toBe(true);
  });

  it('still rejects genuinely different classifications', () => {
    expect(answersEquivalent('acute angle', 'Exterior angle')).toBe(false);
    expect(answersEquivalent('corresponding angles', 'alternate angles')).toBe(false);
    expect(answersEquivalent('obtuse angle', '68°')).toBe(false);
  });

  it('accepts reworded sentence-length justifications, not different claims', () => {
    expect(
      answersEquivalent(
        'grouped data uses class midpoints, not actual values',
        'class midpoints are used instead of the actual data values',
      ),
    ).toBe(true);
    expect(
      answersEquivalent(
        'the sample was too small to be representative',
        'the questionnaire used leading questions',
      ),
    ).toBe(false);
  });

  it('prose comparison never hijacks algebraic comparison', () => {
    expect(answersEquivalent('2x - 4', '2(x - 2)')).toBe(true);
    expect(answersEquivalent('2x - 4', '2x + 4')).toBe(false);
  });
});

describe('answersEquivalent — pilot round 2 regressions', () => {
  it('normalizes KaTeX degree notation', () => {
    expect(parseNumeric('$67^\\circ$')).toBe(67);
    expect(answersEquivalent('$67^\\circ$', '67°')).toBe(true);
    expect(answersEquivalent('$113^{\\circ}$', '113°')).toBe(true);
    expect(answersEquivalent('$67^\\circ$', '113°')).toBe(false);
  });

  it('accepts a qualifier one side omits, not a different answer', () => {
    expect(answersEquivalent('hexagon', 'Regular hexagon')).toBe(true);
    expect(answersEquivalent('$AB=AC$', 'AB = AC')).toBe(true);
    expect(answersEquivalent('hexagon', 'Regular pentagon')).toBe(false);
    expect(answersEquivalent('acute', 'interior angle')).toBe(false);
  });
});

describe('answersEquivalentAny — mark-scheme accept lists', () => {
  it('matches the canonical answer or any accepted alternative', () => {
    expect(answersEquivalentAny('edge', 'edge', ['line segment'])).toBe(true);
    expect(answersEquivalentAny('line segment', 'edge', ['line segment'])).toBe(true);
    expect(answersEquivalentAny('Line segment', 'edge', ['line segment'])).toBe(true);
    expect(answersEquivalentAny('vertex', 'edge', ['line segment'])).toBe(false);
    expect(answersEquivalentAny('edge', 'edge')).toBe(true);
  });
});

describe('answersEquivalent — unicode superscripts (pilot round 3)', () => {
  it('treats ² and ^2 as the same exponent', () => {
    expect(answersEquivalent('P=M^2-2M', 'P = M² - 2M')).toBe(true);
    expect(answersEquivalent('x²+3x', 'x^2 + 3x')).toBe(true);
    expect(answersEquivalent('P=M^2-2M', 'P = M² + 2M')).toBe(false);
  });
});

describe('answersEquivalent — label stripping only strips actual labels', () => {
  it('keeps the value when the left side is an expression, not a label', () => {
    // The solver restated a vector as "matrix = -PR"; the matrix is the answer.
    const canonical = '$\\begin{pmatrix}-6\\\\0\\end{pmatrix}$';
    const candidate = '\\(\\begin{pmatrix}-6\\\\0\\end{pmatrix}=-\\overrightarrow{PR}\\)';
    expect(answersEquivalent(candidate, canonical)).toBe(true);
  });

  it('still strips genuine name prefixes', () => {
    expect(answersEquivalent('C=3n+2', '3n + 2')).toBe(true);
    expect(answersEquivalent('P = M(M - 2)', 'M(M-2)')).toBe(true);
    expect(answersEquivalent('cost of one pineapple: 8', '8')).toBe(true);
    expect(answersEquivalent('x = -1/3', '-1/3')).toBe(true);
  });

  it('compares two forms of one equation by their difference', () => {
    expect(answersEquivalent('3s = 2s + 500', '3s = 2(s + 250)')).toBe(true);
    expect(answersEquivalent('3s = 2s + 400', '3s = 2(s + 250)')).toBe(false);
  });
});

// Regression: the M2-RFG1 batch rejected seven straight drafts whose answers
// were right, because a function's answer IS notation and one object has many
// correct renderings. Pairs below are taken from that run's own pair logging.
describe('answersEquivalent — function notation is not a difference', () => {
  const same: [string, string][] = [
    ['f^{-1}:x\\to \\frac{x-1}{2}', 'x ↦ (x - 1)/2'],
    ['\\frac{x-1}{2}', 'f^{-1}(x)=\\frac{x-1}{2}'],
    ['2x^2+1', 'fg(x)=2x^2+1'],
    ['x', 'ff^{-1}(x)=x'],
    ['gf(4)=6, fg(4)=3', '6; 3'],
    ['(2x+1)^2', 'gf(x)=4x^2+4x+1'],
    ['$f^{-1}:x\\to\\frac{x-1}{2}$; $ff^{-1}(x)=x$; $f^{-1}f(x)=x$', 'f⁻¹: x → (x - 1)/2; x; x'],
    ['fg\\ne gf', 'fg ≠ gf'],
    ['$\\dfrac{x-1}{2}$', '(x - 1)/2'],
    ['\\tfrac{3}{4}', '0.75'],
  ];
  for (const [a, b] of same) {
    it(`accepts ${a} = ${b}`, () => {
      expect(answersEquivalent(a, b)).toBe(true);
      expect(answersEquivalent(b, a)).toBe(true);
    });
  }

  it('still rejects a genuinely different function', () => {
    expect(answersEquivalent('f^{-1}(x)=\\frac{x-1}{2}', 'x ↦ (x + 1)/2')).toBe(false);
    expect(answersEquivalent('fg(x)=2x^2+1', 'fg(x)=2x^2-1')).toBe(false);
    expect(answersEquivalent('gf(4)=6', '6.5')).toBe(false);
  });

  it('does not mistake an equation for a labelled value', () => {
    // "3s = 2(s+250)" has no label to strip: the equation is the answer.
    expect(answersEquivalent('3s = 2(s + 250)', '3s = 2s + 500')).toBe(true);
    expect(answersEquivalent('3s = 2(s + 250)', '2s + 500')).toBe(false);
  });
});

// The --poison hook appends " + 999" to the last part's answer, and the gate
// must always catch it. It once did not: the draft answer was a chain of
// definitions the label-stripper could not parse, so the comparison fell
// through to prose matching, where the solver's shorter answer looked like a
// subset of the poisoned one. Both halves of that are pinned here.
describe('answersEquivalent — appended garbage is never a qualifier', () => {
  it('catches the poison on a chained-definition answer', () => {
    expect(answersEquivalent('f^{-1}(f(x))=f(f^{-1}(x))=x + 999', 'x')).toBe(false);
    expect(answersEquivalent('f^{-1}(f(x))=f(f^{-1}(x))=x', 'x')).toBe(true);
  });

  it('catches the poison on a word answer', () => {
    expect(answersEquivalent('reflection in the line y = x + 999', 'reflection in the line y = x')).toBe(false);
    expect(answersEquivalent('40° + 999', '40°')).toBe(false);
    expect(answersEquivalent('grouped data uses class midpoints + 999', 'grouped data uses class midpoints')).toBe(false);
  });

  it('keeps accepting a qualifier that carries no value', () => {
    expect(answersEquivalent('regular hexagon', 'hexagon')).toBe(true);
    expect(answersEquivalent('obtuse angle', 'obtuse')).toBe(true);
  });

  it('treats two prose answers quoting different numbers as different', () => {
    expect(answersEquivalent('the 5th term is largest', 'the 6th term is largest')).toBe(false);
  });
});

// Standard form is written with \times and a braced exponent, and R1.7 §B4
// marks the value separately from the form — so the value comparison has to
// survive the notation before the form can be judged at all.
describe('answersEquivalent — standard form', () => {
  it('reads a standard-form answer as the number it is', () => {
    expect(answersEquivalent('4.5 \\times 10^{-5}', '0.000045')).toBe(true);
    expect(answersEquivalent('3.2 \\times 10^{4}', '32000')).toBe(true);
    expect(answersEquivalent('6 \\cdot 10^{2}', '600')).toBe(true);
  });

  it('still separates two different numbers written the same way', () => {
    expect(answersEquivalent('4.5 \\times 10^{-5}', '5.4 \\times 10^{-5}')).toBe(false);
    expect(answersEquivalent('4.5 \\times 10^{-5}', '4.5 \\times 10^{5}')).toBe(false);
  });
});

// GRADER v4. All three found in stored attempts from one evening's studying,
// not imagined, and all three the same defect in different clothes: the marker
// judging how an answer was TYPED rather than what it says.
describe('answersEquivalent — v4: an expression is equivalent to itself', () => {
  // rationalize() answers a question about strings. With decimal coefficients
  // it leaves float residue (2.2e-16) that is not the string '0', so this
  // reported an expression as not equivalent to ITSELF, and a real attempt
  // lost the mark for writing the accepted alternative exactly as listed.
  it('matches an expression against a character-identical copy', () => {
    expect(answersEquivalent('1.6+0.2(n-1)', '1.6+0.2(n-1)')).toBe(true);
    expect(answersEquivalent('0.35x+2.15', '0.35x+2.15')).toBe(true);
  });

  it('matches two forms of the same sequence rule', () => {
    expect(answersEquivalentAny('T_n=1.6+0.2(n-1)', '$T_n=0.2n+1.4$')).toBe(true);
    expect(answersEquivalent('1.6+0.2(n-1)', '0.2n+1.4')).toBe(true);
    expect(answersEquivalent('2(x-2)', '2x-4')).toBe(true);
  });

  it('still separates expressions that differ, including by a decimal', () => {
    expect(answersEquivalent('0.2n+1.5', '0.2n+1.4')).toBe(false);
    expect(answersEquivalent('2x+3', '3x+2')).toBe(false);
    // Distinct variables get distinct sample values, or these would agree.
    expect(answersEquivalent('x+y', '2x')).toBe(false);
  });
});

describe('answersEquivalent — v4: x is the multiplication sign a phone has', () => {
  it('reads x as times between arithmetic pieces', () => {
    expect(answersEquivalent('2^3 x 3', '$2^3 \\times 3$')).toBe(true);
    expect(answersEquivalent('2^2 X 3^2', '$2^2 \\times 3^2$')).toBe(true);
  });

  it('leaves x alone wherever it is algebra', () => {
    expect(answersEquivalent('2x + 5', '2x + 5')).toBe(true);
    expect(answersEquivalent('2 x 3 grid', '6')).toBe(false);
    expect(answersEquivalent('x + 1', '2')).toBe(false);
  });
});

describe('answersEquivalent — v4: a comma needs no space after it', () => {
  it('splits a list typed without the spacebar', () => {
    expect(answersEquivalent('18kg,27kg,36kg', '18 kg, 27 kg, 36 kg')).toBe(true);
    expect(answersEquivalent('1.6,9/5,2.0,11/5', '$1.6, \\frac{9}{5}, 2.0, \\frac{11}{5}$')).toBe(
      true,
    );
  });

  it('still keeps a wrong list wrong', () => {
    expect(answersEquivalent('18kg,27kg,35kg', '18 kg, 27 kg, 36 kg')).toBe(false);
  });
});

describe('answersEquivalent — v4: characters the student cannot see', () => {
  // A stored attempt carried a trailing U+200B and was marked wrong for it.
  it('ignores zero-width characters and non-breaking spaces', () => {
    expect(answersEquivalent('1.6,(9/5),2.0,(11/5)​', '$1.6, \\frac{9}{5}, 2.0, \\frac{11}{5}$')).toBe(true);
    expect(answersEquivalent('​42​', '42')).toBe(true);
    expect(answersEquivalent('72 cm', '72 cm')).toBe(true);
  });
});

// THE KaTeX PERCENT ESCAPE CARRIES NO EXTRA MEANING.
//
// Answers are authored in KaTeX, where a literal percent sign is written \%.
// The normaliser removed \text{}, \left, \right and the rest but not this one,
// so a slot storing "$10\%$" rejected "10" and "10%" — the only two things a
// student types — while accepting 0.1, because the escape was read as a value
// on one side of the comparison and not the other. Found end to end: an
// all-correct run on a live question scored 3 of 8.
describe('\\% is the same sign as %', () => {
  const cases: [string, string][] = [
    ['$10\\%$', '10'],
    ['$10\\%$', '10%'],
    ['$12.5\\%$', '12.5'],
    ['$12.5\\%$', '12.5%'],
    ['20.2\\%', '20.2%'],
    ['$37.5\\%$', '37.5'],
  ];
  for (const [stored, typed] of cases) {
    it(`accepts ${typed} for ${stored}`, () => {
      expect(answersEquivalent(stored, typed)).toBe(true);
    });
  }

  it('still refuses a different quantity', () => {
    expect(answersEquivalent('$10\\%$', '0.1%')).toBe(false);
    expect(answersEquivalent('$10\\%$', '11%')).toBe(false);
  });

  it('accepts the answer with the percent sign left off, as every other unit is', () => {
    // quantity.ts made this decision deliberately: an omitted unit the question
    // itself supplied is not a wrong answer, and percent was the one place we
    // used to refuse it.
    expect(answersEquivalent('$10\\%$', '10')).toBe(true);
  });
});
