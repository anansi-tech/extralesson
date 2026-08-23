import { z } from 'zod';
import { markStructuredParts } from './mark';
import { earnableByMethod, type MethodMarkQuestion } from './method-marks';
import type { RubricItem } from '@/lib/types';

const GoldenTranscriptLineZ = z.object({
  part_label: z.string().max(4).nullable(),
  slot_label: z.string().max(30).nullable().optional(),
  text: z.string().min(1).max(400),
});

export const GoldenEntryZ = z.object({
  id: z.string().min(1),
  question_id: z.string().regex(/^[a-f0-9]{24}$/),
  writer: z.string().min(1),
  mode: z.enum(['photo', 'typed']),
  image: z.string().min(1).optional(),
  transcript: z.array(GoldenTranscriptLineZ).max(80),
  // Kept readable while the reference decisions live separately. Old drafts
  // placed labels here; accepting the empty array makes that migration honest.
  marks: z.array(z.never()).max(0).optional(),
}).superRefine((entry, ctx) => {
  if (entry.mode === 'photo' && !entry.image) {
    ctx.addIssue({ code: 'custom', path: ['image'], message: 'photo entries require an image filename' });
  }
});

export const GoldenSetZ = z.array(GoldenEntryZ).min(1);

const ProposedMarkZ = z.object({
  code: z.string().min(1),
  awarded: z.boolean(),
  reason: z.string().min(1),
});

export const GoldenReferenceEntryZ = z.object({
  id: z.string().min(1),
  case: z.string().min(1),
  student_answers: z.record(z.string(), z.string()),
  marks: z.array(ProposedMarkZ),
  human_note: z.string().optional(),
});

export const GoldenReferenceZ = z.object({
  version: z.literal(1),
  status: z.enum(['proposed', 'approved']),
  reviewer: z.string().min(1).nullable(),
  reviewed_at: z.string().datetime().nullable(),
  entries: z.array(GoldenReferenceEntryZ).min(1),
}).superRefine((reference, ctx) => {
  if (reference.status === 'approved' && (!reference.reviewer || !reference.reviewed_at)) {
    ctx.addIssue({
      code: 'custom',
      path: ['status'],
      message: 'an approved reference requires reviewer and reviewed_at',
    });
  }
});

export type GoldenEntry = z.infer<typeof GoldenEntryZ>;
export type GoldenReference = z.infer<typeof GoldenReferenceZ>;
export type GoldenReferenceEntry = z.infer<typeof GoldenReferenceEntryZ>;

export interface GoldenQuestion extends MethodMarkQuestion {
  parts?: {
    label: string;
    slots: {
      label: string;
      answer: string;
      accept?: string[];
      answer_format?: string;
      response_mode?: string;
    }[];
  }[];
  rubric?: RubricItem[];
}

/**
 * Replays the free deterministic pass before deciding what the method marker
 * would ever see. The golden set must model the separately typed answers: a
 * transcript alone cannot tell us which rows were already settled for free.
 */
export function methodCandidates(
  question: GoldenQuestion,
  studentAnswers: Record<string, string>,
): { deterministicallyAwarded: string[]; candidates: RubricItem[] } {
  const inputs = Object.entries(studentAnswers).map(([ref, answer]) => ({ ref, answer, working: '' }));
  const deterministic = markStructuredParts(question.rubric ?? [], question.parts ?? [], inputs);
  return {
    deterministicallyAwarded: deterministic.rubric_awarded,
    candidates: earnableByMethod(question, deterministic.rubric_awarded),
  };
}

export function normaliseGoldenLine(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').replace(/[$\\]/g, '').trim();
}

function lineKey(line: { part_label: string | null; slot_label?: string | null; text: string }): string {
  return `${line.part_label ?? '-'}|${line.slot_label ?? '-'}|${normaliseGoldenLine(line.text)}`;
}

export interface ReadingScore {
  expected: number;
  returned: number;
  matched: number;
  missed: number;
  extra: number;
  precision: number;
  recall: number;
  f1: number;
  returnedLines: { key: string; confidence: number; matched: boolean }[];
}

/**
 * Multiset comparison: omitted truth lines count as misses and invented lines
 * count as extras. The old evaluator inspected only returned lines, so a reader
 * could omit most of a page and still report 100% accuracy.
 */
export function scoreReading(
  truth: { part_label: string | null; slot_label?: string | null; text: string }[],
  returned: { part_label: string | null; slot_label?: string | null; text: string; confidence: number }[],
): ReadingScore {
  const remaining = new Map<string, number>();
  for (const line of truth) {
    const key = lineKey(line);
    remaining.set(key, (remaining.get(key) ?? 0) + 1);
  }

  let matched = 0;
  const returnedLines = returned.map((line) => {
    const key = lineKey(line);
    const available = remaining.get(key) ?? 0;
    const hit = available > 0;
    if (hit) {
      matched++;
      remaining.set(key, available - 1);
    }
    return { key, confidence: line.confidence, matched: hit };
  });

  const expected = truth.length;
  const returnedCount = returned.length;
  const precision = returnedCount === 0 ? (expected === 0 ? 1 : 0) : matched / returnedCount;
  const recall = expected === 0 ? (returnedCount === 0 ? 1 : 0) : matched / expected;
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
  return {
    expected,
    returned: returnedCount,
    matched,
    missed: expected - matched,
    extra: returnedCount - matched,
    precision,
    recall,
    f1,
    returnedLines,
  };
}
