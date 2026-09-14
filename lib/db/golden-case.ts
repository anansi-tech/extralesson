import { Schema, model, models, type InferSchemaType } from 'mongoose';

/**
 * A FIELD CASE, KEPT WHERE A DEPLOYED SERVER CAN KEEP IT.
 *
 * The golden set lives in design/golden and is committed, which is right: the
 * eval's inputs belong in review with everything else. But a deployed function
 * cannot write to the repo — Vercel's filesystem is read-only outside /tmp, and
 * anything written there is gone at the next request anyway — so the button on
 * /admin/disputes cannot be the thing that writes those files.
 *
 * So it writes here instead, and `pnpm golden:pull` carries the rows into the
 * files on a machine that has the repo. The BUNDLE IS STORED WHOLE rather than
 * rebuilt at pull time: it is what the product decided at the moment the
 * dispute was resolved, and the attempt it was built from can be marked again.
 *
 * `case_id` is unique, so adding twice writes once whatever the caller does.
 */
const GoldenCaseSchema = new Schema({
  /** The `f-xxxxxx` id, from the read — the same id the golden files carry. */
  case_id: { type: String, required: true, unique: true },
  dispute_id: { type: Schema.Types.ObjectId, ref: 'MarkDispute', required: true },
  transcription_id: { type: Schema.Types.ObjectId, ref: 'Transcription', required: true },
  /** The whole GoldenBundle, as the importer takes it. */
  bundle: { type: Schema.Types.Mixed, required: true },
  added_at: { type: Date, default: Date.now, required: true },
  /** When a pull wrote it into the golden files; null until then. */
  pulled_at: { type: Date, default: null },
});

export type GoldenCaseDoc = InferSchemaType<typeof GoldenCaseSchema>;
export const GoldenCase = models.GoldenCase ?? model('GoldenCase', GoldenCaseSchema);
