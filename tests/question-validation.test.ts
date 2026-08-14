import { describe, expect, it } from 'vitest';
import { QuestionDraftZ } from '@/lib/validation/question';

const validStructured = {
  kind: 'structured' as const,
  objective_ids: ['M1.5.10'],
  module: 1 as const,
  stem: 'Solve for $x$: $3x^2 - 5x - 2 = 0$.',
  difficulty: 2 as const,
  marks: 3,
  rubric: [
    { code: 'CK1', profile: 'CK' as const, criterion: 'Recognises factorisable quadratic', mark_value: 1 },
    { code: 'AK1', profile: 'AK' as const, criterion: 'Correct factorisation', mark_value: 1 },
    { code: 'R1', profile: 'R' as const, criterion: 'Both roots stated correctly', mark_value: 1 },
  ],
  final_answer: 'x = -1/3 or x = 2',
  worked_solution: '$(3x+1)(x-2)=0$ so $x=-\\frac{1}{3}$ or $x=2$.',
  misconceptions: [
    { trigger: 'x = 1/3', name: 'Sign slip', remediation: '$3x+1=0$ gives $x=-\\frac{1}{3}$.' },
  ],
};

const validMcq = {
  kind: 'mcq' as const,
  objective_ids: ['M2.1.3'],
  module: 2 as const,
  stem: 'What is the median of 3, 7, 9, 12, 15?',
  options: ['7', '9', '9.2', '12'],
  answer_key: 1,
  profile: 'CK' as const,
  difficulty: 1 as const,
  marks: 1,
  worked_solution: 'Ordered already; middle value is 9.',
  misconceptions: [],
};

describe('QuestionDraftZ — structured', () => {
  it('accepts a valid structured question', () => {
    expect(QuestionDraftZ.safeParse(validStructured).success).toBe(true);
  });

  it('rejects rubric mark_values not summing to marks', () => {
    const q = { ...validStructured, marks: 5 };
    const res = QuestionDraftZ.safeParse(q);
    expect(res.success).toBe(false);
  });

  it('rejects rubric code prefix that disagrees with profile', () => {
    const q = {
      ...validStructured,
      rubric: [
        { code: 'AK1', profile: 'CK', criterion: 'x', mark_value: 3 },
      ],
    };
    expect(QuestionDraftZ.safeParse(q).success).toBe(false);
  });

  it('rejects duplicate rubric codes', () => {
    const q = {
      ...validStructured,
      marks: 2,
      rubric: [
        { code: 'CK1', profile: 'CK', criterion: 'a', mark_value: 1 },
        { code: 'CK1', profile: 'CK', criterion: 'b', mark_value: 1 },
      ],
    };
    expect(QuestionDraftZ.safeParse(q).success).toBe(false);
  });

  it('rejects objective_ids from a different module', () => {
    const q = { ...validStructured, objective_ids: ['M2.5.10'] };
    expect(QuestionDraftZ.safeParse(q).success).toBe(false);
  });

  it('rejects an empty rubric', () => {
    const q = { ...validStructured, rubric: [] };
    expect(QuestionDraftZ.safeParse(q).success).toBe(false);
  });
});

describe('QuestionDraftZ — mcq', () => {
  it('accepts a valid mcq question', () => {
    expect(QuestionDraftZ.safeParse(validMcq).success).toBe(true);
  });

  it('rejects mcq without exactly 4 options', () => {
    expect(QuestionDraftZ.safeParse({ ...validMcq, options: ['7', '9', '12'] }).success).toBe(false);
    expect(
      QuestionDraftZ.safeParse({ ...validMcq, options: ['7', '9', '12', '15', '20'] }).success,
    ).toBe(false);
  });

  it('rejects answer_key outside 0-3', () => {
    expect(QuestionDraftZ.safeParse({ ...validMcq, answer_key: 4 }).success).toBe(false);
  });

  it('rejects mcq without a top-level profile', () => {
    expect(QuestionDraftZ.safeParse({ ...validMcq, profile: undefined }).success).toBe(false);
  });

  it('rejects malformed objective ids', () => {
    expect(QuestionDraftZ.safeParse({ ...validMcq, objective_ids: ['M4.1.1'] }).success).toBe(false);
    expect(QuestionDraftZ.safeParse({ ...validMcq, objective_ids: ['2.1.3'] }).success).toBe(false);
  });
});
