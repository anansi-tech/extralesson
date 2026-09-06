import { SittingChange, Student } from '@/lib/db';
import type { ExamSitting } from '@/lib/types';

/**
 * The account moves to another sitting; the move is appended, never edited.
 * The grant stays where it was: access is to a sitting, and the new one has
 * none until it is paid for (lib/access.ts grantFor). The sitting's derived
 * fields follow it the way registration sets them: the January re-sit is the
 * whole paper, so its modules are all three.
 */
export async function applySittingChange(studentId: string, to: ExamSitting): Promise<void> {
  const student = await Student.findById(studentId).select('exam_sitting').lean<{ exam_sitting: ExamSitting } | null>();
  if (!student || student.exam_sitting === to) return;
  await SittingChange.create({ student_id: studentId, from: student.exam_sitting, to, ts: new Date() });
  await Student.updateOne(
    { _id: studentId },
    {
      $set: {
        exam_sitting: to,
        syllabus_mode: to === 'jan-2027' ? 'legacy-jan' : 'modular-2027',
        ...(to === 'jan-2027' ? { target_modules: [1, 2, 3] } : {}),
      },
    },
  );
}
