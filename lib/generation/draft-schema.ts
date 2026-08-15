import { z } from 'zod';

// The structured-output contract for a draft (R1.5 §5, gate 0).
//
// Loose on purpose: the strict Zod boundary in lib/validation/question.ts runs
// afterwards so a malformed draft is logged and rejected rather than thrown.
// But loose is not the same as absent — a field missing HERE can never be
// emitted by the model, however clearly the prompt asks for it. The first R1.6
// batch came back with 71 parts all defaulted to response_mode 'answer' and no
// answer_format anywhere, because these two fields were documented in the
// prompt and missing from this schema.

export const MisconceptionLooseZ = z.object({ trigger: z.string(), name: z.string(), remediation: z.string() });

export const PartLooseZ = z.object({
  label: z.string(),
  prompt: z.string(),
  marks: z.number(),
  answer: z.string(),
  accept: z.array(z.string()).nullish(),
  response_mode: z.enum(['answer', 'show_that', 'explain', 'construct']).nullish(),
  answer_format: z.string().nullish(),
});
export const VisualLooseZ = z.object({ template: z.string(), params: z.record(z.unknown()) }).nullable();

export const McqLooseZ = z.object({
  stimulus: z.string().nullable(),
  stem: z.string(),
  options: z.array(z.string()),
  answer_key: z.number(),
  profile: z.enum(['CK', 'AK', 'R']),
  visual: VisualLooseZ,
  parts: z.array(PartLooseZ),
  worked_solution: z.string(),
  misconceptions: z.array(MisconceptionLooseZ),
});

export const StructuredLooseZ = z.object({
  stimulus: z.string().nullable(),
  stem: z.string(),
  visual: VisualLooseZ,
  parts: z.array(PartLooseZ),
  rubric: z.array(
    z.object({
      code: z.string(),
      profile: z.enum(['CK', 'AK', 'R']),
      criterion: z.string(),
      mark_value: z.number(),
      part_label: z.string(),
    }),
  ),
  worked_solution: z.string(),
  misconceptions: z.array(MisconceptionLooseZ),
});
