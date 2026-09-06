/**
 * The white strip under the chrome (ROUND_8 Task 2): which question, and how
 * many of the session's marks are done. A diagnostic says so instead, and
 * shows how far along it is (ROUND_9 Task 5). Full-bleed at both widths; the
 * text sits on the column.
 */
const BLEED = 'relative -mx-5 lg:mx-[calc(50%-50cqw-var(--page-pad-lg))]';

export function SessionBar({
  index,
  total,
  marksAnswered,
  marksTotal,
  diagnostic = false,
}: {
  index: number;
  total: number;
  marksAnswered: number;
  marksTotal: number;
  diagnostic?: boolean;
}) {
  return (
    <>
      <div className={`${BLEED} -mt-7 flex items-center justify-between gap-3 border-b-[1.5px] border-ink bg-white px-5 py-2.5 lg:px-[calc(50cqw-50%+var(--page-pad-lg))]`}>
        <span className="font-mono text-[11px] font-bold uppercase tracking-[0.14em]">
          {diagnostic ? 'Diagnostic · ' : 'Question '}{index + 1} of {total}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-dim">
          {diagnostic ? 'Not scored' : `${marksAnswered} of ${marksTotal} marks done`}
        </span>
      </div>
      {diagnostic && (
        <div className={`${BLEED} h-1.5 border-b border-rule bg-paper-deep`}>
          <i className="block h-full bg-ink" style={{ width: `${Math.round(((index + 1) / total) * 1000) / 10}%` }} />
        </div>
      )}
    </>
  );
}
