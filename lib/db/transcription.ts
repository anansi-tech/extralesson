import { Schema, model, models, type InferSchemaType } from 'mongoose';

/**
 * WHAT WE READ OFF A STUDENT'S PAGE.
 *
 * R2 §1.2 — transcription is separated from marking and the transcription is
 * stored. Two calls, two artifacts: this is a claim about the image that the
 * student can check, and marking is a judgment over it. Because it persists,
 * every future marking change replays against it, the way audit-remark.ts
 * replays a grader change against stored attempts.
 *
 * Never a mark. Nothing here decides anything; it is the evidence a decision is
 * made from, and it is shown to the student before any mark is reported.
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
   * METHOD MARKS EARNED BY THIS WORKING.
   *
   * They live here, not on the attempt, because an attempt is append-only: it
   * is the record of what a student was told at the moment they submitted, and
   * the photograph comes afterwards. Folding these in at read time (see
   * loadAttemptRows) keeps that record intact and still lets the marks count.
   *
   * mark_value is copied rather than looked up so the fold is a sum, and so a
   * later edit to the question's rubric cannot silently restate what a student
   * was awarded — the same reason an attempt stores its own fingerprint.
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
 * THE PHOTOGRAPH ITSELF, HELD BRIEFLY AND THEN NOT AT ALL.
 *
 * R2 §2 — the image is a means, not a record. It is kept only long enough for a
 * retake or a dispute and then deleted by the database, not by a job someone
 * has to remember to run. This is a sixteen-year-old's handwriting photographed
 * in their home; the least we hold, the better, and holding it on a timer we do
 * not control is the version of that promise that survives us forgetting.
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
