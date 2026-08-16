import { describe, expect, it } from 'vitest';
import { QuestionDraftZ, deriveFinalAnswer } from '@/lib/validation/question';
import { markStructuredParts, markableSlots } from '@/lib/grade/mark';
import type { RubricItem } from '@/lib/types';

// R1.8 Part 1 — the papers put several answerable things under one instruction.
// A part that holds one answer can only render those as unrelated parts.

const transformation = {
  kind: 'structured' as const,
  module: 3 as const,
  objective_ids: ['M3.3.5'],
  archetype: 'interpretation' as const,
  representation: 'prose' as const,
  difficulty: 2 as const,
  marks: 5,
  stem: 'Shape $P$ is mapped onto shape $Q$.',
  parts: [
    {
      label: 'a',
      prompt: 'Describe fully the single transformation that maps $P$ onto $Q$.',
      marks: 3,
      slots: [
        { label: 'type', answer: 'enlargement', rubric_codes: ['CK1'] },
        { label: 'centre', answer: '(1, 2)', rubric_codes: ['AK1'] },
        { label: 'factor', answer: '3', rubric_codes: ['AK2'] },
      ],
    },
    {
      label: 'b',
      prompt: 'State the area factor, and explain your answer.',
      marks: 2,
      slots: [
        { label: 'i', answer: '9', rubric_codes: ['AK3'] },
        { label: 'ii', prompt: 'Explain why.', answer: 'area scales by the square of the scale factor', rubric_codes: ['R1'] },
      ],
    },
  ],
  rubric: [
    { code: 'CK1', profile: 'CK' as const, criterion: 'Names the transformation', mark_value: 1, slot_ref: 'a.type' },
    { code: 'AK1', profile: 'AK' as const, criterion: 'Gives the centre', mark_value: 1, slot_ref: 'a.centre' },
    { code: 'AK2', profile: 'AK' as const, criterion: 'Gives the scale factor', mark_value: 1, slot_ref: 'a.factor' },
    { code: 'AK3', profile: 'AK' as const, criterion: 'CAO 9', mark_value: 1, slot_ref: 'b.i' },
    { code: 'R1', profile: 'R' as const, criterion: 'Explains the squaring', mark_value: 1, slot_ref: 'b.ii' },
  ],
  final_answer: 'enlargement; (1, 2); 3; 9; area scales by the square of the scale factor',
  worked_solution: 'The centre is $(1, 2)$ and the factor is $3$, so areas scale by $9$.',
  misconceptions: [],
};

describe('slots — several answerable things under one instruction', () => {
  it('accepts a part governing three descriptor slots', () => {
    const parsed = QuestionDraftZ.safeParse(transformation);
    expect(parsed.success, JSON.stringify(parsed.error?.issues?.[0])).toBe(true);
  });

  it('derives the final answer across every slot, in order', () => {
    expect(deriveFinalAnswer(transformation.parts)).toBe(transformation.final_answer);
  });

  it('rejects a rubric row pointing at a slot that does not exist', () => {
    const bad = {
      ...transformation,
      rubric: [{ ...transformation.rubric[0], slot_ref: 'a.nonexistent' }, ...transformation.rubric.slice(1)],
    };
    const parsed = QuestionDraftZ.safeParse(bad);
    expect(parsed.success).toBe(false);
    expect(JSON.stringify(parsed.error?.issues)).toContain('not one of the question');
  });

  it('rejects duplicate slot labels within a part', () => {
    const bad = {
      ...transformation,
      parts: [
        { ...transformation.parts[0], slots: [transformation.parts[0].slots[0], transformation.parts[0].slots[0]] },
        transformation.parts[1],
      ],
    };
    expect(QuestionDraftZ.safeParse(bad).success).toBe(false);
  });
});

describe('slots — marking is per slot', () => {
  const q = QuestionDraftZ.parse(transformation) as Extract<
    ReturnType<typeof QuestionDraftZ.parse>,
    { kind: 'structured' }
  >;
  const rubric = q.rubric as RubricItem[];

  it('marks the transformation description, which used to be self-marked prose', () => {
    const res = markStructuredParts(rubric, q.parts, [
      { ref: 'a.type', answer: 'enlargement', working: '' },
      { ref: 'a.centre', answer: '(1,2)', working: '' },
      { ref: 'a.factor', answer: '3', working: '' },
      { ref: 'b.i', answer: '9', working: '' },
    ]);
    expect(res.profile_marks).toEqual({ CK: 1, AK: 3, R: 0 });
    expect(res.rubric_awarded).toEqual(['CK1', 'AK1', 'AK2', 'AK3']);
  });

  it('gives partial credit when one descriptor is wrong', () => {
    const res = markStructuredParts(rubric, q.parts, [
      { ref: 'a.type', answer: 'enlargement', working: '' },
      { ref: 'a.centre', answer: '(0, 0)', working: '' },
      { ref: 'a.factor', answer: '3', working: '' },
      { ref: 'b.i', answer: '9', working: '' },
    ]);
    expect(res.correct).toBe(false);
    expect(res.rubric_awarded).toContain('CK1');
    expect(res.rubric_awarded).not.toContain('AK1');
    expect(res.profile_marks.AK).toBe(2);
  });

  it('an explain slot no longer exiles the part it sits in', () => {
    // b.ii is prose the student self-marks; b.i is still marked here.
    expect(markableSlots(q.parts)).toEqual(['a.type', 'a.centre', 'a.factor', 'b.i']);
    const res = markStructuredParts(rubric, q.parts, [
      { ref: 'a.type', answer: 'enlargement', working: '' },
      { ref: 'a.centre', answer: '(1, 2)', working: '' },
      { ref: 'a.factor', answer: '3', working: '' },
      { ref: 'b.i', answer: '9', working: '' },
    ]);
    expect(res.correct).toBe(true);
    expect(res.rubric_awarded).not.toContain('R1'); // self-marked, never awarded here
  });
});

describe('slots — a question written the old way still works', () => {
  const legacy = {
    ...transformation,
    marks: 2,
    parts: [{ label: 'a', prompt: 'Find $x$.', marks: 2, answer: '4', response_mode: 'answer' }],
    rubric: [{ code: 'AK1', profile: 'AK' as const, criterion: 'CAO 4', mark_value: 2, part_label: 'a' }],
    final_answer: '4',
  };

  it('lifts a one-answer part into a single slot', () => {
    const parsed = QuestionDraftZ.safeParse(legacy);
    expect(parsed.success, JSON.stringify(parsed.error?.issues?.[0])).toBe(true);
    const q = parsed.success ? parsed.data : null;
    const parts = q && 'parts' in q ? q.parts : [];
    expect(parts[0].slots).toHaveLength(1);
    expect(parts[0].slots[0]).toMatchObject({ label: 'i', answer: '4', response_mode: 'answer' });
  });

  it('points its rubric row at that slot, and keeps part_label for every existing reader', () => {
    const q = QuestionDraftZ.parse(legacy) as Extract<ReturnType<typeof QuestionDraftZ.parse>, { kind: 'structured' }>;
    expect(q.rubric[0].slot_ref).toBe('a.i');
    expect(q.rubric[0].part_label).toBe('a');
  });
});

// A dry run rejected two of three drafts because the slot label pattern refused
// the keys the model naturally writes for "several named things at once", and
// the solver answered per part where we had asked per slot.
describe('slot labels are the words they name', () => {
  const withLabel = (label: string) =>
    QuestionDraftZ.safeParse({
      ...transformation,
      marks: 1,
      parts: [{ label: 'a', prompt: 'State each measure.', marks: 1, slots: [{ label, answer: '4', rubric_codes: ['CK1'] }] }],
      rubric: [{ code: 'CK1', profile: 'CK' as const, criterion: 'CAO 4', mark_value: 1, slot_ref: `a.${label}` }],
      final_answer: '4',
    }).success;

  it('accepts the descriptive keys a statistics question needs', () => {
    for (const l of ['modal_class', 'interquartile_range', 'semi_interquartile_range', 'centre', 'i', 'ii', 'r5.S']) {
      expect(withLabel(l), l).toBe(true);
    }
  });

  it('still refuses a label that is prose rather than a key', () => {
    expect(withLabel('the modal class of the distribution shown above')).toBe(false);
    expect(withLabel('has spaces')).toBe(false);
  });
});

// R1.8 — the image of $P$ is called $P'$, and that name IS the natural slot
// key. The label charset forbade the prime, so two of the three schema
// rejections in the first paper-shaped batch were the model doing exactly what
// the prompt asks of it; both topics involved fell below 50% acceptance on that
// alone.
describe('slot labels — a prime is part of the name', () => {
  const imageVertices = (labels: string[]) => ({
    ...transformation,
    marks: labels.length,
    final_answer: labels.map((_, i) => `(${i + 1}, ${i + 2})`).join('; '),
    parts: [
      {
        label: 'a',
        prompt: 'State the coordinates of the image of each vertex.',
        marks: labels.length,
        slots: labels.map((label, i) => ({
          label,
          answer: `(${i + 1}, ${i + 2})`,
          rubric_codes: [`AK${i + 1}`],
        })),
      },
    ],
    rubric: labels.map((label, i) => ({
      code: `AK${i + 1}`,
      profile: 'AK' as const,
      criterion: `Gives the image vertex (${i + 1}, ${i + 2})`,
      mark_value: 1,
      slot_ref: `a.${label}`,
    })),
  });

  it('accepts image-vertex slot labels', () => {
    const res = QuestionDraftZ.safeParse(imageVertices(["P'", "Q'", "R'"]));
    expect(res.success, JSON.stringify(res.error?.issues)).toBe(true);
  });

  it('accepts a double prime, which a second transformation produces', () => {
    expect(QuestionDraftZ.safeParse(imageVertices(["P''", "Q''"])).success).toBe(true);
  });

  it('accepts the typographic prime as well as the apostrophe', () => {
    // Both appear in the papers, sometimes within one paper.
    expect(QuestionDraftZ.safeParse(imageVertices(['A\u2032', 'B\u2033'])).success).toBe(true);
  });

  it('accepts an indexed name, as a line or a term carries', () => {
    expect(QuestionDraftZ.safeParse(imageVertices(['L1', 'L\u2082'])).success).toBe(true);
  });

  it('accepts a Greek letter, which is how an angle is named', () => {
    expect(QuestionDraftZ.safeParse(imageVertices(['\u03b8', '\u03c6'])).success).toBe(true);
  });

  it('still rejects a label that is not a name at all', () => {
    expect(QuestionDraftZ.safeParse(imageVertices(['a b'])).success).toBe(false);
    expect(QuestionDraftZ.safeParse(imageVertices(['$x$'])).success).toBe(false);
    expect(QuestionDraftZ.safeParse(imageVertices(['(i)'])).success).toBe(false);
  });
});

// A statement the student completes in place. The papers set this repeatedly —
// "The regular octagon has {} lines of symmetry and rotational symmetry of
// order {}." — and it is one item, not the two questions it would otherwise be
// split into: reading the sentence as a whole is part of the work.
describe('cloze parts — a statement completed in place', () => {
  const cloze = (statement: string, slots: string[]) => ({
    ...transformation,
    marks: slots.length,
    final_answer: slots.join('; '),
    parts: [
      {
        label: 'a',
        prompt: 'Complete the statement below.',
        marks: slots.length,
        statement,
        slots: slots.map((answer, i) => ({
          label: ['i', 'ii', 'iii'][i],
          answer,
          rubric_codes: [`CK${i + 1}`],
        })),
      },
    ],
    rubric: slots.map((_, i) => ({
      code: `CK${i + 1}`,
      profile: 'CK' as const,
      criterion: `States the value in gap ${i + 1}`,
      mark_value: 1,
      slot_ref: `a.${['i', 'ii', 'iii'][i]}`,
    })),
  });

  it('accepts a statement with one gap per slot', () => {
    const res = QuestionDraftZ.safeParse(
      cloze('The regular octagon has {} lines of symmetry and rotational symmetry of order {}.', ['8', '8']),
    );
    expect(res.success, JSON.stringify(res.error?.issues)).toBe(true);
  });

  it('rejects a statement with more gaps than slots', () => {
    const res = QuestionDraftZ.safeParse(cloze('It has {} lines and order {}.', ['8']));
    expect(res.success).toBe(false);
    expect(JSON.stringify(res.error?.issues)).toContain('2 gap(s) for 1 slot(s)');
  });

  it('rejects a statement with no gap at all, which nobody can complete', () => {
    const res = QuestionDraftZ.safeParse(cloze('The regular octagon has 8 lines of symmetry.', ['8']));
    expect(res.success).toBe(false);
    expect(JSON.stringify(res.error?.issues)).toContain('at least one {} gap');
  });

  it('leaves an ordinary part alone: statement is optional', () => {
    const res = QuestionDraftZ.safeParse(transformation);
    expect(res.success).toBe(true);
  });
});
