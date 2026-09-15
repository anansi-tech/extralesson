import { describe, expect, it } from 'vitest';
import { answersEquivalent, answersEquivalentAny, canEvaluate, isProse, looksMathematical, parseNumeric, splitAdjacentSymbols } from '@/lib/grade/equivalence';
import { readInputShape } from '@/lib/grade/input-shape';

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
    expect(answersEquivalent('-1/3', '-0.333')).toBe(true); // a third cannot terminate: 3 s.f. by default
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
    expect(answersEquivalent('x = -1/3; x = 2', 'x = 2 or x = -0.333')).toBe(true);
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
    expect(answersEquivalent('2*sqrt(2)', '2.8284')).toBe(true);
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

// THE FOUR GAPS THE R13 AGREEMENT SWEEP FOUND, each a comparison the marker
// could not see through. Every case below came off a slot in the bank.
describe('a thin space is a space', () => {
  it('groups digits written with \\ , \\, or \;', () => {
    for (const written of ['18\\ 000', '18\\,000', '18\\;000', '18 000', '18,000']) {
      expect(answersEquivalent(written, '18000'), written).toBe(true);
    }
    expect(answersEquivalent('$3\\ 080\\text{ L}$', '3080 L')).toBe(true);
  });

  it('leaves a matrix row separator alone', () => {
    expect(answersEquivalent('\\begin{pmatrix}40 \\\\ 50\\end{pmatrix}', '\\begin{pmatrix}40\\\\50\\end{pmatrix}')).toBe(true);
  });
});

describe('one equation is another scaled', () => {
  // The same equation rearranged, re-scaled, factorised or written the other
  // way round is the same equation: its difference is a multiple of the other's.
  const same: [string, string][] = [
    ['y = x', 'x = y'],
    ['6m + 24 = 90', '6m = 66'],
    ['0.75p = 360', '75p = 36000'],
    ['P = M^2 - 2M', 'P = M(M-2)'],
    ['2x + 4 = 10', 'x + 2 = 5'],
  ];
  for (const [a, b] of same) {
    it(`${a} is ${b}`, () => expect(answersEquivalent(a, b)).toBe(true));
  }

  it('and a different equation is still different', () => {
    expect(answersEquivalent('6m = 66', '6m = 67')).toBe(false);
    expect(answersEquivalent('y = 2x', 'y = 3x')).toBe(false);
    expect(answersEquivalent('h = d', 'h = 2d')).toBe(false);
    expect(answersEquivalent('x = 5', 'x = 6')).toBe(false);
  });
});

describe('adjacent letters are a product', () => {
  it('reads gT^2 as g times T squared, in either order', () => {
    expect(answersEquivalent('l=\\frac{gT^2}{4\\pi^2}', 'l=\\frac{T^2g}{4\\pi^2}')).toBe(true);
  });

  it('leaves a known name alone: a function, a constant, a unit, an ordinal', () => {
    expect(answersEquivalent('sin(30)', 'sin(30)')).toBe(true);
    expect(answersEquivalent('24 km/h', '24 km/h')).toBe(true);
    expect(answersEquivalent('24 km/h', '24 m/h')).toBe(false);
    expect(answersEquivalent('16th', '16th')).toBe(true);
    expect(answersEquivalent('5\\pi', '15.70796')).toBe(true);
  });

  it('leaves prose and a set of words alone', () => {
    // Split letter by letter these would read as algebra and reach mathjs,
    // which is the thing the prose guard exists to prevent.
    expect(answersEquivalent('{red, blue, green}', '{red, blue, green}')).toBe(true);
    expect(answersEquivalent('{red, blue, green}', '{red, blue, yellow}')).toBe(false);
    expect(answersEquivalent('the x-intercept is 4', 'the x-intercept is 4')).toBe(true);
    expect(answersEquivalent('obtuse angle', 'acute angle')).toBe(false);
  });

  it('a longer run in front of a bracket is a name, so gf keeps its order', () => {
    // gf is f then g, and a product would throw the order away. One letter in
    // front of a bracket stays a product, which is what P = M(M-2) needs.
    expect(splitAdjacentSymbols('gf(t)')).toBe('gf(t)');
    expect(splitAdjacentSymbols('M(M-2)')).toBe('M*(M-2)');
  });
});

describe('punctuation is not a difference', () => {
  it('a full stop ends a sentence and not a value', () => {
    expect(answersEquivalent('No.', 'No')).toBe(true);
    expect(answersEquivalent('No.', 'Yes')).toBe(false);
    expect(answersEquivalent('4.5', '4.5')).toBe(true);
  });

  it('a point named before its coordinates is that point', () => {
    expect(answersEquivalent('O(0,0)', '(0,0)')).toBe(true);
    expect(answersEquivalent('P(3,-2)', '(3, -2)')).toBe(true);
    expect(answersEquivalent('O(0,0)', '(1,0)')).toBe(false);
  });
});

// Found on a generated draft: a slot whose canonical was "$y=80x+120$" listed
// "$y-120=80x$" — the same line rearranged — and disagreed with itself.
describe('a bare letter facing other variables is a variable', () => {
  it('keeps an equation an equation, so the rearranged form compares equal', () => {
    expect(answersEquivalent('$y=80x+120$', '$y-120=80x$')).toBe(true);
    expect(answersEquivalent('y = 80x + 120', '80x + 120 = y')).toBe(true);
  });

  it('and a different equation is still different', () => {
    expect(answersEquivalent('y = 80x + 120', 'y = 80x + 130')).toBe(false);
    expect(answersEquivalent('y = 2x', 'y = 3x')).toBe(false);
  });

  it('but a NAME is still a name the student may leave off', () => {
    // The other half of the rule: stripping less must not refuse the student
    // who answers "5x" where the scheme wrote "A = 5x".
    expect(answersEquivalent('A = 5x', '5x')).toBe(true);
    expect(answersEquivalent('C = 25n', '25n')).toBe(true);
    expect(answersEquivalent('P = 2l + 2w', '2l + 2w')).toBe(true);
    expect(answersEquivalent('A = 5x', '6x')).toBe(false);
  });

  it('leaves a plain labelled value alone, whose right side names nothing', () => {
    expect(answersEquivalent('x = 5', '5')).toBe(true);
    expect(answersEquivalent('P = 30', '30')).toBe(true);
    expect(answersEquivalent('x = 5', 'x = 6')).toBe(false);
  });

  it('and a relation between two unknowns still reads both ways round', () => {
    expect(answersEquivalent('h = d', 'd = h')).toBe(true);
    expect(answersEquivalent('y = x', 'x = y')).toBe(true);
    expect(answersEquivalent('f(x) = x^2', 'x^2')).toBe(true);
  });
});

/**
 * AN NTH ROOT IS A VALUE, NOT A WORD. `\sqrt[3]{X}` reached the parser
 * unexpanded, so 9e8767's canonical did not equal its own accept list and a
 * student writing ∛(3V/(4π)) was refused a correct answer.
 */
describe('cube roots and the forms a student writes them in', () => {
  const CANON = '$\\sqrt[3]{\\frac{3V}{4\\pi}}$';

  it('reads the same value however it is written', () => {
    for (const form of [
      '∛(3V/(4π))',
      '$\\left(\\frac{3V}{4\\pi}\\right)^{\\frac13}$',
      '(3V/(4\\pi))^{1/3}',
      '\\sqrt[3]{\\frac{3V}{4\\pi}}',
    ]) {
      expect(answersEquivalent(form, CANON), form).toBe(true);
    }
  });

  it('and still refuses a different one', () => {
    expect(answersEquivalent('∛(3V/(2π))', CANON)).toBe(false);
    expect(answersEquivalent('\\sqrt{\\frac{3V}{4\\pi}}', CANON), 'a square root is not a cube root').toBe(false);
  });

  it('evaluates a numeric nth root', () => {
    expect(answersEquivalent('∛8', '2')).toBe(true);
    expect(answersEquivalent('\\sqrt[3]{27}', '3')).toBe(true);
    expect(answersEquivalent('\\sqrt[4]{16}', '2')).toBe(true);
    expect(answersEquivalent('\\sqrt[3]{27}', '4')).toBe(false);
  });

  it('takes everything under the sign, not the first bracket', () => {
    // The old rule took a run of word characters, so ∛(3V/(4π)) kept "(3V" and
    // the rest fell out of the expression.
    expect(answersEquivalent('∛(27)', '3')).toBe(true);
    expect(answersEquivalent('∛(8/27)', '2/3')).toBe(true);
  });

  it('reads a root or a fraction as an expression, never as prose', () => {
    for (const v of [CANON, '\\frac{2}{\\sqrt{29}}', '\\sqrt{29}', '\\sqrt[3]{8}']) {
      expect(readInputShape(v).shape, v).toBe('expression');
    }
    expect(readInputShape('a straight line').shape, 'and prose is still prose').toBe('word');
  });

  it('a bracketed expression is not prose because TeX spaced it', () => {
    // looksMathematical asks this of a RAW stored answer, where \left and
    // \right survive and were read as the English words.
    expect(looksMathematical('$\\left(\\frac{3V}{4\\pi}\\right)^{\\frac13}$')).toBe(true);
    expect(looksMathematical('turn left at the corner'), 'the words are untouched').toBe(false);
  });

  it('a sample point outside the reals is skipped, not fatal', () => {
    // mathjs answers x^(1/3) with a complex number where x is negative, while
    // nthRoot(x, 3) gives the real root; one such point used to end the
    // comparison of two forms of the same cube root.
    expect(answersEquivalent('\\sqrt[3]{x}', 'x^{1/3}')).toBe(true);
  });
});

/**
 * The notations the self-agreement sweep could not evaluate, which meant they
 * were compared as TEXT — equal to themselves and to nothing else, so a scheme
 * and its own accept list passed every check by being spelt the same way.
 */
describe('a vector is its symbol', () => {
  it('reads \\vec, \\mathbf and \\underline as the letter underneath', () => {
    expect(answersEquivalent('2\\mathbf{b}-\\mathbf{a}', '-\\mathbf{a}+2\\mathbf{b}')).toBe(true);
    expect(answersEquivalent('3\\vec{a}+3\\vec{b}', '3\\vec{b}+3\\vec{a}')).toBe(true);
    expect(answersEquivalent('\\underline{a}+\\underline{b}', 'a + b')).toBe(true);
  });

  it('order and sign are differences, which the word path could not see', () => {
    // wordsEquivalent compares token SETS, so both of these were accepted.
    expect(answersEquivalent('2\\mathbf{b}-\\mathbf{a}', '2\\mathbf{a}-\\mathbf{b}')).toBe(false);
    expect(answersEquivalent('2\\mathbf{b}-\\mathbf{a}', '2\\mathbf{b}+\\mathbf{a}')).toBe(false);
    expect(answersEquivalent('11\\vec{a}+8\\vec{b}', '8\\vec{a}+11\\vec{b}')).toBe(false);
  });

  it('\\right no longer eats the arrow it starts', () => {
    expect(answersEquivalent('f: x \\rightarrow 2x+1', '2x+1')).toBe(true);
  });
});

describe('an inequality is the set of values it admits', () => {
  it('a chain compares as an interval, whichever way round it is written', () => {
    expect(answersEquivalent('$2 \\le x \\le 7$', '$7 \\ge x \\ge 2$')).toBe(true);
    expect(answersEquivalent('1\\leq x\\leq5', '$1 \\le x \\le 5$')).toBe(true);
    expect(answersEquivalent('$10 \\le t < 15$ minutes', '$10 \\le t < 15$ minutes')).toBe(true);
  });

  it('a bound is the same bound at any positive scale', () => {
    expect(answersEquivalent('$18x - 36 \\ge 180$', '$x \\ge 12$')).toBe(true);
    expect(answersEquivalent('$y \\geq -x+2$', '$x + y \\ge 2$')).toBe(true);
    expect(answersEquivalent('$18x - 36 \\ge 180$', '$x \\le 12$'), 'turned round').toBe(false);
  });

  it('a closed end is not an open one', () => {
    expect(answersEquivalent('$2 \\le x \\le 7$', '$2 < x < 7$')).toBe(false);
    expect(answersEquivalent('$20 \\le x < 30$', '$20 \\le x \\le 30$')).toBe(false);
  });

  it('an impossible interval equals nothing, including its own mirror', () => {
    expect(answersEquivalent('$7 \\le x \\le 2$', '$2 \\le x \\le 7$')).toBe(false);
    expect(answersEquivalent('$7 \\le x \\le 2$', '$7 \\le x \\le 2$')).toBe(false);
  });

  it('an inequality is never equal to a value', () => {
    expect(answersEquivalent('$x \\ge 12$', '12')).toBe(false);
  });
});

describe('set-builder is the inequality inside it', () => {
  it('reads the condition, and the braces do not have to be there', () => {
    expect(answersEquivalent('$\\{x \\in \\mathbb{R}: 9 \\le x \\le 12\\}$', '$\\{x \\in \\mathbb{R} : 12 \\ge x \\ge 9\\}$')).toBe(true);
    expect(answersEquivalent('x \\in \\mathbb{N} : x \\ge 12', '$\\{x \\in \\mathbb{N} : x \\ge 12\\}$')).toBe(true);
  });

  it('the domain is part of what the set says', () => {
    expect(answersEquivalent('$\\{x \\in \\mathbb{R}: 3 \\le x \\le 6\\}$', '$\\{n \\in \\mathbb{N}: 3 \\le n \\le 6\\}$')).toBe(false);
    expect(answersEquivalent('$\\{x \\in \\mathbb{N} : x \\ge 12\\}$', '$x \\ge 12$')).toBe(false);
  });
});

describe('prose reaches the word path because it is prose', () => {
  it('a hyphen joins words; it does not subtract them', () => {
    expect(isProse('non-square')).toBe(true);
    expect(isProse('right-angled isosceles triangle')).toBe(true);
    expect(isProse('break-even')).toBe(true);
    expect(answersEquivalent('non-square', 'non-parallel')).toBe(false);
  });

  it('a sentence that quotes a value is still a sentence', () => {
    expect(isProse('The $x$-intercept is $(3,0)$ and the $y$-intercept is $(0,-15)$.')).toBe(true);
    expect(isProse('$R$ is a many-to-one function.')).toBe(true);
  });

  it('a value dressed in words is not prose', () => {
    for (const v of ['5\\sqrt{2}\\text{ cm}', '20-29 min', '$2 \\le x \\le 7$', '2x + 3']) {
      expect(isProse(v), v).toBe(false);
    }
  });
});

describe('what the comparator still cannot evaluate', () => {
  it('a custom operator is left for a question edit, not guessed at', () => {
    // The question defines \star itself; nothing here can know what it means.
    expect(canEvaluate('$a \\star b = 2a + b$')).toBe(false);
  });

  it('every notation this commit taught it now evaluates', () => {
    for (const v of ['2\\mathbf{b}-\\mathbf{a}', '$2 \\le x \\le 7$', '1\\leq x\\leq5',
      '$\\{x \\in \\mathbb{R}: 0 < x \\le 12\\}$', 'non-square', 'red', 'f: x \\rightarrow 2x+1']) {
      expect(canEvaluate(v), v).toBe(true);
    }
  });
});

describe('a command ends where its letters do', () => {
  // \right is a prefix of \rightarrow; \to of \top; and a DIGIT straight after
  // a command is not a word boundary, which is how "\leq5" and "x\to2" — both
  // of them how the bank writes it with no space — went unread.
  it('a mapping arrow written against its value', () => {
    expect(answersEquivalent('f^{-1}:x\\to2+\\sqrt{x-1}', '2+\\sqrt{x-1}')).toBe(true);
  });

  it('a relation written against its bound', () => {
    expect(answersEquivalent('1\\le x\\le17', '$1 \\le x \\le 17$')).toBe(true);
    expect(answersEquivalent('x\\ge12', '$x \\ge 12$')).toBe(true);
  });
});

/**
 * An exact answer carrying a unit is a value with a unit, not text. The head
 * used to be a digit regex, so \frac{196\pi}{3} cm² fell out of the quantity
 * path AND the numeric one, and every such answer in the bank was compared as
 * a string against its own accept list.
 */
describe('a quantity whose value is mathematics', () => {
  it('compares by value, through the unit', () => {
    expect(answersEquivalent('3\\sqrt[3]{10}\\text{ cm}', '\\sqrt[3]{270}\\text{ cm}')).toBe(true);
    expect(answersEquivalent('$5\\sqrt{2}\\text{ cm}$', '$\\sqrt{50}\\text{ cm}$')).toBe(true);
    expect(answersEquivalent('$\\frac{508\\pi}{3}\\text{ cm}^3$', '$\\frac{508}{3}\\pi\\text{ cm}^3$')).toBe(true);
  });

  it('and the unit still decides', () => {
    expect(answersEquivalent('$5\\sqrt{2}\\text{ cm}$', '$\\sqrt{50}\\text{ m}$'), 'a different length').toBe(false);
    expect(answersEquivalent('$90\\pi\\text{ cm}^3$', '$90\\pi\\text{ cm}^2$'), 'a volume is not an area').toBe(false);
    expect(answersEquivalent('$90\\pi\\text{ cm}^3$', '$72\\pi\\text{ cm}^3$')).toBe(false);
  });

  it('the omitted unit is lenient about the value AS WRITTEN, which is now exact', () => {
    // A bare number is accepted against a unit the question supplied. Reading
    // the head as its first digits would have accepted 5 for 5\sqrt{2} cm.
    expect(answersEquivalent('72 cm', '72')).toBe(true);
    expect(answersEquivalent('$5\\sqrt{2}\\text{ cm}$', '5 cm')).toBe(false);
  });
});

/**
 * WHERE A VALUE SITS IS PART OF THE ANSWER unless the shape says otherwise.
 * Matching every answer as an unordered set said (2,1) was (1,2) — on every
 * path that compares whole strings, which is photo grading, the solve gate and
 * revisiting a marked question. The box path was already right.
 */
describe('order is read from the shape, not assumed away', () => {
  it('a coordinate is ordered', () => {
    expect(answersEquivalent('(1,2)', '(2,1)')).toBe(false);
    expect(answersEquivalent('(1,2)', '(1,2)')).toBe(true);
    expect(answersEquivalent('$\\left(\\frac{5}{2},2\\right)$', '$(2,2.5)$')).toBe(false);
  });

  it('a set is not', () => {
    expect(answersEquivalent('{1,2}', '{2,1}')).toBe(true);
    expect(answersEquivalent('{1,3}, {2,3}', '{2,3}, {1,3}')).toBe(true);
    expect(answersEquivalent('{1,2}', '{1,3}')).toBe(false);
  });

  it('nor is a list of roots, however the label is written', () => {
    expect(answersEquivalent('x = -1, 3', 'x = 3, -1')).toBe(true);
    expect(answersEquivalent('x = 2 or x = -1/3', 'x = -1/3 or x = 2')).toBe(true);
    expect(answersEquivalent('x = -1, 3', 'x = 3, -2')).toBe(false);
  });

  it('and a plain list keeps its order, which is how a reordered one is reported', () => {
    expect(answersEquivalent('2, 3, 4', '4, 3, 2')).toBe(false);
    expect(answersEquivalent('2, 3, 4', '2, 3, 4')).toBe(true);
  });

  it('either side saying it carries no order is enough', () => {
    // A student may write the members of a set in whatever order they like.
    expect(answersEquivalent('{1,2}', '2, 1')).toBe(true);
  });
});
