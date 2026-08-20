import 'katex/dist/katex.min.css';
import Link from 'next/link';
import { dbConnect, Question, Student } from '@/lib/db';
import { requireSession } from '@/lib/auth/session';
import { renderMathHtml } from '@/lib/katex';
import { renderVisual, type StoredVisual } from '@/lib/visuals';
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
  _id: unknown;
  module: ModuleNumber;
  marks: number;
  stimulus?: string;
  stem: string;
  visual?: { template: TemplateName; params: Record<string, unknown> };
  parts?: {
    label: string;
    prompt: string;
    marks: number;
    slots?: { label: string; prompt?: string; response_mode?: string }[];
  }[];
  worked_solution: string;
  rubric?: { code: string; profile: string; criterion: string; mark_value: number; part_label: string }[];
}

export default async function WorkedPracticePage() {
  const auth = await requireSession();
  await dbConnect();
  const student = await Student.findById(auth.student_id).lean<{
    target_modules: ModuleNumber[];
  } | null>();
  if (!student) return null;

  const rows = await Question.find({
    status: 'approved',
    module: { $in: student.target_modules },
    'parts.slots.response_mode': { $in: SELF_MARKED_MODES, $nin: ['answer'] },
  })
    .select('module marks stimulus stem visual parts worked_solution rubric')
    .limit(20)
    .lean<LeanQuestion[]>();

  const questions: WorkedQuestion[] = rows.map((q) => ({
    id: String(q._id),
    module: q.module,
    marks: q.marks,
    stimulusHtml: q.stimulus ? renderMathHtml(q.stimulus) : undefined,
    stemHtml: renderMathHtml(q.stem),
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
          questions.map((q) => <WorkedCard key={q.id} question={q} />)
        )}
      </div>
    </main>
  );
}
