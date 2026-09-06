/**
 * THE SYSTEM'S CONTROLS, for the operator's screens (ROUND_10 Task 2):
 * the same buttons, fields and rows the student screens draw, so an admin
 * page is the notebook with more in it. Values from the system sheet.
 */
/** One per screen: the commitment. */
export const PRIMARY = 'min-h-11 bg-red-pen p-4 text-[17px] font-black text-white shadow-[var(--shadow-card)] disabled:opacity-50';
/** Continuation, not commitment. */
export const INK = 'min-h-11 bg-ink px-4 py-2.5 font-black text-paper shadow-[var(--shadow-on-ink)] disabled:opacity-60';
/** Outline, equal weight to each other. */
export const SECONDARY = 'min-h-11 border-[1.5px] border-ink bg-white px-4 py-2.5 text-sm text-ink disabled:border-rule disabled:text-dim';
/** The mono-caps secondary: a control that acts on the page rather than the record. */
export const CAPS = 'min-h-11 border-[1.5px] border-ink bg-white px-3 font-mono text-[11px] uppercase tracking-[0.1em] text-ink';
/** Never competes. */
export const QUIET = 'inline-flex min-h-11 items-center font-mono text-[11px] uppercase tracking-[0.14em] underline underline-offset-[3px]';
export const FIELD = 'min-h-11 border-[1.5px] border-ink bg-white px-2.5 font-mono text-base text-ink';
/** A select reads as a field, not a button: paper fill. */
export const SELECT = 'min-h-11 border-[1.5px] border-ink bg-paper px-2.5 font-mono text-base text-ink';
/** A row in a list that is a table: a hairline under each, none under the last. */
export const ROW = 'border-b border-paper-deep py-2.5 last:border-b-0';
/** A failure that cost nothing: the amber bar, never red. */
export const FAILURE = 'border-l-3 border-amber bg-amber-tint px-3 py-2.5 text-[13px] leading-snug';
