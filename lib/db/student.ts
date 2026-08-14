import { Schema, model, models, type InferSchemaType } from 'mongoose';

const StudentSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, required: true },
  island: { type: String },
  exam_sitting: { type: String, enum: ['jan-2027', 'may-june-2027'], required: true },
  // Derived from exam_sitting; display only — never branch logic on it (ROUND_1 §0).
  syllabus_mode: { type: String, enum: ['legacy-jan', 'modular-2027'], required: true },
  target_modules: { type: [Number], enum: [1, 2, 3], required: true },
  created_at: { type: Date, default: Date.now, required: true },
});

export type StudentDoc = InferSchemaType<typeof StudentSchema>;
export const Student = models.Student ?? model('Student', StudentSchema);
