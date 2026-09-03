import { Schema, model, models, type InferSchemaType } from 'mongoose';

// APPEND-ONLY (ROUND_1 §3.5). Never update or delete an attempt.
// All mastery/progress state is a fold over this collection.
const AttemptSchema = new Schema({
  student_id: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  question_id: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
  session_id: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
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
  ts: { type: Date, default: Date.now, required: true },
});

AttemptSchema.index({ student_id: 1, ts: -1 });

export type AttemptDoc = InferSchemaType<typeof AttemptSchema>;
export const Attempt = models.Attempt ?? model('Attempt', AttemptSchema);
