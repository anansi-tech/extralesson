import type { Access } from '@/lib/access';

/**
 * A grant is the only evidence of how access was given, so writing one never
 * erases the last: the new note carries what the old one said. Bounded,
 * because a chain of grants would otherwise grow without end.
 */
export function noteWithPrior(note: string, prior: Access | null | undefined): string {
  if (!prior?.sitting) return note;
  const was = `was ${prior.sitting} ${prior.source}${prior.note ? `: ${prior.note}` : ''}`;
  return `${note} · ${was}`.slice(0, 400);
}
