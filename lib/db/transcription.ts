import { Schema, model, models, type InferSchemaType } from 'mongoose';
import { DRAFT_TTL_DAYS } from './session-draft';

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

/**
 * A READ IS KEYED ON THE QUESTION IN THE SESSION, NOT ON THE ATTEMPT: photo
 * first means the page is read before any attempt exists (ROUND_4 Task 1).
 * attempt_id is set once, by markWorking, when the answers are handed in.
 */
const TranscriptionSchema = new Schema({
  student_id: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  session_id: { type: Schema.Types.ObjectId, ref: 'PracticeSession', required: true },
  question_index: { type: Number, required: true },
  attempt_id: { type: Schema.Types.ObjectId, ref: 'Attempt' },
  question_id: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
  lines: { type: [LineSchema], required: true },
  /** The reader's final answer per slot ref, in the grader's conventions — the prefill. */
  answers: {
    type: [new Schema({ slot_ref: { type: String, required: true }, text: { type: String, required: true } }, { _id: false })],
    default: [],
  },
  /** The drawing check, run at read time and decided from at submit; never re-read. */
  construction: {
    type: new Schema(
      {
        complete: { type: Boolean, required: true },
        legible: { type: Boolean, required: true },
        missing: { type: [new Schema({ describes: String, note: String }, { _id: false })], default: [] },
      },
      { _id: false },
    ),
  },
  legible: { type: Boolean, required: true },
  notes: { type: String },
  /** Which read this is: a student may retake once (R2 §2). */
  take: { type: Number, default: 1, required: true },
  /**
   * RESERVED BEFORE SPENT (ROUND_6 Task 4): the row is inserted before the
   * model is called, so a concurrent read fails on the unique index and
   * spends nothing. Unset once the read lands; deleted if the model fails.
   */
  pending: { type: Boolean },
  /** What each call cost, so §7 is reported from measurement, not estimate (ROUND_6 Task 8). */
  usage: {
    input_tokens: { type: Number },
    output_tokens: { type: Number },
    marking_input: { type: Number },
    marking_output: { type: Number },
    drawing_input: { type: Number },
    drawing_output: { type: Number },
  },
  reader_model: { type: String },
  marker_model: { type: String },
  drawing_model: { type: String },
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
          /** The marker asked a person to look; shown on /admin/disputes. */
          needs_review: { type: Boolean },
        },
        { _id: false },
      ),
    ],
    default: [],
  },
  marker_version: { type: String },
  /** Where the working slipped, one per part, each quote verified against the read (ROUND_7 Task 1). */
  slips: {
    type: [new Schema({ part: { type: String, required: true }, quote: { type: String, required: true }, sentence: { type: String, required: true } }, { _id: false })],
    default: [],
  },
  /** Why the marker did not finish (ROUND_6 Task 1); cleared when a retry does. */
  marking: {
    type: new Schema(
      { status: { type: String, enum: ['failed'], required: true }, reason: { type: String, required: true }, ts: { type: Date, required: true } },
      { _id: false },
    ),
  },
  created_at: { type: Date, default: Date.now, required: true },
  /** Set on a read with no attempt yet; unset once linked. Scratch expires with the draft. */
  expires_at: { type: Date },
});

TranscriptionSchema.index({ session_id: 1, question_index: 1, take: 1 }, { unique: true });
TranscriptionSchema.index({ attempt_id: 1 });
TranscriptionSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export const readExpiry = () => new Date(Date.now() + DRAFT_TTL_DAYS * 24 * 60 * 60 * 1000);

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
  session_id: { type: Schema.Types.ObjectId, ref: 'PracticeSession', required: true },
  question_index: { type: Number, required: true },
  attempt_id: { type: Schema.Types.ObjectId, ref: 'Attempt' },
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
CapturedImageSchema.index({ session_id: 1, question_index: 1, take: 1 }, { unique: true });

export type CapturedImageDoc = InferSchemaType<typeof CapturedImageSchema>;
export const CapturedImage =
  models.CapturedImage ?? model('CapturedImage', CapturedImageSchema);
