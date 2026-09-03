import { Schema, model, models, type InferSchemaType } from 'mongoose';

/**
 * What a student has typed and not handed in, so a closed tab does not lose a
 * twenty-minute question. Separate from attempts on purpose: those are
 * append-only and folded over (ROUND_1 §3.5); a draft is never marked.
 */
export const DRAFT_TTL_DAYS = 30;

const SessionDraftSchema = new Schema({
  session_id: { type: Schema.Types.ObjectId, ref: 'PracticeSession', required: true },
  question_index: { type: Number, required: true },
  /** Single-box slots, by slot ref. */
  answers: { type: Schema.Types.Mixed, default: {} },
  /** Typed multi-value slots, by slot ref. */
  values: { type: Schema.Types.Mixed, default: {} },
  /** The chosen option on an MCQ. */
  selected: { type: Number },
  updated_at: { type: Date, default: Date.now, required: true },
});

// One draft per question of a session; saving replaces it.
SessionDraftSchema.index({ session_id: 1, question_index: 1 }, { unique: true });
// Scratch does not need keeping. A session abandoned for a month is not coming
// back to the same half-typed answer.
SessionDraftSchema.index({ updated_at: 1 }, { expireAfterSeconds: DRAFT_TTL_DAYS * 24 * 60 * 60 });

export type SessionDraftDoc = InferSchemaType<typeof SessionDraftSchema>;
export const SessionDraft = models.SessionDraft ?? model('SessionDraft', SessionDraftSchema);
