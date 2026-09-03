import { largestDeficit } from '@/lib/targets/matrix';
import type { ContextCategory } from '@/lib/types';
import TARGETS from './context-targets.json';

/**
 * Measured PER TOPIC: a bank-wide figure split down would staple compound
 * interest onto Statistics. A topic whose sample is too thin gets NO TARGET —
 * near-zero is the finding that the papers set it bare, not missing data.
 */
export const MIN_SAMPLE = 12;
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
  // No steer where the corpus had nothing to say: silence is the measurement,
  // not a gap in it.
  if (target.source === 'bank-wide fallback' || target.sample < MIN_SAMPLE) return null;
  const shares = target.shares as Record<string, number>;
  if (Object.keys(shares).length === 0) return null;
  return largestDeficit(shares, actual as Record<string, number>) as ContextCategory;
}
