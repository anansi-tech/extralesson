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
   * the same row. Rows taken before session tracking carry `legacy:<event_id>`,
   * which is a key and says it is not a session.
   */
  session_id: { type: String, required: true },
  /** WHAT HAPPENED TO THE MONEY. The one record; nothing else stores it. */
  state: { type: String, enum: PAYMENT_STATES, required: true },
  /** Why it is in that state, in words a person can act on. */
  state_reason: { type: String },
  state_at: { type: Date },
  /** The operator who closed it, for a state a person chose. */
  closed_by: { type: String },
  email: { type: String, lowercase: true, trim: true },
  amount_total: { type: Number },
  currency: { type: String },
  /** The student it was matched to, absent when nothing matched. */
  student_id: { type: Schema.Types.ObjectId, ref: 'Student' },
  /**
   * Written when an account is deleted and the payment kept: student_id and
   * email go, the money stays, and without a line saying so the row reads as a
   * webhook that matched nobody. Nothing here names a person.
   */
  note: { type: String },
  received_at: { type: Date, default: Date.now, required: true },
});

PaymentSchema.index({ student_id: 1, state: 1 });
PaymentSchema.index({ session_id: 1 }, { unique: true });

export type PaymentDoc = InferSchemaType<typeof PaymentSchema>;
export const Payment = models.Payment ?? model('Payment', PaymentSchema);
