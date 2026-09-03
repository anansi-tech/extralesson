import { Schema, model, models, type InferSchemaType } from 'mongoose';

/**
 * WHAT WE READ OFF A STUDENT'S PAGE — never a mark (ROUND_2 §1). Stored so the
 * student can check the claim we made about their image, and so every future
 * marking change replays against it. Shown before any mark is reported.
 */
const LineSchema = new Schema(
  {
    /** The part the student wrote beside the line, or inherited from the line above. */
    part_label: { type: String },
    slot_label: { type: String },
    text: { type: String, required: true },
    confidence: { type: Number, required: true },
  },
  { _id: false },
);

const TranscriptionSchema = new Schema({
  student_id: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  attempt_id: { type: Schema.Types.ObjectId, ref: 'Attempt', required: true },
  question_id: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
  lines: { type: [LineSchema], required: true },
  legible: { type: Boolean, required: true },
  notes: { type: String },
  /** Which read this is: a student may retake once (R2 §2). */
  take: { type: Number, default: 1, required: true },
  /** What the read cost, so §7 can be reported from measurement, not estimate. */
  usage: {
    input_tokens: { type: Number },
    output_tokens: { type: Number },
  },
  reader_model: { type: String, required: true },
  /**
   * METHOD MARKS EARNED BY THIS WORKING — not on the attempt, which is
   * append-only; loadAttemptRows folds them in at read time. mark_value is
   * COPIED so a later rubric edit cannot restate what a student was awarded.
   */
  method_marks: {
    type: [
      new Schema(
        {
          code: { type: String, required: true },
          awarded: { type: Boolean, required: true },
          reason: { type: String, required: true },
          confidence: { type: Number },
          mark_value: { type: Number, required: true },
          profile: { type: String },
        },
        { _id: false },
      ),
    ],
    default: [],
  },
  marker_version: { type: String },
  created_at: { type: Date, default: Date.now, required: true },
});

TranscriptionSchema.index({ attempt_id: 1, take: 1 }, { unique: true });

export type TranscriptionDoc = InferSchemaType<typeof TranscriptionSchema>;
export const Transcription =
  models.Transcription ?? model('Transcription', TranscriptionSchema);

/**
 * THE PHOTOGRAPH IS A MEANS, NOT A RECORD: a minor's work, kept only long
 * enough for a retake or a dispute, then deleted by the DATABASE rather than by
 * a job someone has to remember to run. ROUND_2 §2, §8b.
 */
export const IMAGE_TTL_DAYS = 7;

const CapturedImageSchema = new Schema({
  student_id: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  attempt_id: { type: Schema.Types.ObjectId, ref: 'Attempt', required: true },
  take: { type: Number, default: 1, required: true },
  /** JPEG bytes, already scaled down on the device before they were sent. */
  data: { type: Buffer, required: true },
  content_type: { type: String, required: true },
  created_at: { type: Date, default: Date.now, required: true },
});

CapturedImageSchema.index(
  { created_at: 1 },
  { expireAfterSeconds: IMAGE_TTL_DAYS * 24 * 60 * 60 },
);
CapturedImageSchema.index({ attempt_id: 1, take: 1 }, { unique: true });

export type CapturedImageDoc = InferSchemaType<typeof CapturedImageSchema>;
export const CapturedImage =
  models.CapturedImage ?? model('CapturedImage', CapturedImageSchema);
