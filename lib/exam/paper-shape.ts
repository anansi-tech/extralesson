import type { SyllabusMode } from '@/lib/types';

// R1.7 §B1 — what the student's paper actually looks like.
//
// The 2027 Paper 02 is three sections, one per module, three questions each;
// the legacy paper the January re-sit uses has no module sections at all.
// syllabus_mode stays display-only: this is copy, and nothing branches on it.

export function paperShape(mode: SyllabusMode): string {
  if (mode === 'legacy-jan') {
    return 'Your January paper uses the old format: Paper 1 is 60 multiple-choice questions in 90 minutes, and Paper 2 is structured questions worth 90 marks — one paper, no module sections.';
  }
  return 'Your paper has three sections, one for each module, with three questions in each — 90 marks over 2 hours 40 minutes. Paper 1 is 60 multiple-choice questions in 90 minutes.';
}
