import 'katex/dist/katex.min.css';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { dbConnect, Attempt, PracticeSession, Question, Student, Topic } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { renderMathHtml } from '@/lib/katex';
import { renderVisual } from '@/lib/visuals';
import { loadStudyState } from '@/lib/study/state';
import { estimatedMinutes } from '@/lib/session/builder';
import { markSplit } from '@/lib/grade/assessable';
import { FIXED_ARITY, isMultiValue, readInputShape } from '@/lib/grade/input-shape';
import { inputAffordance } from '@/lib/grade/input-hints';
import { PROFILE_GLOSS, PROFILE_MEANING } from '@/lib/study/profiles';
import QuestionCard, { type CardQuestion } from './question-card';
import { answersEquivalentAny } from '@/lib/grade/equivalence';
import { constructActs, figureGivesAnswer } from '@/lib/targets/construct';
import { splitStoredAnswer } from '@/lib/study/attempt-answers';
import type { ModuleNumber, ProfileMarks } from '@/lib/types';

export const metadata = { title: 'Session — ExtraLesson' };
export const dynamic = 'force-dynamic';

export default async function SessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const auth = await requireSession();
  const { id } = await params;
  const { q: qParam } = await searchParams;
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
    .lean<
      {
        profile_marks: ProfileMarks;
        correct: boolean;
        question_id: unknown;
        answer: string | number;
        rubric_awarded: string[];
      }[]
    >();
  const total = session.question_ids.length;
  const answered = attempts.length;

  // Which question is on screen. A student may look back at one they have
  // answered; they may not skip ahead of themselves, so the index is clamped to
  // the first unanswered one. Revisiting is READ-ONLY and writes nothing: the
  // view is a fold over the attempt that already exists (§3.5).
  const asked = qParam === undefined ? null : Number(qParam);
  const index =
    asked !== null && Number.isInteger(asked) ? Math.min(Math.max(asked, 0), Math.min(answered, total - 1)) : answered;
  const reviewing = index < answered;

  if (answered >= total && !reviewing) {
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
    // The objectives in the syllabus's own words, which is what a student can
    // read. The ids stay behind the scenes, where they address things.
    const touchedTopics = await Topic.find({ 'objectives.id': { $in: touchedObjectives } })
      .select('objectives')
      .lean<{ objectives: { id: string; text: string }[] }[]>();
    const textById = new Map(touchedTopics.flatMap((t) => t.objectives.map((o) => [o.id, o.text])));
    const touchedSkills = [...new Set(touchedObjectives.map((id) => textById.get(id)).filter(Boolean))] as string[];
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
              How you earned your marks
            </div>
            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-3 text-center">
              {(['CK', 'AK', 'R'] as const).map((p) => (
                <div key={p}>
                  <div className="text-3xl font-black">{totals[p]}</div>
                  <div className="font-mono text-[10px] text-dim">{p}</div>
                  <div className="text-[11px] leading-tight text-dim">{PROFILE_MEANING[p]}</div>
                </div>
              ))}
            </div>
            <p className="mt-3 border-t border-dashed border-paper-deep pt-2 text-[11px] leading-snug text-dim">
              {PROFILE_GLOSS} You will see the same three letters on a real mark scheme.
            </p>
          </section>

          <section className="mt-5">
            <div className="font-mono text-[10px] uppercase tracking-widest text-dim">
              Topic strength moved
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
            {/* This printed the syllabus codes — "M1.1.14 · M2.3.5" — under the
                word "objectives". Both halves were ours rather than theirs: the
                codes mean nothing without the syllabus open, and a student does
                not call them objectives. */}
            <div className="font-mono text-[10px] uppercase tracking-widest text-dim">
              What this session covered
            </div>
            <ul className="mt-1 space-y-0.5 text-[13px] text-dim">
              {touchedSkills.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </section>

          <Link
            href="/study"
            className="mt-8 block bg-red-pen p-4 text-center font-black text-white shadow-[4px_4px_0_var(--ink)]"
          >
            Back to your notebook
          </Link>
        </div>
      </main>
    );
  }

  const question = await Question.findById(session.question_ids[index]).lean<{
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
      slots?: { label: string; prompt?: string; response_mode?: string; answer: string; accept?: string[] }[];
    }[];
    rubric?: { code: string; profile: string; criterion: string; mark_value: number; part_label?: string }[];
    answer_key?: number;
    worked_solution: string;
  } | null>();
  if (!question) notFound();

  // A construct question's figure IS the answer to its part (a), and every
  // later part asks the student to read something off it. It is withheld until
  // they commit, and comes back with the marking (see actions.ts).
  //
  // ...and only when the figure IS the answer. A pattern question's figure is
  // figures 1 to 3, which is the premise; hiding it asked the student to
  // continue a sequence they could not see.
  const withholdsFigure =
    !reviewing &&
    (question.parts ?? []).some((p) => (p.slots ?? []).some((slot) => slot.response_mode === 'construct')) &&
    figureGivesAnswer(question.visual?.template as never);

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

  // The session's shape in MARKS, which is the unit the budget is actually
  // spent in: "Question 1 of 2" reads as a trivially short session next to the
  // 15 minutes it claims, and 12 marks is what makes the 15 minutes honest.
  const sessionQuestions = await Question.find({ _id: { $in: session.question_ids } })
    .select('marks kind')
    .lean<{ _id: unknown; marks: number; kind: 'mcq' | 'structured' }[]>();
  const marksById = new Map(sessionQuestions.map((sq) => [String(sq._id), sq.marks]));
  const marksOf = (i: number) => marksById.get(String(session.question_ids[i])) ?? 0;
  const marksTotal = session.question_ids.reduce<number>((sum, _, i) => sum + marksOf(i), 0);
  const marksAnswered = session.question_ids.reduce<number>((sum, _, i) => (i < answered ? sum + marksOf(i) : sum), 0);
  // The exam's own pace, from the same constants the budget is built on, so the
  // claim on the card cannot drift from the session it describes.
  const sessionMinutes = Math.round(
    sessionQuestions.reduce((sum, sq) => sum + estimatedMinutes({ kind: sq.kind, marks: sq.marks } as never), 0),
  );
  // A session is usually all of one paper; say which only when it is.
  const kinds = new Set(sessionQuestions.map((sq) => sq.kind));
  const paperName = kinds.size === 1 ? ([...kinds][0] === 'mcq' ? 'Paper 1' : 'Paper 2') : 'exam';

  // A revisited question is rebuilt from its attempt — the answers the student
  // typed, and the marks they earned. Nothing is re-marked and nothing is
  // written; correctness per slot is recomputed with the same equivalence the
  // marker used, which is a fold over the attempt rather than a second opinion.
  let prior: CardQuestion['prior'];
  if (reviewing) {
    const attempt = attempts[index];
    const refs: string[] = (question.parts ?? []).flatMap((p) =>
      (p.slots ?? []).filter((sl) => (sl.response_mode ?? 'answer') === 'answer').map((sl) => `${p.label}.${sl.label}`),
    );
    const answers = splitStoredAnswer(String(attempt.answer), refs);
    const slotByRef = new Map<string, { answer: string; accept?: string[] }>(
      (question.parts ?? []).flatMap((p) => (p.slots ?? []).map((sl) => [`${p.label}.${sl.label}`, sl])),
    );
    prior = {
      answers,
      selected: question.kind === 'mcq' ? Number(attempt.answer) : undefined,
      feedback: {
        correct: attempt.correct,
        profile_marks: attempt.profile_marks,
        rubric_awarded: attempt.rubric_awarded,
        partResults: refs.map((ref) => {
          const slot = slotByRef.get(ref);
          return { label: ref, correct: answersEquivalentAny(answers[ref] ?? '', slot?.answer ?? '', slot?.accept) };
        }),
        feedbackTitleHtml: 'Worked solution',
        feedbackHtml: renderMathHtml(question.worked_solution),
        isMisconception: false,
        construction: constructActs(question.visual as never).length
          ? { figureHtml: visualHtml ?? '', acts: constructActs(question.visual as never) }
          : undefined,
      },
    };
  }

  const card: CardQuestion = {
    sessionId: id,
    index,
    total,
    marksTotal,
    marksAnswered,
    prior,
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
      slots: (p.slots ?? []).map((slot) => {
        const mode = slot.response_mode ?? 'answer';
        // The shape of the input is read from the ANSWER, on the server, and
        // only the shape crosses to the client — never the answer itself. For
        // a list or a set the box COUNT is withheld too: it would say how many
        // factors there are.
        const reading = mode === 'answer' && slot.answer ? readInputShape(slot.answer) : null;
        // What is legal to type, and the characters a phone keyboard hides.
        // Derived from the answer, on the server; the examples inside the hints
        // are constants, so nothing about THIS answer crosses over.
        const affordance = reading
          ? inputAffordance(slot.answer, reading.shape)
          : { hints: [], symbols: [] };
        return {
          ref: `${p.label}.${slot.label}`,
          label: slot.label,
          promptHtml: slot.prompt ? renderMathHtml(slot.prompt) : undefined,
          promptText: slot.prompt,
          mode,
          hints: affordance.hints,
          symbols: affordance.symbols,
          input:
            reading && isMultiValue(reading.shape)
              ? {
                  shape: reading.shape,
                  boxes: FIXED_ARITY.has(reading.shape) ? reading.boxes : undefined,
                  cols: reading.cols,
                }
              : undefined,
        };
      }),
    })),
    optionsHtml: question.options?.map(renderMathHtml),
    marks: question.marks,
    // What is actually on offer, and what the student marks themselves. The
    // card divided by the question total, so 11 out of 11 read as 11 out of 12.
    ...markSplit(question as never),
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
            ← notebook
          </Link>
          <span>
            Q{index + 1} OF {total} · {question.marks} MARK{question.marks === 1 ? '' : 'S'}
          </span>
        </header>
        {/* Why the session is one question. A student who expected eight and got
            one reads it as a short session rather than a whole exam question,
            and the minutes are what make the marks mean something. */}
        <p className="mt-1 text-[12px] leading-snug text-dim">
          {total === 1 ? 'One' : total} whole {paperName} {total === 1 ? 'question' : 'questions'} ·{' '}
          {marksTotal} marks · about {sessionMinutes} minutes at exam pace.{' '}
          {marksAnswered > 0 && <span className="text-ink">{marksAnswered} answered so far.</span>}
        </p>
        <QuestionCard question={card} />
      </div>
    </main>
  );
}
