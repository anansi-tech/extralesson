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
    const part = PartLooseZ.parse({ label: 'a', prompt: 'Find $x$.', marks: 2, answer: '4' });
    expect(part.response_mode ?? 'answer').toBe('answer');
  });

  it('every part field in the loose schema survives the strict boundary', () => {
    const draft = {
      stimulus: null,
      stem: 'The diagram shows a regular pentagon $ABCDE$.',
      visual: null,
      parts: [
        { label: 'a', prompt: 'State the sum of the interior angles.', marks: 2, answer: '540°', response_mode: 'answer' as const },
        { label: 'b', prompt: 'Explain why it has five lines of symmetry.', marks: 3, answer: 'each passes through a vertex and the midpoint of the opposite side', response_mode: 'explain' as const },
        { label: 'c', prompt: 'Give the exterior angle.', marks: 2, answer: '72°', response_mode: 'answer' as const, answer_format: 'dp:1' as const },
      ],
      rubric: [
        { code: 'CK1', profile: 'CK' as const, criterion: 'Uses the angle sum', mark_value: 2, part_label: 'a' },
        { code: 'R1', profile: 'R' as const, criterion: 'Explains the symmetry', mark_value: 3, part_label: 'b' },
        { code: 'AK1', profile: 'AK' as const, criterion: 'Computes the exterior angle', mark_value: 2, part_label: 'c' },
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
    expect(strict.parts.map((p) => p.response_mode)).toEqual(['answer', 'explain', 'answer']);
    expect(strict.parts[2].answer_format).toBe('dp:1');
  });
});
