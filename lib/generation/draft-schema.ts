import { z } from 'zod';

// The structured-output contract for a draft (R1.5 §5, gate 0). Loose on
// purpose — the strict Zod boundary in lib/validation/question.ts runs after,
// so a malformed draft is rejected rather than thrown. Loose is not absent: a
// field missing HERE can never be emitted, however clearly the prompt asks.

export const MisconceptionLooseZ = z.object({ trigger: z.string(), name: z.string(), remediation: z.string() });

// R1.8 Part 1: a part is an instruction plus the slots it governs. The single
// -answer shape is still accepted so a prompt that has not caught up, or a
// question written before slots existed, still parses.
const SlotLooseZ = z.object({
  label: z.string(),
  prompt: z.string().nullish(),
  answer: z.string(),
  accept: z.array(z.string()).nullish(),
  response_mode: z.enum(['answer', 'show_that', 'explain', 'construct']).nullish(),
  answer_format: z.string().nullish(),
  rubric_codes: z.array(z.string()).nullish(),
  // The chain, declared. A field the strict schema wants but this one omits
  // cannot be emitted at all: the model only ever sees THIS shape.
  depends_on: z.array(z.string()).nullish(),
  // The objective this slot assesses; integration is counted from these.
  objective_id: z.string().nullish(),
});

export const PartLooseZ = z.object({
  label: z.string(),
  prompt: z.string(),
  // A sentence with {} where each answer goes, one gap per slot.
  statement: z.string().nullish(),
  marks: z.number(),
  slots: z.array(SlotLooseZ).nullish(),
  answer: z.string().nullish(),
  accept: z.array(z.string()).nullish(),
  response_mode: z.enum(['answer', 'show_that', 'explain', 'construct']).nullish(),
  answer_format: z.string().nullish(),
});
export const VisualLooseZ = z.object({ template: z.string(), params: z.record(z.unknown()) }).nullable();

// R3 — the GIVEN data table, for a question whose visual slot holds a figure
// the student draws. Loose like the rest; the strict boundary checks it.
export const StimulusTableLooseZ = z.record(z.unknown()).nullish();

export const McqLooseZ = z.object({
  context_category: z.string().nullish(),
  stimulus: z.string().nullable(),
  stem: z.string(),
  options: z.array(z.string()),
  answer_key: z.number(),
  profile: z.enum(['CK', 'AK', 'R']),
  visual: VisualLooseZ,
  stimulus_table: StimulusTableLooseZ,
  parts: z.array(PartLooseZ),
  worked_solution: z.string(),
  misconceptions: z.array(MisconceptionLooseZ),
});

export const StructuredLooseZ = z.object({
  context_category: z.string().nullish(),
  stimulus: z.string().nullable(),
  stem: z.string(),
  visual: VisualLooseZ,
  stimulus_table: StimulusTableLooseZ,
  parts: z.array(PartLooseZ),
  rubric: z.array(
    z.object({
      code: z.string(),
      profile: z.enum(['CK', 'AK', 'R']),
      criterion: z.string(),
      mark_value: z.number(),
      slot_ref: z.string().nullish(),
      part_label: z.string().nullish(),
      for_format: z.boolean().nullish(),
    }),
  ),
  worked_solution: z.string(),
  misconceptions: z.array(MisconceptionLooseZ),
});
