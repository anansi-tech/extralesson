import 'katex/dist/katex.min.css';
import { hintCoverage } from '@/lib/admin/hints';
import { dbConnect, Question } from '@/lib/db';
import { getCoverage, getNextDraftId } from '@/lib/admin/coverage';
import { renderAnswerHtml, renderMathHtml } from '@/lib/katex';
import { renderVisual, renderStimulusTable } from '@/lib/visuals';
import { legibleMinWidth, MAX_FIGURE_PX } from '@/lib/visuals/legibility';
import {
  P1_TOTAL,
  P2_MARKS_TOTAL,
} from '@/lib/targets/matrix';
import ReviewCard, { type ReviewQuestion } from './review-card';
import { findQuestions } from '@/lib/admin/find-questions';
import { OBJECTIVE_FLOOR } from '@/lib/targets/objectives';
import { reviewFlags } from '@/lib/admin/review-flags';
import Link from 'next/link';

export const metadata = { title: 'Review queue — ExtraLesson admin' };
export const dynamic = 'force-dynamic';

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; find?: string; from?: string }>;
}) {
  await dbConnect();
  const { id: askedId, find, from } = await searchParams;
  const [{ matrix, approvedTotal, draftsRemaining, objectiveRows }, nextId, found, hints] = await Promise.all([
    getCoverage(),
    getNextDraftId(),
    findQuestions(find ?? ''),
    hintCoverage(),
  ]);

  // An explicitly asked-for question wins over the queue's next draft, so a
  // search result, or a "back" link, opens the question it names.
  const showId = /^[a-f0-9]{24}$/.test(askedId ?? '') ? askedId! : nextId;

  // What is SHORT, and nothing else. A target that is met is not information
  // while someone is reading a question.
  const allObjectives = objectiveRows.flatMap((r) => r.objectives);
  const neverAssessed = allObjectives.filter((o) => o.approved === 0).length;
  const belowFloor = allObjectives.filter((o) => o.approved < OBJECTIVE_FLOOR).length;
  const p1Short = P1_TOTAL - matrix.p1_actual_total;
  const p2Short = P2_MARKS_TOTAL - matrix.p2_marks_actual_total;

  const deficits: { value: string; label: string }[] = [];
  const onTarget: string[] = [];
  if (neverAssessed > 0) deficits.push({ value: String(neverAssessed), label: 'objectives with no approved question' });
  if (belowFloor > neverAssessed) {
    deficits.push({ value: String(belowFloor - neverAssessed), label: `more below the floor of ${OBJECTIVE_FLOOR}` });
  }
  if (neverAssessed === 0 && belowFloor === 0) onTarget.push('objectives');
  if (p1Short > 0) deficits.push({ value: `${p1Short}`, label: 'P1 items short' });
  else onTarget.push('P1');
  if (p2Short > 0) deficits.push({ value: `${p2Short}`, label: 'P2 marks short' });
  else onTarget.push('P2');
  // THE TRUTH (ROUND_7 Task 3): totals can be met while topics are short,
  // because a total is a sum. Each short topic opens the search on it.
  const totalsMet = p1Short <= 0 && p2Short <= 0;
  const shortTopics = matrix.topics.filter((r) => r.p1_actual < r.p1_target || r.p2_marks_actual < r.p2_marks_target);

  let question: ReviewQuestion | null = null;
  if (showId) {
    const q = await Question.findById(showId).lean<Record<string, unknown> | null>();
    if (q) {
      const raw = q as {
        _id: unknown;
        objective_ids: string[];
        module: number;
        kind: 'mcq' | 'structured';
        stimulus?: string;
        stem: string;
        visual?: { template?: string; params?: unknown };
        stimulus_table?: unknown;
        archetype?: string;
        representation?: string;
        options?: string[];
        answer_key?: number;
        profile?: string;
        difficulty: number;
        marks: number;
        parts?: {
          label: string;
          prompt: string;
          marks: number;
          statement?: string;
          slots?: { label: string; prompt?: string; answer: string; accept?: string[] }[];
        }[];
        rubric?: { code: string; profile: string; criterion: string; mark_value: number; part_label?: string }[];
        final_answer?: string;
        worked_solution: string;
        misconceptions: { trigger: string; name: string; remediation: string }[];
        gen_meta?: { recipe?: unknown; dedup_score?: number; prompt_version?: string };
        status: string;
      };
    // The GIVEN data table, never withheld — see the study session page.
    let stimulusTableHtml: string | undefined;
    if (raw.stimulus_table) {
      try {
        stimulusTableHtml = renderStimulusTable(raw.stimulus_table, {
          stimulus: raw.stimulus,
          stem: raw.stem,
          partPrompts: (raw.parts ?? []).flatMap((p) => [
            p.prompt,
            ...(p.slots ?? []).map((slot) => slot.prompt ?? ''),
          ]),
        });
      } catch {
        stimulusTableHtml = undefined;
      }
    }

      let visualHtml: string | undefined;
      if (raw.visual?.template) {
        try {
          visualHtml = renderVisual(raw.visual as never, {
            stimulus: raw.stimulus,
            stem: raw.stem,
            partPrompts: (raw.parts ?? []).flatMap((p) => [
              p.prompt,
              ...(p.slots ?? []).map((slot) => slot.prompt ?? ''),
            ]),
          });
        } catch {
          visualHtml = `<p class="text-red-pen">visual failed to render (template ${raw.visual.template})</p>`;
        }
      }
      question = {
        id: String(raw._id),
        status: raw.status,
        promptVersion: raw.gen_meta?.prompt_version,
        flags: reviewFlags(raw as never),
        // What this question is evidence FOR: when it is the only evidence for
        // an objective, a marginal question is worth editing rather than
        // rejecting. Counted BESIDES this question, or one that is the only
        // evidence for its objective would report "1 other" — pointing at itself.
        objectives: raw.objective_ids.map((id) => {
          const row = objectiveRows.find((r) => r.objectives.some((o) => o.id === id));
          const o = row?.objectives.find((x) => x.id === id);
          return {
            id,
            text: o?.text ?? '',
            approvedOthers: Math.max(0, (o?.approved ?? 0) - (raw.status === 'approved' ? 1 : 0)),
            draftOthers: Math.max(0, (o?.draft ?? 0) - (raw.status === 'draft' ? 1 : 0)),
          };
        }),
        backTo: /^[a-f0-9]{24}$/.test(from ?? '') ? from : undefined,
        pinned: showId !== nextId,
        objective_ids: raw.objective_ids,
        module: raw.module,
        kind: raw.kind,
        archetype: raw.archetype,
        representation: raw.representation,
        stimulusHtml: raw.stimulus ? renderMathHtml(raw.stimulus) : undefined,
        stemHtml: renderMathHtml(raw.stem),
        stimulusTableHtml,
        visualHtml,
        figureMinWidth: visualHtml ? (legibleMinWidth(visualHtml) ?? undefined) : undefined,
        figureMaxWidth: MAX_FIGURE_PX,
        parts: (raw.parts ?? []).map((p) => ({
          label: p.label,
          marks: p.marks,
          promptHtml: renderMathHtml(p.prompt),
          statementHtml: p.statement
            ? p.statement.split('{}').map((piece: string) => renderMathHtml(piece))
            : undefined,
          slots: (p.slots ?? []).map((slot) => ({
            label: slot.label,
            promptHtml: slot.prompt ? renderMathHtml(slot.prompt) : undefined,
            answerHtml: renderAnswerHtml(slot.answer),
            acceptHtml: slot.accept?.length ? slot.accept.map(renderAnswerHtml).join(' / ') : undefined,
          })),
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
        finalAnswerHtml: raw.final_answer ? renderAnswerHtml(raw.final_answer) : undefined,
        solutionHtml: renderMathHtml(raw.worked_solution),
        misconceptions: raw.misconceptions.map((m) => ({
          nameHtml: renderMathHtml(m.name),
          triggerHtml: renderAnswerHtml(m.trigger),
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
          <div className="font-mono text-xs text-dim">
            <b className="text-ink">{draftsRemaining}</b> drafts remaining ·{' '}
            <b className="text-ink">{approvedTotal}</b> approved ·{' '}
            {/* Rows a wrong answer can be told a hint on, of the rows that need one. */}
            <b className={hints.withHint === hints.methodRows ? 'text-green-pen' : 'text-ink'}>Hints: {hints.withHint} of {hints.methodRows}</b> ·{' '}
            {/* Against the matrix, which is the target: what it replaced
                was a count restated here, rather than read. */}
            <b className={matrix.p1_actual_total >= P1_TOTAL ? 'text-green-pen' : 'text-ink'}>
              P1 {Math.round((matrix.p1_actual_total / P1_TOTAL) * 100)}%
            </b>{' '}
            ·{' '}
            <b className={matrix.p2_marks_actual_total >= P2_MARKS_TOTAL ? 'text-green-pen' : 'text-ink'}>
              P2 {Math.round((matrix.p2_marks_actual_total / P2_MARKS_TOTAL) * 100)}%
            </b>{' '}
            of target
          </div>
        </header>

        <form method="get" className="mb-4 flex gap-2">
          <input
            name="find"
            defaultValue={find ?? ''}
            placeholder="Find by id (d16f74) or by text (hire purchase, ferry, cumulative)"
            className="w-full border-[1.5px] border-ink p-2 font-mono text-base"
          />

          <button
            type="submit"
            className="shrink-0 border-[1.5px] border-ink bg-white px-4 font-mono text-[11px] uppercase"
          >
            Find
          </button>

          {(find || askedId) && (
            <Link
              href="/admin/review"
              className="shrink-0 border-[1.5px] border-ink bg-white px-4 py-2 font-mono text-[11px] uppercase"
            >
              Clear
            </Link>
          )}
        </form>

        {find && (
          <div className="mb-6 border-[1.5px] border-dashed border-paper-deep bg-white p-3">
            <div className="section-label">
              {found.length === 0 ? 'nothing matched' : `${found.length} match${found.length === 1 ? '' : 'es'}`}
            </div>
            <ul className="mt-2 space-y-1">
              {found.map((r) => (
                <li key={r.id} className="flex items-baseline gap-2 text-sm">
                  <Link
                    href={`/admin/review?id=${r.id}${find ? `&find=${encodeURIComponent(find)}` : ''}`}
                    className="shrink-0 font-mono text-xs underline"
                  >
                    {r.id.slice(-6)}
                  </Link>
                  <span
                    className={`shrink-0 font-mono text-[10px] uppercase ${r.status === 'approved'
                      ? 'text-green-pen'
                      : r.status === 'retired'
                        ? 'text-red-pen'
                        : 'text-dim'
                      }`}
                  >
                    {r.status}
                  </span>
                  <span className="min-w-0 truncate text-dim">
                    M{r.module} · {r.marks}mk · {r.preview}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* DEFICITS ONLY. The full picture lives on the coverage page; under
            a review card it was a dashboard, and what is on target is worth
            exactly two words. */}
        <section className="mb-6 border-l-3 border-paper-deep bg-white p-3 text-sm">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-dim">deficits</span>
            {deficits.length === 0 && shortTopics.length === 0 ? (
              <span className="text-green-pen">Everything on target.</span>
            ) : totalsMet && shortTopics.length > 0 ? (
              <span>
                Overall totals met; <b className="text-red-pen">{shortTopics.length}</b> topic target{shortTopics.length === 1 ? '' : 's'} short:{' '}
                {shortTopics.map((r, i) => (
                  <span key={r.code}>
                    {i > 0 && ', '}
                    <Link href={`/admin/review?find=${encodeURIComponent(`topic:${r.code}`)}`} className="underline">{r.code}</Link>
                  </span>
                ))}
              </span>
            ) : (
              deficits.map((d) => (
                <span key={d.label}>
                  <b className="text-red-pen">{d.value}</b> {d.label}
                </span>
              ))
            )}
            {onTarget.length > 0 && (
              <span className="text-dim">
                {onTarget.join(', ')} on target
              </span>
            )}
          </div>
        </section>

        {question ? (
          <ReviewCard question={question} />
        ) : (
          <p className="border-l-3 border-green-pen bg-white p-4">
            Queue is empty — no drafts to review. Run the generation pipeline to add more.
          </p>
        )}

      </div>
    </main>
  );
}
