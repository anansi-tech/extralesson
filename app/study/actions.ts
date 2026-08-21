'use server';

import { redirect } from 'next/navigation';
import { dbConnect, PracticeSession, Student } from '@/lib/db';
import { clearSessionCookie, requireSession } from '@/lib/auth/session';
import { type SessionMode } from '@/lib/session/builder';
import { planSession } from '@/lib/session/plan';
import { loadMistakes } from '@/lib/study/mistakes';
import { loadTopicChoices } from '@/lib/study/topics';
import type { ModuleNumber } from '@/lib/types';

const MODES: SessionMode[] = ['adaptive', 'topic', 'revisit', 'diagnostic'];

export async function startSession(formData?: FormData): Promise<void> {
  const requested = String(formData?.get('mode') ?? 'adaptive');
  const mode: SessionMode = (MODES as string[]).includes(requested)
    ? (requested as SessionMode)
    : 'adaptive';
  const topicCode = formData?.get('topic') ? String(formData.get('topic')) : null;

  const auth = await requireSession();
  await dbConnect();
  const student = await Student.findById(auth.student_id).lean<{
    target_modules: ModuleNumber[];
  } | null>();
  if (!student) redirect('/study/login');

  // Whatever the mode needs beyond the pool: the topic the student named, or
  // the marks they have actually lost.
  let focusPrefixes: string[] | undefined;
  if (mode === 'topic') {
    const choice = (await loadTopicChoices(student.target_modules)).find((t) => t.code === topicCode);
    if (!choice) redirect('/study?error=no-topic');
    focusPrefixes = choice.prefixes;
  }
  const mistakes = mode === 'revisit' ? await loadMistakes(auth.student_id) : null;
  if (mistakes && mistakes.lostByObjective.size === 0) redirect('/study?error=nothing-to-revisit');

  const picked = await planSession({
    studentId: auth.student_id,
    targetModules: student.target_modules,
    mode,
    focusPrefixes,
  });

  if (picked.length === 0) redirect(`/study?error=no-questions&mode=${mode}`);

  const modules = new Set(picked.map((p) => p.module));
  const session = await PracticeSession.create({
    student_id: auth.student_id,
    question_ids: picked.map((p) => p.id),
    module_focus: modules.size === 1 ? [...modules][0] : undefined,
    mode,
  });
  redirect(`/study/session/${session._id}`);
}

export async function logout(): Promise<void> {
  await clearSessionCookie();
  redirect('/study/login');
}
