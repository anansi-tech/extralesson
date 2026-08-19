// Which topics a single question may draw from, derived from the corpus.
//
// The paper-shaped recipe required objectives from two or three topics of one
// module on EVERY question. The papers do not do that, and forcing it produced
// questions that satisfied the letter of it by stapling: a circle-theorem
// question whose last part asked for a position vector whose components were
// the two earlier answers, a statistics question ending the same way. The part
// declared its dependencies honestly and demanded nothing.
//
// Measured over 104 Paper 2 questions — five text-layer May/June papers, the
// January 2020 paper and the 2027 specimen — by looking for terms distinctive
// to one topic and to no other ("hire purchase", "cumulative frequency",
// "angle of elevation"), never ordinary mathematical English:
//
//   13% of questions carry two topics of the same module; the rest carry one.
//   A stricter detector needing two distinct terms put it at 3%, and a looser
//   one that let words like "set" and "angle" vote produced obvious nonsense,
//   so 13% is the middle reading and the one encoded here.
//
// Multi-topic was never the target; paper-likeness was.

/**
 * Pairs of topics that actually appear together inside one question, with the
 * number of questions each was seen in. Anything not listed here is not a
 * pairing we have evidence for, and the recipe will not invent one.
 *
 * Module 3 is deliberately absent: no within-module pair reached even two
 * questions there. That is precisely where the stapled vector parts came from —
 * geometry-with-vectors and statistics-with-vectors are combinations the corpus
 * never makes, and we were manufacturing them.
 */
export const NATURAL_PAIRS: { pair: [string, string]; seen: number }[] = [
  { pair: ['M1-CONS', 'M1-MEAS'], seen: 3 }, // cost of the material an area needs
  { pair: ['M1-CONS', 'M1-NTC'], seen: 2 }, // computation running into consumer arithmetic
  { pair: ['M2-ALG2', 'M2-RFG1'], seen: 3 }, // algebra that becomes a line or a function
  { pair: ['M2-ALG2', 'M2-VM1'], seen: 3 }, // algebra carried out with matrices
  { pair: ['M2-ALG2', 'M2-GEO1'], seen: 2 }, // a figure that yields an equation to solve
  { pair: ['M2-RFG1', 'M2-STAT1'], seen: 2 }, // a graph read against data
];

/** Share of paper-shaped questions that draw on two topics rather than one. */
export const MULTI_TOPIC_SHARE = 0.13;

/** The topics a given topic may legitimately be paired with. */
export function naturalPartners(topic: string): string[] {
  return NATURAL_PAIRS.flatMap(({ pair }) =>
    pair[0] === topic ? [pair[1]] : pair[1] === topic ? [pair[0]] : [],
  );
}

export function isNaturalPair(a: string, b: string): boolean {
  return NATURAL_PAIRS.some(
    ({ pair }) => (pair[0] === a && pair[1] === b) || (pair[0] === b && pair[1] === a),
  );
}

// INTEGRATION — one topic, several objectives, chained through one scenario.
//
// Distinct from pairing, which is about two TOPICS and stays at 13%. This is
// the hardest class the papers set: multiple circle theorems with reasons,
// cosine-then-sine-rule bearings, vector ratio proofs, combined
// transformations — all inside a single topic.
//
// Measured with one extractor over both corpora, method-naming markers excluded
// because our prompt forbids naming a method: real Paper 2 questions demand
// 2.04 distinct skills on average and 30% demand three or more. Our difficulty-3
// questions ran at 0.96 and 6% — no more integrated than our difficulty-1 ones,
// so difficulty was not being expressed as integration at all.
//
// Applies to difficulty 3 structured questions only, and to ALL of them: at
// difficulty 3 integration is what the label means, so a share to converge on
// would be a hedge with nothing behind it. A d3 question that carries one
// objective is a d2 question wearing the wrong tag, which is exactly what 52 of
// the first 55 turned out to be. The deficit that decides HOW MANY d3 questions
// to write is the 25/50/25 difficulty band, which the recipe already consumes.
export const INTEGRATION_MIN_OBJECTIVES = 3;
