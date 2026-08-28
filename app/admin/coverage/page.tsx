import 'katex/dist/katex.min.css';
import { readingCost } from '@/lib/admin/reading-cost';
import { getCoverage } from '@/lib/admin/coverage';
import {
  P1_TOTAL,
  P2_MARKS_TOTAL,
  P2_PROFILE_SPLIT,
  STRUCTURED_ARCHETYPE_TARGETS,
} from '@/lib/targets/matrix';
import { OBJECTIVE_FLOOR } from '@/lib/targets/objectives';

export const metadata = { title: 'Coverage — ExtraLesson admin' };
export const dynamic = 'force-dynamic';

// The whole picture, on its own page.
//
// It used to sit under the review card, where it was a dashboard bolted to a
// tool: fourteen P1 topics reading 11/11 while somebody is trying to judge one
// question. A satisfied target carries no information at the moment of review,
// so the card keeps the deficits and this page keeps everything.
export default async function CoveragePage() {
  const cost = await readingCost();
  const { matrix, objectiveRows, approvedTotal, draftsRemaining } = await getCoverage();
  const allObjectives = objectiveRows.flatMap((r) => r.objectives);
  const totalObjectives = allObjectives.length;
  const atFloor = allObjectives.filter((o) => o.approved >= OBJECTIVE_FLOOR).length;
  const neverAssessed = allObjectives.filter((o) => o.approved === 0).length;

  return (
    <main className="ruled relative min-h-screen px-6 py-8">
      <div className="pointer-events-none absolute inset-y-0 left-4 w-[1.5px] bg-margin" />
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
          <div className="text-xl font-black">
            extra<em className="not-italic text-red-pen">lesson</em>
            <span className="ml-2 font-mono text-xs uppercase tracking-widest text-dim">coverage</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 font-mono text-xs text-dim">
            <span>
              <b className="text-ink">{approvedTotal}</b> approved · <b className="text-ink">{draftsRemaining}</b> draft
            </span>
          </div>
        </header>

        <section className="mt-10">
          <h2 className="font-mono text-xs uppercase tracking-widest text-dim">
            Objective coverage — {atFloor}/{totalObjectives} at the floor of {OBJECTIVE_FLOOR}
            {neverAssessed > 0 && (
              <span className="text-red-pen"> · {neverAssessed} never assessed</span>
            )}
          </h2>
          <div className="mt-2 space-y-3">
            {objectiveRows
              .filter((row) => row.objectives.length > 0)
              .map((row) => {
                const done = row.objectives.filter((o) => o.approved >= OBJECTIVE_FLOOR).length;
                return (
                  <div key={row.topic_code}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span>
                        <span className="font-mono text-xs text-dim">{row.topic_code}</span>{' '}
                        {row.topic_title}
                      </span>
                      <span
                        className={`shrink-0 font-mono text-xs ${done === row.objectives.length ? 'text-green-pen' : 'text-ink'}`}
                      >
                        {done}/{row.objectives.length}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {row.objectives.map((o) => (
                        <span
                          key={o.id}
                          title={`${o.id} — ${o.text} (${o.approved} approved${o.draft ? `, ${o.draft} draft` : ''})`}
                          className={`rounded px-1 py-0.5 font-mono text-[10px] ${
                            o.approved >= OBJECTIVE_FLOOR
                              ? 'bg-[#E8F0E9] text-green-pen'
                              : o.approved > 0
                                ? 'bg-[#FDF8EC] text-[#8A6D1F]'
                                : o.draft > 0
                                  ? 'bg-paper-deep text-dim'
                                  : 'bg-[#FDF1F0] text-red-pen'
                          }`}
                        >
                          {o.id.slice(3)}{' '}
                          {o.approved > 0 ? `${o.approved}a` : ''}
                          {o.draft > 0 ? `${o.approved > 0 ? '+' : ''}${o.draft}d` : ''}
                          {o.approved === 0 && o.draft === 0 ? '✗' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
          <p className="mt-2 max-w-2xl font-mono text-[10px] leading-relaxed text-dim">
            Each chip is one syllabus objective: the id, then <b className="text-ink">2a</b> for two
            APPROVED questions and <b className="text-ink">3d</b> for three still in DRAFT, so{' '}
            <b className="text-ink">1a+2d</b> means one approved and two waiting. ✗ is nothing at
            all. Green = at the floor of {OBJECTIVE_FLOOR} approved · amber = approved but below it ·
            grey = drafts only, which is not coverage until reviewed · red = never assessed. The
            floor is ROUND_1_5_FINAL §4, and it counts APPROVED questions only.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-mono text-xs uppercase tracking-widest text-dim">
            P1 matrix — {matrix.p1_actual_total}/{P1_TOTAL} MCQs ·{' '}
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
            P2 matrix — {matrix.p2_marks_actual_total}/{P2_MARKS_TOTAL} rubric marks ·{' '}
            {matrix.p2_actual_total} structured questions
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
              Profile marks by module (P2, target{' '}
              {(['CK', 'AK', 'R'] as const).map((k) => P2_PROFILE_SPLIT[k]).join('/')} per{' '}
              {(['CK', 'AK', 'R'] as const).reduce((s, k) => s + P2_PROFILE_SPLIT[k], 0)})
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
              Archetypes (structured, target{' '}
              {Object.values(STRUCTURED_ARCHETYPE_TARGETS).join('/')})
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

        {/* R2 §7 — the real figure, from recorded token usage, not the estimate.
            A student who never photographs anything costs nothing at all, so
            this is the whole of what reading handwriting has cost. */}
        <section className="mt-6 border-[1.5px] border-ink bg-white p-4 shadow-[3px_3px_0_var(--ink)]">
          <div className="section-label">
            Reading handwriting — measured cost
          </div>
          {cost.reads === 0 ? (
            <p className="mt-1 text-[13px] text-dim">
              No working photographed yet, so nothing has been spent.
            </p>
          ) : (
            <div className="mt-1 font-mono text-xs">
              {cost.reads} read{cost.reads === 1 ? '' : 's'} ·{' '}
              {cost.inputTokens.toLocaleString()} in / {cost.outputTokens.toLocaleString()} out ·{' '}
              <b>${cost.totalUsd.toFixed(4)}</b> total ·{' '}
              <b>${cost.perReadUsd.toFixed(4)}</b> per photographed question
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
