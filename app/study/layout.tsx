import { dbConnect, Student } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { StudyChrome, sittingTag } from './study-chrome';

/**
 * Every student page inside the one chrome. A page with no session (login,
 * reset) is rendered bare: the chrome is for someone who is in.
 */
export default async function StudyLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) return children;
  await dbConnect();
  const student = await Student.findById(session.student_id).select('syllabus_mode').lean<{ syllabus_mode?: string } | null>();
  return <StudyChrome sitting={sittingTag(student?.syllabus_mode ?? '')}>{children}</StudyChrome>;
}
