import { Schema, model, models, type InferSchemaType } from 'mongoose';

/**
 * A student changed the sitting they are entered for (ROUND_9 Task 9).
 * Append-only, like attempts: the account carries the current sitting, and
 * this is how it got there. A grant is never moved by a change.
 */
const SittingChangeSchema = new Schema({
  student_id: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  from: { type: String, enum: ['jan-2027', 'may-june-2027'], required: true },
  to: { type: String, enum: ['jan-2027', 'may-june-2027'], required: true },
  ts: { type: Date, required: true },
});

SittingChangeSchema.index({ student_id: 1, ts: 1 });

export type SittingChangeDoc = InferSchemaType<typeof SittingChangeSchema>;
export const SittingChange = models.SittingChange ?? model('SittingChange', SittingChangeSchema);
