import { Schema, model, models, type InferSchemaType } from 'mongoose';

const SessionSchema = new Schema({
  student_id: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  question_ids: { type: [Schema.Types.ObjectId], ref: 'Question', required: true },
  module_focus: { type: Number, enum: [1, 2, 3] },
  started_at: { type: Date, default: Date.now, required: true },
  completed_at: { type: Date },
});

SessionSchema.index({ student_id: 1, started_at: -1 });

export type SessionDoc = InferSchemaType<typeof SessionSchema>;
export const PracticeSession = models.PracticeSession ?? model('PracticeSession', SessionSchema);
