// Which topics a single question may draw from, derived from the corpus.
// Requiring two or three topics on EVERY question produced stapled parts that
// declared their dependencies honestly and demanded nothing. Measured over 104
// Paper 2 questions, 13% carry two topics of the same module and the rest one.
// Multi-topic was never the target; paper-likeness was.

/**
 * Pairs of topics that actually appear together inside one question, with the
 * count seen. Anything unlisted is not evidence and the recipe will not invent
 * it; Module 3 is absent because no within-module pair there reached two.
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

// INTEGRATION — one topic, several objectives chained through one scenario,
// distinct from pairing, which is about two TOPICS and stays at 13%. Real
// Paper 2 questions demand 2.04 distinct skills on average; ours ran at 0.96.
// Applies to ALL difficulty-3 structured questions, never a share to converge
// on: at difficulty 3 integration is what the label means.
export const INTEGRATION_MIN_OBJECTIVES = 3;
