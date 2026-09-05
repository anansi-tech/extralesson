import { PracticeSession } from './session';
import { FREE_MODES } from '@/lib/access';

/**
 * Same-commit backfill for PracticeSession.free_slot: every session a
 * student chose to sit, numbered in the order it was started.
 */
export async function backfillFreeSlots(): Promise<{ numbered: number; students: number }> {
  const rows = await PracticeSession.collection
    .find({ mode: { $nin: FREE_MODES }, free_slot: { $exists: false } }, { projection: { student_id: 1, started_at: 1 } })
    .sort({ started_at: 1 })
    .toArray();
  const next = new Map<string, number>();
  for (const sid of new Set(rows.map((r) => String(r.student_id)))) {
    const taken = await PracticeSession.collection
      .find({ student_id: rows.find((r) => String(r.student_id) === sid)!.student_id, free_slot: { $exists: true } }, { projection: { free_slot: 1 } })
      .toArray();
    next.set(sid, Math.max(0, ...taken.map((t) => t.free_slot as number)) + 1);
  }
  for (const row of rows) {
    const sid = String(row.student_id);
    const slot = next.get(sid)!;
    next.set(sid, slot + 1);
    await PracticeSession.collection.updateOne({ _id: row._id }, { $set: { free_slot: slot } });
  }
  await PracticeSession.syncIndexes();
  return { numbered: rows.length, students: next.size };
}
