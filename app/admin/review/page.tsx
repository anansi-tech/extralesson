import 'katex/dist/katex.min.css';
import { dbConnect, Question } from '@/lib/db';
import { getCoverage, getNextDraftId } from '@/lib/admin/coverage';
import { renderMathHtml } from '@/lib/katex';
import { renderVisual } from '@/lib/visuals';
import ReviewCard, { type ReviewQuestion } from './review-card';

export const metadata = { title: 'Review queue — ExtraLesson admin' };
export const dynamic = 'force-dynamic';

export default async function ReviewPage() {
  await dbConnect();
  const [{ matrix, approvedTotal, draftsRemaining }, nextId] = await Promise.all([
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
        stimulus?: string;
        stem: string;
        visual?: { template?: string; params?: unknown };
        archetype?: string;
        representation?: string;
        options?: string[];
        answer_key?: number;
        profile?: string;
        difficulty: number;
        marks: number;
        parts?: { label: string; prompt: string; marks: number; answer: string; accept?: string[] }[];
        rubric?: { code: string; profile: string; criterion: string; mark_value: number; part_label?: string }[];
        final_answer?: string;
        worked_solution: string;
        misconceptions: { trigger: string; name: string; remediation: string }[];
        gen_meta?: { recipe?: unknown; dedup_score?: number; prompt_version?: string };
      };
      let visualHtml: string | undefined;
      if (raw.visual?.template) {
        try {
          visualHtml = renderVisual(raw.visual as never);
        } catch {
          visualHtml = `<p class="text-red-pen">visual failed to render (template ${raw.visual.template})</p>`;
        }
      }
      question = {
        id: String(raw._id),
        objective_ids: raw.objective_ids,
        module: raw.module,
        kind: raw.kind,
        archetype: raw.archetype,
        representation: raw.representation,
        stimulusHtml: raw.stimulus ? renderMathHtml(raw.stimulus) : undefined,
        stemHtml: renderMathHtml(raw.stem),
        visualHtml,
        parts: (raw.parts ?? []).map((p) => ({
          label: p.label,
          marks: p.marks,
          answer: p.answer,
          accept: p.accept,
          promptHtml: renderMathHtml(p.prompt),
        })),
        optionsHtml: raw.options?.map(renderMathHtml),
        answer_key: raw.answer_key,
        profile: raw.profile,
        difficulty: raw.difficulty,
        marks: raw.marks,
        rubric: raw.rubric?.map((r) => ({
          code: r.code,
          profile: r.profile,
          mark_value: r.mark_value,
          part_label: r.part_label ?? 'a',
          criterionHtml: renderMathHtml(r.criterion),
        })),
        final_answer: raw.final_answer,
        solutionHtml: renderMathHtml(raw.worked_solution),
        misconceptions: raw.misconceptions.map((m) => ({
          nameHtml: renderMathHtml(m.name),
          triggerHtml: renderMathHtml(m.trigger),
          remediationHtml: renderMathHtml(m.remediation),
        })),
        recipeJson: raw.gen_meta?.recipe ? JSON.stringify(raw.gen_meta.recipe) : undefined,
        dedupScore: raw.gen_meta?.dedup_score,
        editJson: JSON.stringify(
          {
            kind: raw.kind,
            objective_ids: raw.objective_ids,
            module: raw.module,
            stimulus: raw.stimulus,
            stem: raw.stem,
            visual: raw.visual?.template ? raw.visual : undefined,
            archetype: raw.archetype,
            representation: raw.representation,
            parts: raw.parts,
            ...(raw.kind === 'mcq'
              ? { options: raw.options, answer_key: raw.answer_key, profile: raw.profile }
              : { rubric: raw.rubric, final_answer: raw.final_answer }),
            difficulty: raw.difficulty,
            marks: raw.marks,
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
            <b className="text-ink">{approvedTotal}</b>/400 approved
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
            P1 matrix — {matrix.p1_actual_total}/160 MCQs ·{' '}
            {matrix.p1_actual_total > 0
              ? Math.round((matrix.mcq_visual_actual / matrix.p1_actual_total) * 100)
              : 0}
            % visual (target 37%)
          </h2>
          <div className="mt-2 grid gap-x-8 gap-y-1 sm:grid-cols-2">
            {matrix.topics.map((t) => (
              <div
                key={`p1-${t.code}`}
                className="flex items-baseline justify-between gap-3 text-sm"
              >
                <span className="min-w-0">
                  <span className="font-mono text-xs text-dim">{t.code}</span> {t.title}
                </span>
                <span className="shrink-0 whitespace-nowrap font-mono text-xs">
                  <b className={t.p1_actual >= t.p1_target ? 'text-green-pen' : 'text-ink'}>
                    {t.p1_actual}
                  </b>
                  /{t.p1_target}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="font-mono text-xs uppercase tracking-widest text-dim">
            P2 matrix — {matrix.p2_actual_total}/240 structured · coverage in rubric marks
          </h2>
          <div className="mt-2 grid gap-x-8 gap-y-1 sm:grid-cols-2">
            {matrix.topics.map((t) => (
              <div
                key={`p2-${t.code}`}
                className="flex items-baseline justify-between gap-3 text-sm"
              >
                <span className="min-w-0">
                  <span className="font-mono text-xs text-dim">{t.code}</span> {t.title}
                </span>
                <span className="shrink-0 whitespace-nowrap font-mono text-xs">
                  <b
                    className={
                      t.p2_marks_actual >= t.p2_marks_target ? 'text-green-pen' : 'text-ink'
                    }
                  >
                    {t.p2_marks_actual}
                  </b>
                  /{t.p2_marks_target} marks
                  {t.p2_questions > 0 && <span className="text-dim"> ({t.p2_questions}q)</span>}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-6 sm:grid-cols-2">
          <div>
            <h2 className="font-mono text-xs uppercase tracking-widest text-dim">
              Profile marks by module (P2, target 9/12/9 per 30)
            </h2>
            {([1, 2, 3] as const).map((m) => (
              <div key={m} className="mt-1 font-mono text-xs text-dim">
                M{m}: CK {matrix.profile_actuals[m].p2.CK} · AK {matrix.profile_actuals[m].p2.AK} ·
                R {matrix.profile_actuals[m].p2.R}
              </div>
            ))}
          </div>
          <div>
            <h2 className="font-mono text-xs uppercase tracking-widest text-dim">
              Archetypes (structured, target 67/11/11/9/2)
            </h2>
            {Object.entries(matrix.archetype_actuals.structured).map(([a, n]) => (
              <div key={a} className="mt-1 font-mono text-xs text-dim">
                {a}: {n}
              </div>
            ))}
            <h2 className="mt-3 font-mono text-xs uppercase tracking-widest text-dim">
              Difficulty (target 25/50/25)
            </h2>
            <div className="mt-1 font-mono text-xs text-dim">
              mcq {matrix.difficulty_actuals.mcq[1]}/{matrix.difficulty_actuals.mcq[2]}/
              {matrix.difficulty_actuals.mcq[3]} · structured{' '}
              {matrix.difficulty_actuals.structured[1]}/{matrix.difficulty_actuals.structured[2]}/
              {matrix.difficulty_actuals.structured[3]}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
