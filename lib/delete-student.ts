import {
  Attempt,
  CapturedImage,
  Payment,
  PracticeSession,
  SessionDraft,
  Student,
  Transcription,
} from '@/lib/db';
import { ResetToken } from '@/lib/db/reset-token';
import { isAdminEmail } from '@/lib/auth/session';

/**
 * DELETE A STUDENT AND EVERYTHING ATTACHED TO THEM.
 *
 * For a test account, and for an erasure request. One function, so the list of
 * collections lives in ONE place: a second copy is how a collection gets
 * missed, and the rows it leaves behind belong to somebody who asked to be
 * forgotten.
 *
 * Irreversible in a way nothing else here is. Attempts are append-only and
 * every mastery, progress and trajectory figure is a fold over them, so there
 * is no recomputation that brings a student back — the record IS the state.
 *
 * SESSION DRAFTS ARE THE ONES THAT GET MISSED. They are keyed by session_id
 * and carry no student_id at all, so a sweep written from "which schemas name
 * a student" skips them and leaves the drafts of a deleted account behind.
 * They are deleted through the student's session ids, which is why the
 * sessions are read before anything is removed.
 */
export const DELETED_BY_STUDENT_ID = [
  'Attempt',
  'PracticeSession',
  'Transcription',
  'CapturedImage',
] as const;

/**
 * The payment is KEPT, and it is the only thing that is.
 *
 * The money is a financial record — Stripe holds it either way, and the totals
 * on /admin/access stop reconciling if rows vanish from under them. What
 * leaves is the person, not the transaction: the link to the account and the
 * address that names them go, and the amount, the currency and the event id
 * stay. It is marked resolved so it does not reappear in the unmatched pile
 * asking to be chased.
 */
export const KEPT_BUT_ANONYMISED = 'Payment';

export interface DeletionCounts {
  Attempt: number;
  PracticeSession: number;
  Transcription: number;
  CapturedImage: number;
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
  const attempts = await Attempt.deleteMany({ student_id: studentId });
  const transcriptions = await Transcription.deleteMany({ student_id: studentId });
  const images = await CapturedImage.deleteMany({ student_id: studentId });
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
      SessionDraft: drafts.deletedCount ?? 0,
      ResetToken: resets.deletedCount ?? 0,
      Student: removed.deletedCount ?? 0,
      PaymentAnonymised: payments.modifiedCount ?? 0,
    },
  };
}
