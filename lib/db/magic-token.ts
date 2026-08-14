import { Schema, model, models, type InferSchemaType } from 'mongoose';

// Persisted jti for single-use magic links (ROUND_1 §3.4 auth discipline).
// `profile` carries registration fields for first-time students so the
// login form is a single round trip.
const MagicTokenSchema = new Schema({
  jti: { type: String, required: true, unique: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  profile: {
    type: {
      name: { type: String, required: true },
      island: { type: String },
      exam_sitting: { type: String, enum: ['jan-2027', 'may-june-2027'], required: true },
      target_modules: { type: [Number], enum: [1, 2, 3], required: true },
    },
    default: undefined,
    _id: false,
  },
  expires_at: { type: Date, required: true },
  used_at: { type: Date },
});

// Mongo TTL sweep removes expired tokens.
MagicTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export type MagicTokenDoc = InferSchemaType<typeof MagicTokenSchema>;
export const MagicToken = models.MagicToken ?? model('MagicToken', MagicTokenSchema);
