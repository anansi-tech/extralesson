import { Attempt } from './attempt';
import { PracticeSession } from './session';

/**
 * Same-commit backfill for Attempt.question_index: the question's position in
 * its session. An attempt whose session is gone is ranked by time within that
 * session id, which keeps the unique index honest without inventing a session.
 */
export async function backfillAttemptIndex(): Promise<{ indexed: number; ranked: number }> {
  const out = { indexed: 0, ranked: 0 };
  const rows = await Attempt.collection
    .find({ question_index: { $exists: false } }, { projection: { session_id: 1, question_id: 1, ts: 1 } })
    .sort({ ts: 1 })
    .toArray();
  const sessions = new Map<string, unknown[] | null>();
  const rank = new Map<string, number>();
  for (const row of rows) {
    const sid = String(row.session_id);
    if (!sessions.has(sid)) {
      const s = await PracticeSession.findById(row.session_id).select('question_ids').lean<{ question_ids: unknown[] } | null>();
      sessions.set(sid, s?.question_ids ?? null);
    }
    const ids = sessions.get(sid);
    let index = ids ? ids.findIndex((q) => String(q) === String(row.question_id)) : -1;
    if (index < 0) {
      index = rank.get(sid) ?? 0;
      out.ranked++;
    } else {
      out.indexed++;
    }
    rank.set(sid, Math.max(rank.get(sid) ?? 0, index + 1));
    await Attempt.collection.updateOne({ _id: row._id }, { $set: { question_index: index } });
  }
  await Attempt.syncIndexes();
  return out;
}
