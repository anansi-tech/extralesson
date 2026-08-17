import { describe, expect, it } from 'vitest';
import { isNaturalPair, naturalPartners, NATURAL_PAIRS, MULTI_TOPIC_SHARE } from '@/lib/targets/pairings';

// The paper-shaped recipe required two or three topics on EVERY question. The
// papers pair topics in about one question in eight, and only in combinations
// that flow through one context. Forcing it everywhere produced stapling: a
// circle-theorem question whose last part asked for a position vector built
// from the two earlier answers.
describe('topic pairings are derived, not invented', () => {
  it('carries only pairs the corpus was seen to make', () => {
    for (const { pair, seen } of NATURAL_PAIRS) {
      expect(seen, `${pair.join(' + ')} must record how often it was seen`).toBeGreaterThanOrEqual(2);
      expect(pair[0].slice(0, 2), `${pair.join(' + ')} must be within one module`).toBe(pair[1].slice(0, 2));
    }
  });

  it('pairs no Module 3 topics, because the corpus pairs none', () => {
    // This is where the stapled vector parts came from: geometry-with-vectors
    // and statistics-with-vectors are combinations the papers never make.
    const m3 = NATURAL_PAIRS.filter(({ pair }) => pair[0].startsWith('M3'));
    expect(m3).toEqual([]);
  });

  it('is symmetric: a pairing does not depend on which topic was chosen first', () => {
    for (const { pair } of NATURAL_PAIRS) {
      expect(isNaturalPair(pair[0], pair[1])).toBe(true);
      expect(isNaturalPair(pair[1], pair[0])).toBe(true);
      expect(naturalPartners(pair[0])).toContain(pair[1]);
      expect(naturalPartners(pair[1])).toContain(pair[0]);
    }
  });

  it('refuses the combinations that produced the stapled parts', () => {
    expect(isNaturalPair('M3-GEO2', 'M3-VM2')).toBe(false);
    expect(isNaturalPair('M3-STAT2', 'M3-VM2')).toBe(false);
    expect(naturalPartners('M3-VM2')).toEqual([]);
  });

  it('keeps multi-topic a minority, as measured', () => {
    expect(MULTI_TOPIC_SHARE).toBeGreaterThan(0);
    expect(MULTI_TOPIC_SHARE).toBeLessThan(0.25);
  });
});
