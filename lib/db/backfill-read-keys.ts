import { Attempt } from './attempt';
import { PracticeSession } from './session';
import { CapturedImage, Transcription } from './transcription';

/**
 * Same-commit backfill for session_id / question_index on reads. Every row
 * written before ROUND_4 has an attempt, and the attempt names the session;
 * the index is the question's position in it. syncIndexes retires the old
 * {attempt_id, take} unique index, which an attempt-less read would violate.
 */
export async function backfillReadKeys(): Promise<{
  Transcription: number;
  CapturedImage: number;
  unresolved: number;
}> {
  const out = { Transcription: 0, CapturedImage: 0, unresolved: 0 };
  for (const [name, Model] of [
    ['Transcription', Transcription],
    ['CapturedImage', CapturedImage],
  ] as const) {
    const rows = await Model.collection
      .find({ session_id: { $exists: false } }, { projection: { attempt_id: 1 } })
      .toArray();
    for (const row of rows) {
      const keys = await keysFor(row.attempt_id);
      if (!keys) {
        out.unresolved++;
        continue;
      }
      await Model.collection.updateOne({ _id: row._id }, { $set: keys });
      out[name]++;
    }
    await Model.syncIndexes();
  }
  return out;
}

async function keysFor(attemptId: unknown) {
  const attempt = await Attempt.findById(attemptId)
    .select('session_id question_id')
    .lean<{ session_id: unknown; question_id: unknown } | null>();
  if (!attempt) return null;
  const session = await PracticeSession.findById(attempt.session_id)
    .select('question_ids')
    .lean<{ question_ids: unknown[] } | null>();
  const index = session?.question_ids.findIndex((q) => String(q) === String(attempt.question_id)) ?? -1;
  if (index < 0) return null;
  return { session_id: attempt.session_id, question_index: index };
}
