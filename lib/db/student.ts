import { Schema, model, models, type InferSchemaType } from 'mongoose';

const StudentSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, required: true },
  // scrypt$salt$hash — see lib/auth/password.ts. Optional in the schema and
  // never optional in practice: accounts made before passwords existed have
  // none, and set one through the reset flow rather than being deleted.
  password_hash: { type: String },
  island: { type: String },
  exam_sitting: { type: String, enum: ['jan-2027', 'may-june-2027'], required: true },
  // Derived from exam_sitting; display only — never branch logic on it (ROUND_1 §0).
  syllabus_mode: { type: String, enum: ['legacy-jan', 'modular-2027'], required: true },
  target_modules: { type: [Number], enum: [1, 2, 3], required: true },
  created_at: { type: Date, default: Date.now, required: true },
  // PAID ACCESS. Absent means the free tier, which is correct for every account
  // that existed before this field and for every new one — nobody is granted
  // access by omission.
  //
  // Granted by the webhook on a matched payment, or by hand on /admin/access —
  // refunds, mismatched emails, comps and undelivered events all end up there,
  // which is what makes the automatic path safe to have.
  access: {
    type: new Schema(
      {
        sitting: { type: String, enum: ['jan-2027', 'may-june-2027'], required: true },
        granted_at: { type: Date, default: Date.now, required: true },
        source: { type: String, enum: ['manual', 'stripe'], default: 'manual', required: true },
        note: { type: String },
      },
      { _id: false },
    ),
  },
});

export type StudentDoc = InferSchemaType<typeof StudentSchema>;
export const Student = models.Student ?? model('Student', StudentSchema);
