import { Schema, model, models, type InferSchemaType } from 'mongoose';

// One row per outstanding password reset. `lookup` is the SHA-256 of the secret
// in the emailed URL — the secret itself is never stored, so reading this
// collection does not give anyone a way in.
//
// This replaces the magictokens collection, which was named for the sign-in
// links that no longer exist and carried a `profile` sub-document for
// registration that stopped being read when registration became a direct form.
// Nothing is migrated: every row expires within thirty minutes by design, so
// the old collection empties itself.
const ResetTokenSchema = new Schema({
  lookup: { type: String, required: true, unique: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  expires_at: { type: Date, required: true },
  used_at: { type: Date },
});

// Mongo TTL sweep removes expired rows. It is a tidy-up, NOT the expiry check —
// the sweep runs about once a minute and the claim below cannot wait on it.
ResetTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export type ResetTokenDoc = InferSchemaType<typeof ResetTokenSchema>;
export const ResetToken = models.ResetToken ?? model('ResetToken', ResetTokenSchema);
