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
    enum: ['adaptive', 'topic', 'revisit', 'diagnostic', 'first'],
    default: 'adaptive',
  },
  started_at: { type: Date, default: Date.now, required: true },
  completed_at: { type: Date },
  /**
   * The nth session this student chose to sit (ROUND_6 Task 4). Unique per
   * student, so two starts racing for the last free session collide on the
   * index and exactly one lands. Free modes carry none.
   */
  free_slot: { type: Number },
});

SessionSchema.index({ student_id: 1, started_at: -1 });
SessionSchema.index({ student_id: 1, free_slot: 1 }, { unique: true, partialFilterExpression: { free_slot: { $exists: true } } });
// One first question per student, ever, on the index rather than on a count.
SessionSchema.index({ student_id: 1, mode: 1 }, { unique: true, partialFilterExpression: { mode: 'first' } });

export type SessionDoc = InferSchemaType<typeof SessionSchema>;
export const PracticeSession = models.PracticeSession ?? model('PracticeSession', SessionSchema);
