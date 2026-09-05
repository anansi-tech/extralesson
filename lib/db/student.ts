import { Schema, model, models, type InferSchemaType } from 'mongoose';

const StudentSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, required: true },
  // scrypt$salt$hash — see lib/auth/password.ts. Optional only because accounts
  // made before passwords existed have none, and set one through the reset flow.
  password_hash: { type: String },
  // 'admin' is set ONLY when a provisioning link is claimed (lib/auth/provision.ts):
  // public registration always makes a student, whatever the address (ROUND_6 Task 3).
  role: { type: String, enum: ['student', 'admin'], default: 'student', required: true },
  island: { type: String },
  exam_sitting: { type: String, enum: ['jan-2027', 'may-june-2027'], required: true },
  // Derived from exam_sitting; display only — never branch logic on it (ROUND_1 §0).
  syllabus_mode: { type: String, enum: ['legacy-jan', 'modular-2027'], required: true },
  target_modules: { type: [Number], enum: [1, 2, 3], required: true },
  created_at: { type: Date, default: Date.now, required: true },
  // PAID ACCESS. Absent means the free tier — nobody is granted access by
  // omission. Granted by the webhook on a matched payment or by hand on
  // /admin/access, the visible fallback that makes the automatic path safe.
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
