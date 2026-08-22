import { describe, expect, it } from 'vitest';
import { PartLooseZ, StructuredLooseZ } from '@/lib/generation/draft-schema';
import { QuestionDraftZ } from '@/lib/validation/question';

// A field the model is asked for in the prompt but cannot return through the
// structured-output schema is a field that will always be missing. That is how
// the first R1.6 batch produced 71 parts with response_mode defaulted.
describe('draft schema — the model can return every field the prompt asks for', () => {
  it('carries response_mode and answer_format through', () => {
    const part = PartLooseZ.parse({
      label: 'b',
      prompt: 'Show that the interior angle is $108°$.',
      marks: 3,
      answer: '108°',
      response_mode: 'show_that',
      answer_format: 'dp:1',
    });
    expect(part.response_mode).toBe('show_that');
    expect(part.answer_format).toBe('dp:1');
  });

  it('still accepts a part that omits them, so older prompts keep working', () => {
    const part = PartLooseZ.parse({ label: 'a', prompt: 'Find $x$.', marks: 2, slots: [{ label: 'i', answer: '4' }] });
    expect(part.response_mode ?? 'answer').toBe('answer');
  });

  it('every part field in the loose schema survives the strict boundary', () => {
    const draft = {
      stimulus: null,
      stem: 'The diagram shows a regular pentagon $ABCDE$.',
      visual: null,
      parts: [
        { label: 'a', prompt: 'State the sum of the interior angles.', marks: 2, slots: [{ label: 'i', answer: '540°', response_mode: 'answer' as const }] },
        { label: 'b', prompt: 'Explain why it has five lines of symmetry.', marks: 3, slots: [{ label: 'i', answer: 'each passes through a vertex and the midpoint of the opposite side', response_mode: 'explain' as const }] },
        { label: 'c', prompt: 'Give the exterior angle.', marks: 2, slots: [{ label: 'i', answer: '72°', response_mode: 'answer' as const, answer_format: 'dp:1' as const }] },
      ],
      rubric: [
        { code: 'CK1', profile: 'CK' as const, criterion: 'Uses the angle sum', mark_value: 2, slot_ref: 'a.i', part_label: 'a' },
        { code: 'R1', profile: 'R' as const, criterion: 'Explains the symmetry', mark_value: 3, slot_ref: 'b.i', part_label: 'b' },
        { code: 'AK1', profile: 'AK' as const, criterion: 'Computes the exterior angle', mark_value: 1, slot_ref: 'c.i', part_label: 'c' },
        // Part (c) declares dp:1, so a row has to pay for the form.
        { code: 'R2', profile: 'R' as const, criterion: "Gives 'their' angle to 1 decimal place", mark_value: 1, slot_ref: 'c.i', part_label: 'c', for_format: true },
      ],
      worked_solution: 'Interior angles sum to $540°$.\n\nEach line of symmetry joins a vertex to the opposite midpoint.\n\nThe exterior angle is $72°$.',
      misconceptions: [{ trigger: '360°', name: 'Uses the exterior-angle sum', remediation: 'The interior sum is $(n-2)\\times 180°$.' }],
    };
    expect(StructuredLooseZ.safeParse(draft).success).toBe(true);

    const strict = QuestionDraftZ.parse({
      ...draft,
      kind: 'structured',
      module: 2,
      objective_ids: ['M2.4.5'],
      archetype: 'multi-step-application',
      representation: 'prose',
      difficulty: 2,
      marks: 7,
      stimulus: undefined,
      visual: undefined,
      final_answer: '540°; each passes through a vertex and the midpoint of the opposite side; 72°',
    });
    expect(strict.parts.map((p) => p.slots[0].response_mode)).toEqual(['answer', 'explain', 'answer']);
    expect(strict.parts[2].slots[0].answer_format).toBe('dp:1');
  });
});

// A model fills every key the schema declares, so an "absent" optional arrives
// as null. R1.7 shipped for_format as .optional(), which accepts undefined and
// rejects null, and every structured draft generated afterwards died at the
// boundary on rubric rows that simply had no form mark — 48 attempts in one run.
describe('the strict boundary treats null as absent, because that is how it arrives', () => {
  const draftWithNulls = {
    kind: 'structured' as const,
    module: 1 as const,
    objective_ids: ['M1.6.2'],
    archetype: 'justification' as const,
    representation: 'prose' as const,
    difficulty: 1 as const,
    marks: 4,
    stem: 'A line passes through $(0, 3)$ and $(2, 7)$.',
    parts: [
      { label: 'a', prompt: 'Find the gradient.', marks: 2, slots: [{ label: 'i', answer: '2', accept: null, answer_format: null, response_mode: null }] },
      { label: 'b', prompt: 'Write the equation of the line.', marks: 2, slots: [{ label: 'i', answer: 'y = 2x + 3', accept: null, answer_format: null, response_mode: null }] },
    ],
    rubric: [
      { code: 'AK1', profile: 'AK' as const, criterion: 'Computes the gradient', mark_value: 2, slot_ref: 'a.i', part_label: 'a', for_format: null },
      { code: 'R1', profile: 'R' as const, criterion: 'Forms the equation of the line', mark_value: 2, slot_ref: 'b.i', part_label: 'b', for_format: null },
    ],
    final_answer: '2; y = 2x + 3',
    worked_solution: 'Gradient is $2$.\n\nThe line is $y = 2x + 3$.',
    misconceptions: [{ trigger: '0.5', name: 'Inverts the gradient', remediation: 'Rise over run, not run over rise.' }],
  };

  it('accepts a draft whose unused optionals came back as null', () => {
    const parsed = QuestionDraftZ.safeParse(draftWithNulls);
    expect(parsed.success, JSON.stringify(parsed.error?.issues)).toBe(true);
  });

  it('normalises those nulls away rather than storing them', () => {
    const q = QuestionDraftZ.parse(draftWithNulls);
    const structured = q as Extract<typeof q, { kind: 'structured' }>;
    for (const r of structured.rubric) expect(r.for_format).toBeUndefined();
    for (const p of structured.parts) {
      expect(p.slots[0].accept).toBeUndefined();
      expect(p.slots[0].answer_format).toBeUndefined();
      expect(p.slots[0].response_mode).toBe('answer');
    }
  });

  it('still reads a real value where the model set one', () => {
    const q = QuestionDraftZ.parse({
      ...draftWithNulls,
      parts: [
        {
          ...draftWithNulls.parts[0],
          // the values live on the slot now, where the marking reads them
          slots: [{ ...draftWithNulls.parts[0].slots[0], answer_format: 'sf:3', accept: ['2.00'] }],
        },
        draftWithNulls.parts[1],
      ],
      rubric: [
        { ...draftWithNulls.rubric[0], for_format: true },
        draftWithNulls.rubric[1],
      ],
    });
    const structured = q as Extract<typeof q, { kind: 'structured' }>;
    expect(structured.parts[0].slots[0].answer_format).toBe('sf:3');
    expect(structured.parts[0].slots[0].accept).toEqual(['2.00']);
    expect(structured.rubric[0].for_format).toBe(true);
  });
});
