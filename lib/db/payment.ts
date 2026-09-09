import { Schema, model, models, type InferSchemaType } from 'mongoose';
import { PAYMENT_STATES } from '@/lib/payment-state';

/**
 * Every payment the webhook saw, matched or not. The event id is unique, so a
 * retry never grants twice; an email matching no account is still recorded and
 * shown on /admin/access, or a student pays and nothing traceable happens.
 */
const PaymentSchema = new Schema({
  event_id: { type: String, required: true, unique: true },
  /**
   * ONE PAYMENT PER CHECKOUT SESSION (ROUND_11). An event id identifies a
   * delivery, not a payment: Stripe redelivers, and a redelivery must find
   * the same row. Optional while rows written before R11 have none; required
   * with a full unique index once the migration has resolved every row.
   */
  session_id: { type: String },
  /** What happened to the money. Written alongside the old fields; read after Task 5. */
  state: { type: String, enum: PAYMENT_STATES },
  /** Why it is in that state, in words a person can act on. */
  state_reason: { type: String },
  state_at: { type: Date },
  /** The operator who closed it, for a state a person chose. */
  closed_by: { type: String },
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
// PARTIAL, over populated values only: rows written before R11 have no
// session_id, and a full unique index would either reject them or collide on
// their absence. It becomes a full unique index in Task 5's second commit.
PaymentSchema.index({ session_id: 1 }, { unique: true, partialFilterExpression: { session_id: { $type: 'string' } } });

export type PaymentDoc = InferSchemaType<typeof PaymentSchema>;
export const Payment = models.Payment ?? model('Payment', PaymentSchema);
