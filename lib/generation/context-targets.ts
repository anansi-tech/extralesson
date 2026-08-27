import { largestDeficit } from '@/lib/targets/matrix';
import type { ContextCategory } from '@/lib/types';
import TARGETS from './context-targets.json';

/**
 * WHAT SETTING A TOPIC'S QUESTIONS SHOULD BE IN, measured per topic.
 *
 * Our bank ran banking at 1% against the papers' 29%, and wages at 1% against
 * 10%, because nothing pulled toward them: contexts.ts only said "avoid what
 * this topic just used", which spreads evenly rather than the way the papers
 * do.
 *
 * TARGETS ARE PER TOPIC, NOT SPLIT FROM A GLOBAL FIGURE, and the measurement
 * says why. Sliced from the reference corpus by
 * scripts/calibration/topic-contexts.py:
 *
 *   M1-CONS   banking 47%, retail 22%, wages 15%   (229 markers)
 *   M1-MEAS   transport 52%, tourism 14%           (29)
 *   M2-STAT1  sport 39%, manufacturing 23%, agriculture 19%, no banking (31)
 *
 * A bank-wide banking target would have pushed compound interest onto
 * Statistics, where the papers use match scores and production runs — the R1.8
 * stapling failure wearing a new costume.
 *
 * A topic whose corpus sample is too thin to give a distribution carries the
 * bank-wide figure, and the JSON records `source: "bank-wide fallback"` so the
 * data says which it is rather than leaving the reader to guess.
 */
export interface ContextTarget {
  source: 'own sample' | 'bank-wide fallback';
  sample: number;
  shares: Partial<Record<ContextCategory, number>>;
}

export const CONTEXT_TARGETS = TARGETS as Record<string, ContextTarget>;

export function targetFor(topicCode: string): ContextTarget | null {
  return CONTEXT_TARGETS[topicCode] ?? null;
}

/**
 * The setting this topic is furthest short of, or null when there is no target
 * to consume. Reuses largestDeficit — the same comparison the topic and matrix
 * searches already make, so a share here means what a share means there.
 */
export function neediestContext(
  topicCode: string,
  actual: Partial<Record<ContextCategory, number>>,
): ContextCategory | null {
  const target = targetFor(topicCode);
  if (!target) return null;
  const shares = target.shares as Record<string, number>;
  if (Object.keys(shares).length === 0) return null;
  return largestDeficit(shares, actual as Record<string, number>) as ContextCategory;
}
