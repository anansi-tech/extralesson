import { describe, expect, it } from 'vitest';
import { deriveFinalAnswer, QuestionDraftZ } from '@/lib/validation/question';

const validStructured = {
  kind: 'structured' as const,
  objective_ids: ['M1.5.10'],
  module: 1 as const,
  stimulus: 'A farmer fences a rectangular plot.',
  stem: 'Solve for $x$: $3x^2 - 5x - 2 = 0$.',
  archetype: 'multi-step-application' as const,
  representation: 'prose' as const,
  difficulty: 2 as const,
  marks: 3,
  parts: [
    { label: 'a', prompt: 'Factorise the expression.', marks: 2, answer: '(3x + 1)(x - 2)', response_mode: 'answer' as const },
    { label: 'b', prompt: 'State both roots.', marks: 1, answer: 'x = -1/3; x = 2', response_mode: 'answer' as const },
  ],
  rubric: [
    { code: 'CK1', profile: 'CK' as const, criterion: 'Recognises factorisable quadratic', mark_value: 1, part_label: 'a' },
    { code: 'AK1', profile: 'AK' as const, criterion: 'Correct factorisation', mark_value: 1, part_label: 'a' },
    { code: 'R1', profile: 'R' as const, criterion: 'Both roots stated correctly', mark_value: 1, part_label: 'b' },
  ],
  final_answer: '(3x + 1)(x - 2); x = -1/3; x = 2',
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
  archetype: 'direct-procedure' as const,
  representation: 'prose' as const,
  difficulty: 1 as const,
  marks: 1,
  parts: [{ label: 'a', prompt: 'Select the median.', marks: 1, answer: '9', response_mode: 'answer' as const }],
  worked_solution: 'Ordered already; middle value is 9.',
  misconceptions: [],
};

describe('QuestionDraftZ — structured (R1.5)', () => {
  it('accepts a valid multi-part structured question', () => {
    const res = QuestionDraftZ.safeParse(validStructured);
    expect(res.success).toBe(true);
  });

  it('rejects part marks that do not sum to marks', () => {
    const q = {
      ...validStructured,
      parts: [
        { ...validStructured.parts[0], marks: 1 },
        validStructured.parts[1],
      ],
    };
    expect(QuestionDraftZ.safeParse(q).success).toBe(false);
  });

  it('rejects rubric part_label outside the part labels', () => {
    const q = {
      ...validStructured,
      rubric: validStructured.rubric.map((r, i) => (i === 0 ? { ...r, part_label: 'c' } : r)),
    };
    expect(QuestionDraftZ.safeParse(q).success).toBe(false);
  });

  it('rejects non-sequential part labels', () => {
    const q = {
      ...validStructured,
      parts: [
        { ...validStructured.parts[0], label: 'a' },
        { ...validStructured.parts[1], label: 'c' },
      ],
    };
    expect(QuestionDraftZ.safeParse(q).success).toBe(false);
  });

  it('accepts up to 10 parts and rejects an eleventh (R1.6 §5)', () => {
    const build = (labels: string) => ({
      ...validStructured,
      marks: labels.length,
      parts: labels.split('').map((l) => ({
        label: l,
        prompt: 'p',
        marks: 1,
        answer: '1',
        response_mode: 'answer' as const,
      })),
      rubric: [
        { code: 'AK1', profile: 'AK' as const, criterion: 'c', mark_value: labels.length, part_label: 'a' },
      ],
      final_answer: labels.split('').map(() => '1').join('; '),
    });
    // Real papers flatten to 7-8 items routinely.
    expect(QuestionDraftZ.safeParse(build('abcdefgh')).success).toBe(true);
    expect(QuestionDraftZ.safeParse(build('abcdefghij')).success).toBe(true);
    expect(QuestionDraftZ.safeParse(build('abcdefghijk')).success).toBe(false);
  });

  it('rejects final_answer that is not the joined part answers', () => {
    const q = { ...validStructured, final_answer: 'x = 2' };
    expect(QuestionDraftZ.safeParse(q).success).toBe(false);
  });

  it('deriveFinalAnswer joins part answers with "; "', () => {
    expect(deriveFinalAnswer(validStructured.parts)).toBe(validStructured.final_answer);
  });

  it('rejects rubric mark_values not summing to marks', () => {
    expect(QuestionDraftZ.safeParse({ ...validStructured, marks: 5 }).success).toBe(false);
  });

  it('rejects rubric code prefix that disagrees with profile', () => {
    const q = {
      ...validStructured,
      rubric: [{ code: 'AK1', profile: 'CK', criterion: 'x', mark_value: 3, part_label: 'a' }],
      parts: [{ label: 'a', prompt: 'p', marks: 3, answer: '1', response_mode: 'answer' as const }],
      final_answer: '1',
    };
    expect(QuestionDraftZ.safeParse(q).success).toBe(false);
  });

  it('rejects objective_ids from a different module', () => {
    const q = { ...validStructured, objective_ids: ['M2.5.10'] };
    expect(QuestionDraftZ.safeParse(q).success).toBe(false);
  });
});

describe('QuestionDraftZ — representation/visual consistency', () => {
  it('requires a visual when representation is not prose', () => {
    const q = { ...validStructured, representation: 'diagram' as const };
    expect(QuestionDraftZ.safeParse(q).success).toBe(false);
  });

  it('rejects a visual on a prose question', () => {
    const q = {
      ...validStructured,
      visual: { template: 'triangleLabeled' as const, params: {} },
    };
    expect(QuestionDraftZ.safeParse(q).success).toBe(false);
  });

  it('rejects a template inconsistent with the representation', () => {
    const q = {
      ...validStructured,
      representation: 'chart' as const,
      visual: { template: 'triangleLabeled' as const, params: {} },
    };
    expect(QuestionDraftZ.safeParse(q).success).toBe(false);
  });

  it('accepts a type-consistent visual', () => {
    const q = {
      ...validStructured,
      representation: 'diagram' as const,
      visual: { template: 'triangleLabeled' as const, params: { some: 'params' } },
    };
    expect(QuestionDraftZ.safeParse(q).success).toBe(true);
  });
});

describe('QuestionDraftZ — mcq (R1.5)', () => {
  it('accepts a valid mcq question with exactly one part', () => {
    expect(QuestionDraftZ.safeParse(validMcq).success).toBe(true);
  });

  it('rejects mcq with more than one part', () => {
    const q = {
      ...validMcq,
      parts: [
        validMcq.parts[0],
        { label: 'b', prompt: 'p', marks: 1, answer: '1', response_mode: 'answer' as const },
      ],
    };
    expect(QuestionDraftZ.safeParse(q).success).toBe(false);
  });

  it('rejects mcq part marks that disagree with marks', () => {
    const q = { ...validMcq, parts: [{ ...validMcq.parts[0], marks: 2 }] };
    expect(QuestionDraftZ.safeParse(q).success).toBe(false);
  });

  it('rejects mcq without exactly 4 options', () => {
    expect(QuestionDraftZ.safeParse({ ...validMcq, options: ['7', '9', '12'] }).success).toBe(false);
  });

  it('rejects answer_key outside 0-3', () => {
    expect(QuestionDraftZ.safeParse({ ...validMcq, answer_key: 4 }).success).toBe(false);
  });

  it('rejects mcq without a top-level profile', () => {
    const { profile: _profile, ...noProfile } = validMcq;
    expect(QuestionDraftZ.safeParse(noProfile).success).toBe(false);
  });

  it('rejects missing archetype or representation', () => {
    const { archetype: _a, ...noArchetype } = validMcq;
    expect(QuestionDraftZ.safeParse(noArchetype).success).toBe(false);
    const { representation: _r, ...noRep } = validMcq;
    expect(QuestionDraftZ.safeParse(noRep).success).toBe(false);
  });
});

describe('QuestionDraftZ — response_mode and answer_format (R1.6)', () => {
  const withPart = (over: Record<string, unknown>) => ({
    ...validStructured,
    marks: 3,
    parts: [
      { ...validStructured.parts[0], ...over },
      validStructured.parts[1],
    ],
  });

  it('defaults response_mode to answer', () => {
    const { response_mode: _drop, ...bare } = validStructured.parts[0];
    const res = QuestionDraftZ.safeParse({
      ...validStructured,
      parts: [bare, validStructured.parts[1]],
    });
    expect(res.success).toBe(true);
    if (res.success && res.data.kind === 'structured') {
      expect(res.data.parts[0].response_mode).toBe('answer');
    }
  });

  it('accepts show_that and explain parts', () => {
    for (const mode of ['show_that', 'explain'] as const) {
      expect(QuestionDraftZ.safeParse(withPart({ response_mode: mode })).success, mode).toBe(true);
    }
  });

  it('rejects construct parts, which are out of scope', () => {
    const res = QuestionDraftZ.safeParse(withPart({ response_mode: 'construct' }));
    expect(res.success).toBe(false);
  });

  it('accepts every answer_format tag, including precision forms', () => {
    for (const f of ['exact', 'standard_form', 'lowest_terms', 'integer', 'surd', 'equation_form', 'sf:3', 'dp:1']) {
      expect(QuestionDraftZ.safeParse(withPart({ answer_format: f })).success, f).toBe(true);
    }
  });

  it('rejects an unknown answer_format', () => {
    expect(QuestionDraftZ.safeParse(withPart({ answer_format: 'nearest_cent' })).success).toBe(false);
    expect(QuestionDraftZ.safeParse(withPart({ answer_format: 'sf:' })).success).toBe(false);
  });
});
