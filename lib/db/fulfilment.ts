import { Schema, model, models, type InferSchemaType } from 'mongoose';

/**
 * THE GRANT, as its own record (ROUND_6 Task 2): one per checkout session,
 * pending until the account is granted, failed when the grant threw, so a
 * redelivery retries the grant rather than reading the event as done. The
 * person is on the Payment it points at, which erasure already anonymises.
 */
const FulfilmentSchema = new Schema({
  session_id: { type: String, required: true, unique: true },
  event_id: { type: String, required: true },
  payment_id: { type: Schema.Types.ObjectId, ref: 'Payment', required: true },
  status: { type: String, enum: ['pending', 'granted', 'failed'], required: true },
  reason: { type: String },
  ts: { type: Date, required: true },
});

export type FulfilmentDoc = InferSchemaType<typeof FulfilmentSchema>;
export const Fulfilment = models.Fulfilment ?? model('Fulfilment', FulfilmentSchema);

/** Mongo's duplicate-key code. The ONLY error read as "someone else wrote it". */
export const isDuplicateKey = (e: unknown): boolean =>
  typeof e === 'object' && e !== null && (e as { code?: number }).code === 11000;
