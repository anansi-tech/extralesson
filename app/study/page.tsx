import { dbConnect, Student } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { loadStudyState } from '@/lib/study/state';
import { openSession } from '@/lib/study/open-session';
import { loadProgress } from '@/lib/study/progress';
import { topicLeverage } from '@/lib/study/leverage';
import { m1GateHolds } from '@/lib/session/builder';
import { loadMistakes } from '@/lib/study/mistakes';
import { loadTopicChoices } from '@/lib/study/topics';
import { loadFirstQuestion } from '@/lib/study/first-question';
import { leadPanel, shouldLeadWithReachable } from '@/lib/study/lead-panel';
import { diagnosticOpensAt, firstQuestionTaken } from '@/lib/access';
import { sittingLabel, sittingsOpenAt } from '@/lib/sittings';
import type { ModuleNumber } from '@/lib/types';
import { DashboardView } from './dashboard';

export const metadata = { title: 'Your notebook — ExtraLesson' };
export const dynamic = 'force-dynamic';

export default async function StudyDashboard({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; mode?: string }>;
}) {
  const auth = await requireSession();
  const { error, mode } = await searchParams;
  await dbConnect();
  const student = await Student.findById(auth.student_id).lean<{
    name: string;
    access?: { sitting: string } | null;
    target_modules: ModuleNumber[];
  } | null>();
  if (!student) return null;

  const state = await loadStudyState(auth.student_id, student.target_modules);
  const { prediction } = state;
  const [open, progress, topicChoices, mistakes] = await Promise.all([
    openSession(auth.student_id),
    loadProgress(auth.student_id),
    loadTopicChoices(student.target_modules),
    loadMistakes(auth.student_id),
  ]);
  const revisitMarks = [...mistakes.lostByObjective.values()].reduce((a, b) => a + b, 0);

  // ONE DIAGNOSTIC PER STUDENT. Offering a button that would be refused is
  // worse than not offering it. Both offers read this rather than the attempt
  // count: someone who started a diagnostic and answered nothing still reads
  // as new.
  const diagnosticOpensAtDate = await diagnosticOpensAt(auth.student_id);
  const diagnosticOpen =
    diagnosticOpensAtDate === null || Date.now() >= diagnosticOpensAtDate.getTime();
  const lead = leadPanel({
    open: Boolean(open),
    firstTaken: await firstQuestionTaken(auth.student_id),
    diagnosticTaken: diagnosticOpensAtDate !== null,
  });

  // Lead with what is reachable while the estimate still reads as a verdict:
  // below grade III every letter is U, and putting that at the top of the page
  // is the app agreeing with it every morning. See lib/study/lead-panel.ts.
  const reachable = topicLeverage(state, student.target_modules).slice(0, 3);
  // The same condition the session builder applies, read from the same
  // function: a topic outside Module 1 is where the marks are and is not where
  // today's session will go while Module 1 is still the prerequisite.
  const m1Gated = m1GateHolds(student.target_modules, state.moduleMastery[1]);
  const gatedCount = m1Gated ? reachable.filter((t) => t.module !== 1).length : 0;
  const leadWithReachable = shouldLeadWithReachable({
    reachableCount: reachable.length,
    estimable: prediction.estimable,
    overallPercent: prediction.overall_percent,
  });

  const next = sittingsOpenAt(new Date())[0];
  return (
    <DashboardView
      firstName={student.name.trim().split(/\s+/)[0]}
      email={auth.email}
      sitting={student.access ? sittingLabel(student.access.sitting) : null}
      nextSitting={next ? { value: next, label: sittingLabel(next)! } : null}
      lead={lead}
      open={open}
      diagnosticOpen={diagnosticOpen}
      isNewStudent={mistakes.attemptedIds.size === 0}
      firstQuestion={lead === 'diagnostic' ? await loadFirstQuestion(auth.student_id) : null}
      reachable={reachable}
      gatedCount={gatedCount}
      leadWithReachable={leadWithReachable}
      prediction={prediction}
      progress={progress}
      topicChoices={topicChoices}
      revisitMarks={revisitMarks}
      revisitObjectives={mistakes.lostByObjective.size}
      waiting={mistakes.waiting}
      error={error}
      mode={mode}
    />
  );
}
