import { describe, expect, it } from 'vitest';
import { editableDraft, EDITABLE_FIELDS } from '@/lib/admin/edit-json';
import { McqQuestionZ, StructuredQuestionZ, QuestionDraftZ } from '@/lib/validation/question';

/**
 * THE EDITOR MUST HAND BACK THE WHOLE QUESTION.
 *
 * Found on draft 411355: removing a name from the stimulus was refused with
 * "independent solve disagreed — draft: (a) $5\\sqrt{2}$ cm · solver: (a) Cannot
 * be determined". The editor's field list was written by hand and had drifted
 * from the schema by three fields, `stimulus_table` among them — so the save
 * submitted a question whose data had been removed, and the gate's solver was
 * asked to find a radius from nothing. Twelve questions were uneditable.
 *
 * `shape` was the quieter half: it carries a default, so saving a paper-shaped
 * question wrote 'drill' over it and said nothing.
 */
const objectKeys = (schema: unknown): string[] => {
  let node = schema as { _def?: { typeName?: string; schema?: unknown; innerType?: unknown }; shape?: object };
  for (let d = 0; d < 8; d++) {
    if (node?._def?.typeName === 'ZodObject' && node.shape) return Object.keys(node.shape);
    node = (node?._def?.schema ?? node?._def?.innerType) as typeof node;
    if (!node) break;
  }
  throw new Error('cannot read schema shape');
};

const TABLE = {
  caption: 'Information about the serving tray',
  headers: ['Feature', 'Information'],
  rows: [['AB', 'A diameter of the tray'], ['Area of either segment bounded by AB', '$25\\pi$ cm²']],
};

const question = (over: Record<string, unknown> = {}) => ({
  kind: 'structured',
  objective_ids: ['M3.3.9'],
  module: 3,
  stimulus: 'A restaurant server is preparing a circular serving tray.',
  stem: 'The diagram shows the tray. Use the information in the table to answer the question.',
  stimulus_table: TABLE,
  archetype: 'multi-step-application',
  representation: 'diagram',
  // A stimulus_table belongs to a question whose visual slot is a figure.
  visual: {
    template: 'circleCenter',
    params: { points: [{ label: 'A', bearing: 0, radius: true }, { label: 'B', bearing: 180, radius: true }], diameter: { from: 'A', to: 'B' } },
  },
  shape: 'paper',
  difficulty: 1,
  marks: 4,
  parts: [{ label: 'a', prompt: 'Calculate the radius of the tray.', marks: 4, slots: [{ label: 'i', answer: '$5\\sqrt{2}$ cm' }] }],
  rubric: [{ code: 'AK1', profile: 'AK', criterion: 'Forms the equation', mark_value: 4, slot_ref: 'a.i', part_label: 'a' }],
  final_answer: '$5\\sqrt{2}$ cm',
  worked_solution: 'Each segment is a semicircle, so $r=5\\sqrt{2}$.',
  misconceptions: [],
  ...over,
});

describe('the review editor carries the whole question', () => {
  it('lists every field the schema declares, so the list cannot drift', () => {
    const schemaFields = new Set([...objectKeys(McqQuestionZ), ...objectKeys(StructuredQuestionZ)]);
    expect(new Set(EDITABLE_FIELDS)).toEqual(schemaFields);
  });

  it('names the three it had lost', () => {
    for (const field of ['stimulus_table', 'shape', 'context_category']) {
      expect(EDITABLE_FIELDS, field).toContain(field);
    }
  });

  it('a question with a table survives the round trip unchanged', () => {
    const stored = question();
    const shown = JSON.parse(JSON.stringify(editableDraft(stored)));
    const saved = QuestionDraftZ.parse(shown);

    expect(saved.stimulus_table).toEqual(TABLE);
    expect((saved as { shape: string }).shape).toBe('paper');

    // Nothing is LOST on the way into the box: what the editor shows is the
    // stored question, field for field. (The schema fills nested defaults on
    // the way back out — depends_on, rubric_codes — which is its job.)
    expect(editableDraft(stored)).toEqual(stored);
    for (const field of Object.keys(stored)) expect(saved, field).toHaveProperty(field);
    expect(saved.parts[0].slots[0].answer).toBe('$5\\sqrt{2}$ cm');
  });

  it('keeps the table out of nothing: a question without one gains no empty key', () => {
    const { stimulus_table: _drop, ...noTable } = question();
    const shown = editableDraft(noTable);
    expect('stimulus_table' in shown).toBe(false);
    expect(QuestionDraftZ.parse(JSON.parse(JSON.stringify(shown))).stimulus_table).toBeUndefined();
  });

  it('does not write shape over a paper question, which a default would', () => {
    // The whole failure in one line: a field the editor omits is a field the
    // schema fills in for it.
    const { shape: _drop, ...noShape } = question();
    expect((QuestionDraftZ.parse(noShape) as { shape: string }).shape).toBe('drill');
    expect((QuestionDraftZ.parse(editableDraft(question())) as { shape: string }).shape).toBe('paper');
  });

  it('drops a visual husk carrying no template', () => {
    expect('visual' in editableDraft(question({ visual: {} }))).toBe(false);
    expect(editableDraft(question()).visual).toEqual(question().visual);
  });

  it('an MCQ keeps its own fields too', () => {
    const mcq = {
      kind: 'mcq', objective_ids: ['M2.1.1'], module: 2, stem: 'Which option gives the sample mean?',
      archetype: 'direct-procedure', representation: 'prose', difficulty: 1, marks: 1,
      options: ['2', '3', '4', '5'], answer_key: 1, profile: 'AK',
      worked_solution: 'The mean is 3.', misconceptions: [],
      parts: [{ label: 'a', prompt: 'Which option gives the sample mean?', marks: 1, slots: [{ label: 'i', answer: '3' }] }],
    };
    const saved = QuestionDraftZ.parse(JSON.parse(JSON.stringify(editableDraft(mcq))));
    expect((saved as { options: string[] }).options).toEqual(['2', '3', '4', '5']);
    expect((saved as { answer_key: number }).answer_key).toBe(1);
  });
});
