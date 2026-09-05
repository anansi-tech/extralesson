import { Schema, model, models, type InferSchemaType } from 'mongoose';

/**
 * Every granting event Stripe delivered, keyed on its id — idempotency and
 * nothing else (ROUND_6 Task 2). What the event did lives on Fulfilment.
 */
const StripeEventSchema = new Schema({
  _id: { type: String, required: true },
  received_at: { type: Date, default: Date.now, required: true },
});

export type StripeEventDoc = InferSchemaType<typeof StripeEventSchema>;
export const StripeEvent = models.StripeEvent ?? model('StripeEvent', StripeEventSchema);
