import { Schema, model, models, type InferSchemaType } from 'mongoose';

const SessionSchema = new Schema({
  student_id: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  question_ids: { type: [Schema.Types.ObjectId], ref: 'Question', required: true },
  module_focus: { type: Number, enum: [1, 2, 3] },
  // HOW the questions were chosen. Needed at the end of a session, not the
  // start: a diagnostic finishes by reporting the ranking it just produced, and
  // nothing else can tell it apart from an ordinary session once the questions
  // are answered. Sessions written before this field existed were all the app's
  // own choice, which is what 'adaptive' means.
  mode: {
    type: String,
    enum: ['adaptive', 'topic', 'revisit', 'diagnostic'],
    default: 'adaptive',
  },
  started_at: { type: Date, default: Date.now, required: true },
  completed_at: { type: Date },
});

SessionSchema.index({ student_id: 1, started_at: -1 });

export type SessionDoc = InferSchemaType<typeof SessionSchema>;
export const PracticeSession = models.PracticeSession ?? model('PracticeSession', SessionSchema);
