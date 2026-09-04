import { Schema, model, models, type InferSchemaType } from 'mongoose';

/**
 * "Not what I wrote." APPEND-ONLY (ROUND_5 Task 2): a student can take a
 * misread line OUT of marking and never put anything in, so there is nothing
 * to game. The read itself is never mutated; markWorking skips these lines.
 * Deleted with the student through the transcription ids — no student_id here.
 */
const LineRejectedSchema = new Schema({
  transcription_id: { type: Schema.Types.ObjectId, ref: 'Transcription', required: true },
  line_index: { type: Number, required: true },
  ts: { type: Date, default: Date.now, required: true },
});

LineRejectedSchema.index({ transcription_id: 1, line_index: 1 }, { unique: true });

export type LineRejectedDoc = InferSchemaType<typeof LineRejectedSchema>;
export const LineRejected = models.LineRejected ?? model('LineRejected', LineRejectedSchema);
