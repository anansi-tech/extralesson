// What a thing can be CALLED in a CSEC question, in one place.
//
// A slot label is a name: the paper asks for several named things under one
// instruction, and the names are the paper's own. We first allowed letters and
// digits, then discovered by rejection that transformation questions call their
// image vertices P' and P''. Fixing that per boundary rejection would have kept
// costing us drafts one notation at a time, so this allowlist is derived from
// the notation the papers actually use rather than from what has broken so far.
//
// Counted across the text-layer papers:
//   primes   A' B' C' P' R' S' and A'' B'' C'' R'' — in BOTH the ASCII
//            apostrophe and the typographic prime, sometimes in one paper
//   indices  L1 L2, t2 t3, a2 b2 c2 — line, term and side names
//   Greek    theta 28 times (angles), pi 22 times
//
// Nothing else in a paper names an answerable thing, so nothing else is here.
// Anything absent is still expressible: a label is a KEY, and the wording the
// student reads lives in the slot prompt.

/** Prime marks: ASCII apostrophe, typographic prime, double prime. */
const PRIMES = "'′″";

/** Subscript digits, for the L1/L2 of a line or a term. */
const SUBSCRIPTS = '₀-₉';

/**
 * Greek letters a question names a quantity with. Angles are theta and phi,
 * unknowns alpha and beta, and pi turns up as a symbol in its own right.
 */
const GREEK = 'αβθπφΘΔ';

/** Structural characters a key may join words with. */
const JOINERS = '._\\-';

const LABEL_BODY = `a-z0-9${JOINERS}${PRIMES}${SUBSCRIPTS}${GREEK}`;

/** A slot label: "i", "type", "P''", "L₁", "θ". */
export const SLOT_LABEL_RE = new RegExp(`^[a-z0-9${GREEK}][${LABEL_BODY}]{0,29}$`, 'i');

/** A slot reference as the rubric and the table write it: "a.ii", "b.P''". */
export const SLOT_REF_RE = new RegExp(`^[a-j]\\.[a-z0-9${GREEK}][${LABEL_BODY}]{0,29}$`, 'i');

/**
 * A label that names nothing: a position in a list rather than a quantity.
 *
 * "centre", "factor" and "modal_class" tell a student which box is which all by
 * themselves — they are the paper's own names for the things being asked for.
 * "i" and "ii" do not, so a part using them needs the wording in the prompt.
 *
 * The roman numerals stop at viii because a part holds at most eight slots, so
 * ix and x can never BE a position. "x" is the unknown — a part asking for the
 * values of x and y labels its boxes x and y, and reading that as the tenth
 * item flagged two perfectly clear questions.
 */
export function isPositionalLabel(label: string): boolean {
  return /^(?:i{1,3}|iv|v|vi{1,3})$/i.test(label) || /^\d+$/.test(label);
}
