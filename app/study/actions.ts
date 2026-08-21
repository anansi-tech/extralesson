'use server';

import { redirect } from 'next/navigation';
import { dbConnect, PracticeSession, Question, Student } from '@/lib/db';
import { clearSessionCookie, requireSession } from '@/lib/auth/session';
import { loadStudyState } from '@/lib/study/state';
import { buildSession, type SessionMode } from '@/lib/session/builder';
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

  const state = await loadStudyState(auth.student_id, student.target_modules);
  const candidates = await Question.find({ status: 'approved' })
    .select('objective_ids module kind marks parts')
    .lean<
      {
        _id: unknown;
        objective_ids: string[];
        module: ModuleNumber;
        kind: 'mcq' | 'structured';
        marks: number;
        parts?: { slots?: { response_mode?: string }[] }[];
      }[]
    >();

  const picked = buildSession({
    candidates: candidates.map((c) => ({
      id: String(c._id),
      objective_ids: c.objective_ids,
      module: c.module,
      kind: c.kind,
      marks: c.marks,
      response_modes: (c.parts ?? []).flatMap((p) =>
        (p.slots ?? []).map((slot) => slot.response_mode ?? 'answer'),
      ),
    })),
    perObjectiveMastery: state.perObjective,
    m1Mastery: state.moduleMastery[1],
    targetModules: student.target_modules,
    topicWeightByPrefix: state.topicWeightByPrefix,
    mode,
    focusPrefixes,
    lostByObjective: mistakes?.lostByObjective,
    attemptedIds: mistakes?.attemptedIds,
  });

  if (picked.length === 0) redirect(`/study?error=no-questions&mode=${mode}`);

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
