import { Schema, model, models, type InferSchemaType } from 'mongoose';

// APPEND-ONLY (ROUND_1 §3.5). Never update or delete an attempt.
// All mastery/progress state is a fold over this collection.
const AttemptSchema = new Schema({
  student_id: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  question_id: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
  session_id: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
  // ONE ATTEMPT PER QUESTION IN A SESSION (ROUND_6 Task 4): the unique index
  // below is what makes a second submit a read of the first, never an insert.
  question_index: { type: Number, required: true },
  answer: { type: Schema.Types.Mixed, required: true }, // string | number
  rubric_awarded: { type: [String], required: true }, // rubric codes earned; [] | [all] for mcq
  profile_marks: {
    CK: { type: Number, required: true },
    AK: { type: Number, required: true },
    R: { type: Number, required: true },
  },
  correct: { type: Boolean, required: true },
  duration_ms: { type: Number, required: true },
  // What marked this, and what it marked: without them a marking change can be
  // described but not audited.
  grader_version: { type: String },
  question_fingerprint: { type: String },
  // The rubric this attempt was marked against, hashed and kept whole: a
  // later edit to the bank changes nothing a student was told (ROUND_6 Task 8).
  rubric_hash: { type: String },
  rubric: {
    type: [
      new Schema(
        {
          code: { type: String, required: true },
          profile: { type: String, enum: ['CK', 'AK', 'R'], required: true },
          criterion: { type: String, required: true },
          mark_value: { type: Number, required: true },
          slot_ref: { type: String, required: true },
          part_label: { type: String },
          for_format: { type: Boolean },
        },
        { _id: false },
      ),
    ],
    default: undefined,
  },
  ts: { type: Date, default: Date.now, required: true },
});

AttemptSchema.index({ student_id: 1, ts: -1 });
AttemptSchema.index({ session_id: 1, question_index: 1 }, { unique: true });

export type AttemptDoc = InferSchemaType<typeof AttemptSchema>;
export const Attempt = models.Attempt ?? model('Attempt', AttemptSchema);
