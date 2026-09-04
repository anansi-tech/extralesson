import {
  Attempt,
  CapturedImage,
  LineRejected,
  MarkDispute,
  Payment,
  PracticeSession,
  SessionDraft,
  Student,
  Transcription,
} from '@/lib/db';
import { ResetToken } from '@/lib/db/reset-token';
import { isAdminEmail } from '@/lib/auth/session';

/**
 * Every collection attached to a student is listed in ONE place; a second copy
 * is how one gets missed. Session drafts carry no student_id, so they are
 * deleted through the session ids, read before anything else is removed.
 */
export const DELETED_BY_STUDENT_ID = [
  'Attempt',
  'PracticeSession',
  'Transcription',
  'CapturedImage',
  'MarkDispute',
] as const;

/**
 * The payment is KEPT and anonymised: the money is a financial record and the
 * /admin/access totals stop reconciling if rows vanish. What leaves is the
 * person — the account link and the address — not the transaction.
 */
export const KEPT_BUT_ANONYMISED = 'Payment';

export interface DeletionCounts {
  Attempt: number;
  PracticeSession: number;
  Transcription: number;
  CapturedImage: number;
  MarkDispute: number;
  LineRejected: number;
  SessionDraft: number;
  ResetToken: number;
  Student: number;
  /** Kept and stripped of the person, never deleted. */
  PaymentAnonymised: number;
}

export type DeleteResult =
  | { ok: true; counts: DeletionCounts }
  | { ok: false; reason: string };

export async function deleteStudent(email: string): Promise<DeleteResult> {
  const address = email.trim().toLowerCase();
  if (!address) return { ok: false, reason: 'No email address given.' };

  // An operator cannot delete the account that lets them operate. The check is
  // on the allowlist rather than on "is this me", because deleting the other
  // admin locks the same door.
  if (isAdminEmail(address)) {
    return { ok: false, reason: `${address} is in ADMIN_EMAILS and cannot be deleted.` };
  }

  const student = await Student.findOne({ email: address }).select('_id').lean<{ _id: unknown } | null>();
  if (!student) return { ok: false, reason: `No account for ${address}.` };
  const studentId = student._id;

  // Read the session ids BEFORE deleting the sessions: the drafts hang off
  // them and nothing else points at the student.
  const sessions = await PracticeSession.find({ student_id: studentId })
    .select('_id')
    .lean<{ _id: unknown }[]>();
  const sessionIds = sessions.map((s) => s._id);

  const drafts = await SessionDraft.deleteMany({ session_id: { $in: sessionIds } });
  // Rejections hang off the reads the way drafts hang off the sessions.
  const readIds = (await Transcription.find({ student_id: studentId }).select('_id').lean<{ _id: unknown }[]>()).map((r) => r._id);
  const rejections = await LineRejected.deleteMany({ transcription_id: { $in: readIds } });
  const attempts = await Attempt.deleteMany({ student_id: studentId });
  const transcriptions = await Transcription.deleteMany({ student_id: studentId });
  const images = await CapturedImage.deleteMany({ student_id: studentId });
  const disputes = await MarkDispute.deleteMany({ student_id: studentId });
  const practiceSessions = await PracticeSession.deleteMany({ student_id: studentId });
  const resets = await ResetToken.deleteMany({ email: address });

  // The transaction stays; the person is taken out of it. No audit row names
  // the address — an erasure that leaves the email in a log has not happened.
  const payments = await Payment.updateMany(
    { student_id: studentId },
    {
      $unset: { student_id: '', email: '' },
      $set: { resolved_at: new Date(), note: 'account deleted at the student’s request' },
    },
  );

  const removed = await Student.deleteOne({ _id: studentId });

  return {
    ok: true,
    counts: {
      Attempt: attempts.deletedCount ?? 0,
      PracticeSession: practiceSessions.deletedCount ?? 0,
      Transcription: transcriptions.deletedCount ?? 0,
      CapturedImage: images.deletedCount ?? 0,
      MarkDispute: disputes.deletedCount ?? 0,
      LineRejected: rejections.deletedCount ?? 0,
      SessionDraft: drafts.deletedCount ?? 0,
      ResetToken: resets.deletedCount ?? 0,
      Student: removed.deletedCount ?? 0,
      PaymentAnonymised: payments.modifiedCount ?? 0,
    },
  };
}
