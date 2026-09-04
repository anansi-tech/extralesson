import { Schema, model, models, type InferSchemaType } from 'mongoose';

/**
 * "I think this earned the mark." APPEND-ONLY and never resolved in place
 * (ROUND_4 Task 3): a dispute is a report about a marking, and it changes
 * nothing about the attempt, the transcription or mastery. Resolution is a
 * human and an email; a correction event is R5.
 */
const MarkDisputeSchema = new Schema({
  student_id: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  attempt_id: { type: Schema.Types.ObjectId, ref: 'Attempt', required: true },
  transcription_id: { type: Schema.Types.ObjectId, ref: 'Transcription', required: true },
  code: { type: String, required: true },
  ts: { type: Date, default: Date.now, required: true },
});

// Once per row: the button goes after one tap, and a second tap on a reload
// is the same report, not a louder one.
MarkDisputeSchema.index({ transcription_id: 1, code: 1 }, { unique: true });
MarkDisputeSchema.index({ ts: -1 });

export type MarkDisputeDoc = InferSchemaType<typeof MarkDisputeSchema>;
export const MarkDispute = models.MarkDispute ?? model('MarkDispute', MarkDisputeSchema);
