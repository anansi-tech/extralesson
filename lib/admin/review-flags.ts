import { isPositionalLabel } from '@/lib/notation';

// What to look at first on a draft.
//
// Every flag here is a defect class that has ALREADY reached a review queue and
// been caught by eye — composite-function content tagged against Module 3, a
// feasible region whose non-negativity was left to the shading, boxes a student
// cannot tell apart. The gates that now exist stop new ones, but a reviewer is
// still reading questions written before each fix, and reading for four things
// at once is what makes reviewing slow.
//
// A flag is a REASON TO LOOK, never a verdict: none of them rejects anything,
// and a flagged question is often fine. They are ordered with the ones that
// have historically been real first.

export interface ReviewFlag {
  level: 'warn' | 'note';
  text: string;
}

const COMPOSITE = /f\s*\(\s*g\s*\(|g\s*\(\s*f\s*\(|\bfg\s*\(|\bgf\s*\(|f\s*\^\s*\{?\s*-\s*1|g\s*\^\s*\{?\s*-\s*1/;
const LP = /feasible region|linear programm|shaded region[^.]*inequalit|inequalit[^.]*shaded region/i;
const NONNEG = /x\s*\\g(?:e|eq)\s*0|y\s*\\g(?:e|eq)\s*0|x\s*[≥⩾]\s*0|y\s*[≥⩾]\s*0|non-?negativ/i;

export interface FlaggableQuestion {
  module: number;
  stimulus?: string;
  stem: string;
  parts?: {
    label: string;
    prompt: string;
    statement?: string;
    slots?: { label: string; prompt?: string; answer?: string; response_mode?: string }[];
  }[];
}

export function reviewFlags(q: FlaggableQuestion): ReviewFlag[] {
  const flags: ReviewFlag[] = [];
  const parts = q.parts ?? [];
  const text = [
    q.stimulus ?? '',
    q.stem,
    ...parts.flatMap((p) => [p.prompt, p.statement ?? '', ...(p.slots ?? []).flatMap((s) => [s.prompt ?? '', s.answer ?? ''])]),
  ].join(' ');

  if (q.module === 3 && COMPOSITE.test(text)) {
    flags.push({
      level: 'warn',
      text: 'Module 2 function notation in a Module 3 question — a modular M3 candidate may never have met fg(x) or f⁻¹',
    });
  }
  if (LP.test(text) && !NONNEG.test(text)) {
    flags.push({ level: 'warn', text: 'A region of inequalities that never states x ≥ 0, y ≥ 0' });
  }

  for (const p of parts) {
    const marked = (p.slots ?? []).filter((s) => (s.response_mode ?? 'answer') === 'answer');
    if (p.statement || marked.length < 2) continue;
    if (marked.some((s) => isPositionalLabel(s.label) && !(s.prompt ?? '').trim())) {
      flags.push({
        level: 'warn',
        text: `Part (${p.label}) has ${marked.length} answer boxes and does not say which is which`,
      });
    }
  }

  const construct = parts.flatMap((p) => (p.slots ?? []).filter((s) => s.response_mode === 'construct'));
  if (construct.length > 0) {
    flags.push({
      level: 'note',
      text: 'Opens with a construction — check the figure IS what part (a) asks them to draw, and that the later parts read off it',
    });
  }
  const selfMarked = parts.flatMap((p) =>
    (p.slots ?? []).filter((s) => s.response_mode === 'show_that' || s.response_mode === 'explain'),
  );
  if (selfMarked.length > 0) {
    flags.push({ level: 'note', text: `${selfMarked.length} self-marked slot(s) — a student marks these against your solution` });
  }
  return flags;
}
