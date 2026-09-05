/**
 * The white strip under the chrome (ROUND_8 Task 2): which question, and how
 * many of the session's marks are done. Full-bleed at both widths; the text
 * sits on the column.
 */
export function SessionBar({ index, total, marksAnswered, marksTotal }: { index: number; total: number; marksAnswered: number; marksTotal: number }) {
  return (
    <div className="relative -mx-5 -mt-7 flex items-center justify-between gap-3 border-b-[1.5px] border-ink bg-white px-5 py-2.5 lg:mx-[calc(50%-50cqw-var(--page-pad-lg))] lg:px-[calc(50cqw-50%+var(--page-pad-lg))]">
      <span className="font-mono text-[11px] font-bold uppercase tracking-[0.14em]">
        Question {index + 1} of {total}
      </span>
      <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-dim">
        {marksAnswered} of {marksTotal} marks done
      </span>
    </div>
  );
}
