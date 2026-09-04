import 'katex/dist/katex.min.css';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { dbConnect, Attempt, MarkDispute, PracticeSession, Question, Student, Topic, Transcription } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { renderMathHtml } from '@/lib/katex';
import { renderVisual, renderStimulusTable } from '@/lib/visuals';
import { planSession, topicPrefixesOf } from '@/lib/session/plan';
import { legibleMinWidth, MAX_FIGURE_PX } from '@/lib/visuals/legibility';
import { slotCellNames } from '@/lib/visuals/slot-names';
import { SessionDraft } from '@/lib/db';
import { DIAGNOSTIC_MINUTES, SESSION_MINUTES } from '@/lib/session/builder';
import { diagnosticOpensAt } from '@/lib/access';
import { rankByVerdict, topicsSeen, verdictFor } from '@/lib/study/diagnostic';
import { startSession } from '@/app/study/actions';
import { loadReviewable } from '@/lib/study/reviewable';
import { loadStudyState } from '@/lib/study/state';
import { estimatedMinutes } from '@/lib/session/builder';
import { markSplit } from '@/lib/grade/assessable';
import { boxWidthChars, isMultiValue, readInputShape, showsBoxCount } from '@/lib/grade/input-shape';
import { inputAffordance } from '@/lib/grade/input-hints';
import { PROFILE_GLOSS, PROFILE_GLOSS_SHORT, PROFILE_MEANING } from '@/lib/study/profiles';
import QuestionCard, { type CardQuestion } from './question-card';
import type { ReadResult } from './capture';
import { MAX_TAKES } from '@/lib/grade/transcribe';
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
    mode?: string;
  } | null>();
  if (!session) notFound();

  const attempts = await Attempt.find({ session_id: id })
    .sort({ ts: 1 })
    .lean<
      {
        _id: unknown;
        profile_marks: ProfileMarks;
        correct: boolean;
        question_id: unknown;
        answer: string | number;
        rubric_awarded: string[];
      }[]
    >();
  const total = session.question_ids.length;
  const answered = attempts.length;

  // A student may look back at an answered question but may not skip ahead, so
  // the index is clamped to the first unanswered one. Revisiting is READ-ONLY
  // and writes nothing: the view is a fold over the attempt (ROUND_1 §3.5).
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

    const reviewable = await loadReviewable(auth.student_id, { sessionId: String(id) });
    const questions = await Question.find({ _id: { $in: session.question_ids } })
      .select('objective_ids')
      .lean<{ _id: unknown; objective_ids: string[] }[]>();
    const touchedObjectives = [...new Set(questions.flatMap((q) => q.objective_ids))].sort();
    // The syllabus's own words, which is what a student can read; the ids stay
    // behind the scenes, where they address things.
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

    // The first question says one thing: what the working earned, and that
    // the diagnostic is next (ROUND_4 Task 2). No ranking, no estimate.
    if (session.mode === 'first') {
      const marked = reviewable[0];
      const earned = marked?.earned ?? totals.CK + totals.AK + totals.R;
      const outOf = marked?.marks ?? attempts.length;
      const opensAt = await diagnosticOpensAt(auth.student_id);
      const diagnosticOpen = opensAt === null || Date.now() >= opensAt.getTime();
      return (
        <main className="ruled relative min-h-screen px-5 py-8">
          <div className="pointer-events-none absolute inset-y-0 left-4 w-[1.5px] bg-margin" />
          <div className="mx-auto max-w-xl">
            <h1 className="text-2xl font-black">
              Marked<span className="text-red-pen">.</span>
            </h1>
            <section className="mt-5 border-[1.5px] border-ink bg-white p-4 shadow-[3px_3px_0_var(--ink)]">
              <div className="section-label">What that question earned</div>
              <div className="mt-2 text-5xl font-black text-red-pen">
                {earned}
                <span className="text-2xl text-dim">/{outOf}</span>
              </div>
              <p className="mt-2 text-[12px] leading-snug text-dim">
                {marked?.photographed
                  ? 'Marks for the answer, and marks for the method we read off your page.'
                  : 'Marks for the answer. Method marks need the working: photograph the page next time.'}
              </p>
              {marked && (
                <Link
                  href={`/study/session/${marked.sessionId}?q=${marked.index}`}
                  className="mt-3 block font-mono text-[11px] uppercase tracking-widest underline"
                >
                  Look at the marking
                </Link>
              )}
            </section>

            <section className="mt-5 border-l-3 border-red-pen bg-[#FDF1F0] p-3">
              <div className="section-label">Next: the diagnostic</div>
              <p className="mt-1 text-sm leading-snug">
                Eight quick questions across the syllabus. Nothing is graded — it puts your topics in
                order, so the sessions after it start in the right place.
              </p>
            </section>

            {diagnosticOpen ? (
              <form action={startSession} className="mt-5">
                <input type="hidden" name="mode" value="diagnostic" />
                <button className="w-full bg-red-pen p-4 text-center font-black text-white shadow-[4px_4px_0_var(--ink)]">
                  Start the diagnostic
                  <small className="block font-mono text-[10px] font-medium tracking-widest opacity-85">
                    ABOUT {DIAGNOSTIC_MINUTES} MINUTES · FINDS WHERE TO START
                  </small>
                </button>
              </form>
            ) : (
              <form action={startSession} className="mt-5">
                <input type="hidden" name="mode" value="adaptive" />
                <button className="w-full bg-red-pen p-4 text-center font-black text-white shadow-[4px_4px_0_var(--ink)]">
                  Start a session
                  <small className="block font-mono text-[10px] font-medium tracking-widest opacity-85">
                    ABOUT {SESSION_MINUTES} MINUTES AT EXAM PACE
                  </small>
                </button>
              </form>
            )}

            <Link
              href="/study"
              className="mt-3 block text-center font-mono text-[11px] uppercase tracking-widest text-dim underline"
            >
              Back to your notebook
            </Link>
          </div>
        </main>
      );
    }

    // A diagnostic reports the RANKING it went to get, never a grade: eight
    // items is far below the mark gate a prediction needs. Nor a score out of
    // eight, since WHICH topics are weak is the finding and how many were right
    // is not.
    if (session.mode === 'diagnostic') {
      // What this session SAW of each topic. The band is no use here: one
      // question per topic leaves every one WEAK, so identical chips would make
      // the order look arbitrary when it is not.
      const topicOfQuestion = new Map(
        questions.map((q) => [
          String(q._id),
          q.objective_ids[0]?.slice(0, q.objective_ids[0].lastIndexOf('.') + 1) ?? '',
        ]),
      );
      const seen = topicsSeen(attempts, topicOfQuestion);
      const verdictOf = (t: { module: number; order: number }) =>
        verdictFor(seen.get(`M${t.module}.${t.order}.`));

      const ranked = rankByVerdict(
        after.topics.filter((t) => touchedPrefixes.has(`M${t.module}.${t.order}.`)),
        verdictOf,
      );

      // Not a guess about what comes next: planSession is what the button below
      // runs, it is pure, and nothing changes between here and the click.
      const nextUp = await planSession({
        studentId: auth.student_id,
        targetModules,
        mode: 'adaptive',
      });
      const nextPrefixes = new Set(topicPrefixesOf(nextUp));
      const nextTopics = after.topics.filter((t) =>
        nextPrefixes.has(`M${t.module}.${t.order}.`),
      );

      return (
        <main className="ruled relative min-h-screen px-5 py-8">
          <div className="pointer-events-none absolute inset-y-0 left-4 w-[1.5px] bg-margin" />
          <div className="mx-auto max-w-xl">
            <h1 className="text-2xl font-black">
              Where you stand<span className="text-red-pen">.</span>
            </h1>
            <p className="mt-1 text-dim">
              A quick read of {ranked.length} topic{ranked.length === 1 ? '' : 's'} — enough to put
              them in order, which is all it was for.
            </p>

            <section className="mt-5 border-[1.5px] border-ink bg-white p-4 shadow-[3px_3px_0_var(--ink)]">
              <div className="section-label">
                Strongest to weakest
              </div>
              <ol className="mt-2">
                {ranked.map((t) => (
                  <li
                    key={t.code}
                    className="flex items-baseline gap-2 border-b border-dashed border-paper-deep py-1.5 last:border-0"
                  >
                    <span className="min-w-0 flex-1 text-sm">{t.title}</span>
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-dim">
                      {verdictOf(t)}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-[11px] leading-snug text-dim">
                One question a topic is a rough read — enough to point the next few sessions, not a
                verdict on any of them. Topics you were not asked about are not here at all, and
                still count as unmeasured.
              </p>
            </section>

            {nextTopics.length > 0 && (
              <section className="mt-4 border-l-3 border-red-pen bg-[#FDF1F0] p-3">
                <div className="section-label">
                  Your next session starts here
                </div>
                <ul className="mt-1">
                  {nextTopics.map((t) => (
                    <li key={t.code} className="text-sm font-semibold">
                      {t.title}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[11px] leading-snug text-dim">
                  That is what the diagnostic was for. This is chosen from every topic, not only the
                  ones above, and it weighs how much of a topic is still unmeasured against how
                  heavily the paper examines it — so a topic you got right once can still come first
                  when most of it is untested.
                </p>
              </section>
            )}

            <form action={startSession} className="mt-5">
              <input type="hidden" name="mode" value="adaptive" />
              <button className="w-full bg-red-pen p-4 text-center font-black text-white shadow-[4px_4px_0_var(--ink)]">
                Start that session
                <small className="block font-mono text-[10px] font-medium tracking-widest opacity-85">
                  ABOUT {SESSION_MINUTES} MINUTES AT EXAM PACE
                </small>
              </button>
            </form>

            <Link
              href="/study"
              className="mt-3 block text-center font-mono text-[11px] uppercase tracking-widest text-dim underline"
            >
              Back to your notebook
            </Link>
          </div>
        </main>
      );
    }

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
            <div className="section-label">
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
            {/* Compressed, not hidden: the initials keep their meaning on
                the same screen, and the explanation
                is one tap away. */}
            <p className="mt-3 border-t border-dashed border-paper-deep pt-2 font-mono text-[11px] leading-snug text-dim">
              {PROFILE_GLOSS_SHORT}
            </p>
            <details className="mt-1">
              <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-widest text-dim">
                Where these come from
              </summary>
              <p className="mt-1 text-[11px] leading-snug text-dim">
                {PROFILE_GLOSS} You will see the same three letters on a real mark scheme.
              </p>
            </details>
          </section>

          <section className="mt-5">
            <div className="section-label">
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

          {/* Read-only: the question, the mark scheme and the reasons are still there, and
              these open the same view paging back inside a session gives. */}
          {reviewable.length > 0 && (
            <section className="mt-5">
              <div className="section-label">
                Look back at a question
              </div>
              <ul className="mt-1 space-y-1">
                {reviewable.map((r) => (
                  <li key={`${r.sessionId}:${r.index}`}>
                    <Link
                      href={`/study/session/${r.sessionId}?q=${r.index}`}
                      className="flex min-h-11 items-baseline justify-between gap-2 border-b-[1.5px] border-rule text-[13px]"
                    >
                      <span className="underline">
                        Question {r.index + 1}
                        {r.photographed && (
                          <span className="ml-1 font-mono text-[10px] tracking-widest text-dim">
                            · PHOTO
                          </span>
                        )}
                      </span>
                      <span className="font-mono text-[12px] text-dim">
                        {r.earned}/{r.marks}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-5">
            {/* Not the syllabus codes and not the word "objectives": the codes
                mean nothing without the syllabus open, and a student does
                not call them objectives. */}
            <div className="section-label">
              What this session covered
            </div>
            <ul className="mt-1 space-y-0.5 text-[13px] text-dim">
              {touchedSkills.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </section>

          {/* The next session, not the way out: without it the thing to do
              next was a decision rather than a button. */}
          <form action={startSession} className="mt-8">
            <input type="hidden" name="mode" value="adaptive" />
            <button className="w-full bg-red-pen p-4 text-center font-black text-white shadow-[4px_4px_0_var(--ink)]">
              Start the next session
              <small className="block font-mono text-[10px] font-medium tracking-widest opacity-85">
                ABOUT {SESSION_MINUTES} MINUTES AT EXAM PACE
              </small>
            </button>
          </form>
          <Link
            href="/study"
            className="mt-3 block text-center font-mono text-[11px] uppercase tracking-widest text-dim underline"
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
    stimulus_table?: unknown;
    options?: string[];
    marks: number;
    parts?: {
      label: string;
      prompt: string;
      marks: number;
      statement?: string;
      slots?: { label: string; prompt?: string; response_mode?: string; answer: string; accept?: string[] }[];
    }[];
    rubric?: { code: string; profile: string; criterion: string; mark_value: number; part_label?: string; slot_ref?: string }[];
    answer_key?: number;
    worked_solution: string;
  } | null>();
  if (!question) notFound();

  // A construct question's figure IS the answer to its part (a), so it is
  // withheld until the student commits and comes back with the marking (see
  // actions.ts). Only when the figure is the answer: a pattern question's
  // figures are its premise, and hiding them hid the sequence.
  const withholdsFigure =
    !reviewing &&
    (question.parts ?? []).some((p) => (p.slots ?? []).some((slot) => slot.response_mode === 'construct')) &&
    figureGivesAnswer(question.visual?.template as never);

  // The GIVEN data table. Never withheld: unlike the figure it is not the
  // answer to anything, it is what the question is answered FROM.
  let stimulusTableHtml: string | undefined;
  if (question.stimulus_table) {
    try {
      stimulusTableHtml = renderStimulusTable(question.stimulus_table, {
        stimulus: question.stimulus,
        stem: question.stem,
        partPrompts: (question.parts ?? []).flatMap((p) => [
          p.prompt,
          ...(p.slots ?? []).map((slot) => slot.prompt ?? ''),
        ]),
      });
    } catch {
      stimulusTableHtml = undefined;
    }
  }

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

  // The session's shape in MARKS, the unit the budget is actually spent in:
  // "Question 1 of 2" reads as trivially short next to the minutes it claims.
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

  // A revisited question is rebuilt from its attempt. Nothing is re-marked and
  // nothing is written; correctness per slot is recomputed with the marker's
  // own equivalence, a fold over the attempt rather than a second opinion.
  let prior: CardQuestion['prior'];
  if (reviewing) {
    const attempt = attempts[index];
    // The image is gone after the TTL; the transcription and the per-row
    // reasons are not, and they are what a student most wants to reread. Only
    // the take that was marked: a read a second photograph replaced before
    // submit earned nothing and is not shown as if it had.
    const takes = await Transcription.find({ attempt_id: attempt._id, marker_version: { $exists: true } })
      .sort({ take: 1 })
      .select('lines legible notes method_marks take')
      .lean<
        {
          _id: unknown;
          take: number;
          legible: boolean;
          notes?: string;
          lines: { text: string; part_label?: string | null; confidence: number }[];
          method_marks?: { code: string; awarded: boolean; reason: string; mark_value: number }[];
        }[]
      >();
    const disputes = await MarkDispute.find({ attempt_id: attempt._id })
      .select('transcription_id code')
      .lean<{ transcription_id: unknown; code: string }[]>();
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
      working: takes.map((t) => ({
        take: t.take,
        of: takes.length,
        transcriptionId: String(t._id),
        disputed: disputes.filter((d) => String(d.transcription_id) === String(t._id)).map((d) => d.code),
        lines: t.lines.map((l) => ({
          text: l.text,
          part_label: l.part_label ?? null,
          confidence: l.confidence,
        })),
        legible: t.legible,
        notes: t.notes,
        method: (t.method_marks ?? []).map((m) => ({
          code: m.code,
          awarded: m.awarded,
          reason: m.reason,
        })),
        earned: (t.method_marks ?? []).filter((m) => m.awarded).reduce((n, m) => n + m.mark_value, 0),
      })),
      feedback: {
        attemptId: String(attempt._id),
        earnableByMethod: 0, // a question already answered is not re-photographed
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
        // Same rule as actions.ts on the live path: the figure stands as the
        // construction only when the figure is the answer.
        construction: constructActs(question.visual as never).length
          ? {
              figureHtml: figureGivesAnswer(question.visual?.template as never)
                ? (visualHtml ?? '')
                : '',
              describes: figureGivesAnswer(question.visual?.template as never)
                ? undefined
                : renderMathHtml(
                    (question.parts ?? [])
                      .flatMap((p) => p.slots ?? [])
                      .find((sl) => sl.response_mode === 'construct')?.answer ?? '',
                  ),
              acts: constructActs(question.visual as never),
            }
          : undefined,
      },
    };
  }

  // The symbol strip is the QUESTION's, not the slot's: offering a character
  // only where the answer needs it makes the strip vanish between boxes for no
  // reason a student can see. Rendered per input, so no cursor tracking.
  // A box in a table-completion part is named by the cell it fills, or the card
  // falls back to "first answer" and boxes filled in reading order get mismatched.
  const cellNames = slotCellNames(question.visual);

  // Slots the student marks themselves; their rubric rows are not auto-awarded.
  const selfMarkedRefs = new Set(
    (question.parts ?? []).flatMap((p) =>
      (p.slots ?? [])
        .filter((slot) => (slot.response_mode ?? 'answer') !== 'answer')
        .map((slot) => `${p.label}.${slot.label}`),
    ),
  );

  const questionSymbols = [
    ...new Set(
      (question.parts ?? []).flatMap((p) =>
        (p.slots ?? [])
          .filter((sl) => (sl.response_mode ?? 'answer') === 'answer' && sl.answer)
          .flatMap((sl) => inputAffordance(sl.answer, readInputShape(sl.answer).shape).symbols),
      ),
    ),
  ];

  // What was typed and not handed in. Only for the question actually being
  // answered: a question already attempted shows the attempt, not scratch.
  const draftRow = reviewing
    ? null
    : await SessionDraft.findOne({ session_id: id, question_index: index }).lean<{
        answers?: Record<string, string>;
        values?: Record<string, string[]>;
        selected?: number;
      } | null>();

  // A page photographed before submit: the take that stands, and how many
  // are left, so a reload shows what was read rather than offering a third.
  const reads = reviewing
    ? []
    : await Transcription.find({ session_id: id, question_index: index })
        .sort({ take: 1 })
        .select('lines answers legible notes take')
        .lean<{ take: number; lines: ReadResult['transcription']['lines']; answers?: ReadResult['transcription']['answers']; legible: boolean; notes?: string }[]>();
  const latest = reads.at(-1);
  const read: ReadResult | undefined = latest
    ? {
        transcription: { lines: latest.lines, answers: latest.answers ?? [], legible: latest.legible, notes: latest.notes },
        take: latest.take,
        takesLeft: MAX_TAKES - reads.length,
        prefill: {},
      }
    : undefined;

  const card: CardQuestion = {
    sessionId: id,
    index,
    total,
    marksTotal,
    marksAnswered,
    prior,
    draft:
      draftRow || read
        ? {
            answers: draftRow?.answers ?? {},
            values: draftRow?.values ?? {},
            selected: draftRow?.selected,
            read,
          }
        : undefined,
    kind: question.kind,
    stimulusHtml: question.stimulus ? renderMathHtml(question.stimulus) : undefined,
    stemHtml: renderMathHtml(question.stem),
    stimulusTableHtml,
    visualHtml,
    // How narrow this figure may be drawn before its labels stop being
    // readable. The card holds it and scrolls rather than shrinking past it.
    figureMinWidth: visualHtml ? (legibleMinWidth(visualHtml) ?? undefined) : undefined,
    figureMaxWidth: MAX_FIGURE_PX,
    parts: (question.parts ?? []).map((p) => ({
      label: p.label,
      marks: p.marks,
      promptHtml: renderMathHtml(p.prompt),
      // A cloze statement is the prose BETWEEN its gaps: KaTeX has to run on
      // each piece separately, or the split would cut a math span in half.
      statementHtml: p.statement
        ? p.statement.split('{}').map((piece: string) => renderMathHtml(piece))
        : undefined,
      slots: (p.slots ?? []).map((slot) => {
        const mode = slot.response_mode ?? 'answer';
        // The shape of the input is read from the ANSWER on the server, and
        // only the shape crosses to the client — never the answer itself. For a
        // list or a set the box COUNT is withheld too: it would count factors.
        const reading = mode === 'answer' && slot.answer ? readInputShape(slot.answer) : null;
        // Derived from the answer, on the server; the examples inside the
        // hints are constants, so nothing about THIS answer crosses over.
        const affordance = reading
          ? inputAffordance(slot.answer, reading.shape)
          : { hints: [], symbols: [] };
        return {
          ref: `${p.label}.${slot.label}`,
          label: slot.label,
          promptHtml: slot.prompt ? renderMathHtml(slot.prompt) : undefined,
          promptText: slot.prompt,
          mode,
          cellName: cellNames.get(`${p.label}.${slot.label}`),
          hints: affordance.hints,
          symbols: questionSymbols,
          input:
            reading && isMultiValue(reading.shape)
              ? {
                  shape: reading.shape,
                  boxes: showsBoxCount(reading) ? reading.boxes : undefined,
                  // THAT the elements are pairs, never HOW MANY: an outcome in
                  // a sample space is always two values, so saying so tells the
                  // student nothing they are being asked for.
                  pairs: reading.groups?.every((g) => g === 2) && reading.groupKind === '(',
                  cols: reading.cols,
                  // Wide enough for the longest value in the slot, so a box is
                  // never a clue to the length of its own answer.
                  chars: boxWidthChars(reading),
                }
              : undefined,
        };
      }),
    })),
    optionsHtml: question.options?.map(renderMathHtml),
    marks: question.marks,
    // What is actually on offer, split from what the student marks themselves,
    // so a full card does not read as 11 out of 12.
    ...markSplit(question as never),
    rubricCodes:
      question.rubric?.map((r) => ({
        code: r.code,
        profile: r.profile,
        mark_value: r.mark_value,
        part_label: r.part_label ?? 'a',
        // A row hanging off a self-marked slot is never awarded here, so the
        // strip must not cross it out and tell a student they failed a row that
        // was never on offer. It is out of the denominator too
        // (lib/grade/assessable.ts), so the score still reads 11 out of 11.
        selfMarked: selfMarkedRefs.has(r.slot_ref ?? ''),
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
        {/* Why the session is one question: a student who expected eight reads
            one as a short session rather than a whole exam question,
            and the minutes are what make the marks mean something. */}
        <p className="mt-1 text-[12px] leading-snug text-dim">
          {session.mode === 'first' ? (
            <>One short {paperName} question · {marksTotal} marks. Work it on paper, then photograph the page.</>
          ) : (
            <>
              {total === 1 ? 'One' : total} whole {paperName} {total === 1 ? 'question' : 'questions'} ·{' '}
              {marksTotal} marks · about {sessionMinutes} minutes at exam pace.{' '}
            </>
          )}
          {marksAnswered > 0 && <span className="text-ink">{marksAnswered} answered so far.</span>}
        </p>
        <QuestionCard question={card} />
      </div>
    </main>
  );
}
