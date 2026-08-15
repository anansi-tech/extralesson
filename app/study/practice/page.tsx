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

const SELF_MARKED_MODES = ['show_that', 'explain'];

interface LeanQuestion {
  _id: unknown;
  module: ModuleNumber;
  marks: number;
  stimulus?: string;
  stem: string;
  visual?: { template: TemplateName; params: Record<string, unknown> };
  parts?: { label: string; prompt: string; marks: number; response_mode?: string }[];
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
    'parts.response_mode': { $in: SELF_MARKED_MODES },
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
    visualHtml: q.visual?.template ? renderVisual(q.visual as StoredVisual) : undefined,
    parts: (q.parts ?? []).map((p) => ({
      label: p.label,
      promptHtml: renderMathHtml(p.prompt),
      marks: p.marks,
      mode: p.response_mode ?? 'answer',
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
          &larr; Back to your copybook
        </Link>
        <h1 className="mt-3 text-2xl font-black">
          Worked practice<span className="text-red-pen">.</span>
        </h1>
        <p className="mt-1 text-sm text-dim">
          Exam questions that give away the answer and ask for the working, or ask you to explain.
          A machine cannot mark these fairly yet, so you mark them: work each one on paper, then
          reveal the full solution and mark scheme. Nothing here changes your estimate.
        </p>

        {questions.length === 0 ? (
          <p className="mt-6 border-l-3 border-red-pen bg-[#FDF1F0] p-3 text-sm">
            No worked-practice questions for your modules yet. Check back soon.
          </p>
        ) : (
          questions.map((q) => <WorkedCard key={q.id} question={q} />)
        )}
      </div>
    </main>
  );
}
