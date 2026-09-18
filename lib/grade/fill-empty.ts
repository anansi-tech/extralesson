import type { Prefill } from './prefill';

/** Retakes fill gaps only. Existing entries, including partial grids, win. */
export function fillEmpty(current: Prefill, suggested: Prefill): Prefill {
  const out: Prefill = { answers: {}, values: {} };
  const occupied = (ref: string) => Boolean(current.answers[ref]?.trim() || current.values[ref]?.some((v) => v.trim()));
  for (const [ref, value] of Object.entries(suggested.answers)) if (!occupied(ref)) out.answers[ref] = value;
  for (const [ref, values] of Object.entries(suggested.values)) if (!occupied(ref)) out.values[ref] = values;
  return out;
}

/**
 * WHAT THE READ HAD FOR A BOX THAT ALREADY HELD SOMETHING ELSE. fillEmpty keeps
 * the student's entry, which is right, but said nothing about what it kept it
 * over: a suggestion dropped and a page that saw nothing looked identical, and
 * a box seeded with one stray character stayed that way while the read of the
 * same box sat in the response unused. Keyed by ref, holding what was read.
 */
export function readDiffers(current: Prefill, suggested: Prefill): Record<string, string> {
  const held = (ref: string) => (current.answers[ref] ?? current.values[ref]?.join(', ') ?? '').trim();
  const out: Record<string, string> = {};
  const note = (ref: string, read: string) => {
    if (held(ref) && held(ref) !== read.trim()) out[ref] = read;
  };
  for (const [ref, value] of Object.entries(suggested.answers)) note(ref, value);
  for (const [ref, values] of Object.entries(suggested.values)) note(ref, values.join(', '));
  return out;
}
