import { readNote } from '@/lib/grant-note';
import type { Access } from '@/lib/access';

/**
 * WHAT ONE ACCOUNT ROW SHOWS (ROUND_13 Task 1). Built on the server and handed
 * to the client whole, because the row list is a client component — one row open
 * at a time — and lib/access, lib/payment-queue and lib/db all reach Mongoose.
 * A client component that imports one of them puts the database in the browser,
 * which is how /welcome died. Everything here is a string or a number.
 */

/** The three words the changed list is allowed to say, at a fixed width. */
export type StateWord = 'access' | 'free used' | 'revoked' | 'free tier';

export interface PriorGrant {
  sitting: string;
  source: string;
  note: string;
}

export interface CurrentAccess {
  accessFor: string;
  /** Comp, Sale, or that the note names none — never a guess. */
  klass: string;
  granted: string;
  /** REASON when the form wrote the note, NOTE when it did not. */
  reasonLabel: 'REASON' | 'NOTE';
  reason: string;
}

/** The one thing the grant permits, with the words that belong to it. */
export type RowControl =
  /**
   * `window` is null when the payment carries no date: the two lines say what
   * they can show and nothing more, rather than inventing a third phrasing for
   * a payment whose age is unknown.
   */
  | { kind: 'refund'; paymentId: string; window: { label: string; value: string } | null; link: string | null }
  | { kind: 'revoke'; sentence: string }
  | { kind: 'revoke-unresolved'; warning: string; link: string };

export interface AccountRow {
  id: string;
  email: string;
  name: string;
  /** The exam they registered for. Never merged with the access below. */
  enteredFor: string;
  sessions: number;
  attempts: number;
  word: StateWord;
  /** The sitting shown beside the address, which is the grant's when there is one. */
  sitting: string;
  current: CurrentAccess | null;
  prior: PriorGrant[];
  control: RowControl | null;
  /** Already revoked: the row says what happened and offers nothing. */
  revoked: string | null;
}

export function currentAccessOf(access: Access): CurrentAccess {
  const read = readNote(access.note);
  return {
    accessFor: access.sitting,
    klass: read.kind === 'comp' ? 'Comp' : read.kind === 'sale' ? 'Sale' : 'not named in the note',
    granted: `${new Date(access.granted_at).toISOString().slice(0, 10)} · ${access.source}`,
    reasonLabel: read.verbatim ? 'NOTE' : 'REASON',
    reason: read.reason,
  };
}

/**
 * The one prior grant a note carries, as a line. A list because the screen shows
 * one line per prior and the count in the label; the code keeps one, so that is
 * what it holds. No date: a prior grant's date was never stored.
 */
export function priorGrantsOf(access: Access): PriorGrant[] {
  const { prior } = readNote(access.note);
  return prior ? [prior] : [];
}

/**
 * A revoked grant is ended, not erased: the row says when, by whom and why,
 * and offers nothing. Never silently absent — an account that drops off the
 * screen reads as one that never paid.
 */
export function revokedLineOf(access: Access): string | null {
  if (!access.revoked_at) return null;
  const when = new Date(access.revoked_at).toISOString().slice(0, 10);
  return `revoked ${when} by ${access.revoked_by ?? 'nobody recorded'}${access.revoked_reason ? ` · ${access.revoked_reason}` : ''}`;
}
