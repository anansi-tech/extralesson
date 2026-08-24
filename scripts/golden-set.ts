import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * THE GOLDEN SET, LOADED ONCE, WITH THE SPLIT ENFORCED HERE.
 *
 * Two files, and they are complementary rather than overlapping:
 *
 *   set.json     INPUTS. Which question, who wrote it, whether it was
 *                photographed, and the working itself. Everything the marker is
 *                allowed to see.
 *
 *   review.json  VERDICTS. David's decision per rubric row, the typed answers
 *                he judged against, and a one-line description of the case.
 *                Carries an approval header — version, reviewer, timestamp —
 *                and is the ground truth. Nothing here is ever shown to the
 *                marker except the student answers, which are input to the
 *                judgment rather than part of it.
 *
 * review.json holds no working at all, so it cannot stand alone; set.json holds
 * no verdicts, so neither can it. The one field that DID appear in both was an
 * empty `marks` on every set.json entry, left from the format before the review
 * existed — removed, because two files describing the same fact is how they
 * drift apart.
 *
 * Every id must appear in both. A working with no verdict is unscored and a
 * verdict with no working is unscoreable, and either one silently shrinks the
 * set the gate is measured on.
 */
const DIR = join(process.cwd(), 'design', 'golden');

export interface GoldenInput {
  id: string;
  question_id: string;
  writer: string;
  mode: 'photo' | 'typed';
  image?: string;
  transcript: { part_label: string | null; text: string }[];
  /** The typed answers the working was judged against. Input, not verdict. */
  studentAnswers: Record<string, string>;
  case: string;
}

export interface GoldenVerdict {
  id: string;
  marks: { code: string; awarded: boolean; reason?: string }[];
}

export interface GoldenSet {
  inputs: GoldenInput[];
  verdicts: Map<string, GoldenVerdict['marks']>;
  approval: { reviewer?: string; reviewed_at?: string; status?: string };
}

export function goldenSetExists(): boolean {
  return existsSync(join(DIR, 'set.json')) && existsSync(join(DIR, 'review.json'));
}

export function loadGoldenSet(): GoldenSet {
  const set = JSON.parse(readFileSync(join(DIR, 'set.json'), 'utf8')) as Omit<
    GoldenInput,
    'studentAnswers' | 'case'
  >[];
  const review = JSON.parse(readFileSync(join(DIR, 'review.json'), 'utf8')) as {
    status?: string;
    reviewer?: string;
    reviewed_at?: string;
    entries: (GoldenVerdict & { student_answers?: Record<string, string>; case?: string })[];
  };

  const byId = new Map(review.entries.map((e) => [e.id, e]));
  const orphanInputs = set.filter((e) => !byId.has(e.id)).map((e) => e.id);
  const orphanVerdicts = review.entries.filter((e) => !set.some((s) => s.id === e.id)).map((e) => e.id);
  if (orphanInputs.length || orphanVerdicts.length) {
    throw new Error(
      'golden set is not paired 1:1 — ' +
        (orphanInputs.length ? `working with no verdict: ${orphanInputs.join(', ')}. ` : '') +
        (orphanVerdicts.length ? `verdict with no working: ${orphanVerdicts.join(', ')}.` : ''),
    );
  }
  if (review.status !== 'approved') {
    throw new Error(`review.json is "${review.status}", not approved — the gate reads approved ground truth only.`);
  }

  return {
    inputs: set.map((e) => ({
      ...e,
      studentAnswers: byId.get(e.id)!.student_answers ?? {},
      case: byId.get(e.id)!.case ?? '',
    })),
    verdicts: new Map(review.entries.map((e) => [e.id, e.marks])),
    approval: { reviewer: review.reviewer, reviewed_at: review.reviewed_at, status: review.status },
  };
}
