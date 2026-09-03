// What a thing can be CALLED in a CSEC question, in one place. The allowlist is
// derived from notation the papers actually use — primes in both the ASCII and
// the typographic form, subscript indices, theta and pi — rather than from what
// has broken so far. Nothing else in a paper names an answerable thing, and
// anything absent is still expressible: a label is a KEY, the prompt is wording.

/** Prime marks: ASCII apostrophe, typographic prime, double prime. */
const PRIMES = "'′″";

/** Subscript digits, for the L1/L2 of a line or a term. */
const SUBSCRIPTS = '₀-₉';

/** Greek names for a quantity; pi is also a symbol in its own right. */
const GREEK = 'αβθπφΘΔ';

/** Structural characters a key may join words with. */
const JOINERS = '._\\-';

const LABEL_BODY = `a-z0-9${JOINERS}${PRIMES}${SUBSCRIPTS}${GREEK}`;

/** A slot label: "i", "type", "P''", "L₁", "θ". */
export const SLOT_LABEL_RE = new RegExp(`^[a-z0-9${GREEK}][${LABEL_BODY}]{0,29}$`, 'i');

/** A slot reference as the rubric and the table write it: "a.ii", "b.P''". */
export const SLOT_REF_RE = new RegExp(`^[a-j]\\.[a-z0-9${GREEK}][${LABEL_BODY}]{0,29}$`, 'i');

/**
 * What a SUBMITTED ANSWER is addressed by. A structured question addresses one
 * slot ("a.ii"); an MCQ has no slots to tell apart and addresses the bare part
 * label ("a"). SLOT_REF_RE alone rejected every MCQ submission ever made.
 */
export const ANSWER_REF_RE = new RegExp(
  `^[a-j](\\.[a-z0-9${GREEK}][${LABEL_BODY}]{0,29})?$`,
  'i',
);

/**
 * A position in a list rather than a quantity, so a part using one needs the
 * wording in the prompt. The numerals stop at viii because a part holds at most
 * eight slots: reading "x" as the tenth item flagged two clear questions.
 */
export function isPositionalLabel(label: string): boolean {
  return /^(?:i{1,3}|iv|v|vi{1,3})$/i.test(label) || /^\d+$/.test(label);
}
