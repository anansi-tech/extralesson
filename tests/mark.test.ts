import { describe, expect, it } from 'vitest';
import { markMcq, markStructured, markStructuredParts } from '@/lib/grade/mark';
import { missReason } from '@/lib/grade/reason';
import type { RubricItem } from '@/lib/types';

const rubric: RubricItem[] = [
  { code: 'CK1', profile: 'CK', criterion: 'concept', mark_value: 1, slot_ref: 'a.i', part_label: 'a' },
  { code: 'AK1', profile: 'AK', criterion: 'procedure', mark_value: 2, slot_ref: 'a.i', part_label: 'a' },
  { code: 'R1', profile: 'R', criterion: 'result', mark_value: 1, slot_ref: 'a.i', part_label: 'a' },
];

describe('markMcq', () => {
  it('awards the item profile marks when correct', () => {
    const r = markMcq('AK', 1, 2, 2);
    expect(r.correct).toBe(true);
    expect(r.profile_marks).toEqual({ CK: 0, AK: 1, R: 0 });
    expect(r.rubric_awarded).toEqual([]);
  });

  it('awards nothing when wrong', () => {
    const r = markMcq('CK', 1, 0, 2);
    expect(r.correct).toBe(false);
    expect(r.profile_marks).toEqual({ CK: 0, AK: 0, R: 0 });
  });
});

describe('markStructured — documented heuristics', () => {
  it('correct final answer awards the full rubric', () => {
    const r = markStructured(rubric, 'x = 2', 'x = 2');
    expect(r.correct).toBe(true);
    expect(r.rubric_awarded).toEqual(['CK1', 'AK1', 'R1']);
    expect(r.profile_marks).toEqual({ CK: 1, AK: 2, R: 1 });
  });

  it('accepts numerically equivalent answers', () => {
    const r = markStructured(rubric, '0.5', '1/2');
    expect(r.correct).toBe(true);
  });

  it('wrong answer with no working earns nothing', () => {
    const r = markStructured(rubric, 'x = 2', 'x = 5');
    expect(r.correct).toBe(false);
    expect(r.rubric_awarded).toEqual([]);
  });

  // A METHOD MARK NEEDS THE WORKING, AND THE WORKING IS PHOTOGRAPHED.
  //
  // A typed box could only be attributed on a question with one marked slot —
  // 4 of 446 — so everywhere else it promised marks it could not award. There
  // is no typed working to weigh any more: a wrong answer earns nothing here,
  // and the method marks come from the photograph (mark-method.ts).
  it('awards nothing for a wrong answer, whatever was shown', () => {
    const r = markStructured(rubric, 'x = 2', 'x = 5');
    expect(r.rubric_awarded).toEqual([]);
    expect(r.profile_marks).toEqual({ CK: 0, AK: 0, R: 0 });
  });
});

describe('markStructuredParts — per-part equivalence (R1.5)', () => {
  const partRubric: RubricItem[] = [
    { code: 'AK1', profile: 'AK', criterion: 'part a procedure', mark_value: 2, slot_ref: 'a.i', part_label: 'a' },
    { code: 'CK1', profile: 'CK', criterion: 'part b concept', mark_value: 1, slot_ref: 'b.i', part_label: 'b' },
    { code: 'R1', profile: 'R', criterion: 'part b conclusion', mark_value: 2, slot_ref: 'b.i', part_label: 'b' },
  ];
  const parts = [
    { label: 'a', slots: [{ label: 'i', answer: 'x = 4' }] },
    { label: 'b', slots: [{ label: 'i', answer: 'EC$24' }] },
  ];

  it('awards each part independently', () => {
    const r = markStructuredParts(partRubric, parts, [
      { ref: 'a.i', answer: '4' },
      { ref: 'b.i', answer: '25' },
    ]);
    expect(r.correct).toBe(false); // part b wrong
    expect(r.rubric_awarded).toEqual(['AK1']); // part a fully awarded
    expect(r.profile_marks).toEqual({ CK: 0, AK: 2, R: 0 });
  });

  it('all parts correct awards the full rubric', () => {
    const r = markStructuredParts(partRubric, parts, [
      { ref: 'a.i', answer: 'x = 4' },
      { ref: 'b.i', answer: '$24' },
    ]);
    expect(r.correct).toBe(true);
    expect(r.profile_marks).toEqual({ CK: 1, AK: 2, R: 2 });
  });

  // Two marked slots share one working box, so nothing in it can be credited
  // to either: the student who wrote "3 × 8 = 30" for (b) did not thereby show
  // method for (a).
  it('earns no method marks when the working cannot be attributed to a slot', () => {
    const r = markStructuredParts(partRubric, parts, [
      { ref: 'a.i', answer: 'x = 9' },
      { ref: 'b.i', answer: '30' },
    ]);
    expect(r.rubric_awarded).toEqual([]);
    expect(r.profile_marks.R).toBe(0);
  });

  it('missing input for a part earns nothing for that part', () => {
    const r = markStructuredParts(partRubric, parts, [{ ref: 'a.i', answer: 'x = 4' }]);
    expect(r.correct).toBe(false);
    expect(r.rubric_awarded).toEqual(['AK1']);
  });
});

describe('mark-scheme accept lists', () => {
  const terminologyRubric: RubricItem[] = [
    { code: 'CK1', profile: 'CK', criterion: 'names the feature', mark_value: 1, slot_ref: 'a.i', part_label: 'a' },
  ];
  const part = [{ label: 'a', slots: [{ label: 'i', answer: 'edge', accept: ['line segment where two faces meet'] }] }];

  it('any accepted form earns the marks', () => {
    for (const student of ['edge', 'Edge', 'line segment where two faces meet']) {
      const r = markStructuredParts(terminologyRubric, part, [
        { ref: 'a.i', answer: student },
      ]);
      expect(r.correct, student).toBe(true);
      expect(r.profile_marks.CK).toBe(1);
    }
  });

  it('an unlisted answer still fails', () => {
    const r = markStructuredParts(terminologyRubric, part, [
      { ref: 'a.i', answer: 'vertex' },
    ]);
    expect(r.correct).toBe(false);
  });
});

describe('format-aware marking (R1.6 §2)', () => {
  const rubric: RubricItem[] = [
    { code: 'AK1', profile: 'AK', criterion: 'value', mark_value: 2, slot_ref: 'a.i', part_label: 'a' },
  ];

  // for_format on the rubric row is what puts the form on offer; without it a
  // form miss is feedback, not a loss (see the standard-form group below).
  it('marks an equivalent value in the wrong form incorrect, and says so', () => {
    const priced: RubricItem[] = [
      ...rubric,
      { code: 'R1', profile: 'R', criterion: 'exact form', mark_value: 1, slot_ref: 'a.i', part_label: 'a', for_format: true },
    ];
    const parts = [{ label: 'a', slots: [{ label: 'i', answer: '1/3', answer_format: 'exact' as const }] }];
    const r = markStructuredParts(priced, parts, [{ ref: 'a.i', answer: '0.333' }]);
    expect(r.correct).toBe(false);
    expect(r.rubric_awarded).toEqual(['AK1']); // the value stands; the form mark does not
    expect(r.format_feedback).toContain('EXACT');
    // The mathematics was not wrong, so it must not read as a maths error.
    expect(r.format_feedback).toContain('Correct value');
  });

  it('accepts the same value written in the required form', () => {
    const parts = [{ label: 'a', slots: [{ label: 'i', answer: '1/3', answer_format: 'exact' as const }] }];
    const r = markStructuredParts(rubric, parts, [{ ref: 'a.i', answer: '1/3' }]);
    expect(r.correct).toBe(true);
    expect(r.format_feedback).toBeUndefined();
  });

  it('leaves marking unchanged when no format is required', () => {
    const parts = [{ label: 'a', slots: [{ label: 'i', answer: '1/3' }] }];
    const r = markStructuredParts(rubric, parts, [{ ref: 'a.i', answer: '0.333' }]);
    expect(r.correct).toBe(true); // a third is not exact, so 3 s.f. applies by default
  });

  // Nothing here pays for the form, so the answer stands and the student is
  // told about the rounding anyway — feedback without a penalty they cannot see
  // the source of.
  it('explains the form even where no row pays for it', () => {
    const parts = [{ label: 'a', slots: [{ label: 'i', answer: '36.9', answer_format: 'dp:1' as const }] }];
    const r = markStructuredParts(rubric, parts, [{ ref: 'a.i', answer: '36.87' }]);
    expect(r.correct).toBe(true);
    expect(r.rubric_awarded).toEqual(['AK1']);
    expect(r.format_feedback).toContain('1 decimal place');
  });
});

// R1.6 §1 — a question mixes marked and self-marked parts, as the real papers
// do. The self-marked ones earn nothing, cost nothing, and cannot make the rest
// of the question wrong.
describe('markStructuredParts — self-marked parts are left out of the marking', () => {
  const rubric: RubricItem[] = [
    { code: 'AK1', profile: 'AK', criterion: 'Finds the interior angle', mark_value: 2, slot_ref: 'a.i', part_label: 'a' },
    { code: 'R1', profile: 'R', criterion: 'Explains the symmetry', mark_value: 3, slot_ref: 'b.i', part_label: 'b' },
    { code: 'AK2', profile: 'AK', criterion: 'Finds the exterior angle', mark_value: 2, slot_ref: 'c.i', part_label: 'c' },
  ];
  const parts = [
    { label: 'a', slots: [{ label: 'i', answer: '108°', response_mode: 'answer' }] },
    { label: 'b', slots: [{ label: 'i', answer: 'each line joins a vertex to the opposite midpoint', response_mode: 'explain' }] },
    { label: 'c', slots: [{ label: 'i', answer: '72°', response_mode: 'answer' }] },
  ];

  it('marks every markable part correct without the student answering the prose one', () => {
    const res = markStructuredParts(rubric, parts, [
      { ref: 'a.i', answer: '108' },
      { ref: 'c.i', answer: '72 degrees' },
    ]);
    expect(res.correct).toBe(true);
    expect(res.profile_marks).toEqual({ CK: 0, AK: 4, R: 0 });
    expect(res.rubric_awarded).toEqual(['AK1', 'AK2']);
  });

  it('never awards the reasoning row for a part it did not mark', () => {
    const res = markStructuredParts(rubric, parts, [
      { ref: 'a.i', answer: '108°' },
      { ref: 'b.i', answer: 'because it looks symmetric' },
      { ref: 'c.i', answer: '72°' },
    ]);
    expect(res.rubric_awarded).not.toContain('R1');
    expect(res.profile_marks.R).toBe(0);
  });

  it('still fails the question when a markable part is wrong', () => {
    const res = markStructuredParts(rubric, parts, [
      { ref: 'a.i', answer: '120°' },
      { ref: 'c.i', answer: '72°' },
    ]);
    expect(res.correct).toBe(false);
    expect(res.profile_marks.AK).toBe(2);
  });
});

// R1.7 §B4 — the official scheme pays for the value and pays again for putting
// it in the demanded form. A student who computes correctly and writes the
// number plainly has lost one mark, not the question.
describe('markStructured — a wrong form costs only the form mark', () => {
  const rubric: RubricItem[] = [
    { code: 'CK1', profile: 'CK', criterion: 'CAO $0.000045$', mark_value: 2, slot_ref: 'a.i', part_label: 'a' },
    { code: 'AK1', profile: 'AK', criterion: 'Divides correctly', mark_value: 2, slot_ref: 'a.i', part_label: 'a' },
    { code: 'R1', profile: 'R', criterion: "Expresses 'their' answer in standard form", mark_value: 1, slot_ref: 'a.i', part_label: 'a', for_format: true },
  ];

  it('keeps the value and method marks, withholds the form mark', () => {
    const res = markStructured(rubric, '4.5 \\times 10^{-5}', '0.000045', undefined, 'standard_form');
    expect(res.correct).toBe(false);
    expect(res.rubric_awarded).toEqual(['CK1', 'AK1']);
    expect(res.profile_marks).toEqual({ CK: 2, AK: 2, R: 0 });
    expect(res.format_feedback).toMatch(/^Correct value/);
  });

  it('awards everything when the form is right too', () => {
    const res = markStructured(rubric, '4.5 \\times 10^{-5}', '4.5 \\times 10^{-5}', undefined, 'standard_form');
    expect(res.correct).toBe(true);
    expect(res.rubric_awarded).toEqual(['CK1', 'AK1', 'R1']);
    expect(res.profile_marks.R).toBe(1);
  });

  it('does not rescue a wrong value dressed in the right form', () => {
    const res = markStructured(rubric, '4.5 \\times 10^{-5}', '5.4 \\times 10^{-5}', undefined, 'standard_form');
    expect(res.correct).toBe(false);
    expect(res.rubric_awarded).not.toContain('CK1');
    expect(res.profile_marks).toEqual({ CK: 0, AK: 0, R: 0 });
  });

  // WHERE NOTHING PAYS FOR THE FORM, MISSING IT IS NOT A FAILURE.
  //
  // This used to assert correct:false while awarding every row — full marks
  // beside "Not quite", which is what a student actually saw on c0c05d: 9 out
  // of 9, every chip ticked, verdict wrong. 129 of the 256 slots declaring a
  // format have no row marked for_format, so the form was never on offer.
  // Saying so is feedback; failing the answer for it is a contradiction.
  it('reports the form but keeps the answer correct when no row marks it', () => {
    const plain: RubricItem[] = [
      { code: 'CK1', profile: 'CK', criterion: 'CAO $0.000045$', mark_value: 2, slot_ref: 'a.i', part_label: 'a' },
      { code: 'R1', profile: 'R', criterion: 'Interprets the result', mark_value: 1, slot_ref: 'a.i', part_label: 'a' },
    ];
    const res = markStructured(plain, '4.5 \\times 10^{-5}', '0.000045', undefined, 'standard_form');
    expect(res.correct).toBe(true);
    expect(res.rubric_awarded).toEqual(['CK1', 'R1']);
    expect(res.format_feedback).toMatch(/^Correct value/);
  });

  it('leaves questions without a required form exactly as they were', () => {
    const res = markStructured(rubric, '4.5 \\times 10^{-5}', '0.000045');
    expect(res.correct).toBe(true);
    expect(res.format_feedback).toBeUndefined();
  });
});

// R1.8 §2 — a paper-shaped question can be the whole session, so being stuck on
// one slot must not cost the student every mark they did earn. A candidate
// leaves a blank and hands the paper in; the examiner marks the blank wrong.
describe('marking a question handed in with blanks', () => {
  const parts = [
    {
      label: 'a',
      slots: [
        { label: 'i', answer: '5x(x + 3)' },
        { label: 'ii', answer: '900' },
      ],
    },
    {
      label: 'b',
      slots: [{ label: 'i', answer: '180' }],
    },
  ];
  const rubric: RubricItem[] = [
    { code: 'AK1', profile: 'AK', criterion: 'factorises', mark_value: 1, slot_ref: 'a.i', part_label: 'a' },
    { code: 'AK2', profile: 'AK', criterion: 'evaluates', mark_value: 1, slot_ref: 'a.ii', part_label: 'a' },
    { code: 'AK3', profile: 'AK', criterion: 'finds the deposit', mark_value: 1, slot_ref: 'b.i', part_label: 'b' },
  ];

  it('awards the slots that were answered and nothing for the blank', () => {
    const res = markStructuredParts(rubric, parts, [
      { ref: 'a.i', answer: '5x(x + 3)' },
      { ref: 'a.ii', answer: '900' },
      { ref: 'b.i', answer: '' },
    ]);
    expect(res.rubric_awarded).toEqual(['AK1', 'AK2']);
    expect(res.profile_marks.AK).toBe(2);
  });

  it('never marks a blank correct, whatever the expected answer is', () => {
    for (const answer of ['0', 'yes', '', 'x']) {
      const res = markStructuredParts(
        [{ code: 'AK1', profile: 'AK', criterion: 'c', mark_value: 1, slot_ref: 'a.i', part_label: 'a' }],
        [{ label: 'a', slots: [{ label: 'i', answer }] }],
        [{ ref: 'a.i', answer: '   ' }],
      );
      expect(res.rubric_awarded, `expected ${answer}`).toEqual([]);
    }
  });
});

// A FORM IS A PROPERTY OF EACH VALUE, not of the line they were joined into.
//
// "Calculate both angles, each correct to 1 decimal place" is one slot holding
// two values. The check ran over the composed "73.7°, 53.1°" and asked whether
// that STRING was a number to one decimal place, which it never is — so the
// format mark was lost on every multi-value slot demanding a form, however
// carefully the student had rounded. Found on a real attempt: b1a668 (d), where
// R4 is marked for_format and could not be earned by any answer at all.
describe('markStructured — a form is checked per value', () => {
  const formatRow = {
    code: 'R4',
    profile: 'R' as const,
    criterion: 'Expresses both angles correct to 1 decimal place.',
    mark_value: 1,
    slot_ref: 'd.i',
    part_label: 'd',
    for_format: true,
  };

  it('awards the format mark when every value carries the form', () => {
    const result = markStructured(
      [formatRow],
      '$73.7°, 53.1°$',
      '73.7°, 53.1°',
      undefined,
      'dp:1',
      ['73.7°', '53.1°'],
    );
    expect(result.correct).toBe(true);
    expect(result.rubric_awarded).toContain('R4');
  });

  it('still withholds it when one value does not', () => {
    const result = markStructured(
      [formatRow],
      '$73.7°, 53.1°$',
      '73.7°, 53',
      undefined,
      'dp:1',
      ['73.7°', '53'],
    );
    expect(result.rubric_awarded).not.toContain('R4');
  });

  it('leaves single-value slots exactly as they were', () => {
    expect(markStructured([formatRow], '73.7', '73.7', undefined, 'dp:1').rubric_awarded).toContain('R4');
    expect(markStructured([formatRow], '73.7', '74', undefined, 'dp:1').rubric_awarded).not.toContain('R4');
  });
});

// A cross beside a box says something is wrong and nothing about what. The
// commonest misses are not mathematical — a unit left in centimetres, three
// values where four were asked for, a blank — and each is one sentence from
// being useful. Found on d0dc6a, where "8m * 6cm" against "8 m × 6 m" was
// correctly rejected and the student was told only "✗".
describe('missReason — why a slot was marked wrong', () => {
  it('names a unit error rather than calling the answer wrong', () => {
    expect(missReason('8m * 6cm', '$8\\text{ m} \\times 6\\text{ m}$')).toMatch(/units/i);
  });

  it('names a quantity of the wrong kind', () => {
    expect(missReason('72 cm', '$72\\text{ m}^2$')).toMatch(/length.*area/i);
  });

  it('counts the values a multi-value answer wanted', () => {
    expect(missReason('3', '$(3, 4)$', ['3'])).toMatch(/needs 2 values.*gave 1/i);
  });

  it('says so when the box was left empty', () => {
    expect(missReason('', '341.4')).toMatch(/blank/i);
  });

  // Never invent a diagnosis: where the marker simply disagrees about a value,
  // say that and no more.
  it('does not guess at what the student was thinking', () => {
    expect(missReason('344.25', '341.4')).toBe('That is not the value this asks for.');
  });
});
