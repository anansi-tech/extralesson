import { dbConnect, Student } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { loadStudyState } from '@/lib/study/state';
import { topicLeverage } from '@/lib/study/leverage';
import type { ModuleNumber } from '@/lib/types';
import { ProgressView, type ProgressModule, type WeakestTopic } from './progress-view';

export const metadata = { title: 'Progress — ExtraLesson' };
export const dynamic = 'force-dynamic';

/** Each module's estimate beside the topics that make it. Reads attempts; writes nothing. */
export default async function ProgressPage() {
  const auth = await requireSession();
  await dbConnect();
  const student = await Student.findById(auth.student_id).lean<{
    syllabus_mode: 'legacy-jan' | 'modular-2027';
    target_modules: ModuleNumber[];
  } | null>();
  if (!student) return null;
  const state = await loadStudyState(auth.student_id, student.target_modules);
  const { prediction } = state;
  // The Jan sitting awards one overall grade, so no module letter exists to show (§6.6).
  const letterFor = (m: ModuleNumber) =>
    student.syllabus_mode === 'legacy-jan' || !prediction.estimable ? null : prediction.modules.find((x) => x.module === m)?.letter ?? null;

  const modules: ProgressModule[] = ([1, 2, 3] as const)
    .filter((m) => student.target_modules.includes(m))
    .map((m) => ({
      module: m,
      letter: letterFor(m),
      strength: state.moduleMastery[m],
      topics: state.topics.filter((t) => t.module === m).map((t) => ({ code: t.code, title: t.title, band: t.band, mastery: t.mastery })),
    }));

  // The weakest topic among those seen; nothing is weakest before anything has been tried.
  const seen = state.topics.filter((t) => student.target_modules.includes(t.module) && t.band !== 'NOT_STARTED');
  const weakestTopic = seen.length > 0 ? seen.reduce((a, b) => (b.mastery < a.mastery ? b : a)) : null;
  const leverage = topicLeverage(state, student.target_modules);
  const weakest: WeakestTopic | null = weakestTopic
    ? { code: weakestTopic.code, title: weakestTopic.title, marks: Math.round(leverage.find((t) => t.code === weakestTopic.code)?.pointsAvailable ?? 0) }
    : null;

  return <ProgressView estimable={prediction.estimable} modules={modules} weakest={weakest} />;
}
