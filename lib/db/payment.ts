import { Schema, model, models, type InferSchemaType } from 'mongoose';

/**
 * Every payment the webhook saw, matched or not. The event id is unique, so a
 * retry never grants twice; an email matching no account is still recorded and
 * shown on /admin/access, or a student pays and nothing traceable happens.
 */
const PaymentSchema = new Schema({
  event_id: { type: String, required: true, unique: true },
  email: { type: String, lowercase: true, trim: true },
  amount_total: { type: Number },
  currency: { type: String },
  /** Which address was used. 'payer' means the custom field was missing or
   *  misconfigured, the ROUND_2 §8e defect arriving quietly, so it is recorded
   *  and written into the grant note. */
  email_source: { type: String, enum: ['custom_field', 'payer'] },
  /** The student it was matched to, absent when nothing matched. */
  student_id: { type: Schema.Types.ObjectId, ref: 'Student' },
  /** Set by hand on the admin screen once a mismatch has been sorted out. */
  resolved_at: { type: Date },
  /**
   * Written when an account is deleted and the payment kept: student_id and
   * email go, the money stays, and without a line saying so the row reads as a
   * webhook that matched nobody. Nothing here names a person.
   */
  note: { type: String },
  received_at: { type: Date, default: Date.now, required: true },
});

PaymentSchema.index({ student_id: 1, resolved_at: 1 });

export type PaymentDoc = InferSchemaType<typeof PaymentSchema>;
export const Payment = models.Payment ?? model('Payment', PaymentSchema);
