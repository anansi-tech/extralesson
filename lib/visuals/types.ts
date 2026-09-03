import type { z } from 'zod';
import type { TemplateName } from '@/lib/types';

// ROUND_1_5 §3 — parametric visual templates: pure, deterministic, no external
// assets. Params are Zod-validated and numerically cross-checked before any
// question carrying them can reach the solve pass.

// Never the answers of the part being asked — givens only.
export interface VerifyContext {
  stimulus?: string;
  stem: string;
  partPrompts: string[];
  /**
   * Every slot the question has, as 'part.slot'. A completable table cell
   * pointing anywhere else asks for an answer nothing marks (R1.8 Part 3).
   */
  slotRefs?: string[];
}

export interface VisualTemplate<P = unknown> {
  name: TemplateName;
  /**
   * True when the template decides where its points go. Such a figure can never
   * show a position the question states: the two are authored separately and
   * will disagree. Surfaced in the draft contract so the model is told.
   */
  placesOwnPoints?: boolean;
  /**
   * Cross-field invariants enforced by verify(), written for the draft prompt.
   * Kept beside verify() so the two cannot drift: a model never told a rule
   * cannot comply with it, and each such rejection costs a generation trip.
   */
  rules?: string[];
  // Input type is unknown: Zod defaults mean the accepted input is looser
  // than the parsed output P.
  paramsSchema: z.ZodType<P, z.ZodTypeDef, unknown>;
  /**
   * SVG string (semantic HTML for dataTable). Black-line exam aesthetic. The
   * context is for templates whose geometry is REFERENCED from the question
   * rather than restated in params; templates holding their own data ignore it.
   */
  render(params: P, context?: VerifyContext): string;
  /** TEXT rendering of the visual for the independent solve pass (§5). */
  describe(params: P, context?: VerifyContext): string;
  /**
   * Numeric cross-checks (ROUND_1_5 §3 integrity rule). Returns human-readable
   * issues; an empty array is a pass.
   */
  verify(params: P, context: VerifyContext): string[];
}

export function numbersInText(context: VerifyContext): number[] {
  const text = [context.stimulus ?? '', context.stem, ...context.partPrompts].join(' ');
  return (text.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
}

// True when `value` appears in the question text (exact within tolerance).
export function valueStatedInText(value: number, context: VerifyContext): boolean {
  return numbersInText(context).some((n) => Math.abs(n - value) < 1e-9);
}

// Findings ending in this exact phrase are ADVISORY, not failures: an exam
// diagram legitimately carries givens the prose never repeats, and requiring
// every visual value to appear in the text rejects correct questions. The other
// direction — a stated value contradicted by the visual — is caught by the
// independent solve pass. Intrinsic numeric checks remain hard fails.
export const TEXT_CROSSCHECK_PHRASE = 'never appears in the question text';

export function isTextCrossCheckIssue(issue: string): boolean {
  return issue.includes(TEXT_CROSSCHECK_PHRASE);
}
