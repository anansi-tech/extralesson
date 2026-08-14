import { Schema, model, models, type InferSchemaType } from 'mongoose';

const RubricItemSchema = new Schema(
  {
    code: { type: String, required: true }, // 'CK1' | 'AK1' | 'AK2' | 'R1' ...
    profile: { type: String, enum: ['CK', 'AK', 'R'], required: true },
    criterion: { type: String, required: true },
    mark_value: { type: Number, required: true },
  },
  { _id: false },
);

const MisconceptionSchema = new Schema(
  {
    trigger: { type: String, required: true },
    name: { type: String, required: true },
    remediation: { type: String, required: true },
  },
  { _id: false },
);

// Domain validation (rubric sums, option counts, module/objective agreement)
// lives in lib/validation/question.ts — every write goes through Zod first.
const QuestionSchema = new Schema({
  objective_ids: { type: [String], required: true },
  module: { type: Number, enum: [1, 2, 3], required: true }, // denormalized; must agree with objective_ids
  kind: { type: String, enum: ['mcq', 'structured'], required: true },
  stem: { type: String, required: true }, // KaTeX-safe
  options: { type: [String] }, // mcq: exactly 4
  answer_key: { type: Number }, // mcq
  profile: { type: String, enum: ['CK', 'AK', 'R'] }, // mcq: single profile per item
  difficulty: { type: Number, enum: [1, 2, 3], required: true },
  marks: { type: Number, required: true },
  rubric: { type: [RubricItemSchema] }, // structured only
  worked_solution: { type: String, required: true },
  misconceptions: { type: [MisconceptionSchema], default: [] },
  status: { type: String, enum: ['draft', 'approved', 'retired'], default: 'draft', required: true },
  gen_meta: {
    model: { type: String, required: true },
    prompt_version: { type: String, required: true },
    verified: { type: Boolean, required: true },
    ts: { type: Date, required: true },
  },
});

QuestionSchema.index({ status: 1, module: 1 });
QuestionSchema.index({ objective_ids: 1, status: 1 });

export type QuestionDoc = InferSchemaType<typeof QuestionSchema>;
export const Question = models.Question ?? model('Question', QuestionSchema);
