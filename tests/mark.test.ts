import { describe, expect, it } from 'vitest';
import { markMcq, markStructured } from '@/lib/grade/mark';
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
