import { dbConnect, Student } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { StudyChrome } from './study-chrome';
import { sittingLabel } from '@/lib/sittings';
import { hasAccess, type Access } from '@/lib/access';

/**
 * Every student page inside the one chrome. A page with no session (login,
 * reset) is rendered bare: the chrome is for someone who is in.
 */
export default async function StudyLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) return children;
  await dbConnect();
  const student = await Student.findById(session.student_id).select('exam_sitting access').lean<{ exam_sitting: string; access?: Access | null } | null>();
  return (
    <StudyChrome sitting={sittingLabel(student?.exam_sitting ?? '') ?? ''} current={student?.exam_sitting ?? ''} email={session.email} isAdmin={session.role === 'admin'} paid={hasAccess(student?.access)}>
      {children}
    </StudyChrome>
  );
}
