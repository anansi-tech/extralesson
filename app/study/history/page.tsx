import 'katex/dist/katex.min.css';
import { dbConnect } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { loadHistory } from '@/lib/study/history';
import { loadMistakes } from '@/lib/study/mistakes';
import { HistoryView } from './history-view';

export const metadata = { title: 'History — ExtraLesson' };
export const dynamic = 'force-dynamic';

/** Every attempt, newest first. Looking back re-marks nothing. */
export default async function HistoryPage() {
  const auth = await requireSession();
  await dbConnect();
  const [rows, mistakes] = await Promise.all([loadHistory(auth.student_id), loadMistakes(auth.student_id)]);
  const lostMarks = [...mistakes.lostByObjective.values()].reduce((a, b) => a + b, 0);
  return <HistoryView rows={rows} lostMarks={lostMarks} />;
}
