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
