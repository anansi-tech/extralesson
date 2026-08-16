import { describe, expect, it } from 'vitest';
import { deriveFinalAnswer, PartZ, QuestionDraftZ } from '@/lib/validation/question';

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

  // Policy changed in R1.7: an unknown format is dropped rather than fatal.
  // "nearest_cent" and "set_builder_notation" are real demands we have no
  // checker for, and discarding a sound question over its label cost seven
  // attempts on one topic in a live run.
  it('drops an unknown answer_format but keeps the question', () => {
    for (const f of ['nearest_cent', 'sf:']) {
      const parsed = QuestionDraftZ.safeParse(withPart({ answer_format: f }));
      expect(parsed.success, f).toBe(true);
      const q = parsed.success ? parsed.data : null;
      expect(q && 'parts' in q ? q.parts[0].answer_format : 'unset', f).toBeUndefined();
    }
  });
});

// R1.6 §1 — a part's mode is a property of what it asks. The first R1.6 batch
// came back with every part labelled 'answer', including ones reading "Explain
// why…"; auto-marking a "Show that" part would pass a student who copied the
// result out of the stem and wrote nothing.
describe('response_mode is read from the wording, not just the label', () => {
  const part = (prompt: string, response_mode?: 'answer' | 'show_that' | 'explain') =>
    PartZ.parse({ label: 'a', prompt, marks: 2, answer: '5', ...(response_mode ? { response_mode } : {}) });

  it('recognises a show-that part however the model labelled it', () => {
    expect(part('Show that $P = M^2 - 2M$.').response_mode).toBe('show_that');
    expect(part('Prove that the triangles are congruent.').response_mode).toBe('show_that');
    expect(part('(b) Show that the interior angle is $108°$.', 'answer').response_mode).toBe('show_that');
  });

  it('recognises a part that asks for a reason', () => {
    expect(part('Explain why the hexagon has rotational symmetry of order 6.').response_mode).toBe('explain');
    expect(part('Give a reason for your answer.').response_mode).toBe('explain');
    expect(part('State ONE reason your answer to (b) is an estimate.').response_mode).toBe('explain');
    expect(part('Justify your conclusion.').response_mode).toBe('explain');
  });

  it('leaves an ordinary part alone', () => {
    expect(part('Calculate the area of the shaded region.').response_mode).toBe('answer');
    expect(part('Show your working and state the value of $x$.').response_mode).toBe('answer');
    expect(part('Find the value of $fg(3)$.').response_mode).toBe('answer');
  });

  it('never weakens a mode the model set deliberately', () => {
    expect(part('Calculate the area.', 'explain').response_mode).toBe('explain');
    expect(part('Find $x$.', 'show_that').response_mode).toBe('show_that');
  });
});

// A generation run lost seven attempts on one topic because the model tagged an
// inequality answer "set_builder_notation" — a real demand we have no checker
// for. The question was fine; only the label was unknown.
describe('answer_format we do not recognise drops out, and the question survives', () => {
  const part = (answer_format: unknown) =>
    PartZ.parse({ label: 'a', prompt: 'Solve the inequality.', marks: 2, answer: 'x > 3', answer_format });

  it('keeps every format we can actually mark', () => {
    for (const f of ['exact', 'standard_form', 'lowest_terms', 'integer', 'surd', 'equation_form', 'sf:3', 'dp:1']) {
      expect(part(f).answer_format, f).toBe(f);
    }
  });

  it('drops a value we have no checker for rather than failing the part', () => {
    for (const f of ['set_builder_notation', 'ratio', 'bearing', 'sf:three', 'dp', '']) {
      expect(part(f).answer_format, f).toBeUndefined();
    }
  });

  it('leaves the part otherwise intact, so the demand still reaches the student', () => {
    const p = PartZ.parse({
      label: 'a',
      prompt: 'Write the solution set in set-builder notation.',
      marks: 2,
      answer: '\\{x : x > 3\\}',
      answer_format: 'set_builder_notation',
    });
    expect(p.answer_format).toBeUndefined();
    expect(p.prompt).toContain('set-builder notation');
    expect(p.answer).toBe('\\{x : x > 3\\}');
  });
});

// A named grid in sketch mode has no axes, gridlines or scale numbers: it is a
// schematic, and a run lost nine of twelve attempts because the template hints
// offered it for a diagram while the boundary called it a graph.
describe('a named sketch counts as a diagram', () => {
  const withVisual = (representation: string, params: Record<string, unknown>) => ({
    kind: 'mcq' as const,
    module: 3 as const,
    objective_ids: ['M3.3.2'],
    archetype: 'direct-procedure' as const,
    representation,
    difficulty: 1 as const,
    marks: 1,
    stem: "Triangle $ABC$ has $A(1,1)$, $B(3,1)$ and $C(2,3)$, and maps to $A'(5,-1)$.",
    options: ['a', 'b', 'c', 'd'],
    answer_key: 0,
    profile: 'AK' as const,
    visual: { template: 'coordinateGrid', params },
    parts: [{ label: 'a', prompt: 'Select the vector.', marks: 1, answer: 'a' }],
    final_answer: 'a',
    worked_solution: 'The vector is $(4,-2)$.',
    misconceptions: [],
  });

  const sketch = { named: { polygons: [{ points: ['A', 'B', 'C'] }] } };
  const plotted = { x_range: [-5, 8], y_range: [-3, 6], points: [{ x: 1, y: 1, label: 'A' }] };

  it('accepts a named sketch declared as a diagram', () => {
    expect(QuestionDraftZ.safeParse(withVisual('diagram', sketch)).success).toBe(true);
  });

  it('still accepts it declared as a graph', () => {
    expect(QuestionDraftZ.safeParse(withVisual('graph', sketch)).success).toBe(true);
  });

  it('refuses a plotted grid called a diagram — that one really is a graph', () => {
    expect(QuestionDraftZ.safeParse(withVisual('diagram', plotted)).success).toBe(false);
  });

  it('refuses sketch: false under diagram, since the axes are the point', () => {
    const explicit = { named: { polygons: [{ points: ['A', 'B', 'C'] }], sketch: false } };
    expect(QuestionDraftZ.safeParse(withVisual('diagram', explicit)).success).toBe(false);
  });
});
