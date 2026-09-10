import { Schema, model, models, type InferSchemaType } from 'mongoose';

/**
 * A STUDENT ASKING FOR THEIR MONEY BACK (ROUND_12 Task 5). Asking is one tap
 * and deciding is a person: this records that they asked, and nothing else
 * happens until an operator refunds or dismisses it.
 *
 * ONE PER PAYMENT, enforced by the index rather than by the caller
 * remembering: a student tapping twice has asked once.
 */
const RefundRequestSchema = new Schema({
  student_id: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  payment_id: { type: Schema.Types.ObjectId, ref: 'Payment', required: true, unique: true },
  /** WHEN THEY ASKED, which is what the window is measured against — never when an operator got to it. */
  asked_at: { type: Date, required: true },
  state: { type: String, enum: ['open', 'resolved'], required: true },
  resolved_at: { type: Date },
  resolved_by: { type: String },
  /** Why it closed: the refund that completed, or the operator's reason for dismissing it. */
  resolution_reason: { type: String },
});

export type RefundRequestDoc = InferSchemaType<typeof RefundRequestSchema>;
export const RefundRequest = models.RefundRequest ?? model('RefundRequest', RefundRequestSchema);
