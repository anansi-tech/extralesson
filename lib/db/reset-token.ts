import { Schema, model, models, type InferSchemaType } from 'mongoose';

// One row per outstanding password reset. `lookup` is the SHA-256 of the secret
// in the emailed URL — the secret itself is never stored, so reading this
// collection does not give anyone a way in.
const ResetTokenSchema = new Schema({
  lookup: { type: String, required: true, unique: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  expires_at: { type: Date, required: true },
  used_at: { type: Date },
  /** Claiming this link proves the inbox; the role is granted at that moment, not before. */
  grant_role: { type: String, enum: ['admin'] },
});

// Mongo TTL sweep removes expired rows. It is a tidy-up, NOT the expiry check —
// the sweep runs about once a minute and the claim below cannot wait on it.
ResetTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export type ResetTokenDoc = InferSchemaType<typeof ResetTokenSchema>;
export const ResetToken = models.ResetToken ?? model('ResetToken', ResetTokenSchema);
