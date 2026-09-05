import { Schema, model, models, type InferSchemaType } from 'mongoose';

/**
 * THE GRANT, as its own record (ROUND_6 Task 2): one per checkout session,
 * pending until the account is granted, failed when the grant threw, so a
 * redelivery retries the grant rather than reading the event as done. The
 * person is on the Payment it points at, which erasure already anonymises.
 * A refused session has no Payment: it was never ours to record as one, and
 * the row says why so /admin/access can show it.
 */
const FulfilmentSchema = new Schema({
  session_id: { type: String, required: true, unique: true },
  event_id: { type: String, required: true },
  payment_id: { type: Schema.Types.ObjectId, ref: 'Payment' },
  status: { type: String, enum: ['pending', 'granted', 'failed', 'refused'], required: true },
  reason: { type: String },
  /** The Payment Link the refused session came from, so a wrong allowlist is visible. */
  payment_link: { type: String },
  ts: { type: Date, required: true },
});

export type FulfilmentDoc = InferSchemaType<typeof FulfilmentSchema>;
export const Fulfilment = models.Fulfilment ?? model('Fulfilment', FulfilmentSchema);

/** Mongo's duplicate-key code. The ONLY error read as "someone else wrote it". */
export const isDuplicateKey = (e: unknown): boolean =>
  typeof e === 'object' && e !== null && (e as { code?: number }).code === 11000;
