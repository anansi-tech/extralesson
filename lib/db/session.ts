import { Schema, model, models, type InferSchemaType } from 'mongoose';

const SessionSchema = new Schema({
  student_id: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  question_ids: { type: [Schema.Types.ObjectId], ref: 'Question', required: true },
  module_focus: { type: Number, enum: [1, 2, 3] },
  // HOW the questions were chosen, needed at the END of a session: a diagnostic
  // finishes by reporting the ranking it produced, and once the questions are
  // answered nothing else tells it apart from an ordinary session.
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
