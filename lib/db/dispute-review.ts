import { Schema, model, models, type InferSchemaType } from 'mongoose';

/**
 * A PERSON LOOKED (ROUND_7 Task 3). Append-only: one row per look, never a
 * status on the dispute itself, and never a change to a mark — a correction
 * event is on the after-the-pilot list. The list reads the latest row.
 */
const DisputeReviewSchema = new Schema({
  dispute_id: { type: Schema.Types.ObjectId, ref: 'MarkDispute', required: true },
  reviewed_at: { type: Date, default: Date.now, required: true },
  note: { type: String, required: true },
});

DisputeReviewSchema.index({ dispute_id: 1, reviewed_at: -1 });

export type DisputeReviewDoc = InferSchemaType<typeof DisputeReviewSchema>;
export const DisputeReview = models.DisputeReview ?? model('DisputeReview', DisputeReviewSchema);
