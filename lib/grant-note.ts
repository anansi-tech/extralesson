import type { Access } from '@/lib/access';

/** What a hand-written grant can be. There is no third kind. */
export const GRANT_CLASSES = ['sale', 'comp'] as const;
export type GrantClass = (typeof GRANT_CLASSES)[number];

/**
 * THE NOTE IS BUILT, NOT TYPED. The convention was printed above the form and
 * the form took free text, so it was advice — and the bank holds notes that
 * ignored it, including a bare "comp" the convention itself called
 * unacceptable. The class is now a choice of two and the date is stamped, so
 * the first token is the class of grant by construction.
 */
export function grantNote(kind: GrantClass, reason: string, at: Date = new Date()): string {
  const said = reason.trim().replace(/\s+/g, ' ').slice(0, 160);
  return kind === 'comp' ? `comp · ${said} · ${at.toISOString().slice(0, 10)}` : `stripe ${said}`;
}

/** Where a note's own history begins, so it can be cut off there. */
const WAS = ' · was ';

/**
 * A grant is the only evidence of how access was given, so writing one never
 * erases the last: the new note carries what the old one said. ONE GENERATION
 * ONLY — the current fact and what it replaced. The prior note's own history is
 * dropped, because a fourth grant otherwise reads as a sentence about a third
 * grant quoting a second one, and the thing an operator needs to know is what
 * this access is and what it took the place of.
 */
export function noteWithPrior(note: string, prior: Access | null | undefined): string {
  if (!prior?.sitting) return note;
  const said = (prior.note ?? '').split(WAS)[0];
  return `${note}${WAS}${prior.sitting} ${prior.source}${said ? `: ${said}` : ''}`.slice(0, 400);
}

export interface ReadNote {
  /** The class the note names, or null when it names none. Never guessed. */
  kind: GrantClass | null;
  /** The reason, when the note is one the form wrote; otherwise the whole of it. */
  reason: string;
  /** Whether `reason` is the note verbatim rather than a part lifted out of it. */
  verbatim: boolean;
  /** The one prior grant a note carries, shown as it is stored. */
  prior: { sitting: string; source: string; note: string } | null;
}

/** `comp · <reason> · <YYYY-MM-DD>` — the only shape a reason is lifted out of. */
const WRITTEN_COMP = /^comp · (.+) · \d{4}-\d{2}-\d{2}$/;
const WRITTEN_SALE = /^stripe (\S+)$/;
/** What follows the split, which has already eaten the "was". */
const PRIOR = /^(\S+) (\S+?)(?:: ([\s\S]*))?$/;

/**
 * A NOTE, READ FOR THE SCREEN. Display only: nothing here decides access, and
 * nothing is inferred. A reason is lifted out only of the two shapes the form
 * writes; every older note is shown as it stands, because they were typed by
 * hand and some carry history nested inside history. What the code keeps is one
 * prior grant, so that is all this reports — it is not a full record of the
 * account, and it does not date the prior grant, which was never stored.
 */
export function readNote(note: string | undefined): ReadNote {
  const [current = '', ...rest] = (note ?? '').split(WAS);
  const priorText = rest.join(WAS);
  const match = PRIOR.exec(priorText);
  const prior = match ? { sitting: match[1], source: match[2], note: match[3] ?? '' } : null;

  const comp = WRITTEN_COMP.exec(current);
  if (comp) return { kind: 'comp', reason: comp[1], verbatim: false, prior };
  const sale = WRITTEN_SALE.exec(current);
  if (sale) return { kind: 'sale', reason: sale[1], verbatim: false, prior };
  return { kind: current.trim().toLowerCase().startsWith('comp') ? 'comp' : null, reason: current, verbatim: true, prior };
}
