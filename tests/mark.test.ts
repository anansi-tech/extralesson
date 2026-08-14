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
