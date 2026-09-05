import 'katex/dist/katex.min.css';
import Link from 'next/link';
import { dbConnect, Student } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { loadHistory } from '@/lib/study/history';
import { StudyNav, sittingTag } from '../study-nav';

export const metadata = { title: 'History — ExtraLesson' };
export const dynamic = 'force-dynamic';

/** Every attempt, newest first. Looking back re-marks nothing. */
export default async function HistoryPage() {
  const auth = await requireSession();
  await dbConnect();
  const student = await Student.findById(auth.student_id).select('syllabus_mode').lean<{ syllabus_mode: string } | null>();
  if (!student) return null;
  const rows = await loadHistory(auth.student_id);

  return (
    <main className="ruled relative min-h-screen px-5 py-8">
      <div className="pointer-events-none absolute inset-y-0 left-4 w-[1.5px] bg-margin" />
      <div className="mx-auto max-w-xl">
        <StudyNav current="history" sitting={sittingTag(student.syllabus_mode)} email={auth.email} isAdmin={auth.role === 'admin'} />
        <h1 className="mt-5 text-2xl font-black">
          Every question you have answered<span className="text-red-pen">.</span>
        </h1>
        <p className="mt-1 text-[12px] leading-snug text-dim">
          Newest first. Each opens the marking as it was; nothing here is re-marked.
        </p>
        {rows.length === 0 ? (
          <p className="mt-6 text-sm text-dim">Nothing yet. Your first question is on your notebook.</p>
        ) : (
          <ul className="mt-4">
            {rows.map((r) => (
              <li key={`${r.sessionId}:${r.index}:${r.ts.getTime()}`}>
                <Link
                  href={`/study/session/${r.sessionId}?q=${r.index}`}
                  className="flex min-h-11 items-baseline gap-3 border-b-[1.5px] border-rule py-2 text-[13px]"
                >
                  <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-dim">
                    {r.ts.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                  <span className="question-prose min-w-0 flex-1 truncate underline" dangerouslySetInnerHTML={{ __html: r.stemHtml }} />
                  <span className="shrink-0 font-mono text-[12px] text-dim">
                    {r.earned}/{r.marks}
                    {r.unassessed > 0 && ` · ${r.unassessed} not assessed`}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
