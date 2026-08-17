import { Schema, model, models, type InferSchemaType } from 'mongoose';

const RubricItemSchema = new Schema(
  {
    code: { type: String, required: true }, // 'CK1' | 'AK1' | 'AK2' | 'R1' ...
    profile: { type: String, enum: ['CK', 'AK', 'R'], required: true },
    criterion: { type: String, required: true },
    mark_value: { type: Number, required: true },
    // R1.8 Part 1: the SLOT this row is earned by. Undeclared here until now,
    // so Mongoose stripped it on save and every stored rubric row lost its
    // link — the third boundary this class of bug has crossed, after the model
    // contract and the validator.
    slot_ref: { type: String, required: true },
    part_label: { type: String, default: 'a' }, // derived from slot_ref; read by the review card and the matrices
    // R1.7 §B4: this row credits the FORM of the answer, so a student who got
    // the value but not the form still earns the rest. Unstored until now, so
    // the partial-credit rows were being marked as ordinary ones.
    for_format: { type: Boolean },
  },
  { _id: false },
);

// R1.8 Part 1: an answerable slot inside a lettered part. The papers put
// several under one instruction; a part that holds one answer cannot.
const SlotSchema = new Schema(
  {
    label: { type: String, required: true }, // 'i' | 'r5.S' | 'centre'
    prompt: { type: String },
    answer: { type: String, required: true }, // values-only convention
    accept: { type: [String], default: undefined }, // mark-scheme alternatives
    response_mode: {
      type: String,
      enum: ['answer', 'show_that', 'explain', 'construct'],
      default: 'answer',
    },
    answer_format: { type: String }, // 'exact' | 'sf:3' | 'dp:1' | ...
    rubric_codes: { type: [String], default: [] },
    // Earlier slot refs whose results this slot uses. Declared, not inferred:
    // chain depth is measured from this graph, and the papers chain constantly
    // without ever saying so in the wording.
    depends_on: { type: [String], default: [] },
  },
  { _id: false },
);

const PartSchema = new Schema(
  {
    label: { type: String, required: true }, // 'a'..'j', flat
    prompt: { type: String, required: true },
    marks: { type: Number, required: true },
    slots: { type: [SlotSchema], required: true },
    // A statement completed in place, {} per gap — the paper's cloze item.
    statement: { type: String },
  },
  { _id: false },
);

// Domain validation happens at the Zod boundary; keeping these non-required
// stops Mongoose from failing saves when it materializes an empty subdocument
// on visual-less rows.
const VisualSchema = new Schema(
  {
    template: { type: String }, // TemplateName; params validated in lib/visuals
    params: { type: Schema.Types.Mixed },
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
  stimulus: { type: String }, // shared context (KaTeX-safe), R1.5
  stem: { type: String, required: true }, // KaTeX-safe
  // R1.8 Part 0: the setting, for keeping the bank varied and measurable.
  context_category: { type: String },
  visual: { type: VisualSchema, default: undefined }, // R1.5 §3
  parts: { type: [PartSchema], default: [] }, // R1.5 §2; backfilled for old rows
  archetype: {
    type: String,
    enum: [
      'multi-step-application',
      'direct-procedure',
      'interpretation',
      'justification',
      'reverse-reasoning',
      'comparison',
      'complete-the-table',
    ],
    default: 'multi-step-application',
  },
  representation: {
    type: String,
    enum: ['prose', 'diagram', 'graph', 'table', 'chart', 'venn'],
    default: 'prose',
  },
  // R1.8 §2: a whole Paper 2 question, or a short practice item. Both are
  // wanted — a drill item between paper questions is genuinely useful — but a
  // session and a matrix have to be able to tell them apart, and marks alone
  // cannot: a 9-mark drill item and a 9-mark paper question differ in whether
  // the parts go anywhere, not in size.
  shape: { type: String, enum: ['paper', 'drill'], default: 'drill' },
  options: { type: [String] }, // mcq: exactly 4
  answer_key: { type: Number }, // mcq
  profile: { type: String, enum: ['CK', 'AK', 'R'] }, // mcq: single profile per item
  difficulty: { type: Number, enum: [1, 2, 3], required: true },
  marks: { type: Number, required: true },
  rubric: { type: [RubricItemSchema] }, // structured only
  // structured only: canonical final answer, drives the §6.3 equivalence check
  // and the pipeline's independent-solve comparison (mcq uses answer_key).
  final_answer: { type: String },
  worked_solution: { type: String, required: true },
  misconceptions: { type: [MisconceptionSchema], default: [] },
  status: { type: String, enum: ['draft', 'approved', 'retired'], default: 'draft', required: true },
  // Why a question was retired outside the review flow (e.g. 'delimiter-collision').
  reject_reason: { type: String },
  gen_meta: {
    model: { type: String, required: true },
    prompt_version: { type: String, required: true },
    verified: { type: Boolean, required: true },
    ts: { type: Date, required: true },
    recipe: { type: Schema.Types.Mixed }, // R1.5: the 6-field recipe, shown to reviewers
    dedup_score: { type: Number }, // R1.5: max cosine vs approved bank (score only)
  },
});

QuestionSchema.index({ status: 1, module: 1 });
QuestionSchema.index({ objective_ids: 1, status: 1 });

export type QuestionDoc = InferSchemaType<typeof QuestionSchema>;
export const Question = models.Question ?? model('Question', QuestionSchema);
