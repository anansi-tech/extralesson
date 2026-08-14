'use server';

import { redirect } from 'next/navigation';
import { dbConnect, PracticeSession, Question, Student } from '@/lib/db';
import { clearSessionCookie, requireSession } from '@/lib/auth/session';
import { loadStudyState } from '@/lib/study/state';
import { buildSession } from '@/lib/session/builder';
import type { ModuleNumber } from '@/lib/types';

export async function startSession(): Promise<void> {
  const auth = await requireSession();
  await dbConnect();
  const student = await Student.findById(auth.student_id).lean<{
    target_modules: ModuleNumber[];
  } | null>();
  if (!student) redirect('/study/login');

  const state = await loadStudyState(auth.student_id, student.target_modules);
  const candidates = await Question.find({ status: 'approved' })
    .select('objective_ids module kind')
    .lean<{ _id: unknown; objective_ids: string[]; module: ModuleNumber; kind: 'mcq' | 'structured' }[]>();

  const picked = buildSession({
    candidates: candidates.map((c) => ({
      id: String(c._id),
      objective_ids: c.objective_ids,
      module: c.module,
      kind: c.kind,
    })),
    perObjectiveMastery: state.perObjective,
    m1Mastery: state.moduleMastery[1],
    targetModules: student.target_modules,
    topicWeightByPrefix: state.topicWeightByPrefix,
  });

  if (picked.length === 0) redirect('/study?error=no-questions');

  const modules = new Set(picked.map((p) => p.module));
  const session = await PracticeSession.create({
    student_id: auth.student_id,
    question_ids: picked.map((p) => p.id),
    module_focus: modules.size === 1 ? [...modules][0] : undefined,
  });
  redirect(`/study/session/${session._id}`);
}

export async function logout(): Promise<void> {
  await clearSessionCookie();
  redirect('/study/login');
}
