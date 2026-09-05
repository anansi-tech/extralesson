import { Attempt } from './attempt';
import { Question } from './question';
import { rubricHash } from '@/lib/grade/version';

/**
 * Same-commit backfill: attempts made before the snapshot existed take the
 * bank's rubric as it stands today, which is the best record there is of
 * what they were marked against, and are stamped with its hash.
 */
export async function backfillRubricSnapshot(): Promise<{ stamped: number; orphaned: number }> {
  const out = { stamped: 0, orphaned: 0 };
  const rows = await Attempt.collection.find({ rubric_hash: { $exists: false } }, { projection: { question_id: 1 } }).toArray();
  const cache = new Map<string, unknown[] | null>();
  for (const row of rows) {
    const qid = String(row.question_id);
    if (!cache.has(qid)) {
      const q = await Question.findById(row.question_id).select('rubric').lean<{ rubric?: unknown[] } | null>();
      cache.set(qid, q ? (q.rubric ?? []) : null);
    }
    const rubric = cache.get(qid);
    if (!rubric) {
      out.orphaned++;
      continue;
    }
    const rows2 = (rubric as { code: string; profile: string; criterion: string; mark_value: number; slot_ref: string; part_label?: string; for_format?: boolean }[]).map(
      ({ code, profile, criterion, mark_value, slot_ref, part_label, for_format }) => ({ code, profile, criterion, mark_value, slot_ref, part_label, for_format }),
    );
    await Attempt.collection.updateOne({ _id: row._id }, { $set: { rubric_hash: rubricHash(rows2), rubric: rows2 } });
    out.stamped++;
  }
  return out;
}
