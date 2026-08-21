import { Schema, model, models, type InferSchemaType } from 'mongoose';

/**
 * WHAT A STUDENT HAS TYPED AND NOT YET HANDED IN.
 *
 * A Paper 2 question is nine to twelve marks and twenty minutes at exam pace,
 * and it is worked on a phone. A call, a flat battery or a closed tab lost all
 * of it, which is a reason to stop using the app rather than a reason to
 * remember to submit.
 *
 * SEPARATE FROM ATTEMPTS ON PURPOSE. `attempts` is append-only and is the
 * record of what a student was actually told (§3.5); every mastery figure folds
 * over it. A draft is none of those things — it is scratch, it is overwritten
 * on every keystroke, and it is deleted the moment the answer is submitted and
 * an attempt exists. Nothing here is ever marked or counted.
 */
const SessionDraftSchema = new Schema({
  session_id: { type: Schema.Types.ObjectId, ref: 'PracticeSession', required: true },
  question_index: { type: Number, required: true },
  /** Single-box slots, by slot ref. */
  answers: { type: Schema.Types.Mixed, default: {} },
  /** Typed multi-value slots, by slot ref. */
  values: { type: Schema.Types.Mixed, default: {} },
  /** The chosen option on an MCQ. */
  selected: { type: Number },
  working: { type: String, default: '' },
  updated_at: { type: Date, default: Date.now, required: true },
});

// One draft per question of a session; saving replaces it.
SessionDraftSchema.index({ session_id: 1, question_index: 1 }, { unique: true });
// Scratch does not need keeping. A session abandoned for a month is not coming
// back to the same half-typed answer.
SessionDraftSchema.index({ updated_at: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

export type SessionDraftDoc = InferSchemaType<typeof SessionDraftSchema>;
export const SessionDraft = models.SessionDraft ?? model('SessionDraft', SessionDraftSchema);
