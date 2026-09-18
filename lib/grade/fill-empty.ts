import type { Prefill } from './prefill';

/** Retakes fill gaps only. Existing entries, including partial grids, win. */
export function fillEmpty(current: Prefill, suggested: Prefill): Prefill {
  const out: Prefill = { answers: {}, values: {} };
  const occupied = (ref: string) => Boolean(current.answers[ref]?.trim() || current.values[ref]?.some((v) => v.trim()));
  for (const [ref, value] of Object.entries(suggested.answers)) if (!occupied(ref)) out.answers[ref] = value;
  for (const [ref, values] of Object.entries(suggested.values)) if (!occupied(ref)) out.values[ref] = values;
  return out;
}

