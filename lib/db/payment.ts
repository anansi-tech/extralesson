import { Schema, model, models, type InferSchemaType } from 'mongoose';

/**
 * EVERY PAYMENT THE WEBHOOK SAW, matched or not.
 *
 * Two jobs. Idempotency: Stripe retries until it gets a 2xx, so the event id is
 * unique and a repeat is recognised rather than granting twice. And the
 * unmatched pile: a payment whose email belongs to no account is recorded and
 * shown on /admin/access, because the alternative is a student who has paid and
 * no trace of why nothing happened.
 */
const PaymentSchema = new Schema({
  event_id: { type: String, required: true, unique: true },
  email: { type: String, lowercase: true, trim: true },
  amount_total: { type: Number },
  currency: { type: String },
  /** What the payment LINK mapped to, when a mapping exists. Evidence only —
   *  the sitting granted is the one the student registered for. */
  sitting: { type: String, enum: ['jan-2027', 'may-june-2027'] },
  /** Which address was used. 'payer' means the Stripe custom field was missing
   *  or misconfigured, which is the §8e defect arriving quietly — so it is
   *  recorded and written into the grant note. Absent on payments taken before
   *  this field existed; there are none, the collection was empty. */
  email_source: { type: String, enum: ['custom_field', 'payer'] },
  /** The student it was matched to, absent when nothing matched. */
  student_id: { type: Schema.Types.ObjectId, ref: 'Student' },
  /** Set by hand on the admin screen once a mismatch has been sorted out. */
  resolved_at: { type: Date },
  received_at: { type: Date, default: Date.now, required: true },
});

PaymentSchema.index({ student_id: 1, resolved_at: 1 });

export type PaymentDoc = InferSchemaType<typeof PaymentSchema>;
export const Payment = models.Payment ?? model('Payment', PaymentSchema);
