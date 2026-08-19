import 'katex/dist/katex.min.css';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { dbConnect, Attempt, PracticeSession, Question, Student } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { renderMathHtml } from '@/lib/katex';
import { renderVisual } from '@/lib/visuals';
import { loadStudyState } from '@/lib/study/state';
import QuestionCard, { type CardQuestion } from './question-card';
import type { ModuleNumber, ProfileMarks } from '@/lib/types';

export const metadata = { title: 'Session — ExtraLesson' };
export const dynamic = 'force-dynamic';

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  const { id } = await params;
  if (!/^[a-f0-9]{24}$/.test(id)) notFound();

  await dbConnect();
  const session = await PracticeSession.findOne({ _id: id, student_id: auth.student_id }).lean<{
    _id: unknown;
    question_ids: unknown[];
    started_at: Date;
    completed_at?: Date;
  } | null>();
  if (!session) notFound();

  const attempts = await Attempt.find({ session_id: id })
    .sort({ ts: 1 })
    .lean<{ profile_marks: ProfileMarks; correct: boolean; question_id: unknown }[]>();
  const total = session.question_ids.length;
  const answered = attempts.length;

  if (answered >= total) {
    // Session complete -> summary (§6.4).
    if (!session.completed_at) {
      await PracticeSession.updateOne(
        { _id: id, completed_at: null },
        { $set: { completed_at: new Date() } },
      );
    }

    const student = await Student.findById(auth.student_id).lean<{
      target_modules: ModuleNumber[];
    } | null>();
    const targetModules = student?.target_modules ?? [1, 2, 3];
    const [before, after] = await Promise.all([
      loadStudyState(auth.student_id, targetModules, new Date(session.started_at)),
      loadStudyState(auth.student_id, targetModules),
    ]);

    const questions = await Question.find({ _id: { $in: session.question_ids } })
      .select('objective_ids')
      .lean<{ _id: unknown; objective_ids: string[] }[]>();
    const touchedObjectives = [...new Set(questions.flatMap((q) => q.objective_ids))].sort();
    const touchedPrefixes = new Set(
      touchedObjectives.map((o) => o.slice(0, o.lastIndexOf('.') + 1)),
    );

    const totals = attempts.reduce(
      (acc, a) => ({
        CK: acc.CK + a.profile_marks.CK,
        AK: acc.AK + a.profile_marks.AK,
        R: acc.R + a.profile_marks.R,
      }),
      { CK: 0, AK: 0, R: 0 },
    );
    const correctCount = attempts.filter((a) => a.correct).length;

    const deltas = after.topics
      .filter((t) => touchedPrefixes.has(`M${t.module}.${t.order}.`))
      .map((t) => {
        const prev = before.topics.find((b) => b.code === t.code);
        return { code: t.code, title: t.title, from: prev?.mastery ?? 0, to: t.mastery };
      });

    return (
      <main className="ruled relative min-h-screen px-5 py-8">
        <div className="pointer-events-none absolute inset-y-0 left-4 w-[1.5px] bg-margin" />
        <div className="mx-auto max-w-xl">
          <h1 className="text-2xl font-black">
            Session complete<span className="text-red-pen">.</span>
          </h1>
          <p className="mt-1 text-dim">
            {correctCount} of {total} correct.
          </p>

          <section className="mt-5 border-[1.5px] border-ink bg-white p-4 shadow-[3px_3px_0_var(--ink)]">
            <div className="font-mono text-[10px] uppercase tracking-widest text-dim">
              Marks by profile
            </div>
            <div className="mt-2 flex gap-6 text-center">
              {(['CK', 'AK', 'R'] as const).map((p) => (
                <div key={p}>
                  <div className="text-3xl font-black">{totals[p]}</div>
                  <div className="font-mono text-[10px] text-dim">{p}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-5">
            <div className="font-mono text-[10px] uppercase tracking-widest text-dim">
              Mastery moved
            </div>
            <ul className="mt-2 space-y-1">
              {deltas.map((d) => {
                const diff = Math.round((d.to - d.from) * 100);
                return (
                  <li key={d.code} className="flex justify-between text-sm">
                    <span>{d.title}</span>
                    <span
                      className={`font-mono text-xs ${diff > 0 ? 'text-green-pen' : diff < 0 ? 'text-red-pen' : 'text-dim'}`}
                    >
                      {Math.round(d.from * 100)}% → {Math.round(d.to * 100)}%
                      {diff !== 0 && ` (${diff > 0 ? '+' : ''}${diff})`}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="mt-5">
            <div className="font-mono text-[10px] uppercase tracking-widest text-dim">
              Objectives touched
            </div>
            <p className="mt-1 font-mono text-xs text-dim">{touchedObjectives.join(' · ')}</p>
          </section>

          <Link
            href="/study"
            className="mt-8 block bg-red-pen p-4 text-center font-black text-white shadow-[4px_4px_0_var(--ink)]"
          >
            Back to your copybook
          </Link>
        </div>
      </main>
    );
  }

  // Next unanswered question.
  const question = await Question.findById(session.question_ids[answered]).lean<{
    _id: unknown;
    kind: 'mcq' | 'structured';
    stimulus?: string;
    stem: string;
    visual?: { template?: string; params?: unknown };
    options?: string[];
    marks: number;
    parts?: {
      label: string;
      prompt: string;
      marks: number;
      statement?: string;
      slots?: { label: string; prompt?: string; response_mode?: string }[];
    }[];
    rubric?: { code: string; profile: string; criterion: string; mark_value: number; part_label?: string }[];
  } | null>();
  if (!question) notFound();

  // A construct question's figure IS the answer to its part (a), and every
  // later part asks the student to read something off it. It is withheld until
  // they commit, and comes back with the marking (see actions.ts).
  const withholdsFigure = (question.parts ?? []).some((p) =>
    (p.slots ?? []).some((slot) => slot.response_mode === 'construct'),
  );

  let visualHtml: string | undefined;
  if (question.visual?.template && !withholdsFigure) {
    try {
      visualHtml = renderVisual(question.visual as never, {
        stimulus: question.stimulus,
        stem: question.stem,
        partPrompts: (question.parts ?? []).flatMap((p) => [
          p.prompt,
          ...(p.slots ?? []).map((slot) => slot.prompt ?? ''),
        ]),
      });
    } catch {
      visualHtml = undefined;
    }
  }

  const card: CardQuestion = {
    sessionId: id,
    index: answered,
    total,
    kind: question.kind,
    stimulusHtml: question.stimulus ? renderMathHtml(question.stimulus) : undefined,
    stemHtml: renderMathHtml(question.stem),
    visualHtml,
    parts: (question.parts ?? []).map((p) => ({
      label: p.label,
      marks: p.marks,
      promptHtml: renderMathHtml(p.prompt),
      // A cloze statement is rendered as the prose BETWEEN its gaps: KaTeX has
      // to run on each piece separately, or the split would cut a math span in
      // half. n gaps give n+1 pieces, and the inputs go between them.
      statementHtml: p.statement
        ? p.statement.split('{}').map((piece: string) => renderMathHtml(piece))
        : undefined,
      slots: (p.slots ?? []).map((slot) => ({
        ref: `${p.label}.${slot.label}`,
        label: slot.label,
        promptHtml: slot.prompt ? renderMathHtml(slot.prompt) : undefined,
        promptText: slot.prompt,
        mode: slot.response_mode ?? 'answer',
      })),
    })),
    optionsHtml: question.options?.map(renderMathHtml),
    marks: question.marks,
    rubricCodes:
      question.rubric?.map((r) => ({
        code: r.code,
        profile: r.profile,
        mark_value: r.mark_value,
        part_label: r.part_label ?? 'a',
      })) ?? [],
  };

  return (
    <main className="ruled relative min-h-screen px-5 py-8">
      <div className="pointer-events-none absolute inset-y-0 left-4 w-[1.5px] bg-margin" />
      <div className="mx-auto max-w-xl">
        <header className="flex items-baseline justify-between font-mono text-xs text-dim">
          <Link href="/study" className="underline">
            ← copybook
          </Link>
          <span>
            Q{answered + 1} OF {total}
          </span>
        </header>
        <QuestionCard question={card} />
      </div>
    </main>
  );
}
