import { describe, expect, it } from 'vitest';
import { markMcq, markStructured, markStructuredParts } from '@/lib/grade/mark';
import type { RubricItem } from '@/lib/types';

const rubric: RubricItem[] = [
  { code: 'CK1', profile: 'CK', criterion: 'concept', mark_value: 1, part_label: 'a' },
  { code: 'AK1', profile: 'AK', criterion: 'procedure', mark_value: 2, part_label: 'a' },
  { code: 'R1', profile: 'R', criterion: 'result', mark_value: 1, part_label: 'a' },
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
    const r = markStructured(rubric, 'x = 2', 'x = 2', '');
    expect(r.correct).toBe(true);
    expect(r.rubric_awarded).toEqual(['CK1', 'AK1', 'R1']);
    expect(r.profile_marks).toEqual({ CK: 1, AK: 2, R: 1 });
  });

  it('accepts numerically equivalent answers', () => {
    const r = markStructured(rubric, '0.5', '1/2', '');
    expect(r.correct).toBe(true);
  });

  it('wrong answer with no working earns nothing', () => {
    const r = markStructured(rubric, 'x = 2', 'x = 5', '');
    expect(r.correct).toBe(false);
    expect(r.rubric_awarded).toEqual([]);
  });

  it('wrong answer with working earns CK only (no worked step)', () => {
    const r = markStructured(rubric, 'x = 2', 'x = 5', 'tried factoring');
    expect(r.rubric_awarded).toEqual(['CK1']);
    expect(r.profile_marks).toEqual({ CK: 1, AK: 0, R: 0 });
  });

  it('wrong answer with a worked step earns CK and AK, never R', () => {
    const r = markStructured(rubric, 'x = 2', 'x = 5', '3x - 6 = 9\nx = 5');
    expect(r.rubric_awarded).toEqual(['CK1', 'AK1']);
    expect(r.profile_marks).toEqual({ CK: 1, AK: 2, R: 0 });
  });
});

describe('markStructuredParts — per-part equivalence (R1.5)', () => {
  const partRubric: RubricItem[] = [
    { code: 'AK1', profile: 'AK', criterion: 'part a procedure', mark_value: 2, part_label: 'a' },
    { code: 'CK1', profile: 'CK', criterion: 'part b concept', mark_value: 1, part_label: 'b' },
    { code: 'R1', profile: 'R', criterion: 'part b conclusion', mark_value: 2, part_label: 'b' },
  ];
  const parts = [
    { label: 'a', answer: 'x = 4' },
    { label: 'b', answer: 'EC$24' },
  ];

  it('awards each part independently', () => {
    const r = markStructuredParts(partRubric, parts, [
      { label: 'a', answer: '4', working: '' },
      { label: 'b', answer: '25', working: '' },
    ]);
    expect(r.correct).toBe(false); // part b wrong
    expect(r.rubric_awarded).toEqual(['AK1']); // part a fully awarded
    expect(r.profile_marks).toEqual({ CK: 0, AK: 2, R: 0 });
  });

  it('all parts correct awards the full rubric', () => {
    const r = markStructuredParts(partRubric, parts, [
      { label: 'a', answer: 'x = 4', working: '' },
      { label: 'b', answer: '$24', working: '' },
    ]);
    expect(r.correct).toBe(true);
    expect(r.profile_marks).toEqual({ CK: 1, AK: 2, R: 2 });
  });

  it('working earns CK within the missed part only, never R', () => {
    const r = markStructuredParts(partRubric, parts, [
      { label: 'a', answer: 'x = 9', working: '' },
      { label: 'b', answer: '30', working: '3 × 8 = 30' },
    ]);
    expect(r.rubric_awarded).toEqual(['CK1']);
    expect(r.profile_marks.R).toBe(0);
  });

  it('missing input for a part earns nothing for that part', () => {
    const r = markStructuredParts(partRubric, parts, [{ label: 'a', answer: 'x = 4', working: '' }]);
    expect(r.correct).toBe(false);
    expect(r.rubric_awarded).toEqual(['AK1']);
  });
});

describe('mark-scheme accept lists', () => {
  const terminologyRubric: RubricItem[] = [
    { code: 'CK1', profile: 'CK', criterion: 'names the feature', mark_value: 1, part_label: 'a' },
  ];
  const part = [{ label: 'a', answer: 'edge', accept: ['line segment where two faces meet'] }];

  it('any accepted form earns the marks', () => {
    for (const student of ['edge', 'Edge', 'line segment where two faces meet']) {
      const r = markStructuredParts(terminologyRubric, part, [
        { label: 'a', answer: student, working: '' },
      ]);
      expect(r.correct, student).toBe(true);
      expect(r.profile_marks.CK).toBe(1);
    }
  });

  it('an unlisted answer still fails', () => {
    const r = markStructuredParts(terminologyRubric, part, [
      { label: 'a', answer: 'vertex', working: '' },
    ]);
    expect(r.correct).toBe(false);
  });
});

describe('format-aware marking (R1.6 §2)', () => {
  const rubric: RubricItem[] = [
    { code: 'AK1', profile: 'AK', criterion: 'value', mark_value: 2, part_label: 'a' },
  ];

  it('marks an equivalent value in the wrong form incorrect, and says so', () => {
    const parts = [{ label: 'a', answer: '1/3', answer_format: 'exact' as const }];
    const r = markStructuredParts(rubric, parts, [{ label: 'a', answer: '0.333', working: '' }]);
    expect(r.correct).toBe(false);
    expect(r.format_feedback).toContain('EXACT');
    // The mathematics was not wrong, so it must not read as a maths error.
    expect(r.format_feedback).toContain('Correct value');
  });

  it('accepts the same value written in the required form', () => {
    const parts = [{ label: 'a', answer: '1/3', answer_format: 'exact' as const }];
    const r = markStructuredParts(rubric, parts, [{ label: 'a', answer: '1/3', working: '' }]);
    expect(r.correct).toBe(true);
    expect(r.format_feedback).toBeUndefined();
  });

  it('leaves marking unchanged when no format is required', () => {
    const parts = [{ label: 'a', answer: '1/3' }];
    const r = markStructuredParts(rubric, parts, [{ label: 'a', answer: '0.333', working: '' }]);
    expect(r.correct).toBe(true); // permissive equivalence, as before
  });

  it('explains the form even when the value is also wrong-ish but close', () => {
    const parts = [{ label: 'a', answer: '36.9', answer_format: 'dp:1' as const }];
    const r = markStructuredParts(rubric, parts, [{ label: 'a', answer: '36.87', working: '' }]);
    expect(r.correct).toBe(false);
    expect(r.format_feedback).toContain('1 decimal place');
  });
});

// R1.6 §1 — a question mixes marked and self-marked parts, as the real papers
// do. The self-marked ones earn nothing, cost nothing, and cannot make the rest
// of the question wrong.
describe('markStructuredParts — self-marked parts are left out of the marking', () => {
  const rubric: RubricItem[] = [
    { code: 'AK1', profile: 'AK', criterion: 'Finds the interior angle', mark_value: 2, part_label: 'a' },
    { code: 'R1', profile: 'R', criterion: 'Explains the symmetry', mark_value: 3, part_label: 'b' },
    { code: 'AK2', profile: 'AK', criterion: 'Finds the exterior angle', mark_value: 2, part_label: 'c' },
  ];
  const parts = [
    { label: 'a', answer: '108°', response_mode: 'answer' },
    { label: 'b', answer: 'each line joins a vertex to the opposite midpoint', response_mode: 'explain' },
    { label: 'c', answer: '72°', response_mode: 'answer' },
  ];

  it('marks every markable part correct without the student answering the prose one', () => {
    const res = markStructuredParts(rubric, parts, [
      { label: 'a', answer: '108', working: '' },
      { label: 'c', answer: '72 degrees', working: '' },
    ]);
    expect(res.correct).toBe(true);
    expect(res.profile_marks).toEqual({ CK: 0, AK: 4, R: 0 });
    expect(res.rubric_awarded).toEqual(['AK1', 'AK2']);
  });

  it('never awards the reasoning row for a part it did not mark', () => {
    const res = markStructuredParts(rubric, parts, [
      { label: 'a', answer: '108°', working: '' },
      { label: 'b', answer: 'because it looks symmetric', working: '' },
      { label: 'c', answer: '72°', working: '' },
    ]);
    expect(res.rubric_awarded).not.toContain('R1');
    expect(res.profile_marks.R).toBe(0);
  });

  it('still fails the question when a markable part is wrong', () => {
    const res = markStructuredParts(rubric, parts, [
      { label: 'a', answer: '120°', working: '' },
      { label: 'c', answer: '72°', working: '' },
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
    { code: 'CK1', profile: 'CK', criterion: 'CAO $0.000045$', mark_value: 2, part_label: 'a' },
    { code: 'AK1', profile: 'AK', criterion: 'Divides correctly', mark_value: 2, part_label: 'a' },
    { code: 'R1', profile: 'R', criterion: "Expresses 'their' answer in standard form", mark_value: 1, part_label: 'a', for_format: true },
  ];

  it('keeps the value and method marks, withholds the form mark', () => {
    const res = markStructured(rubric, '4.5 \\times 10^{-5}', '0.000045', '', undefined, 'standard_form');
    expect(res.correct).toBe(false);
    expect(res.rubric_awarded).toEqual(['CK1', 'AK1']);
    expect(res.profile_marks).toEqual({ CK: 2, AK: 2, R: 0 });
    expect(res.format_feedback).toMatch(/^Correct value/);
  });

  it('awards everything when the form is right too', () => {
    const res = markStructured(rubric, '4.5 \\times 10^{-5}', '4.5 \\times 10^{-5}', '', undefined, 'standard_form');
    expect(res.correct).toBe(true);
    expect(res.rubric_awarded).toEqual(['CK1', 'AK1', 'R1']);
    expect(res.profile_marks.R).toBe(1);
  });

  it('does not rescue a wrong value dressed in the right form', () => {
    const res = markStructured(rubric, '4.5 \\times 10^{-5}', '5.4 \\times 10^{-5}', '', undefined, 'standard_form');
    expect(res.correct).toBe(false);
    expect(res.rubric_awarded).not.toContain('CK1');
    expect(res.profile_marks).toEqual({ CK: 0, AK: 0, R: 0 });
  });

  it('falls back to the ordinary heuristics when no row marks the form', () => {
    const plain: RubricItem[] = [
      { code: 'CK1', profile: 'CK', criterion: 'CAO $0.000045$', mark_value: 2, part_label: 'a' },
      { code: 'R1', profile: 'R', criterion: 'Interprets the result', mark_value: 1, part_label: 'a' },
    ];
    const res = markStructured(plain, '4.5 \\times 10^{-5}', '0.000045', '', undefined, 'standard_form');
    expect(res.correct).toBe(false);
    expect(res.rubric_awarded).toEqual(['CK1', 'R1']); // value was right; nothing marked the form
  });

  it('leaves questions without a required form exactly as they were', () => {
    const res = markStructured(rubric, '4.5 \\times 10^{-5}', '0.000045', '');
    expect(res.correct).toBe(true);
    expect(res.format_feedback).toBeUndefined();
  });
});
