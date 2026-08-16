import type { z } from 'zod';
import type { TemplateName } from '@/lib/types';

// R1.5 §3 — parametric visual templates. Pure (params) => string renderers,
// deterministic, no external assets. The model emits {template, params};
// params are Zod-validated and numerically cross-checked before any question
// carrying them can reach the solve pass.

// Question text a verifier may cross-check against (never the answers of the
// part being asked — givens only).
export interface VerifyContext {
  stimulus?: string;
  stem: string;
  partPrompts: string[];
  /**
   * Every slot the question has, as 'part.slot'. A completable table cell
   * points at one of these, and a cell pointing anywhere else asks for an
   * answer nothing marks (R1.8 Part 3).
   */
  slotRefs?: string[];
}

export interface VisualTemplate<P = unknown> {
  name: TemplateName;
  /**
   * True when the template decides where its points go — triangleLabeled puts
   * labels[0] at the apex, circleCenter spaces points by bearing. Such a figure
   * can show angles, lengths and relationships, and can never show a position
   * the question states: the two are authored separately and will disagree.
   * Surfaced in the draft contract so the model is told, not merely caught.
   */
  placesOwnPoints?: boolean;
  /**
   * Cross-field invariants enforced by verify(), written for the draft
   * prompt. Kept beside verify() so the two cannot drift: a model that is
   * never told a rule cannot comply with it, and every such rejection costs
   * a full generation round-trip.
   */
  rules?: string[];
  // Input type is unknown: Zod defaults mean the accepted input is looser
  // than the parsed output P.
  paramsSchema: z.ZodType<P, z.ZodTypeDef, unknown>;
  /**
   * SVG string (semantic HTML for dataTable). Black-line exam aesthetic.
   *
   * The context carries the question a figure belongs to, for templates whose
   * geometry is REFERENCED from it rather than restated in params. Templates
   * that hold all their own data ignore it.
   */
  render(params: P, context?: VerifyContext): string;
  /** TEXT rendering of the visual for the independent solve pass (§5). */
  describe(params: P, context?: VerifyContext): string;
  /**
   * Numeric cross-checks (§3 integrity rule): intrinsic consistency (angle
   * sums, monotonic cumulative data, ...) plus given-value/text agreement.
   * Returns human-readable issues; empty array = pass.
   */
  verify(params: P, context: VerifyContext): string[];
}

// Extract the numbers present in question text, for given-value cross-checks.
export function numbersInText(context: VerifyContext): number[] {
  const text = [context.stimulus ?? '', context.stem, ...context.partPrompts].join(' ');
  return (text.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
}

// True when `value` appears in the question text (exact within tolerance).
export function valueStatedInText(value: number, context: VerifyContext): boolean {
  return numbersInText(context).some((n) => Math.abs(n - value) < 1e-9);
}

// Templates end text cross-check findings with this exact phrase so the gate
// can classify them (see verifyQuestionVisual).
//
// These are ADVISORY, not failures. An exam diagram legitimately carries
// givens the prose never repeats — "the diagram shows a carton" with the
// dimensions labelled on the figure is the CSEC norm, and requiring every
// visual value to also appear in the text rejects correct questions. The
// spec's integrity rule runs the other way (a value stated in the stem must
// not be contradicted by the visual); that direction is covered by the
// independent solve pass, which sees the stem AND the visual as text and
// disagrees when they conflict. Intrinsic numeric checks — angle sums,
// monotonic cumulative data, transformation consistency — remain hard fails.
export const TEXT_CROSSCHECK_PHRASE = 'never appears in the question text';

export function isTextCrossCheckIssue(issue: string): boolean {
  return issue.includes(TEXT_CROSSCHECK_PHRASE);
}
