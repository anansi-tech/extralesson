import { isPositionalLabel } from '@/lib/notation';
import { slotRefsNamedByVisual } from '@/lib/validation/question';

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

// LINEAR PROGRAMMING, and only that. Matching "shaded region" near
// "inequality" caught every one-inequality question in M3.2.1 — "which
// inequality represents R?" over a region that legitimately runs into the
// negative quadrants, where x >= 0 would be WRONG.
const LP = /feasible region|linear programm/i;

// Non-negativity is stated three ways and all three count: the symbols, the
// syllabus's own English, and the region's declared constraints.
const NONNEG = /x\s*\\g(?:e|eq)\s*0|y\s*\\g(?:e|eq)\s*0|x\s*[≥⩾]\s*0|y\s*[≥⩾]\s*0|non-?negativ|whole numbers?|positive integers?|cannot be negative/i;

// The worked solution names the method even where the question may not: the
// no-naming rule governs what a candidate reads, not our own solution.
// Detecting on the name rather than the formula's shape is what separates a
// real sine-rule question from right-angled work — a shape detector read
// tan(30) = QR/45 as a sine rule.
const NON_RIGHT_TRIG = /\b(sine|cosine)\s+rule\b|\blaw of (sines|cosines)\b/i;
const SINE_COSINE_OBJECTIVE = 'M3.3.7';

export interface FlaggableQuestion {
  module: number;
  objective_ids?: string[];
  stimulus?: string;
  stem: string;
  worked_solution?: string;
  rubric?: { criterion?: string; slot_ref?: string; for_format?: boolean }[];
  visual?: {
    params?: { regions?: { constraints?: { a: number; b: number; c: number; op: string }[] }[] };
  };
  parts?: {
    label: string;
    prompt: string;
    statement?: string;
    slots?: {
      label: string;
      prompt?: string;
      answer?: string;
      response_mode?: string;
      answer_format?: string;
    }[];
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

  // A TABLE SET AS A KaTeX ARRAY. An array is typeset at a fixed width and
  // cannot reflow, so six questions put a grouped frequency table 758px wide
  // into a 300px column and a phone lost the last class interval off the edge
  // of the paper. Data belongs in the dataTable visual, or in stimulus_table
  // when the visual slot already holds a figure the student draws.
  if (/\\begin\{array\}/.test(text)) {
    flags.push({
      level: 'warn',
      text: 'A table is set as a KaTeX array, which cannot reflow to a phone. Use the dataTable visual, or stimulus_table when the visual slot is taken.',
    });
  }

  // OUR WORDS FOR OUR MACHINERY, IN THE STUDENT'S TEXT.
  //
  // "Visual" is what we call a figure in the schema and the prompt; a student
  // calls it the graph or the table. The generator was told "the stem must
  // explicitly refer to the visual" and did exactly that — six of six ogive
  // drafts said "the visual is a model of the curve required in part (a)",
  // which also narrates our self-check arrangement inside the question. Same
  // class as copybook/notebook in CLAUDE.md: an internal word reaching a reader
  // who has no idea what it means.
  if (/\bthe visual\b|\bvisuals?\b/i.test(text)) {
    flags.push({
      level: 'warn',
      text: 'Student-facing text says "visual" — our word for a figure. A student reads "the graph", "the table", "the diagram".',
    });
  }
  if (/model answer|use it to check|required in part \(?[a-z]\)?/i.test(text)) {
    flags.push({
      level: 'warn',
      text: 'Student-facing text explains what the figure is FOR. The paper prints a figure; it does not narrate our marking arrangements.',
    });
  }

  // The method is named where we WORK, not where the student reads.
  const method = [q.worked_solution ?? '', ...(q.rubric ?? []).map((r) => r.criterion ?? '')].join(' ');
  // Visual params are Mixed at the database boundary, so nothing about their
  // shape is guaranteed here — a flag must never throw on a question it cannot
  // read, or one malformed figure takes the whole report down.
  const regions = q.visual?.params?.regions;
  const cons = (Array.isArray(regions) ? regions : []).flatMap((r) =>
    Array.isArray(r?.constraints) ? r.constraints : [],
  );
  const nonNegDeclared =
    cons.some((c) => c.a === 1 && c.b === 0 && c.c === 0 && c.op === 'ge') &&
    cons.some((c) => c.a === 0 && c.b === 1 && c.c === 0 && c.op === 'ge');

  if (q.module === 3 && COMPOSITE.test(text)) {
    flags.push({
      level: 'warn',
      text: 'Module 2 function notation in a Module 3 question — a modular M3 candidate may never have met fg(x) or f⁻¹',
    });
  }
  // The same rule the other way round. It only ever ran one way because that is
  // the direction a review happened to catch.
  if (q.module === 2 && NON_RIGHT_TRIG.test(method)) {
    flags.push({
      level: 'warn',
      text: `Module 3 method (sine/cosine rule, ${SINE_COSINE_OBJECTIVE}) in a Module 2 question — Module 2 trigonometry is the right-angled ratios`,
    });
  }
  if (LP.test(text) && !NONNEG.test(text) && !nonNegDeclared) {
    flags.push({ level: 'warn', text: 'Linear programming with no non-negativity, in the wording or the region' });
  }
  // Coverage the matrix cannot see: the bank assesses the objective and never
  // says so, which is how M3.3.7 read zero while two approved questions used it.
  if (NON_RIGHT_TRIG.test(method) && !(q.objective_ids ?? []).includes(SINE_COSINE_OBJECTIVE)) {
    flags.push({
      level: 'warn',
      text: `Under-tagged: uses the sine/cosine rule but declares ${(q.objective_ids ?? []).join(', ')} — ${SINE_COSINE_OBJECTIVE} reads as uncovered`,
    });
  }

  // Same exemptions the validator applies: a cloze statement labels its gaps by
  // position in the prose, and a completable table prints each gap with the key
  // of the slot that fills it. Without them this flagged nine table questions
  // the schema is perfectly happy with — the drift this file exists to end.
  const namedByFigure = slotRefsNamedByVisual(q.visual);
  for (const p of parts) {
    const marked = (p.slots ?? []).filter((s) => (s.response_mode ?? 'answer') === 'answer');
    if (p.statement || marked.length < 2) continue;
    if (
      marked.some(
        (s) =>
          isPositionalLabel(s.label) &&
          !(s.prompt ?? '').trim() &&
          !namedByFigure.has(`${p.label}.${s.label}`),
      )
    ) {
      flags.push({
        level: 'warn',
        text: `Part (${p.label}) has ${marked.length} answer boxes and does not say which is which`,
      });
    }
  }

  // A declared form that no row pays for. The validator rejects new ones; a few
  // approved questions predate it and need a mark authored for the form, which
  // moves what the question is worth and is therefore a human's call.
  //
  // Structured questions only, which here means "has a rubric": an MCQ is
  // marked by the option its answer_key names, so it has no rows to pay for a
  // form and a format on one of its slots is inert either way.
  for (const p of (q.rubric ?? []).length > 0 ? parts : []) {
    for (const s of p.slots ?? []) {
      if ((s.response_mode ?? 'answer') !== 'answer' || !s.answer_format) continue;
      const ref = `${p.label}.${s.label}`;
      if ((q.rubric ?? []).some((r) => r.slot_ref === ref && r.for_format)) continue;
      flags.push({
        level: 'warn',
        text: `(${p.label}) asks for a form (${s.answer_format}) that no rubric row marks — give it a mark or drop the demand`,
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
