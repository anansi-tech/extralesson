import { dbConnect, Student } from '@/lib/db';
import { hasAccess, type Access } from '@/lib/access';
import { getSession } from '@/lib/auth/session';
import { StudyChrome } from './study-chrome';
import { sittingLabel } from '@/lib/sittings';

/**
 * Every student page inside the one chrome. A page with no session (login,
 * reset) is rendered bare: the chrome is for someone who is in.
 */
export default async function StudyLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) return children;
  await dbConnect();
  const student = await Student.findById(session.student_id).select('exam_sitting access').lean<{ exam_sitting: string; access?: Access | null } | null>();
  // A comp has no payment to refund, and a revoked grant has nothing left to ask about.
  const refundable = hasAccess(student?.access) && student?.access?.payment_id ? String(student.access.payment_id) : null;
  return (
    <StudyChrome sitting={sittingLabel(student?.exam_sitting ?? '') ?? ''} current={student?.exam_sitting ?? ''} email={session.email} isAdmin={session.role === 'admin'} refundablePaymentId={refundable}>
      {children}
    </StudyChrome>
  );
}
