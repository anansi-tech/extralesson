import { Student } from './student';

/**
 * Same-commit backfill for Student.access.sitting: a grant with no sitting
 * of its own takes the sitting the student held when it was granted, which
 * is the one every grant path has always written.
 */
export async function backfillAccessSitting(): Promise<{ filled: number }> {
  const rows = await Student.collection
    .find({ access: { $exists: true }, 'access.sitting': { $exists: false } }, { projection: { exam_sitting: 1 } })
    .toArray();
  for (const row of rows) {
    await Student.collection.updateOne({ _id: row._id }, { $set: { 'access.sitting': row.exam_sitting } });
  }
  return { filled: rows.length };
}
