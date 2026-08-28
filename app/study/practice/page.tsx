import 'katex/dist/katex.min.css';
import Link from 'next/link';
import { dbConnect, Attempt, Question, Student } from '@/lib/db';
import { m1GateHolds, rankByNeed } from '@/lib/session/builder';
import { loadStudyState } from '@/lib/study/state';
import { requireSession } from '@/lib/auth/session';
import { renderMathHtml } from '@/lib/katex';
import { renderVisual, renderStimulusTable, type StoredVisual } from '@/lib/visuals';
import WorkedCard, { type WorkedQuestion } from './worked-card';
import type { ModuleNumber, TemplateName } from '@/lib/types';

// R1.6 §1 — "show that" and "explain" parts cannot be auto-marked: the stem
// already states the answer, so comparing a typed answer against it would pass
// a student who wrote nothing. They are still the commonest pattern in the real
// papers, so they live here instead: attempt on paper, reveal, self-mark, and
// nothing is written to attempts.

export const metadata = { title: 'Worked practice — ExtraLesson' };
export const dynamic = 'force-dynamic';

// A question with any markable part belongs in the daily session, where its
// self-marked parts are shown inline. This surface is for the rare question
// that is self-marked end to end.
const SELF_MARKED_MODES = ['show_that', 'explain', 'construct'];

interface LeanQuestion {
  objective_ids?: string[];
  _id: unknown;
  module: ModuleNumber;
  marks: number;
  stimulus?: string;
  stem: string;
  visual?: { template: TemplateName; params: Record<string, unknown> };
  stimulus_table?: Record<string, unknown>;
  parts?: {
    label: string;
    prompt: string;
    marks: number;
    slots?: { label: string; prompt?: string; response_mode?: string }[];
  }[];
  worked_solution: string;
  rubric?: { code: string; profile: string; criterion: string; mark_value: number; part_label: string }[];
}

/**
 * How many to put in front of a student who has come here to work.
 *
 * Listing everything made the page nineteen screens of exam questions, which is
 * a catalogue: a student opening it wants something to start, not a library to
 * browse. The rest is one tap away.
 */
const SHOWN = 6;

export default async function WorkedPracticePage({
  searchParams,
}: {
  searchParams: Promise<{ all?: string }>;
}) {
  const { all } = await searchParams;
  const showAll = all === '1';
  const auth = await requireSession();
  await dbConnect();
  const student = await Student.findById(auth.student_id).lean<{
    target_modules: ModuleNumber[];
  } | null>();
  if (!student) return null;

  // Questions the student has already met in a session; this page is practice,
  // not a replay of work they have done.
  const attempted = await Attempt.distinct('question_id', { student_id: auth.student_id });

  // ANY self-marked part qualifies, not questions made ENTIRELY of them.
  //
  // The $nin clause required that no slot anywhere in the question was
  // auto-marked, and the generator does not write those: a question with a
  // markable part goes to the daily session, so every one of the 309 questions
  // carrying a "show that", an "explain" or a construction was excluded and
  // this page had never once had anything on it. Those three are a real slice
  // of the paper, and their character is exactly what this page is for — a
  // written answer the student marks against the solution.
  const where = {
    status: 'approved',
    module: { $in: student.target_modules },
    'parts.slots.response_mode': { $in: SELF_MARKED_MODES },
    _id: { $nin: attempted },
  };

  // RANK FIRST, FETCH SECOND.
  //
  // Every candidate is ranked, then the top few are loaded in full. Taking a
  // page from the database and sorting THAT would order an arbitrary handful
  // and still call it weakest-first — the ordering would be real and the claim
  // about it false.
  const ids = await Question.find(where).select('objective_ids module marks').lean<
    { _id: unknown; objective_ids?: string[]; module: ModuleNumber; marks: number }[]
  >();

  // Ordered the way a session is ordered, by the session builder's own
  // function: Module 1 while it gates, then topics never opened, then weight
  // times what is missing. A practice page that ranked differently would send
  // the student somewhere their session would not.
  const state = await loadStudyState(auth.student_id, student.target_modules);
  const ranked = rankByNeed(
    ids.map((q) => ({
      id: String(q._id),
      objective_ids: q.objective_ids ?? [],
      module: q.module,
      kind: 'structured' as const,
      marks: q.marks,
    })),
    {
      perObjectiveMastery: state.perObjective,
      topicWeightByPrefix: state.topicWeightByPrefix,
      attemptedObjectives: state.attemptedObjectives,
      m1Gated: m1GateHolds(student.target_modules, state.moduleMastery[1]),
    },
  );

  // Deep enough that the six at the top are a real choice from the weakest
  // topics, shallow enough that "show the other twelve" is still a page rather
  // than a catalogue.
  const POOL = 18;
  const wanted = ranked.slice(0, showAll ? POOL : SHOWN).map((r) => r.id);
  const total = Math.min(ranked.length, POOL);

  const rows = await Question.find({ _id: { $in: wanted } })
    .select('module marks stimulus stem visual stimulus_table parts worked_solution rubric')
    .lean<LeanQuestion[]>();
  const byId = new Map(rows.map((q) => [String(q._id), q]));
  const shown = wanted.map((id) => byId.get(id)!).filter(Boolean);

  const questions: WorkedQuestion[] = shown.map((q) => ({
    id: String(q._id),
    module: q.module,
    marks: q.marks,
    stimulusHtml: q.stimulus ? renderMathHtml(q.stimulus) : undefined,
    stemHtml: renderMathHtml(q.stem),
    stimulusTableHtml: q.stimulus_table
      ? renderStimulusTable(q.stimulus_table, {
          stimulus: q.stimulus,
          stem: q.stem,
          partPrompts: (q.parts ?? []).flatMap((p) => [
            p.prompt,
            ...(p.slots ?? []).map((slot) => slot.prompt ?? ''),
          ]),
        })
      : undefined,
    visualHtml: q.visual?.template
      ? renderVisual(q.visual as StoredVisual, {
          stimulus: q.stimulus,
          stem: q.stem,
          partPrompts: (q.parts ?? []).flatMap((p) => [
        p.prompt,
        ...(p.slots ?? []).map((slot) => slot.prompt ?? ''),
      ]),
        })
      : undefined,
    parts: (q.parts ?? []).map((p) => ({
      label: p.label,
      promptHtml: renderMathHtml(p.prompt),
      marks: p.marks,
      mode: (p.slots ?? []).every((s) => (s.response_mode ?? 'answer') !== 'answer')
        ? (p.slots?.[0]?.response_mode ?? 'answer')
        : 'answer',
    })),
    workedSolutionHtml: renderMathHtml(q.worked_solution),
    rubric: (q.rubric ?? []).map((r) => ({
      code: r.code,
      profile: r.profile,
      mark_value: r.mark_value,
      part_label: r.part_label,
      criterionHtml: renderMathHtml(r.criterion),
    })),
  }));

  return (
    <main className="ruled relative min-h-screen px-5 py-8">
      <div className="pointer-events-none absolute inset-y-0 left-4 w-[1.5px] bg-margin" />
      <div className="mx-auto max-w-xl">
        <Link href="/study" className="font-mono text-[10px] uppercase tracking-widest text-dim underline">
          &larr; Back to your notebook
        </Link>
        <h1 className="mt-3 text-2xl font-black">
          Worked practice<span className="text-red-pen">.</span>
        </h1>
        <p className="mt-1 text-sm text-dim">
          Exam questions that give away the answer and ask for the working, ask you to explain, or
          ask you to draw. A machine cannot mark these fairly yet, so you mark them: work each one
          on paper, then reveal the full solution and mark scheme. Nothing here changes your
          estimate.
        </p>

        {questions.length === 0 ? (
          // Not an error. This page fills as questions of these three kinds are
          // written and approved, and saying so is the difference between a
          // feature that is waiting and one that looks broken.
          <div className="mt-6 border-[1.5px] border-dashed border-paper-deep bg-white p-4 text-sm">
            <b>Nothing here yet for your modules.</b>
            <p className="mt-1 text-dim">
              Three kinds of question land on this page as they are written and approved:
            </p>
            <ul className="mt-2 space-y-1 text-dim">
              <li>
                <b className="text-ink">&ldquo;Show that&rdquo;</b> — the answer is printed in the
                question and the marks are for the working that gets there.
              </li>
              <li>
                <b className="text-ink">&ldquo;Explain&rdquo;</b> — a reason or a justification,
                marked on the argument rather than the value.
              </li>
              <li>
                <b className="text-ink">Constructions</b> — drawing a graph on graph paper, which
                you check against the finished figure and an examiner&rsquo;s list.
              </li>
            </ul>
            <p className="mt-2 text-dim">
              A question with any part we <i>can</i> mark goes into your daily session instead, with
              its self-marked parts shown alongside — so these three kinds are already reaching you
              there. Only a question that is self-marked from beginning to end waits here.
            </p>
          </div>
        ) : (
          <>
            {questions.map((q) => (
              <WorkedCard key={q.id} question={q} />
            ))}
            {!showAll && total > SHOWN && (
              <Link
                href="/study/practice?all=1"
                className="mt-6 block border-[1.5px] border-ink p-3 text-center font-mono text-xs uppercase tracking-widest"
              >
                Show the other {total - SHOWN}
              </Link>
            )}
          </>
        )}
      </div>
    </main>
  );
}
