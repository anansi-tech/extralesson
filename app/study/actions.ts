'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { dbConnect, PracticeSession, Student, isDuplicateKey } from '@/lib/db';
import { clearSessionCookie, requireSession } from '@/lib/auth/session';
import { type SessionMode } from '@/lib/session/builder';
import { planSession } from '@/lib/session/plan';
import { loadMistakes } from '@/lib/study/mistakes';
import { loadTopicChoices } from '@/lib/study/topics';
import { canStartSession, grantFor, hasAccess, type Access } from '@/lib/access';
import { applySittingChange } from '@/lib/change-sitting';
import type { ExamSitting, ModuleNumber } from '@/lib/types';

const MODES: SessionMode[] = ['adaptive', 'topic', 'revisit', 'diagnostic', 'first'];

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
    exam_sitting: string;
    access?: Access | null;
  } | null>();
  if (!student) redirect('/study/login');

  // THE ONE CHECK. Creating a session is where paying matters; nothing already
  // earned is hidden, and the diagnostic stays free because it is how a student
  // finds out where they are before we have shown them anything.
  const grant = grantFor(student.access, student.exam_sitting);
  const gate = await canStartSession(auth.student_id, grant, mode);
  if (!gate.allowed) redirect(`/study?error=${gate.reason}`);

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
  // INSERT FIRST (ROUND_6 Task 4): the free slot and the one first question
  // are unique indexes, so a racing second start fails here and lands nothing.
  let session;
  try {
    session = await PracticeSession.create({
      student_id: auth.student_id,
      question_ids: picked.map((p) => p.id),
      module_focus: modules.size === 1 ? [...modules][0] : undefined,
      mode,
      free_slot: gate.slot,
    });
  } catch (e) {
    if (!isDuplicateKey(e)) throw e;
    if (mode === 'first') redirect('/study?error=first-taken');
    // The other start took the slot. A paying student's open session is on
    // the notebook; an unpaid one has just spent the last free session.
    redirect(hasAccess(grant) ? '/study' : '/study?error=needs-access');
  }
  redirect(`/study/session/${session._id}`);
}

const SittingZ = z.enum(['jan-2027', 'may-june-2027']);

/**
 * Allowed any time. Where it lands is what the gate says of the new sitting:
 * the notebook, or the paywall when that sitting has no grant and the free
 * sessions are used.
 */
export async function changeSitting(formData: FormData): Promise<void> {
  const auth = await requireSession();
  const to = SittingZ.safeParse(formData.get('to'));
  if (!to.success) redirect('/study');
  await dbConnect();
  await applySittingChange(auth.student_id, to.data as ExamSitting);
  const student = await Student.findById(auth.student_id)
    .select('exam_sitting access')
    .lean<{ exam_sitting: string; access?: Access | null } | null>();
  if (!student) redirect('/study/login');
  const gate = await canStartSession(auth.student_id, grantFor(student.access, student.exam_sitting), 'adaptive');
  redirect(gate.allowed ? '/study' : `/study?error=${gate.reason}`);
}

export async function logout(): Promise<void> {
  await clearSessionCookie();
  redirect('/study/login');
}
