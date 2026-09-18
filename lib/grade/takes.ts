/**
 * HOW MANY TIMES A PAGE MAY BE PHOTOGRAPHED. A retake is for a bad
 * photograph, not a better answer (ROUND_2 §2, §3).
 *
 * Its own module, and nothing is imported into it. It lived in transcribe.ts
 * beside the reader, so two client components importing this one number put
 * the AI SDK, read-fields, input-shape and equivalence — and mathjs behind it
 * — into their import graph. None of that reaches the browser: webpack drops
 * every bit of it, measured. But a graph that says a phone loads a computer
 * algebra system is one careless import away from being true, and the reason
 * it is false today is a bundler's analysis rather than anything we decided.
 */
export const MAX_TAKES = 2;
