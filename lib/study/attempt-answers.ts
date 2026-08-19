// An attempt stores what the student typed as one line: "(a.i) 42; (b.ii) 7".
// Reading it back is how a revisited question is rebuilt, and it cannot be done
// by splitting on "; " — an answer is allowed to contain one ("x = -1/3; x = 2"
// is a single slot's answer, and a set is written that way on purpose).
//
// The question's own slot refs are the delimiters instead, which makes the
// split exact rather than a guess about punctuation.
export function splitStoredAnswer(stored: string, refs: string[]): Record<string, string> {
  const marks = refs
    .map((ref) => ({ ref, at: stored.indexOf(`(${ref})`) }))
    .filter((m) => m.at >= 0)
    .sort((a, b) => a.at - b.at);
  const out: Record<string, string> = {};
  for (const [i, m] of marks.entries()) {
    const from = m.at + m.ref.length + 2;
    const to = i + 1 < marks.length ? marks[i + 1].at : stored.length;
    out[m.ref] = stored.slice(from, to).replace(/;\s*$/, '').trim();
  }
  return out;
}
