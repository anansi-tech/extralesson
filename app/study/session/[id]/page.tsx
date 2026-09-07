import 'katex/dist/katex.min.css';
import { notFound } from 'next/navigation';
import { dbConnect, Attempt, LineRejected, MarkDispute, PracticeSession, Question, Student, Topic, Transcription } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { renderMathHtml } from '@/lib/katex';
import { renderVisual, renderStimulusTable } from '@/lib/visuals';
import { planSession, topicPrefixesOf } from '@/lib/session/plan';
import { legibleMinWidth, MAX_FIGURE_PX } from '@/lib/visuals/legibility';
import { slotCellNames } from '@/lib/visuals/slot-names';
import { SessionDraft } from '@/lib/db';
import { DIAGNOSTIC_MINUTES, SESSION_MINUTES } from '@/lib/session/builder';
import { diagnosticOpensAt } from '@/lib/access';
import { rankForFinish, topicsSeen, verdictFor } from '@/lib/study/diagnostic';
import { gradeLabel, topicLeverage } from '@/lib/study/leverage';
import { marksByObjective, marksOnTopic, mainTopic, movedLine, trendLine, trendOnTopic } from '@/lib/study/summary';
import { SessionSummary } from './session-summary';
import { DiagnosticIntro } from './diagnostic-intro';
import { DiagnosticFinish } from './diagnostic-finish';
import { loadStudyState } from '@/lib/study/state';
import { attemptOutcome, type OutcomeQuestion, type OutcomeRead, type OutcomeRow } from '@/lib/study/outcome';
import { boxWidthChars, isMultiValue, readInputShape, showsBoxCount } from '@/lib/grade/input-shape';
import { inputAffordance } from '@/lib/grade/input-hints';
import QuestionCard, { type CardQuestion } from './question-card';
import { SessionBar } from './session-bar';
import type { ReadResult } from './capture';
import { MAX_TAKES } from '@/lib/grade/transcribe';
import { answersEquivalentAny } from '@/lib/grade/equivalence';
import { hintLine } from '@/lib/grade/reason';
import { roundingOf } from '@/lib/grade/rounding';
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
  searchParams: Promise<{ q?: string; begin?: string }>;
}) {
  const auth = await requireSession();
  const { id } = await params;
  const { q: qParam, begin } = await searchParams;
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
        rubric?: (OutcomeRow & { criterion: string; part_label?: string; for_format?: boolean })[];
      }[]
    >();
  // THE ONE FOLD (ROUND_6 Task 1): every number on this page comes from it.
  const foldQuestions = await Question.find({ _id: { $in: attempts.map((a) => a.question_id) } })
    .select('marks profile parts rubric')
    .lean<(OutcomeQuestion & { _id: unknown })[]>();
  const foldQuestionBy = new Map(foldQuestions.map((q) => [String(q._id), q]));
  const foldReads = await Transcription.find({ attempt_id: { $in: attempts.map((a) => a._id) } })
    .select('attempt_id legible marker_version method_marks')
    .lean<(OutcomeRead & { attempt_id: unknown })[]>();
  const outcomeOf = (a: (typeof attempts)[number]) =>
    attemptOutcome(a, foldQuestionBy.get(String(a.question_id)) ?? {}, foldReads.filter((r) => String(r.attempt_id) === String(a._id)));
  const total = session.question_ids.length;
  const answered = attempts.length;

  // A student may look back at an answered question but may not skip ahead, so
  // the index is clamped to the first unanswered one. Revisiting is READ-ONLY
  // and writes nothing: the view is a fold over the attempt (ROUND_1 §3.5).
  const asked = qParam === undefined ? null : Number(qParam);
  const index =
    asked !== null && Number.isInteger(asked) ? Math.min(Math.max(asked, 0), Math.min(answered, total - 1)) : answered;
  const reviewing = index < answered;

  // BEFORE THE FIRST TAP of a diagnostic: the three facts and the count, once.
  if (session.mode === 'diagnostic' && answered === 0 && !reviewing && begin !== '1') {
    return <DiagnosticIntro total={total} minutes={DIAGNOSTIC_MINUTES} href={`/study/session/${id}?begin=1`} />;
  }

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

    const outcomes = attempts.map((a) => ({ index: attempts.indexOf(a), ...outcomeOf(a) }));
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
    const touchedPrefixes = new Set(
      touchedObjectives.map((o) => o.slice(0, o.lastIndexOf('.') + 1)),
    );


    const deltas = after.topics
      .filter((t) => touchedPrefixes.has(`M${t.module}.${t.order}.`))
      .map((t) => {
        const prev = before.topics.find((b) => b.code === t.code);
        return { code: t.code, title: t.title, from: prev?.mastery ?? 0, to: t.mastery };
      });

    const tiles = outcomes.map((o) => ({ index: o.index, earned: o.earned, assessed: o.assessed, href: `/study/session/${id}?q=${o.index}#marking` }));
    const sessionEarned = outcomes.reduce((n, o) => n + o.earned, 0);
    const sessionAssessed = outcomes.reduce((n, o) => n + o.assessed, 0);
    const headline = `${sessionEarned} of ${sessionAssessed} mark${sessionAssessed === 1 ? '' : 's'}`;
    const moved = movedLine(deltas);
    const quiet = { label: 'Back to your notebook', href: '/study' };

    // The first question says one thing: what the working earned, and that
    // the diagnostic is next (ROUND_4 Task 2). No ranking, no estimate.
    if (session.mode === 'first') {
      const opensAt = await diagnosticOpensAt(auth.student_id);
      const diagnosticOpen = opensAt === null || Date.now() >= opensAt.getTime();
      return (
        <SessionSummary
          eyebrow="Your first session"
          headline={headline}
          claim="Nothing to compare it against yet. From tomorrow this line shows which way it is going."
          tilesLabel="What that question earned"
          questions={tiles}
          moved={moved}
          before={
            <section className="mt-5 border-l-3 border-red-pen bg-[#FDF1F0] px-3 py-2">
              <div className="section-label">Next: the diagnostic</div>
              <p className="mt-1 text-sm leading-snug">
                Eight quick questions across the syllabus. Nothing is graded — it puts your topics in
                order, so the sessions after it start in the right place.
              </p>
            </section>
          }
          action={
            diagnosticOpen
              ? { label: 'Start the diagnostic', small: `About ${DIAGNOSTIC_MINUTES} minutes · finds where to start`, mode: 'diagnostic' }
              : { label: 'Start a session', small: `About ${SESSION_MINUTES} minutes at exam pace`, mode: 'adaptive' }
          }
          quiet={quiet}
        />
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

      const leverage = new Map(topicLeverage(after, targetModules).map((t) => [t.code, Math.round(t.pointsAvailable)]));
      const ranked = rankForFinish(
        after.topics.filter((t) => touchedPrefixes.has(`M${t.module}.${t.order}.`)),
        verdictOf,
        (t) => leverage.get(t.code) ?? 0,
      ).map((t) => {
        const s = seen.get(`M${t.module}.${t.order}.`);
        return { code: t.code, title: t.title, right: s?.right ?? 0, asked: s?.asked ?? 0, marks: leverage.get(t.code) ?? 0 };
      });

      // Not a guess about what comes next: planSession is what the button below
      // runs, it is pure, and nothing changes between here and the click.
      const nextUp = await planSession({
        studentId: auth.student_id,
        targetModules,
        mode: 'adaptive',
      });
      const nextPrefixes = new Set(topicPrefixesOf(nextUp));
      const nextTopic = after.topics.find((t) => nextPrefixes.has(`M${t.module}.${t.order}.`));

      return <DiagnosticFinish ranked={ranked} next={nextTopic?.title ?? null} minutes={SESSION_MINUTES} />;
    }

    // What the next session actually starts with: planSession is what the button runs.
    const nextUp = await planSession({ studentId: auth.student_id, targetModules, mode: 'adaptive' });
    const nextPrefixes = new Set(topicPrefixesOf(nextUp));
    const nextTopic = after.topics.find((t) => nextPrefixes.has(`M${t.module}.${t.order}.`));
    const leverage = new Map(topicLeverage(after, targetModules).map((t) => [t.code, Math.round(t.pointsAvailable)]));
    const nextSmall = nextTopic
      ? `${nextTopic.title} is next · +${leverage.get(nextTopic.code) ?? 0} marks`
      : `About ${SESSION_MINUTES} minutes at exam pace`;
    const action = { label: 'Start the next session', small: nextSmall, mode: 'adaptive' };
    const byObjective = await marksByObjective(session._id);

    // A revisit says, per objective, whether the marks came back (ROUND_9 Task 6).
    if (session.mode === 'revisit') {
      const objectives = [...byObjective]
        .filter(([, m]) => m.assessed > 0)
        .map(([objectiveId, m]) => ({ text: textById.get(objectiveId) ?? objectiveId, recovered: m.earned === m.assessed }));
      const recovered = objectives.filter((o) => o.recovered).length;
      return (
        <SessionSummary
          eyebrow={`Revisit · ${objectives.length} objective${objectives.length === 1 ? '' : 's'}`}
          headline={headline}
          claim="These were new questions on the objectives you had lost marks on."
          questions={tiles}
          objectives={objectives}
          moved={objectives.length > 0 ? `${recovered} of ${objectives.length} recovered.` : null}
          action={action}
          quiet={quiet}
        />
      );
    }

    // An ordinary session: the trend on the same topic, only where an earlier
    // session assessed it; the letter only when the gate allows an estimate.
    const prefix = mainTopic(byObjective);
    const topic = prefix ? after.topics.find((t) => `M${t.module}.${t.order}.` === prefix) : undefined;
    const trend = prefix ? await trendOnTopic(auth.student_id, session._id, prefix, new Date(session.started_at)) : null;
    const sessionCount = await PracticeSession.countDocuments({ student_id: auth.student_id, completed_at: { $ne: null }, mode: { $in: ['adaptive', 'topic', 'revisit'] } });
    return (
      <SessionSummary
        eyebrow={`Session ${sessionCount}${topic ? ` · ${topic.title}` : ''}`}
        headline={headline}
        claim={prefix ? trendLine(marksOnTopic(byObjective, prefix), trend) : null}
        questions={tiles}
        estimate={after.prediction.estimable && after.prediction.overall_grade ? gradeLabel(after.prediction.overall_grade) : null}
        moved={moved}
        action={action}
        quiet={quiet}
      />
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
    rubric?: { code: string; profile: 'CK' | 'AK' | 'R'; criterion: string; mark_value: number; part_label?: string; slot_ref?: string; hint?: string }[];
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
  // A session is usually all of one paper; say which only when it is.

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
    // The marked take, and a take whose marking failed: its text stands and
    // can be marked again from here (ROUND_6 Task 1).
    const takes = await Transcription.find({ attempt_id: attempt._id, $or: [{ marker_version: { $exists: true } }, { 'marking.status': 'failed' }] })
      .sort({ take: 1 })
      .select('lines legible notes method_marks slips marker_version take')
      .lean<
        {
          _id: unknown;
          take: number;
          legible: boolean;
          notes?: string;
          marker_version?: string;
          lines: { text: string; part_label?: string | null; confidence: number }[];
          method_marks?: { code: string; awarded: boolean; reason: string; mark_value: number }[];
          slips?: { part: string; quote: string; sentence: string }[];
        }[]
      >();
    const disputes = await MarkDispute.find({ attempt_id: attempt._id })
      .select('transcription_id code')
      .lean<{ transcription_id: unknown; code: string }[]>();
    const rejections = await LineRejected.find({ transcription_id: { $in: takes.map((t) => t._id) } })
      .select('transcription_id line_index')
      .lean<{ transcription_id: unknown; line_index: number }[]>();
    const refs: string[] = (question.parts ?? []).flatMap((p) =>
      (p.slots ?? []).filter((sl) => (sl.response_mode ?? 'answer') === 'answer').map((sl) => `${p.label}.${sl.label}`),
    );
    const answers = splitStoredAnswer(String(attempt.answer), refs);
    const slotByRef = new Map<string, { answer: string; accept?: string[]; answer_format?: string; prompt?: string; partPrompt: string }>(
      (question.parts ?? []).flatMap((p) => (p.slots ?? []).map((sl) => [`${p.label}.${sl.label}`, { ...sl, partPrompt: p.prompt }])),
    );
    prior = {
      answers,
      selected: question.kind === 'mcq' ? Number(attempt.answer) : undefined,
      working: takes.map((t) => ({
        take: t.take,
        of: takes.length,
        transcriptionId: String(t._id),
        disputed: disputes.filter((d) => String(d.transcription_id) === String(t._id)).map((d) => d.code),
        rejected: rejections.filter((r) => String(r.transcription_id) === String(t._id)).map((r) => r.line_index),
        lines: t.lines.map((l) => ({
          text: l.text,
          part_label: l.part_label ?? null,
          confidence: l.confidence,
        })),
        legible: t.legible,
        marked: !!t.marker_version,
        notes: t.notes,
        method: (t.method_marks ?? []).map((m) => ({
          code: m.code,
          awarded: m.awarded,
          reasonHtml: renderMathHtml(m.reason),
        })),
        slips: t.slips ?? [],
      })),
      feedback: {
        attemptId: String(attempt._id),
        earnableByMethod: 0, // a question already answered is not re-photographed
        correct: attempt.correct,
        profile_marks: attempt.profile_marks,
        rubric_awarded: attempt.rubric_awarded,
        partResults: refs.map((ref) => {
          const slot = slotByRef.get(ref);
          const rounding = roundingOf({ answer_format: slot?.answer_format, prompts: [slot?.partPrompt, slot?.prompt], canonical: slot?.answer });
          const correct = answersEquivalentAny(answers[ref] ?? '', slot?.answer ?? '', slot?.accept, rounding);
          const line = correct ? undefined : hintLine(question.rubric ?? [], ref);
          return { label: ref, correct, reasonHtml: line ? renderMathHtml(line) : undefined };
        }),
        feedbackTitleHtml: 'Worked solution',
        feedbackHtml: renderMathHtml(question.worked_solution),
        isMisconception: false,
        // Same rule as actions.ts on the live path: the figure stands as the
        // construction only when the figure is the answer.
        construction:
          constructActs(question.visual as never).length &&
          (question.parts ?? []).some((p) => (p.slots ?? []).some((sl) => sl.response_mode === 'construct'))
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
    : await Transcription.find({ session_id: id, question_index: index, pending: { $ne: true } })
        .sort({ take: 1 })
        .select('lines answers legible notes take')
        .lean<{ _id: unknown; take: number; lines: ReadResult['transcription']['lines']; answers?: ReadResult['transcription']['answers']; legible: boolean; notes?: string }[]>();
  const latest = reads.at(-1);
  const rejectedLines = latest
    ? (await LineRejected.find({ transcription_id: latest._id }).select('line_index').lean<{ line_index: number }[]>()).map((r) => r.line_index)
    : [];
  const read: (ReadResult & { rejected: number[] }) | undefined = latest
    ? {
        transcription: { lines: latest.lines, answers: latest.answers ?? [], legible: latest.legible, notes: latest.notes },
        transcriptionId: String(latest._id),
        take: latest.take,
        takesLeft: MAX_TAKES - reads.length,
        prefill: {},
        rejected: rejectedLines,
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
      promptText: p.prompt.replace(/\$/g, ''),
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
    topicTitle: session.mode === 'diagnostic' ? await topicTitleOf(question._id) : undefined,
    scored: session.mode !== 'diagnostic',
    marks: question.marks,
    // Looking back renders the rubric the attempt was marked against, not the bank's today.
    rubricCodes:
      (reviewing ? attempts[index].rubric ?? question.rubric : question.rubric)?.map((r) => ({
        code: r.code,
        profile: r.profile,
        mark_value: r.mark_value,
        part_label: r.part_label ?? 'a',
        slot_ref: r.slot_ref ?? '',
      })) ?? [],
  };

  return (
    <div>
      <SessionBar index={index} total={total} marksAnswered={marksAnswered} marksTotal={marksTotal} diagnostic={session.mode === 'diagnostic'} />
        <QuestionCard question={card} />
    </div>
  );
}

/** The topic a question sits in, by its first objective: the label above an unscored card. */
async function topicTitleOf(questionId: unknown): Promise<string | undefined> {
  const q = await Question.findById(questionId).select('objective_ids').lean<{ objective_ids: string[] } | null>();
  if (!q?.objective_ids[0]) return undefined;
  const topic = await Topic.findOne({ 'objectives.id': q.objective_ids[0] }).select('title').lean<{ title: string } | null>();
  return topic?.title;
}
