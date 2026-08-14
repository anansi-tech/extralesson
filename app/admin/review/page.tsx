import 'katex/dist/katex.min.css';
import { dbConnect, Question } from '@/lib/db';
import { getCoverage, getNextDraftId } from '@/lib/admin/coverage';
import { renderMathHtml } from '@/lib/katex';
import { QuestionVisualZ } from '@/lib/validation/question-visual';
import ReviewCard, { type ReviewQuestion } from './review-card';

export const metadata = { title: 'Review queue — ExtraLesson admin' };
export const dynamic = 'force-dynamic';

export default async function ReviewPage() {
  await dbConnect();
  const [{ topics, bankTarget, approvedTotal, draftsRemaining }, nextId] = await Promise.all([
    getCoverage(),
    getNextDraftId(),
  ]);

  let question: ReviewQuestion | null = null;
  if (nextId) {
    const q = await Question.findById(nextId).lean<Record<string, unknown> | null>();
    if (q) {
      const raw = q as {
        _id: unknown;
        objective_ids: string[];
        module: number;
        kind: 'mcq' | 'structured';
        stem: string;
        options?: string[];
        answer_key?: number;
        profile?: string;
        difficulty: number;
        marks: number;
        visual?: unknown;
        rubric?: { code: string; profile: string; criterion: string; mark_value: number }[];
        final_answer?: string;
        worked_solution: string;
        misconceptions: { trigger: string; name: string; remediation: string }[];
      };
      const visual = QuestionVisualZ.nullable().parse(raw.visual ?? null);
      question = {
        id: String(raw._id),
        objective_ids: raw.objective_ids,
        module: raw.module,
        kind: raw.kind,
        stemHtml: renderMathHtml(raw.stem),
        optionsHtml: raw.options?.map(renderMathHtml),
        answer_key: raw.answer_key,
        profile: raw.profile,
        difficulty: raw.difficulty,
        marks: raw.marks,
        visual,
        rubric: raw.rubric?.map((r) => ({ ...r, criterionHtml: renderMathHtml(r.criterion) })),
        finalAnswerHtml: raw.final_answer ? renderMathHtml(raw.final_answer) : undefined,
        solutionHtml: renderMathHtml(raw.worked_solution),
        misconceptions: raw.misconceptions.map((m) => ({
          ...m,
          triggerHtml: renderMathHtml(m.trigger),
          remediationHtml: renderMathHtml(m.remediation),
        })),
        editJson: JSON.stringify(
          {
            kind: raw.kind,
            objective_ids: raw.objective_ids,
            module: raw.module,
            stem: raw.stem,
            ...(raw.kind === 'mcq'
              ? { options: raw.options, answer_key: raw.answer_key, profile: raw.profile }
              : { rubric: raw.rubric, final_answer: raw.final_answer }),
            difficulty: raw.difficulty,
            marks: raw.marks,
            visual,
            worked_solution: raw.worked_solution,
            misconceptions: raw.misconceptions,
          },
          null,
          2,
        ),
      };
    }
  }

  return (
    <main className="ruled relative min-h-screen px-6 py-8">
      <div className="pointer-events-none absolute inset-y-0 left-4 w-[1.5px] bg-margin" />
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
          <div className="text-xl font-black">
            extra<em className="not-italic text-red-pen">lesson</em>
            <span className="ml-2 font-mono text-xs uppercase tracking-widest text-dim">
              review queue
            </span>
          </div>
          <div className="font-mono text-xs text-dim">
            <b className="text-ink">{draftsRemaining}</b> drafts remaining ·{' '}
            <b className="text-ink">{approvedTotal}</b>/{bankTarget} approved
          </div>
        </header>

        {question ? (
          <ReviewCard question={question} />
        ) : (
          <p className="border-l-3 border-green-pen bg-white p-4">
            Queue is empty — no drafts to review. Run the generation pipeline to add more.
          </p>
        )}

        <section className="mt-10">
          <h2 className="font-mono text-xs uppercase tracking-widest text-dim">
            Coverage vs blueprint targets
          </h2>
          <div className="mt-2 grid gap-x-8 gap-y-1 sm:grid-cols-2">
            {topics.map((t) => (
              <div key={t.code} className="flex flex-wrap items-baseline justify-between text-sm">
                <span>
                  <span className="font-mono text-xs text-dim">{t.code}</span> {t.title}
                </span>
                <span className="font-mono text-xs">
                  <b className={t.approved >= t.target ? 'text-green-pen' : 'text-ink'}>
                    {t.approved}
                  </b>
                  /{t.target}
                  {t.drafts > 0 && <span className="text-dim"> (+{t.drafts} drafts)</span>}
                </span>
                <span className="w-full text-right font-mono text-[10px] text-dim">
                  MCQ {t.approvedMcq}/{t.targetMcq} · structured {t.approvedStructured}/{t.targetStructured} · visuals {t.approvedVisual}/{t.targetVisual}
                </span>
              </div>
            ))}
          </div>
          {[1, 2, 3].map((m) => {
            const mod = topics.filter((t) => t.module === m);
            const approved = mod.reduce((s, t) => s + t.approved, 0);
            const target = mod.reduce((s, t) => s + t.target, 0);
            return (
              <div key={m} className="mt-1 font-mono text-xs text-dim">
                M{m}: {approved}/{target} approved
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}
